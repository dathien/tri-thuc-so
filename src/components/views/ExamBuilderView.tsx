import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  ShieldCheck,
  Sliders,
  Filter,
  Lock,
  Unlock,
  Key,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Question, Exam, ClassRoom, CognitiveLevel, ProctoringMode, ProctoringConfig } from '../../types';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';
import { proctoringService } from '../../services/proctoringService';

interface ExamBuilderViewProps {
  questions: Question[];
  classes: ClassRoom[];
  onSaveExam: (newExam: Omit<Exam, 'id' | 'createdAt'>) => void;
  onNavigateToVault: () => void;
}

const COGNITIVE_LEVEL_INFO: Record<
  CognitiveLevel,
  { label: string; badge: string; color: string; border: string }
> = {
  recognition: {
    label: 'Nhận biết',
    badge: 'bg-emerald-50 text-emerald-700',
    color: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  comprehension: {
    label: 'Thông hiểu',
    badge: 'bg-blue-50 text-blue-700',
    color: 'text-blue-700',
    border: 'border-blue-200',
  },
  application: {
    label: 'Vận dụng',
    badge: 'bg-amber-50 text-amber-700',
    color: 'text-amber-700',
    border: 'border-amber-200',
  },
  high_application: {
    label: 'Vận dụng cao',
    badge: 'bg-rose-50 text-rose-700',
    color: 'text-rose-700',
    border: 'border-rose-200',
  },
};

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
  const [targetTotalPoints, setTargetTotalPoints] = useState(10);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([classes[0]?.id || '']);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [proctoringMode, setProctoringMode] = useState<ProctoringMode>('strict_lock');
  const [lockThreshold, setLockThreshold] = useState<1 | 2 | 3>(2);
  const [unlockPin, setUnlockPin] = useState<string>('689254');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [allowReview, setAllowReview] = useState(true);

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setUnlockPin(pin);
    soundService.playClick();
  };

  // 4 Cognitive Levels Quota Configuration (Saved to localStorage)
  const [cognitiveConfig, setCognitiveConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('edutest_builder_cognitive_config');
      return saved
        ? JSON.parse(saved)
        : {
            recognition: 2,
            comprehension: 2,
            application: 1,
            high_application: 0,
          };
    } catch {
      return {
        recognition: 2,
        comprehension: 2,
        application: 1,
        high_application: 0,
      };
    }
  });

  // Save config on change
  useEffect(() => {
    localStorage.setItem('edutest_builder_cognitive_config', JSON.stringify(cognitiveConfig));
  }, [cognitiveConfig]);

  // Selected questions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    questions.slice(0, 4).map((q) => q.id)
  );

  // Active filter in Step 2
  const [filterLevel, setFilterLevel] = useState<'all' | CognitiveLevel>('all');

  const gradeQuestions = questions.filter((q) => q.grade === grade);

  // Available questions in bank by cognitive level
  const availableByLevel: Record<CognitiveLevel, Question[]> = {
    recognition: gradeQuestions.filter((q) => q.cognitiveLevel === 'recognition'),
    comprehension: gradeQuestions.filter((q) => q.cognitiveLevel === 'comprehension'),
    application: gradeQuestions.filter((q) => q.cognitiveLevel === 'application'),
    high_application: gradeQuestions.filter((q) => q.cognitiveLevel === 'high_application'),
  };

  // Currently selected questions data
  const selectedQuestionsData = questions.filter((q) => selectedQuestionIds.includes(q.id));
  const currentTotalPoints = selectedQuestionsData.reduce((acc, q) => acc + q.points, 0);

  // Count selected questions by level
  const selectedByLevelCount: Record<CognitiveLevel, number> = {
    recognition: selectedQuestionsData.filter((q) => q.cognitiveLevel === 'recognition').length,
    comprehension: selectedQuestionsData.filter((q) => q.cognitiveLevel === 'comprehension').length,
    application: selectedQuestionsData.filter((q) => q.cognitiveLevel === 'application').length,
    high_application: selectedQuestionsData.filter((q) => q.cognitiveLevel === 'high_application')
      .length,
  };

  // Quota totals & percentages
  const targetTotalQuestions =
    (Number(cognitiveConfig.recognition) || 0) +
    (Number(cognitiveConfig.comprehension) || 0) +
    (Number(cognitiveConfig.application) || 0) +
    (Number(cognitiveConfig.high_application) || 0);

  const quotaRecPct =
    targetTotalQuestions > 0 ? (cognitiveConfig.recognition / targetTotalQuestions) * 100 : 0;
  const quotaCompPct =
    targetTotalQuestions > 0 ? (cognitiveConfig.comprehension / targetTotalQuestions) * 100 : 0;
  const quotaAppPct =
    targetTotalQuestions > 0 ? (cognitiveConfig.application / targetTotalQuestions) * 100 : 0;
  const quotaHighPct =
    targetTotalQuestions > 0 ? (cognitiveConfig.high_application / targetTotalQuestions) * 100 : 0;
  const quotaTotalPct = targetTotalQuestions > 0 ? 100 : 0;

  // Presets
  const applyBuilderPreset = (preset: 'standard' | 'basic15' | 'advanced' | 'custom') => {
    soundService.playClick();
    if (preset === 'basic15') {
      // 15 min basic: 6 recognition, 4 comprehension, 0 application, 0 high application
      setCognitiveConfig({
        recognition: 6,
        comprehension: 4,
        application: 0,
        high_application: 0,
      });
      setDurationMinutes(15);
    } else if (preset === 'advanced') {
      // Advanced: 0 recognition, 2 comprehension, 4 application, 4 high application
      setCognitiveConfig({
        recognition: 0,
        comprehension: 2,
        application: 4,
        high_application: 4,
      });
      setDurationMinutes(45);
    } else if (preset === 'standard') {
      // Standard 40-35-20-5 ratio (~ 8-7-4-1)
      setCognitiveConfig({
        recognition: 8,
        comprehension: 7,
        application: 4,
        high_application: 1,
      });
      setDurationMinutes(45);
    }
  };

  // Auto pick questions matching the cognitive quota
  const handleAutoSelectByCognitiveLevels = () => {
    soundService.playSuccess();
    const picked: string[] = [];

    const recPool = availableByLevel.recognition;
    const compPool = availableByLevel.comprehension;
    const appPool = availableByLevel.application;
    const highPool = availableByLevel.high_application;

    picked.push(...recPool.slice(0, cognitiveConfig.recognition).map((q) => q.id));
    picked.push(...compPool.slice(0, cognitiveConfig.comprehension).map((q) => q.id));
    picked.push(...appPool.slice(0, cognitiveConfig.application).map((q) => q.id));
    picked.push(...highPool.slice(0, cognitiveConfig.high_application).map((q) => q.id));

    setSelectedQuestionIds(picked);
  };

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

  const handlePublish = (status: 'draft' | 'published') => {
    if (!title.trim() || selectedQuestionIds.length === 0) return;

    const proctoringConfig: ProctoringConfig = {
      mode: proctoringMode,
      lockThreshold,
      unlockPin,
      continueTimerOnLock: true,
      detectTabSwitch: true,
      detectFullscreenExit: true,
      detectFocusLoss: true,
    };

    onSaveExam({
      code,
      title,
      grade,
      semester,
      durationMinutes,
      totalPoints: targetTotalPoints,
      questionsCount: selectedQuestionIds.length,
      questionIds: selectedQuestionIds,
      assignedClassIds: selectedClassIds,
      status,
      allowReview,
      proctoringEnabled,
      proctoringMode,
      proctoringConfig,
      startDate: new Date().toISOString().slice(0, 10),
    });

    proctoringService.saveExamConfig(code, proctoringConfig);

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
            Cấu hình thời gian, thang điểm, tùy chỉnh 4 mức độ nhận thức (cho phép đặt 0) và chọn câu hỏi từ ngân hàng chuẩn hóa.
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
            1. Cấu hình &amp; Mức độ
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
            Bước 1: Thiết lập Thông tin chung &amp; Tùy chỉnh Mức độ Nhận thức
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

          {/* 4 Cognitive Levels Customization Card */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Tùy chỉnh 4 Mức độ Nhận thức cho Đề thi
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Cho phép đặt mức độ bất kỳ bằng 0 câu (0%)
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 font-medium">Mẫu nhanh:</span>
              <button
                type="button"
                onClick={() => applyBuilderPreset('standard')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 font-semibold text-slate-700 text-[11px]"
              >
                Mẫu chuẩn (40-35-20-5)
              </button>
              <button
                type="button"
                onClick={() => applyBuilderPreset('basic15')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 font-semibold text-slate-700 text-[11px]"
              >
                15 Phút Cơ bản (Chỉ NB + TH, 0% VD)
              </button>
              <button
                type="button"
                onClick={() => applyBuilderPreset('advanced')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-rose-300 font-semibold text-slate-700 text-[11px]"
              >
                Khảo sát Nâng cao (0% NB, Tập trung VD+VDC)
              </button>
            </div>

            {/* 4 Level Input Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800">Nhận biết</span>
                  <span className="text-[10px] text-slate-400">
                    Kho: {availableByLevel.recognition.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={cognitiveConfig.recognition}
                    onChange={(e) =>
                      setCognitiveConfig({
                        ...cognitiveConfig,
                        recognition: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-mono font-bold text-center bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 focus:bg-white focus:outline-none"
                  />
                  <span className="font-medium text-slate-500">câu</span>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Chiếm {quotaRecPct.toFixed(1)}%
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800">Thông hiểu</span>
                  <span className="text-[10px] text-slate-400">
                    Kho: {availableByLevel.comprehension.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={cognitiveConfig.comprehension}
                    onChange={(e) =>
                      setCognitiveConfig({
                        ...cognitiveConfig,
                        comprehension: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-mono font-bold text-center bg-blue-50 border border-blue-200 rounded-lg text-blue-900 focus:bg-white focus:outline-none"
                  />
                  <span className="font-medium text-slate-500">câu</span>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Chiếm {quotaCompPct.toFixed(1)}%
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800">Vận dụng</span>
                  <span className="text-[10px] text-slate-400">
                    Kho: {availableByLevel.application.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={cognitiveConfig.application}
                    onChange={(e) =>
                      setCognitiveConfig({
                        ...cognitiveConfig,
                        application: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-mono font-bold text-center bg-amber-50 border border-amber-200 rounded-lg text-amber-900 focus:bg-white focus:outline-none"
                  />
                  <span className="font-medium text-slate-500">câu</span>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Chiếm {quotaAppPct.toFixed(1)}%
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-800">Vận dụng cao</span>
                  <span className="text-[10px] text-slate-400">
                    Kho: {availableByLevel.high_application.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={cognitiveConfig.high_application}
                    onChange={(e) =>
                      setCognitiveConfig({
                        ...cognitiveConfig,
                        high_application: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-mono font-bold text-center bg-rose-50 border border-rose-200 rounded-lg text-rose-900 focus:bg-white focus:outline-none"
                  />
                  <span className="font-medium text-slate-500">câu</span>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Chiếm {quotaHighPct.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Total Indicator & Auto-select Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-indigo-100/60">
              <div className="text-slate-700">
                Tổng số câu cấu hình: <span className="font-mono font-bold text-indigo-700">{targetTotalQuestions} câu</span> · Tổng tỉ lệ: <span className="font-mono font-bold text-slate-900">{quotaTotalPct}%</span>
              </div>
              <button
                type="button"
                onClick={handleAutoSelectByCognitiveLevels}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Tự động chọn {targetTotalQuestions} câu theo cấu hình mức độ
              </button>
            </div>
          </div>

          {/* Chế độ Giám sát bài thi */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Chế độ Giám sát bài thi &amp; Chống gian lận
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={proctoringEnabled}
                  onChange={(e) => setProctoringEnabled(e.target.checked)}
                  className="rounded text-indigo-600 accent-indigo-600"
                />
                <span className="font-bold text-slate-800">
                  {proctoringEnabled ? 'Đang kích hoạt giám sát' : 'Tắt giám sát ca thi'}
                </span>
              </label>
            </div>

            {proctoringEnabled ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Chế độ 1: Chống gian lận và khóa bài thi */}
                  <div
                    onClick={() => {
                      setProctoringMode('strict_lock');
                      soundService.playClick();
                    }}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      proctoringMode === 'strict_lock'
                        ? 'bg-rose-50/60 border-rose-500 shadow-xs ring-2 ring-rose-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                          <Lock className="w-4 h-4 text-rose-600" />
                          <span>Chế độ 1: Chống gian lận và khóa bài thi</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Khóa tự động
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Phát hiện chuyển tab, mất tiêu điểm, thoát toàn màn hình. Khi đạt ngưỡng vi phạm cấu hình, hệ thống tự động lưu bài làm và khóa màn hình thi.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                      <p>• Phân biệt sự cố kỹ thuật (mất mạng/reconnect không bị tính vi phạm).</p>
                      <p>• Đồng hồ tiếp tục đếm ngược theo thời gian thực máy chủ khi bị khóa.</p>
                      <p>• Giáo viên có thể mở khóa từ xa hoặc cấp mã PIN bảo mật.</p>
                    </div>
                  </div>

                  {/* Chế độ 2: Chỉ chống gian lận */}
                  <div
                    onClick={() => {
                      setProctoringMode('monitor_only');
                      soundService.playClick();
                    }}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      proctoringMode === 'monitor_only'
                        ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-2 ring-blue-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span>Chế độ 2: Chỉ chống gian lận</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Ghi nhật ký &amp; Cảnh báo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Theo dõi và ghi nhận đầy đủ sự kiện tương tự. Hiển thị cảnh báo trực tiếp cho học sinh nhưng không khóa bài thi, không yêu cầu mã PIN.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                      <p>• Học sinh nhận thông báo vi phạm và tiếp tục làm bài không gián đoạn.</p>
                      <p>• Toàn bộ nhật ký và số lần vi phạm được tổng hợp gửi giáo viên.</p>
                      <p>• Phù hợp với các bài ôn tập định kỳ hoặc kiểm tra nhanh 15 phút.</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Parameters for Mode 1 */}
                {proctoringMode === 'strict_lock' && (
                  <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-3 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">
                          Ngưỡng vi phạm kích hoạt khóa bài thi:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Học sinh sẽ bị khóa bài thi ngay khi số lần rời màn hình đạt ngưỡng này
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {([1, 2, 3] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setLockThreshold(t)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                              lockThreshold === t
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {t} lần vi phạm
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PIN Config */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">
                          Mã PIN xác thực mở khóa ca thi (Phía giáo viên):
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Dùng để mở khóa trực tiếp tại chỗ cho học sinh hoặc mở khóa từ xa
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type={showPin ? 'text' : 'password'}
                            value={unlockPin}
                            onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                          title={showPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={generateRandomPin}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Sinh mã mới</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic">
                Ca thi đang ở chế độ làm bài tự do, không giám sát hành vi chuyển tab hoặc toàn màn hình.
              </p>
            )}

            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowReview}
                  onChange={(e) => setAllowReview(e.target.checked)}
                  className="rounded text-indigo-600 accent-indigo-600"
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Bước 2: Chọn câu hỏi cho Khối {grade}
                </h2>
                <p className="text-xs text-slate-500">
                  Đã chọn: <span className="font-bold text-indigo-600">{selectedQuestionIds.length} câu</span> · Tổng điểm: <span className="font-mono font-bold text-indigo-700">{currentTotalPoints.toFixed(2)}đ</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoSelectByCognitiveLevels}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Chọn theo mức độ ({targetTotalQuestions} câu)
                </button>

                <button
                  type="button"
                  onClick={handleSelectAllGradeQuestions}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Chọn tất cả {gradeQuestions.length} câu
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

            {/* Cognitive Level Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Lọc theo mức độ:
              </span>
              <button
                type="button"
                onClick={() => setFilterLevel('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterLevel === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({gradeQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterLevel('recognition')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterLevel === 'recognition'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Nhận biết ({selectedByLevelCount.recognition}/{cognitiveConfig.recognition || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterLevel('comprehension')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterLevel === 'comprehension'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                Thông hiểu ({selectedByLevelCount.comprehension}/{cognitiveConfig.comprehension || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterLevel('application')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterLevel === 'application'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Vận dụng ({selectedByLevelCount.application}/{cognitiveConfig.application || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterLevel('high_application')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterLevel === 'high_application'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Vận dụng cao ({selectedByLevelCount.high_application}/{cognitiveConfig.high_application || 0})
              </button>
            </div>
          </div>

          {/* List of Grade Questions to select */}
          <div className="space-y-3">
            {gradeQuestions
              .filter((q) => (filterLevel === 'all' ? true : q.cognitiveLevel === filterLevel))
              .map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                const levelConfig = COGNITIVE_LEVEL_INFO[q.cognitiveLevel] || {
                  label: q.cognitiveLevel,
                  badge: 'bg-slate-100 text-slate-700',
                  color: 'text-slate-700',
                  border: 'border-slate-200',
                };

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
                    <div className="flex flex-wrap items-center justify-between text-xs mb-2 gap-2">
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
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelConfig.badge} ${levelConfig.border}`}
                        >
                          {levelConfig.label}
                        </span>
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
                Mã đề: <span className="font-mono font-bold text-slate-700">{code}</span> · Thời gian: {durationMinutes} phút · Khối {grade} · Thang điểm: {targetTotalPoints}đ
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

          {/* Cognitive Breakdown Summary of the Selected Questions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <p className="text-emerald-800 font-bold">Nhận biết</p>
              <p className="text-lg font-bold text-emerald-900 font-mono">
                {selectedByLevelCount.recognition} câu
              </p>
              <p className="text-[10px] text-emerald-700">
                {selectedQuestionsData.length > 0
                  ? ((selectedByLevelCount.recognition / selectedQuestionsData.length) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
              <p className="text-blue-800 font-bold">Thông hiểu</p>
              <p className="text-lg font-bold text-blue-900 font-mono">
                {selectedByLevelCount.comprehension} câu
              </p>
              <p className="text-[10px] text-blue-700">
                {selectedQuestionsData.length > 0
                  ? ((selectedByLevelCount.comprehension / selectedQuestionsData.length) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <p className="text-amber-800 font-bold">Vận dụng</p>
              <p className="text-lg font-bold text-amber-900 font-mono">
                {selectedByLevelCount.application} câu
              </p>
              <p className="text-[10px] text-amber-700">
                {selectedQuestionsData.length > 0
                  ? ((selectedByLevelCount.application / selectedQuestionsData.length) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
              <p className="text-rose-800 font-bold">Vận dụng cao</p>
              <p className="text-lg font-bold text-rose-900 font-mono">
                {selectedByLevelCount.high_application} câu
              </p>
              <p className="text-[10px] text-rose-700">
                {selectedQuestionsData.length > 0
                  ? ((selectedByLevelCount.high_application / selectedQuestionsData.length) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Exam Questions list in Preview */}
          <div className="space-y-4">
            {selectedQuestionsData.map((q, idx) => {
              const lvl = COGNITIVE_LEVEL_INFO[q.cognitiveLevel] || {
                label: q.cognitiveLevel,
                badge: 'bg-slate-100 text-slate-700',
              };
              return (
                <div key={q.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        Câu {idx + 1} ({q.points} điểm):
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lvl.badge}`}>
                        {lvl.label}
                      </span>
                    </div>
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamBuilderView;
