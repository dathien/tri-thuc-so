import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Info,
} from 'lucide-react';
import { Student, ExamSubmission, Exam } from '../../types';
import { soundService } from '../../utils/audio';

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
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const activeExam = exams.find((e) => e.status === 'published') || exams[0];

  // Merge students with their submission status
  const studentStatuses = students.map((s) => {
    const sub = submissions.find((item) => item.studentId === s.id);
    if (sub) {
      return {
        ...s,
        examStatus: 'submitted' as const,
        score: sub.score,
        violations: sub.tabViolationsCount,
        duration: sub.durationSpentMinutes,
      };
    }
    return {
      ...s,
      examStatus: 'doing' as const,
      score: null,
      violations: 0,
      duration: 15,
    };
  });

  const totalViolations = submissions.reduce((sum, s) => sum + s.tabViolationsCount, 0);

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
              Live Proctoring
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến trình làm bài, phát hiện rời màn hình / chuyển tab và ghi nhật ký minh bạch.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-800">
            {activeExam?.title || 'Đề kiểm tra trực tuyến'}
          </span>
          <p className="text-[11px] text-slate-400">Thời gian quy định: {activeExam?.durationMinutes} phút</p>
        </div>
      </div>

      {/* Pedagogical Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Lưu ý Sư phạm:</strong> Tính năng giám sát hỗ trợ giáo viên nhắc nhở ý thức tự giác và trung thực của học sinh trong giờ kiểm tra số, hệ thống ghi nhận trung thực các sự kiện và <em>không tuyên bố chống gian lận tuyệt đối</em>.
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Học sinh trong phòng</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono">
            {students.length} em
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Đã nộp bài</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono">
            {submissions.length} bài
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Đang làm bài</span>
          <div className="mt-1 text-2xl font-bold text-indigo-600 font-mono">
            {students.length - submissions.length} em
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Cảnh báo rời màn hình</span>
          <div className="mt-1 text-2xl font-bold text-amber-600 font-mono">
            {totalViolations} lượt
          </div>
        </div>
      </div>

      {/* Students Live Supervision Tiles */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-sm text-slate-900">
            Trạng thái học sinh tham gia kiểm tra
          </h2>
          <span className="text-xs text-slate-400">Tự động cập nhật</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {studentStatuses.map((s) => (
            <div
              key={s.id}
              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                s.violations > 0
                  ? 'bg-amber-50/50 border-amber-200'
                  : s.examStatus === 'submitted'
                  ? 'bg-emerald-50/30 border-emerald-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{s.name}</span>
                <span className="font-mono text-[11px] text-slate-400">{s.studentCode}</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span>Trạng thái:</span>
                {s.examStatus === 'submitted' ? (
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Đã nộp ({s.score} điểm)
                  </span>
                ) : (
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Đang làm bài
                  </span>
                )}
              </div>

              {s.violations > 0 && (
                <div className="p-1.5 rounded bg-amber-100/70 text-amber-900 text-[10px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Phát hiện rời màn hình {s.violations} lần</span>
                </div>
              )}
            </div>
          ))}
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
    </div>
  );
};

export default ProctoringView;
