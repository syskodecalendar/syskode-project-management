import React from 'react';
import { Search, Plus, Bell, Menu, Sparkles, RefreshCw } from 'lucide-react';

export const TopHeader = ({ currentUser, unreadNotificationCount, unreadCount, onOpenGlobalSearch, onOpenSearch, onOpenQuickAdd = () => { }, onOpenNotifications, onOpenRoleSwitcher = () => { }, onToggleMobileMenu = () => { }, onRefresh = () => { } }) => {
    const user = currentUser || { name: 'User', role: 'User' };
    const role = user.role || 'User';
    const name = user.name || 'User';
    const unread = unreadNotificationCount ?? unreadCount ?? 0;
    const handleSearch = onOpenGlobalSearch || onOpenSearch || (() => { });
    const handleNotifications = onOpenNotifications || (() => { });
    const roleBadgeColors = {
        Admin: 'bg-purple-50 text-purple-700 border-purple-200',
        Management: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        Sales: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Project Manager': 'bg-[#eef9ff] text-[#075f91] border-[#b9e3f6]',
        Developer: 'bg-amber-50 text-amber-700 border-amber-200',
        QA: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    const badgeColor = roleBadgeColors[role] || roleBadgeColors.Admin;

    return (<header className="sticky top-0 z-20 flex h-14 w-full min-w-0 items-center justify-between gap-2 border-b border-[#d8e7f0] bg-white/95 px-2.5 shadow-sm backdrop-blur-md sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button onClick={onToggleMobileMenu} className="shrink-0 rounded-xl p-2 text-[#667085] hover:bg-[#eef9ff] hover:text-[#0788C9] md:hidden">
          <Menu className="h-5 w-5"/>
        </button>

        <button onClick={handleSearch} className="flex h-9 min-w-0 items-center gap-2 rounded-xl border border-[#d8e7f0] bg-[#f7fbfe] px-2.5 text-xs text-[#667085] transition-all hover:border-[#9ed8f3] hover:bg-[#eef9ff] w-10 sm:w-56 lg:w-72">
          <Search className="h-4 w-4 shrink-0 text-[#0788C9]"/>
          <span className="hidden truncate sm:inline">Search leads, projects, QA...</span>
          <kbd className="hidden rounded border border-[#d8e7f0] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#667085] sm:inline-block">⌘K</kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button onClick={onOpenQuickAdd} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#0788C9] px-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#066fa5] sm:px-3.5">
          <Plus className="h-4 w-4"/>
          <span className="hidden sm:inline">Quick Add</span>
        </button>

        <button onClick={onRefresh} className="rounded-xl border border-[#d8e7f0] bg-white p-2 text-[#667085] transition-colors hover:border-[#9ed8f3] hover:bg-[#eef9ff] hover:text-[#0788C9]" title="Refresh database data">
          <RefreshCw className="h-4 w-4"/>
        </button>

        <button onClick={handleNotifications} className="relative rounded-xl border border-[#d8e7f0] bg-white p-2 text-[#667085] transition-colors hover:border-[#9ed8f3] hover:bg-[#eef9ff] hover:text-[#0788C9]" title="Notifications">
          <Bell className="h-4 w-4"/>
          {unread > 0 && (<span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">{unread}</span>)}
        </button>

        <div className="hidden h-6 w-px bg-[#d8e7f0] sm:block"/>

        <button onClick={onOpenRoleSwitcher} className="flex h-9 items-center gap-2 rounded-xl border border-[#d8e7f0] bg-white p-1 transition-colors hover:bg-[#f7fbfe] sm:p-1.5" title="Switch Role / View User Permissions">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#cfe6f3] bg-[#eef9ff] text-xs font-bold text-[#075f91]">{name.charAt(0)}</div>
          <div className="hidden pr-1 text-left md:block">
            <div className="flex items-center space-x-1.5"><span className="max-w-[110px] truncate text-xs font-bold text-[#071A35]">{name}</span><Sparkles className="h-3 w-3 text-[#00AEEF]"/></div>
            <span className={`inline-block rounded border px-1.5 py-0.2 text-[10px] font-bold ${badgeColor}`}>{role}</span>
          </div>
        </button>
      </div>
    </header>);
};
