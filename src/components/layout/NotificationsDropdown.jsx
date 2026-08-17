import React from 'react';
import { Bell, Clock, AlertTriangle, Calendar, ShieldAlert } from 'lucide-react';
export const NotificationsDropdown = ({ notifications, isOpen, onClose, onMarkAsRead, onMarkAllAsRead, onNavigate }) => {
    if (!isOpen)
        return null;
    const unreadList = notifications.filter(n => !n.isRead);
    const getIcon = (type) => {
        switch (type) {
            case 'meeting':
                return <Calendar className="h-4 w-4 text-blue-500"/>;
            case 'renewal':
                return <AlertTriangle className="h-4 w-4 text-amber-500"/>;
            case 'qa':
                return <ShieldAlert className="h-4 w-4 text-rose-500"/>;
            default:
                return <Clock className="h-4 w-4 text-emerald-500"/>;
        }
    };
    return (<div className="absolute right-4 top-16 z-50 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 p-3.5 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4 text-slate-500"/>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Notifications ({unreadList.length})
          </h4>
        </div>
        {unreadList.length > 0 && (<button onClick={onMarkAllAsRead} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Mark all read
          </button>)}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (<p className="p-6 text-center text-xs text-slate-400">No notifications.</p>) : (notifications.map(n => (<div key={n.id} onClick={() => {
                onMarkAsRead(n.id);
                if (n.relatedRecordType === 'lead')
                    onNavigate('leads', n.relatedRecordId);
                else if (n.relatedRecordType === 'meeting')
                    onNavigate('meetings', n.relatedRecordId);
                else if (n.relatedRecordType === 'project')
                    onNavigate('projects', n.relatedRecordId);
                else if (n.relatedRecordType === 'infrastructure')
                    onNavigate('infrastructure', n.relatedRecordId);
                else if (n.relatedRecordType === 'qa')
                    onNavigate('qa', n.relatedRecordId);
                onClose();
            }} className={`flex items-start space-x-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors dark:hover:bg-slate-800/80 ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
              <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {n.title}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                    {n.date}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {n.message}
                </p>
              </div>
            </div>)))}
      </div>
    </div>);
};
