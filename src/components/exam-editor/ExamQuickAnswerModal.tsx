import React, { useState } from 'react';
import {
  X,
  Check,
  Key,
  HelpCircle,
  FileText,
  Save,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { Question } from '../../types';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';

interface ExamQuickAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSaveAnswers: (updatedQuestions: Question[]) => void;
  variantCode?: string;
}

export const ExamQuickAnswerModal: React.FC<ExamQuickAnswerModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSaveAnswers,
  variantCode,
}) => {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(() =>
    questions.map((q) => ({
      ...q,
      options: q.options ? [...q.options] : undefined,
      subItems: q.subItems ? q.subItems.map((s) => ({ ...s })) : undefined,
    }))
  );

  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const handleUpdateMCQAnswer = (qIndex: number, newLetter: string) => {
    soundService.playClick();
    setLocalQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctAnswer: newLetter };
      return copy;
    });
  };

  const handleToggleSubItem = (qIndex: number, subId: string) => {
    soundService.playClick();
    setLocalQuestions((prev) => {
      const copy = [...prev];
      const targetQ = copy[qIndex];
      if (!targetQ.subItems) return prev;
      targetQ.subItems = targetQ.subItems.map((s) => (s.id === subId ? { ...s, isCorrect: !s.isCorrect } : s));
      return copy;
    });
  };

  const handleUpdateShortAnswer = (qIndex: number, val: string) => {
    setLocalQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctAnswer: val };
      return copy;
    });
  };

  const handleUpdateExplanation = (qIndex: number, text: string) => {
    setLocalQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], explanation: text };
      return copy;
    });
  };

  const handleUpdatePoints = (qIndex: number, points: number) => {
    setLocalQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], points: Math.max(0.05, points) };
      return copy;
    });
  };

  const handleSave = () => {
    soundService.playSuccess();
    onSaveAnswers(localQuestions);
    onClose();
  };

  const p1Questions = localQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice');
  const p2Questions = localQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false');
  const p3Questions = localQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Chỉnh sửa Bảng đáp án &amp; Hướng dẫn chấm {variantCode ? `(Mã đề ${variantCode})` : '(Đề gốc)'}
              </h2>
              <p className="text-xs text-slate-500">
                Thay đổi tại đây tự động đồng bộ sang khóa đáp án đề thi và bảng ma trận đối chiếu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 1
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Phần I: Trắc nghiệm ({p1Questions.length} câu)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(2)}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 2
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Phần II: Đúng/Sai ({p2Questions.length} câu)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(3)}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 3
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Phần III: Trả lời ngắn ({p3Questions.length} câu)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: MCQ */}
          {activeTab === 1 && (
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center justify-between text-indigo-950 font-semibold">
                <span>Chọn trực tiếp chữ cái đáp án đúng cho từng câu Phần I:</span>
                <span className="text-[11px] text-indigo-700 font-mono">12 câu = 3.0 điểm (0.25đ / câu)</span>
              </div>

              <div className="space-y-3">
                {p1Questions.map((q, pIdx) => {
                  const globalIdx = localQuestions.findIndex((item) => item.id === q.id);

                  return (
                    <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 font-mono">Câu {pIdx + 1}:</span>
                          <span className="text-slate-700 truncate max-w-md">{q.content.slice(0, 100)}...</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono">Điểm:</span>
                          <input
                            type="number"
                            step="0.05"
                            value={q.points}
                            onChange={(e) => handleUpdatePoints(globalIdx, parseFloat(e.target.value) || 0.25)}
                            className="w-16 px-1.5 py-0.5 border rounded text-center font-mono font-bold bg-white"
                          />
                        </div>
                      </div>

                      {/* Options Selector Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="font-semibold text-slate-600 text-[11px]">Đáp án:</span>
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const isSelected = q.correctAnswer === letter;
                          return (
                            <button
                              key={letter}
                              type="button"
                              onClick={() => handleUpdateMCQAnswer(globalIdx, letter)}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {letter}
                            </button>
                          );
                        })}

                        <div className="flex-1 ml-3">
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => handleUpdateExplanation(globalIdx, e.target.value)}
                            placeholder="Lời giải tóm tắt..."
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TRUE / FALSE */}
          {activeTab === 2 && (
            <div className="space-y-3">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl flex items-center justify-between text-purple-950 font-semibold">
                <span>Nhấp nút để đảo trạng thái ĐÚNG / SAI của từng ý a, b, c, d:</span>
                <span className="text-[11px] text-purple-700 font-mono">4 câu = 4.0 điểm</span>
              </div>

              <div className="space-y-4">
                {p2Questions.map((q, pIdx) => {
                  const globalIdx = localQuestions.findIndex((item) => item.id === q.id);

                  return (
                    <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="font-bold text-slate-800">
                        Câu {pIdx + 1}: <span className="font-normal text-slate-600">{q.content.slice(0, 100)}...</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(q.subItems || []).map((sub) => (
                          <div
                            key={sub.id}
                            className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <span className="font-bold text-slate-700 w-5">{sub.label})</span>
                            <span className="text-[11px] text-slate-800 flex-1 truncate">{sub.content || `Ý ${sub.label}`}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleSubItem(globalIdx, sub.id)}
                              className={`px-3 py-1 rounded-md font-bold text-xs transition-colors ${
                                sub.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                              }`}
                            >
                              {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1">
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateExplanation(globalIdx, e.target.value)}
                          placeholder="Hướng dẫn chấm chi tiết từng ý..."
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SHORT ANSWER */}
          {activeTab === 3 && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-emerald-950 font-semibold">
                <span>Nhập kết quả toán học chuẩn xác cho từng câu trả lời ngắn:</span>
                <span className="text-[11px] text-emerald-700 font-mono">6 câu = 3.0 điểm (0.5đ / câu)</span>
              </div>

              <div className="space-y-3">
                {p3Questions.map((q, pIdx) => {
                  const globalIdx = localQuestions.findIndex((item) => item.id === q.id);

                  return (
                    <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Câu {pIdx + 1}:</span>
                        <span className="text-[11px] text-slate-400 font-mono">{q.points} điểm</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Đáp số chuẩn:</label>
                          <input
                            type="text"
                            value={String(q.correctAnswer || '')}
                            onChange={(e) => handleUpdateShortAnswer(globalIdx, e.target.value)}
                            placeholder="Ví dụ: 3/4 hoặc 0.75"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-indigo-700"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Lời giải / Đáp án chi tiết:</label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => handleUpdateExplanation(globalIdx, e.target.value)}
                            placeholder="Các bước tính toán tóm tắt..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 rounded-b-2xl">
          <span className="text-xs text-slate-500">
            * Thay đổi đáp án sẽ được cập nhật đồng thời vào bảng tra cứu và tài liệu xuất Word/PDF.
          </span>

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
              <span>Cập nhật bảng đáp án</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
