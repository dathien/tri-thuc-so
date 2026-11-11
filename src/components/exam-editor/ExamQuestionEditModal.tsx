import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Image as ImageIcon,
  Calculator,
  Table as TableIcon,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Eye,
  Sliders,
  Info,
  CheckCircle2,
  Trash2,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import { Question, CognitiveLevel, QuestionType, MathGraphicConfig } from '../../types';
import MathRenderer from '../MathRenderer';
import MathGraphicDisplay from '../math-graphics/MathGraphicDisplay';
import { soundService } from '../../utils/audio';

interface ExamQuestionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  questionIndex: number;
  mode: 'master' | 'variant';
  variantCode?: string;
  onSaveQuestion: (updatedQ: Question, applyToAllVariants?: boolean) => void;
  onOpenGraphicsEditor?: (currentConfig?: MathGraphicConfig) => void;
}

const MATH_SHORTCUTS = [
  { label: 'a/b', insert: '\\frac{a}{b}', title: 'Phân số' },
  { label: '√x', insert: '\\sqrt{x}', title: 'Căn bậc hai' },
  { label: 'x²', insert: 'x^{2}', title: 'Số mũ' },
  { label: 'x₁', insert: 'x_{1}', title: 'Chỉ số dưới' },
  { label: '∫', insert: '\\int_{a}^{b} f(x)dx', title: 'Tích phân' },
  { label: 'u⃗', insert: '\\vec{u}', title: 'Véc-tơ' },
  { label: 'π', insert: '\\pi', title: 'Pi' },
  { label: 'α', insert: '\\alpha', title: 'Alpha' },
  { label: 'Δ', insert: '\\Delta', title: 'Delta' },
  { label: '±', insert: '\\pm', title: 'Cộng trừ' },
  { label: '≤', insert: '\\le', title: 'Nhỏ hơn hoặc bằng' },
  { label: '≥', insert: '\\ge', title: 'Lớn hơn hoặc bằng' },
  { label: '∈', insert: '\\in', title: 'Thuộc' },
  { label: '∞', insert: '\\infty', title: 'Vô cực' },
  { label: '⇔', insert: '\\Leftrightarrow', title: 'Tương đương' },
  { label: '⇒', insert: '\\Rightarrow', title: 'Suy ra' },
];

export const ExamQuestionEditModal: React.FC<ExamQuestionEditModalProps> = ({
  isOpen,
  onClose,
  question,
  questionIndex,
  mode,
  variantCode,
  onSaveQuestion,
  onOpenGraphicsEditor,
}) => {
  const [content, setContent] = useState(question.content);
  const [options, setOptions] = useState<string[]>(question.options ? [...question.options] : ['', '', '', '']);
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
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(question.cognitiveLevel || 'comprehension');
  const [graphics, setGraphics] = useState<MathGraphicConfig | undefined>(question.graphics);
  const [acceptableAnswersText, setAcceptableAnswersText] = useState<string>(
    question.acceptableAnswers ? question.acceptableAnswers.join(', ') : ''
  );
  const [unit, setUnit] = useState<string>('');
  const [roundingRule, setRoundingRule] = useState<string>('');
  const [applyToAllVariants, setApplyToAllVariants] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    setContent(question.content);
    setOptions(question.options ? [...question.options] : ['', '', '', '']);
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
    setPoints(question.points || 0.25);
    setCognitiveLevel(question.cognitiveLevel || 'comprehension');
    setGraphics(question.graphics);
    setAcceptableAnswersText(question.acceptableAnswers ? question.acceptableAnswers.join(', ') : '');
    setApplyToAllVariants(false);
  }, [question]);

  if (!isOpen) return null;

  const insertMathFormula = (code: string) => {
    soundService.playClick();
    setContent((prev) => `${prev} $${code}$ `);
  };

  const handleSave = () => {
    soundService.playSuccess();
    const updated: Question = {
      ...question,
      content,
      options: question.part === 1 || question.questionType === 'multiple_choice' ? options : undefined,
      subItems: question.part === 2 || question.questionType === 'true_false' ? subItems : undefined,
      correctAnswer,
      explanation,
      points,
      cognitiveLevel,
      graphics,
      acceptableAnswers:
        question.part === 3 || question.questionType === 'short_answer'
          ? acceptableAnswersText
              .split(/[,;]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    };

    onSaveQuestion(updated, mode === 'variant' ? applyToAllVariants : false);
    onClose();
  };

  const partType = question.part || (question.questionType === 'multiple_choice' ? 1 : question.questionType === 'true_false' ? 2 : 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Câu {questionIndex + 1}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {mode === 'master' ? 'Chỉnh sửa Câu hỏi Đề gốc (Chế độ A)' : `Chỉnh sửa Câu hỏi riêng Mã đề ${variantCode} (Chế độ B)`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'master'
                ? 'Thay đổi tại đây sẽ cập nhật phiên bản đề gốc, bảo toàn tính toán ma trận và sinh lại mã đề.'
                : `Thay đổi tại đây chỉ lưu riêng cho Mã ${variantCode}, hoàn toàn không ảnh hưởng đến các mã đề khác.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'editor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                Soạn thảo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                Xem trước
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {activeTab === 'preview' ? (
            /* Live Preview Screen */
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-slate-900">Xem trước hiển thị thực tế trên đề thi:</span>
                <span className="font-mono text-indigo-700 font-bold">{points} điểm</span>
              </div>

              <div className="text-slate-900 font-medium leading-relaxed">
                <strong>Câu {questionIndex + 1}: </strong>
                <MathRenderer content={content} inline />
              </div>

              {graphics && (
                <div className="py-2 flex justify-center">
                  <MathGraphicDisplay config={graphics} width={340} height={200} showCaption />
                </div>
              )}

              {/* Part 1 Preview */}
              {partType === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isKey = correctAnswer === letter;
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded-lg border flex items-center gap-2 ${
                          isKey ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-4 h-4 rounded bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
                          {letter}
                        </span>
                        <MathRenderer content={opt} inline />
                        {isKey && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Part 2 Preview */}
              {partType === 2 && (
                <div className="space-y-1.5 pt-2">
                  {subItems.map((sub) => (
                    <div key={sub.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800">{sub.label})</strong>
                        <MathRenderer content={sub.content} inline />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Part 3 Preview */}
              {partType === 3 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-900">
                    Đáp số chuẩn: <span className="font-mono">{correctAnswer}</span>
                  </div>
                  {acceptableAnswersText && (
                    <div className="text-[11px] text-slate-600">
                      Chấp nhận thêm: {acceptableAnswersText}
                    </div>
                  )}
                </div>
              )}

              {explanation && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-indigo-900 block">Lời giải / Hướng dẫn chấm:</strong>
                  <MathRenderer content={explanation} />
                </div>
              )}
            </div>
          ) : (
            /* Editing Screen */
            <div className="space-y-5">
              {/* Question Statement */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Nội dung câu hỏi</span>
                    <span className="text-slate-400 font-normal">(hỗ trợ định dạng LaTeX $...$)</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 font-semibold">Gõ công thức giữa hai dấu $...$</span>
                </div>

                {/* Math Shortcuts Toolbar */}
                <div className="flex items-center gap-1 flex-wrap p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 px-1.5 flex items-center gap-1">
                    <Calculator className="w-3 h-3 text-indigo-600" />
                    Chèn nhanh:
                  </span>
                  {MATH_SHORTCUTS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      title={item.title}
                      onClick={() => insertMathFormula(item.insert)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Nhập nội dung câu hỏi hoặc bài toán..."
                />
              </div>

              {/* Graphic / Diagram Tool Integration */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-indigo-950">Hình học &amp; Đồ thị mô phỏng 2D/3D đính kèm</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenGraphicsEditor && (
                      <button
                        type="button"
                        onClick={() => onOpenGraphicsEditor(graphics)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{graphics ? 'Chỉnh sửa hình' : 'Chèn hình mới'}</span>
                      </button>
                    )}
                    {graphics && (
                      <button
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          setGraphics(undefined);
                        }}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="Xóa hình đính kèm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {graphics ? (
                  <div className="bg-white p-3 rounded-lg border border-indigo-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="shrink-0 flex justify-center">
                      <MathGraphicDisplay config={graphics} width={240} height={150} showCaption={false} />
                    </div>
                    <div className="space-y-1 text-slate-700">
                      <div className="font-bold text-indigo-900">{graphics.title || 'Mô hình toán học'}</div>
                      <div className="text-[11px] text-slate-500">Loại: {graphics.type} · Danh mục: {graphics.category}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">Đã đồng bộ vector và xuất được sang Word OMML/PNG</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    Chưa đính kèm hình vẽ. Nhấp "Chèn hình mới" để mở bộ công cụ 7 danh mục (Hình chóp, lăng trụ, hàm bậc 3, hàm phân thức, BBT, khối tròn xoay, v.v.).
                  </div>
                )}
              </div>

              {/* DẠNG 1: TRẮC NGHIỆM NHIỀU LỰA CHỌN */}
              {partType === 1 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">4 Phương án trả lời (A, B, C, D)</span>
                    <span className="text-[11px] text-indigo-600 font-semibold">Chọn nút tròn để chỉ định đáp án đúng</span>
                  </div>

                  <div className="space-y-2">
                    {options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const isCorrect = correctAnswer === letter;

                      return (
                        <div key={i} className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs">
                            <input
                              type="radio"
                              name="mcq_answer"
                              checked={isCorrect}
                              onChange={() => setCorrectAnswer(letter)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className={`w-5 h-5 rounded flex items-center justify-center ${isCorrect ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-700 font-bold'}`}>
                              {letter}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...options];
                              next[i] = e.target.value;
                              setOptions(next);
                            }}
                            placeholder={`Phương án ${letter}... (ví dụ: $x = 2$)`}
                            className={`flex-1 px-3 py-1.5 rounded-lg border font-medium text-xs ${isCorrect ? 'bg-emerald-50/50 border-emerald-300 font-bold text-slate-900' : 'bg-white border-slate-200 text-slate-800'}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI */}
              {partType === 2 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">4 Ý hỏi Đúng / Sai (a, b, c, d)</span>
                    <span className="text-[11px] text-slate-500">Bấm nút ĐÚNG/SAI để chuyển trạng thái</span>
                  </div>

                  <div className="space-y-2">
                    {subItems.map((sub, idx) => (
                      <div key={sub.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                        <span className="font-bold text-slate-700 w-5 text-center">{sub.label})</span>
                        <input
                          type="text"
                          value={sub.content}
                          onChange={(e) => {
                            const next = [...subItems];
                            next[idx].content = e.target.value;
                            setSubItems(next);
                          }}
                          placeholder={`Nội dung mệnh đề ${sub.label}...`}
                          className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            soundService.playClick();
                            const next = [...subItems];
                            next[idx].isCorrect = !next[idx].isCorrect;
                            setSubItems(next);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                            sub.isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DẠNG 3: TRẮC NGHIỆM TRẢ LỜI NGẮN */}
              {partType === 3 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">Thiết lập kết quả trả lời ngắn</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Đáp số chuẩn:</label>
                      <input
                        type="text"
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        placeholder="Ví dụ: 3/4 hoặc 0.75 hoặc 12"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-indigo-700 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Các đáp số chấp nhận thêm:</label>
                      <input
                        type="text"
                        value={acceptableAnswersText}
                        onChange={(e) => setAcceptableAnswersText(e.target.value)}
                        placeholder="Phân cách bằng dấu phẩy: 0.75, 3/4"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Thang điểm & Mức độ nhận thức */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức độ nhận thức:</label>
                  <select
                    value={cognitiveLevel}
                    onChange={(e) => setCognitiveLevel(e.target.value as CognitiveLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                  >
                    <option value="recognition">Nhận biết</option>
                    <option value="comprehension">Thông hiểu</option>
                    <option value="application">Vận dụng</option>
                    <option value="high_application">Vận dụng cao</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm câu hỏi:</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="5.0"
                    value={points}
                    onChange={(e) => setPoints(parseFloat(e.target.value) || 0.25)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Lời giải & Hướng dẫn chấm */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Lời giải chi tiết &amp; Hướng dẫn chấm:</label>
                <textarea
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Nhập lời giải toán học chi tiết, các bước suy luận..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                />
              </div>

              {/* Option in Variant mode: Apply to all variants */}
              {mode === 'variant' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900">
                  <input
                    type="checkbox"
                    id="applyAll"
                    checked={applyToAllVariants}
                    onChange={(e) => setApplyToAllVariants(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <label htmlFor="applyAll" className="cursor-pointer font-semibold text-xs">
                    Áp dụng thay đổi của câu này cho tất cả các mã đề chưa phát hành (đồng bộ theo ID câu gốc)
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 rounded-b-2xl">
          <div className="text-xs text-slate-500">
            * Bảng đáp án và ma trận đề thi sẽ tự động đồng bộ theo dữ liệu câu hỏi được lưu.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Lưu thay đổi câu hỏi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
