import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Volume2,
  VolumeX,
  Bell,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';
import { soundService } from '../utils/audio';

interface HeaderProps {
  currentUser: UserProfile;
  onSwitchRole: (newRole: 'teacher' | 'student') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onNavigateToSection: (sectionId: string) => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchRole,
  soundEnabled,
  onToggleSound,
  notifications,
  onMarkNotificationRead,
  onNavigateToSection,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSoundClick = () => {
    onToggleSound();
    soundService.playClick();
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white shadow-md border-b border-indigo-600/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Mobile hamburger + Brand Title & Subtitle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-indigo-100 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Mở menu điều hướng"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => onNavigateToSection('overview')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner group-hover:bg-white/20 transition-all duration-200">
                <GraduationCap className="w-6 h-6 text-indigo-200 group-hover:text-white transition-colors" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-xl tracking-tight text-white">
                    EduTest Smart
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-indigo-200 hidden md:block">
                  Hệ thống dạy học, khảo thí &amp; hoạt động tương tác Toán THPT
                </p>
              </div>
            </div>
          </div>

          {/* Right: Sound toggle, Notifications, Role Switcher & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Toggle Button */}
            <button
              type="button"
              onClick={handleSoundClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-indigo-100 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-rose-300" />
              )}
              <span className="hidden sm:inline">
                Âm thanh: <span className={soundEnabled ? 'text-emerald-300 font-semibold' : 'text-rose-200'}>{soundEnabled ? 'Bật' : 'Tắt'}</span>
              </span>
            </button>

            {/* Notification Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  soundService.playClick();
                }}
                className="relative p-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-indigo-100 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                title="Thông báo hệ thống"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-900 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-indigo-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900">Thông báo mới</span>
                    <span className="text-xs text-indigo-600 font-medium">
                      {unreadCount} chưa đọc
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        Không có thông báo mới nào
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            onMarkNotificationRead(notif.id);
                            if (notif.linkSection) {
                              onNavigateToSection(notif.linkSection);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors flex gap-2.5 ${
                            !notif.read ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {notif.type === 'success' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            )}
                            {notif.type === 'warning' && (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                            {notif.type === 'info' && <Info className="w-4 h-4 text-indigo-500" />}
                            {notif.type === 'alert' && (
                              <AlertTriangle className="w-4 h-4 text-rose-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {notif.timestamp}
                            </span>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 self-center" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Button */}
            <button
              type="button"
              onClick={() => {
                const nextRole = currentUser.role === 'teacher' ? 'student' : 'teacher';
                onSwitchRole(nextRole);
                soundService.playSuccess();
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-950 border border-indigo-400/30 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors"
              title="Chuyển đổi giao diện Giáo viên / Học sinh"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Quyền:{' '}
                <strong className="text-white">
                  {currentUser.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                </strong>
              </span>
            </button>

            {/* User Profile Pill & Menu */}
            <div className="relative" ref={userRef}>
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 cursor-pointer transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-1 ring-white/30">
                  {getInitials(currentUser.name)}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-white tracking-tight leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-indigo-200 leading-none">
                    {currentUser.title}
                  </span>
                </div>
                <LogOut className="w-3.5 h-3.5 text-indigo-300 hidden sm:block ml-1" />
              </div>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                    <p className="text-[11px] text-indigo-600 font-medium mt-1">
                      {currentUser.title} · {currentUser.school}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nextRole = currentUser.role === 'teacher' ? 'student' : 'teacher';
                        onSwitchRole(nextRole);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      Chuyển sang góc nhìn{' '}
                      <strong>{currentUser.role === 'teacher' ? 'Học sinh' : 'Giáo viên'}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToSection('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      Cài đặt tài khoản &amp; Hệ thống
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        // Reset to teacher or refresh view
                        onSwitchRole('teacher');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Đăng xuất / Chuyển tài khoản
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
