import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200 bg-white/70 backdrop-blur-xs text-center text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <p className="font-medium text-slate-600 text-[13px]">
          Copyright © 2026 – Phát triển bởi Thầy Hồ Nguyễn Đa Thiện
        </p>
      </div>
    </footer>
  );
};

export default Footer;
