import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  RefreshCw, 
  Save, 
  Eye, 
  UserCheck, 
  Shield, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  Database
} from 'lucide-react';
import { WeddingTheme } from '../../types/wedding';
import { fetchActivityLogs, ActivityLogItem } from '../../services/storage';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: WeddingTheme;
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'DATA_SAVE' | 'GUEST_OPEN' | 'RSVP'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActivityLogs(60);
      setLogs(data);
    } catch (err) {
      console.warn('Failed to load logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  // Periodic polling while modal is open
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchActivityLogs(60).then((data) => {
        if (data && data.length > 0) {
          setLogs(data);
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.category === filter;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'DATA_SAVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Save className="w-3 h-3 text-emerald-700" />
            <span>DATA SAVED</span>
          </span>
        );
      case 'GUEST_OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Eye className="w-3 h-3 text-sky-700" />
            <span>GUEST OPENED</span>
          </span>
        );
      case 'RSVP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <UserCheck className="w-3 h-3 text-purple-700" />
            <span>RSVP</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">
            <Database className="w-3 h-3 text-stone-700" />
            <span>SYSTEM</span>
          </span>
        );
    }
  };

  const formatLogTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="activity-logs-modal"
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-800 text-emerald-400 border border-stone-700 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Server & Real-Time Sync Logs</h3>
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SQLite WAL Active
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Live trace of data saves, guest invitation link openings, and sync events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls & Status Bar */}
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-semibold uppercase text-[10px] tracking-wider mr-1">Filter:</span>
            {(['ALL', 'DATA_SAVE', 'GUEST_OPEN', 'RSVP'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filter === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {cat === 'ALL' ? 'All Events' : cat === 'DATA_SAVE' ? 'Data Saves' : cat === 'GUEST_OPEN' ? 'Guest Opens' : 'RSVPs'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-stone-500">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)} 
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-medium">Auto-poll (3s)</span>
            </label>
            <span className="text-stone-300">|</span>
            <span className="font-mono text-stone-600">{filteredLogs.length} events</span>
          </div>
        </div>

        {/* Log List View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 font-mono text-xs bg-stone-950 text-stone-200">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-stone-700" />
              <p className="text-sm font-medium">No activity logs recorded yet.</p>
              <p className="text-xs">
                Save changes in the admin panel or open any guest link (?invite=1, ?invite=2, ?invite=3) to populate logs.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-stone-700 transition-colors flex flex-col gap-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(log.category)}
                    <span className="text-white font-semibold">{log.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                    {log.ip && (
                      <span className="bg-stone-800 px-2 py-0.5 rounded text-stone-300">
                        IP: {log.ip}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-500" />
                      {formatLogTime(log.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-stone-300 font-sans text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800/80 leading-relaxed break-words">
                  {log.details}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All logged data is authoritative and stored in the SQLite database with real-time SSE broadcasts.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-stone-900 font-bold hover:bg-stone-100 transition-colors self-end sm:self-auto shrink-0"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
};
