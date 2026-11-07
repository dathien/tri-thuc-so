import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Atom,
} from 'lucide-react';
import MathRenderer from '../MathRenderer';
import { SectionKey } from '../Sidebar';
import { soundService } from '../../utils/audio';

interface Lesson {
  id: string;
  grade: 10 | 11 | 12;
  chapter: string;
  title: string;
  duration: string;
  objectives: string[];
  coreConcepts: string[];
  exampleFormula: string;
  exampleSolution: string;
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  hasLabLink?: boolean;
}

const LESSONS: Lesson[] = [
  {
    id: 'les-12-01',
    grade: 12,
    chapter: 'Chương 1: Ứng dụng đạo hàm khảo sát hàm số',
    title: 'Bài 1: Tính đơn điệu và Cực trị của hàm số',
    duration: '45 phút',
    objectives: [
      'Nắm vững định lý về dấu của đạo hàm $y\' = f\'(x)$ và tính đồng biến, nghịch biến',
      'Xác định điểm cực đại, điểm cực tiểu của hàm số qua bảng biến thiên',
      'Giải quyết bài toán thực tế tối ưu hóa sử dụng cực trị',
    ],
    coreConcepts: [
      'Cho hàm số $y = f(x)$ có đạo hàm trên khoảng $K$. Nếu $f\'(x) > 0, \\forall x \\in K$ thì hàm số đồng biến trên $K$.',
      'Nếu $f\'(x)$ đổi dấu từ dương sang âm khi qua $x_0$ thì $x_0$ là điểm cực đại của hàm số.',
      'Quy tắc 2: Nếu $f\'(x_0) = 0$ và $f\'\'(x_0) < 0$ thì $x_0$ là điểm cực đại.',
    ],
    exampleFormula: 'Tìm cực trị của hàm số bậc ba $y = x^3 - 3x^2 + 2$.',
    exampleSolution:
      'Đạo hàm $y\' = 3x^2 - 6x = 3x(x - 2)$. Nghiệm $y\' = 0 \\iff x = 0$ hoặc $x = 2$. Do $y\'$ đổi dấu qua $x = 0$ từ $(+) \\to (-)$ nên điểm cực đại là $x_{CĐ} = 0, y_{CĐ} = 2$. Qua $x = 2$ từ $(-) \\to (+)$ nên $x_{CT} = 2, y_{CT} = -2$.',
    quickCheck: {
      question: 'Hàm số $y = -x^3 + 3x$ nghịch biến trên khoảng nào sau đây?',
      options: ['$(-\\infty; -1)$ và $(1; +\\infty)$', '$(-1; 1)$', '$(0; +\\infty)$', '$(-\\infty; 0)$'],
      correctIndex: 0,
      explanation: 'Ta có $y\' = -3x^2 + 3 = -3(x^2 - 1)$. $y\' < 0 \\iff x^2 > 1 \\iff x \\in (-\\infty; -1) \\cup (1; +\\infty)$.',
    },
    hasLabLink: true,
  },
  {
    id: 'les-12-02',
    grade: 12,
    chapter: 'Chương 2: Tọa độ trong không gian Oxyz',
    title: 'Bài 2: Phương trình mặt phẳng trong không gian Oxyz',
    duration: '45 phút',
    objectives: [
      'Hiểu khái niệm vectơ pháp tuyến $\\vec{n} = (A; B; C)$ của mặt phẳng',
      'Lập phương trình tổng quát mặt phẳng $(\\alpha): Ax + By + Cz + D = 0$',
      'Xác định vị trí tương đối giữa hai mặt phẳng (song song, cắt nhau, vuông góc)',
    ],
    coreConcepts: [
      'Mặt phẳng đi qua $M_0(x_0; y_0; z_0)$ nhận $\\vec{n} = (A; B; C) \\ne \\vec{0}$ làm VTPT có phương trình: $A(x - x_0) + B(y - y_0) + C(z - z_0) = 0$.',
      'Khoảng cách từ điểm $M(x_M; y_M; z_M)$ đến $(\\alpha)$ là: $d(M, (\\alpha)) = \\frac{|Ax_M + By_M + Cz_M + D|}{\\sqrt{A^2 + B^2 + C^2}}$.',
    ],
    exampleFormula: 'Viết phương trình mặt phẳng $(\\alpha)$ đi qua $A(1; 2; -1)$ và vuông góc với đường thẳng nhận $\\vec{u} = (2; -1; 3)$ làm VTCP.',
    exampleSolution:
      'Vì $(\\alpha) \\perp d$ nên VTPT của $(\\alpha)$ là $\\vec{n} = \\vec{u} = (2; -1; 3)$. Phương trình $(\\alpha)$ là: $2(x - 1) - 1(y - 2) + 3(z + 1) = 0 \\iff 2x - y + 3z + 3 = 0$.',
    quickCheck: {
      question: 'Vectơ nào sau đây là một vectơ pháp tuyến của mặt phẳng $(\\alpha): 3x - 2y + z - 5 = 0$?',
      options: ['$\\vec{n} = (3; -2; 1)$', '$\\vec{n} = (3; 2; 1)$', '$\\vec{n} = (3; -2; -5)$', '$\\vec{n} = (3; 0; 1)$'],
      correctIndex: 0,
      explanation: 'Tọa độ VTPT được lấy trực tiếp từ các hệ số của x, y, z: $(3; -2; 1)$.',
    },
    hasLabLink: true,
  },
  {
    id: 'les-11-01',
    grade: 11,
    chapter: 'Chương 1: Hàm số lượng giác',
    title: 'Bài 1: Giá trị lượng giác của góc lượng giác',
    duration: '45 phút',
    objectives: [
      'Hiểu khái niệm góc lượng giác và đường tròn lượng giác đơn vị',
      'Biểu diễn các cung lượng giác có cùng điểm ngọn',
      'Nắm vững hệ thức cơ bản $\\sin^2\\alpha + \\cos^2\\alpha = 1$',
    ],
    coreConcepts: [
      'Đường tròn đơn vị có tâm tại gốc tọa độ $O(0; 0)$ và bán kính $R = 1$.',
      'Tung độ của điểm $M$ biểu diễn góc $\\alpha$ là $\\sin\\alpha$, hoành độ là $\\cos\\alpha$.',
      'Tính chất tuần hoàn: $\\sin(\\alpha + k2\\pi) = \\sin\\alpha, \\cos(\\alpha + k2\\pi) = \\cos\\alpha$.',
    ],
    exampleFormula: 'Cho $\\cos\\alpha = -\\frac{3}{5}$ với $\\frac{\\pi}{2} < \\alpha < \\pi$. Tính $\\sin\\alpha$.',
    exampleSolution:
      'Vì $\\sin^2\\alpha + \\cos^2\\alpha = 1 \\implies \\sin^2\\alpha = 1 - \\frac{9}{25} = \\frac{16}{25}$. Vì $\\alpha$ thuộc góc phần tư thứ II nên $\\sin\\alpha > 0$. Do đó $\\sin\\alpha = \\frac{4}{5}$.',
    quickCheck: {
      question: 'Giá trị của $\\cos(2\\pi)$ bằng bao nhiêu?',
      options: ['$1$', '$0$', '$-1$', '$\\frac{1}{2}$'],
      correctIndex: 0,
      explanation: 'Điểm biểu diễn góc $2\\pi$ trùng với điểm $A(1; 0)$ trên trục hoành, do đó $\\cos(2\\pi) = 1$.',
    },
    hasLabLink: true,
  },
];

interface LearningPathViewProps {
  onNavigate: (section: SectionKey) => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({ onNavigate }) => {
  const [selectedGrade, setSelectedGrade] = useState<10 | 11 | 12>(12);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0]?.id || '');
  const [userSelectedOption, setUserSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const gradeLessons = LESSONS.filter((l) => l.grade === selectedGrade);
  const currentLesson = gradeLessons.find((l) => l.id === selectedLessonId) || gradeLessons[0] || LESSONS[0];

  const handleSelectOption = (idx: number) => {
    setUserSelectedOption(idx);
    setShowExplanation(true);
    if (idx === currentLesson.quickCheck.correctIndex) {
      soundService.playSuccess();
    } else {
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
              Lộ trình Tự học Toán THPT
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              Mục tiêu &amp; Đánh giá Năng lực
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cung cấp kiến thức trọng tâm, ví dụ minh họa chi tiết, tự kiểm tra hiểu bài và kết nối Phòng Lab 2D/3D.
          </p>
        </div>

        {/* Grade Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {([12, 11, 10] as const).map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => {
                setSelectedGrade(grade);
                setUserSelectedOption(null);
                setShowExplanation(false);
                soundService.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedGrade === grade
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toán {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Lesson Syllabus List (4 cols) & Lesson Workspace (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lesson Tree */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Danh mục Chuyên đề Khối {selectedGrade}
          </h2>

          <div className="space-y-2">
            {gradeLessons.map((les) => {
              const isSelected = currentLesson.id === les.id;
              return (
                <div
                  key={les.id}
                  onClick={() => {
                    setSelectedLessonId(les.id);
                    setUserSelectedOption(null);
                    setShowExplanation(false);
                    soundService.playClick();
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 font-semibold text-indigo-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block font-normal">{les.chapter}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="leading-snug">{les.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Lesson Viewer */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          {/* Lesson Header */}
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
              {currentLesson.chapter}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{currentLesson.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Thời lượng học tập đề xuất: {currentLesson.duration}</p>
          </div>

          {/* Section 1: Objectives */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              1. Yêu cầu cần đạt (Mục tiêu bài học):
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 leading-relaxed">
              {currentLesson.objectives.map((obj, i) => (
                <li key={i}>
                  <MathRenderer content={obj} inline />
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Core Concepts */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              2. Kiến thức trọng tâm:
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-slate-800 leading-relaxed">
              {currentLesson.coreConcepts.map((concept, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <div>
                    <MathRenderer content={concept} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Worked Example */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              3. Ví dụ minh họa có lời giải:
            </h3>
            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/60 space-y-2 text-slate-800 leading-relaxed">
              <div className="font-bold text-slate-900">
                <MathRenderer content={currentLesson.exampleFormula} />
              </div>
              <div className="pt-2 border-t border-amber-200/40 text-slate-700">
                <span className="font-bold text-amber-800 block text-[11px] mb-1">Hướng dẫn giải:</span>
                <MathRenderer content={currentLesson.exampleSolution} />
              </div>
            </div>
          </div>

          {/* Section 4: Quick Comprehension Check */}
          <div className="space-y-3 text-xs pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              4. Tự kiểm tra mức độ hiểu:
            </h3>
            <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200/60 space-y-3">
              <p className="font-semibold text-slate-900">
                <MathRenderer content={currentLesson.quickCheck.question} />
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentLesson.quickCheck.options.map((opt, optIdx) => {
                  const isSelected = userSelectedOption === optIdx;
                  const isCorrect = optIdx === currentLesson.quickCheck.correctIndex;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? isCorrect
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                            : 'bg-rose-100 border-rose-400 text-rose-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-bold text-slate-500 mr-1.5">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <MathRenderer content={opt} inline />
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div className="mt-2 p-3 rounded-lg bg-white border border-purple-200 text-xs text-purple-950 space-y-1 animate-in fade-in">
                  <p className="font-bold">
                    {userSelectedOption === currentLesson.quickCheck.correctIndex
                      ? '✓ Chính xác! Bạn đã nắm chắc kiến thức.'
                      : '✗ Chưa đúng. Hãy xem lại lời giải chi tiết:'}
                  </p>
                  <MathRenderer content={currentLesson.quickCheck.explanation} />
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Link to Interactive Math Lab */}
          {currentLesson.hasLabLink && (
            <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-cyan-900">
                <Atom className="w-5 h-5 text-cyan-700 shrink-0" />
                <span>
                  Bài học này có mô phỏng tương tác 2D/3D trong <strong>Phòng Lab Toán học</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  onNavigate('math-lab');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-700 text-white font-bold hover:bg-cyan-800 transition-colors flex items-center gap-1 shrink-0"
              >
                Mở Phòng Lab <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPathView;
