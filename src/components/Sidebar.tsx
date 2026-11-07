import React from 'react';
import {
  LayoutDashboard,
  Users,
  Database,
  Grid3X3,
  FilePlus,
  FolderArchive,
  ClipboardCheck,
  ShieldAlert,
  BarChart3,
  Compass,
  Atom,
  Trophy,
  Dices,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';
import { soundService } from '../utils/audio';

export type SectionKey =
  | 'overview'
  | 'classes'
  | 'questions'
  | 'matrix'
  | 'exam-builder'
  | 'exam-vault'
  | 'online-exam'
  | 'proctoring'
  | 'grading'
  | 'learning-path'
  | 'math-lab'
  | 'math-treasure'
  | 'minigame'
  | 'settings';

interface SidebarItem {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  roles: UserRole[];
  group: 'main' | 'assessment' | 'interactive' | 'system';
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  // Nhóm 1: Quản lý & Khảo thí
  {
    key: 'overview',
    label: 'Tổng quan hệ thống',
    icon: LayoutDashboard,
    roles: ['teacher', 'student'],
    group: 'main',
  },
  {
    key: 'classes',
    label: 'Quản lý Lớp & Học sinh',
    icon: Users,
    badge: '3 lớp',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    roles: ['teacher'],
    group: 'main',
  },
  {
    key: 'questions',
    label: 'Ngân hàng câu hỏi',
    icon: Database,
    roles: ['teacher'],
    group: 'main',
  },
  {
    key: 'matrix',
    label: 'Ma trận & Bản đặc tả',
    icon: Grid3X3,
    roles: ['teacher'],
    group: 'assessment',
  },
  {
    key: 'exam-builder',
    label: 'Tạo & Quản lý Đề kiểm tra',
    icon: FilePlus,
    roles: ['teacher'],
    group: 'assessment',
  },
  {
    key: 'exam-vault',
    label: 'Kho đề kiểm tra',
    icon: FolderArchive,
    badge: '2 đề',
    badgeColor: 'bg-slate-100 text-slate-700',
    roles: ['teacher'],
    group: 'assessment',
  },
  {
    key: 'online-exam',
    label: 'Kiểm tra trực tuyến',
    icon: ClipboardCheck,
    badge: 'Đang mở',
    badgeColor: 'bg-emerald-100 text-emerald-700 font-bold',
    roles: ['teacher', 'student'],
    group: 'assessment',
  },
  {
    key: 'proctoring',
    label: 'Giám sát Phòng thi',
    icon: ShieldAlert,
    badge: 'Live',
    badgeColor: 'bg-rose-100 text-rose-700 font-bold',
    roles: ['teacher'],
    group: 'assessment',
  },
  {
    key: 'grading',
    label: 'Chấm điểm & Thống kê',
    icon: BarChart3,
    roles: ['teacher', 'student'],
    group: 'assessment',
  },
  // Nhóm 2: Học tập tương tác & Toán học
  {
    key: 'learning-path',
    label: 'Lộ trình tự học Toán',
    icon: Compass,
    badge: '10-12',
    badgeColor: 'bg-purple-100 text-purple-700',
    roles: ['teacher', 'student'],
    group: 'interactive',
  },
  {
    key: 'math-lab',
    label: 'Phòng Lab Toán học 2D/3D',
    icon: Atom,
    badge: '4 Lab',
    badgeColor: 'bg-cyan-100 text-cyan-800 font-bold',
    roles: ['teacher', 'student'],
    group: 'interactive',
  },
  {
    key: 'math-treasure',
    label: 'Kho báu Toán học',
    icon: Trophy,
    roles: ['teacher', 'student'],
    group: 'interactive',
  },
  {
    key: 'minigame',
    label: 'Minigame & Gọi tên',
    icon: Dices,
    badge: 'Vui nhộn',
    badgeColor: 'bg-amber-100 text-amber-800',
    roles: ['teacher', 'student'],
    group: 'interactive',
  },
  // Cài đặt
  {
    key: 'settings',
    label: 'Cài đặt hệ thống',
    icon: Settings,
    roles: ['teacher', 'student'],
    group: 'system',
  },
];

interface SidebarProps {
  currentSection: SectionKey;
  onSelectSection: (key: SectionKey) => void;
  userRole: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  userRole,
  isCollapsed,
  onToggleCollapse,
  mobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const visibleItems = SIDEBAR_ITEMS.filter((item) => item.roles.includes(userRole));

  const handleSelect = (key: SectionKey) => {
    soundService.playClick();
    onSelectSection(key);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={onCloseMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 sm:top-18 z-40 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between shadow-xs ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header & Toggle */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                BẢNG ĐIỀU KHIỂN
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Hệ thống trực tuyến" />
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Trực tuyến" />
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List with clean overflow-y */}
        <div className="sidebar-menu flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-1">
          {/* Section: Giảng dạy & Đánh giá */}
          {!isCollapsed && (
            <div className="px-3 pt-1 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {userRole === 'teacher' ? 'Dạy học & Khảo thí' : 'Nhiệm vụ học tập'}
            </div>
          )}

          {visibleItems.map((item, index) => {
            const isActive = currentSection === item.key;
            const Icon = item.icon;

            // Optional Divider before interactive activities
            const showSubheader =
              !isCollapsed &&
              item.group === 'interactive' &&
              visibleItems[index - 1]?.group !== 'interactive';

            return (
              <React.Fragment key={item.key}>
                {showSubheader && (
                  <div className="px-3 pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Không gian Khám phá Toán
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSelect(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] sm:text-[15px] font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200/60'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div
                    className={`shrink-0 p-1 rounded-lg transition-colors ${
                      isActive
                        ? 'text-indigo-600 bg-white shadow-2xs'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded-md shrink-0 font-medium ${
                            item.badgeColor || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3" />
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-700 truncate">EduTest Smart v2.0</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center text-slate-400 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
