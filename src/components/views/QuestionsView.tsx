import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  BookOpen,
  X,
  FileCode,
  Tag,
  Trash2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Edit2,
  UploadCloud,
} from 'lucide-react';
import { Question, CognitiveLevel, QuestionType, MathGraphicConfig } from '../../types';
import MathRenderer from '../MathRenderer';
import MathGraphicDisplay from '../math-graphics/MathGraphicDisplay';
import MathGraphicsPicker from '../math-graphics/MathGraphicsPicker';
import DocxImportModal from '../DocxImportModal';
import { soundService } from '../../utils/audio';

interface QuestionsViewProps {
  questions: Question[];
  onAddQuestion: (q: Omit<Question, 'id' | 'createdAt'>) => void;
  onUpdateQuestion?: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
}

const COGNITIVE_LEVEL_LABELS: Record<CognitiveLevel, { label: string; color: string; border: string }> = {
  recognition: { label: 'Nhận biết', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  comprehension: { label: 'Thông hiểu', color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
  application: { label: 'Vận dụng', color: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
  high_application: { label: 'Vận dụng cao', color: 'bg-rose-50 text-rose-700', border: 'border-rose-200' },
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm nhiều lựa chọn',
  true_false: 'Đúng / Sai',
  short_answer: 'Trả lời ngắn',
  essay: 'Tự luận',
};

export const QuestionsView: React.FC<QuestionsViewProps> = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<'all' | 10 | 11 | 12>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | CognitiveLevel>('all');
  const [selectedType, setSelectedType] = useState<'all' | QuestionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Graphics Picker & Docx Import modal states
  const [showGraphicsPicker, setShowGraphicsPicker] = useState(false);
  const [showDocxImportModal, setShowDocxImportModal] = useState(false);
  const [activeGraphicForPicker, setActiveGraphicForPicker] = useState<MathGraphicConfig | null>(null);
  const [editingTargetQuestion, setEditingTargetQuestion] = useState<Question | null>(null);
  const [newGraphic, setNewGraphic] = useState<MathGraphicConfig | null>(null);

  // New question form state
  const [newGrade, setNewGrade] = useState<10 | 11 | 12>(12);
  const [newSemester, setNewSemester] = useState<1 | 2>(1);
  const [newChapter, setNewChapter] = useState('Chương 1: Ứng dụng đạo hàm khảo sát hàm số');
  const [newLesson, setNewLesson] = useState('Bài 1: Tính đơn điệu & Cực trị');
  const [newTopic, setNewTopic] = useState('Cực trị hàm bậc 3');
  const [newLevel, setNewLevel] = useState<CognitiveLevel>('comprehension');
  const [newType, setNewType] = useState<QuestionType>('multiple_choice');
  const [newContent, setNewContent] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('A');
  const [newExplanation, setNewExplanation] = useState('');

  // 4 Cognitive Level Statistics
  const totalCount = questions.length || 1;
  const recCount = questions.filter((q) => q.cognitiveLevel === 'recognition').length;
  const compCount = questions.filter((q) => q.cognitiveLevel === 'comprehension').length;
  const appCount = questions.filter((q) => q.cognitiveLevel === 'application').length;
  const highCount = questions.filter((q) => q.cognitiveLevel === 'high_application').length;

  const filteredQuestions = questions.filter((q) => {
    const matchGrade = selectedGrade === 'all' ? true : q.grade === selectedGrade;
    const matchLevel = selectedLevel === 'all' ? true : q.cognitiveLevel === selectedLevel;
    const matchType = selectedType === 'all' ? true : q.questionType === selectedType;
    const matchSearch =
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchLevel && matchType && matchSearch;
  });

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    onAddQuestion({
      code: `TOAN${newGrade}-${Math.floor(100 + Math.random() * 900)}`,
      grade: newGrade,
      semester: newSemester,
      chapter: newChapter,
      lesson: newLesson,
      topic: newTopic,
      cognitiveLevel: newLevel,
      questionType: newType,
      content: newContent,
      options: [newOptionA, newOptionB, newOptionC, newOptionD].filter(Boolean),
      correctAnswer: newCorrectAnswer,
      explanation: newExplanation,
      points: 0.25,
      graphics: newGraphic || undefined,
    });

    setNewContent('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewOptionD('');
    setNewExplanation('');
    setNewGraphic(null);
    setShowAddModal(false);
    soundService.playSuccess();
  };

  const handleOpenPickerForNew = () => {
    setEditingTargetQuestion(null);
    setActiveGraphicForPicker(newGraphic);
    setShowGraphicsPicker(true);
  };

  const handleOpenPickerForQuestion = (q: Question) => {
    setEditingTargetQuestion(q);
    setActiveGraphicForPicker(q.graphics || null);
    setShowGraphicsPicker(true);
  };

  const handleSaveGraphicFromPicker = (config: MathGraphicConfig) => {
    if (editingTargetQuestion && onUpdateQuestion) {
      onUpdateQuestion({ ...editingTargetQuestion, graphics: config });
      setEditingTargetQuestion(null);
    } else {
      setNewGraphic(config);
    }
  };

  const handleRemoveGraphicForQuestion = (q: Question) => {
    if (onUpdateQuestion) {
      onUpdateQuestion({ ...q, graphics: undefined });
      soundService.playClick();
    }
  };

  const handleQuickChangeLevel = (question: Question, newLvl: CognitiveLevel) => {
    soundService.playClick();
    if (onUpdateQuestion) {
      onUpdateQuestion({ ...question, cognitiveLevel: newLvl });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Ngân hàng Câu hỏi Toán THPT
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              {questions.length} Câu hỏi chuẩn hóa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổ chức theo ma trận chuẩn hóa: Lớp 10–12, 4 mức độ nhận thức (có thể gán và điều chỉnh trực tiếp), hỗ trợ công thức KaTeX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingTargetQuestion(null);
              setActiveGraphicForPicker(null);
              setShowGraphicsPicker(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            Chèn hình học / Đồ thị
          </button>

          <button
            type="button"
            onClick={() => setShowDocxImportModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            Nhập đề từ Word (.docx)
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Soạn câu hỏi mới
          </button>
        </div>
      </div>

      {/* 4 Cognitive Levels Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          type="button"
          onClick={() => {
            setSelectedLevel(selectedLevel === 'recognition' ? 'all' : 'recognition');
            soundService.playClick();
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            selectedLevel === 'recognition'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white hover:bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider">Nhận biết</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                selectedLevel === 'recognition' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {((recCount / totalCount) * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xl font-extrabold font-mono">{recCount} câu</p>
          <p className={`text-[10px] mt-0.5 ${selectedLevel === 'recognition' ? 'text-emerald-100' : 'text-slate-500'}`}>
            Định nghĩa, khái niệm cơ bản
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedLevel(selectedLevel === 'comprehension' ? 'all' : 'comprehension');
            soundService.playClick();
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            selectedLevel === 'comprehension'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white hover:bg-blue-50/50 border-blue-200/80 text-blue-950'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider">Thông hiểu</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                selectedLevel === 'comprehension' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {((compCount / totalCount) * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xl font-extrabold font-mono">{compCount} câu</p>
          <p className={`text-[10px] mt-0.5 ${selectedLevel === 'comprehension' ? 'text-blue-100' : 'text-slate-500'}`}>
            Áp dụng trực tiếp công thức
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedLevel(selectedLevel === 'application' ? 'all' : 'application');
            soundService.playClick();
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            selectedLevel === 'application'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white hover:bg-amber-50/50 border-amber-200/80 text-amber-950'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider">Vận dụng</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                selectedLevel === 'application' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {((appCount / totalCount) * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xl font-extrabold font-mono">{appCount} câu</p>
          <p className={`text-[10px] mt-0.5 ${selectedLevel === 'application' ? 'text-amber-100' : 'text-slate-500'}`}>
            Phối hợp nhiều bước toán học
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedLevel(selectedLevel === 'high_application' ? 'all' : 'high_application');
            soundService.playClick();
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            selectedLevel === 'high_application'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white hover:bg-rose-50/50 border-rose-200/80 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider">Vận dụng cao</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                selectedLevel === 'high_application' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {((highCount / totalCount) * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xl font-extrabold font-mono">{highCount} câu</p>
          <p className={`text-[10px] mt-0.5 ${selectedLevel === 'high_application' ? 'text-rose-100' : 'text-slate-500'}`}>
            Phân hóa sâu, bài toán thực tế
          </p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Grade & Level Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Grade Tabs */}
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

          {/* Cognitive Level Dropdown / Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Mức độ:</span>
            {(['all', 'recognition', 'comprehension', 'application', 'high_application'] as const).map(
              (lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setSelectedLevel(lvl);
                    soundService.playClick();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedLevel === lvl
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {lvl === 'all' ? 'Tất cả' : COGNITIVE_LEVEL_LABELS[lvl].label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo nội dung câu hỏi, mã câu, bài học hoặc chuyên đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
            <Database className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Không tìm thấy câu hỏi phù hợp với bộ lọc
            </p>
            <p className="text-xs text-slate-400">
              Thử thay đổi khối lớp, mức độ nhận thức hoặc bấm &quot;Soạn câu hỏi mới&quot;.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const levelInfo = COGNITIVE_LEVEL_LABELS[q.cognitiveLevel] || {
              label: q.cognitiveLevel,
              color: 'bg-slate-50 text-slate-700',
              border: 'border-slate-200',
            };
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      #{idx + 1} · {q.code}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Toán {q.grade} (HK{q.semester})
                    </span>

                    {/* Inline Quick Cognitive Level Modifier */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5">
                      <span className="text-[10px] text-slate-500 font-semibold">Mức độ:</span>
                      <select
                        value={q.cognitiveLevel}
                        onChange={(e) => handleQuickChangeLevel(q, e.target.value as CognitiveLevel)}
                        className={`text-[11px] font-bold rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none ${levelInfo.color} ${levelInfo.border}`}
                        title="Bấm để thay đổi mức độ nhận thức của câu hỏi"
                      >
                        <option value="recognition">Nhận biết</option>
                        <option value="comprehension">Thông hiểu</option>
                        <option value="application">Vận dụng</option>
                        <option value="high_application">Vận dụng cao</option>
                      </select>
                    </div>

                    <span className="text-slate-400 text-[11px]">
                      {QUESTION_TYPE_LABELS[q.questionType]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {q.points} điểm
                    </span>

                    {/* Graphic Attachment Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPickerForQuestion(q)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all border ${
                        q.graphics
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                      }`}
                      title={q.graphics ? 'Chỉnh sửa hình học / đồ thị của câu hỏi' : 'Chèn hình học / đồ thị vào câu hỏi'}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{q.graphics ? 'Sửa hình 2D/3D' : '+ Hình vẽ'}</span>
                    </button>

                    {q.graphics && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGraphicForQuestion(q)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Gỡ hình vẽ khỏi câu hỏi"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onDeleteQuestion(q.id);
                        soundService.playClick();
                      }}
                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Topic & Content */}
                <div>
                  <p className="text-[11px] text-indigo-600 font-medium mb-1">
                    {q.chapter} · {q.topic}
                  </p>
                  <div className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                    <MathRenderer content={q.content} />
                  </div>
                </div>

                {/* Math Graphic Display if attached */}
                {q.graphics && (
                  <div className="pt-2 pb-1 flex flex-col items-center">
                    <MathGraphicDisplay
                      config={q.graphics}
                      width={440}
                      height={270}
                      showCaption
                      allowDownload
                    />
                  </div>
                )}

                {/* Multiple Choice Options */}
                {q.questionType === 'multiple_choice' && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = q.correctAnswer === letter;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                              : 'bg-slate-50/50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {letter}
                          </span>
                          <div className="flex-1">
                            <MathRenderer content={opt} inline />
                          </div>
                          {isCorrect && (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True / False Sub-items */}
                {q.questionType === 'true_false' && q.subItems && q.subItems.length > 0 && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    {q.subItems.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                      >
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
                )}

                {/* Short Answer Display */}
                {q.questionType === 'short_answer' && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between">
                    <span className="font-bold text-emerald-900">
                      Đáp án số: <span className="font-mono text-sm">{String(q.correctAnswer)}</span>
                    </span>
                    {q.acceptableAnswers && q.acceptableAnswers.length > 0 && (
                      <span className="text-[11px] text-slate-500">
                        Chấp nhận: {q.acceptableAnswers.join(', ')}
                      </span>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                    <span className="font-bold text-[11px] text-amber-800 uppercase tracking-wider block">
                      Hướng dẫn giải chi tiết:
                    </span>
                    <MathRenderer content={q.explanation} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Soạn câu hỏi mới vào Ngân hàng</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(Number(e.target.value) as 10 | 11 | 12)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value={12}>Khối 12</option>
                    <option value={11}>Khối 11</option>
                    <option value={10}>Khối 10</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Học kỳ</label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(Number(e.target.value) as 1 | 2)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value={1}>Học kỳ I</option>
                    <option value={2}>Học kỳ II</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ nhận thức</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as CognitiveLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="recognition">Nhận biết</option>
                    <option value="comprehension">Thông hiểu</option>
                    <option value="application">Vận dụng</option>
                    <option value="high_application">Vận dụng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chương / Chuyên đề</label>
                <input
                  type="text"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung câu hỏi (hỗ trợ công thức KaTeX đặt trong $...$) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ví dụ: Cho hàm số $y = x^3 - 3x + 1$. Điểm cực đại của đồ thị hàm số là..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
                {newContent && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-100 text-slate-900 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Xem trước hiển thị công thức:
                    </span>
                    <MathRenderer content={newContent} />
                  </div>
                )}
              </div>

              {/* Graphic Attachment in Modal */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Hình vẽ hình học / Đồ thị 2D/3D đính kèm:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenPickerForNew}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{newGraphic ? 'Thay đổi hình vẽ' : 'Chèn hình học / Đồ thị'}</span>
                  </button>
                </div>

                {newGraphic ? (
                  <div className="flex flex-col items-center p-2 bg-white rounded-xl border border-slate-200">
                    <MathGraphicDisplay config={newGraphic} width={360} height={220} showCaption />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleOpenPickerForNew}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Chỉnh sửa tham số
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewGraphic(null)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa hình
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Chưa đính kèm hình vẽ. Bấm nút "Chèn hình học / Đồ thị" để lấy mô hình từ Phòng Lab (Khảo sát đồ thị, Oxyz, Lượng giác, Conic, Hình chóp 3D,...).
                  </p>
                )}
              </div>

              {/* Options Inputs */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  Các lựa chọn đáp án (A, B, C, D)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Đáp án A: $(0; 1)$"
                      value={newOptionA}
                      onChange={(e) => setNewOptionA(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    {newOptionA && (
                      <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 text-[11px]">
                        A: <MathRenderer content={newOptionA} inline />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Đáp án B: $(1; -1)$"
                      value={newOptionB}
                      onChange={(e) => setNewOptionB(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    {newOptionB && (
                      <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 text-[11px]">
                        B: <MathRenderer content={newOptionB} inline />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Đáp án C: $(-1; 3)$"
                      value={newOptionC}
                      onChange={(e) => setNewOptionC(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    {newOptionC && (
                      <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 text-[11px]">
                        C: <MathRenderer content={newOptionC} inline />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Đáp án D: $(2; 3)$"
                      value={newOptionD}
                      onChange={(e) => setNewOptionD(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    {newOptionD && (
                      <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 text-[11px]">
                        D: <MathRenderer content={newOptionD} inline />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đáp án đúng</label>
                  <select
                    value={newCorrectAnswer}
                    onChange={(e) => setNewCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700"
                  >
                    <option value="A">Đáp án A</option>
                    <option value="B">Đáp án B</option>
                    <option value="C">Đáp án C</option>
                    <option value="D">Đáp án D</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dạng câu hỏi</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="multiple_choice">Nhiều lựa chọn (4 phương án)</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="short_answer">Trả lời ngắn</option>
                    <option value="essay">Tự luận</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lời giải / Hướng dẫn chấm</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú bước giải và kết quả toán học... ví dụ: $f'(x) = 3x^2 - 3 > 0$..."
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
                {newExplanation && (
                  <div className="mt-1.5 p-2 bg-slate-100 rounded-lg text-slate-800 text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Xem trước lời giải:
                    </span>
                    <MathRenderer content={newExplanation} />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Lưu vào Ngân hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Math Graphics Picker Modal */}
      {showGraphicsPicker && (
        <MathGraphicsPicker
          isOpen={showGraphicsPicker}
          initialConfig={activeGraphicForPicker}
          onClose={() => {
            setShowGraphicsPicker(false);
            setEditingTargetQuestion(null);
          }}
          onSelect={handleSaveGraphicFromPicker}
        />
      )}

      {/* Docx Import Review Modal */}
      {showDocxImportModal && (
        <DocxImportModal
          isOpen={showDocxImportModal}
          targetMode="question_bank"
          onClose={() => setShowDocxImportModal(false)}
          onImportToBank={(importedQuestions) => {
            importedQuestions.forEach((q) => onAddQuestion(q));
            setShowDocxImportModal(false);
            soundService.playSuccess();
          }}
        />
      )}
    </div>
  );
};

export default QuestionsView;
