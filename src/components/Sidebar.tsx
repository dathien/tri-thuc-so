import React, { useEffect, useState } from 'react';
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
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';

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
  type MenuGroup = SidebarItem['group'];
  const groupOrder: MenuGroup[] = ['main', 'assessment', 'interactive', 'system'];
  const groupLabels: Record<MenuGroup, string> = {
    main: 'Tổng quan & Lớp học',
    assessment: 'Đề thi & Đánh giá',
    interactive: 'Khám phá & Luyện tập',
    system: 'Hệ thống',
  };
  const activeGroup = visibleItems.find((item) => item.key === currentSection)?.group ?? 'main';
  const [expandedGroups, setExpandedGroups] = useState<MenuGroup[]>([activeGroup]);

  // Khi chuyển trang từ nơi khác, tự mở nhóm chứa mục đang sử dụng.
  useEffect(() => {
    setExpandedGroups((previous) =>
      previous.includes(activeGroup) ? previous : [...previous, activeGroup]
    );
  }, [activeGroup]);

  const toggleGroup = (group: MenuGroup) => {
    setExpandedGroups((previous) =>
      previous.includes(group)
        ? previous.filter((item) => item !== group)
        : [...previous, group]
    );
  };

  const handleSelect = (key: SectionKey) => {
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

        {/* Các nhóm chức năng có thể thu gọn; không ẩn hoặc xóa mục nào. */}
        <nav aria-label="Điều hướng chức năng" className="sidebar-menu flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-1.5">
          {groupOrder.map((group) => {
            const items = visibleItems.filter((item) => item.group === group);
            if (items.length === 0) return null;
            const isExpanded = isCollapsed || expandedGroups.includes(group);
            const containsActive = items.some((item) => item.key === currentSection);
            return (
              <div key={group} className="rounded-xl border border-slate-100 bg-white">
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    aria-expanded={isExpanded}
                    aria-controls={`sidebar-group-${group}`}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-[12px] font-bold transition-colors ${
                      containsActive ? 'text-indigo-700 bg-indigo-50/70' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{groupLabels[group]}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400">{items.length}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                )}
                <div id={`sidebar-group-${group}`} className={isExpanded ? 'px-1 pb-1 space-y-0.5' : 'hidden'}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentSection === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelect(item.key)}
                        aria-current={isActive ? 'page' : undefined}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-700' : 'text-slate-400'}`} />
                        {!isCollapsed && (
                          <>
                            <span className="min-w-0 flex-1 leading-snug break-words">{item.label}</span>
                            {item.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

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
