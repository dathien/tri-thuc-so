import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  EyeOff,
  Info,
  Lock,
  Unlock,
  Key,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Filter,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import { Student, ExamSubmission, Exam, ProctoringEvent, ProctoringMode } from '../../types';
import { soundService } from '../../utils/audio';
import { proctoringService, ActiveExamSession } from '../../services/proctoringService';

interface ProctoringViewProps {
  students: Student[];
  submissions: ExamSubmission[];
  exams: Exam[];
}

export const ProctoringView: React.FC<ProctoringViewProps> = ({
  students,
  submissions,
  exams,
}) => {
  const publishedExams = exams.filter((e) => e.status === 'published');
  const [selectedExamId, setSelectedExamId] = useState<string>(
    publishedExams[0]?.id || exams[0]?.id || 'exam-12-01'
  );
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [showTeacherPin, setShowTeacherPin] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'doing' | 'locked' | 'submitted'>('all');

  // Selected student for detailed audit log modal
  const [auditStudent, setAuditStudent] = useState<{
    id: string;
    name: string;
    code: string;
    events: ProctoringEvent[];
    isLocked?: boolean;
    violations: number;
    mode: ProctoringMode;
  } | null>(null);

  // Active sessions from service
  const [activeSessions, setActiveSessions] = useState<Record<string, ActiveExamSession>>({});

  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const examConfig = proctoringService.getExamConfig(activeExam?.id || '');
  const isStrictLock = examConfig.mode === 'strict_lock';

  // Load and subscribe to real-time sessions
  useEffect(() => {
    const loadSessions = () => {
      const list = proctoringService.getSessionsForExam(selectedExamId);
      const map: Record<string, ActiveExamSession> = {};
      list.forEach((s) => {
        map[s.studentId] = s;
      });
      setActiveSessions(map);
    };

    loadSessions();

    const unsubscribe = proctoringService.subscribe(() => {
      loadSessions();
    });

    return () => {
      unsubscribe();
    };
  }, [selectedExamId]);

  // Merge students with active session / submission data
  const mergedStudents = students.map((s) => {
    const sub = submissions.find((item) => item.studentId === s.id && item.examId === selectedExamId);
    const session = activeSessions[s.id];

    if (sub) {
      return {
        ...s,
        examStatus: 'submitted' as const,
        score: sub.score,
        violations: sub.tabViolationsCount,
        duration: sub.durationSpentMinutes,
        isLocked: false,
        lockReason: undefined as string | undefined,
        lockedAt: undefined as string | undefined,
        events: sub.proctoringEvents || [],
        mode: sub.proctoringMode || examConfig.mode,
      };
    }

    if (session) {
      return {
        ...s,
        examStatus: session.isLocked ? ('locked' as const) : ('doing' as const),
        score: null,
        violations: session.violationsCount,
        duration: Math.round((Date.now() - session.startTime) / 60000) || 1,
        isLocked: session.isLocked,
        lockReason: session.lockReason as string | undefined,
        lockedAt: session.lockedAt as string | undefined,
        events: session.events,
        mode: examConfig.mode,
      };
    }

    return {
      ...s,
      examStatus: 'doing' as const,
      score: null,
      violations: 0,
      duration: 10,
      isLocked: false,
      lockReason: undefined as string | undefined,
      lockedAt: undefined as string | undefined,
      events: [],
      mode: examConfig.mode,
    };
  });

  const filteredStudents = mergedStudents.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchStudent.toLowerCase());
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'locked'
        ? s.isLocked
        : filterStatus === 'submitted'
        ? s.examStatus === 'submitted'
        : s.examStatus === 'doing' && !s.isLocked;
    return matchSearch && matchStatus;
  });

  const totalViolations = mergedStudents.reduce((sum, s) => sum + s.violations, 0);
  const lockedCount = mergedStudents.filter((s) => s.isLocked).length;
  const submittedCount = mergedStudents.filter((s) => s.examStatus === 'submitted').length;
  const doingCount = mergedStudents.length - submittedCount - lockedCount;

  // Remote Unlock Action
  const handleRemoteUnlock = (studentId: string, studentName: string) => {
    proctoringService.unlockSession(
      selectedExamId,
      studentId,
      'remote',
      'Giáo viên (Mở khóa từ xa)'
    );
    soundService.playSuccess();
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    soundService.playSuccess();
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMessage('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Giám sát Phòng thi Trực tuyến
            </h1>
            <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2.5 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Live Proctoring 2.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến trình làm bài, phát hiện rời màn hình, hỗ trợ mở khóa từ xa và xác thực mã PIN bảo mật.
          </p>
        </div>

        {/* Exam Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              soundService.playClick();
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-bold bg-slate-50 focus:bg-white"
          >
            {publishedExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.code} - {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Exam Proctoring Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isStrictLock
            ? 'bg-gradient-to-r from-rose-50 via-white to-rose-50 border-rose-200'
            : 'bg-gradient-to-r from-blue-50 via-white to-blue-50 border-blue-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isStrictLock ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isStrictLock ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isStrictLock ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isStrictLock ? 'Chế độ 1: Chống gian lận và khóa bài thi' : 'Chế độ 2: Chỉ chống gian lận'}
              </span>
              <span className="text-xs text-slate-500">
                Thời gian: <strong>{activeExam.durationMinutes} phút</strong>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {isStrictLock
                ? `Học sinh rời màn hình quá ${examConfig.lockThreshold} lần sẽ bị khóa bài thi ngay lập tức. Giáo viên có thể bấm Mở khóa từ xa hoặc đọc mã PIN cho học sinh.`
                : 'Hệ thống hiển thị cảnh báo cho học sinh khi chuyển tab và ghi nhật ký giám sát đầy đủ nhưng không khóa bài thi.'}
            </p>
          </div>
        </div>

        {/* Teacher PIN Box (Mode 1 only) */}
        {isStrictLock && (
          <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs flex items-center gap-3 shrink-0 self-start md:self-auto">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Mã PIN ca thi (Giáo viên)
              </span>
              <span className="font-mono font-black text-sm tracking-widest text-slate-900">
                {showTeacherPin ? examConfig.unlockPin || '689254' : '••••••'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTeacherPin(!showTeacherPin)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 border border-slate-200"
              title={showTeacherPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
            >
              {showTeacherPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Học sinh trong ca</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono">
            {students.length} em
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Đang làm bài</span>
          <div className="mt-1 text-2xl font-bold text-indigo-600 font-mono">
            {doingCount} em
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Đang bị khóa bài</span>
          <div
            className={`mt-1 text-2xl font-bold font-mono ${
              lockedCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'
            }`}
          >
            {lockedCount} em
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Tổng số lần vi phạm</span>
          <div className="mt-1 text-2xl font-bold text-amber-600 font-mono">
            {totalViolations} lượt
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
          {(['all', 'doing', 'locked', 'submitted'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterStatus === st ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {st === 'all'
                ? 'Tất cả'
                : st === 'doing'
                ? `Đang làm (${doingCount})`
                : st === 'locked'
                ? `Bị khóa (${lockedCount})`
                : `Đã nộp (${submittedCount})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên học sinh, mã số..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Students Live Supervision Tiles */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-sm text-slate-900">
            Danh sách học sinh phòng thi ({filteredStudents.length} em)
          </h2>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Đồng bộ thời gian thực
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStudents.map((s) => {
            const hasViolations = s.violations > 0;
            const isStudentLocked = s.isLocked;

            return (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
                  isStudentLocked
                    ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-200'
                    : hasViolations
                    ? 'bg-amber-50/50 border-amber-300'
                    : s.examStatus === 'submitted'
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{s.name}</span>
                    <span className="font-mono text-[11px] text-slate-400">{s.studentCode}</span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isStudentLocked ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                        <Lock className="w-3 h-3" />
                        BỊ KHÓA BÀI
                      </span>
                    ) : s.examStatus === 'submitted' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Đã nộp ({s.score}đ)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        Đang làm ({s.duration}p)
                      </span>
                    )}
                  </div>
                </div>

                {/* Violation / Lock details */}
                {isStudentLocked ? (
                  <div className="p-2.5 rounded-xl bg-white border border-rose-200 space-y-1.5">
                    <p className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{s.lockReason || 'Đã vi phạm vượt ngưỡng'}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Khóa lúc: {s.lockedAt || 'Vừa xong'}</p>
                  </div>
                ) : hasViolations ? (
                  <div className="p-2 rounded-xl bg-amber-100/70 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Rời màn hình: {s.violations} lần</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Làm bài nghiêm túc, không có vi phạm</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAuditStudent({
                        id: s.id,
                        name: s.name,
                        code: s.studentCode,
                        events: s.events,
                        isLocked: s.isLocked,
                        violations: s.violations,
                        mode: s.mode,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-[11px] flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Nhật ký</span>
                  </button>

                  {/* Remote Unlock Button */}
                  {isStudentLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoteUnlock(s.id, s.name)}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Mở khóa từ xa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Broadcast Message Form */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Gửi thông báo nhắc nhở đến cả phòng thi</h3>
        <form onSubmit={handleSendBroadcast} className="flex gap-2">
          <input
            type="text"
            placeholder="Ví dụ: Còn 10 phút nữa hết giờ làm bài, các em chú ý kiểm tra lại đáp án..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            Phát loa nhắc nhở
          </button>
        </form>

        {broadcastSent && (
          <p className="text-xs text-emerald-600 font-semibold animate-in fade-in">
            ✓ Đã gửi thông báo nhắc nhở tới tất cả màn hình học sinh trong phòng thi!
          </p>
        )}
      </div>

      {/* Detailed Student Proctoring Log Modal */}
      {auditStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Nhật ký Giám sát Khảo thí Chi tiết
                </h3>
                <p className="text-xs text-slate-500">
                  Học sinh: <strong className="text-slate-800">{auditStudent.name}</strong> ({auditStudent.code}) · Tổng vi phạm: <strong className="text-rose-600">{auditStudent.violations} lần</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Timeline List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 text-xs">
              {auditStudent.events.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                  Chưa có sự kiện giám sát nào được ghi nhận cho học sinh này.
                </div>
              ) : (
                auditStudent.events.map((ev) => {
                  const isViolation = ev.isViolation;
                  const isLock = ev.eventType === 'exam_locked';
                  const isUnlock = ev.eventType === 'exam_unlocked_remote' || ev.eventType === 'exam_unlocked_pin';
                  const isTech = ev.eventType === 'network_disconnect' || ev.eventType === 'network_reconnect';

                  return (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 ${
                        isLock
                          ? 'bg-rose-50 border-rose-300'
                          : isUnlock
                          ? 'bg-emerald-50 border-emerald-300'
                          : isViolation
                          ? 'bg-amber-50/60 border-amber-200'
                          : isTech
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isLock ? (
                          <Lock className="w-4 h-4 text-rose-600" />
                        ) : isUnlock ? (
                          <Unlock className="w-4 h-4 text-emerald-600" />
                        ) : isViolation ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : isTech ? (
                          <Wifi className="w-4 h-4 text-blue-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold ${
                              isLock
                                ? 'text-rose-800'
                                : isUnlock
                                ? 'text-emerald-800'
                                : isViolation
                                ? 'text-amber-800'
                                : 'text-slate-700'
                            }`}
                          >
                            {ev.description}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{ev.timestamp}</span>
                        </div>
                        {ev.performedBy && (
                          <p className="text-[10px] text-slate-500">Thực hiện bởi: {ev.performedBy}</p>
                        )}
                        {isTech && (
                          <span className="inline-block text-[10px] text-blue-600 font-medium">
                            (Sự kiện kỹ thuật - Không tính là vi phạm gian lận)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {auditStudent.isLocked && (
                <button
                  type="button"
                  onClick={() => {
                    handleRemoteUnlock(auditStudent.id, auditStudent.name);
                    setAuditStudent((prev) => (prev ? { ...prev, isLocked: false } : null));
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Mở khóa từ xa cho học sinh này
                </button>
              )}

              <button
                type="button"
                onClick={() => setAuditStudent(null)}
                className="ml-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctoringView;
