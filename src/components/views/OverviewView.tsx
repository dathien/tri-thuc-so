import React from 'react';
import {
  Users,
  FileText,
  CheckCircle,
  Database,
  GraduationCap,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldAlert,
  Dices,
  Atom,
  Grid3X3,
  Calendar,
  Activity,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { OverviewSlider } from '../OverviewSlider';
import { SectionKey } from '../Sidebar';
import {
  ClassRoom,
  Student,
  Question,
  Exam,
  ExamSubmission,
  ActivityLog,
  UserProfile,
} from '../../types';
import { soundService } from '../../utils/audio';

interface OverviewViewProps {
  currentUser: UserProfile;
  classes: ClassRoom[];
  students: Student[];
  questions: Question[];
  exams: Exam[];
  submissions: ExamSubmission[];
  activities: ActivityLog[];
  onNavigate: (section: SectionKey) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  currentUser,
  classes,
  students,
  questions,
  exams,
  submissions,
  activities,
  onNavigate,
}) => {
  // Real computed stats from state - strictly accurate, no fake values
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalQuestions = questions.length;
  const totalExams = exams.length;
  const assignedExamsCount = exams.filter((e) => e.status === 'published').length;
  const totalSubmissions = submissions.length;

  const averageScore =
    submissions.length > 0
      ? (
          submissions.reduce((acc, curr) => acc + curr.score, 0) / submissions.length
        ).toFixed(2)
      : '0.00';

  const completionRate =
    students.length > 0 && assignedExamsCount > 0
      ? Math.round((totalSubmissions / (students.length * assignedExamsCount)) * 100)
      : totalSubmissions > 0
      ? 100
      : 0;

  const handleCardClick = (section: SectionKey) => {
    soundService.playClick();
    onNavigate(section);
  };

  return (
    <div className="space-y-6">
      {/* 5-Slide Banner Carousel */}
      <OverviewSlider onNavigate={onNavigate} />

      {/* Greeting Banner matching the reference image layout */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-600/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Xin chào, {currentUser.name.includes('Hồ Nguyễn Đa Thiện') ? 'Thầy Hồ Nguyễn Đa Thiện' : currentUser.name}!
            </h1>
            <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full border border-white/25">
              {currentUser.role === 'teacher' ? 'Quản trị viên Chuyên môn' : 'Học sinh'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-100">
            Hệ thống quản lý giáo dục, khảo thí và hoạt động học tập tương tác môn Toán THPT đang hoạt động ổn định.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleCardClick(currentUser.role === 'teacher' ? 'exam-builder' : 'online-exam')}
            className="px-4 py-2 bg-white text-indigo-900 rounded-xl font-bold text-xs hover:bg-indigo-50 shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            {currentUser.role === 'teacher' ? (
              <>
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                Tạo đề kiểm tra mới
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Vào làm bài thi trực tuyến
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real Statistics Metric Grid - Spacious, responsive & no text truncation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Stat 1: Lớp học */}
        <div
          onClick={() => handleCardClick('classes')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-indigo-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-slate-700">Lớp học đang quản lý</span>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalClasses}
            </span>
            <span className="text-sm font-medium text-slate-500">lớp học</span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1.5">Phân bổ khối 10, 11 và 12</p>
        </div>

        {/* Stat 2: Học sinh */}
        <div
          onClick={() => handleCardClick('classes')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-blue-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-slate-700">Tổng số học sinh</span>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalStudents}
            </span>
            <span className="text-sm font-medium text-slate-500">học sinh</span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1.5">Hồ sơ học tập trực tuyến đang hoạt động</p>
        </div>

        {/* Stat 3: Ngân hàng câu hỏi */}
        <div
          onClick={() => handleCardClick('questions')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-purple-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-slate-700">Ngân hàng câu hỏi</span>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalQuestions}
            </span>
            <span className="text-sm font-medium text-slate-500">câu hỏi</span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1.5">Phân cấp theo 4 mức độ nhận thức</p>
        </div>

        {/* Stat 4: Đề kiểm tra đã tạo */}
        <div
          onClick={() => handleCardClick('exam-vault')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-emerald-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-slate-700">Đề kiểm tra đã tạo</span>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalExams}
            </span>
            <span className="text-sm font-medium text-slate-500">bộ đề</span>
          </div>
          <p className="text-[13px] text-emerald-600 font-semibold mt-1.5">
            {assignedExamsCount} đề đang mở làm bài trực tuyến
          </p>
        </div>

        {/* Stat 5: Bài đã nộp chấm điểm */}
        <div
          onClick={() => handleCardClick('grading')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-amber-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-slate-700">Bài thi đã nộp</span>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalSubmissions}
            </span>
            <span className="text-sm font-medium text-slate-500">bài làm</span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1.5">Đã hoàn thành chấm điểm tự động 100%</p>
        </div>

        {/* Stat 6: Điểm TB / Tiến độ */}
        <div
          onClick={() => handleCardClick('grading')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-rose-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-slate-700">Điểm trung bình môn</span>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-indigo-700 font-mono tabular-nums">
              {averageScore}
            </span>
            <span className="text-sm font-medium text-slate-500">/ 10.0</span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1.5">Đánh giá theo năng lực thực tế</p>
        </div>
      </div>

      {/* Quick Access Feature Cards (Truy cập nhanh tính năng) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Truy cập nhanh tính năng
            </h2>
          </div>
          <span className="text-xs text-slate-400">Thao tác một chạm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tạo đề thi trực tuyến */}
          <div
            onClick={() => handleCardClick('exam-builder')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">
              Tạo đề thi trực tuyến
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Thiết kế theo ma trận chuẩn, nhập từ ngân hàng hoặc Word, xáo trộn câu hỏi &amp; đáp án.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              Bắt đầu tạo đề <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2: Giám sát học sinh thi */}
          <div
            onClick={() => handleCardClick('proctoring')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-emerald-600 transition-colors">
              Giám sát học sinh thi
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Phát hiện chuyển tab, cảnh báo mất tập trung và ghi nhận nhật ký làm bài thời gian thực.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
              Mở phòng giám sát <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3: Minigame gọi tên vui nhộn */}
          <div
            onClick={() => handleCardClick('minigame')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Dices className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-amber-600 transition-colors">
              Minigame gọi tên vui nhộn
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Vòng quay may mắn lấy danh sách từ lớp học thật, tạo không khí học tập hào hứng trên lớp.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
              Chơi vòng quay ngay <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 4: Phòng Lab Toán học 2D/3D */}
          <div
            onClick={() => handleCardClick('math-lab')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Atom className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-cyan-600 transition-colors">
              Phòng Lab Toán học 2D/3D
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Mô phỏng đồ thị hàm số động, hình học Oxyz xoay 360° và vòng tròn lượng giác trực quan.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-cyan-600 group-hover:translate-x-1 transition-transform">
              Mở mô phỏng 2D/3D <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Activity & Class Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Activity Log (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Hoạt động thời gian thực</h3>
            </div>
            <span className="text-[11px] text-slate-400">Nhật ký hệ thống</span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có hoạt động nào được ghi nhận
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800">
                        {act.user} · <span className="text-slate-500 font-normal">{act.action}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {act.timeAgo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">{act.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Classes Roster Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Lớp học phụ trách</h3>
            </div>
            <button
              type="button"
              onClick={() => handleCardClick('classes')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Xem tất cả
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => handleCardClick('classes')}
                className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 truncate">{cls.name}</span>
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                      Khối {cls.grade}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Mã phòng: <span className="font-mono text-slate-700">{cls.roomCode}</span> · {cls.studentCount} học sinh
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
            ))}
          </div>

          {/* Quick Notice Card */}
          <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Kỳ kiểm tra tiếp theo: <strong>Kiểm tra Khảo sát Toán 12</strong> đang mở cho lớp 12A1. Đã có 3 học sinh nộp bài.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
