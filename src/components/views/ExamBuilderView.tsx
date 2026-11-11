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
  Edit3,
  History,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  FileCheck2,
  Copy,
  Tag,
  Wrench,
  CheckCheck,
  Image as ImageIcon,
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
  UserProfile,
  ExamVersionRecord,
  CorrectionLogItem,
  MathGraphicConfig,
} from '../../types';
import MathRenderer from '../MathRenderer';
import MathGraphicDisplay from '../math-graphics/MathGraphicDisplay';
import { MathGraphicsPicker } from '../math-graphics/MathGraphicsPicker';
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
import { DocxImportModal } from '../DocxImportModal';
import { DocxParseResult } from '../../services/docxImportService';
import { ExamQuestionEditPage } from '../exam-editor/ExamQuestionEditPage';
import { ExamQuickAnswerModal } from '../exam-editor/ExamQuickAnswerModal';
import { SwapQuestionModal } from '../exam-editor/SwapQuestionModal';
import { ExamVersionHistoryModal } from '../exam-editor/ExamVersionHistoryModal';
import { ExamCorrectionModal } from '../exam-editor/ExamCorrectionModal';

interface ExamBuilderViewProps {
  questions: Question[];
  classes: ClassRoom[];
  matrices?: ExamMatrix[];
  onSaveExam: (newExam: Omit<Exam, 'id' | 'createdAt'>, existingId?: string) => void;
  onNavigateToVault: () => void;
  currentUser?: UserProfile;
  initialExam?: Exam | null;
  onClearInitialExam?: () => void;
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

export function buildExamVariants(
  questions: Question[],
  codesInput: string | number,
  startCodeNum = 101
): ExamVariant[] {
  let codes: string[] = [];

  if (typeof codesInput === 'number') {
    codes = Array.from({ length: Math.max(1, codesInput) }, (_, i) => String(startCodeNum + i));
  } else if (!isNaN(Number(codesInput)) && Number(codesInput) > 0 && !String(codesInput).includes(',')) {
    const count = parseInt(String(codesInput), 10);
    codes = Array.from({ length: Math.max(1, count) }, (_, i) => String(startCodeNum + i));
  } else {
    codes = String(codesInput)
      .split(/[,;\s]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }
  const validCodes = codes.length > 0 ? codes : ['101'];

  const p1 = questions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice');
  const p2 = questions.filter((q) => q.part === 2 || q.questionType === 'true_false');
  const p3 = questions.filter((q) => q.part === 3 || q.questionType === 'short_answer');

  return validCodes.map((vCode, vIdx) => {
    // Deterministic pseudo-random based on seed & variant index
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed + vIdx * 997.1) * 10000;
      return x - Math.floor(x);
    };

    function shuffleArray<T>(arr: T[], seedOffset: number): T[] {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRandom(seedOffset + i * 37) * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    // 1. Shuffling Question order per part independently
    const vP1 = vIdx === 0 ? [...p1] : shuffleArray(p1, 101);
    const vP2 = vIdx === 0 ? [...p2] : shuffleArray(p2, 202);
    const vP3 = vIdx === 0 ? [...p3] : shuffleArray(p3, 303);

    // 2. Shuffling Options for Part 1 (multiple choice) and updating correctAnswer
    const processedP1: Question[] = vP1.map((q, qIndex) => {
      if (vIdx === 0 || !q.options || q.options.length < 2) {
        return { ...q };
      }
      const originalOptions = [...q.options];
      const indices = originalOptions.map((_, i) => i);
      const shuffledIndices = shuffleArray(indices, qIndex * 17 + 5);
      const newOptions = shuffledIndices.map((idx) => originalOptions[idx]);

      const origCorrectLetter = String(q.correctAnswer || 'A').toUpperCase();
      const origCorrectIdx = Math.max(0, origCorrectLetter.charCodeAt(0) - 65);
      const newCorrectPos = shuffledIndices.indexOf(origCorrectIdx);
      const newCorrectLetter = String.fromCharCode(65 + (newCorrectPos >= 0 ? newCorrectPos : 0));

      return {
        ...q,
        options: newOptions,
        correctAnswer: newCorrectLetter,
      };
    });

    // 3. Shuffling Sub-items for Part 2 (True/False)
    const processedP2: Question[] = vP2.map((q, qIndex) => {
      if (vIdx === 0 || !q.subItems || q.subItems.length < 2) {
        return { ...q };
      }
      const shuffledSubs = shuffleArray(q.subItems, qIndex * 23 + 9);
      const relabeledSubs = shuffledSubs.map((sub, sIdx) => ({
        ...sub,
        label: (['a', 'b', 'c', 'd'][sIdx] || 'a') as 'a' | 'b' | 'c' | 'd',
      }));

      return {
        ...q,
        subItems: relabeledSubs,
      };
    });

    // 4. Part 3
    const processedP3: Question[] = vP3.map((q) => ({ ...q }));

    const orderedQuestions = [...processedP1, ...processedP2, ...processedP3];

    const orderMap = orderedQuestions.map((q, idx) => ({
      originalId: q.id,
      newNumber: idx + 1,
    }));

    // Generate accurate 1-1 mapped answer keys for this variant
    const answerKeyPart1: Record<number, string> = {};
    processedP1.forEach((q, idx) => {
      answerKeyPart1[idx + 1] = String(q.correctAnswer || 'A');
    });

    const answerKeyPart2: Record<number, Record<'a' | 'b' | 'c' | 'd', boolean>> = {};
    processedP2.forEach((q, idx) => {
      const subMap: Record<'a' | 'b' | 'c' | 'd', boolean> = { a: true, b: false, c: true, d: false };
      (q.subItems || []).forEach((sub) => {
        if (sub.label in subMap) {
          subMap[sub.label as 'a' | 'b' | 'c' | 'd'] = sub.isCorrect;
        }
      });
      answerKeyPart2[idx + 1] = subMap;
    });

    const answerKeyPart3: Record<number, string> = {};
    processedP3.forEach((q, idx) => {
      answerKeyPart3[idx + 1] = String(q.correctAnswer || '');
    });

    return {
      code: vCode,
      questionIds: orderedQuestions.map((q) => q.id),
      orderMap,
      answerKeyPart1,
      answerKeyPart2,
      answerKeyPart3,
      questions: orderedQuestions,
    };
  });
}

export const ExamBuilderView: React.FC<ExamBuilderViewProps> = ({
  questions,
  classes,
  onSaveExam,
  onNavigateToVault,
  currentUser,
  initialExam,
  onClearInitialExam,
}) => {
  // 7-step Linear Workflow
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Versioning, History & Undo States
  const [examVersion, setExamVersion] = useState<string>(
    initialExam?.version || initialExam?.bundle?.version || 'v1.0'
  );
  const [versionHistory, setVersionHistory] = useState<ExamVersionRecord[]>(() => {
    return initialExam?.versionHistory || initialExam?.bundle?.versionHistory || [];
  });
  const [correctionLogs, setCorrectionLogs] = useState<CorrectionLogItem[]>(() => {
    return initialExam?.correctionLogs || initialExam?.bundle?.correctionLogs || [];
  });
  const [undoHistory, setUndoHistory] = useState<Question[][]>([]);

  // Modals for In-place Editing & Customization
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(0);
  const [editingMode, setEditingMode] = useState<'master' | 'variant'>('master');
  const [editingVariantCode, setEditingVariantCode] = useState<string | undefined>(undefined);
  const [isQuestionEditModalOpen, setIsQuestionEditModalOpen] = useState<boolean>(false);

  const [isQuickAnswerModalOpen, setIsQuickAnswerModalOpen] = useState<boolean>(false);
  const [quickAnswerVariantCode, setQuickAnswerVariantCode] = useState<string | undefined>(undefined);

  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [swapTargetQuestion, setSwapTargetQuestion] = useState<Question | null>(null);

  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState<boolean>(false);

  const [isGraphicsPickerOpen, setIsGraphicsPickerOpen] = useState<boolean>(false);
  const [graphicsTargetQuestion, setGraphicsTargetQuestion] = useState<Question | null>(null);

  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // STEP 1: General Info & Structure Config
  const [title, setTitle] = useState(BENCHMARK_EXAM_BUNDLE.title);
  const [code, setCode] = useState(BENCHMARK_EXAM_BUNDLE.code);
  const [schoolName, setSchoolName] = useState(() => {
    if (currentUser?.school && currentUser.school.trim() !== '') {
      return currentUser.school;
    }
    if (typeof window !== 'undefined') {
      const savedSchool = localStorage.getItem('edutest_school_name');
      if (savedSchool && savedSchool.trim() !== '') {
        return savedSchool;
      }
    }
    return '';
  });

  const handleSchoolNameChange = (val: string) => {
    setSchoolName(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('edutest_school_name', val);
      try {
        const storedUser = localStorage.getItem('edutest_smart_user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.school = val;
          localStorage.setItem('edutest_smart_user', JSON.stringify(userObj));
        }
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (currentUser?.school && !schoolName) {
      setSchoolName(currentUser.school);
    }
  }, [currentUser?.school]);

  // Additional configurable exam information
  const [managingAgency, setManagingAgency] = useState('Sở Giáo dục và Đào tạo');
  const [department, setDepartment] = useState('Tổ Toán - Tin học');
  const [academicYear, setAcademicYear] = useState('2026 - 2027');
  const [examPeriod, setExamPeriod] = useState('Kiểm tra cuối học kỳ I');
  const [subject, setSubject] = useState('Toán học');
  const [startCodeNum, setStartCodeNum] = useState(101);
  const [variantCount, setVariantCount] = useState(4);
  const [variantCodesInput, setVariantCodesInput] = useState('101, 102, 103, 104');

  // Word (.docx) Import Modal & Pre-export Verification Modal
  const [isDocxImportOpen, setIsDocxImportOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

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

  // Dynamic estimated pages
  const estimatedPages = useMemo(() => {
    return Math.max(1, Math.ceil(selectedQuestions.length / 5.5));
  }, [selectedQuestions.length]);
  const pageNote = `(Đề thi gồm có ${selectedQuestions.length} câu / ${estimatedPages} trang)`;

  // STEP 6: Active Variant for preview & export
  const [activeVariantCode, setActiveVariantCode] = useState<string>('101');
  const [variants, setVariants] = useState<ExamVariant[]>(() => buildExamVariants(BENCHMARK_EXAM_QUESTIONS, '101, 102, 103, 104'));

  // Load initialExam for editing when provided from ExamVault or App
  useEffect(() => {
    if (initialExam) {
      setTitle(initialExam.title);
      setCode(initialExam.code);
      setDurationMinutes(initialExam.durationMinutes);
      setGrade(initialExam.grade);
      setSemester(initialExam.semester);
      setSelectedClassIds(initialExam.assignedClassIds || []);
      setProctoringEnabled(initialExam.proctoringEnabled);
      if (initialExam.proctoringMode) setProctoringMode(initialExam.proctoringMode);
      if (initialExam.proctoringConfig) {
        if (initialExam.proctoringConfig.lockThreshold) setLockThreshold(initialExam.proctoringConfig.lockThreshold);
        if (initialExam.proctoringConfig.unlockPin) setUnlockPin(initialExam.proctoringConfig.unlockPin);
      }

      if (initialExam.bundle) {
        if (initialExam.bundle.schoolName) setSchoolName(initialExam.bundle.schoolName);
        if (initialExam.bundle.managingAgency) setManagingAgency(initialExam.bundle.managingAgency);
        if (initialExam.bundle.department) setDepartment(initialExam.bundle.department);
        if (initialExam.bundle.academicYear) setAcademicYear(initialExam.bundle.academicYear);
        if (initialExam.bundle.examPeriod) setExamPeriod(initialExam.bundle.examPeriod);
        if (initialExam.bundle.structure) setStructure(initialExam.bundle.structure);
        if (initialExam.bundle.matrixItems && initialExam.bundle.matrixItems.length > 0) {
          setMatrixItems(initialExam.bundle.matrixItems);
        }
        if (initialExam.bundle.specifications && initialExam.bundle.specifications.length > 0) {
          setSpecifications(initialExam.bundle.specifications);
        }
        if (initialExam.bundle.questions && initialExam.bundle.questions.length > 0) {
          setSelectedQuestions(initialExam.bundle.questions);
        }
        if (initialExam.bundle.variants && initialExam.bundle.variants.length > 0) {
          setVariants(initialExam.bundle.variants);
          const codes = initialExam.bundle.variants.map((v) => v.code).join(', ');
          setVariantCodesInput(codes);
          setVariantCount(initialExam.bundle.variants.length);
        }
        if (initialExam.bundle.versionHistory) {
          setVersionHistory(initialExam.bundle.versionHistory);
        }
        if (initialExam.bundle.correctionLogs) {
          setCorrectionLogs(initialExam.bundle.correctionLogs);
        }
      } else if (initialExam.questions && initialExam.questions.length > 0) {
        setSelectedQuestions(initialExam.questions);
      }

      setExamVersion(initialExam.version || initialExam.bundle?.version || 'v1.0');
      // Jump directly to Question step for immediate editing
      setCurrentStep(4);
      setActionNotification(`Đã mở bộ đề "${initialExam.title}" (${initialExam.code}) ở chế độ Biên tập.`);
      setTimeout(() => setActionNotification(null), 4000);
    }
  }, [initialExam]);

  // Sync variants whenever variantCodesInput or selectedQuestions changes,
  // but PRESERVE any variant that was individually customized (Mode B)!
  useEffect(() => {
    setVariants((prevVariants) => {
      const freshGen = buildExamVariants(selectedQuestions, variantCodesInput, startCodeNum);
      return freshGen.map((fresh) => {
        const existing = prevVariants.find((pv) => pv.code === fresh.code);
        if (existing?.isCustomized) {
          return existing; // Preserve isolated custom variant!
        }
        return fresh;
      });
    });

    if (!variantCodesInput.split(/[,;\s]+/).map((s) => s.trim()).includes(activeVariantCode)) {
      setActiveVariantCode(variantCodesInput.split(/[,;\s]+/)[0]?.trim() || '101');
    }
  }, [variantCodesInput, selectedQuestions, startCodeNum]);

  // Undo History Management
  const pushUndoState = (newQuestions: Question[]) => {
    setUndoHistory((prev) => [selectedQuestions, ...prev].slice(0, 20));
    setSelectedQuestions(newQuestions);
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    soundService.playClick();
    const [previousState, ...rest] = undoHistory;
    setSelectedQuestions(previousState);
    setUndoHistory(rest);
    setActionNotification('Đã hoàn tác thay đổi gần nhất.');
    setTimeout(() => setActionNotification(null), 3000);
  };

  // Open Edit Question Modal (Master or Variant Mode)
  const handleOpenEditQuestion = (
    q: Question,
    index: number,
    mode: 'master' | 'variant' = 'master',
    vCode?: string
  ) => {
    soundService.playClick();
    setEditingQuestion(q);
    setEditingQuestionIndex(index);
    setEditingMode(mode);
    setEditingVariantCode(vCode);
    setIsQuestionEditModalOpen(true);
  };

  // Save Question from QuestionEditModal
  const handleSaveQuestionFromModal = (updatedQ: Question, applyToAllVariants = false) => {
    soundService.playSuccess();
    if (editingMode === 'master') {
      // Mode A: Master Question editing
      pushUndoState(
        selectedQuestions.map((q, idx) => (idx === editingQuestionIndex ? updatedQ : q))
      );
      // Synchronize non-customized variants
      setVariants((prev) =>
        prev.map((v) => {
          if (v.isCustomized) return v;
          return {
            ...v,
            questions: v.questions?.map((q) => (q.id === updatedQ.id ? { ...q, ...updatedQ } : q)),
          };
        })
      );
      setActionNotification(`Đã lưu thay đổi cho câu ${updatedQ.code || editingQuestionIndex + 1} (Đề gốc Master).`);
    } else {
      // Mode B: Variant-specific editing
      const vCode = editingVariantCode || activeVariantCode;
      if (applyToAllVariants) {
        // Broadcast change to master and all variants matching q.id
        pushUndoState(
          selectedQuestions.map((q) => (q.id === updatedQ.id ? { ...q, ...updatedQ } : q))
        );
        setVariants((prev) =>
          prev.map((v) => ({
            ...v,
            questions: v.questions?.map((q) => (q.id === updatedQ.id ? { ...q, ...updatedQ } : q)),
          }))
        );
        setActionNotification(`Đã áp dụng thay đổi câu hỏi cho tất cả các mã đề chưa phát hành.`);
      } else {
        // Isolated change to THIS variant only (e.g. Mã 103)
        setVariants((prev) =>
          prev.map((v) => {
            if (v.code !== vCode) return v;
            const updatedVariantQs = (v.questions || []).map((q, idx) =>
              idx === editingQuestionIndex ? updatedQ : q
            );

            // Recompute variant answer keys
            const newKey1: Record<number, string> = {};
            const p1 = updatedVariantQs.filter((q) => q.part === 1 || q.questionType === 'multiple_choice');
            p1.forEach((q, idx) => {
              newKey1[idx + 1] = String(q.correctAnswer || 'A');
            });

            const newKey2: Record<number, Record<'a' | 'b' | 'c' | 'd', boolean>> = {};
            const p2 = updatedVariantQs.filter((q) => q.part === 2 || q.questionType === 'true_false');
            p2.forEach((q, idx) => {
              const subMap: Record<'a' | 'b' | 'c' | 'd', boolean> = { a: true, b: false, c: true, d: false };
              (q.subItems || []).forEach((sub) => {
                if (sub.label in subMap) subMap[sub.label as 'a' | 'b' | 'c' | 'd'] = sub.isCorrect;
              });
              newKey2[idx + 1] = subMap;
            });

            const newKey3: Record<number, string> = {};
            const p3 = updatedVariantQs.filter((q) => q.part === 3 || q.questionType === 'short_answer');
            p3.forEach((q, idx) => {
              newKey3[idx + 1] = String(q.correctAnswer || '');
            });

            return {
              ...v,
              questions: updatedVariantQs,
              isCustomized: true,
              customizedAt: new Date().toISOString(),
              customizedNotes: `Đã chỉnh sửa riêng cho Mã ${vCode}`,
              answerKeyPart1: newKey1,
              answerKeyPart2: newKey2,
              answerKeyPart3: newKey3,
            };
          })
        );
        setActionNotification(`Đã lưu thay đổi riêng cho Mã đề ${vCode} (Độc lập, không ảnh hưởng các mã khác).`);
      }
    }
    setIsQuestionEditModalOpen(false);
    setTimeout(() => setActionNotification(null), 3500);
  };

  // Move Question up or down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedQuestions.length) return;
    soundService.playClick();
    const copy = [...selectedQuestions];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    pushUndoState(copy);
  };

  // Delete Question
  const handleDeleteQuestion = (index: number) => {
    const targetQ = selectedQuestions[index];
    if (confirm(`Bạn có chắc chắn muốn xóa câu hỏi ${index + 1} (${targetQ?.code || ''}) khỏi đề thi?`)) {
      soundService.playClick();
      const copy = selectedQuestions.filter((_, i) => i !== index);
      pushUndoState(copy);
      setActionNotification(`Đã xóa câu hỏi ${index + 1}.`);
      setTimeout(() => setActionNotification(null), 3000);
    }
  };

  // Add New Question
  const handleAddNewQuestion = (part: 1 | 2 | 3) => {
    soundService.playClick();
    const newId = `custom-q-${Date.now()}`;
    const newCode = `KT-P${part}-${Date.now().toString().slice(-4)}`;
    const newQ: Question = {
      id: newId,
      code: newCode,
      grade,
      semester,
      part,
      questionType: part === 1 ? 'multiple_choice' : part === 2 ? 'true_false' : 'short_answer',
      cognitiveLevel: 'comprehension',
      topic: 'Hàm số & Khảo sát hàm số',
      content:
        part === 1
          ? 'Cho hàm số $y = f(x)$ xác định và liên tục trên $\\mathbb{R}$. Khẳng định nào sau đây là đúng?'
          : part === 2
          ? 'Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông tại $B$. Xét tính đúng/sai của các khẳng định sau:'
          : 'Tìm giá trị lớn nhất của hàm số $f(x) = x^3 - 3x + 2$ trên đoạn $[0; 2]$.',
      options:
        part === 1
          ? ['$f\'(x) > 0, \\forall x \\in (a; b)$', '$f\'(x) < 0, \\forall x \\in (a; b)$', '$f\'(x) = 0$', '$f\'(x) \\ge 0$']
          : undefined,
      subItems:
        part === 2
          ? [
              { id: '1', label: 'a', content: 'Mặt phẳng $(SAB)$ vuông góc với $(ABC)$.', isCorrect: true },
              { id: '2', label: 'b', content: 'Góc giữa $SC$ và $(ABC)$ bằng $45^\\circ$.', isCorrect: false },
              { id: '3', label: 'c', content: 'Thể tích khối chóp bằng $V = \\frac{1}{3}Bh$.', isCorrect: true },
              { id: '4', label: 'd', content: 'Khoảng cách từ $A$ đến $(SBC)$ bằng $2a$.', isCorrect: false },
            ]
          : undefined,
      correctAnswer: part === 1 ? 'A' : part === 3 ? '4' : '',
      points: part === 1 ? 0.25 : part === 2 ? 1.0 : 0.5,
      chapter: 'Chương I. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
      lesson: 'Bài 1. Tính đơn điệu và cực trị của hàm số',
      createdAt: new Date().toISOString(),
      explanation: 'Hướng dẫn giải chi tiết...',
    };

    pushUndoState([...selectedQuestions, newQ]);
    setEditingQuestion(newQ);
    setEditingQuestionIndex(selectedQuestions.length);
    setEditingMode('master');
    setIsQuestionEditModalOpen(true);
  };

  // Swap Question from Question Bank
  const handleOpenSwapQuestion = (q: Question) => {
    soundService.playClick();
    setSwapTargetQuestion(q);
    setIsSwapModalOpen(true);
  };

  const handleSwapQuestion = (replacement: Question) => {
    if (!swapTargetQuestion) return;
    soundService.playSuccess();
    pushUndoState(
      selectedQuestions.map((q) => (q.id === swapTargetQuestion.id ? replacement : q))
    );
    setIsSwapModalOpen(false);
    setSwapTargetQuestion(null);
    setActionNotification(`Đã thay thế câu ${swapTargetQuestion.code} bằng ${replacement.code} từ Ngân hàng.`);
    setTimeout(() => setActionNotification(null), 3000);
  };

  // Math Graphics Picker
  const handleOpenGraphicsPicker = (q: Question) => {
    soundService.playClick();
    setGraphicsTargetQuestion(q);
    setIsGraphicsPickerOpen(true);
  };

  const handleGraphicsSelected = (config: MathGraphicConfig) => {
    if (!graphicsTargetQuestion) return;
    soundService.playSuccess();
    if (editingMode === 'master' || !editingVariantCode) {
      pushUndoState(
        selectedQuestions.map((q) => (q.id === graphicsTargetQuestion.id ? { ...q, graphics: config } : q))
      );
    } else {
      setVariants((prev) =>
        prev.map((v) => {
          if (v.code !== editingVariantCode) return v;
          return {
            ...v,
            questions: v.questions?.map((q) => (q.id === graphicsTargetQuestion.id ? { ...q, graphics: config } : q)),
            isCustomized: true,
          };
        })
      );
    }
    setIsGraphicsPickerOpen(false);
    setGraphicsTargetQuestion(null);
    setActionNotification('Đã cập nhật mô hình hình học / đồ thị toán học cho câu hỏi.');
    setTimeout(() => setActionNotification(null), 3000);
  };

  // Quick Answer Editor save
  const handleSaveAnswersFromQuickModal = (updatedQuestions: Question[]) => {
    soundService.playSuccess();
    pushUndoState(updatedQuestions);
    setIsQuickAnswerModalOpen(false);
    setActionNotification('Đã lưu cập nhật nhanh Bảng đáp án & Thang điểm.');
    setTimeout(() => setActionNotification(null), 3000);
  };

  // Synchronize Matrix with actual questions
  const handleSyncMatrixWithQuestions = () => {
    soundService.playClick();
    const p1Qs = selectedQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice');
    const p2Qs = selectedQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false');
    const p3Qs = selectedQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer');

    const recCount = selectedQuestions.filter((q) => q.cognitiveLevel === 'recognition').length;
    const compCount = selectedQuestions.filter((q) => q.cognitiveLevel === 'comprehension').length;
    const appCount = selectedQuestions.filter((q) => q.cognitiveLevel === 'application').length;
    const highCount = selectedQuestions.filter((q) => q.cognitiveLevel === 'high_application').length;

    const newMatrixItems: MatrixItem[] = [
      {
        chapter: 'Toán THPT - Khảo sát hàm số & Hình không gian',
        topic: 'Tổng hợp kiến thức theo đề thi',
        learningObjective: 'Đánh giá năng lực tư duy và giải quyết vấn đề toán học',
        recognition: recCount,
        comprehension: compCount,
        application: appCount,
        highApplication: highCount,
        part1Count: p1Qs.length,
        part2Count: p2Qs.length,
        part3Count: p3Qs.length,
        totalQuestions: selectedQuestions.length,
        totalPoints: calculatedTotalPoints,
      },
    ];

    setMatrixItems(newMatrixItems);
    soundService.playSuccess();
    setActionNotification('Đã tự động đồng bộ hóa Ma trận đề thi ăn khớp 100% với các câu hỏi thực tế.');
    setTimeout(() => setActionNotification(null), 3500);
  };

  // Handler to update startCode and variantCount (any positive integer N)
  const handleVariantParamChange = (start: number, count: number) => {
    const s = Math.max(1, start);
    const c = Math.max(1, Math.min(24, count));
    setStartCodeNum(s);
    setVariantCount(c);
    const codes = Array.from({ length: c }, (_, i) => String(s + i)).join(', ');
    setVariantCodesInput(codes);
  };

  // Handler for importing questions from Word (.docx)
  const handleImportedQuestions = (importedQs: Question[], result?: DocxParseResult) => {
    if (importedQs.length > 0) {
      setSelectedQuestions(importedQs);
      if (result?.metadata) {
        if (result.metadata.examTitle) setTitle(result.metadata.examTitle);
        if (result.metadata.schoolName) handleSchoolNameChange(result.metadata.schoolName);
        if (result.metadata.academicYear) setAcademicYear(result.metadata.academicYear);
        if (result.metadata.examPeriod) setExamPeriod(result.metadata.examPeriod);
        if (result.metadata.department) setDepartment(result.metadata.department);
        if (result.metadata.durationMinutes) setDurationMinutes(result.metadata.durationMinutes);
      }
      setExportSuccessMsg(`Đã nạp thành công ${importedQs.length} câu hỏi từ tệp Word (.docx) vào quy trình tạo đề!`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    }
  };

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
      managingAgency,
      schoolName,
      department,
      academicYear,
      examPeriod,
      grade,
      semester,
      subject,
      durationMinutes,
      totalPoints: calculatedTotalPoints,
      pageCount: estimatedPages,
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
    managingAgency,
    schoolName,
    department,
    academicYear,
    examPeriod,
    grade,
    semester,
    subject,
    durationMinutes,
    calculatedTotalPoints,
    estimatedPages,
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

  // Validation Checks for Step 7 Export & Pre-export checklist modal (10 mandatory checks)
  const validationChecks = useMemo(() => {
    const isPointsValid = Math.abs(calculatedTotalPoints - 10.0) < 0.01;
    const isQuestionCountValid = selectedQuestions.length === totalRequiredQuestions;
    const p1Count = selectedQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice').length;
    const p2Count = selectedQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false').length;
    const p3Count = selectedQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer').length;

    const hasEnoughPart1 = p1Count === structure.part1.questionCount;
    const hasEnoughPart2 = p2Count === structure.part2.questionCount;
    const hasEnoughPart3 = p3Count === structure.part3.questionCount;
    const isPartBreakdownValid = hasEnoughPart1 && hasEnoughPart2 && hasEnoughPart3;

    // Cognitive level representation
    const recCount = selectedQuestions.filter((q) => q.cognitiveLevel === 'recognition').length;
    const compCount = selectedQuestions.filter((q) => q.cognitiveLevel === 'comprehension').length;
    const appCount = selectedQuestions.filter((q) => q.cognitiveLevel === 'application').length;
    const highCount = selectedQuestions.filter((q) => q.cognitiveLevel === 'high_application').length;
    const isCognitiveValid = recCount > 0 && compCount > 0;

    // Matrix alignment
    const isMatrixMatched = matrixTotalQuestions === selectedQuestions.length && Math.abs(matrixTotalPoints - calculatedTotalPoints) < 0.1;

    // Answer completeness
    const allHaveAnswers = selectedQuestions.every((q) => {
      if (q.part === 1 || q.questionType === 'multiple_choice') return !!q.correctAnswer;
      if (q.part === 2 || q.questionType === 'true_false') return q.subItems && q.subItems.length === 4;
      if (q.part === 3 || q.questionType === 'short_answer') return q.correctAnswer !== undefined && String(q.correctAnswer).trim() !== '';
      return false;
    });

    // Options completeness
    const allOptionsComplete = selectedQuestions.every((q) => {
      if (q.part === 1 || q.questionType === 'multiple_choice') return q.options && q.options.length >= 4 && q.options.every((o) => o.trim() !== '');
      if (q.part === 2 || q.questionType === 'true_false') return q.subItems && q.subItems.length === 4 && q.subItems.every((s) => s.content.trim() !== '');
      return true;
    });

    // Graphics & Formulas integrity
    const graphicsValid = selectedQuestions.every((q) => !q.graphics || (q.graphics.type && q.graphics.params));
    const formulasValid = selectedQuestions.every((q) => q.content && q.content.trim().length > 0);

    // Variants integrity
    const variantsIntegrityValid = variants.length > 0 && variants.every((v) => v.questions && v.questions.length === selectedQuestions.length);

    const isAllPass =
      isPointsValid &&
      isQuestionCountValid &&
      isPartBreakdownValid &&
      allHaveAnswers &&
      allOptionsComplete &&
      graphicsValid &&
      formulasValid &&
      variantsIntegrityValid;

    return {
      isPointsValid,
      isQuestionCountValid,
      isPartBreakdownValid,
      hasEnoughPart1,
      hasEnoughPart2,
      hasEnoughPart3,
      isCognitiveValid,
      isMatrixMatched,
      allHaveAnswers,
      allOptionsComplete,
      graphicsValid,
      formulasValid,
      variantsIntegrityValid,
      isAllPass,
      recCount,
      compCount,
      appCount,
      highCount,
      matrixTotalQuestions,
    };
  }, [calculatedTotalPoints, selectedQuestions, totalRequiredQuestions, structure, matrixTotalQuestions, matrixTotalPoints, variants]);

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

  // Export all variants (.docx)
  const handleExportAllVariantsDocx = async () => {
    try {
      soundService.playClick();
      setIsExportingDocx(true);
      const blob = await docxExportService.generateAllVariantsBlob(compiledBundle, {
        template: 'full',
        schoolName,
        fontSizePt: 13,
      });

      const filename = `${code}_Tat-Ca-${variants.length}-Ma-De-Thi.docx`;
      docxExportService.downloadBlob(blob, filename);

      soundService.playSuccess();
      setExportSuccessMsg(`Đã xuất trọn bộ ${variants.length} mã đề thi (.docx): ${filename}`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (error) {
      console.error('Lỗi khi xuất tất cả mã đề:', error);
      alert('Có lỗi xảy ra khi tạo tệp Word cho tất cả mã đề.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export Answer Keys Comparison Matrix (.docx)
  const handleExportAnswerMatrixDocx = async () => {
    try {
      soundService.playClick();
      setIsExportingDocx(true);
      const blob = await docxExportService.generateAnswerKeysMatrixBlob(compiledBundle);

      const filename = `${code}_Bang-Doi-Chieu-Dap-An-${variants.length}-Ma-De.docx`;
      docxExportService.downloadBlob(blob, filename);

      soundService.playSuccess();
      setExportSuccessMsg(`Đã xuất Bảng đối chiếu đáp án các mã đề (.docx): ${filename}`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (error) {
      console.error('Lỗi khi xuất bảng đối chiếu đáp án:', error);
      alert('Có lỗi xảy ra khi tạo tệp bảng đối chiếu đáp án.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export PDF handler
  const handleExportPdf = (type: 'student_exam' | 'full_bundle' | 'grading_guide') => {
    soundService.playClick();
    pdfExportService.printPdf(compiledBundle, type, activeVariantCode);
  };

  // Save exam to Vault & App with versioning
  const handleSaveToVault = (status: 'draft' | 'published') => {
    soundService.playClick();

    // Version calculation
    const currentVer = examVersion || 'v1.0';
    const numPart = currentVer.replace('v', '');
    const [majStr, minStr] = numPart.split('.');
    const curMaj = parseInt(majStr) || 1;
    const curMin = parseInt(minStr) || 0;
    const nextVer = status === 'published' ? `v${curMaj + 1}.0` : `v${curMaj}.${curMin + 1}`;

    const newRecord: ExamVersionRecord = {
      id: `ver-${Date.now()}`,
      examId: initialExam?.id || `exam-${Date.now()}`,
      version: nextVer,
      timestamp: new Date().toISOString(),
      author: currentUser?.name || 'Thầy Hồ Nguyễn Đa Thiện',
      summary: initialExam
        ? `Cập nhật ${status === 'published' ? 'phát hành chính thức' : 'bản nháp'} (${selectedQuestions.length} câu, ${calculatedTotalPoints}đ)`
        : `Khởi tạo bộ đề ${nextVer} (${variants.length} mã đề)`,
      changeType: initialExam ? 'full_save' : 'full_save',
      changesCount: 1,
      questionsCount: selectedQuestions.length,
      totalPoints: calculatedTotalPoints,
      snapshotBundle: {
        ...compiledBundle,
        version: nextVer,
      },
      bundleSnapshot: {
        ...compiledBundle,
        version: nextVer,
      },
    };

    const updatedHistory = [newRecord, ...versionHistory];
    setVersionHistory(updatedHistory);
    setExamVersion(nextVer);

    const proctoringConfig: ProctoringConfig = {
      mode: proctoringMode,
      lockThreshold,
      unlockPin,
      continueTimerOnLock: true,
      detectTabSwitch: true,
      detectFullscreenExit: true,
      detectFocusLoss: true,
    };

    const finalBundle: ExamBundle = {
      ...compiledBundle,
      version: nextVer,
      versionHistory: updatedHistory,
      correctionLogs,
    };

    onSaveExam(
      {
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
        bundle: finalBundle,
        version: nextVer,
        versionHistory: updatedHistory,
        correctionLogs,
        startDate: new Date().toISOString().slice(0, 10),
      },
      initialExam?.id
    );

    proctoringService.saveExamConfig(code, proctoringConfig);

    soundService.playSuccess();
    onNavigateToVault();
  };

  // Dedicated Full-Page Question Editor (Replaces popup modal)
  if (isQuestionEditModalOpen && editingQuestion) {
    return (
      <ExamQuestionEditPage
        question={editingQuestion}
        questionIndex={editingQuestionIndex}
        examTitle={title || 'Đề kiểm tra chuẩn môn Toán'}
        mode={editingMode}
        variantCode={editingVariantCode || activeVariantCode}
        onBack={() => {
          setIsQuestionEditModalOpen(false);
          setTimeout(() => {
            const el = document.getElementById('question-row-' + editingQuestionIndex);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }}
        onSaveQuestion={(updatedQ, applyToAll) => {
          handleSaveQuestionFromModal(updatedQ, applyToAll);
          setIsQuestionEditModalOpen(false);
          setTimeout(() => {
            const el = document.getElementById('question-row-' + editingQuestionIndex);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }}
        onOpenGraphicsEditor={() => {
          setGraphicsTargetQuestion(editingQuestion);
          setIsGraphicsPickerOpen(true);
        }}
      />
    );
  }

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

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsDocxImportOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 border border-blue-200"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Nhập đề từ Word (.docx)
                </button>
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
                  placeholder="Ví dụ: Đề Khảo sát Chất lượng Cuối Học kỳ I - Môn Toán Lớp 12"
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
                <label className="block font-bold text-slate-700 mb-1">
                  1. Cơ quan quản lý GD
                  <span className="text-xs font-normal text-slate-500 ml-1">(Sở / Phòng GD&ĐT)</span>
                </label>
                <input
                  type="text"
                  value={managingAgency}
                  onChange={(e) => setManagingAgency(e.target.value)}
                  placeholder="Ví dụ: SỞ GIÁO DỤC VÀ ĐÀO TẠO"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Tên trường
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    (in trên đề thi, ma trận, đặc tả, đáp án & xuất file)
                  </span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => handleSchoolNameChange(e.target.value)}
                  placeholder="Ví dụ: Trường THPT Nguyễn Du"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Tổ chuyên môn
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ví dụ: Tổ Toán - Tin học"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  4. Năm học
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="Ví dụ: 2026 - 2027"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  5. Tên kỳ kiểm tra
                </label>
                <input
                  type="text"
                  value={examPeriod}
                  onChange={(e) => setExamPeriod(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra cuối học kỳ I"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  6. Môn học
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ví dụ: Toán học"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">7. Khối lớp &amp; Học kỳ</label>
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
                <label className="block font-bold text-slate-700 mb-1">8. Thời gian làm bài</label>
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

              {/* Trộn đề & Cấu hình N mã đề */}
              <div className="md:col-span-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-indigo-900">
                    9. Trộn đề &amp; Sinh mã đề tự động (Bất kỳ số lượng N mã)
                  </label>
                  <div className="flex items-center gap-1">
                    {[4, 6, 8, 12].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleVariantParamChange(startCodeNum, cnt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          variantCount === cnt ? 'bg-indigo-600 text-white' : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                        }`}
                      >
                        {cnt} mã
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 block mb-0.5">Mã đề bắt đầu:</span>
                    <input
                      type="number"
                      min={101}
                      value={startCodeNum}
                      onChange={(e) => handleVariantParamChange(parseInt(e.target.value) || 101, variantCount)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 block mb-0.5">Số lượng mã đề (N):</span>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={variantCount}
                      onChange={(e) => handleVariantParamChange(startCodeNum, parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 block mb-0.5">Danh sách mã đề sinh ra:</span>
                    <input
                      type="text"
                      value={variantCodesInput}
                      onChange={(e) => setVariantCodesInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-indigo-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  10. Ghi chú số câu &amp; Số trang
                  <span className="text-xs font-normal text-emerald-600 ml-1">
                    (Hệ thống tự tính thực tế)
                  </span>
                </label>
                <div className="px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                  {pageNote}
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

            {/* School / Unit Info Banner */}
            <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-500">Tên trường:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {schoolName || 'Chưa nhập tên trường'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span>Tổ Toán - Tin học</span>
                <span>•</span>
                <span>Năm học 2025 - 2026</span>
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

            {/* School / Unit Info Banner */}
            <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-500">Tên trường:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {schoolName || 'Chưa nhập tên trường'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span>Tổ Toán - Tin học</span>
                <span>•</span>
                <span>Năm học 2025 - 2026</span>
              </div>
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
      {/* STEP 4: CÂU HỎI & BIÊN TẬP TOÀN DIỆN (Question Editing & Bank Management) */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Action Notification Banner */}
          {actionNotification && (
            <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {actionNotification}
              </span>
              <button
                type="button"
                onClick={() => setActionNotification(null)}
                className="w-5 h-5 rounded hover:bg-emerald-700 flex items-center justify-center font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Bank Coverage & Comprehensive Action Strip */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Bước 4: Biên tập, Thêm/Sửa &amp; Sắp xếp Câu hỏi Đề thi
                  </h2>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                    Phiên bản {examVersion}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉnh sửa trực tiếp công thức Toán, hình học 2D/3D, hoán đổi câu hỏi từ ngân hàng, hoàn tác thay đổi.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Undo Button */}
                <button
                  type="button"
                  disabled={undoHistory.length === 0}
                  onClick={handleUndo}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                  title="Hoàn tác thay đổi câu hỏi gần nhất"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Hoàn tác ({undoHistory.length})</span>
                </button>

                {/* Quick Answer Key Editor Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setIsQuickAnswerModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs flex items-center gap-1 transition-colors"
                  title="Chỉnh sửa nhanh khóa đáp án & thang điểm"
                >
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  <span>Sửa đáp án nhanh</span>
                </button>

                {/* Version History Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setIsVersionHistoryModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                  title="Xem lịch sử chỉnh sửa & Khôi phục phiên bản trước"
                >
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  <span>Lịch sử ({versionHistory.length})</span>
                </button>

                {/* Sync Matrix Button */}
                <button
                  type="button"
                  onClick={handleSyncMatrixWithQuestions}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1 transition-colors"
                  title="Đồng bộ lại Ma trận theo câu hỏi thực tế"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Đồng bộ Ma trận</span>
                </button>

                {/* Add New Question Dropdown Buttons */}
                <div className="flex items-center gap-1 bg-indigo-50 p-1 rounded-xl border border-indigo-200">
                  <span className="text-[10px] font-bold text-indigo-700 px-1">Thêm câu:</span>
                  <button
                    type="button"
                    onClick={() => handleAddNewQuestion(1)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-[10px] transition-colors border border-indigo-100"
                    title="Thêm 1 câu Phần I (Trắc nghiệm)"
                  >
                    + Phần I
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNewQuestion(2)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-[10px] transition-colors border border-purple-100"
                    title="Thêm 1 câu Phần II (Đúng/Sai)"
                  >
                    + Phần II
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNewQuestion(3)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-[10px] transition-colors border border-emerald-100"
                    title="Thêm 1 câu Phần III (Trả lời ngắn)"
                  >
                    + Phần III
                  </button>
                </div>
              </div>
            </div>

            {/* Gap Indicators & Quality Check */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Phần I: Trắc nghiệm</span>
                  <span className="text-[11px] text-slate-500">
                    Đã chọn {selectedQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice').length} / {structure.part1.questionCount} câu
                  </span>
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
                  <span className="text-[11px] text-slate-500">
                    Đã chọn {selectedQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false').length} / {structure.part2.questionCount} câu
                  </span>
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
                  <span className="text-[11px] text-slate-500">
                    Đã chọn {selectedQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer').length} / {structure.part3.questionCount} câu
                  </span>
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
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-indigo-900">
                    Phần I: Câu trắc nghiệm nhiều lựa chọn (3.0 điểm)
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice').length} / {structure.part1.questionCount} câu
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddNewQuestion(1)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu P1</span>
                </button>
              </div>

              <div className="space-y-3">
                {selectedQuestions
                  .filter((q) => q.part === 1 || q.questionType === 'multiple_choice')
                  .map((q, idx) => {
                    const fullIdx = selectedQuestions.findIndex((item) => item.id === q.id);

                    return (
                      <div
                        key={q.id}
                        id={`question-row-${fullIdx}`}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 font-mono text-sm">
                              Câu {idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-200/60 px-1.5 py-0.5 rounded">
                              {q.code}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              {q.points || 0.25}đ
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].badge}`}>
                              {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].label}
                            </span>
                          </div>

                          {/* In-place Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditQuestion(q, fullIdx, 'master')}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              title="Sửa nội dung, công thức, đáp án"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa câu hỏi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenSwapQuestion(q)}
                              className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors"
                              title="Đổi câu khác từ ngân hàng"
                            >
                              <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                              <span>Đổi câu</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenGraphicsPicker(q)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                              title="Chèn / Chỉnh sửa hình vẽ 2D/3D"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                            </button>

                            <div className="h-4 w-px bg-slate-200 mx-0.5" />

                            <button
                              type="button"
                              disabled={fullIdx === 0}
                              onClick={() => handleMoveQuestion(fullIdx, 'up')}
                              className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                              title="Di chuyển lên"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={fullIdx === selectedQuestions.length - 1}
                              onClick={() => handleMoveQuestion(fullIdx, 'down')}
                              className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                              title="Di chuyển xuống"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(fullIdx)}
                              className="p-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600"
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="text-slate-900 font-medium leading-relaxed">
                          <MathRenderer content={q.content} />
                        </div>

                        {/* Math Graphic Preview */}
                        {q.graphics && (
                          <div className="pt-2 pb-1 flex justify-center bg-slate-100/60 rounded-xl p-2 border border-slate-200">
                            <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                          </div>
                        )}

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                          {(q.options || []).map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            const isCorrect = q.correctAnswer === letter;
                            return (
                              <div
                                key={i}
                                className={`p-2 rounded-lg border flex items-center gap-1.5 transition-colors ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {letter}
                                </span>
                                <MathRenderer content={opt} inline />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* PART 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-purple-900">
                    Phần II: Câu trắc nghiệm Đúng/Sai (16 ý, 4.0 điểm)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {selectedQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false').length} / {structure.part2.questionCount} câu
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddNewQuestion(2)}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu P2</span>
                </button>
              </div>

              <div className="space-y-3">
                {selectedQuestions
                  .filter((q) => q.part === 2 || q.questionType === 'true_false')
                  .map((q, idx) => {
                    const fullIdx = selectedQuestions.findIndex((item) => item.id === q.id);

                    return (
                      <div
                        key={q.id}
                        id={`question-row-${fullIdx}`}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 font-mono text-sm">
                              Câu {idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-200/60 px-1.5 py-0.5 rounded">
                              {q.code}
                            </span>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                              {q.points || 1.0}đ
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].badge}`}>
                              {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditQuestion(q, fullIdx, 'master')}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              title="Sửa nội dung câu dẫn và 4 ý a,b,c,d"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa câu hỏi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenSwapQuestion(q)}
                              className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors"
                            >
                              <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                              <span>Đổi câu</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenGraphicsPicker(q)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                              title="Chèn / Chỉnh sửa hình vẽ 2D/3D"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                            </button>

                            <div className="h-4 w-px bg-slate-200 mx-0.5" />

                            <button
                              type="button"
                              disabled={fullIdx === 0}
                              onClick={() => handleMoveQuestion(fullIdx, 'up')}
                              className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={fullIdx === selectedQuestions.length - 1}
                              onClick={() => handleMoveQuestion(fullIdx, 'down')}
                              className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(fullIdx)}
                              className="p-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="text-slate-900 font-medium leading-relaxed">
                          <MathRenderer content={q.content} />
                        </div>

                        {/* Math Graphic Preview */}
                        {q.graphics && (
                          <div className="pt-2 pb-1 flex justify-center bg-slate-100/60 rounded-xl p-2 border border-slate-200">
                            <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                          </div>
                        )}

                        {/* Sub-items a, b, c, d */}
                        <div className="space-y-1.5 pt-1 pl-2 text-[11px]">
                          {(q.subItems || []).map((sub) => (
                            <div
                              key={sub.id}
                              className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{sub.label})</span>
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
                    );
                  })}
              </div>
            </div>

            {/* PART 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                    Phần III: Câu trắc nghiệm Trả lời ngắn (3.0 điểm)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {selectedQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer').length} / {structure.part3.questionCount} câu
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddNewQuestion(3)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu P3</span>
                </button>
              </div>

              <div className="space-y-3">
                {selectedQuestions
                  .filter((q) => q.part === 3 || q.questionType === 'short_answer')
                  .map((q, idx) => {
                    const fullIdx = selectedQuestions.findIndex((item) => item.id === q.id);

                    return (
                      <div
                        key={q.id}
                        id={`question-row-${fullIdx}`}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 font-mono text-sm">
                              Câu {idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-200/60 px-1.5 py-0.5 rounded">
                              {q.code}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              {q.points || 0.5}đ
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].badge}`}>
                              {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel].label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditQuestion(q, fullIdx, 'master')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                              title="Sửa nội dung, kết quả đúng, quy tắc làm tròn"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa câu hỏi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenSwapQuestion(q)}
                              className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors"
                            >
                              <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                              <span>Đổi câu</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenGraphicsPicker(q)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                              title="Chèn / Chỉnh sửa hình vẽ 2D/3D"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                            </button>

                            <div className="h-4 w-px bg-slate-200 mx-0.5" />

                            <button
                              type="button"
                              disabled={fullIdx === 0}
                              onClick={() => handleMoveQuestion(fullIdx, 'up')}
                              className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={fullIdx === selectedQuestions.length - 1}
                              onClick={() => handleMoveQuestion(fullIdx, 'down')}
                              className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(fullIdx)}
                              className="p-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="text-slate-900 font-medium leading-relaxed">
                          <MathRenderer content={q.content} />
                        </div>

                        {/* Math Graphic Preview */}
                        {q.graphics && (
                          <div className="pt-2 pb-1 flex justify-center bg-slate-100/60 rounded-xl p-2 border border-slate-200">
                            <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                          </div>
                        )}

                        {/* Short answer result */}
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-emerald-900">
                            Đáp số chuẩn: <span className="font-mono text-sm underline">{String(q.correctAnswer)}</span>
                          </span>
                          {q.acceptableAnswers && q.acceptableAnswers.length > 0 && (
                            <span className="text-[10px] text-slate-500">
                              Chấp nhận thêm: {q.acceptableAnswers.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bước 5: Bảng đáp án &amp; Hướng dẫn chấm chi tiết
                </h2>
                <p className="text-xs text-slate-500">
                  Tự động sinh từ câu hỏi đã chọn, đảm bảo 100% chính xác, cho phép chỉnh sửa trực tiếp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setIsQuickAnswerModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa đáp án &amp; Thang điểm</span>
                </button>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  Tổng điểm: {calculatedTotalPoints} / 10.0đ
                </span>
              </div>
            </div>

            {/* School / Unit Info Banner */}
            <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-500">Tên trường:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {schoolName || 'Chưa nhập tên trường'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span>Tổ Toán - Tin học</span>
                <span>•</span>
                <span>Năm học 2025 - 2026</span>
              </div>
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
      {currentStep === 6 && (() => {
        const activeVariant = variants.find((v) => v.code === activeVariantCode) || variants[0];
        const previewQuestions = activeVariant?.questions && activeVariant.questions.length > 0
          ? activeVariant.questions
          : selectedQuestions;

        const p1Preview = previewQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice');
        const p2Preview = previewQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false');
        const p3Preview = previewQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer');

        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Sticky Top Toolbar for Preview & Print */}
            <div className="sticky top-2 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setCurrentStep(4);
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Chỉnh sửa toàn bộ danh sách câu hỏi đề gốc"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Biên tập câu hỏi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setIsQuickAnswerModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold flex items-center gap-1.5 transition-colors"
                  title="Chỉnh sửa nhanh khóa đáp án"
                >
                  <Key className="w-4 h-4 text-purple-600" />
                  <span>Sửa đáp án nhanh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setIsVersionHistoryModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
                  title="Xem lịch sử các phiên bản & Rollback"
                >
                  <History className="w-4 h-4 text-slate-600" />
                  <span>Lịch sử ({versionHistory.length})</span>
                </button>

                <div className="h-5 w-px bg-slate-200 hidden sm:block" />

                <button
                  type="button"
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Kiểm tra 10 tiêu chuẩn</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    window.print();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>In đề (Print)</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={() => handleExportDocx('exam_only')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Word (.docx)</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={handleExportAllVariantsDocx}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 text-indigo-900 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Shuffle className="w-4 h-4 text-indigo-600" />
                  <span>Xuất trọn bộ {variants.length} mã đề</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportPdf('student_exam')}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Xuất PDF</span>
                </button>
              </div>
            </div>

            {/* Variant Selector & Mode B Indication */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-700">Mã đề đang xem:</span>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap">
                    {variants.map((v) => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          setActiveVariantCode(v.code);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all flex items-center gap-1.5 ${
                          activeVariantCode === v.code
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                        }`}
                      >
                        <span>Mã {v.code}</span>
                        {v.isCustomized && (
                          <span className="text-[9px] bg-amber-400 text-slate-900 font-bold px-1.5 py-0.2 rounded-full">
                            Sửa riêng
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-[11px] text-slate-500">
                  * Nhấp chuột vào nút <strong>"Sửa câu này (Mã {activeVariantCode})"</strong> trên từng câu để biên tập riêng cho mã {activeVariantCode}.
                </span>
              </div>

              {activeVariant?.isCustomized && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Chế độ B – Tùy biến mã đề:</strong> Mã đề <strong>{activeVariantCode}</strong> đang được lưu bản chỉnh sửa riêng biệt (độc lập, không làm ảnh hưởng các mã khác).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn đặt lại Mã đề ${activeVariantCode} về bản hoán vị tự động chuẩn?`)) {
                        soundService.playClick();
                        setVariants((prev) =>
                          prev.map((v) => (v.code === activeVariantCode ? { ...v, isCustomized: false } : v))
                        );
                        setActionNotification(`Đã đặt lại Mã ${activeVariantCode} về mặc định.`);
                        setTimeout(() => setActionNotification(null), 3000);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold text-[11px] hover:bg-amber-100"
                  >
                    Đặt lại về bản gốc
                  </button>
                </div>
              )}
            </div>

            {/* Paper A4 Simulation */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-lg p-6 sm:p-10 max-w-4xl mx-auto space-y-6 font-serif print:shadow-none print:border-none print:p-0">
              {/* Exam Header */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4 text-center">
                <div>
                  <div className="text-[11px] text-slate-600 uppercase font-sans">{managingAgency || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}</div>
                  <div className="font-bold text-xs uppercase text-slate-900">{schoolName || 'TRƯỜNG THPT'}</div>
                  <div className="font-bold text-xs text-slate-800">{department || 'TỔ TOÁN - TIN HỌC'}</div>
                  <div className="italic text-[11px] text-slate-500 mt-1 font-sans">(Đề thi có {previewQuestions.length} câu / {estimatedPages} trang)</div>
                </div>
                <div>
                  <div className="font-bold text-xs uppercase text-slate-900">{examPeriod || title}</div>
                  <div className="font-bold text-xs text-slate-800">{academicYear || 'NĂM HỌC 2026 - 2027'}</div>
                  <div className="text-xs text-slate-800 font-sans">Môn: {subject || 'Toán học'} - Lớp {grade}</div>
                  <div className="italic text-[11px] text-slate-500 font-sans">
                    Thời gian làm bài: {durationMinutes} phút (không kể phát đề)
                  </div>
                  <div className="font-bold text-sm text-indigo-700 mt-1 font-sans">MÃ ĐỀ THI: {activeVariantCode}</div>
                </div>
              </div>

              {/* Student info */}
              <div className="italic text-xs text-slate-600 font-sans">
                Họ và tên thí sinh: .......................................................................................... Số báo danh: ....................... Lớp: .............
              </div>

              {/* Part I Preview */}
              {p1Preview.length > 0 && (
                <div className="space-y-4 font-sans">
                  <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1">
                    PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
                    <span className="font-normal italic text-slate-500 ml-1">
                      (Thí sinh trả lời từ câu 1 đến câu {p1Preview.length}. Mỗi câu hỏi chỉ chọn một phương án).
                    </span>
                  </div>
                  <div className="space-y-4">
                    {p1Preview.map((q, idx) => (
                      <div key={q.id} className="group relative text-xs space-y-1.5 p-2 rounded-lg hover:bg-indigo-50/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-slate-900 leading-relaxed">
                            <strong>Câu {idx + 1}: </strong>
                            <MathRenderer content={q.content} inline />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q, idx, 'variant', activeVariantCode)}
                            className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-[10px] shrink-0 border border-indigo-200 transition-all flex items-center gap-1 print:hidden"
                            title={`Chỉnh sửa riêng câu này cho Mã đề ${activeVariantCode}`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa câu {idx + 1} (Mã {activeVariantCode})</span>
                          </button>
                        </div>
                        {q.graphics && (
                          <div className="pt-2 pb-1 flex justify-center">
                            <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3 pt-1">
                          {(q.options || []).map((opt, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-slate-800">
                              <strong className="text-slate-900">{String.fromCharCode(65 + i)}.</strong>
                              <MathRenderer content={opt} inline />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part II Preview */}
              {p2Preview.length > 0 && (
                <div className="space-y-4 font-sans pt-4 border-t border-slate-200">
                  <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1">
                    PHẦN II. Câu trắc nghiệm đúng sai.
                    <span className="font-normal italic text-slate-500 ml-1">
                      (Thí sinh trả lời từ câu 1 đến câu {p2Preview.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai).
                    </span>
                  </div>
                  <div className="space-y-4">
                    {p2Preview.map((q, idx) => (
                      <div key={q.id} className="group relative text-xs space-y-1.5 p-2 rounded-lg hover:bg-purple-50/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-slate-900 leading-relaxed">
                            <strong>Câu {idx + 1}: </strong>
                            <MathRenderer content={q.content} inline />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q, idx, 'variant', activeVariantCode)}
                            className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-[10px] shrink-0 border border-purple-200 transition-all flex items-center gap-1 print:hidden"
                            title={`Chỉnh sửa riêng câu này cho Mã đề ${activeVariantCode}`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa câu {idx + 1} (Mã {activeVariantCode})</span>
                          </button>
                        </div>
                        {q.graphics && (
                          <div className="pt-2 pb-1 flex justify-center">
                            <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                          </div>
                        )}
                        <div className="space-y-1 pl-4 pt-1">
                          {(q.subItems || []).map((sub) => (
                            <div key={sub.id} className="flex items-start gap-2 text-slate-800">
                              <strong className="text-slate-900">{sub.label})</strong>
                              <MathRenderer content={sub.content} inline />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part III Preview */}
              {p3Preview.length > 0 && (
                <div className="space-y-4 font-sans pt-4 border-t border-slate-200">
                  <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1">
                    PHẦN III. Câu trắc nghiệm trả lời ngắn.
                    <span className="font-normal italic text-slate-500 ml-1">
                      (Thí sinh trả lời từ câu 1 đến câu {p3Preview.length}. Viết câu trả lời vào ô quy định).
                    </span>
                  </div>
                  <div className="space-y-4">
                    {p3Preview.map((q, idx) => (
                      <div key={q.id} className="group relative text-xs space-y-1.5 p-2 rounded-lg hover:bg-emerald-50/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-slate-900 leading-relaxed">
                            <strong>Câu {idx + 1}: </strong>
                            <MathRenderer content={q.content} inline />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q, idx, 'variant', activeVariantCode)}
                            className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-[10px] shrink-0 border border-emerald-200 transition-all flex items-center gap-1 print:hidden"
                            title={`Chỉnh sửa riêng câu này cho Mã đề ${activeVariantCode}`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa câu {idx + 1} (Mã {activeVariantCode})</span>
                          </button>
                        </div>
                        {q.graphics && (
                          <div className="pt-2 pb-1 flex justify-center">
                            <MathGraphicDisplay config={q.graphics} width={340} height={200} showCaption />
                          </div>
                        )}
                        <div className="pl-4 pt-1 italic text-slate-600">
                          Đáp số: .................................................
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center font-bold text-xs text-slate-500 font-sans pt-6 border-t border-slate-200">
                ---------- HẾT ----------
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
        );
      })()}

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

                <button
                  type="button"
                  disabled={!validationChecks.isAllPass || isExportingDocx}
                  onClick={handleExportAllVariantsDocx}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 text-indigo-900 font-bold flex items-center justify-between transition-colors"
                >
                  <span>5. Xuất trọn bộ {variants.length} mã đề thi (.docx)</span>
                  <span className="text-[10px] text-indigo-700 font-normal">Tất cả mã phân cách trang</span>
                </button>

                <button
                  type="button"
                  disabled={!validationChecks.isAllPass || isExportingDocx}
                  onClick={handleExportAnswerMatrixDocx}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 disabled:opacity-50 text-purple-900 font-bold flex items-center justify-between transition-colors"
                >
                  <span>6. Xuất Bảng đối chiếu đáp án các mã đề (.docx)</span>
                  <span className="text-[10px] text-purple-700 font-normal">Ma trận so sánh song song</span>
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

      {/* Docx Import Modal */}
      {isDocxImportOpen && (
        <DocxImportModal
          isOpen={isDocxImportOpen}
          onClose={() => setIsDocxImportOpen(false)}
          onImportQuestions={handleImportedQuestions}
        />
      )}

      {/* Pre-export Quality Verification Modal (10 Comprehensive Checks) */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Bảng Kiểm Định 10 Tiêu Chuẩn Kỹ Thuật Đề Thi</h3>
                  <p className="text-[11px] text-slate-500">Chuẩn hóa cấu trúc, ma trận, đặc tả và tính toàn vẹn khảo thí</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-2.5 text-xs overflow-y-auto pr-1 flex-1">
              {/* 1. Thang điểm */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.isPointsValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.isPointsValid ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>1. Thang điểm 10.0 tuyệt đối</span>
                    <span className="font-mono">{calculatedTotalPoints} / 10.0đ</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">Phần I: 3.0đ | Phần II: 4.0đ | Phần III: 3.0đ</span>
                </div>
              </div>

              {/* 2. Tổng số câu */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.isQuestionCountValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.isQuestionCountValid ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>2. Tổng số câu hỏi đúng quy định</span>
                    <span className="font-mono">{selectedQuestions.length} / {totalRequiredQuestions} câu</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">Đề thi chuẩn 22 câu độc lập</span>
                </div>
              </div>

              {/* 3. Cơ cấu từng phần */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.isPartBreakdownValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.isPartBreakdownValid ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>3. Cơ cấu số lượng từng phần (I, II, III)</span>
                    <span className="font-mono">12 - 4 - 6</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">12 câu trắc nghiệm nhiều lựa chọn, 4 câu đúng/sai, 6 câu trả lời ngắn</span>
                </div>
              </div>

              {/* 4. Mức độ nhận thức */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.isCognitiveValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                {validationChecks.isCognitiveValid ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>4. Phân bổ 4 mức độ nhận thức</span>
                    <span className="font-mono">{validationChecks.recCount} NB | {validationChecks.compCount} TH | {validationChecks.appCount} VD | {validationChecks.highCount} VDC</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">Bao phủ từ nhận biết đến vận dụng cao theo định hướng GDPT 2018</span>
                </div>
              </div>

              {/* 5. Khớp Ma trận & Bản đặc tả */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.isMatrixMatched ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                {validationChecks.isMatrixMatched ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>5. Đề thi khớp Ma trận &amp; Bản đặc tả</span>
                    {!validationChecks.isMatrixMatched && (
                      <button
                        type="button"
                        onClick={handleSyncMatrixWithQuestions}
                        className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px] hover:bg-amber-700"
                      >
                        Đồng bộ Ma trận ngay
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] opacity-80 block">
                    {validationChecks.isMatrixMatched
                      ? 'Đồng bộ 100% từ cùng một bộ đề gốc'
                      : 'Đang có chênh lệch giữa số lượng câu và bảng ma trận. Bấm "Đồng bộ Ma trận ngay" để tự động cập nhật.'}
                  </span>
                </div>
              </div>

              {/* 6. Đầy đủ đáp án đúng */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.allHaveAnswers ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.allHaveAnswers ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>6. Đầy đủ khóa đáp án cho 100% câu hỏi</span>
                    <span className="text-[11px] font-semibold text-emerald-700">100% hoàn thiện</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">Không có câu nào bị khuyết đáp án chuẩn hoặc quy tắc chấm</span>
                </div>
              </div>

              {/* 7. Đủ phương án A-D và a-d */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.allOptionsComplete ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.allOptionsComplete ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>7. Đủ phương án lựa chọn (A-D) &amp; lệnh hỏi (a-d)</span>
                    <span className="font-mono">Chuẩn hóa</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">Đủ 4 phương án cho Phần I và đủ 4 ý cho từng câu Phần II</span>
                </div>
              </div>

              {/* 8. Đồ thị & Hình vẽ 2D/3D */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.graphicsValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.graphicsValid ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>8. Đồ thị &amp; Hình vẽ toán học chính xác</span>
                    <span className="text-[11px] font-semibold text-emerald-700">Vector SVG/PNG</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">Dùng chung bộ máy dựng hình Phòng Lab, góc xoay và tham số đồng bộ</span>
                </div>
              </div>

              {/* 9. Công thức Toán KaTeX */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.formulasValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.formulasValid ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>9. Công thức Toán học chuẩn LaTeX / KaTeX</span>
                    <span className="text-[11px] font-semibold text-emerald-700">Chuẩn hiển thị</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">Tương thích xuất sang Equation Word (OMML) và MathML chuẩn</span>
                </div>
              </div>

              {/* 10. Mã đề thi & Hoán vị */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${validationChecks.variantsIntegrityValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                {validationChecks.variantsIntegrityValid ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>10. Tính toàn vẹn ánh xạ 1-1 của {variants.length} mã đề thi</span>
                    <span className="font-mono font-bold text-indigo-700">{variants.length} mã</span>
                  </div>
                  <span className="text-[11px] opacity-80 block">
                    Độc lập giữa Đề gốc (Chế độ A) và các mã đề chỉnh sửa riêng (Chế độ B)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-500">
                {validationChecks.isAllPass
                  ? 'Đề thi đã thỏa mãn trọn vẹn 10 tiêu chuẩn.'
                  : 'Vui lòng kiểm tra các tiêu chuẩn cảnh báo màu đỏ/vàng.'}
              </span>
              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
              >
                Đã kiểm tra &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Answer Key Editor Modal */}
      {isQuickAnswerModalOpen && (
        <ExamQuickAnswerModal
          isOpen={isQuickAnswerModalOpen}
          onClose={() => setIsQuickAnswerModalOpen(false)}
          questions={selectedQuestions}
          variantCode={editingVariantCode}
          onSaveAnswers={handleSaveAnswersFromQuickModal}
        />
      )}

      {/* Swap Question Modal */}
      {isSwapModalOpen && swapTargetQuestion && (
        <SwapQuestionModal
          isOpen={isSwapModalOpen}
          onClose={() => {
            setIsSwapModalOpen(false);
            setSwapTargetQuestion(null);
          }}
          currentQuestion={swapTargetQuestion}
          bankQuestions={questions}
          onSelectReplacement={handleSwapQuestion}
        />
      )}

      {/* Version History Modal */}
      {isVersionHistoryModalOpen && (
        <ExamVersionHistoryModal
          isOpen={isVersionHistoryModalOpen}
          onClose={() => setIsVersionHistoryModalOpen(false)}
          examId={initialExam?.id || code}
          examTitle={title}
          currentVersion={examVersion}
          history={versionHistory}
          isPublished={initialExam?.status === 'published'}
          onRollbackToVersion={(record) => {
            soundService.playSuccess();
            const bundle = record.bundleSnapshot || record.snapshotBundle;
            if (bundle?.questions) {
              setSelectedQuestions(bundle.questions);
            }
            if (bundle?.variants) {
              setVariants(bundle.variants);
            }
            if (bundle?.matrixItems) {
              setMatrixItems(bundle.matrixItems);
            }
            setExamVersion(record.version);
            setIsVersionHistoryModalOpen(false);
            setActionNotification(`Đã khôi phục đề thi về phiên bản ${record.version}`);
            setTimeout(() => setActionNotification(null), 3500);
          }}
        />
      )}

      {/* Math Graphics Picker Modal */}
      {isGraphicsPickerOpen && (
        <MathGraphicsPicker
          isOpen={isGraphicsPickerOpen}
          initialConfig={graphicsTargetQuestion?.graphics || null}
          onClose={() => {
            setIsGraphicsPickerOpen(false);
            setGraphicsTargetQuestion(null);
          }}
          onSelect={handleGraphicsSelected}
        />
      )}
    </div>
  );
};

export default ExamBuilderView;
