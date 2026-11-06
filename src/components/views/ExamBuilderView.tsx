import React, { useState } from 'react';
import {
  FilePlus,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Eye,
  Check,
  Plus,
} from 'lucide-react';
import { Question, Exam, ClassRoom } from '../../types';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';

interface ExamBuilderViewProps {
  questions: Question[];
  classes: ClassRoom[];
  onSaveExam: (newExam: Omit<Exam, 'id' | 'createdAt'>) => void;
  onNavigateToVault: () => void;
}

export const ExamBuilderView: React.FC<ExamBuilderViewProps> = ({
  questions,
  classes,
  onSaveExam,
  onNavigateToVault,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [title, setTitle] = useState('Đề Kiểm tra Định kì Khảo sát Hàm số (Toán 12)');
  const [code, setCode] = useState('DE-TOAN12-GK1-2026');
  const [grade, setGrade] = useState<10 | 11 | 12>(12);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([classes[0]?.id || '']);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [allowReview, setAllowReview] = useState(true);

  // Selected questions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    questions.slice(0, 4).map((q) => q.id)
  );

  const gradeQuestions = questions.filter((q) => q.grade === grade);

  const toggleSelectQuestion = (qId: string) => {
    soundService.playClick();
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleSelectAllGradeQuestions = () => {
    soundService.playClick();
    setSelectedQuestionIds(gradeQuestions.map((q) => q.id));
  };

  const selectedQuestionsData = questions.filter((q) => selectedQuestionIds.includes(q.id));
  const currentTotalPoints = selectedQuestionsData.reduce((acc, q) => acc + q.points, 0);

  const handlePublish = (status: 'draft' | 'published') => {
    if (!title.trim() || selectedQuestionIds.length === 0) return;

    onSaveExam({
      code,
      title,
      grade,
      semester,
      durationMinutes,
      totalPoints: 10,
      questionsCount: selectedQuestionIds.length,
      questionIds: selectedQuestionIds,
      assignedClassIds: selectedClassIds,
      status,
      allowReview,
      proctoringEnabled,
      startDate: new Date().toISOString().slice(0, 10),
    });

    soundService.playSuccess();
    onNavigateToVault();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Tạo &amp; Quản lý Đề kiểm tra
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              Quy trình 3 bước
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình thời gian, thang điểm, chọn câu hỏi từ ngân hàng chuẩn hóa và phát hành cho học sinh.
          </p>
        </div>

        {/* Step Wizard Navigator */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              step === 1 ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            1. Cấu hình đề
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              step === 2 ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            2. Chọn câu hỏi ({selectedQuestionIds.length})
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              step === 3 ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            3. Xem trước &amp; Lưu
          </button>
        </div>
      </div>

      {/* Step 1: Configuration Form */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Bước 1: Thiết lập Thông tin chung &amp; Lớp làm bài
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tên đề thi / Bài kiểm tra</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mã đề thi</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Khối lớp</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value) as 10 | 11 | 12)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value={12}>Khối 12</option>
                  <option value={11}>Khối 11</option>
                  <option value={10}>Khối 10</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Học kỳ</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value={1}>Học kỳ I</option>
                  <option value={2}>Học kỳ II</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Thời gian (phút)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Giao cho Lớp học</label>
              <select
                multiple
                value={selectedClassIds}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions, (option) => option.value);
                  setSelectedClassIds(opts);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-20"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount} học sinh)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Security & Options */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800">Cấu hình Giám sát &amp; Xem lại bài</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proctoringEnabled}
                  onChange={(e) => setProctoringEnabled(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-medium text-slate-700">
                  Bật giám sát trực tuyến (cảnh báo chuyển tab, nhật ký hành vi)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowReview}
                  onChange={(e) => setAllowReview(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-medium text-slate-700">
                  Cho phép học sinh xem đáp án chi tiết sau khi nộp bài
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(2);
                soundService.playClick();
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              Tiếp tục: Chọn câu hỏi <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Pick Questions */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Bước 2: Chọn câu hỏi cho Khối {grade}
              </h2>
              <p className="text-xs text-slate-500">
                Đã chọn: <span className="font-bold text-indigo-600">{selectedQuestionIds.length} câu</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllGradeQuestions}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Chọn tất cả {gradeQuestions.length} câu khối {grade}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  soundService.playClick();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                Xem trước đề thi <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Grade Questions to select */}
          <div className="space-y-3">
            {gradeQuestions.map((q) => {
              const isSelected = selectedQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelectQuestion(q.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                      </div>
                      <span className="font-mono font-bold text-slate-900">{q.code}</span>
                      <span className="text-[11px] text-slate-500">{q.topic}</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-700">{q.points} điểm</span>
                  </div>

                  <div className="text-xs text-slate-800 font-medium">
                    <MathRenderer content={q.content} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Preview & Save */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                Bản xem trước đề thi
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{title}</h2>
              <p className="text-xs text-slate-500">
                Mã đề: <span className="font-mono font-bold text-slate-700">{code}</span> · Thời gian: {durationMinutes} phút · Khối {grade}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePublish('draft')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Lưu bản nháp
              </button>
              <button
                type="button"
                onClick={() => handlePublish('published')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Phát hành &amp; Mở làm bài
              </button>
            </div>
          </div>

          {/* Exam Questions list in Preview */}
          <div className="space-y-4">
            {selectedQuestionsData.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    Câu {idx + 1} ({q.points} điểm):
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{q.code}</span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed">
                  <MathRenderer content={q.content} />
                </div>
                {q.options && (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                        <span className="font-bold text-slate-600 text-[11px]">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <MathRenderer content={opt} inline />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamBuilderView;
