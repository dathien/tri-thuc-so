import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Users,
  Grid3X3,
  Atom,
  Trophy,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { SectionKey } from './Sidebar';
import { soundService } from '../utils/audio';
import MathRenderer from './MathRenderer';

interface SlideData {
  id: number;
  title: string;
  tagline: string;
  description: string;
  bulletPoints: string[];
  ctaLabel: string;
  targetSection: SectionKey;
  gradient: string;
  accentColor: string;
  icon: React.ElementType;
  illustrationBadge: string;
  mathFormula?: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    title: 'EduTest Smart – Dạy học & Khảo thí Đột phá',
    tagline: 'Chương trình GDPT 2018 Môn Toán THPT',
    description:
      'Nền tảng đồng bộ từ thiết kế ma trận, ngân hàng câu hỏi chuẩn hóa, tổ chức thi trực tuyến giám sát thời gian thực đến phân tích năng lực toán học của học sinh.',
    bulletPoints: [
      'Ngân hàng câu hỏi phân cấp 4 mức độ nhận thức',
      'Chấm điểm tự động và cảnh báo giám sát trung thực',
      'Phát triển năng lực tự học và tư duy mô hình hóa Toán học',
    ],
    ctaLabel: 'Khám phá Tổng quan Hệ thống',
    targetSection: 'overview',
    gradient: 'from-indigo-600 via-indigo-700 to-purple-800',
    accentColor: 'text-indigo-200',
    icon: Sparkles,
    illustrationBadge: 'Nền tảng Thông minh',
    mathFormula: 'f(x) \\rightarrow \\int_a^b f(t)dt \\quad | \\quad \\vec{u} \\cdot \\vec{v}',
  },
  {
    id: 2,
    title: 'Lớp học & Quản lý Học sinh Thông minh',
    tagline: 'Theo dõi Tiến độ & Đánh giá Quá trình',
    description:
      'Tổ chức lớp học khoa học, nhập danh sách học sinh từ Excel, giao bài tập theo lớp hoặc cá nhân hóa nhiệm vụ. Báo cáo phân tích điểm số tự động cập nhật.',
    bulletPoints: [
      'Quản lý hồ sơ học tập và phân nhóm học sinh đa tầng',
      'Giao bài theo năng lực, theo dõi trạng thái nộp bài',
      'Xuất phiếu đánh giá kết quả học tập nhanh chóng',
    ],
    ctaLabel: 'Đến Quản lý Lớp & Học sinh',
    targetSection: 'classes',
    gradient: 'from-blue-600 via-indigo-600 to-indigo-800',
    accentColor: 'text-blue-200',
    icon: Users,
    illustrationBadge: 'Quản lý Dạy học',
    mathFormula: '\\mu = \\frac{1}{n}\\sum x_i, \\quad \\sigma^2 = \\frac{1}{n}\\sum (x_i - \\bar{x})^2',
  },
  {
    id: 3,
    title: 'Kiểm tra & Đánh giá Năng lực Chuẩn hóa',
    tagline: 'Ma trận Đặc tả & Đề thi Đa cấu trúc',
    description:
      'Thiết lập ma trận đề thi đúng quy định Bộ Giáo dục: trắc nghiệm 4 lựa chọn, đúng/sai, trả lời ngắn và tự luận. Hệ thống tự động kiểm tra tính thống nhất điểm số.',
    bulletPoints: [
      'Tạo đề từ ngân hàng câu hỏi hoặc ma trận tự động',
      'Phòng thi trực tuyến với giám sát chuyển tab',
      'Thống kê phổ điểm, độ khó và độ phân hóa từng câu',
    ],
    ctaLabel: 'Khám phá Kho đề & Khảo thí',
    targetSection: 'exam-builder',
    gradient: 'from-violet-700 via-indigo-700 to-slate-900',
    accentColor: 'text-violet-200',
    icon: Grid3X3,
    illustrationBadge: 'Khảo thí GDPT 2018',
    mathFormula: '\\Delta = b^2 - 4ac \\ge 0 \\implies x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}',
  },
  {
    id: 4,
    title: 'Phòng Lab Toán học 2D/3D Trực quan',
    tagline: 'Mô phỏng Đồ thị & Hình học Không gian',
    description:
      'Khám phá chương trình Toán 10–12 qua mô phỏng tương tác: đồ thị hàm bậc ba động, parabol thực tế, tọa độ không gian 3D Oxyz xoay 360° và vòng tròn lượng giác.',
    bulletPoints: [
      'Điều khiển tham số đồ thị bằng thanh trượt trực quan',
      'Mô hình 3D xoay, thu phóng, quan sát đa góc nhìn',
      'Đối chiếu bảng danh mục bài học theo SGK mới',
    ],
    ctaLabel: 'Vào Phòng Lab Toán học 2D/3D',
    targetSection: 'math-lab',
    gradient: 'from-teal-700 via-cyan-800 to-indigo-900',
    accentColor: 'text-cyan-200',
    icon: Atom,
    illustrationBadge: 'Mô phỏng 2D/3D',
    mathFormula: '(\\alpha): Ax + By + Cz + D = 0',
  },
  {
    id: 5,
    title: 'Học tập Tương tác, Kho báu & Minigame',
    tagline: 'Tạo Hứng thú & Gắn kết Lớp học',
    description:
      'Lộ trình tự học theo chuyên đề, thử thách Kho báu Toán học vượt ải rèn luyện tư duy, và công cụ Minigame Vòng quay gọi tên học sinh ngẫu nhiên sôi nổi.',
    bulletPoints: [
      'Vòng quay gọi tên ngẫu nhiên kết nối danh sách học sinh thật',
      'Thử thách toán vui, huy hiệu thành tích học tập',
      'Lộ trình bài giảng tự học chi tiết từ cơ bản đến nâng cao',
    ],
    ctaLabel: 'Trải nghiệm Minigame & Tự học',
    targetSection: 'minigame',
    gradient: 'from-amber-600 via-orange-600 to-indigo-900',
    accentColor: 'text-amber-200',
    icon: Trophy,
    illustrationBadge: 'Tương tác & Đổi mới',
    mathFormula: 'P(A|B) = \\frac{P(B|A)P(A)}{P(B)} \\quad | \\quad \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
  },
];

const AUTOPLAY_INTERVAL_MS = 5500;

interface OverviewSliderProps {
  onNavigate: (section: SectionKey) => void;
}

export const OverviewSlider: React.FC<OverviewSliderProps> = ({ onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    setProgress(0);
    soundService.playSlide();
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    setProgress(0);
    soundService.playSlide();
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    soundService.playSlide();
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    soundService.playClick();
  };

  // Manage auto-advance & progress bar
  useEffect(() => {
    if (isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / AUTOPLAY_INTERVAL_MS) * 100;

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPaused, nextSlide]);

  const activeSlide = SLIDES[currentIndex];
  const IconComponent = activeSlide.icon;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-900 text-white transition-all duration-300">
      {/* Background Gradient & Animated Shapes */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${activeSlide.gradient} transition-all duration-700 opacity-95`}
      />

      {/* Subtle grid pattern background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Slider Progress Bar */}
      <div className="relative w-full h-1 bg-black/20 overflow-hidden">
        <div
          className="h-full bg-amber-300/90 transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Slide Content Area */}
      <div className="relative z-10 px-6 py-7 sm:px-8 sm:py-9">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text Column (8 cols on large screens) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                <IconComponent className="w-3.5 h-3.5 text-amber-300" />
                {activeSlide.illustrationBadge}
              </span>
              <span className="text-xs font-medium text-white/80">
                {activeSlide.tagline}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-snug">
              {activeSlide.title}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-2xl">
              {activeSlide.description}
            </p>

            {/* Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-indigo-50">
              {activeSlide.bulletPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-2xs border border-white/10">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight font-medium">{point}</span>
                </div>
              ))}
            </div>

            {/* Slide Action CTA Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  onNavigate(activeSlide.targetSection);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs sm:text-sm hover:bg-indigo-50 transition-all duration-150 shadow-md hover:shadow-lg active:scale-95"
              >
                <span>{activeSlide.ctaLabel}</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>

              <span className="text-[11px] text-white/70 italic hidden sm:inline">
                Chuyển slide sau 5.5s · Bấm nút để vào phân hệ
              </span>
            </div>
          </div>

          {/* Right Preview Card / Math Badge (4 cols) */}
          <div className="lg:col-span-4 hidden lg:flex flex-col items-center justify-center">
            <div className="w-full max-w-xs bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shadow-inner space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 flex items-center justify-center shadow-lg border border-white/30">
                <IconComponent className="w-7 h-7 text-amber-300" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">
                  Toán học GDPT 2018
                </span>
                <p className="text-xs font-semibold text-white">
                  Slide {currentIndex + 1} / {SLIDES.length}
                </p>
              </div>

              {activeSlide.mathFormula && (
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 text-xs text-amber-200 overflow-x-auto whitespace-nowrap flex items-center justify-center">
                  <MathRenderer content={activeSlide.mathFormula} inline />
                </div>
              )}

              <div className="text-[10px] text-indigo-200/80">
                Cập nhật đồng bộ với cấu trúc ma trận &amp; đề thi Bộ GD&amp;ĐT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Controls Bar (Prev/Next, Dots, Play/Pause) */}
      <div className="relative z-10 px-6 py-3 bg-black/25 backdrop-blur-xs border-t border-white/10 flex items-center justify-between">
        {/* Slide Dots Indicator */}
        <div className="flex items-center gap-2">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? 'w-7 bg-amber-400'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              title={`Chuyển đến Slide ${idx + 1}: ${slide.title}`}
              aria-label={`Trang ${idx + 1}`}
            />
          ))}
          <span className="text-[11px] text-white/70 font-medium ml-2">
            {currentIndex + 1} / {SLIDES.length}
          </span>
        </div>

        {/* Play/Pause & Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={togglePause}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isPaused ? 'Tiếp tục tự động chuyển slide' : 'Tạm dừng chuyển slide'}
            aria-label={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-300" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={prevSlide}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Slide trước"
            aria-label="Slide trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Slide kế tiếp"
            aria-label="Slide tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewSlider;
