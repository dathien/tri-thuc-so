import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Search,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp,
  Award,
  Clock,
  MessageSquare,
  X,
} from 'lucide-react';
import { ExamSubmission, Exam } from '../../types';
import { soundService } from '../../utils/audio';

interface GradingViewProps {
  submissions: ExamSubmission[];
  exams: Exam[];
}

export const GradingView: React.FC<GradingViewProps> = ({ submissions, exams }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
  const [teacherComment, setTeacherComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubmissions = submissions.filter((s) =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.examTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Computed statistics
  const scores = submissions.map((s) => s.score);
  const avgScore =
    scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0.00';
  const maxScore = scores.length > 0 ? Math.max(...scores).toFixed(1) : '0.0';
  const minScore = scores.length > 0 ? Math.min(...scores).toFixed(1) : '0.0';
  const goodStudentsCount = scores.filter((sc) => sc >= 8.0).length;
  const goodRate = scores.length > 0 ? Math.round((goodStudentsCount / scores.length) * 100) : 0;

  // Score brackets: [0-5), [5-6.5), [6.5-8), [8-9), [9-10]
  const brackets = {
    weak: scores.filter((sc) => sc < 5).length,
    average: scores.filter((sc) => sc >= 5 && sc < 6.5).length,
    fair: scores.filter((sc) => sc >= 6.5 && sc < 8).length,
    good: scores.filter((sc) => sc >= 8 && sc < 9).length,
    excellent: scores.filter((sc) => sc >= 9).length,
  };

  const handleExportResults = () => {
    soundService.playClick();
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Mã bài,Học sinh,Lớp,Đề thi,Điểm số,Thời gian làm (phút),Ngày nộp,Số lần rời màn hình,Nhận xét\n' +
      submissions
        .map(
          (s) =>
            `${s.id},"${s.studentName}",${s.className},"${s.examTitle}",${s.score},${s.durationSpentMinutes},"${s.submittedAt}",${s.tabViolationsCount},"${s.feedback || ''}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Bang_diem_EduTest_Smart.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    selectedSubmission.feedback = teacherComment;
    setSelectedSubmission(null);
    soundService.playSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Chấm điểm &amp; Phân tích Thống kê
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              Chấm tự động 100%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng điểm chi tiết, phổ điểm, độ phân hóa và xuất kết quả học tập theo thang điểm 10 chuẩn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportResults}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất Bảng điểm Excel
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Điểm trung bình</span>
          <div className="mt-1 text-2xl font-bold text-indigo-700 font-mono">
            {avgScore} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Tính từ {scores.length} bài nộp</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Điểm cao nhất</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono">
            {maxScore} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-1">Thủ khoa bài thi</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Điểm thấp nhất</span>
          <div className="mt-1 text-2xl font-bold text-amber-600 font-mono">
            {minScore} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Cần hỗ trợ ôn tập</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Tỉ lệ Giỏi / Xuất sắc</span>
          <div className="mt-1 text-2xl font-bold text-purple-700 font-mono">
            {goodRate}%
          </div>
          <p className="text-[10px] text-purple-600 font-medium mt-1">Điểm &gt;= 8.0</p>
        </div>
      </div>

      {/* Visual Score Distribution Bar Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
          Phổ điểm bài kiểm tra (Thang điểm 10)
        </h3>

        <div className="space-y-3 text-xs">
          {/* 9 - 10 */}
          <div>
            <div className="flex justify-between text-slate-600 mb-1">
              <span className="font-semibold text-emerald-800">Xuất sắc (9.0 - 10.0)</span>
              <span className="font-mono font-bold">{brackets.excellent} học sinh</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{ width: `${scores.length > 0 ? (brackets.excellent / scores.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 8 - 8.9 */}
          <div>
            <div className="flex justify-between text-slate-600 mb-1">
              <span className="font-semibold text-blue-800">Giỏi (8.0 - 8.9)</span>
              <span className="font-mono font-bold">{brackets.good} học sinh</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${scores.length > 0 ? (brackets.good / scores.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 6.5 - 7.9 */}
          <div>
            <div className="flex justify-between text-slate-600 mb-1">
              <span className="font-semibold text-indigo-800">Khá (6.5 - 7.9)</span>
              <span className="font-mono font-bold">{brackets.fair} học sinh</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${scores.length > 0 ? (brackets.fair / scores.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 5.0 - 6.4 */}
          <div>
            <div className="flex justify-between text-slate-600 mb-1">
              <span className="font-semibold text-amber-800">Trung bình (5.0 - 6.4)</span>
              <span className="font-mono font-bold">{brackets.average} học sinh</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${scores.length > 0 ? (brackets.average / scores.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Danh sách bài nộp &amp; Kết quả chi tiết
            </h3>
            <p className="text-xs text-slate-500">
              {filteredSubmissions.length} bài thi đã hoàn thành và chấm điểm
            </p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Tên bài kiểm tra</th>
                <th className="px-4 py-3 text-center">Điểm số</th>
                <th className="px-4 py-3 text-center">Thời gian</th>
                <th className="px-4 py-3">Ngày nộp</th>
                <th className="px-4 py-3">Nhận xét của giáo viên</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {sub.studentName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{sub.className}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                    {sub.examTitle}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-sm text-indigo-700 tabular-nums">
                    {sub.score.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-500">
                    {sub.durationSpentMinutes}p
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {sub.submittedAt}
                  </td>
                  <td className="px-4 py-3 text-slate-600 italic text-[11px] max-w-xs truncate">
                    {sub.feedback || 'Chưa có nhận xét'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setTeacherComment(sub.feedback || '');
                        soundService.playClick();
                      }}
                      className="px-2.5 py-1 rounded-lg text-indigo-600 hover:bg-indigo-50 font-semibold text-xs transition-colors"
                    >
                      Nhận xét
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Feedback Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Nhận xét bài làm: {selectedSubmission.studentName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <span>
                Điểm: <strong className="font-mono text-indigo-700 text-sm">{selectedSubmission.score}</strong>
              </span>
              <span>Thời gian làm: <strong>{selectedSubmission.durationSpentMinutes} phút</strong></span>
            </div>

            <form onSubmit={handleSaveComment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lời nhận xét &amp; Dặn dò của giáo viên
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi nhận xét về ưu điểm hoặc phần kiến thức cần khắc phục..."
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Lưu nhận xét
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingView;
