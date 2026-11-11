import React, { useState } from 'react';
import {
  X,
  Search,
  Check,
  Filter,
  Layers,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Question, CognitiveLevel, QuestionType } from '../../types';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';

interface SwapQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestion: Question;
  bankQuestions: Question[];
  onSelectReplacement: (newQuestion: Question) => void;
}

export const SwapQuestionModal: React.FC<SwapQuestionModalProps> = ({
  isOpen,
  onClose,
  currentQuestion,
  bankQuestions,
  onSelectReplacement,
}) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | CognitiveLevel>(currentQuestion.cognitiveLevel || 'all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Filter available candidate questions:
  // Must match part/type and grade, and exclude the current question itself
  const candidates = bankQuestions.filter((q) => {
    if (q.id === currentQuestion.id) return false;
    const samePart = (q.part || (q.questionType === 'multiple_choice' ? 1 : q.questionType === 'true_false' ? 2 : 3)) ===
      (currentQuestion.part || (currentQuestion.questionType === 'multiple_choice' ? 1 : currentQuestion.questionType === 'true_false' ? 2 : 3));
    if (!samePart) return false;

    if (levelFilter !== 'all' && q.cognitiveLevel !== levelFilter) return false;
    if (topicFilter !== 'all' && q.topic !== topicFilter) return false;

    if (search.trim()) {
      const qText = `${q.content} ${q.code} ${q.topic} ${q.chapter}`.toLowerCase();
      if (!qText.includes(search.toLowerCase())) return false;
    }

    return true;
  });

  const availableTopics = Array.from(
    new Set(
      bankQuestions
        .filter(
          (q) =>
            (q.part || (q.questionType === 'multiple_choice' ? 1 : q.questionType === 'true_false' ? 2 : 3)) ===
            (currentQuestion.part || (currentQuestion.questionType === 'multiple_choice' ? 1 : currentQuestion.questionType === 'true_false' ? 2 : 3))
        )
        .map((q) => q.topic)
        .filter(Boolean)
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Thay thế: {currentQuestion.code}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Đổi câu hỏi khác từ Ngân hàng câu hỏi
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn câu hỏi có cùng dạng thức và chuẩn đầu ra để thay thế câu hiện tại trong đề thi.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Question Info */}
        <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 px-5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Câu hiện tại:</span>
            <span className="font-bold text-indigo-950 truncate max-w-md">{currentQuestion.content.slice(0, 80)}...</span>
          </div>
          <span className="font-mono font-bold text-indigo-700">{currentQuestion.points} điểm</span>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nội dung, mã câu, chủ đề..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="recognition">Nhận biết</option>
              <option value="comprehension">Thông hiểu</option>
              <option value="application">Vận dụng</option>
              <option value="high_application">Vận dụng cao</option>
            </select>

            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 max-w-[180px] truncate"
            >
              <option value="all">Tất cả chủ đề</option>
              {availableTopics.map((top) => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Question List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 text-xs">
          {candidates.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-300" />
              <p>Không tìm thấy câu hỏi phù hợp với bộ lọc trong ngân hàng.</p>
            </div>
          ) : (
            candidates.map((cand) => (
              <div
                key={cand.id}
                className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        {cand.code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{cand.chapter} · {cand.topic}</span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {cand.cognitiveLevel}
                    </span>
                  </div>

                  <div className="text-slate-900 font-medium leading-relaxed">
                    <MathRenderer content={cand.content} inline />
                  </div>

                  {cand.options && cand.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-700">
                      {cand.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <strong>{String.fromCharCode(65 + idx)}.</strong>
                          <MathRenderer content={opt} inline />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-emerald-700 font-bold font-mono">Đáp án: {String(cand.correctAnswer)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playSuccess();
                      onSelectReplacement(cand);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Thay câu này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs rounded-b-2xl">
          <span className="text-slate-500">Tìm thấy {candidates.length} câu hỏi phù hợp trong ngân hàng.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
