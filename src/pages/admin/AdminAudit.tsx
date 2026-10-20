import React, { useEffect, useState, useCallback } from 'react';
import { fetchAuditLogs } from '../../lib/api';
import { AuditLog } from '../../types/database';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import {
  Clock,
  Activity,
  Search,
} from 'lucide-react';

export const AdminAudit: React.FC = () => {
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      showToast('Failed to load audit logs', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const entityOptions = [
    { value: 'all', label: 'All Entities' },
    { value: 'shop', label: 'Shops' },
    { value: 'order', label: 'Orders' },
    { value: 'category', label: 'Categories' },
    { value: 'system', label: 'System' },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      (log.actor_email && log.actor_email.toLowerCase().includes(q));
    return matchesEntity && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('approved') || action.includes('saved')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('suspended') || action.includes('rejected') || action.includes('deleted')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (action.includes('updated')) {
      return 'bg-brand-50 text-brand-700 border-brand-200';
    }
    return 'bg-surface-subtle text-charcoal-700 border-surface-border';
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            Security & Audit Logs
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Immutable administrative activity logs, moderation decisions, and system operations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          leftIcon={<Clock className="w-3.5 h-3.5" />}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by action, entity ID, or admin email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-surface-border shadow-soft-sm focus:ring-1 focus:ring-purple-600"
          />
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            options={entityOptions}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-soft-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-400">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400 space-y-2">
            <Activity className="w-8 h-8 text-charcoal-300 mx-auto" />
            <p>No audit events match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-charcoal-600 font-bold uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-subtle/50 transition">
                    <td className="py-3 px-4 text-charcoal-500 whitespace-nowrap font-sans text-xs">
                      {new Date(log.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 font-sans text-xs font-semibold text-charcoal-800">
                      {log.actor_email || 'admin@sokoza.co.tz'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-xs uppercase font-bold text-charcoal-600">
                      {log.entity_type}
                    </td>

                    <td className="py-3 px-4 text-purple-700 font-bold max-w-xs truncate">
                      {log.entity_id}
                    </td>

                    <td className="py-3 px-4 font-sans text-[11px] text-charcoal-600 max-w-xs truncate">
                      {log.safe_metadata ? JSON.stringify(log.safe_metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
