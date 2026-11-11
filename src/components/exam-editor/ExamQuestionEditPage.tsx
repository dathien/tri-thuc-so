import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Check,
  Save,
  X,
  Image as ImageIcon,
  Calculator,
  AlertTriangle,
  Eye,
  Edit3,
  HelpCircle,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  RotateCcw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { Question, CognitiveLevel, QuestionType, MathGraphicConfig } from '../../types';
import MathRenderer from '../MathRenderer';
import MathGraphicDisplay from '../math-graphics/MathGraphicDisplay';
import { MathGraphicsPicker } from '../math-graphics/MathGraphicsPicker';
import { createDefaultGraphic } from '../../services/mathGraphics/renderEngine';
import { soundService } from '../../utils/audio';

interface ExamQuestionEditPageProps {
  question: Question;
  questionIndex: number;
  examTitle?: string;
  mode: 'master' | 'variant';
  variantCode?: string;
  onBack: () => void;
  onSaveQuestion: (updatedQ: Question, applyToAllVariants?: boolean) => void;
  onOpenGraphicsEditor: (currentConfig?: MathGraphicConfig) => void;
}

export interface MathShortcutItem {
  label: string;
  insert: string;
  title: string;
  category: 'algebra' | 'vector' | 'calculus' | 'interval' | 'relation';
}

export const MATH_SHORTCUT_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'vector', label: 'Vectơ & Tọa độ' },
  { id: 'algebra', label: 'Đại số & Phân số' },
  { id: 'calculus', label: 'Giải tích & Giới hạn' },
  { id: 'interval', label: 'Khoảng & Đoạn' },
  { id: 'relation', label: 'Quan hệ & Ký hiệu' },
];

export const MATH_SHORTCUTS: MathShortcutItem[] = [
  // 1. Vectơ & Tọa độ
  { label: 'a⃗', insert: '\\vec{a}', title: 'Vectơ a', category: 'vector' },
  { label: 'b⃗', insert: '\\vec{b}', title: 'Vectơ b', category: 'vector' },
  { label: 'u⃗', insert: '\\vec{u}', title: 'Vectơ u', category: 'vector' },
  { label: 'v⃗', insert: '\\vec{v}', title: 'Vectơ v', category: 'vector' },
  { label: '0⃗', insert: '\\vec{0}', title: 'Vectơ 0', category: 'vector' },
  { label: 'AB⃗', insert: '\\vec{AB}', title: 'Vectơ AB', category: 'vector' },
  { label: '(x₀;y₀;z₀)', insert: '(x_0; y_0; z_0)', title: 'Tọa độ điểm', category: 'vector' },
  { label: '(4;-2;6)', insert: '(4; -2; 6)', title: 'Mẫu tọa độ không gian', category: 'vector' },

  // 2. Đại số & Lũy thừa
  { label: 'a/b', insert: '\\frac{a}{b}', title: 'Phân số', category: 'algebra' },
  { label: '√x', insert: '\\sqrt{x}', title: 'Căn bậc hai', category: 'algebra' },
  { label: 'ⁿ√x', insert: '\\sqrt[n]{x}', title: 'Căn bậc n', category: 'algebra' },
  { label: 'x²', insert: 'x^{2}', title: 'Lũy thừa / Số mũ', category: 'algebra' },
  { label: 'x₁', insert: 'x_{1}', title: 'Chỉ số dưới x₁', category: 'algebra' },
  { label: 'x₀', insert: 'x_{0}', title: 'Chỉ số x₀', category: 'algebra' },
  { label: '±', insert: '\\pm', title: 'Cộng trừ', category: 'algebra' },
  { label: 'Δ', insert: '\\Delta', title: 'Biệt thức Delta', category: 'algebra' },

  // 3. Giải tích & Giới hạn
  { label: "f'(x)", insert: "f'(x)", title: "Đạo hàm f'(x)", category: 'calculus' },
  { label: "y'", insert: "y'", title: "Đạo hàm y'", category: 'calculus' },
  { label: 'lim x→x₀', insert: '\\lim_{x \\to x_0}', title: 'Giới hạn tại x₀', category: 'calculus' },
  { label: 'lim x→+∞', insert: '\\lim_{x \\to +\\infty}', title: 'Giới hạn dương vô cực', category: 'calculus' },
  { label: 'lim x→-∞', insert: '\\lim_{x \\to -\\infty}', title: 'Giới hạn âm vô cực', category: 'calculus' },
  { label: '∫ᵇₐ', insert: '\\int_{a}^{b} f(x)\\,dx', title: 'Tích phân xác định', category: 'calculus' },
  { label: '∫', insert: '\\int f(x)\\,dx', title: 'Nguyên hàm', category: 'calculus' },
  { label: '∑', insert: '\\sum_{i=1}^{n}', title: 'Tổng sigma', category: 'calculus' },

  // 4. Khoảng & Đoạn
  { label: '+∞', insert: '+\\infty', title: 'Dương vô cực', category: 'interval' },
  { label: '-∞', insert: '-\\infty', title: 'Âm vô cực', category: 'interval' },
  { label: '(a; b)', insert: '(a; b)', title: 'Khoảng (a; b)', category: 'interval' },
  { label: '[a; b]', insert: '[a; b]', title: 'Đoạn [a; b]', category: 'interval' },
  { label: '[a; b)', insert: '[a; b)', title: 'Nửa khoảng [a; b)', category: 'interval' },
  { label: '(-∞; +∞)', insert: '(-\\infty; +\\infty)', title: 'Toàn trục số', category: 'interval' },

  // 5. Quan hệ & Ký hiệu
  { label: '≤', insert: '\\le', title: 'Nhỏ hơn hoặc bằng', category: 'relation' },
  { label: '≥', insert: '\\ge', title: 'Lớn hơn hoặc bằng', category: 'relation' },
  { label: '≠', insert: '\\ne', title: 'Khác', category: 'relation' },
  { label: '≈', insert: '\\approx', title: 'Xấp xỉ', category: 'relation' },
  { label: '∈', insert: '\\in', title: 'Thuộc', category: 'relation' },
  { label: '∉', insert: '\\notin', title: 'Không thuộc', category: 'relation' },
  { label: '⇔', insert: '\\Leftrightarrow', title: 'Tương đương', category: 'relation' },
  { label: '⇒', insert: '\\Rightarrow', title: 'Suy ra', category: 'relation' },
  { label: '⊥', insert: '\\perp', title: 'Vuông góc', category: 'relation' },
  { label: '∥', insert: '\\parallel', title: 'Song song', category: 'relation' },
  { label: 'π', insert: '\\pi', title: 'Số Pi', category: 'relation' },
  { label: 'α', insert: '\\alpha', title: 'Góc Alpha', category: 'relation' },
];

export const ExamQuestionEditPage: React.FC<ExamQuestionEditPageProps> = ({
  question,
  questionIndex,
  examTitle = 'Đề kiểm tra chuẩn môn Toán',
  mode,
  variantCode,
  onBack,
  onSaveQuestion,
  onOpenGraphicsEditor,
}) => {
  // Form states
  const [content, setContent] = useState<string>(question.content || '');
  const [options, setOptions] = useState<string[]>(
    question.options && question.options.length > 0
      ? [...question.options]
      : ['', '', '', '']
  );
  const [subItems, setSubItems] = useState(
    question.subItems && question.subItems.length > 0
      ? question.subItems.map((s) => ({ ...s }))
      : [
          { id: '1', label: 'a' as const, content: '', isCorrect: true },
          { id: '2', label: 'b' as const, content: '', isCorrect: false },
          { id: '3', label: 'c' as const, content: '', isCorrect: true },
          { id: '4', label: 'd' as const, content: '', isCorrect: false },
        ]
  );
  const [correctAnswer, setCorrectAnswer] = useState<string>(String(question.correctAnswer || 'A'));
  const [explanation, setExplanation] = useState<string>(question.explanation || '');
  const [points, setPoints] = useState<number>(question.points || 0.25);
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(
    question.cognitiveLevel || 'comprehension'
  );
  const [graphics, setGraphics] = useState<MathGraphicConfig | undefined>(question.graphics);
  const [acceptableAnswersText, setAcceptableAnswersText] = useState<string>(
    question.acceptableAnswers ? question.acceptableAnswers.join(', ') : ''
  );
  const [applyToAllVariants, setApplyToAllVariants] = useState<boolean>(false);

  // UI state
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('editor');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isGraphicsPickerModalOpen, setIsGraphicsPickerModalOpen] = useState<boolean>(false);
  const [selectedShortcutCategory, setSelectedShortcutCategory] = useState<string>('all');

  // References for cursor-position formula insertion
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const explanationTextareaRef = useRef<HTMLTextAreaElement>(null);
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeTarget, setActiveTarget] = useState<'content' | 'explanation' | { optionIdx: number }>('content');

  // Question part determination
  const partType: 1 | 2 | 3 =
    question.part ||
    (question.questionType === 'multiple_choice'
      ? 1
      : question.questionType === 'true_false'
      ? 2
      : 3);

  // Sync initial data
  useEffect(() => {
    setContent(question.content || '');
    setOptions(
      question.options && question.options.length > 0
        ? [...question.options]
        : ['', '', '', '']
    );
    setSubItems(
      question.subItems && question.subItems.length > 0
        ? question.subItems.map((s) => ({ ...s }))
        : [
            { id: '1', label: 'a', content: '', isCorrect: true },
            { id: '2', label: 'b', content: '', isCorrect: false },
            { id: '3', label: 'c', content: '', isCorrect: true },
            { id: '4', label: 'd', content: '', isCorrect: false },
          ]
    );
    setCorrectAnswer(String(question.correctAnswer || 'A'));
    setExplanation(question.explanation || '');
    setPoints(question.points || (partType === 1 ? 0.25 : partType === 2 ? 1.0 : 0.5));
    setCognitiveLevel(question.cognitiveLevel || 'comprehension');
    setGraphics(question.graphics);
    setAcceptableAnswersText(
      question.acceptableAnswers ? question.acceptableAnswers.join(', ') : ''
    );
    setIsDirty(false);
  }, [question]);

  // Helper to determine if cursor is already inside math mode ($...$)
  const isCursorInsideMath = (text: string, pos: number): boolean => {
    let count = 0;
    for (let i = 0; i < pos; i++) {
      if (text[i] === '$' && (i === 0 || text[i - 1] !== '\\')) {
        count++;
      }
    }
    return count % 2 === 1;
  };

  // Insert formula at exact cursor position without duplicate $ delimiters
  const insertFormulaAtCursor = (latexSnippet: string) => {
    soundService.playClick();
    setIsDirty(true);

    const getInsertion = (prev: string, start: number, end: number) => {
      const inside = isCursorInsideMath(prev, start);
      // If already inside math, insert snippet directly without duplicate $
      // If outside math, wrap snippet in $...$
      const insertText = inside ? latexSnippet : `$${latexSnippet}$`;
      const updated = prev.substring(0, start) + insertText + prev.substring(end);
      const newCursorPos = start + insertText.length;
      return { updated, newCursorPos };
    };

    if (activeTarget === 'content') {
      const el = contentTextareaRef.current;
      if (el) {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const prev = el.value;
        const { updated, newCursorPos } = getInsertion(prev, start, end);
        setContent(updated);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(newCursorPos, newCursorPos);
        }, 10);
      } else {
        const inside = isCursorInsideMath(content, content.length);
        setContent((prev) => (inside ? `${prev}${latexSnippet}` : `${prev} $${latexSnippet}$ `));
      }
    } else if (activeTarget === 'explanation') {
      const el = explanationTextareaRef.current;
      if (el) {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const prev = el.value;
        const { updated, newCursorPos } = getInsertion(prev, start, end);
        setExplanation(updated);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(newCursorPos, newCursorPos);
        }, 10);
      } else {
        const inside = isCursorInsideMath(explanation, explanation.length);
        setExplanation((prev) => (inside ? `${prev}${latexSnippet}` : `${prev} $${latexSnippet}$ `));
      }
    } else if (typeof activeTarget === 'object' && 'optionIdx' in activeTarget) {
      const idx = activeTarget.optionIdx;
      const el = optionInputRefs.current[idx];
      if (el) {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const prev = el.value;
        const { updated, newCursorPos } = getInsertion(prev, start, end);
        const nextOpts = [...options];
        nextOpts[idx] = updated;
        setOptions(nextOpts);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(newCursorPos, newCursorPos);
        }, 10);
      } else {
        const nextOpts = [...options];
        const optVal = nextOpts[idx] || '';
        const inside = isCursorInsideMath(optVal, optVal.length);
        nextOpts[idx] = inside ? `${optVal}${latexSnippet}` : `${optVal} $${latexSnippet}$`;
        setOptions(nextOpts);
      }
    }
  };

  // 1-Click Template: Benchmark Vector & Coordinate Question
  const handleLoadVectorBenchmark = () => {
    soundService.playSuccess();
    setContent(
      'Cho hai vectơ $\\vec{a}=(4;-2;6)$ và $\\vec{b}=(1;0;-2)$. Tọa độ của vectơ $2\\vec{a}-\\vec{b}$ là:'
    );
    setOptions([
      '$(7;-4;14)$',
      '$(3;-2;4)$',
      '$(5;-2;8)$',
      '$(3;-1;1)$',
    ]);
    setCorrectAnswer('A');
    setExplanation(
      'Ta có $2\\vec{a}=2(4;-2;6)=(8;-4;12)$. Do đó $2\\vec{a}-\\vec{b}=(8-1;-4-0;12-(-2))=(7;-4;14)$.'
    );
    setPoints(0.25);
    setCognitiveLevel('comprehension');
    setIsDirty(true);
  };

  // Missing Graphic / Variation Table Detection
  const isVariationTableMissing =
    !graphics &&
    /bảng biến thiên/i.test(content);

  const isGeneralGraphicMissing =
    !graphics &&
    !isVariationTableMissing &&
    /(hình vẽ|hình bên|đồ thị|hình chóp|lăng trụ|hình tròn xoay)/i.test(content);

  // Consistency Check Warnings
  const consistencyWarnings: string[] = [];
  if (isVariationTableMissing) {
    consistencyWarnings.push(
      'Câu hỏi đang thiếu bảng biến thiên hoặc hình minh họa cần thiết.'
    );
  }
  if (isGeneralGraphicMissing) {
    consistencyWarnings.push(
      'Nội dung câu hỏi có nhắc tới hình vẽ minh họa hoặc đồ thị nhưng chưa được đính kèm mô hình.'
    );
  }

  // Check if explanation mentions a letter different from correctAnswer
  if (partType === 1 && explanation) {
    const letters = ['A', 'B', 'C', 'D'];
    const matchedLetter = letters.find((l) =>
      new RegExp(`(chọn|đáp án|phương án)\\s+${l}\\b`, 'i').test(explanation)
    );
    if (matchedLetter && matchedLetter !== correctAnswer) {
      consistencyWarnings.push(
        `Lời giải đang nhắc đến phương án (${matchedLetter}) nhưng đáp án đúng đang chọn là (${correctAnswer}). Vui lòng kiểm tra lại.`
      );
    }
  }

  // Handle Save
  const handleSave = () => {
    soundService.playSuccess();
    const updated: Question = {
      ...question,
      content,
      options: partType === 1 ? options : undefined,
      subItems: partType === 2 ? subItems : undefined,
      correctAnswer:
        partType === 1
          ? correctAnswer
          : partType === 2
          ? subItems.map((s) => s.isCorrect)
          : correctAnswer,
      acceptableAnswers:
        partType === 3 && acceptableAnswersText.trim().length > 0
          ? acceptableAnswersText
              .split(/[,;\n]+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          : undefined,
      explanation,
      points: Number(points) || 0.25,
      cognitiveLevel,
      graphics,
    };

    setIsDirty(false);
    onSaveQuestion(updated, applyToAllVariants);
  };

  // Handle Back / Cancel
  const handleBackRequest = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      {/* Top Fixed Navigation & Status Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackRequest}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[14px] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách câu hỏi</span>
            </button>

            <div className="h-5 w-px bg-slate-300 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-slate-900 leading-tight">
                  {mode === 'master'
                    ? 'Biên tập câu hỏi – Đề gốc'
                    : `Biên tập câu hỏi – Mã ${variantCode || '101'}`}
                </h1>
                {mode === 'variant' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[13px] border border-amber-300">
                    Chế độ B (Mã {variantCode})
                  </span>
                )}
              </div>
              <div className="text-[13px] text-slate-500 font-medium">
                {examTitle} · Câu {questionIndex + 1} ({question.code || `ID: ${question.id}`})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[14px] font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'editor'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chế độ Soạn thảo
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chế độ Xem trước
              </button>
            </div>

            {/* Save Status Badge */}
            <div className="hidden md:flex items-center gap-1.5 text-[13px] font-medium">
              {isDirty ? (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã lưu tất cả thay đổi
                </span>
              )}
            </div>

            {/* Header Action Buttons */}
            <button
              type="button"
              onClick={handleBackRequest}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[14px] transition-colors"
            >
              Hủy chỉnh sửa
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] flex items-center gap-2 transition-all shadow-sm shadow-indigo-200 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Max width 1240px */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Warning Alert if Inconsistency or Missing Graphics */}
        {consistencyWarnings.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-[16px]">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Cảnh báo tính nhất quán và học liệu câu hỏi:</span>
            </div>
            <ul className="space-y-1.5 pl-7 list-disc text-[14px] text-amber-800 leading-relaxed font-medium">
              {consistencyWarnings.map((w, idx) => (
                <li key={idx}>
                  {w}
                  {w.includes('thiếu bảng biến thiên') && (
                    <button
                      type="button"
                      onClick={() => setIsGraphicsPickerModalOpen(true)}
                      className="ml-2 inline-flex items-center gap-1 text-indigo-700 underline font-bold hover:text-indigo-900 cursor-pointer"
                    >
                      <span>Mở công cụ vẽ dùng chung với Phòng Lab 2D/3D để bổ sung hình chính xác</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* =========================================================================
            KHU VỰC 1: NỘI DUNG CÂU HỎI
            KHU VỰC 2: CÔNG THỨC VÀ CÔNG CỤ SOẠN THẢO
           ========================================================================= */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[14px]">
                1
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">
                Nội dung câu hỏi
              </h2>
            </div>
            <span className="text-[13px] text-slate-500 font-medium">
              Nhập mã LaTeX giữa hai dấu <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-indigo-700">$...$</code> để kết xuất công thức chuẩn.
            </span>
          </div>

          {/* KHU VỰC 2: THANH CÔNG CỤ SOẠN THẢO CÔNG THỨC */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[14px] font-bold text-slate-700 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Thanh công cụ chèn công thức Toán học (chèn tại vị trí con trỏ):</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadVectorBenchmark}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[12px] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tải câu hỏi chuẩn Vectơ & Tọa độ để kiểm tra KaTeX"
                >
                  <span>Chèn mẫu Vectơ &amp; Tọa độ</span>
                </button>
                <span className="text-[13px] text-indigo-600 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
                  Đang chèn vào: {activeTarget === 'content' ? 'Nội dung câu hỏi' : activeTarget === 'explanation' ? 'Lời giải chi tiết' : `Phương án ${String.fromCharCode(65 + activeTarget.optionIdx)}`}
                </span>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap border-b border-slate-200 pb-2">
              {MATH_SHORTCUT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedShortcutCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                    selectedShortcutCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Shortcut Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {MATH_SHORTCUTS.filter(
                (item) => selectedShortcutCategory === 'all' || item.category === selectedShortcutCategory
              ).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  title={`${item.title} (${item.insert})`}
                  onClick={() => insertFormulaAtCursor(item.insert)}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-800 font-mono text-[14px] font-bold transition-all shadow-2xs hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="text-[12px] text-slate-400 italic">
              * Tự động nhận diện ngữ cảnh: Nếu con trỏ đã nằm trong cặp dấu $, hệ thống sẽ chèn trực tiếp không lặp dấu $.
            </div>
          </div>

          {/* Ô nhập nội dung câu hỏi */}
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-slate-700 block">
              Văn bản câu hỏi hoặc phát biểu bài toán (16px):
            </label>
            <textarea
              ref={contentTextareaRef}
              rows={4}
              value={content}
              onFocus={() => setActiveTarget('content')}
              onChange={(e) => {
                setContent(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Nhập nội dung câu hỏi... ví dụ: Cho hàm số $y = f(x)$ xác định và liên tục trên khoảng $(-\\infty; 0)$..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] leading-[1.6] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
            />
          </div>

          {/* Vùng xem trước công thức tức thì */}
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
            <div className="text-[13px] font-bold text-indigo-900 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Xem trước kết xuất công thức câu hỏi:</span>
            </div>
            <div className="text-[16px] leading-[1.6] text-slate-900 bg-white p-3 rounded-lg border border-indigo-200 min-h-[44px]">
              {content ? (
                <MathRenderer content={content} inline />
              ) : (
                <span className="text-slate-400 italic text-[14px]">Chưa có nội dung xem trước...</span>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            KHU VỰC 3: HÌNH HỌC, ĐỒ THỊ, BẢNG BIẾN THIÊN ĐÍNH KÈM
           ========================================================================= */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[14px]">
                3
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">
                Hình học, đồ thị, bảng biến thiên đính kèm
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGraphicsPickerModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{graphics ? 'Chỉnh sửa mô hình / BBT' : 'Mở công cụ vẽ Phòng Lab 2D/3D'}</span>
              </button>

              {graphics && (
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setGraphics(undefined);
                    setIsDirty(true);
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[14px] font-semibold flex items-center gap-1 transition-colors"
                  title="Xóa hình đính kèm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Gỡ hình</span>
                </button>
              )}
            </div>
          </div>

          {/* Graphics Display Card */}
          {graphics ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-6">
              <div className="shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <MathGraphicDisplay config={graphics} width={380} height={220} showCaption={false} />
              </div>

              <div className="space-y-2 text-slate-700 flex-1">
                <div className="text-[16px] font-bold text-indigo-950">
                  {graphics.title || 'Mô hình toán học đính kèm'}
                </div>
                <div className="text-[14px] text-slate-600">
                  <strong>Loại mô hình:</strong> {graphics.type === 'variation_table' ? 'Bảng biến thiên (BBT)' : graphics.type}
                </div>
                {graphics.caption && (
                  <div className="text-[13px] text-slate-500 italic">
                    Chú thích: {graphics.caption}
                  </div>
                )}
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-medium">
                  ✓ Mô hình được liên kết vĩnh viễn với ID câu hỏi, tự động giữ nguyên khi trộn mã đề và kết xuất Word/PDF.
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border ${isVariationTableMissing || isGeneralGraphicMissing ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'} space-y-2`}>
              <div className="flex items-center gap-2">
                <ImageIcon className={`w-5 h-5 ${isVariationTableMissing ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className={`text-[14px] font-semibold ${isVariationTableMissing ? 'text-amber-900' : 'text-slate-600'}`}>
                  {isVariationTableMissing
                    ? 'Câu hỏi đang thiếu bảng biến thiên hoặc hình minh họa cần thiết.'
                    : 'Chưa đính kèm hình vẽ hoặc bảng biến thiên cho câu hỏi này.'}
                </span>
              </div>
              <p className="text-[13px] text-slate-500 pl-7">
                Giáo viên có thể sử dụng bộ công cụ vẽ 7 danh mục dùng chung với Phòng Lab (Tam giác, hình chóp, lăng trụ, hàm bậc 3, hàm phân thức, bảng biến thiên, khối tròn xoay) để bổ sung chính xác.
              </p>
              <div className="pl-7 pt-1">
                <button
                  type="button"
                  onClick={() => setIsGraphicsPickerModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở công cụ vẽ dùng chung với Phòng Lab 2D/3D để bổ sung hình chính xác</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            KHU VỰC 4: PHƯƠNG ÁN TRẢ LỜI A, B, C, D (HOẶC a, b, c, d / KẾT QUẢ)
            KHU VỰC 5: ĐÁP ÁN ĐÚNG
           ========================================================================= */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[14px]">
                4 & 5
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">
                Phương án trả lời & Đáp án đúng
              </h2>
            </div>
            <span className="text-[13px] text-slate-500 font-medium">
              Font chữ nội dung: 16px. Mỗi phương án có ô nhập và vùng xem trước KaTeX độc lập.
            </span>
          </div>

          {/* DẠNG 1: TRẮC NGHIỆM NHIỀU LỰA CHỌN (PHẦN I) */}
          {partType === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-bold text-slate-800">
                  4 Phương án trả lời (A, B, C, D) – Chọn nút tròn để chỉ định đáp án đúng:
                </label>
                <span className="text-[13px] text-indigo-600 font-semibold">
                  Đáp án đúng hiện tại: <span className="font-bold text-emerald-700">Phương án {correctAnswer}</span>
                </span>
              </div>

              <div className="space-y-4">
                {options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrect = correctAnswer === letter;

                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isCorrect
                          ? 'bg-emerald-50/50 border-emerald-400 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio select correct answer */}
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                          <input
                            type="radio"
                            name="mcq_answer_group"
                            checked={isCorrect}
                            onChange={() => {
                              soundService.playClick();
                              setCorrectAnswer(letter);
                              setIsDirty(true);
                            }}
                            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[15px] ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {letter}
                          </span>
                        </label>

                        {/* Input for Option Text */}
                        <input
                          ref={(el) => {
                            optionInputRefs.current[i] = el;
                          }}
                          type="text"
                          value={opt}
                          onFocus={() => setActiveTarget({ optionIdx: i })}
                          onChange={(e) => {
                            const next = [...options];
                            next[i] = e.target.value;
                            setOptions(next);
                            setIsDirty(true);
                          }}
                          placeholder={`Nhập nội dung phương án ${letter}... ví dụ: $(-\\infty; 0)$`}
                          className={`flex-1 px-3.5 py-2 rounded-xl border text-[16px] text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                            isCorrect
                              ? 'bg-white border-emerald-400 font-semibold'
                              : 'bg-white border-slate-300'
                          }`}
                        />

                        {/* Button to insert formula shortcut into this option */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTarget({ optionIdx: i });
                            insertFormulaAtCursor('\\infty');
                          }}
                          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] border border-slate-200 transition-colors shrink-0"
                          title="Chèn công thức nhanh vào phương án này"
                        >
                          + Công thức
                        </button>
                      </div>

                      {/* Live Formula Preview for this Option */}
                      <div className="mt-2 pl-12 flex items-center gap-2 text-[14px]">
                        <span className="text-[13px] text-slate-400 font-medium">Xem trước:</span>
                        <div className="bg-white px-3 py-1 rounded-md border border-slate-200 text-[16px] font-medium text-slate-900 inline-block min-w-[80px]">
                          {opt ? (
                            <MathRenderer content={opt} inline />
                          ) : (
                            <span className="text-slate-300 italic text-[13px]">Trống</span>
                          )}
                        </div>
                        {isCorrect && (
                          <span className="ml-auto text-emerald-700 font-bold text-[13px] flex items-center gap-1">
                            <Check className="w-4 h-4 text-emerald-600" />
                            ĐÁP ÁN ĐÚNG
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI (PHẦN II) */}
          {partType === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-bold text-slate-800">
                  4 Ý hỏi Đúng / Sai (a, b, c, d) – Bấm nút ĐÚNG/SAI để xác định tính đúng đắn:
                </label>
                <span className="text-[13px] text-indigo-600 font-medium">
                  Chuẩn Bộ GD: 1 ý đúng = 0.1đ · 2 ý đúng = 0.25đ · 3 ý đúng = 0.5đ · 4 ý đúng = 1.0đ
                </span>
              </div>

              <div className="space-y-3">
                {subItems.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[15px] shrink-0">
                        {sub.label})
                      </span>

                      <input
                        type="text"
                        value={sub.content}
                        onChange={(e) => {
                          const next = [...subItems];
                          next[idx].content = e.target.value;
                          setSubItems(next);
                          setIsDirty(true);
                        }}
                        placeholder={`Nội dung mệnh đề ${sub.label}... ví dụ: Hàm số đồng biến trên khoảng $(0; 2)$`}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-[16px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          const next = [...subItems];
                          next[idx].isCorrect = !next[idx].isCorrect;
                          setSubItems(next);
                          setIsDirty(true);
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-[14px] transition-all cursor-pointer ${
                          sub.isCorrect
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        }`}
                      >
                        {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                      </button>
                    </div>

                    <div className="pl-10 flex items-center gap-2 text-[14px]">
                      <span className="text-[13px] text-slate-400 font-medium">Xem trước:</span>
                      <div className="bg-white px-3 py-1 rounded-md border border-slate-200 text-[16px] font-medium text-slate-900 inline-block min-w-[80px]">
                        {sub.content ? (
                          <MathRenderer content={sub.content} inline />
                        ) : (
                          <span className="text-slate-300 italic text-[13px]">Trống</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DẠNG 3: TRẮC NGHIỆM TRẢ LỜI NGẮN (PHẦN III) */}
          {partType === 3 && (
            <div className="space-y-4">
              <label className="text-[14px] font-bold text-slate-800 block">
                Thiết lập kết quả trả lời ngắn & các phương án tương đương:
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[14px] font-semibold text-slate-700 block">
                    Đáp số chuẩn (kết quả số hoặc biểu thức chính xác):
                  </label>
                  <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => {
                      setCorrectAnswer(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="ví dụ: 4 hoặc 0.5 hoặc -3/2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-[16px] font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="text-[13px] text-slate-500">
                    Xem trước kết xuất: <MathRenderer content={`$${correctAnswer || '?'}$`} inline />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[14px] font-semibold text-slate-700 block">
                    Các phương án tương đương được chấp nhận (cách nhau bởi dấu phẩy):
                  </label>
                  <input
                    type="text"
                    value={acceptableAnswersText}
                    onChange={(e) => {
                      setAcceptableAnswersText(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="ví dụ: 4.0, 4, 16/4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-[16px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="text-[13px] text-slate-500">
                    Dùng cho hệ thống chấm tự động khi học sinh viết dạng thập phân hoặc phân số tương đương.
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            KHU VỰC 6: MỨC ĐỘ NHẬN THỨC VÀ ĐIỂM SỐ
           ========================================================================= */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[14px]">
              6
            </span>
            <h2 className="text-[17px] font-bold text-slate-900">
              Mức độ nhận thức và điểm số câu hỏi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cognitive Level */}
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-slate-700 block">
                Cấp độ tư duy (theo Khung năng lực BGD&ĐT):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'recognition', label: 'Nhận biết', color: 'emerald' },
                  { id: 'comprehension', label: 'Thông hiểu', color: 'blue' },
                  { id: 'application', label: 'Vận dụng', color: 'amber' },
                  { id: 'high_application', label: 'Vận dụng cao', color: 'rose' },
                ].map((item) => {
                  const isSelected = cognitiveLevel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setCognitiveLevel(item.id as CognitiveLevel);
                        setIsDirty(true);
                      }}
                      className={`py-2 px-3 rounded-xl border text-[14px] font-bold transition-all text-center ${
                        isSelected
                          ? `bg-${item.color}-500 text-white border-${item.color}-600 shadow-xs`
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Points */}
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-slate-700 block">
                Thang điểm của câu hỏi:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="10"
                  value={points}
                  onChange={(e) => {
                    setPoints(parseFloat(e.target.value) || 0.25);
                    setIsDirty(true);
                  }}
                  className="w-32 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-[16px] font-bold text-indigo-900 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-[14px] font-bold text-slate-600">điểm</span>
                <span className="text-[13px] text-slate-400">
                  (Khuyến nghị: Phần 1: 0.25đ · Phần 2: 1.0đ · Phần 3: 0.5đ)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            KHU VỰC 7: LỜI GIẢI CHI TIẾT, HƯỚNG DẪN CHẤM
           ========================================================================= */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[14px]">
                7
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">
                Lời giải chi tiết &amp; Hướng dẫn chấm
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTarget('explanation');
                insertFormulaAtCursor('f\\\'(x) > 0');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] border border-slate-200 transition-colors"
            >
              + Chèn công thức vào lời giải
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-slate-700 block">
              Trình soạn thảo lời giải (hỗ trợ xuống dòng và công thức KaTeX):
            </label>
            <textarea
              ref={explanationTextareaRef}
              rows={5}
              value={explanation}
              onFocus={() => setActiveTarget('explanation')}
              onChange={(e) => {
                setExplanation(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Nhập các bước giải chi tiết hoặc tiêu chí cho điểm từng bước... ví dụ: Dựa vào bảng biến thiên, ta thấy $f'(x) > 0$ trên các khoảng $(-\\infty; 0)$ và $(2; +\\infty)$. Do đó hàm số đồng biến trên khoảng $(-\\infty; 0)$."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] leading-[1.6] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
            />
          </div>

          {/* Vùng xem trước lời giải tức thì */}
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
            <div className="text-[13px] font-bold text-indigo-900 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Xem trước lời giải &amp; hướng dẫn chấm:</span>
            </div>
            <div className="text-[15px] leading-[1.6] text-slate-800 bg-white p-3 rounded-lg border border-indigo-200 min-h-[44px]">
              {explanation ? (
                <MathRenderer content={explanation} />
              ) : (
                <span className="text-slate-400 italic text-[14px]">Chưa có lời giải chi tiết...</span>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            KHU VỰC 8: XEM TRƯỚC CÂU HỎI HOÀN CHỈNH (TRÊN ĐỀ THI & BẢN IN)
           ========================================================================= */}
        <section className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[14px]">
                8
              </span>
              <h2 className="text-[17px] font-bold text-indigo-950">
                Xem trước câu hỏi hoàn chỉnh (Hiển thị thực tế trên đề thi &amp; Bản in)
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[14px] border border-indigo-200">
              {points} điểm
            </span>
          </div>

          <div className="p-6 bg-slate-50/70 rounded-xl border border-slate-200 space-y-5">
            {/* Câu hỏi Statement */}
            <div className="text-[16px] leading-[1.6] text-slate-900 font-medium">
              <strong className="text-indigo-950">Câu {questionIndex + 1}: </strong>
              <MathRenderer content={content} inline />
            </div>

            {/* Attached Graphic or Warning */}
            {graphics ? (
              <div className="py-2 flex justify-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <MathGraphicDisplay config={graphics} width={380} height={220} showCaption />
                </div>
              </div>
            ) : isVariationTableMissing ? (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-[14px] text-center font-bold">
                ⚠️ [Chưa đính kèm bảng biến thiên]
              </div>
            ) : null}

            {/* Options Preview for Part 1 */}
            {partType === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isKey = correctAnswer === letter;
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-[16px] flex items-center gap-3 ${
                        isKey
                          ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[13px] ${
                          isKey ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {letter}
                      </span>
                      <div className="flex-1">
                        <MathRenderer content={opt} inline />
                      </div>
                      {isKey && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[12px] font-bold shrink-0">
                          ĐÁP ÁN
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-items Preview for Part 2 */}
            {partType === 2 && (
              <div className="space-y-2 pt-2">
                {subItems.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[16px]"
                  >
                    <div className="flex items-center gap-3">
                      <strong className="text-slate-900 font-bold">{sub.label})</strong>
                      <MathRenderer content={sub.content} inline />
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-[13px] font-bold ${
                        sub.isCorrect
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Short Answer Preview for Part 3 */}
            {partType === 3 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-[15px]">
                <div className="font-bold text-emerald-950 flex items-center gap-2">
                  <span>Đáp số chuẩn:</span>
                  <span className="font-mono text-[16px] px-2.5 py-1 bg-white rounded border border-emerald-300 text-emerald-800">
                    <MathRenderer content={`$${correctAnswer || '?'}$`} inline />
                  </span>
                </div>
                {acceptableAnswersText && (
                  <div className="text-[13px] text-slate-600">
                    Các phương án tương đương được chấp nhận: <span className="font-medium">{acceptableAnswersText}</span>
                  </div>
                )}
              </div>
            )}

            {/* Explanation Preview */}
            {explanation && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <strong className="text-indigo-900 block text-[15px]">
                  Lời giải chi tiết &amp; Hướng dẫn chấm:
                </strong>
                <div className="text-[15px] leading-[1.6] text-slate-700">
                  <MathRenderer content={explanation} />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating Sticky Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 shadow-lg">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackRequest}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[14px] transition-colors"
            >
              Quay lại danh sách
            </button>

            {mode === 'variant' && (
              <label className="flex items-center gap-2 cursor-pointer text-[14px] font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={applyToAllVariants}
                  onChange={(e) => setApplyToAllVariants(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span>Áp dụng câu hỏi này cho tất cả các mã đề chưa phát hành</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-[13px] font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Có thay đổi chưa lưu
              </span>
            )}
            <button
              type="button"
              onClick={handleBackRequest}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[14px] transition-colors"
            >
              Hủy chỉnh sửa
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[15px] flex items-center gap-2 transition-all shadow-md shadow-indigo-200 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Exit Confirmation Dialog if Unsaved Changes */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-[17px] font-bold text-slate-900">
                Bạn có thay đổi chưa lưu!
              </h3>
            </div>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              Bạn đang có các nội dung chỉnh sửa câu hỏi chưa được lưu. Nếu quay lại ngay bây giờ, các thay đổi vừa nhập sẽ bị hủy bỏ.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-[14px] font-semibold hover:bg-slate-50 transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onBack();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[14px] font-bold transition-colors shadow-xs"
              >
                Rời đi (Hủy thay đổi)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  handleSave();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold transition-colors shadow-xs"
              >
                Lưu và Quay lại
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 2D/3D Math Graphics Picker Modal */}
      {isGraphicsPickerModalOpen && (
        <MathGraphicsPicker
          isOpen={isGraphicsPickerModalOpen}
          initialConfig={
            graphics ||
            (isVariationTableMissing
              ? createDefaultGraphic('variation_table')
              : createDefaultGraphic('cubic_function'))
          }
          onClose={() => setIsGraphicsPickerModalOpen(false)}
          onSelect={(config) => {
            soundService.playSuccess();
            setGraphics(config);
            setIsDirty(true);
            setIsGraphicsPickerModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ExamQuestionEditPage;
