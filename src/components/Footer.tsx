import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200 bg-white/70 backdrop-blur-xs text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-medium text-slate-600">
          Copyright © 2026 – Phát triển bởi GV.Hồ Nguyễn Đa Thiện
        </p>
        <p className="text-[11px] text-slate-400">
          EduTest Smart · Hệ thống Dạy học &amp; Khảo thí Toán THPT theo Chương trình GDPT 2018
        </p>
      </div>
    </footer>
  );
};

export default Footer;
