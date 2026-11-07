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
  CheckCircle2,
  BookOpen,
  FileText,
  BarChart2,
  Compass,
  Check,
  TrendingUp,
  Star,
  Dices,
  ShieldCheck,
} from 'lucide-react';
import { SectionKey } from './Sidebar';
import { soundService } from '../utils/audio';
import MathRenderer from './MathRenderer';

const AUTOPLAY_INTERVAL_MS = 5500;

interface OverviewSliderProps {
  onNavigate: (section: SectionKey) => void;
}

export const OverviewSlider: React.FC<OverviewSliderProps> = ({ onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % 5);
    setProgress(0);
    soundService.playSlide();
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + 5) % 5);
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

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
      {/* Top Slider Progress Bar */}
      <div className="relative w-full h-1 bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Slide Carousel Content */}
      <div className="relative min-h-[380px] sm:min-h-[340px] flex items-center p-6 sm:p-8 lg:p-10">
        {/* ========================================================================= */}
        {/* SLIDE 1: Khám phá EduTest Smart (Blue #2563EB & Light Blue #DBEAFE) */}
        {/* ========================================================================= */}
        {currentIndex === 0 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center animate-in fade-in duration-300">
            {/* Left Info: 45% */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#DBEAFE] text-[#2563EB] border border-[#2563EB]/20">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                Nền tảng GDPT 2018 Môn Toán
              </span>

              <h2 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight leading-snug">
                Khám phá EduTest Smart
              </h2>

              <p className="text-[15px] text-slate-600 leading-relaxed">
                Đồng bộ ma trận đặc tả, ngân hàng câu hỏi chuẩn hóa và tổ chức kiểm tra số thông minh cho trường THPT.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onNavigate('overview');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-[15px] shadow-sm hover:shadow transition-all"
                >
                  <span>Khám phá Hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual Graphic (55%) */}
            <div className="lg:col-span-7 flex items-center justify-center">
              <div className="w-full max-w-lg bg-gradient-to-br from-[#DBEAFE]/60 to-blue-50/40 rounded-2xl p-6 border border-[#2563EB]/20 relative overflow-hidden">
                {/* Floating ambient badge 1 */}
                <div className="absolute top-3 right-4 anim-float-slow bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs flex items-center gap-2 text-xs font-bold text-[#2563EB]">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  f&apos;(x) &gt; 0 Đồng biến
                </div>

                {/* Floating ambient badge 2 */}
                <div className="absolute bottom-3 left-4 anim-float-reverse bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  Chuẩn 4 Mức nhận thức
                </div>

                {/* Central Digital Learning Canvas Illustration */}
                <div className="bg-white rounded-xl border border-blue-200/80 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      edutest-smart-math.edu.vn
                    </span>
                  </div>

                  {/* SVG Function Curve & Dynamic Geometry */}
                  <div className="h-32 sm:h-36 w-full bg-slate-50 rounded-lg relative overflow-hidden flex items-center justify-center">
                    <svg
                      viewBox="0 0 360 120"
                      className="w-full h-full text-blue-600"
                      preserveAspectRatio="none"
                    >
                      {/* Grid background */}
                      <defs>
                        <pattern
                          id="grid-blue"
                          width="20"
                          height="20"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 20 0 L 0 0 0 20"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="0.8"
                          />
                        </pattern>
                      </defs>
                      <rect width="360" height="120" fill="url(#grid-blue)" />

                      {/* Coordinate axes */}
                      <line x1="30" y1="60" x2="340" y2="60" stroke="#94A3B8" strokeWidth="1.2" />
                      <line x1="180" y1="10" x2="180" y2="110" stroke="#94A3B8" strokeWidth="1.2" />

                      {/* Smooth cubic curve */}
                      <path
                        d="M 50 100 C 110 10, 150 20, 180 60 C 210 100, 250 110, 310 20"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                      />

                      {/* Extremum points */}
                      <circle cx="120" cy="28" r="4.5" fill="#2563EB" />
                      <circle cx="240" cy="92" r="4.5" fill="#EA580C" />
                    </svg>

                    {/* Overlay info badges */}
                    <div className="absolute top-2 left-3 bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold px-2 py-0.5 rounded font-mono">
                      Cực đại y_CD = 3
                    </div>
                    <div className="absolute bottom-2 right-3 bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded font-mono">
                      Cực tiểu y_CT = -1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 2: Lớp học kết nối (Teal #0D9488 & Mint #CCFBF1) */}
        {/* ========================================================================= */}
        {currentIndex === 1 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center animate-in fade-in duration-300">
            {/* Left Info: 45% */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#CCFBF1] text-[#0D9488] border border-[#0D9488]/20">
                <Users className="w-4 h-4 text-[#0D9488]" />
                Quản lý Dạy học &amp; Tiến độ
              </span>

              <h2 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight leading-snug">
                Lớp học Kết nối Thông minh
              </h2>

              <p className="text-[15px] text-slate-600 leading-relaxed">
                Quản lý hồ sơ học sinh khoa học, theo dõi nộp bài trực tuyến và đánh giá năng lực học tập tức thì.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onNavigate('classes');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-[15px] shadow-sm hover:shadow transition-all"
                >
                  <span>Đến Quản lý Lớp &amp; Học sinh</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual Graphic (55%) */}
            <div className="lg:col-span-7 flex items-center justify-center">
              <div className="w-full max-w-lg bg-gradient-to-br from-[#CCFBF1]/50 to-teal-50/40 rounded-2xl p-6 border border-[#0D9488]/20 relative overflow-hidden">
                {/* Modern Roster & Progress Cards */}
                <div className="space-y-3">
                  {/* Class Header Banner */}
                  <div className="bg-white rounded-xl p-3.5 border border-teal-200/70 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#CCFBF1] text-[#0D9488] font-bold flex items-center justify-center text-sm font-mono">
                        12A1
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Lớp 12A1 · Chuyên Toán</h4>
                        <p className="text-[12px] text-slate-500">GV: Thầy Hồ Nguyễn Đa Thiện</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                      Sĩ số: 38 học sinh
                    </span>
                  </div>

                  {/* Student Cards with Progress */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 anim-pulse-subtle">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Trần Thị Ngọc Bích</span>
                        <span className="font-mono font-bold text-teal-700">10.0đ</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full w-full" />
                      </div>
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đã hoàn thành 100% nhiệm vụ
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Nguyễn Văn An</span>
                        <span className="font-mono font-bold text-teal-700">9.25đ</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full w-[92%]" />
                      </div>
                      <p className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Nộp bài đúng hạn
                      </p>
                    </div>
                  </div>

                  {/* Submission Status Bar */}
                  <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-teal-200/60 flex items-center justify-between text-xs text-slate-600">
                    <span>Tiến độ nộp bài bài kiểm tra định kì:</span>
                    <span className="font-mono font-bold text-teal-800 bg-[#CCFBF1] px-2 py-0.5 rounded">
                      36 / 38 đã nộp (95%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 3: Kiểm tra thông minh (Indigo #4F46E5 & Soft Violet #E0E7FF) */}
        {/* ========================================================================= */}
        {currentIndex === 2 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center animate-in fade-in duration-300">
            {/* Left Info: 45% */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#E0E7FF] text-[#4F46E5] border border-[#4F46E5]/20">
                <Grid3X3 className="w-4 h-4 text-[#4F46E5]" />
                Khảo thí &amp; Đánh giá Chuẩn hóa
              </span>

              <h2 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight leading-snug">
                Khảo thí Thông minh GDPT 2018
              </h2>

              <p className="text-[15px] text-slate-600 leading-relaxed">
                Tổ chức kiểm tra trực tuyến với ma trận đặc tả, giám sát chuyển tab trung thực và phổ điểm tự động.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onNavigate('exam-builder');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-[15px] shadow-sm hover:shadow transition-all"
                >
                  <span>Tạo &amp; Quản lý Đề thi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual Graphic (55%) */}
            <div className="lg:col-span-7 flex items-center justify-center">
              <div className="w-full max-w-lg bg-gradient-to-br from-[#E0E7FF]/60 to-indigo-50/40 rounded-2xl p-6 border border-[#4F46E5]/20 relative overflow-hidden">
                {/* Smart Exam Sheet Graphic */}
                <div className="bg-white rounded-xl p-4 border border-indigo-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#4F46E5]" />
                      <span className="font-bold text-xs text-slate-800">
                        Phiếu Làm Bài Trắc nghiệm Số hóa
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> Giám sát Live
                    </span>
                  </div>

                  {/* Simulated Question Grid with Selection bubbles */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      { num: 1, ans: 'A', correct: true },
                      { num: 2, ans: 'C', correct: true },
                      { num: 3, ans: 'B', correct: true },
                      { num: 4, ans: 'D', correct: true },
                    ].map((item) => (
                      <div
                        key={item.num}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Câu {item.num}
                        </span>
                        <span className="w-6 h-6 mx-auto mt-1 rounded-full bg-[#4F46E5] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {item.ans}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Real-time Score Distribution Bar chart */}
                  <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-950 flex items-center gap-1">
                        <BarChart2 className="w-3.5 h-3.5 text-[#4F46E5]" /> Phổ điểm phân hóa:
                      </span>
                      <span className="font-mono font-bold text-[#4F46E5]">ĐTB: 8.92 / 10</span>
                    </div>

                    <div className="flex items-end gap-2 h-10 pt-1">
                      <div className="flex-1 bg-indigo-200 rounded-t h-[40%]" title="Dưới 7: 10%" />
                      <div className="flex-1 bg-indigo-300 rounded-t h-[65%]" title="7-8: 25%" />
                      <div className="flex-1 bg-[#4F46E5] rounded-t h-[95%]" title="8-9: 45%" />
                      <div className="flex-1 bg-purple-600 rounded-t h-[75%]" title="9-10: 20%" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 4: Phòng Lab Toán học 2D/3D (Deep Blue #1E40AF & Soft Cyan #CFFAFE) */}
        {/* ========================================================================= */}
        {currentIndex === 3 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center animate-in fade-in duration-300">
            {/* Left Info: 45% */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#CFFAFE] text-[#1E40AF] border border-[#1E40AF]/20">
                <Atom className="w-4 h-4 text-[#1E40AF]" />
                Mô phỏng 2D/3D Tương tác
              </span>

              <h2 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight leading-snug">
                Phòng Lab Toán học 2D/3D
              </h2>

              <p className="text-[15px] text-slate-600 leading-relaxed">
                Mô phỏng đồ thị hàm số động, tọa độ không gian 3D Oxyz xoay 360° và vòng tròn lượng giác trực quan.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onNavigate('math-lab');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E40AF] hover:bg-blue-900 text-white font-bold text-[15px] shadow-sm hover:shadow transition-all"
                >
                  <span>Vào Phòng Lab 2D/3D</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual Graphic (55%) */}
            <div className="lg:col-span-7 flex items-center justify-center">
              <div className="w-full max-w-lg bg-gradient-to-br from-[#CFFAFE]/60 to-cyan-50/40 rounded-2xl p-6 border border-[#1E40AF]/20 relative overflow-hidden">
                {/* 3D Oxyz Coordinate & Geometry Illustration */}
                <div className="bg-white rounded-xl p-4 border border-cyan-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Không gian Tọa độ 3D Oxyz &amp; Mặt phẳng
                    </span>
                    <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      Góc nhìn 360°
                    </span>
                  </div>

                  {/* SVG 3D Isometric Axes with Interactive Plane */}
                  <div className="h-32 sm:h-36 w-full bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center text-white">
                    <svg
                      viewBox="0 0 320 130"
                      className="w-full h-full"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* 3D Origin */}
                      <g transform="translate(160, 75)">
                        {/* Z axis (up) */}
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="-60"
                          stroke="#38BDF8"
                          strokeWidth="2"
                          strokeDasharray="2,2"
                        />
                        <text x="5" y="-55" fill="#38BDF8" fontSize="11" fontWeight="bold">
                          Oz
                        </text>

                        {/* X axis (bottom-left) */}
                        <line x1="0" y1="0" x2="-80" y2="40" stroke="#F43F5E" strokeWidth="2" />
                        <text x="-95" y="45" fill="#F43F5E" fontSize="11" fontWeight="bold">
                          Ox
                        </text>

                        {/* Y axis (bottom-right) */}
                        <line x1="0" y1="0" x2="90" y2="35" stroke="#10B981" strokeWidth="2" />
                        <text x="95" y="40" fill="#10B981" fontSize="11" fontWeight="bold">
                          Oy
                        </text>

                        {/* Cutting Plane Polygon (alpha) */}
                        <polygon
                          points="-50,25 0,-40 60,20"
                          fill="rgba(56, 189, 248, 0.35)"
                          stroke="#38BDF8"
                          strokeWidth="1.8"
                        />

                        {/* Normal Vector n */}
                        <line x1="10" y1="5" x2="35" y2="-25" stroke="#FBBF24" strokeWidth="2.2" />
                        <text x="40" y="-22" fill="#FBBF24" fontSize="10" fontWeight="bold">
                          n⃗
                        </text>
                      </g>
                    </svg>

                    {/* Accurate Formula Badge rendered via MathRenderer */}
                    <div className="absolute bottom-2 inset-x-4 bg-black/60 backdrop-blur-xs text-amber-200 text-xs px-3 py-1.5 rounded-lg border border-white/20 text-center font-mono">
                      <MathRenderer content="(\alpha): Ax + By + Cz + D = 0" inline />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 5: Học tập qua thử thách (Orange #EA580C & Warm Amber #FEF3C7) */}
        {/* ========================================================================= */}
        {currentIndex === 4 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center animate-in fade-in duration-300">
            {/* Left Info: 45% */}
            <div className="lg:col-span-5 space-y-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#FEF3C7] text-[#EA580C] border border-[#EA580C]/20">
                <Trophy className="w-4 h-4 text-[#EA580C]" />
                Tương tác &amp; Hứng thú
              </span>

              <h2 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight leading-snug">
                Học tập qua Thử thách
              </h2>

              <p className="text-[15px] text-slate-600 leading-relaxed">
                Rèn luyện tư duy với Kho báu Toán học, lộ trình tự học và minigame vòng quay gọi tên học sinh sôi nổi.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onNavigate('minigame');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white font-bold text-[15px] shadow-sm hover:shadow transition-all"
                >
                  <span>Trải nghiệm Minigame &amp; Tự học</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual Graphic (55%) */}
            <div className="lg:col-span-7 flex items-center justify-center">
              <div className="w-full max-w-lg bg-gradient-to-br from-[#FEF3C7]/60 to-orange-50/40 rounded-2xl p-6 border border-[#EA580C]/20 relative overflow-hidden">
                {/* Gamified Achievement & Wheel Graphic */}
                <div className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#EA580C]" />
                      <span className="font-bold text-xs text-slate-800">
                        Hành trình Vượt ải Kho báu &amp; Vòng quay
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Huy hiệu Vàng
                    </span>
                  </div>

                  {/* 3 Challenge Roadmap Nodes */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                      <div className="w-7 h-7 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        1
                      </div>
                      <p className="font-bold text-slate-800 text-[11px]">Ải Đạo hàm</p>
                      <span className="text-[10px] text-emerald-600 font-semibold block">Đã mở</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
                      <div className="w-7 h-7 mx-auto rounded-full bg-[#EA580C] text-white flex items-center justify-center font-bold text-xs shadow-2xs anim-pulse-subtle">
                        2
                      </div>
                      <p className="font-bold text-slate-800 text-[11px]">Ải Oxyz 3D</p>
                      <span className="text-[10px] text-orange-600 font-semibold block">
                        Đang làm
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 opacity-75">
                      <div className="w-7 h-7 mx-auto rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <p className="font-bold text-slate-700 text-[11px]">Ải Tích phân</p>
                      <span className="text-[10px] text-slate-400 block">Khóa</span>
                    </div>
                  </div>

                  {/* Wheel Callout Banner */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Dices className="w-4 h-4 text-amber-200 anim-float-slow" />
                      <span className="font-bold">Minigame Vòng quay may mắn gọi tên</span>
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded font-mono text-[11px]">
                      38 học sinh
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slider Controls Bar (Prev/Next, Dots, Play/Pause) */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        {/* Slide Dots Indicator */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? 'w-8 bg-indigo-600'
                  : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Chuyển đến Slide ${idx + 1}`}
              aria-label={`Trang ${idx + 1}`}
            />
          ))}
          <span className="text-[13px] font-semibold text-slate-500 ml-2 font-mono">
            {currentIndex + 1} / 5
          </span>
        </div>

        {/* Prev / Play-Pause / Next Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={togglePause}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title={isPaused ? 'Tiếp tục tự chuyển slide' : 'Tạm dừng slideshow'}
            aria-label={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={prevSlide}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Slide trước"
            aria-label="Slide trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Slide tiếp theo"
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
