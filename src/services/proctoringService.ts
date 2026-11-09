import { ProctoringConfig, ProctoringEvent, ProctoringMode } from '../types';

/**
 * Shared Proctoring & Session Synchronization Service
 * Quản lý trạng thái giám sát, phát hiện vi phạm, khóa bài thi, mở khóa từ xa và xác thực mã PIN.
 * Đảm bảo dữ liệu đồng bộ giữa màn hình Học sinh làm bài và Giáo viên giám sát.
 */

export interface ActiveExamSession {
  examId: string;
  studentId: string;
  studentName: string;
  className: string;
  startTime: number;
  durationMinutes: number;
  answers: Record<string, any>;
  violationsCount: number;
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: string;
  lastHeartbeat: number;
  isOnline: boolean;
  events: ProctoringEvent[];
  unlockHistory: { unlockedAt: string; unlockedBy: string; method: 'pin' | 'remote' }[];
}

const STORAGE_KEY_SESSIONS = 'edutest_proctoring_sessions_v2';
const STORAGE_KEY_CONFIGS = 'edutest_proctoring_configs_v2';
const CHANNEL_NAME = 'edutest_proctoring_channel';

class ProctoringService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: { type: string; payload: any }) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (e) => {
          this.notifyListeners(e.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or restricted, falling back to storage events');
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY_SESSIONS && e.newValue) {
          this.notifyListeners({ type: 'SESSIONS_UPDATED', payload: null });
        }
      });
    }
  }

  public subscribe(cb: (event: { type: string; payload: any }) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(data: { type: string; payload: any }) {
    this.listeners.forEach((l) => {
      try {
        l(data);
      } catch (err) {
        console.error('Error in proctoring listener', err);
      }
    });
  }

  private broadcast(type: string, payload: any) {
    const message = { type, payload };
    if (this.channel) {
      this.channel.postMessage(message);
    }
    this.notifyListeners(message);
  }

  // =========================================================================
  // Config Management
  // =========================================================================

  public saveExamConfig(examId: string, config: ProctoringConfig) {
    try {
      const all = this.getAllConfigs();
      all[examId] = config;
      localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(all));
      this.broadcast('CONFIG_UPDATED', { examId, config });
    } catch (e) {
      console.error('Failed to save proctoring config', e);
    }
  }

  public getExamConfig(examId: string): ProctoringConfig {
    const all = this.getAllConfigs();
    if (all[examId]) return all[examId];

    // Default configuration: Strict Lock with threshold 2
    return {
      mode: 'strict_lock',
      lockThreshold: 2,
      unlockPin: '689254',
      continueTimerOnLock: true,
      detectTabSwitch: true,
      detectFullscreenExit: true,
      detectFocusLoss: true,
    };
  }

  private getAllConfigs(): Record<string, ProctoringConfig> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIGS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // =========================================================================
  // Session Management (Student in-exam progress & lock state)
  // =========================================================================

  public getSessionKey(examId: string, studentId: string): string {
    return `${examId}_${studentId}`;
  }

  private getAllSessions(): Record<string, ActiveExamSession> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveAllSessions(sessions: Record<string, ActiveExamSession>) {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to storage', e);
    }
  }

  public getSession(examId: string, studentId: string): ActiveExamSession | null {
    const all = this.getAllSessions();
    const key = this.getSessionKey(examId, studentId);
    return all[key] || null;
  }

  public getSessionsForExam(examId: string): ActiveExamSession[] {
    const all = this.getAllSessions();
    return Object.values(all).filter((s) => s.examId === examId);
  }

  public initOrResumeSession(
    examId: string,
    studentId: string,
    studentName: string,
    className: string,
    durationMinutes: number
  ): ActiveExamSession {
    const all = this.getAllSessions();
    const key = this.getSessionKey(examId, studentId);

    if (all[key]) {
      // Resume existing session
      all[key].lastHeartbeat = Date.now();
      all[key].isOnline = true;
      this.saveAllSessions(all);
      return all[key];
    }

    const newSession: ActiveExamSession = {
      examId,
      studentId,
      studentName,
      className,
      startTime: Date.now(),
      durationMinutes,
      answers: {},
      violationsCount: 0,
      isLocked: false,
      lastHeartbeat: Date.now(),
      isOnline: true,
      events: [
        {
          id: `evt-${Date.now()}-init`,
          examId,
          studentId,
          studentName,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          eventType: 'network_reconnect',
          isViolation: false,
          description: 'Học sinh bắt đầu phiên làm bài thi chính thức',
          severity: 'info',
        },
      ],
      unlockHistory: [],
    };

    all[key] = newSession;
    this.saveAllSessions(all);
    this.broadcast('SESSION_STARTED', newSession);
    return newSession;
  }

  public saveAnswers(examId: string, studentId: string, answers: Record<string, any>) {
    const all = this.getAllSessions();
    const key = this.getSessionKey(examId, studentId);
    if (!all[key]) return;

    all[key].answers = { ...all[key].answers, ...answers };
    all[key].lastHeartbeat = Date.now();
    this.saveAllSessions(all);
    this.broadcast('ANSWERS_SAVED', { examId, studentId });
  }

  /**
   * Records a proctoring event (Violation or Technical event)
   */
  public recordEvent(
    examId: string,
    studentId: string,
    studentName: string,
    eventType: ProctoringEvent['eventType'],
    description: string,
    isViolation: boolean,
    severity: 'info' | 'warning' | 'danger' = 'warning',
    performedBy?: string
  ): { session: ActiveExamSession; shouldLock: boolean } {
    const all = this.getAllSessions();
    const key = this.getSessionKey(examId, studentId);
    let session = all[key];

    if (!session) {
      session = this.initOrResumeSession(examId, studentId, studentName, '12A1', 45);
    }

    const newEvent: ProctoringEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      examId,
      studentId,
      studentName,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      eventType,
      isViolation,
      description,
      severity,
      performedBy,
    };

    session.events.unshift(newEvent);
    session.lastHeartbeat = Date.now();

    const config = this.getExamConfig(examId);
    let shouldLock = false;

    if (isViolation) {
      session.violationsCount += 1;

      // Mode 1: Strict Lock if violations >= threshold
      if (config.mode === 'strict_lock' && session.violationsCount >= config.lockThreshold && !session.isLocked) {
        session.isLocked = true;
        session.lockReason = `Vi phạm quy chế thi ${session.violationsCount}/${config.lockThreshold} lần: ${description}`;
        session.lockedAt = new Date().toLocaleTimeString('vi-VN');
        shouldLock = true;

        session.events.unshift({
          id: `evt-lock-${Date.now()}`,
          examId,
          studentId,
          studentName,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          eventType: 'exam_locked',
          isViolation: true,
          description: `Hệ thống tự động KHÓA BÀI THI do vượt ngưỡng vi phạm (${session.violationsCount}/${config.lockThreshold} lần)`,
          severity: 'danger',
          performedBy: 'Hệ thống chống gian lận',
        });
      }
    }

    all[key] = session;
    this.saveAllSessions(all);
    this.broadcast('EVENT_RECORDED', { examId, studentId, event: newEvent, isLocked: session.isLocked });

    return { session, shouldLock };
  }

  /**
   * Unlock student's exam (Remote by teacher or via PIN)
   */
  public unlockSession(
    examId: string,
    studentId: string,
    method: 'pin' | 'remote',
    performedBy: string
  ): boolean {
    const all = this.getAllSessions();
    const key = this.getSessionKey(examId, studentId);
    const session = all[key];
    if (!session) return false;

    session.isLocked = false;
    session.lockReason = undefined;
    session.lockedAt = undefined;
    const nowTime = new Date().toLocaleTimeString('vi-VN');

    session.unlockHistory.push({
      unlockedAt: nowTime,
      unlockedBy: performedBy,
      method,
    });

    session.events.unshift({
      id: `evt-unlock-${Date.now()}`,
      examId,
      studentId,
      studentName: session.studentName,
      timestamp: nowTime,
      eventType: method === 'pin' ? 'exam_unlocked_pin' : 'exam_unlocked_remote',
      isViolation: false,
      description: `Bài thi đã được MỞ KHÓA thành công bởi ${performedBy} (${method === 'pin' ? 'Xác thực PIN giáo viên' : 'Mở khóa từ xa'})`,
      severity: 'info',
      performedBy,
    });

    all[key] = session;
    this.saveAllSessions(all);
    this.broadcast('SESSION_UNLOCKED', { examId, studentId, method, performedBy });
    return true;
  }

  /**
   * Validate teacher unlock PIN
   */
  public verifyPin(examId: string, inputPin: string): boolean {
    const config = this.getExamConfig(examId);
    if (!config.unlockPin) return false;
    return inputPin.trim() === config.unlockPin.trim();
  }

  /**
   * Check if exam has already started by any student (cannot silently change mode)
   */
  public hasExamStarted(examId: string): boolean {
    const sessions = this.getSessionsForExam(examId);
    return sessions.length > 0;
  }

  /**
   * Update heartbeat and connection status
   */
  public heartbeat(examId: string, studentId: string, isOnline: boolean = true) {
    const all = this.getAllSessions();
    const key = this.getSessionKey(examId, studentId);
    if (all[key]) {
      all[key].lastHeartbeat = Date.now();
      all[key].isOnline = isOnline;
      this.saveAllSessions(all);
    }
  }

  /**
   * Clear session on exam completion
   */
  public completeSession(examId: string, studentId: string) {
    const all = this.getAllSessions();
    const key = this.getSessionKey(examId, studentId);
    if (all[key]) {
      delete all[key];
      this.saveAllSessions(all);
      this.broadcast('SESSION_COMPLETED', { examId, studentId });
    }
  }
}

export const proctoringService = new ProctoringService();
