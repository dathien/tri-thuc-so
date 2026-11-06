import React, { useState } from 'react';
import {
  Settings,
  User,
  Volume2,
  VolumeX,
  BookOpen,
  Database,
  Save,
  RotateCcw,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { soundService } from '../../utils/audio';

interface SettingsViewProps {
  currentUser: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  soundEnabled,
  onToggleSound,
  onResetData,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [school, setSchool] = useState(currentUser.school || 'Trường THPT Chuyên GDPT 2018');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    currentUser.name = name;
    currentUser.email = email;
    currentUser.school = school;
    setSavedSuccess(true);
    soundService.playSuccess();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Cài đặt Hệ thống EduTest Smart
          </h1>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
            Phiên bản 2.0
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Tùy chỉnh thông tin giáo viên, cấu hình môn học GDPT 2018 và âm thanh phản hồi.
        </p>
      </div>

      {/* Form Settings */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Thông tin Hồ sơ Giáo viên / Người dùng
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email liên hệ</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Trường học / Đơn vị công tác</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Audio Feedback Settings */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600" />
            Âm thanh &amp; Hiệu ứng Tương tác
          </h2>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800">Hiệu ứng âm thanh khi bấm nút &amp; quay minigame</p>
              <p className="text-slate-500 text-[11px]">
                Sử dụng Web Audio API tổng hợp nhẹ nhàng, không phụ thuộc tài nguyên bên ngoài.
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Đang Bật' : 'Đang Tắt'}</span>
            </button>
          </div>
        </div>

        {/* GDPT 2018 Config */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Chuẩn Đánh giá Chương trình GDPT 2018
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block">Năm học áp dụng</span>
              <span className="font-bold text-slate-800 text-sm font-mono">2025 - 2026</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block">Thang điểm chuẩn</span>
              <span className="font-bold text-slate-800 text-sm font-mono">10.0 (Làm tròn 2 chữ số)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block">Mức độ nhận thức</span>
              <span className="font-bold text-slate-800 text-sm">4 mức (NB - TH - VD - VDC)</span>
            </div>
          </div>
        </div>

        {/* Data Reset */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-rose-600" />
            Khôi phục Dữ liệu Mặc định
          </h2>

          <div className="mt-4 p-4 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-rose-900">Khôi phục cơ sở dữ liệu mẫu ban đầu</p>
              <p className="text-rose-700 text-[11px]">
                Đặt lại danh sách lớp học, ngân hàng câu hỏi và các bài thi mẫu về trạng thái chuẩn.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn đặt lại dữ liệu về ban đầu?')) {
                  onResetData();
                  soundService.playSuccess();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shrink-0"
            >
              Đặt lại dữ liệu
            </button>
          </div>
        </div>

        {/* Save feedback & button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Đã lưu cài đặt thành công!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
