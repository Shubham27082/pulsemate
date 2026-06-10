import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  getCampaigns,
  createCampaign,
  sendCampaignNow,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  deleteCampaign,
} from '../../api/campaign.api';

// ── Constants ─────────────────────────────────────────────────────────────────
const CHANNEL_LABELS = { PUSH: 'Push', IN_APP: 'In-App', PUSH_AND_IN_APP: 'Push + In-App' };
const TARGET_LABELS  = { ALL_USERS: 'All Users', SELECTED_USERS: 'Selected Users', CITY: 'City', STATE: 'State' };

const STATUS_CONFIG = {
  DRAFT:     { label: 'Draft',     bg: 'bg-gray-100',   text: 'text-gray-600'   },
  SCHEDULED: { label: 'Scheduled', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  SENDING:   { label: 'Sending',   bg: 'bg-orange-100', text: 'text-orange-700' },
  SENT:      { label: 'Sent',      bg: 'bg-green-100',  text: 'text-green-700'  },
  PAUSED:    { label: 'Paused',    bg: 'bg-yellow-100', text: 'text-yellow-700' },
  STOPPED:   { label: 'Stopped',   bg: 'bg-red-100',    text: 'text-red-700'    },
  FAILED:    { label: 'Failed',    bg: 'bg-red-100',    text: 'text-red-700'    },
};

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

// ── Sub-components ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm`}>
    <p className={`text-3xl font-bold ${color || 'text-gray-900'} leading-none mb-1.5`}>{value ?? 0}</p>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
  </div>
);

const EMPTY_FORM = {
  title: '', message: '', channel: 'PUSH_AND_IN_APP',
  targetType: 'ALL_USERS', targetCity: '', targetState: '',
  targetUserIds: '',
};

// ── Create/Edit Modal ─────────────────────────────────────────────────────────
const CampaignModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingNow, setIsSendingNow] = useState(false);

  useEffect(() => { if (isOpen) setForm(EMPTY_FORM); }, [isOpen]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const buildPayload = () => {
    const payload = {
      title:      form.title.trim(),
      message:    form.message.trim(),
      channel:    form.channel,
      targetType: form.targetType,
    };
    if (form.targetType === 'CITY')           payload.targetCity    = form.targetCity.trim();
    if (form.targetType === 'STATE')          payload.targetState   = form.targetState;
    if (form.targetType === 'SELECTED_USERS') {
      payload.targetUserIds = form.targetUserIds.split(',').map(s => s.trim()).filter(Boolean);
    }
    return payload;
  };

  const validate = () => {
    if (!form.title.trim())   return 'Title is required';
    if (!form.message.trim()) return 'Message is required';
    if (form.targetType === 'CITY'   && !form.targetCity.trim())  return 'City is required';
    if (form.targetType === 'STATE'  && !form.targetState)        return 'State is required';
    if (form.targetType === 'SELECTED_USERS' && !form.targetUserIds.trim())
      return 'User IDs are required for Selected Users target';
    return null;
  };

  const handleSaveDraft = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setIsSaving(true);
    try {
      await createCampaign(buildPayload());
      toast.success('Campaign saved as draft');
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save campaign');
    } finally { setIsSaving(false); }
  };

  const handleSendNow = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setIsSendingNow(true);
    try {
      const res = await createCampaign(buildPayload());
      const id = res.data.data.campaign.id;
      await sendCampaignNow(id);
      toast.success('Campaign created and sent successfully');
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send campaign');
    } finally { setIsSendingNow(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Update / Notification" size="lg">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. New feature available"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
          <textarea
            rows={3}
            value={form.message}
            onChange={e => set('message', e.target.value)}
            placeholder="Write your notification message here..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Channel */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Channel</label>
          <select
            value={form.channel}
            onChange={e => set('channel', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="PUSH_AND_IN_APP">Push + In-App</option>
            <option value="IN_APP">In-App Only</option>
            <option value="PUSH">Push Only</option>
          </select>
        </div>

        {/* Target Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Target</label>
          <select
            value={form.targetType}
            onChange={e => set('targetType', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL_USERS">All Users</option>
            <option value="CITY">By City</option>
            <option value="STATE">By State</option>
            <option value="SELECTED_USERS">Selected Users</option>
          </select>
        </div>

        {/* Conditional inputs */}
        {form.targetType === 'CITY' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
            <input
              value={form.targetCity}
              onChange={e => set('targetCity', e.target.value)}
              placeholder="e.g. Mumbai"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {form.targetType === 'STATE' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
            <select
              value={form.targetState}
              onChange={e => set('targetState', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select state</option>
              {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {form.targetType === 'SELECTED_USERS' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              User IDs <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-gray-400">(comma-separated)</span>
            </label>
            <textarea
              rows={2}
              value={form.targetUserIds}
              onChange={e => set('targetUserIds', e.target.value)}
              placeholder="uuid1, uuid2, uuid3"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSaving || isSendingNow}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || isSendingNow}
            className="px-4 py-2.5 rounded-xl border border-blue-200 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            onClick={handleSendNow}
            disabled={isSaving || isSendingNow}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSendingNow ? 'Sending…' : 'Send Now'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const AdminNotifications = () => {
  const [campaigns, setCampaigns]       = useState([]);
  const [stats, setStats]               = useState({});
  const [pagination, setPagination]     = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading]       = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(''); // campaignId being actioned

  // Filters
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterTarget, setFilterTarget]   = useState('');
  const [page, setPage]             = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCampaigns({
        page,
        limit: 20,
        ...(search       && { search }),
        ...(filterStatus  && { status:     filterStatus }),
        ...(filterChannel && { channel:    filterChannel }),
        ...(filterTarget  && { targetType: filterTarget }),
      });
      const { campaigns: list, stats: s } = res.data.data;
      setCampaigns(list || []);
      setStats(s || {});
      setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filterStatus, filterChannel, filterTarget]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionLoading(id + action);
    try {
      const actions = {
        send:   () => sendCampaignNow(id),
        pause:  () => pauseCampaign(id),
        resume: () => resumeCampaign(id),
        stop:   () => stopCampaign(id),
        delete: () => deleteCampaign(id),
      };
      const res = await actions[action]();
      toast.success(res.data?.message || 'Done');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const isActioning = (id, action) => actionLoading === id + action;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—';

  return (
    <DashboardLayout>
      <div className="page-container">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications & Updates</h1>
            <p className="mt-1 text-sm text-gray-500">Create, send, pause, and stop user updates</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Update
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total"     value={(stats.DRAFT||0)+(stats.SCHEDULED||0)+(stats.SENT||0)+(stats.PAUSED||0)+(stats.STOPPED||0)+(stats.FAILED||0)+(stats.SENDING||0)} />
          <StatCard label="Sent"      value={stats.SENT}      color="text-green-600"  />
          <StatCard label="Draft"     value={stats.DRAFT}     color="text-gray-600"   />
          <StatCard label="Scheduled" value={stats.SCHEDULED} color="text-blue-600"   />
          <StatCard label="Paused"    value={stats.PAUSED}    color="text-yellow-600" />
          <StatCard label="Failed"    value={stats.FAILED}    color="text-red-600"    />
        </div>

        {/* ── Filters ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search title or message…"
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterChannel} onChange={e => { setFilterChannel(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Channels</option>
            {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterTarget} onChange={e => { setFilterTarget(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Targets</option>
            {Object.entries(TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">No campaigns yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first notification campaign above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Channel</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Target</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Sent</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map(c => (
                    <CampaignRow
                      key={c.id}
                      campaign={c}
                      fmtDate={fmtDate}
                      isActioning={isActioning}
                      handleAction={handleAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              {pagination.total} total · Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Modal ──────────────────────────────────────────────── */}
      <CampaignModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={load}
      />
    </DashboardLayout>
  );
};

// ── Campaign row component ────────────────────────────────────────────────────
const CampaignRow = ({ campaign: c, fmtDate, isActioning, handleAction }) => {
  const canSend   = ['DRAFT', 'SCHEDULED', 'PAUSED', 'FAILED'].includes(c.status);
  const canPause  = ['DRAFT', 'SCHEDULED'].includes(c.status);
  const canResume = c.status === 'PAUSED';
  const canStop   = !['STOPPED', 'SENT'].includes(c.status);
  const canDelete = ['DRAFT', 'PAUSED', 'STOPPED', 'FAILED'].includes(c.status);

  return (
    <tr className="hover:bg-gray-50/40 transition-colors">
      {/* Title + message preview */}
      <td className="px-5 py-4 max-w-[220px]">
        <p className="font-semibold text-gray-900 truncate">{c.title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{c.message}</p>
      </td>

      {/* Channel */}
      <td className="px-5 py-4 hidden md:table-cell">
        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">
          {CHANNEL_LABELS[c.channel] || c.channel}
        </span>
      </td>

      {/* Target */}
      <td className="px-5 py-4 hidden lg:table-cell">
        <span className="text-xs text-gray-500">
          {TARGET_LABELS[c.targetType] || c.targetType}
          {c.targetCity  && ` · ${c.targetCity}`}
          {c.targetState && ` · ${c.targetState}`}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <StatusBadge status={c.status} />
        {c._count?.userNotifications > 0 && (
          <p className="text-[11px] text-gray-400 mt-0.5">{c._count.userNotifications} delivered</p>
        )}
      </td>

      {/* Created */}
      <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500">{fmtDate(c.createdAt)}</td>

      {/* Sent */}
      <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500">{fmtDate(c.sentAt)}</td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {canSend && (
            <ActionBtn
              label="Send"
              color="green"
              loading={isActioning(c.id, 'send')}
              onClick={() => handleAction(c.id, 'send', `Send "${c.title}" to users now?`)}
            />
          )}
          {canPause && (
            <ActionBtn
              label="Pause"
              color="yellow"
              loading={isActioning(c.id, 'pause')}
              onClick={() => handleAction(c.id, 'pause')}
            />
          )}
          {canResume && (
            <ActionBtn
              label="Resume"
              color="blue"
              loading={isActioning(c.id, 'resume')}
              onClick={() => handleAction(c.id, 'resume')}
            />
          )}
          {canStop && (
            <ActionBtn
              label="Stop"
              color="orange"
              loading={isActioning(c.id, 'stop')}
              onClick={() => handleAction(c.id, 'stop', `Stop "${c.title}"?`)}
            />
          )}
          {canDelete && (
            <ActionBtn
              label="Delete"
              color="red"
              loading={isActioning(c.id, 'delete')}
              onClick={() => handleAction(c.id, 'delete', `Delete "${c.title}" permanently?`)}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

const COLOR_MAP = {
  green:  'bg-green-50  text-green-700  hover:bg-green-100',
  yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
  blue:   'bg-blue-50   text-blue-700   hover:bg-blue-100',
  orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
  red:    'bg-red-50    text-red-700    hover:bg-red-100',
};

const ActionBtn = ({ label, color, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${COLOR_MAP[color]}`}
  >
    {loading ? '…' : label}
  </button>
);

export default AdminNotifications;
