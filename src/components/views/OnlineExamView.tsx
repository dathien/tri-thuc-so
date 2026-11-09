import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Award,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Info,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Exam, Question, ExamSubmission, UserProfile, ProctoringConfig, ProctoringEvent } from '../../types';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';
import { proctoringService, ActiveExamSession } from '../../services/proctoringService';

interface OnlineExamViewProps {
  currentUser: UserProfile;
  exams: Exam[];
  questions: Question[];
  onSubmitExam: (submission: Omit<ExamSubmission, 'id'>) => void;
}

export const OnlineExamView: React.FC<OnlineExamViewProps> = ({
  currentUser,
  exams,
  questions,
  onSubmitExam,
}) => {
  const publishedExams = exams.filter((e) => e.status === 'published');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isPreExamModalOpen, setIsPreExamModalOpen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [tabViolations, setTabViolations] = useState(0);

  // Proctoring states
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>('');
  const [teacherPinInput, setTeacherPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showViolationBanner, setShowViolationBanner] = useState(false);
  const [violationBannerMsg, setViolationBannerMsg] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unlockSuccessMsg, setUnlockSuccessMsg] = useState(false);

  // Submission & Confirmation
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examCompleted, setExamCompleted] = useState<ExamSubmission | null>(null);

  const timerRef = useRef<number | null>(null);

  // Resolve proctoring config for the active exam
  const proctoringConfig = useMemo<ProctoringConfig>(() => {
    if (!selectedExam) {
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
    return (
      selectedExam.proctoringConfig ||
      proctoringService.getExamConfig(selectedExam.id) || {
        mode: selectedExam.proctoringMode || 'strict_lock',
        lockThreshold: 2,
        unlockPin: '689254',
        continueTimerOnLock: true,
        detectTabSwitch: true,
        detectFullscreenExit: true,
        detectFocusLoss: true,
      }
    );
  }, [selectedExam]);

  const examQuestions = useMemo(() => {
    return selectedExam ? questions.filter((q) => selectedExam.questionIds.includes(q.id)) : [];
  }, [selectedExam, questions]);

  // Subscribe to proctoring service (Remote Unlock & State Updates)
  useEffect(() => {
    if (!selectedExam || !examStarted) return;

    const unsubscribe = proctoringService.subscribe((msg) => {
      if (
        (msg.type === 'SESSION_UNLOCKED' || msg.type === 'SESSIONS_UPDATED') &&
        msg.payload?.examId === selectedExam.id &&
        msg.payload?.studentId === currentUser.id
      ) {
        setIsLocked(false);
        setLockReason('');
        setTeacherPinInput('');
        setPinError('');
        setUnlockSuccessMsg(true);
        soundService.playSuccess();
        setTimeout(() => setUnlockSuccessMsg(false), 4000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedExam, examStarted, currentUser.id]);

  // Listen to network status (Technical events only - not violations)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (selectedExam && examStarted) {
        proctoringService.recordEvent(
          selectedExam.id,
          currentUser.id,
          currentUser.name,
          'network_reconnect',
          'Kết nối mạng đã được khôi phục ổn định',
          false,
          'info'
        );
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (selectedExam && examStarted) {
        // Technical event only, NOT a cheating violation!
        proctoringService.recordEvent(
          selectedExam.id,
          currentUser.id,
          currentUser.name,
          'network_disconnect',
          'Sự cố kỹ thuật: Kết nối mạng bị gián đoạn tạm thời (Không tính là vi phạm gian lận)',
          false,
          'info'
        );
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedExam, examStarted, currentUser]);

  // Countdown Timer (Continues even when locked according to server-time rule)
  useEffect(() => {
    if (!examStarted || timeLeftSeconds <= 0) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          doSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, timeLeftSeconds]);

  // Request & Track Fullscreen
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch {
      // Ignored if blocked by browser
    }
  };

  // Trigger violation handler
  const handleTriggerViolation = (eventType: ProctoringEvent['eventType'], desc: string) => {
    if (!examStarted || !selectedExam || isLocked) return;

    soundService.playWarning();
    const { session, shouldLock } = proctoringService.recordEvent(
      selectedExam.id,
      currentUser.id,
      currentUser.name,
      eventType,
      desc,
      true,
      'warning'
    );

    setTabViolations(session.violationsCount);

    if (proctoringConfig.mode === 'strict_lock') {
      if (shouldLock || session.isLocked) {
        setIsLocked(true);
        setLockReason(session.lockReason || desc);
      } else {
        setViolationBannerMsg(
          `CẢNH BÁO VI PHẠM: Bạn vừa rời màn hình làm bài (${session.violationsCount}/${proctoringConfig.lockThreshold} lần). Nếu đạt ${proctoringConfig.lockThreshold} lần, bài thi sẽ tự động BỊ KHÓA!`
        );
        setShowViolationBanner(true);
      }
    } else {
      // Mode 2: Monitor Only
      setViolationBannerMsg(
        `CẢNH BÁO GIÁM SÁT: Phát hiện rời màn hình làm bài (Lần ${session.violationsCount}). Hành vi đã được ghi vào nhật ký khảo thí gửi giáo viên!`
      );
      setShowViolationBanner(true);
    }
  };

  // Tab switch & focus loss listeners
  useEffect(() => {
    if (!examStarted || !selectedExam?.proctoringEnabled || isLocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTriggerViolation('tab_switch', 'Phát hiện học sinh chuyển sang tab hoặc cửa sổ khác');
      }
    };

    const handleWindowBlur = () => {
      if (proctoringConfig.detectFocusLoss) {
        handleTriggerViolation('focus_loss', 'Phát hiện cửa sổ bài thi mất tiêu điểm (Focus Loss)');
      }
    };

    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs && proctoringConfig.detectFullscreenExit && examStarted) {
        handleTriggerViolation('fullscreen_exit', 'Phát hiện học sinh thoát khỏi chế độ toàn màn hình');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [examStarted, selectedExam, isLocked, proctoringConfig]);

  // Open Pre-Exam instruction modal
  const handleSelectExamForPrep = (exam: Exam) => {
    setSelectedExam(exam);
    setIsPreExamModalOpen(true);
    soundService.playClick();
  };

  // Start exam officially after agreement
  const handleConfirmStartExam = () => {
    if (!selectedExam) return;

    setIsPreExamModalOpen(false);
    setTimeLeftSeconds(selectedExam.durationMinutes * 60);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTabViolations(0);
    setIsLocked(false);
    setLockReason('');
    setExamStarted(true);
    setExamCompleted(null);

    // Initialize session in proctoring service
    proctoringService.initOrResumeSession(
      selectedExam.id,
      currentUser.id,
      currentUser.name,
      '12A1',
      selectedExam.durationMinutes
    );

    // Try requesting fullscreen
    toggleFullscreen();
    soundService.playSuccess();
  };

  // Select Option with instant auto-save
  const handleSelectOption = (questionId: string, optionLetter: string) => {
    if (isLocked) return;
    soundService.playClick();
    const updated = {
      ...answers,
      [questionId]: optionLetter,
    };
    setAnswers(updated);

    // Auto-save progress to guarantee zero loss
    if (selectedExam) {
      proctoringService.saveAnswers(selectedExam.id, currentUser.id, updated);
    }
  };

  // Unlock with Teacher PIN
  const handleVerifyTeacherPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    if (!teacherPinInput.trim()) {
      setPinError('Vui lòng nhập mã PIN mở khóa');
      return;
    }

    const isValid = proctoringService.verifyPin(selectedExam.id, teacherPinInput.trim());
    if (isValid) {
      proctoringService.unlockSession(
        selectedExam.id,
        currentUser.id,
        'pin',
        'Giáo viên phụ trách (Xác thực PIN)'
      );
      setIsLocked(false);
      setLockReason('');
      setTeacherPinInput('');
      setPinError('');
      setUnlockSuccessMsg(true);
      soundService.playSuccess();
      setTimeout(() => setUnlockSuccessMsg(false), 4000);
    } else {
      setPinError('Mã PIN không chính xác. Vui lòng liên hệ giáo viên giám sát phòng thi.');
      soundService.playWarning();
    }
  };

  const doSubmitExam = () => {
    if (!selectedExam) return;

    // Calculate score
    let correctCount = 0;
    examQuestions.forEach((q) => {
      const studentAns = answers[q.id];
      if (studentAns && String(studentAns).toUpperCase() === String(q.correctAnswer).toUpperCase()) {
        correctCount += 1;
      }
    });

    const calculatedScore =
      examQuestions.length > 0
        ? Number(((correctCount / examQuestions.length) * selectedExam.totalPoints).toFixed(2))
        : 0;

    const session = proctoringService.getSession(selectedExam.id, currentUser.id);

    const submissionData: Omit<ExamSubmission, 'id'> = {
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      studentId: currentUser.id,
      studentName: currentUser.name,
      classId: currentUser.classId || 'class-12a1',
      className: '12A1',
      score: calculatedScore,
      maxScore: selectedExam.totalPoints,
      durationSpentMinutes:
        Math.round((selectedExam.durationMinutes * 60 - timeLeftSeconds) / 60) || 1,
      submittedAt: new Date().toLocaleString('vi-VN'),
      status: 'graded',
      tabViolationsCount: tabViolations,
      proctoringMode: proctoringConfig.mode,
      proctoringEvents: session?.events || [],
      unlockHistory: session?.unlockHistory || [],
      answers,
      feedback:
        calculatedScore >= 8
          ? 'Nắm rất vững kiến thức trọng tâm môn học!'
          : 'Cần ôn tập kỹ hơn các công thức và dạng toán tương tự.',
    };

    onSubmitExam(submissionData);
    setExamCompleted({
      ...submissionData,
      id: `sub-${Date.now()}`,
    });
    setExamStarted(false);
    setShowSubmitModal(false);
    setIsLocked(false);

    // Complete session in service
    proctoringService.completeSession(selectedExam.id, currentUser.id);

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    soundService.playSuccess();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = examQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  // =========================================================================
  // 1. Result screen after submitting
  // =========================================================================
  if (examCompleted) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Hoàn thành Bài kiểm tra!
          </h2>
          <p className="text-xs text-slate-500">{examCompleted.examTitle}</p>
        </div>

        {/* Score Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Kết quả bài làm của bạn
          </span>
          <div className="text-4xl sm:text-5xl font-black text-indigo-950 font-mono">
            {examCompleted.score} / {examCompleted.maxScore}
          </div>
          <p className="text-xs text-slate-600">{examCompleted.feedback}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-slate-400 block text-[10px]">Chế độ giám sát</span>
            <span className="font-bold text-slate-800">
              {examCompleted.proctoringMode === 'strict_lock' ? 'Chống gian lận & Khóa' : 'Chỉ chống gian lận'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-slate-400 block text-[10px]">Thời gian làm</span>
            <span className="font-bold text-slate-800 font-mono">
              {examCompleted.durationSpentMinutes} phút
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-slate-400 block text-[10px]">Số câu trả lời</span>
            <span className="font-bold text-slate-800 font-mono">
              {Object.keys(examCompleted.answers).length} / {examQuestions.length} câu
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-slate-400 block text-[10px]">Số lần rời màn hình</span>
            <span
              className={`font-bold font-mono ${
                examCompleted.tabViolationsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {examCompleted.tabViolationsCount} lần
            </span>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setExamCompleted(null);
              setSelectedExam(null);
              soundService.playClick();
            }}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Quay về danh sách đề kiểm tra
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. Active Exam Session View
  // =========================================================================
  if (examStarted && selectedExam) {
    return (
      <div className="relative space-y-4">
        {/* =================================================================== */}
        {/* FULLSCREEN LOCK OVERLAY (Strict Lock Mode - Triggered when locked) */}
        {/* =================================================================== */}
        {isLocked && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-rose-500 text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-300 animate-pulse">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-block mb-2">
                  CHẾ ĐỘ 1: CHỐNG GIAN LẬN &amp; KHÓA BÀI THI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  BÀI THI ĐÃ BỊ KHÓA
                </h2>
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  Đã vượt quá ngưỡng vi phạm cho phép ({tabViolations}/{proctoringConfig.lockThreshold} lần)
                </p>
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-slate-700 font-medium">
                  {lockReason || 'Học sinh chuyển tab hoặc thoát khỏi màn hình kiểm tra nhiều lần.'}
                </div>
              </div>

              {/* Server-time continuation countdown */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Thời gian máy chủ vẫn tiếp tục đếm:
                </span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  {formatTimer(timeLeftSeconds)}
                </span>
              </div>

              {/* Answers preserved notice */}
              <p className="text-[11px] text-slate-500">
                ✓ Toàn bộ {answeredCount} câu trả lời của bạn đã được hệ thống tự động lưu trữ an toàn.
              </p>

              {/* Teacher PIN Unlock Form */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <form onSubmit={handleVerifyTeacherPin} className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 block text-left">
                    Nhập mã PIN Giáo viên mở khóa tại chỗ:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Mã PIN 6 số..."
                      value={teacherPinInput}
                      onChange={(e) => setTeacherPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="flex-1 px-4 py-2 text-center text-sm font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Mở khóa
                    </button>
                  </div>
                  {pinError && (
                    <p className="text-[11px] text-rose-600 font-semibold text-left">{pinError}</p>
                  )}
                </form>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>
                    Hoặc chờ giáo viên <strong>Mở khóa từ xa</strong> từ màn hình Giám sát phòng thi
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Violation Toast/Banner for Mode 2 (or warnings in Mode 1) */}
        {showViolationBanner && !isLocked && (
          <div className="bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-lg border border-amber-600 flex items-center justify-between gap-3 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{violationBannerMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowViolationBanner(false)}
              className="p-1 rounded-lg hover:bg-amber-600 text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Remote Unlock Success Notification */}
        {unlockSuccessMsg && (
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Bài thi đã được giáo viên MỞ KHÓA thành công! Bạn có thể tiếp tục làm bài.</span>
          </div>
        )}

        {/* Top Session Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 sticky top-2 z-30">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {selectedExam.code}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  proctoringConfig.mode === 'strict_lock'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {proctoringConfig.mode === 'strict_lock'
                  ? `Chế độ 1: Khóa sau ${proctoringConfig.lockThreshold} lần vi phạm`
                  : 'Chế độ 2: Chỉ chống gian lận & Cảnh báo'}
              </span>
              {!isOnline && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Mất mạng tạm thời (Sự cố kỹ thuật)
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
              {selectedExam.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono font-bold text-sm">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            {/* Violations Counter */}
            {tabViolations > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Rời màn hình: {tabViolations} lần</span>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => {
                setShowSubmitModal(true);
                soundService.playClick();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Nộp bài ({answeredCount}/{examQuestions.length})
            </button>
          </div>
        </div>

        {/* Quick Testing Bar for Both Modes (Desktop & Mobile Verification) */}
        <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Thanh thử nghiệm kiểm thử Giám sát &amp; Khóa bài:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleTriggerViolation('tab_switch', 'Giả lập học sinh chuyển sang tab khác')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-amber-50 font-semibold text-slate-700 text-[11px]"
            >
              Thử Chuyển tab (+1 vi phạm)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerViolation('fullscreen_exit', 'Giả lập học sinh thoát toàn màn hình')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-amber-50 font-semibold text-slate-700 text-[11px]"
            >
              Thử Thoát Fullscreen
            </button>
            <button
              type="button"
              onClick={() => {
                proctoringService.recordEvent(
                  selectedExam.id,
                  currentUser.id,
                  currentUser.name,
                  'network_disconnect',
                  'Giả lập sự cố kỹ thuật mất kết nối mạng',
                  false,
                  'info'
                );
                soundService.playClick();
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-200 font-semibold text-slate-700 text-[11px]"
            >
              Thử Mất mạng (Sự cố kỹ thuật - Không tính vi phạm)
            </button>
          </div>
        </div>

        {/* Main Exam Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Question Area (8 cols) */}
          {currentQ && (
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Câu hỏi số {currentQuestionIndex + 1} / {examQuestions.length}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentQ.code} ({currentQ.points} điểm)
                </span>
              </div>

              {/* Question Content */}
              <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                <MathRenderer content={currentQ.content} />
              </div>

              {/* Options */}
              {currentQ.options && (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((optText, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isSelected = answers[currentQ.id] === letter;
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, letter)}
                        className={`w-full p-3.5 rounded-xl text-left border text-xs font-medium transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-2 ring-indigo-200'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="pt-0.5 flex-1">
                          <MathRenderer content={optText} inline />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Prev / Next Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                    soundService.playClick();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Câu trước
                </button>

                <button
                  type="button"
                  disabled={currentQuestionIndex === examQuestions.length - 1}
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => Math.min(examQuestions.length - 1, prev + 1));
                    soundService.playClick();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
                >
                  Câu tiếp theo
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Question Palette (4 cols) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Bảng câu hỏi ({answeredCount}/{examQuestions.length})
            </h3>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {examQuestions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      soundService.playClick();
                    }}
                    className={`h-9 rounded-xl font-bold font-mono text-xs transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white shadow-xs'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                <span>Chưa trả lời ({examQuestions.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-600" />
                <span>Đang chọn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận nộp bài thi?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bạn đã trả lời{' '}
                  <strong className="text-slate-900">
                    {answeredCount} / {examQuestions.length}
                  </strong>{' '}
                  câu hỏi. Thời gian còn lại: <strong>{formatTimer(timeLeftSeconds)}</strong>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  onClick={doSubmitExam}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Xác nhận nộp bài
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. Exams List with Pre-Exam Instruction & Modal
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Kiểm tra Trực tuyến &amp; Phòng thi Số
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100">
              {publishedExams.length} Đề đang mở
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Làm bài kiểm tra trắc nghiệm, hiển thị công thức chuẩn KaTeX, giám sát và chấm điểm tự động.
          </p>
        </div>
      </div>

      {/* Available Exams Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {publishedExams.map((exam) => {
          const cfg = exam.proctoringConfig || proctoringService.getExamConfig(exam.id);
          const isStrict = cfg.mode === 'strict_lock';

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {exam.code}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Khối {exam.grade} · HK{exam.semester}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isStrict
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {isStrict ? 'Chế độ 1: Khóa tự động' : 'Chế độ 2: Chỉ giám sát'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-2">{exam.title}</h3>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
                <div>
                  <span className="text-[10px] text-slate-400 block">Thời gian</span>
                  <span className="font-bold font-mono text-slate-800">{exam.durationMinutes} phút</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Số lượng câu</span>
                  <span className="font-bold font-mono text-slate-800">{exam.questionsCount} câu</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Thang điểm</span>
                  <span className="font-bold font-mono text-indigo-700">{exam.totalPoints} điểm</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {isStrict ? `Khóa bài nếu vi phạm ${cfg.lockThreshold} lần` : 'Ghi nhật ký vi phạm đầy đủ'}
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectExamForPrep(exam)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Vào phòng thi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pre-Exam Regulations & Instruction Modal */}
      {isPreExamModalOpen && selectedExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Quy định Giám sát Phòng thi</h3>
                  <p className="text-xs text-slate-500">{selectedExam.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreExamModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Banner */}
            <div
              className={`p-4 rounded-2xl border space-y-2 text-xs ${
                proctoringConfig.mode === 'strict_lock'
                  ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                  : 'bg-blue-50/70 border-blue-300 text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {proctoringConfig.mode === 'strict_lock' ? (
                  <>
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span>Chế độ 1: Chống gian lận và khóa bài thi (Nghiêm ngặt)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Chế độ 2: Chỉ chống gian lận &amp; Cảnh báo</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed">
                {proctoringConfig.mode === 'strict_lock'
                  ? `Bài thi sẽ tự động KHÓA nếu phát hiện học sinh chuyển tab, mất tiêu điểm hoặc thoát toàn màn hình đạt ngưỡng ${proctoringConfig.lockThreshold} lần. Khi bị khóa, chỉ giáo viên mới có thể mở khóa và đồng hồ thi vẫn tiếp tục đếm ngược.`
                  : 'Mọi hành vi chuyển tab, mất tiêu điểm, thoát toàn màn hình sẽ được hệ thống hiển thị cảnh báo và ghi nhận chi tiết vào Nhật ký khảo thí gửi giáo viên.'}
              </p>
            </div>

            {/* Rules List */}
            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-bold text-slate-900">Học sinh vui lòng tuân thủ các quy tắc sau:</p>
              <div className="space-y-1.5 pl-2">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Làm bài ở chế độ toàn màn hình, không mở các tab tài liệu khác.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Hệ thống tự động lưu đáp án sau mỗi câu chọn, không lo mất bài khi tải lại.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lưu ý kỹ thuật:</strong> Sự cố rớt mạng hoặc mất heartbeat được hệ thống phân loại là sự kiện kỹ thuật và <em>không tính là vi phạm gian lận</em>.
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPreExamModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmStartExam}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Tôi đã hiểu &amp; Bắt đầu làm bài</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineExamView;
