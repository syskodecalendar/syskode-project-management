import React from 'react';
import { hasPermission } from '../../services/permissionService';
import { LayoutDashboard, ClipboardList, Users2, Calendar, FileText, Briefcase, CheckSquare, ShieldCheck, Server, UserCheck, BarChart3, History, Settings, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
export const Sidebar = ({ activeTab, currentTab, onChangeTab, onSelectTab, isCollapsed = false, onToggleCollapse = () => { }, currentUser, isMobileOpen = false, onCloseMobile = () => { }, badgeCounts = {} }) => {
    const selectedTab = activeTab || currentTab || 'dashboard';
    const handleSelectTab = onChangeTab || onSelectTab || (() => { });
    const counts = badgeCounts;
    const allNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
        { id: 'today', label: "Today's Work", icon: ClipboardList, permission: 'view_dashboard' },
        { id: 'leads', label: 'Leads', icon: Users2, badge: counts?.leads, permission: 'view_leads' },
        { id: 'meetings', label: 'Meetings', icon: Calendar, badge: counts?.meetings, permission: 'view_meetings' },
        { id: 'proposals', label: 'Proposals', icon: FileText, permission: 'view_proposals' },
        { id: 'projects', label: 'Projects', icon: Briefcase, permission: 'view_projects' },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: counts?.tasks, permission: 'view_tasks' },
        { id: 'qa', label: 'QA / Test Cases', icon: ShieldCheck, badge: counts?.qa, permission: 'view_qa' },
        { id: 'infrastructure', label: 'Infrastructure', icon: Server, badge: counts?.renewals, permission: 'view_infrastructure' },
        { id: 'team', label: 'Team & Matrix', icon: UserCheck, permission: 'view_team' },
        { id: 'reports', label: 'Reports', icon: BarChart3, permission: 'view_reports' },
        { id: 'activity', label: 'Audit Activity', icon: History, permission: 'view_activity' },
        { id: 'settings', label: 'Settings', icon: Settings, permission: 'view_settings' },
    ];
    const navItems = allNavItems.filter(item => !currentUser || hasPermission(currentUser, item.permission));
    const showLabels = !isCollapsed || isMobileOpen;
    return (<>
      {isMobileOpen && (<button aria-label="Close navigation menu" onClick={onCloseMobile} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px] md:hidden"/>)}
      <aside className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[86vw] max-w-72 flex-col bg-[#071A35] text-slate-200 border-r border-[#173a5c] shadow-2xl transition-all duration-300 md:relative md:z-30 md:h-full md:max-w-none md:shadow-none ${isCollapsed ? 'md:w-20' : 'md:w-64'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#173a5c] px-4">
        {showLabels ? (<div className="flex items-center gap-3 min-w-0">
            <img src="/images/syskode-logo-light.png" alt="Syskode" className="h-6 w-28 object-contain object-left"/>
            <div className="h-5 w-px bg-[#31506f]"/>
            <p className="text-[10px] text-[#59c9f5] font-semibold tracking-wider uppercase whitespace-nowrap">Project Hub</p>
          </div>) : (<img src="/images/syskode-logo-light.png" alt="Syskode" className="mx-auto h-7 w-12 object-contain"/>)}

        <button onClick={onToggleCollapse} className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-[#0C2038] border border-[#274867] text-slate-300 hover:bg-[#123253] hover:text-white transition-colors" title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
          {isCollapsed ? <ChevronRight className="h-4 w-4"/> : <ChevronLeft className="h-4 w-4"/>}
        </button>
        <button onClick={onCloseMobile} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#274867] bg-[#0C2038] text-slate-300 hover:text-white md:hidden" aria-label="Close navigation menu">
          <X className="h-4 w-4"/>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-none">
        {navItems.map(item => {
            const Icon = item.icon;
            const isActive = selectedTab === item.id;
            return (<button key={item.id} onClick={() => { handleSelectTab(item.id); onCloseMobile(); }} className={`group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
                    ? 'bg-[#0C3155] text-white border border-[#1e5a87] shadow-sm'
                    : 'text-slate-300 hover:bg-[#0C2038] hover:text-white'}`}>
              <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-[#00AEEF]' : 'text-slate-400 group-hover:text-[#00AEEF]'}`}/>
              
              {showLabels && (<span className="ml-3 flex-1 text-left truncate">{item.label}</span>)}

              {showLabels && item.badge ? (<span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-[#00AEEF]/15 text-[#7ad7fb] border border-[#00AEEF]/30' : 'bg-[#0C2038] text-slate-300'}`}>
                  {item.badge}
                </span>) : !showLabels && item.badge ? (<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00AEEF] ring-2 ring-[#071A35]"/>) : null}
            </button>);
        })}
      </nav>

      {/* Syskode W.L.L. Enterprise Badge Footer */}
      {showLabels && (<div className="m-3 rounded-xl border border-[#274867] bg-[#0C2038] p-3 text-xs">
          <div className="flex items-center space-x-2 text-[#59c9f5] font-semibold">
            <Sparkles className="h-4 w-4"/>
            <span>Syskode Tech W.L.L.</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Internal Business Portal v11.0
          </p>
        </div>)}
      </aside>
    </>);
};
