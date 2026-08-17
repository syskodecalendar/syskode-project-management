import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { RoleSwitcherModal } from './components/layout/RoleSwitcherModal';
import { QuickAddModal } from './components/layout/QuickAddModal';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationsDropdown } from './components/layout/NotificationsDropdown';
import { Toast } from './components/common/Toast';
// Dashboard
import { KPICards } from './components/dashboard/KPICards';
import { PipelineStageView } from './components/dashboard/PipelineStageView';
import { RenewalAlertsCard } from './components/dashboard/RenewalAlertsCard';
import { DashboardCharts } from './components/dashboard/DashboardCharts';
// Leads
import { LeadsTable } from './components/leads/LeadsTable';
import { LeadFormModal } from './components/leads/LeadFormModal';
import { PushToMeetingModal } from './components/leads/PushToMeetingModal';
import { MeetingMinutesModal } from './components/leads/MeetingMinutesModal';
import { ConvertLeadModal } from './components/leads/ConvertLeadModal';
import { LeadWorkspace } from './components/leads/LeadWorkspace';
// Projects
import { ProjectsList } from './components/projects/ProjectsList';
import { ProjectWorkspace } from './components/projects/ProjectWorkspace';
// QA
import { TestCasesList } from './components/qa/TestCasesList';
import { AIGenerateTestCasesModal } from './components/qa/AIGenerateTestCasesModal';
// Infrastructure, Reports, Activity, Settings
import { InfrastructureView } from './components/infrastructure/InfrastructureView';
import { ReportsView } from './components/reports/ReportsView';
import { ActivityTimelineView } from './components/activity/ActivityTimelineView';
import { SettingsView } from './components/settings/SettingsView';
// Dedicated Workspace Views
import { MeetingsView } from './components/meetings/MeetingsView';
import { ProposalsView } from './components/proposals/ProposalsView';
import { ProposalUploadModal } from './components/proposals/ProposalUploadModal';
import { ProposalBuilderModal } from './components/proposals/ProposalBuilderModal';
import { TasksView } from './components/tasks/TasksView';
import { AIGenerateTasksModal } from './components/tasks/AIGenerateTasksModal';
import { TodayWorkView } from './components/today/TodayWorkView';
import { TeamMatrixView } from './components/team/TeamMatrixView';
import { AssignTeamMemberModal } from './components/team/AssignTeamMemberModal';
import { authService } from './services/authService';
import { leadService } from './services/leadService';
import { projectService } from './services/projectService';
import { qaService } from './services/qaService';
import { notificationService } from './services/notificationService';
import { meetingService } from './services/meetingService';
import { taskService } from './services/taskService';
import { databaseService } from './services/databaseService';
import { isSupabaseConfigured } from './services/supabaseClient';
import { hasPermission } from './services/permissionService';
export default function App() {
    const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Selected Detail Views
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    // Global Modals
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState('lead');
    const [isProposalUploadOpen, setIsProposalUploadOpen] = useState(false);
    const [isProposalBuilderOpen, setIsProposalBuilderOpen] = useState(false);
    const [builderProposal, setBuilderProposal] = useState(null);
    const [builderLeadTargetId, setBuilderLeadTargetId] = useState(undefined);
    const [proposalInitialMode, setProposalInitialMode] = useState('manual');
    const [isAssignTeamOpen, setIsAssignTeamOpen] = useState(false);
    const [proposalLeadTargetId, setProposalLeadTargetId] = useState(undefined);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    // Lead Modals
    const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [meetingLeadTarget, setMeetingLeadTarget] = useState(null);
    const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
    const [meetingMinutesTarget, setMeetingMinutesTarget] = useState(null);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [convertLeadTarget, setConvertLeadTarget] = useState(null);
    // QA Modals
    const [isAITestGeneratorOpen, setIsAITestGeneratorOpen] = useState(false);
    const [aiTestInitialProjectId, setAiTestInitialProjectId] = useState('');
    const [isAITaskGeneratorOpen, setIsAITaskGeneratorOpen] = useState(false);
    const [aiTaskInitialProjectId, setAiTaskInitialProjectId] = useState('');
    // Notifications & Refresh State
    const [unreadCount, setUnreadCount] = useState(notificationService.getUnreadCount());
    const [toast, setToast] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const can = (permission) => hasPermission(currentUser, permission);
    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
        setUnreadCount(notificationService.getUnreadCount());
    };
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };
    const handleSwitchRole = (role) => {
        const updated = authService.switchRole(role);
        setCurrentUser(updated);
        if (isSupabaseConfigured && updated.role !== role) {
            showToast('Live user roles are managed in Supabase and cannot be changed from the browser.', 'info');
            return;
        }
        showToast(`Switched user role to ${updated.role}`, 'success');
    };
    const handleDatabaseRefresh = async () => {
        try {
            await databaseService.refresh();
            triggerRefresh();
            showToast('Database data refreshed.', 'success');
        }
        catch (error) {
            showToast(error?.message || 'Unable to refresh database data.', 'error');
        }
    };
    const handleDeleteLead = async (lead) => {
        if (!can('delete_leads')) {
            showToast('You do not have permission to delete leads.', 'error');
            return;
        }
        if (!window.confirm(`Delete lead ${lead.leadId} — ${lead.leadName}? Related meetings and proposal records will also be deleted.`))
            return;
        leadService.deleteLead(lead.id);
        await databaseService.flush();
        await databaseService.refresh();
        setSelectedLead(null);
        triggerRefresh();
        showToast('Lead deleted.', 'success');
    };
    const handleDeleteProject = async (project) => {
        if (!can('delete_projects')) {
            showToast('You do not have permission to delete projects.', 'error');
            return;
        }
        if (!window.confirm(`Delete project ${project.projectId} — ${project.projectName}? Team, tasks, credentials, infrastructure and QA records linked to it will also be deleted.`))
            return;
        projectService.deleteProject(project.id);
        await databaseService.flush();
        await databaseService.refresh();
        setSelectedProject(null);
        triggerRefresh();
        showToast('Project and linked project data deleted.', 'success');
    };
    // Return from Zoho Books OAuth directly to the Settings → Zoho Books screen.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('zoho_books')) {
            setActiveTab('settings');
            const state = params.get('zoho_books');
            if (state === 'connected')
                showToast('Zoho Books connected successfully.', 'success');
            if (state === 'error')
                showToast(params.get('message') || 'Zoho Books connection failed.', 'error');
        }
    }, []);
    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    // Data
    const leadStats = leadService.getLeadStats();
    const projectStats = projectService.getProjectStats();
    const leads = leadService.getLeads();
    const projects = projectService.getProjects();
    const testCases = qaService.getTestCases();
    const meetings = meetingService.getMeetings();
    const tasks = taskService.getTasks();
    return (<div className="flex min-h-screen h-dvh bg-[#F4F9FC] font-sans text-[#101828] antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onChangeTab={tab => {
            setActiveTab(tab);
            setSelectedLead(null);
            setSelectedProject(null);
            setIsMobileMenuOpen(false);
        }} currentUserRole={currentUser?.role || 'Admin'} currentUser={currentUser} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(v => !v)} isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} badgeCounts={{
            leads: leads.length,
            meetings: meetings.filter(m => m.status === 'Scheduled').length,
            tasks: tasks.filter(t => t.status !== 'Completed').length,
            qa: testCases.filter(tc => tc.status === 'Failed').length
        }}/>

      {/* Main App Container */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#F4F9FC]">
        {/* Top Header */}
        <TopHeader currentUser={currentUser} onOpenRoleSwitcher={() => {
            if (isSupabaseConfigured)
                showToast('Your live role is managed in Supabase.', 'info');
            else
                setIsRoleModalOpen(true);
        }} onOpenQuickAdd={() => {
            if (!can('manage_leads')) {
                showToast('You do not have permission to create records.', 'error');
                return;
            }
            setQuickAddType('lead');
            setIsQuickAddOpen(true);
        }} onOpenSearch={() => setIsSearchOpen(true)} unreadCount={unreadCount} onOpenNotifications={() => setIsNotificationsOpen(v => !v)} onRefresh={handleDatabaseRefresh} onToggleMobileMenu={() => setIsMobileMenuOpen(v => !v)}/>
        <NotificationsDropdown notifications={notificationService.getNotifications()} isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} onMarkAsRead={id => { notificationService.markAsRead(id); triggerRefresh(); }} onMarkAllAsRead={() => { notificationService.markAllAsRead(); triggerRefresh(); }} onNavigate={(tab, recordId) => {
            setActiveTab(tab);
            if (tab === 'leads' && recordId)
                setSelectedLead(leadService.getLeadById(recordId) || null);
            if (tab === 'projects' && recordId)
                setSelectedProject(projectService.getProjectById(recordId) || null);
        }}/>

        {/* Content Area */}
        <main className="syskode-light flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-[#F4F9FC] p-3 sm:p-5 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 sm:space-y-6">
            {/* 1. DASHBOARD VIEW */}
            {activeTab === 'dashboard' && !selectedLead && !selectedProject && (<div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#d8e7f0] shadow-sm">
                  <div>
                    <h1 className="text-2xl font-bold text-[#071A35] tracking-tight">
                      Welcome back, {currentUser?.name || 'User'}
                    </h1>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Syskode Technologies W.L.L. • Enterprise Hub ({currentUser?.role || 'Admin'} View)
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {can('manage_leads') && (<button onClick={() => { setQuickAddType('lead'); setIsQuickAddOpen(true); }} className="w-full rounded-xl bg-[#0788C9] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#066fa5] transition-all sm:w-auto">
                        + Quick Add Record
                      </button>)}
                  </div>
                </div>

                {/* KPIs */}
                <KPICards leadStats={leadStats} projectStats={projectStats} onNavigate={tab => {
                setActiveTab(tab);
                setSelectedLead(null);
                setSelectedProject(null);
            }}/>

                {/* Pipeline Stage Kanban Cards */}
                <PipelineStageView leads={leads} onSelectLead={lead => {
                setSelectedLead(lead);
                setActiveTab('leads');
            }}/>

                {/* Charts and Renewal Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <DashboardCharts leads={leads} projects={projects}/>
                  </div>
                  <div>
                    <RenewalAlertsCard onNavigate={(tab) => {
                setActiveTab(tab);
                setSelectedLead(null);
                setSelectedProject(null);
            }}/>
                  </div>
                </div>
              </div>)}

            {/* TODAY'S WORK */}
            {activeTab === 'today' && (<TodayWorkView currentUser={currentUser} onNavigate={tab => { setActiveTab(tab); setSelectedLead(null); setSelectedProject(null); }}/>) }

            {/* 2. LEADS VIEW */}
            {activeTab === 'leads' && (selectedLead ? (<LeadWorkspace lead={selectedLead} onBack={() => setSelectedLead(null)} onScheduleMeeting={() => {
                setMeetingLeadTarget(selectedLead);
                setIsMeetingModalOpen(true);
            }} onRecordMinutes={meeting => {
                setMeetingMinutesTarget(meeting);
                setIsMinutesModalOpen(true);
            }} onUploadProposal={() => {
                setProposalLeadTargetId(selectedLead.id);
                setIsProposalUploadOpen(true);
            }} onCreateProposal={() => {
                setBuilderProposal(null);
                setBuilderLeadTargetId(selectedLead.id);
                setProposalInitialMode('manual');
                setIsProposalBuilderOpen(true);
            }} onEditProposal={doc => {
                setBuilderProposal(doc);
                setBuilderLeadTargetId(doc.leadId);
                setProposalInitialMode('manual');
                setIsProposalBuilderOpen(true);
            }} onConvertLead={() => {
                setConvertLeadTarget(selectedLead);
                setIsConvertModalOpen(true);
            }} currentUser={currentUser} onRefreshLead={() => {
                const fresh = leadService.getLeadById(selectedLead.id);
                if (fresh)
                    setSelectedLead(fresh);
                triggerRefresh();
            }}/>) : (<LeadsTable leads={leads} onSelectLead={lead => setSelectedLead(lead)} onCreateLead={() => {
                if (!can('manage_leads')) {
                    showToast('You do not have permission to create leads.', 'error');
                    return;
                }
                setEditingLead(null);
                setIsLeadFormOpen(true);
            }} onEditLead={lead => {
                if (!can('manage_leads')) {
                    showToast('You do not have permission to edit leads.', 'error');
                    return;
                }
                setEditingLead(lead);
                setIsLeadFormOpen(true);
            }} onScheduleMeeting={lead => {
                setMeetingLeadTarget(lead);
                setIsMeetingModalOpen(true);
            }} onUploadProposal={lead => {
                setProposalLeadTargetId(lead.id);
                setIsProposalUploadOpen(true);
            }} onConvertLead={lead => {
                setConvertLeadTarget(lead);
                setIsConvertModalOpen(true);
            }} onDeleteLead={handleDeleteLead} currentUser={currentUser}/>))}

            {/* 3. MEETINGS VIEW */}
            {activeTab === 'meetings' && (<MeetingsView currentUser={currentUser} onScheduleMeeting={() => {
                if (leads.length > 0) {
                    setMeetingLeadTarget(leads[0]);
                    setIsMeetingModalOpen(true);
                }
            }} onRecordMinutes={meeting => {
                setMeetingMinutesTarget(meeting);
                setIsMinutesModalOpen(true);
            }}/>)}

            {/* 4. PROPOSALS VIEW */}
            {activeTab === 'proposals' && (<ProposalsView currentUser={currentUser} onUploadProposal={() => { setProposalLeadTargetId(undefined); setIsProposalUploadOpen(true); }} onCreateProposalMode={mode => { setBuilderProposal(null); setBuilderLeadTargetId(undefined); setProposalInitialMode(mode || 'manual'); setIsProposalBuilderOpen(true); }} onEditProposal={doc => { setBuilderProposal(doc); setBuilderLeadTargetId(doc.leadId); setProposalInitialMode('manual'); setIsProposalBuilderOpen(true); }} onOpenAISummary={doc => showToast(`Generating AI summary for ${doc.documentName}...`, 'info')} onOpenAICompare={() => showToast('AI Proposal Contract Comparison tool open', 'info')}/>)}

            {/* 5. PROJECTS VIEW */}
            {activeTab === 'projects' && (selectedProject ? (<ProjectWorkspace project={selectedProject} currentUser={currentUser} onBack={() => setSelectedProject(null)} onGenerateAITasks={projectId => { setAiTaskInitialProjectId(projectId); setIsAITaskGeneratorOpen(true); }} onGenerateAITestCases={projectId => { setAiTestInitialProjectId(projectId); setIsAITestGeneratorOpen(true); }} onRefresh={() => {
                const fresh = projectService.getProjectById(selectedProject.id);
                if (fresh)
                    setSelectedProject(fresh);
                triggerRefresh();
            }}/>) : (<ProjectsList projects={projects} currentUser={currentUser} onSelectProject={project => setSelectedProject(project)} onCreateProject={() => { if (!can('manage_projects')) {
            showToast('You do not have permission to create projects.', 'error');
            return;
        } setQuickAddType('project'); setIsQuickAddOpen(true); }} onDeleteProject={handleDeleteProject}/>))}

            {/* 6. TASKS VIEW */}
            {activeTab === 'tasks' && (<TasksView currentUser={currentUser} onGenerateAITasks={() => { if (!can('manage_tasks')) { showToast('You do not have permission to generate tasks.', 'error'); return; } setAiTaskInitialProjectId(''); setIsAITaskGeneratorOpen(true); }} onCreateTask={() => { if (!can('manage_tasks')) {
            showToast('You do not have permission to create tasks.', 'error');
            return;
        } setQuickAddType('task'); setIsQuickAddOpen(true); }}/>)}

            {/* 7. QA TESTING VIEW */}
            {activeTab === 'qa' && (<TestCasesList testCases={testCases} currentUser={currentUser} onOpenAIGenerator={() => { if (!can('manage_qa')) {
            showToast('You do not have permission to generate test cases.', 'error');
            return;
        } setAiTestInitialProjectId(''); setIsAITestGeneratorOpen(true); }} onCreateTestCase={() => { if (!can('manage_qa')) {
            showToast('You do not have permission to create test cases.', 'error');
            return;
        } setQuickAddType('testCase'); setIsQuickAddOpen(true); }} onRefresh={handleDatabaseRefresh}/>)}

            {/* 8. TEAM & MATRIX VIEW */}
            {activeTab === 'team' && (<TeamMatrixView currentUser={currentUser} onAssignMember={() => { if (!can('manage_team')) {
            showToast('You do not have permission to assign team members.', 'error');
            return;
        } setIsAssignTeamOpen(true); }}/>)}

            {/* 5. INFRASTRUCTURE VIEW */}
            {activeTab === 'infrastructure' && (<InfrastructureView currentUser={currentUser} onRefresh={triggerRefresh}/>)}

            {/* 6. REPORTS VIEW */}
            {activeTab === 'reports' && (<ReportsView />)}

            {/* 7. ACTIVITY AUDIT VIEW */}
            {activeTab === 'activity' && (<ActivityTimelineView currentUser={currentUser}/>)}

            {/* 8. SETTINGS VIEW */}
            {activeTab === 'settings' && (<SettingsView currentUser={currentUser} onDataChanged={triggerRefresh}/>)}
          </div>
        </main>
      </div>

      {/* MODALS */}

      {/* Role Switcher */}
      <RoleSwitcherModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} currentUser={currentUser} currentRole={currentUser?.role || 'Admin'} onSwitchRole={handleSwitchRole} onSelectRole={handleSwitchRole}/>

      {/* Quick Add */}
      <QuickAddModal isOpen={isQuickAddOpen} currentUser={currentUser} onClose={() => setIsQuickAddOpen(false)} initialType={quickAddType} onSuccess={message => {
            showToast(message, 'success');
            triggerRefresh();
        }}/>

      <ProposalUploadModal isOpen={isProposalUploadOpen} onClose={() => setIsProposalUploadOpen(false)} leads={leads} currentUser={currentUser} targetLeadId={proposalLeadTargetId} onSuccess={message => {
            showToast(message, 'success');
            triggerRefresh();
            if (selectedLead) {
                const fresh = leadService.getLeadById(selectedLead.id);
                if (fresh)
                    setSelectedLead(fresh);
            }
        }}/>

      <ProposalBuilderModal isOpen={isProposalBuilderOpen} onClose={() => { setIsProposalBuilderOpen(false); setBuilderProposal(null); setBuilderLeadTargetId(undefined); setProposalInitialMode('manual'); }} proposal={builderProposal} leads={leads} currentUser={currentUser} initialLeadId={builderLeadTargetId} initialMode={proposalInitialMode} onSaved={proposal => {
            setBuilderProposal(proposal);
            triggerRefresh();
            if (selectedLead && selectedLead.id === proposal.leadId) {
                const fresh = leadService.getLeadById(selectedLead.id);
                if (fresh)
                    setSelectedLead(fresh);
            }
        }}/>

      <AssignTeamMemberModal isOpen={isAssignTeamOpen} currentUser={currentUser} onClose={() => setIsAssignTeamOpen(false)} projects={projects} onSuccess={message => { showToast(message, 'success'); triggerRefresh(); }}/>

      {/* Global Search */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={(tab, recordId) => {
            setActiveTab(tab);
            if (tab === 'leads' && recordId)
                setSelectedLead(leadService.getLeadById(recordId) || null);
            else if (tab === 'projects' && recordId)
                setSelectedProject(projectService.getProjectById(recordId) || null);
            else {
                setSelectedLead(null);
                setSelectedProject(null);
            }
            setIsSearchOpen(false);
        }}/>

      {/* Create / Edit Lead */}
      <LeadFormModal isOpen={isLeadFormOpen} onClose={() => setIsLeadFormOpen(false)} lead={editingLead} onSave={leadData => {
            if (editingLead) {
                leadService.updateLead(editingLead.id, leadData);
                showToast('Lead updated successfully', 'success');
            }
            else {
                leadService.createLead(leadData);
                showToast('New lead created successfully', 'success');
            }
            triggerRefresh();
        }}/>

      {/* Schedule Discovery Meeting */}
      <PushToMeetingModal isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} lead={meetingLeadTarget} onSuccess={meeting => {
            showToast(`Meeting scheduled with ${meeting.companyName}`, 'success');
            triggerRefresh();
        }}/>

      {/* Record Meeting Minutes */}
      <MeetingMinutesModal isOpen={isMinutesModalOpen} onClose={() => setIsMinutesModalOpen(false)} meeting={meetingMinutesTarget} onSuccess={() => {
            showToast('Meeting minutes recorded successfully', 'success');
            triggerRefresh();
        }}/>

      {/* Convert Lead to Project */}
      <ConvertLeadModal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} lead={convertLeadTarget} onSuccess={project => {
            showToast(`Converted lead to Active Project: ${project.projectId}`, 'success');
            triggerRefresh();
        }}/>

      <AIGenerateTasksModal isOpen={isAITaskGeneratorOpen} initialProjectId={aiTaskInitialProjectId} onClose={() => { setIsAITaskGeneratorOpen(false); setAiTaskInitialProjectId(''); }} onSuccess={message => { showToast(message, 'success'); triggerRefresh(); }}/>

      {/* Gemini AI Test Generator */}
      <AIGenerateTestCasesModal isOpen={isAITestGeneratorOpen} initialProjectId={aiTestInitialProjectId} onClose={() => { setIsAITestGeneratorOpen(false); setAiTestInitialProjectId(''); }} onSuccess={() => {
            showToast('Test cases imported into QA Test Suite', 'success');
            triggerRefresh();
        }}/>

      {/* Toast Feedback */}
      {toast && (<Toast id="global-toast" message={toast.message} type={toast.type} onClose={() => setToast(null)}/>)}
    </div>);
}
