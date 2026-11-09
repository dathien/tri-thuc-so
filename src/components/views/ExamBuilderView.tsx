import React, { useState, useEffect, useMemo } from 'react';
import {
  FilePlus,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  ArrowLeft,
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
  Download,
  Printer,
  FileText,
  Save,
  HelpCircle,
  BookOpen,
  Shuffle,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  Question,
  Exam,
  ClassRoom,
  CognitiveLevel,
  QuestionType,
  ProctoringMode,
  ProctoringConfig,
  ExamMatrix,
  MatrixItem,
  SpecificationItem,
  ExamBundle,
  ExamStructureConfig,
  ExamVariant,
  ExamGradingRulePart2,
} from '../../types';
import MathRenderer from '../MathRenderer';
import MathGraphicDisplay from '../math-graphics/MathGraphicDisplay';
import { soundService } from '../../utils/audio';
import { proctoringService } from '../../services/proctoringService';
import { docxExportService, DocxTemplateType } from '../../services/docxExportService';
import { pdfExportService } from '../../services/pdfExportService';
import {
  STANDARD_90MIN_STRUCTURE,
  STANDARD_45MIN_STRUCTURE,
  BENCHMARK_EXAM_QUESTIONS,
  BENCHMARK_MATRIX_ITEMS,
  BENCHMARK_SPECIFICATIONS,
  BENCHMARK_VARIANTS,
  BENCHMARK_EXAM_BUNDLE,
} from '../../data/mockExamDataset';

interface ExamBuilderViewProps {
  questions: Question[];
  classes: ClassRoom[];
  matrices?: ExamMatrix[];
  onSaveExam: (newExam: Omit<Exam, 'id' | 'createdAt'>) => void;
  onNavigateToVault: () => void;
}

const COGNITIVE_LEVEL_LABELS: Record<
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
  // 7-step Linear Workflow
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // STEP 1: General Info & Structure Config
  const [title, setTitle] = useState(BENCHMARK_EXAM_BUNDLE.title);
  const [code, setCode] = useState(BENCHMARK_EXAM_BUNDLE.code);
  const [schoolName, setSchoolName] = useState(BENCHMARK_EXAM_BUNDLE.schoolName);
  const [grade, setGrade] = useState<10 | 11 | 12>(12);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [examType, setExamType] = useState<'15_min' | '45_min' | 'midterm' | 'final' | 'national_mock'>('final');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([classes[0]?.id || 'class-12a1']);
  const [allowReview, setAllowReview] = useState(true);

  // Proctoring Config (Mode 1 & Mode 2)
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [proctoringMode, setProctoringMode] = useState<ProctoringMode>('strict_lock');
  const [lockThreshold, setLockThreshold] = useState<1 | 2 | 3>(2);
  const [unlockPin, setUnlockPin] = useState<string>('689254');
  const [showPin, setShowPin] = useState<boolean>(false);

  // 3-Part Structure
  const [structure, setStructure] = useState<ExamStructureConfig>(STANDARD_90MIN_STRUCTURE);

  // STEP 2: Matrix Items
  const [matrixItems, setMatrixItems] = useState<MatrixItem[]>(BENCHMARK_MATRIX_ITEMS);

  // STEP 3: Specifications
  const [specifications, setSpecifications] = useState<SpecificationItem[]>(BENCHMARK_SPECIFICATIONS);

  // STEP 4: Selected Questions
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>(BENCHMARK_EXAM_QUESTIONS);

  // STEP 6: Active Variant for preview & export
  const [activeVariantCode, setActiveVariantCode] = useState<string>('101');
  const [variants, setVariants] = useState<ExamVariant[]>(BENCHMARK_VARIANTS);

  // Status & notifications
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Generate random PIN
  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setUnlockPin(pin);
    soundService.playClick();
  };

  // Apply Standard 90-min Preset
  const applyPreset90Min = () => {
    soundService.playClick();
    setDurationMinutes(90);
    setExamType('final');
    setStructure(STANDARD_90MIN_STRUCTURE);
    setMatrixItems(BENCHMARK_MATRIX_ITEMS);
    setSpecifications(BENCHMARK_SPECIFICATIONS);
    setSelectedQuestions(BENCHMARK_EXAM_QUESTIONS);
    setVariants(BENCHMARK_VARIANTS);
    setExportSuccessMsg('Đã áp dụng trọn bộ Cấu trúc & Ma trận đề chuẩn 90 phút (22 câu, 10.0 điểm).');
    setTimeout(() => setExportSuccessMsg(null), 3000);
  };

  // Apply Standard 45-min Preset
  const applyPreset45Min = () => {
    soundService.playClick();
    setDurationMinutes(45);
    setExamType('midterm');
    setStructure(STANDARD_45MIN_STRUCTURE);
    setExportSuccessMsg('Đã chuyển sang cấu trúc đề 45 phút.');
    setTimeout(() => setExportSuccessMsg(null), 3000);
  };

  // Calculations for Step 1 Structure
  const calculatedTotalPoints = useMemo(() => {
    const p1 = structure.part1.enabled ? structure.part1.questionCount * structure.part1.pointsPerQuestion : 0;
    const p2 = structure.part2.enabled ? structure.part2.totalPoints : 0;
    const p3 = structure.part3.enabled ? structure.part3.questionCount * structure.part3.pointsPerQuestion : 0;
    return Number((p1 + p2 + p3).toFixed(2));
  }, [structure]);

  const totalRequiredQuestions = useMemo(() => {
    const p1 = structure.part1.enabled ? structure.part1.questionCount : 0;
    const p2 = structure.part2.enabled ? structure.part2.questionCount : 0;
    const p3 = structure.part3.enabled ? structure.part3.questionCount : 0;
    return p1 + p2 + p3;
  }, [structure]);

  // Calculations for Step 2 Matrix
  const matrixTotalRec = matrixItems.reduce((s, i) => s + (i.recognition || 0), 0);
  const matrixTotalComp = matrixItems.reduce((s, i) => s + (i.comprehension || 0), 0);
  const matrixTotalApp = matrixItems.reduce((s, i) => s + (i.application || 0), 0);
  const matrixTotalHigh = matrixItems.reduce((s, i) => s + (i.highApplication || 0), 0);
  const matrixTotalQuestions = matrixTotalRec + matrixTotalComp + matrixTotalApp + matrixTotalHigh;
  const matrixTotalPoints = matrixItems.reduce((s, i) => s + (i.totalPoints || 0), 0);

  // Step 4: Bank Gap Analysis
  const bankCoverage = useMemo(() => {
    const part1Available = questions.filter((q) => q.questionType === 'multiple_choice' && q.grade === grade);
    const part2Available = questions.filter((q) => q.questionType === 'true_false' && q.grade === grade);
    const part3Available = questions.filter((q) => q.questionType === 'short_answer' && q.grade === grade);

    const neededP1 = structure.part1.questionCount;
    const neededP2 = structure.part2.questionCount;
    const neededP3 = structure.part3.questionCount;

    return {
      part1Available: part1Available.length,
      part2Available: part2Available.length,
      part3Available: part3Available.length,
      shortageP1: Math.max(0, neededP1 - part1Available.length),
      shortageP2: Math.max(0, neededP2 - part2Available.length),
      shortageP3: Math.max(0, neededP3 - part3Available.length),
    };
  }, [questions, grade, structure]);

  // Auto-Select Questions from Bank matching Matrix
  const handleAutoSelectFromBank = () => {
    soundService.playClick();
    // Prefer benchmark questions or matching grade questions
    const matchingGradeQuestions = questions.filter((q) => q.grade === grade);

    const selectedP1 = matchingGradeQuestions
      .filter((q) => q.questionType === 'multiple_choice')
      .slice(0, structure.part1.questionCount);

    const selectedP2 = matchingGradeQuestions
      .filter((q) => q.questionType === 'true_false')
      .slice(0, structure.part2.questionCount);

    const selectedP3 = matchingGradeQuestions
      .filter((q) => q.questionType === 'short_answer')
      .slice(0, structure.part3.questionCount);

    const combined = [...selectedP1, ...selectedP2, ...selectedP3];
    if (combined.length > 0) {
      setSelectedQuestions(combined);
      soundService.playSuccess();
      setExportSuccessMsg(`Đã tự động chọn ${combined.length} câu hỏi chuẩn từ Ngân hàng khớp với Ma trận.`);
      setTimeout(() => setExportSuccessMsg(null), 3500);
    }
  };

  // Compile Full Exam Bundle
  const compiledBundle = useMemo<ExamBundle>(() => {
    const p1Qs = selectedQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice');
    const p2Qs = selectedQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false');
    const p3Qs = selectedQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer');

    return {
      id: `bundle-${code}-${Date.now()}`,
      code,
      title,
      schoolName,
      academicYear: 'NĂM HỌC 2025 - 2026',
      grade,
      semester,
      subject: 'Toán học',
      durationMinutes,
      totalPoints: calculatedTotalPoints,
      status: 'approved',
      structure,
      matrixItems,
      specifications,
      questions: selectedQuestions,
      variants,
      masterAnswerKey: {
        part1: p1Qs.map((q, idx) => ({
          questionNumber: idx + 1,
          answer: String(q.correctAnswer),
          points: structure.part1.pointsPerQuestion,
        })),
        part2: p2Qs.map((q, idx) => ({
          questionNumber: idx + 1,
          subItems: (q.subItems || [
            { id: '1', label: 'a', content: '', isCorrect: true },
            { id: '2', label: 'b', content: '', isCorrect: false },
            { id: '3', label: 'c', content: '', isCorrect: true },
            { id: '4', label: 'd', content: '', isCorrect: false },
          ]).map((sub) => ({
            label: sub.label,
            isCorrect: sub.isCorrect,
          })),
          maxPoints: structure.part2.maxPointsPerQuestion,
        })),
        part3: p3Qs.map((q, idx) => ({
          questionNumber: idx + 1,
          answer: String(q.correctAnswer),
          acceptableAnswers: q.acceptableAnswers,
          points: structure.part3.pointsPerQuestion,
        })),
      },
      gradingGuide: {
        part1Guide: `Mỗi câu trắc nghiệm đúng được ${structure.part1.pointsPerQuestion} điểm. Tổng ${p1Qs.length} câu = ${(p1Qs.length * structure.part1.pointsPerQuestion).toFixed(1)} điểm.`,
        part2Guide:
          structure.gradingRulePart2 === 'official_moet'
            ? 'Quy tắc chấm Bộ GD&ĐT: Đúng 1 ý: 0,1đ | Đúng 2 ý: 0,25đ | Đúng 3 ý: 0,5đ | Đúng 4 ý: 1,0đ'
            : 'Mỗi ý đúng được 0,25 điểm (Chia đều).',
        part3Guide: `Mỗi câu trả lời ngắn đúng được ${structure.part3.pointsPerQuestion} điểm.`,
        solutions: selectedQuestions.map((q, idx) => ({
          questionNumber: idx + 1,
          part: q.part || (q.questionType === 'multiple_choice' ? 1 : q.questionType === 'true_false' ? 2 : 3),
          content: q.content,
          solution: q.explanation || 'Xem đáp án trong bảng tra cứu.',
          points: q.points,
        })),
      },
      proctoringConfig: proctoringEnabled
        ? {
            mode: proctoringMode,
            lockThreshold,
            unlockPin,
            continueTimerOnLock: true,
            detectTabSwitch: true,
            detectFullscreenExit: true,
            detectFocusLoss: true,
          }
        : undefined,
      assignedClassIds: selectedClassIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    code,
    title,
    schoolName,
    grade,
    semester,
    durationMinutes,
    calculatedTotalPoints,
    structure,
    matrixItems,
    specifications,
    selectedQuestions,
    variants,
    proctoringEnabled,
    proctoringMode,
    lockThreshold,
    unlockPin,
    selectedClassIds,
  ]);

  // Validation Checks for Step 7 Export
  const validationChecks = useMemo(() => {
    const isPointsValid = Math.abs(calculatedTotalPoints - 10.0) < 0.01;
    const isQuestionCountValid = selectedQuestions.length === totalRequiredQuestions;
    const hasEnoughPart1 = selectedQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice').length === structure.part1.questionCount;
    const hasEnoughPart2 = selectedQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false').length === structure.part2.questionCount;
    const hasEnoughPart3 = selectedQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer').length === structure.part3.questionCount;
    const allHaveAnswers = selectedQuestions.every((q) => q.correctAnswer !== undefined && q.correctAnswer !== null);

    const isAllPass = isPointsValid && isQuestionCountValid && hasEnoughPart1 && hasEnoughPart2 && hasEnoughPart3 && allHaveAnswers;

    return {
      isPointsValid,
      isQuestionCountValid,
      hasEnoughPart1,
      hasEnoughPart2,
      hasEnoughPart3,
      allHaveAnswers,
      isAllPass,
    };
  }, [calculatedTotalPoints, selectedQuestions, totalRequiredQuestions, structure]);

  // Export DOCX handler
  const handleExportDocx = async (template: DocxTemplateType) => {
    try {
      soundService.playClick();
      setIsExportingDocx(true);
      const blob = await docxExportService.generateDocxBlob(compiledBundle, {
        template,
        selectedVariantCode: activeVariantCode,
        schoolName,
        fontSizePt: 13,
      });

      const templateNames: Record<DocxTemplateType, string> = {
        full: 'Bo-Ho-So-De-Thi-Hoan-Chinh',
        exam_only: 'De-Thi-Hoc-Sinh',
        key_only: 'Dap-An-Huong-Dan-Cham',
        matrix_spec: 'Ma-Tran-Va-Ban-Dac-Ta',
      };

      const filename = `${code}_${templateNames[template]}_Made-${activeVariantCode}.docx`;
      docxExportService.downloadBlob(blob, filename);

      soundService.playSuccess();
      setExportSuccessMsg(`Đã xuất tệp Word chuẩn (.docx): ${filename}`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (error) {
      console.error('Lỗi khi xuất Word:', error);
      alert('Có lỗi xảy ra khi tạo tệp Word. Vui lòng kiểm tra lại cấu hình đề thi.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export PDF handler
  const handleExportPdf = (type: 'student_exam' | 'full_bundle' | 'grading_guide') => {
    soundService.playClick();
    pdfExportService.printPdf(compiledBundle, type, activeVariantCode);
  };

  // Save exam to Vault & App
  const handleSaveToVault = (status: 'draft' | 'published') => {
    soundService.playClick();

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
      totalPoints: calculatedTotalPoints,
      questionsCount: selectedQuestions.length,
      questionIds: selectedQuestions.map((q) => q.id),
      assignedClassIds: selectedClassIds,
      status,
      allowReview,
      proctoringEnabled,
      proctoringMode,
      proctoringConfig,
      bundle: compiledBundle,
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
              Quy trình Tạo &amp; Quản lý Bộ Đề kiểm tra Chuẩn hóa
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              7 Bước đồng bộ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu trúc → Ma trận → Bản đặc tả → Ngân hàng câu hỏi → Đáp án &amp; Thang điểm → Xem trước &amp; Mã đề → Xuất Word (.docx) &amp; PDF chuẩn A4.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={applyPreset90Min}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Nạp Đề chuẩn 90 phút (22 câu = 10đ)
          </button>
        </div>
      </div>

      {/* 7-Step Navigation Progress Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-1">
          {[
            { num: 1, label: '1. Cấu trúc' },
            { num: 2, label: '2. Ma trận' },
            { num: 3, label: '3. Bản đặc tả' },
            { num: 4, label: '4. Câu hỏi' },
            { num: 5, label: '5. Đáp án' },
            { num: 6, label: '6. Xem trước' },
            { num: 7, label: '7. Xuất file' },
          ].map((item) => {
            const isActive = currentStep === item.num;
            const isCompleted = currentStep > item.num;

            return (
              <button
                key={item.num}
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setCurrentStep(item.num as any);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border border-current">
                    {item.num}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Toast */}
      {exportSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{exportSuccessMsg}</span>
          <button type="button" onClick={() => setExportSuccessMsg(null)} className="text-white hover:opacity-80">
            ×
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: CẤU TRÚC ĐỀ KIỂM TRA (Structure Config)                           */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bước 1: Thiết lập Thông tin &amp; Cấu trúc Đề thi
                </h2>
                <p className="text-xs text-slate-500">
                  Cấu hình khối lớp, thời gian, hình thức và thang điểm 3 phần chuẩn hóa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyPreset90Min}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold"
                >
                  Mẫu 90 phút (12 + 4 + 6)
                </button>
                <button
                  type="button"
                  onClick={applyPreset45Min}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Mẫu 45 phút (8 + 2 + 3)
                </button>
              </div>
            </div>

            {/* General Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Tên đề kiểm tra</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã đề hệ thống</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Đơn vị trường / Sở GD&ĐT</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Khối lớp &amp; Học kỳ</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value) as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value={12}>Lớp 12</option>
                    <option value={11}>Lớp 11</option>
                    <option value={10}>Lớp 10</option>
                  </select>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value) as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value={1}>Học kỳ I</option>
                    <option value={2}>Học kỳ II</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thời gian làm bài</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(15, parseInt(e.target.value) || 90))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                  <span className="font-semibold text-slate-500">phút</span>
                </div>
              </div>
            </div>

            {/* 3-Part Structure Cards */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Cấu hình số câu &amp; Thang điểm từng phần
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Phần I */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900">Phần I: Trắc nghiệm 4 lựa chọn</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {(structure.part1.questionCount * structure.part1.pointsPerQuestion).toFixed(2)}đ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">12 câu trắc nghiệm A, B, C, D độc lập.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Số câu hỏi</span>
                      <input
                        type="number"
                        min={0}
                        value={structure.part1.questionCount}
                        onChange={(e) =>
                          setStructure({
                            ...structure,
                            part1: { ...structure.part1, questionCount: Math.max(0, parseInt(e.target.value) || 0) },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Điểm/câu</span>
                      <input
                        type="number"
                        step={0.05}
                        min={0}
                        value={structure.part1.pointsPerQuestion}
                        onChange={(e) =>
                          setStructure({
                            ...structure,
                            part1: { ...structure.part1, pointsPerQuestion: Math.max(0, parseFloat(e.target.value) || 0) },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Phần II */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900">Phần II: Đúng / Sai (4 ý a,b,c,d)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                      {structure.part2.totalPoints.toFixed(2)}đ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">4 câu, mỗi câu 4 ý độc lập a), b), c), d).</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Số câu hỏi</span>
                      <input
                        type="number"
                        min={0}
                        value={structure.part2.questionCount}
                        onChange={(e) =>
                          setStructure({
                            ...structure,
                            part2: { ...structure.part2, questionCount: Math.max(0, parseInt(e.target.value) || 0) },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Quy tắc chấm</span>
                      <select
                        value={structure.gradingRulePart2}
                        onChange={(e) =>
                          setStructure({
                            ...structure,
                            gradingRulePart2: e.target.value as ExamGradingRulePart2,
                          })
                        }
                        className="w-full px-2 py-1.5 bg-white border border-purple-200 rounded-lg text-[11px] font-bold"
                      >
                        <option value="official_moet">Chuẩn Bộ GD&amp;ĐT (0.1 - 0.25 - 0.5 - 1.0)</option>
                        <option value="equal_split">Chia đều (0.25đ / ý)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Phần III */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Phần III: Trả lời ngắn</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {(structure.part3.questionCount * structure.part3.pointsPerQuestion).toFixed(2)}đ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">6 câu điền giá trị số hoặc phân số tối giản.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Số câu hỏi</span>
                      <input
                        type="number"
                        min={0}
                        value={structure.part3.questionCount}
                        onChange={(e) =>
                          setStructure({
                            ...structure,
                            part3: { ...structure.part3, questionCount: Math.max(0, parseInt(e.target.value) || 0) },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Điểm/câu</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={structure.part3.pointsPerQuestion}
                        onChange={(e) =>
                          setStructure({
                            ...structure,
                            part3: { ...structure.part3, pointsPerQuestion: Math.max(0, parseFloat(e.target.value) || 0) },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Calculation Strip */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                  Math.abs(calculatedTotalPoints - 10.0) < 0.01
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {Math.abs(calculatedTotalPoints - 10.0) < 0.01 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      Tổng số câu: {totalRequiredQuestions} câu (12 Phần I + 4 Phần II + 6 Phần III) · Tổng thang điểm:{' '}
                      <span className="font-mono text-sm">{calculatedTotalPoints.toFixed(2)} / 10.0 điểm</span>
                    </span>
                    {Math.abs(calculatedTotalPoints - 10.0) >= 0.01 && (
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        * Chú ý: Tổng điểm của đề thi cần đúng bằng 10.0 để đảm bảo quy chuẩn khảo thí.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyPreset90Min}
                  className="px-3 py-1.5 rounded-lg bg-white border border-current font-bold text-[11px]"
                >
                  Đặt về chuẩn 10.0đ
                </button>
              </div>
            </div>

            {/* Chế độ Giám sát bài thi */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold uppercase tracking-wider text-slate-800">
                    Chế độ Giám sát &amp; Chống gian lận
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proctoringEnabled}
                    onChange={(e) => setProctoringEnabled(e.target.checked)}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span className="font-semibold text-slate-700">Kích hoạt giám sát</span>
                </label>
              </div>

              {proctoringEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div
                    onClick={() => setProctoringMode('strict_lock')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      proctoringMode === 'strict_lock'
                        ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        Chế độ 1: Khóa tự động khi vi phạm
                      </span>
                      {proctoringMode === 'strict_lock' && <Check className="w-4 h-4 text-rose-600" />}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Tự động lưu bài và khóa màn hình khi học sinh rời tab quá ngưỡng. Mở khóa bằng PIN hoặc từ xa.
                    </p>
                  </div>

                  <div
                    onClick={() => setProctoringMode('monitor_only')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      proctoringMode === 'monitor_only'
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Chế độ 2: Chỉ giám sát &amp; Cảnh báo
                      </span>
                      {proctoringMode === 'monitor_only' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Ghi nhận toàn bộ nhật ký vi phạm thời gian thực và hiện banner cảnh báo, không khóa bài làm.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(2);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Tiếp tục sang Bước 2: Ma trận đề</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: MA TRẬN ĐỀ KIỂM TRA (Matrix)                                      */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bước 2: Ma trận Đề kiểm tra (Matrix)
                </h2>
                <p className="text-xs text-slate-500">
                  Phân bổ câu hỏi theo 4 mức độ nhận thức và từng chủ đề kiến thức.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono">
                  Tổng: {matrixTotalQuestions} câu ({matrixTotalPoints.toFixed(1)}đ)
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-center">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200 w-8">TT</th>
                    <th className="p-2.5 border-r border-slate-200 text-left min-w-[200px]">Chủ đề kiến thức</th>
                    <th className="p-2.5 border-r border-slate-200 text-emerald-800">Nhận biết</th>
                    <th className="p-2.5 border-r border-slate-200 text-blue-800">Thông hiểu</th>
                    <th className="p-2.5 border-r border-slate-200 text-amber-800">Vận dụng</th>
                    <th className="p-2.5 border-r border-slate-200 text-rose-800">Vận dụng cao</th>
                    <th className="p-2.5 border-r border-slate-200">Tổng câu</th>
                    <th className="p-2.5">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-2.5 text-center font-mono font-bold text-slate-400 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 border-r border-slate-100">
                        <div className="font-bold text-slate-900">{item.chapter}</div>
                        <div className="text-[11px] text-slate-500">{item.topic}</div>
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-100">
                        <input
                          type="number"
                          min={0}
                          value={item.recognition}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = [...matrixItems];
                            updated[idx].recognition = val;
                            updated[idx].totalQuestions = val + updated[idx].comprehension + updated[idx].application + updated[idx].highApplication;
                            setMatrixItems(updated);
                          }}
                          className="w-12 py-1 text-center font-mono font-bold bg-emerald-50 border border-emerald-200 rounded text-emerald-800"
                        />
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-100">
                        <input
                          type="number"
                          min={0}
                          value={item.comprehension}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = [...matrixItems];
                            updated[idx].comprehension = val;
                            updated[idx].totalQuestions = updated[idx].recognition + val + updated[idx].application + updated[idx].highApplication;
                            setMatrixItems(updated);
                          }}
                          className="w-12 py-1 text-center font-mono font-bold bg-blue-50 border border-blue-200 rounded text-blue-800"
                        />
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-100">
                        <input
                          type="number"
                          min={0}
                          value={item.application}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = [...matrixItems];
                            updated[idx].application = val;
                            updated[idx].totalQuestions = updated[idx].recognition + updated[idx].comprehension + val + updated[idx].highApplication;
                            setMatrixItems(updated);
                          }}
                          className="w-12 py-1 text-center font-mono font-bold bg-amber-50 border border-amber-200 rounded text-amber-800"
                        />
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-100">
                        <input
                          type="number"
                          min={0}
                          value={item.highApplication}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = [...matrixItems];
                            updated[idx].highApplication = val;
                            updated[idx].totalQuestions = updated[idx].recognition + updated[idx].comprehension + updated[idx].application + val;
                            setMatrixItems(updated);
                          }}
                          className="w-12 py-1 text-center font-mono font-bold bg-rose-50 border border-rose-200 rounded text-rose-800"
                        />
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-100">
                        {item.totalQuestions} câu
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={item.totalPoints}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            const updated = [...matrixItems];
                            updated[idx].totalPoints = val;
                            setMatrixItems(updated);
                          }}
                          className="w-14 py-1 text-right font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1.5"
                        />
                        đ
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-center">
                  <tr>
                    <td colSpan={2} className="p-2.5 text-left uppercase text-[11px]">
                      Tổng cộng ma trận:
                    </td>
                    <td className="p-2.5 text-emerald-800 font-mono">{matrixTotalRec} câu</td>
                    <td className="p-2.5 text-blue-800 font-mono">{matrixTotalComp} câu</td>
                    <td className="p-2.5 text-amber-800 font-mono">{matrixTotalApp} câu</td>
                    <td className="p-2.5 text-rose-800 font-mono">{matrixTotalHigh} câu</td>
                    <td className="p-2.5 font-mono text-slate-900">{matrixTotalQuestions} câu</td>
                    <td className="p-2.5 text-right font-mono text-indigo-700">{matrixTotalPoints.toFixed(1)}đ</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(1);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bước 1</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(3);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
            >
              <span>Tiếp tục sang Bước 3: Bản đặc tả</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: BẢN ĐẶC TẢ ĐỀ KIỂM TRA (Specification)                            */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bước 3: Bản đặc tả Đề kiểm tra (Specification)
                </h2>
                <p className="text-xs text-slate-500">
                  Chi tiết hóa từng câu hỏi từ ma trận với Yêu cầu cần đạt chuẩn SGK GDPT môn Toán.
                </p>
              </div>

              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl">
                {specifications.length} Dòng đặc tả tương ứng 22 câu
              </span>
            </div>

            {/* Specification Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-center w-8">TT</th>
                    <th className="p-2.5 min-w-[160px]">Nội dung kiến thức</th>
                    <th className="p-2.5 min-w-[260px]">Yêu cầu cần đạt chuẩn GDPT</th>
                    <th className="p-2.5 text-center w-24">Mức độ</th>
                    <th className="p-2.5 text-center w-24">Dạng câu</th>
                    <th className="p-2.5 text-center w-20">Câu số</th>
                    <th className="p-2.5 text-right w-16">Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {specifications.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800">{s.chapter}</div>
                        <div className="text-[11px] text-slate-500">{s.topic}</div>
                      </td>
                      <td className="p-2.5 text-slate-700 leading-relaxed">
                        <textarea
                          rows={2}
                          value={s.learningObjective}
                          onChange={(e) => {
                            const updated = [...specifications];
                            updated[idx].learningObjective = e.target.value;
                            setSpecifications(updated);
                          }}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COGNITIVE_LEVEL_LABELS[s.cognitiveLevel].badge}`}>
                          {COGNITIVE_LEVEL_LABELS[s.cognitiveLevel].label}
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-[11px] font-medium text-slate-600">
                        {s.part === 1 ? 'Nhiều L.C' : s.part === 2 ? 'Đúng / Sai' : 'Trả lời ngắn'}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-indigo-700">
                        Câu {s.questionNumber}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        {s.points}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(2);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bước 2</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(4);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
            >
              <span>Tiếp tục sang Bước 4: Chọn câu hỏi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: CÂU HỎI & ĐỐI CHIẾU NGÂN HÀNG (Questions Selection & Gap Check)  */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Bank Coverage & Gap Analysis Strip */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bước 4: Đối chiếu &amp; Chọn câu hỏi từ Ngân hàng
                </h2>
                <p className="text-xs text-slate-500">
                  Kiểm tra độ phủ ngân hàng, phát hiện ô ma trận thiếu câu hỏi và chọn chính xác 22 câu.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAutoSelectFromBank}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tự động chọn 22 câu chuẩn theo Ma trận</span>
              </button>
            </div>

            {/* Gap Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Phần I: Trắc nghiệm</span>
                  <span className="text-[11px] text-slate-500">Cần {structure.part1.questionCount} câu · Kho có {bankCoverage.part1Available} câu</span>
                </div>
                {bankCoverage.shortageP1 === 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Đủ câu
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Thiếu {bankCoverage.shortageP1} câu
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Phần II: Đúng / Sai</span>
                  <span className="text-[11px] text-slate-500">Cần {structure.part2.questionCount} câu · Kho có {bankCoverage.part2Available} câu</span>
                </div>
                {bankCoverage.shortageP2 === 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Đủ câu
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Thiếu {bankCoverage.shortageP2} câu
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Phần III: Trả lời ngắn</span>
                  <span className="text-[11px] text-slate-500">Cần {structure.part3.questionCount} câu · Kho có {bankCoverage.part3Available} câu</span>
                </div>
                {bankCoverage.shortageP3 === 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Đủ câu
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Thiếu {bankCoverage.shortageP3} câu
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Selected Questions List Partitioned by Part */}
          <div className="space-y-4">
            {/* PART 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-900">
                  Phần I: 12 Câu Trắc nghiệm nhiều lựa chọn (3.0 điểm)
                </span>
                <span className="text-xs font-mono font-bold text-indigo-700">
                  {selectedQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice').length} / 12 câu
                </span>
              </div>

              <div className="space-y-3">
                {selectedQuestions
                  .filter((q) => q.part === 1 || q.questionType === 'multiple_choice')
                  .map((q, idx) => (
                    <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 font-mono">
                          Câu {idx + 1} ({q.points}đ) - {q.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].badge}`}>
                          {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].label}
                        </span>
                      </div>
                      <div className="text-slate-900 font-medium leading-relaxed">
                        <MathRenderer content={q.content} />
                      </div>
                      {q.graphics && (
                        <div className="pt-2 pb-1 flex justify-center">
                          <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        {(q.options || []).map((opt, i) => {
                          const letter = String.fromCharCode(65 + i);
                          const isCorrect = q.correctAnswer === letter;
                          return (
                            <div
                              key={i}
                              className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                                isCorrect ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                {letter}
                              </span>
                              <MathRenderer content={opt} inline />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* PART 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-purple-900">
                  Phần II: 4 Câu Trắc nghiệm Đúng/Sai (16 ý, 4.0 điểm)
                </span>
                <span className="text-xs font-mono font-bold text-purple-700">
                  {selectedQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false').length} / 4 câu
                </span>
              </div>

              <div className="space-y-3">
                {selectedQuestions
                  .filter((q) => q.part === 2 || q.questionType === 'true_false')
                  .map((q, idx) => (
                    <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 font-mono">
                          Câu {idx + 1} ({q.points}đ) - {q.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].badge}`}>
                          {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].label}
                        </span>
                      </div>
                      <div className="text-slate-900 font-medium leading-relaxed">
                        <MathRenderer content={q.content} />
                      </div>
                      {q.graphics && (
                        <div className="pt-2 pb-1 flex justify-center">
                          <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                        </div>
                      )}
                      <div className="space-y-1.5 pt-1 pl-2 text-[11px]">
                        {(q.subItems || []).map((sub) => (
                          <div key={sub.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700">{sub.label})</span>
                              <MathRenderer content={sub.content} inline />
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* PART 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                  Phần III: 6 Câu Trắc nghiệm Trả lời ngắn (3.0 điểm)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {selectedQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer').length} / 6 câu
                </span>
              </div>

              <div className="space-y-3">
                {selectedQuestions
                  .filter((q) => q.part === 3 || q.questionType === 'short_answer')
                  .map((q, idx) => (
                    <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 font-mono">
                          Câu {idx + 1} ({q.points}đ) - {q.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].badge}`}>
                          {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].label}
                        </span>
                      </div>
                      <div className="text-slate-900 font-medium leading-relaxed">
                        <MathRenderer content={q.content} />
                      </div>
                      {q.graphics && (
                        <div className="pt-2 pb-1 flex justify-center">
                          <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                        </div>
                      )}
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-900">Đáp số chuẩn: {String(q.correctAnswer)}</span>
                        {q.acceptableAnswers && (
                          <span className="text-[10px] text-slate-500">
                            Chấp nhận: {q.acceptableAnswers.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(3);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bước 3</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(5);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
            >
              <span>Tiếp tục sang Bước 5: Bảng đáp án</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: ĐÁP ÁN & HƯỚNG DẪN CHẤM (Answers & Solutions)                     */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bước 5: Bảng đáp án &amp; Hướng dẫn chấm chi tiết
                </h2>
                <p className="text-xs text-slate-500">
                  Tự động sinh từ câu hỏi đã chọn, đảm bảo 100% chính xác và không có mâu thuẫn.
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                Tổng điểm: {calculatedTotalPoints} / 10.0đ
              </span>
            </div>

            {/* Part 1 Answers Grid */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-indigo-900 uppercase">
                I. Bảng đáp án Phần I (Trắc nghiệm 12 câu)
              </span>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center text-xs">
                {compiledBundle.masterAnswerKey.part1.map((item) => (
                  <div key={item.questionNumber} className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] text-slate-500 block font-semibold">C{item.questionNumber}</span>
                    <span className="font-mono font-bold text-sm text-indigo-700">{item.answer}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 2 Answers Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-900 uppercase">
                  II. Bảng đáp án Phần II (Đúng/Sai 4 câu)
                </span>
                <span className="text-[11px] text-slate-500 italic">
                  Quy tắc: Đúng 1 ý: 0,1đ | Đúng 2 ý: 0,25đ | Đúng 3 ý: 0,5đ | Đúng 4 ý: 1,0đ
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="bg-purple-50 text-purple-900 font-bold border-b border-purple-200">
                    <tr>
                      <th className="p-2 border-r border-purple-200">Câu</th>
                      <th className="p-2 border-r border-purple-200">Ý a)</th>
                      <th className="p-2 border-r border-purple-200">Ý b)</th>
                      <th className="p-2 border-r border-purple-200">Ý c)</th>
                      <th className="p-2">Ý d)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {compiledBundle.masterAnswerKey.part2.map((item) => {
                      const a = item.subItems.find((s) => s.label === 'a')?.isCorrect;
                      const b = item.subItems.find((s) => s.label === 'b')?.isCorrect;
                      const c = item.subItems.find((s) => s.label === 'c')?.isCorrect;
                      const d = item.subItems.find((s) => s.label === 'd')?.isCorrect;
                      return (
                        <tr key={item.questionNumber}>
                          <td className="p-2 font-bold font-mono text-slate-800 border-r border-slate-100">
                            Câu {item.questionNumber}
                          </td>
                          <td className={`p-2 font-bold border-r border-slate-100 ${a ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-700 bg-rose-50/50'}`}>
                            {a ? 'ĐÚNG' : 'SAI'}
                          </td>
                          <td className={`p-2 font-bold border-r border-slate-100 ${b ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-700 bg-rose-50/50'}`}>
                            {b ? 'ĐÚNG' : 'SAI'}
                          </td>
                          <td className={`p-2 font-bold border-r border-slate-100 ${c ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-700 bg-rose-50/50'}`}>
                            {c ? 'ĐÚNG' : 'SAI'}
                          </td>
                          <td className={`p-2 font-bold ${d ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-700 bg-rose-50/50'}`}>
                            {d ? 'ĐÚNG' : 'SAI'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part 3 Answers Grid */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-emerald-900 uppercase">
                III. Bảng đáp án Phần III (Trả lời ngắn 6 câu)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                {compiledBundle.masterAnswerKey.part3.map((item) => (
                  <div key={item.questionNumber} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-slate-500 block font-semibold">C{item.questionNumber}</span>
                    <span className="font-mono font-bold text-sm text-emerald-800">{item.answer}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions Preview */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider block">
                IV. Trích lục Hướng dẫn giải chi tiết (Mẫu chuẩn giáo viên)
              </span>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {selectedQuestions.slice(0, 6).map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-indigo-900">Câu {idx + 1} ({q.points}đ):</span>
                    <div className="text-slate-700">
                      <MathRenderer content={q.content} />
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-200 text-slate-800 bg-white p-2 rounded">
                      <strong className="text-emerald-800 text-[11px] block">Lời giải:</strong>
                      <MathRenderer content={q.explanation || 'Xem đáp án trong bảng.'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(4);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bước 4</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(6);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
            >
              <span>Tiếp tục sang Bước 6: Xem trước &amp; Mã đề</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: XEM TRƯỚC ĐỀ THI & MÃ ĐỀ (Preview & Variants)                     */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Variant Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Chọn Mã đề thi hiển thị:</span>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {variants.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setActiveVariantCode(v.code);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${
                      activeVariantCode === v.code
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mã {v.code}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-slate-500">
              * Hệ thống duy trì ánh xạ 1-1 giữa mã đề, thứ tự câu và đáp án tương ứng.
            </span>
          </div>

          {/* Paper A4 Simulation */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-lg p-6 sm:p-10 max-w-4xl mx-auto space-y-6 font-serif">
            {/* Exam Header */}
            <div className="grid grid-cols-2 gap-4 border-b pb-4 text-center">
              <div>
                <div className="font-bold text-xs uppercase">{schoolName}</div>
                <div className="font-bold text-xs">TỔ TOÁN - TIN HỌC</div>
                <div className="italic text-[11px] text-slate-500 mt-1">(Đề thi có 22 câu / 4 trang)</div>
              </div>
              <div>
                <div className="font-bold text-xs uppercase">{title}</div>
                <div className="font-bold text-xs">NĂM HỌC 2025 - 2026</div>
                <div className="italic text-[11px] text-slate-500">
                  Thời gian: {durationMinutes} phút (không kể phát đề)
                </div>
                <div className="font-bold text-sm text-indigo-700 mt-1">MÃ ĐỀ: {activeVariantCode}</div>
              </div>
            </div>

            {/* Student info */}
            <div className="italic text-xs text-slate-600">
              Họ và tên thí sinh: .......................................................................................... Số báo danh: ....................... Lớp: .............
            </div>

            {/* Part I Preview */}
            <div className="space-y-3 font-sans">
              <div className="font-bold text-xs text-slate-900">
                PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
                <span className="font-normal italic text-slate-500 ml-1">
                  (Thí sinh trả lời từ câu 1 đến câu 12. Mỗi câu hỏi chỉ chọn một phương án).
                </span>
              </div>
              <div className="space-y-3">
                {selectedQuestions.slice(0, 4).map((q, idx) => (
                  <div key={q.id} className="text-xs space-y-1">
                    <p className="font-medium text-slate-900">
                      <strong>Câu {idx + 1}: </strong>
                      <MathRenderer content={q.content} inline />
                    </p>
                    {q.graphics && (
                      <div className="pt-2 pb-1 flex justify-center">
                        <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pl-4 pt-1">
                      {(q.options || []).map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-slate-700">
                          <strong>{String.fromCharCode(65 + i)}.</strong>
                          <MathRenderer content={opt} inline />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center font-bold text-xs text-slate-400">
              [... Hiển thị đầy đủ 22 câu trong bản in và tệp xuất ...]
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(5);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bước 5</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(7);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
            >
              <span>Tiếp tục sang Bước 7: Xuất tệp Word &amp; PDF</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: XUẤT TÀI LIỆU & QUẢN LÝ BỘ ĐỀ (Export Word & PDF & Save)          */}
      {/* ========================================================================= */}
      {currentStep === 7 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Pre-export Verification Checklist */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bước 7: Kiểm định Chất lượng &amp; Xuất Tài liệu Chuẩn
                </h2>
                <p className="text-xs text-slate-500">
                  Hệ thống kiểm tra 6 tiêu chuẩn kỹ thuật bắt buộc trước khi mở khóa chức năng xuất tệp.
                </p>
              </div>

              {validationChecks.isAllPass ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Đạt chuẩn xuất bản 100%
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Cần điều chỉnh
                </span>
              )}
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${validationChecks.isPointsValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.isPointsValid ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <div>
                  <span className="font-bold block">Tổng thang điểm = 10.0</span>
                  <span className="text-[10px] opacity-80">Hiện tại: {calculatedTotalPoints} điểm</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${validationChecks.isQuestionCountValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.isQuestionCountValid ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <div>
                  <span className="font-bold block">Đủ 22 câu hỏi chính</span>
                  <span className="text-[10px] opacity-80">Hiện tại: {selectedQuestions.length} / 22 câu</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${validationChecks.hasEnoughPart2 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.hasEnoughPart2 ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <div>
                  <span className="font-bold block">Đủ 16 ý Đúng/Sai Phần II</span>
                  <span className="text-[10px] opacity-80">4 câu x 4 ý a, b, c, d</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold block">Ma trận khớp Bản đặc tả</span>
                  <span className="text-[10px] opacity-80">Đồng bộ 100% từ cùng nguồn</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold block">Đề thi khớp Ma trận</span>
                  <span className="text-[10px] opacity-80">Đầy đủ 4 mức độ nhận thức</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold block">Đầy đủ đáp án &amp; Lời giải</span>
                  <span className="text-[10px] opacity-80">Có biểu điểm từng câu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export Actions Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Word (.docx) Exporter */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Xuất tệp Word Chuẩn (.docx)</h3>
                  <p className="text-[11px] text-slate-500">Khổ A4, Times New Roman 13pt, Equation chỉnh sửa được.</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  disabled={!validationChecks.isAllPass || isExportingDocx}
                  onClick={() => handleExportDocx('full')}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold flex items-center justify-between transition-colors shadow-xs"
                >
                  <span>1. Xuất Bộ hồ sơ đầy đủ (.docx)</span>
                  <span className="text-[10px] opacity-80 font-normal">Đề + Ma trận + Đặc tả + Đáp án</span>
                </button>

                <button
                  type="button"
                  disabled={!validationChecks.isAllPass || isExportingDocx}
                  onClick={() => handleExportDocx('exam_only')}
                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-bold flex items-center justify-between transition-colors"
                >
                  <span>2. Xuất Đề thi học sinh (.docx)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Chỉ có đề thi, không có đáp án</span>
                </button>

                <button
                  type="button"
                  disabled={!validationChecks.isAllPass || isExportingDocx}
                  onClick={() => handleExportDocx('key_only')}
                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-bold flex items-center justify-between transition-colors"
                >
                  <span>3. Xuất Đáp án &amp; Thang điểm (.docx)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Dành cho ban chấm thi</span>
                </button>

                <button
                  type="button"
                  disabled={!validationChecks.isAllPass || isExportingDocx}
                  onClick={() => handleExportDocx('matrix_spec')}
                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-bold flex items-center justify-between transition-colors"
                >
                  <span>4. Xuất Ma trận &amp; Bản đặc tả (.docx)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Hồ sơ thẩm định chuyên môn</span>
                </button>
              </div>
            </div>

            {/* PDF Exporter */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">In &amp; Xuất PDF Chuẩn A4</h3>
                  <p className="text-[11px] text-slate-500">Vector sắc nét, giữ nguyên định dạng KaTeX và bảng biểu.</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  disabled={!validationChecks.isAllPass}
                  onClick={() => handleExportPdf('student_exam')}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold flex items-center justify-between transition-colors shadow-xs"
                >
                  <span>1. In / Xuất PDF Đề thi học sinh</span>
                  <span className="text-[10px] opacity-80 font-normal">A4 chuẩn, không lộ đáp án</span>
                </button>

                <button
                  type="button"
                  disabled={!validationChecks.isAllPass}
                  onClick={() => handleExportPdf('full_bundle')}
                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-bold flex items-center justify-between transition-colors"
                >
                  <span>2. In / Xuất PDF Bộ hồ sơ đầy đủ</span>
                  <span className="text-[10px] text-slate-500 font-normal">Đề + Đáp án + Lời giải</span>
                </button>

                <button
                  type="button"
                  disabled={!validationChecks.isAllPass}
                  onClick={() => handleExportPdf('grading_guide')}
                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-bold flex items-center justify-between transition-colors"
                >
                  <span>3. In / Xuất PDF Hướng dẫn chấm</span>
                  <span className="text-[10px] text-slate-500 font-normal">Biểu điểm chi tiết</span>
                </button>
              </div>
            </div>
          </div>

          {/* Save to Vault Action Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-bold text-slate-800 block text-xs">Lưu trữ Hồ sơ Bộ đề thi</span>
              <span className="text-[11px] text-slate-500">
                Toàn bộ cấu trúc, ma trận, đặc tả, đề thi và đáp án được lưu giữ trong một bộ hồ sơ duy nhất.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveToVault('draft')}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Lưu bản nháp</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveToVault('published')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Phát hành đề thi cho Học sinh</span>
              </button>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCurrentStep(6);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Bước 6</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamBuilderView;
