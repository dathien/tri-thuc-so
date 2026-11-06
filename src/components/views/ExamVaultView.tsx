import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  FileText,
  Clock,
  Users,
  CheckCircle,
  Eye,
  ShieldAlert,
  BarChart3,
  Download,
  Plus,
} from 'lucide-react';
import { Exam, ClassRoom } from '../../types';
import { SectionKey } from '../Sidebar';
import { soundService } from '../../utils/audio';

interface ExamVaultViewProps {
  exams: Exam[];
  classes: ClassRoom[];
  onNavigate: (section: SectionKey) => void;
}

export const ExamVaultView: React.FC<ExamVaultViewProps> = ({ exams, classes, onNavigate }) => {
  const [selectedGrade, setSelectedGrade] = useState<'all' | 10 | 11 | 12>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExams = exams.filter((e) => {
    const matchGrade = selectedGrade === 'all' ? true : e.grade === selectedGrade;
    const matchStatus = statusFilter === 'all' ? true : e.status === statusFilter;
    const matchSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchStatus && matchSearch;
  });

  const getClassName = (classId: string) => {
    const found = classes.find((c) => c.id === classId);
    return found ? found.name : classId;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Kho Đề kiểm tra Toán THPT
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              {exams.length} Đề thi đã lưu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ, quản lý các kỳ kiểm tra 15 phút, 1 tiết, giữa kỳ và cuối kỳ theo chuẩn GDPT 2018.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onNavigate('exam-builder');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo đề mới
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['all', 12, 11, 10] as const).map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => {
                  setSelectedGrade(grade);
                  soundService.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedGrade === grade
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {grade === 'all' ? 'Tất cả khối' : `Khối ${grade}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tất cả trạng thái
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                statusFilter === 'published' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Đang mở thi
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                statusFilter === 'draft' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Bản nháp
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên đề, mã đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {exam.code}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Khối {exam.grade} · HK{exam.semester}
                  </span>
                  {exam.status === 'published' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Đang mở thi
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Bản nháp
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-2 leading-snug">{exam.title}</h3>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
              <div>
                <span className="text-[10px] text-slate-400 block">Thời gian</span>
                <span className="font-bold font-mono text-slate-800">{exam.durationMinutes} phút</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Số câu hỏi</span>
                <span className="font-bold font-mono text-slate-800">{exam.questionsCount} câu</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Thang điểm</span>
                <span className="font-bold font-mono text-indigo-700">{exam.totalPoints} điểm</span>
              </div>
            </div>

            {/* Assigned Classes */}
            <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
              <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Giao cho: </span>
              <strong className="text-slate-800 truncate">
                {exam.assignedClassIds.map(getClassName).join(', ')}
              </strong>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  onNavigate('online-exam');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                Làm bài thử
              </button>

              <div className="flex items-center gap-1.5">
                {exam.proctoringEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onNavigate('proctoring');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-50"
                    title="Giám sát phòng thi"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onNavigate('grading');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                  title="Xem kết quả chấm"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamVaultView;
