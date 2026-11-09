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
  Printer,
  Copy,
  Layers,
  Sparkles,
  Lock,
  X,
} from 'lucide-react';
import { Exam, ClassRoom, ExamBundle } from '../../types';
import { SectionKey } from '../Sidebar';
import { soundService } from '../../utils/audio';
import { docxExportService } from '../../services/docxExportService';
import { pdfExportService } from '../../services/pdfExportService';
import { BENCHMARK_EXAM_BUNDLE } from '../../data/mockExamDataset';
import MathRenderer from '../MathRenderer';

interface ExamVaultViewProps {
  exams: Exam[];
  classes: ClassRoom[];
  onNavigate: (section: SectionKey) => void;
  onDuplicateExam?: (exam: Exam) => void;
}

export const ExamVaultView: React.FC<ExamVaultViewProps> = ({
  exams,
  classes,
  onNavigate,
  onDuplicateExam,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<'all' | 10 | 11 | 12>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  const [activeTab, setActiveTab] = useState<'paper' | 'matrix' | 'spec' | 'key'>('paper');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  const getBundle = (exam: Exam): ExamBundle => {
    return exam.bundle || BENCHMARK_EXAM_BUNDLE;
  };

  const handleExportDocx = async (exam: Exam) => {
    try {
      soundService.playClick();
      const bundle = getBundle(exam);
      const blob = await docxExportService.generateDocxBlob(bundle, {
        template: 'full',
        schoolName: bundle.schoolName,
        fontSizePt: 13,
      });
      docxExportService.downloadBlob(blob, `${exam.code}_Bo-Ho-So-De-Thi.docx`);
      soundService.playSuccess();
      setActionNotice(`Đã tải xuống tệp Word (.docx) của đề ${exam.code}`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e) {
      console.error(e);
      alert('Lỗi xuất tệp Word.');
    }
  };

  const handleExportPdf = (exam: Exam) => {
    soundService.playClick();
    const bundle = getBundle(exam);
    pdfExportService.printPdf(bundle, 'full_bundle');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Kho Đề kiểm tra &amp; Hồ sơ Khảo thí Toán THPT
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              {exams.length} Bộ đề đã lưu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ toàn diện Cấu trúc, Ma trận, Đặc tả, Đề thi, Đáp án và hỗ trợ xuất Word (.docx) / PDF (.pdf) chuẩn A4.
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
            Tạo bộ đề mới
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)}>×</button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['all', 12, 11, 10] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setSelectedGrade(g);
                  soundService.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedGrade === g
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g === 'all' ? 'Tất cả khối' : `Khối ${g}`}
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
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                statusFilter === 'published' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Đã phát hành
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
        {filteredExams.map((exam) => {
          const isPublished = exam.status === 'published';

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {exam.code}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Khối {exam.grade} · HK{exam.semester}
                    </span>
                    {isPublished ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        Bản cố định đã phát hành
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Bản nháp chỉnh sửa
                      </span>
                    )}
                    {exam.proctoringEnabled && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          exam.proctoringMode === 'strict_lock' || exam.proctoringConfig?.mode === 'strict_lock'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {exam.proctoringMode === 'strict_lock' || exam.proctoringConfig?.mode === 'strict_lock'
                          ? 'Chế độ 1: Khóa tự động'
                          : 'Chế độ 2: Chỉ giám sát'}
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
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setPreviewExam(exam);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    Xem hồ sơ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onNavigate('online-exam');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                  >
                    Làm bài thử
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleExportDocx(exam)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200"
                    title="Xuất Word (.docx)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPdf(exam)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200"
                    title="In & Xuất PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {exam.proctoringEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        onNavigate('proctoring');
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
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
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                    title="Xem kết quả chấm"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Exam Modal */}
      {previewExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {previewExam.code}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">{previewExam.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewExam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-5 border-b border-slate-100 flex items-center gap-2 text-xs font-bold overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('paper')}
                className={`py-3 px-3 border-b-2 transition-all ${activeTab === 'paper' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
              >
                1. Đề thi (22 câu)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('matrix')}
                className={`py-3 px-3 border-b-2 transition-all ${activeTab === 'matrix' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
              >
                2. Ma trận đề
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('spec')}
                className={`py-3 px-3 border-b-2 transition-all ${activeTab === 'spec' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
              >
                3. Bản đặc tả
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('key')}
                className={`py-3 px-3 border-b-2 transition-all ${activeTab === 'key' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
              >
                4. Đáp án &amp; Thang điểm
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
              {activeTab === 'paper' && (
                <div className="space-y-4">
                  {getBundle(previewExam).questions.map((q, idx) => (
                    <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Câu {idx + 1} ({q.points}đ)</span>
                        <span className="font-mono text-indigo-600 text-[11px]">{q.code}</span>
                      </div>
                      <div className="text-slate-900 leading-relaxed">
                        <MathRenderer content={q.content} />
                      </div>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, i) => (
                            <div key={i} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-1.5">
                              <strong>{String.fromCharCode(65 + i)}.</strong>
                              <MathRenderer content={opt} inline />
                            </div>
                          ))}
                        </div>
                      )}
                      {q.subItems && (
                        <div className="space-y-1 pt-1 pl-2">
                          {q.subItems.map((sub) => (
                            <div key={sub.id} className="p-1.5 rounded bg-white border border-slate-200 flex items-center justify-between">
                              <span><strong>{sub.label})</strong> {sub.content}</span>
                              <span className="font-bold text-slate-500 text-[10px]">[ ] Đúng  [ ] Sai</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'matrix' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase">Khung Ma trận chuẩn 10.0 điểm</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-center">
                        <tr>
                          <th className="p-2 border-r border-slate-200">Chủ đề</th>
                          <th className="p-2 border-r border-slate-200">Nhận biết</th>
                          <th className="p-2 border-r border-slate-200">Thông hiểu</th>
                          <th className="p-2 border-r border-slate-200">Vận dụng</th>
                          <th className="p-2 border-r border-slate-200">Vận dụng cao</th>
                          <th className="p-2">Tổng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getBundle(previewExam).matrixItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold border-r border-slate-100">{item.chapter}</td>
                            <td className="p-2 text-center border-r border-slate-100">{item.recognition}</td>
                            <td className="p-2 text-center border-r border-slate-100">{item.comprehension}</td>
                            <td className="p-2 text-center border-r border-slate-100">{item.application}</td>
                            <td className="p-2 text-center border-r border-slate-100">{item.highApplication}</td>
                            <td className="p-2 text-center font-bold">{item.totalQuestions} câu ({item.totalPoints}đ)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'spec' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase">Bản đặc tả Yêu cầu cần đạt chuẩn GDPT</h4>
                  <div className="space-y-2">
                    {getBundle(previewExam).specifications.map((s) => (
                      <div key={s.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                        <span className="font-mono font-bold text-indigo-700 shrink-0">Câu {s.questionNumber}</span>
                        <div className="flex-1 space-y-0.5">
                          <span className="font-bold text-slate-800">{s.chapter} · {s.topic}</span>
                          <p className="text-slate-600 text-[11px]">{s.learningObjective}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 shrink-0">
                          {s.cognitiveLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'key' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase mb-2">Đáp án Phần I (12 câu)</h4>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-center">
                      {getBundle(previewExam).masterAnswerKey.part1.map((item) => (
                        <div key={item.questionNumber} className="p-2 rounded bg-indigo-50 border border-indigo-200">
                          <span className="text-[10px] text-slate-400 block font-semibold">C{item.questionNumber}</span>
                          <span className="font-mono font-bold text-indigo-700">{item.answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 uppercase mb-2">Đáp án Phần III (6 câu)</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                      {getBundle(previewExam).masterAnswerKey.part3.map((item) => (
                        <div key={item.questionNumber} className="p-2 rounded bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] text-slate-400 block font-semibold">C{item.questionNumber}</span>
                          <span className="font-mono font-bold text-emerald-800">{item.answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50 rounded-b-3xl">
              <span className="text-slate-500 text-xs">
                Hồ sơ đề thi được lưu trữ an toàn trong EduTest Smart.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportDocx(previewExam)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất Word (.docx)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdf(previewExam)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamVaultView;
