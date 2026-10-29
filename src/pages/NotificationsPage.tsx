import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { notificationService } from '../services/notificationService';
import { apiClient } from '../services/apiClient';
import { NotificationType } from '../types';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  CheckCheck,
  ArrowRight,
  Info,
  Mail,
  FileText,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, currentUser, refreshAll, simulateTimePassing, showToast } = useAppStore();
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
  const [outboxEmails, setOutboxEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const fetchOutbox = async () => {
    try {
      const data = await apiClient.get<any[]>('/notifications/outbox');
      setOutboxEmails(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === 'outbox') {
      fetchOutbox();
    }
  }, [activeTab]);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    refreshAll();
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    await notificationService.markAllAsRead(currentUser.id);
    showToast('All notifications marked as read', 'info');
    refreshAll();
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    await simulateTimePassing();
    setIsSimulating(false);
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'approved':
      case 'waitlist_promotion':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'rejected':
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'incident_update':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Activity Alerts
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reservation status changes, waitlist auto-promotions, session countdown reminders, and compliance flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
          >
            <Clock className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : '⚡ Simulate +3h Passing'}</span>
          </button>

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'inbox'
              ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          In-App Notifications ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outbox')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === 'outbox'
              ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Local Outbox Log (.eml)</span>
        </button>
      </div>

      {activeTab === 'outbox' ? (
        /* Local Outbox Section */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-300">
            <strong>Local Mail Outbox Active:</strong> LendSpace writes RFC 822 standard <code>.eml</code> email files directly to the <code>./outbox</code> folder with zero cloud API dependencies. Below is the live inspection log:
          </div>

          {outboxEmails.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
              <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No emails dispatched to local outbox yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outboxEmails.map((email) => (
                <div
                  key={email.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{email.subject}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {email.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      To: <strong className="text-slate-700 dark:text-slate-300">{email.to_email}</strong> • {new Date(email.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {email.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Notifications List */
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
              <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">You have no notifications at this time.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  !notif.read
                    ? 'bg-white dark:bg-slate-900 border-teal-300 dark:border-teal-700 shadow-sm ring-1 ring-teal-500/10'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0 mt-0.5">
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-xs">{notif.title}</h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      {new Date(notif.createdAt).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center">
                  {notif.link && (
                    <Link
                      to={notif.link}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-medium px-2 py-1"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
