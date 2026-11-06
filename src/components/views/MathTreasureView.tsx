import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Star,
  CheckCircle2,
  Lock,
  Play,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';

interface Quest {
  id: string;
  level: number;
  title: string;
  topic: string;
  xpReward: number;
  unlocked: boolean;
  completed: boolean;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
}

const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest-01',
    level: 1,
    title: 'Ải 1: Khởi động Đạo hàm Bậc ba',
    topic: 'Cực trị hàm số $y = ax^3 + bx^2 + cx + d$',
    xpReward: 100,
    unlocked: true,
    completed: true,
    question: 'Hàm số $y = x^3 - 3x + 1$ có bao nhiêu điểm cực trị?',
    options: ['Có 2 điểm cực trị', 'Có 1 điểm cực trị', 'Không có cực trị', 'Có 3 điểm cực trị'],
    correctAnswer: 'A',
    hint: 'Xét dấu đạo hàm $y\' = 3x^2 - 3 = 0 \\iff x = \\pm 1$.',
  },
  {
    id: 'quest-02',
    level: 2,
    title: 'Ải 2: Vòng tròn Lượng giác Đơn vị',
    topic: 'Giá trị $\\sin, \\cos$ của góc đặc biệt',
    xpReward: 150,
    unlocked: true,
    completed: false,
    question: 'Tính giá trị của biểu thức $P = \\sin^2(15^\\circ) + \\sin^2(75^\\circ)$:',
    options: ['$1$', '$\\frac{1}{2}$', '$\\frac{\\sqrt{3}}{2}$', '$2$'],
    correctAnswer: 'A',
    hint: 'Vì $15^\\circ + 75^\\circ = 90^\\circ$ nên $\\sin(75^\\circ) = \\cos(15^\\circ)$. Do đó $P = \\sin^2(15^\\circ) + \\cos^2(15^\\circ) = 1$.',
  },
  {
    id: 'quest-03',
    level: 3,
    title: 'Ải 3: Mê cung Không gian Oxyz',
    topic: 'Góc giữa hai vectơ pháp tuyến',
    xpReward: 200,
    unlocked: true,
    completed: false,
    question: 'Cho hai mặt phẳng $(P): x - 2y + 2z - 1 = 0$ và $(Q): 2x - 4y + 4z + 5 = 0$. Vị trí tương đối của $(P)$ và $(Q)$ là:',
    options: ['Song song với nhau', 'Cắt nhau nhưng không vuông góc', 'Trùng nhau', 'Vuông góc với nhau'],
    correctAnswer: 'A',
    hint: 'So sánh tỉ số: $\\frac{1}{2} = \\frac{-2}{-4} = \\frac{2}{4} \\ne \\frac{-1}{5}$.',
  },
  {
    id: 'quest-04',
    level: 4,
    title: 'Ải 4: Kho báu Tích phân & Hình phẳng',
    topic: 'Ứng dụng tích phân tính diện tích',
    xpReward: 300,
    unlocked: false,
    completed: false,
    question: 'Diện tích hình phẳng giới hạn bởi parabol $y = x^2$ và đường thẳng $y = 2x$ bằng:',
    options: ['$\\frac{4}{3}$', '$\\frac{2}{3}$', '$2$', '$\\frac{8}{3}$'],
    correctAnswer: 'A',
    hint: 'Phương trình hoành độ giao điểm $x^2 - 2x = 0 \\iff x = 0, x = 2$. $S = \\int_0^2 (2x - x^2)dx = [x^2 - \\frac{x^3}{3}]_0^2 = 4 - \\frac{8}{3} = \\frac{4}{3}$.',
  },
];

export const MathTreasureView: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const completedCount = quests.filter((q) => q.completed).length;
  const totalXp = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.xpReward, 0);

  const handleStartQuest = (quest: Quest) => {
    setActiveQuest(quest);
    setSelectedOption(null);
    setShowFeedback(false);
    setIsSuccess(false);
    soundService.playClick();
  };

  const handleSubmitAnswer = () => {
    if (!activeQuest || !selectedOption) return;

    if (selectedOption === activeQuest.correctAnswer) {
      setIsSuccess(true);
      setShowFeedback(true);
      soundService.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      // Mark completed & unlock next
      setQuests((prev) =>
        prev.map((q, idx) => {
          if (q.id === activeQuest.id) {
            return { ...q, completed: true };
          }
          if (idx === activeQuest.level && !q.unlocked) {
            return { ...q, unlocked: true };
          }
          return q;
        })
      );
    } else {
      setIsSuccess(false);
      setShowFeedback(true);
      soundService.playWarning();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Kho báu Toán học &amp; Vượt ải Thử thách
            </h1>
            <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Cấp độ THPT GDPT 2018
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Giải câu đố toán học, tích lũy điểm kinh nghiệm (XP) và mở khóa các danh hiệu Toán học.
          </p>
        </div>

        {/* Player Profile Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>{totalXp} XP</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>{completedCount} / {quests.length} Ải</span>
          </div>
        </div>
      </div>

      {/* Quests Map Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`p-5 rounded-2xl border transition-all ${
              quest.completed
                ? 'bg-emerald-50/40 border-emerald-200'
                : quest.unlocked
                ? 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded">
                  Cấp độ {quest.level} · +{quest.xpReward} XP
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-2">{quest.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{quest.topic}</p>
              </div>

              <div>
                {quest.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : quest.unlocked ? (
                  <Star className="w-6 h-6 text-amber-400" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                {quest.completed ? 'Đã chinh phục' : quest.unlocked ? 'Sẵn sàng thử thách' : 'Khóa'}
              </span>

              {quest.unlocked && (
                <button
                  type="button"
                  onClick={() => handleStartQuest(quest)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    quest.completed
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  {quest.completed ? 'Chơi lại' : 'Vượt ải ngay'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quest Challenge Modal */}
      {activeQuest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase">
                  {activeQuest.title}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{activeQuest.topic}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Question Text */}
            <div className="text-sm font-semibold text-slate-900 leading-relaxed">
              <MathRenderer content={activeQuest.question} />
            </div>

            {/* Options */}
            <div className="space-y-2 text-xs">
              {activeQuest.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === letter;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedOption(letter);
                      setShowFeedback(false);
                      soundService.playClick();
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold ring-1 ring-amber-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-amber-500 text-white' : 'bg-white border text-slate-500'
                      }`}
                    >
                      {letter}
                    </span>
                    <MathRenderer content={opt} inline />
                  </button>
                );
              })}
            </div>

            {/* Feedback & Hint */}
            {showFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-1 animate-in fade-in ${
                  isSuccess
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border border-rose-200 text-rose-950'
                }`}
              >
                <p className="font-bold">
                  {isSuccess
                    ? `🎉 Xuất sắc! Bạn đã vượt ải thành công (+${activeQuest.xpReward} XP)!`
                    : '✗ Câu trả lời chưa chính xác. Hãy xem gợi ý giải:'}
                </p>
                <div className="text-[11px] leading-relaxed">
                  <MathRenderer content={activeQuest.hint} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveQuest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Đóng
              </button>

              <button
                type="button"
                disabled={!selectedOption}
                onClick={handleSubmitAnswer}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs shadow-xs"
              >
                Xác nhận câu trả lời
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathTreasureView;
