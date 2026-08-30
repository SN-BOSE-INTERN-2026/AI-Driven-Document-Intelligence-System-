import React, { useState, useEffect } from 'react';
// Admin Dashboard — full-width layout (no sidebar)
import api from '../services/api';
import { 
  Users, 
  FileText, 
  Database, 
  Cpu, 
  Trash2, 
  ShieldCheck, 
  RefreshCw,
  Loader2,
  Calendar,
  Layers,
  Fingerprint,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  Crown,
  UserCheck,
  Shield
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const LOG_ACTION_COLORS = {
  login: 'badge-emerald',
  logout: 'badge-slate',
  upload: 'badge-brand',
  delete: 'badge-rose',
  update: 'badge-amber',
  register: 'badge-cyan',
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logPagesCount, setLogPagesCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users')
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await api.get(`/admin/logs?page=${page}&limit=10`);
      setLogs(res.data.logs);
      setLogPagesCount(res.data.totalPages);
      setLogPage(res.data.currentPage);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAdminData(), fetchLogs(1)]);
    setRefreshing(false);
  };

  useEffect(() => { fetchAdminData(); fetchLogs(1); }, []);

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change this user's role to ${nextRole.toUpperCase()}?`)) return;
    try {
      await api.put(`/admin/users/${userId}/role`, { role: nextRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: nextRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user and all their documents?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-glow-pulse">
            <Shield className="h-8 w-8 text-violet-400" />
          </div>
          <div className="absolute inset-0 rounded-2xl animate-ping border border-violet-500/20" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Loading Admin Panel</p>
          <p className="text-slate-500 text-sm mt-1">Aggregating database statistics...</p>
        </div>
      </div>
    );
  }

  // Chart configurations
  const chartBaseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#64748b', font: { family: 'Outfit', size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(139,92,246,0.3)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 10,
        cornerRadius: 10,
      }
    },
    scales: {
      y: { 
        ticks: { color: '#475569', font: { size: 11 } }, 
        grid: { color: 'rgba(30,41,59,0.6)', drawBorder: false },
        border: { display: false }
      },
      x: { 
        ticks: { color: '#475569', font: { size: 11 } }, 
        grid: { display: false },
        border: { display: false }
      }
    }
  };

  const trendsChartData = {
    labels: analytics?.uploadTrends?.map(t => t.month) || [],
    datasets: [{
      label: 'Documents Uploaded',
      data: analytics?.uploadTrends?.map(t => t.documents) || [],
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#7c3aed',
      pointBorderColor: '#a78bfa',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const typesChartData = {
    labels: analytics?.popularTypes?.map(t => t.name) || [],
    datasets: [{
      data: analytics?.popularTypes?.map(t => t.value) || [],
      backgroundColor: ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#64748b'],
      borderWidth: 2,
      borderColor: '#0f172a',
      hoverBorderColor: '#1e293b',
    }]
  };

  const categoriesChartData = {
    labels: analytics?.popularCategories?.map(c => c.name) || [],
    datasets: [{
      label: 'Documents',
      data: analytics?.popularCategories?.map(c => c.value) || [],
      backgroundColor: 'rgba(139, 92, 246, 0.7)',
      hoverBackgroundColor: '#8b5cf6',
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const statCards = [
    { label: 'Total Users', value: analytics?.totalUsers, icon: Users, color: 'from-violet-600/20 to-purple-700/10', border: 'border-violet-500/20', iconColor: 'text-violet-400', glow: 'rgba(139,92,246,0.2)' },
    { label: 'Total Documents', value: analytics?.totalDocuments, icon: FileText, color: 'from-emerald-600/20 to-teal-700/10', border: 'border-emerald-500/20', iconColor: 'text-emerald-400', glow: 'rgba(16,185,129,0.2)' },
    { label: 'Storage Used', value: formatBytes(analytics?.storageUsage), icon: Database, color: 'from-amber-600/20 to-orange-700/10', border: 'border-amber-500/20', iconColor: 'text-amber-400', glow: 'rgba(245,158,11,0.2)' },
    { label: 'AI API Requests', value: analytics?.totalAIRequests, icon: Cpu, color: 'from-cyan-600/20 to-blue-700/10', border: 'border-cyan-500/20', iconColor: 'text-cyan-400', glow: 'rgba(6,182,212,0.2)' },
  ];

  return (
    <div className="h-full overflow-y-auto">
    <div className="space-y-7 p-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">Control Panel</p>
          <h1 className="text-3xl font-black text-white">Administration</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor system health, manage users, and audit security logs.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="gradient-divider" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <div key={stat.label} className="stat-card relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
              style={{background: `radial-gradient(circle at 80% 20%, ${stat.glow}, transparent 70%)`}} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} border ${stat.border} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div className="text-2xl font-black text-white leading-none">{stat.value ?? '—'}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1.5 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Monthly Upload Volume</h3>
                <p className="text-[10px] text-slate-600">Documents processed over time</p>
              </div>
            </div>
          </div>
          <div className="h-56">
            <Line data={trendsChartData} options={chartBaseOptions} />
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">File Type Distribution</h3>
              <p className="text-[10px] text-slate-600">By extension share</p>
            </div>
          </div>
          <div className="h-56">
            <Doughnut data={typesChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#64748b', font: { family: 'Outfit', size: 10 }, padding: 12, boxWidth: 12 } },
                tooltip: {
                  backgroundColor: 'rgba(15,23,42,0.95)',
                  borderColor: 'rgba(139,92,246,0.3)',
                  borderWidth: 1,
                  titleColor: '#e2e8f0',
                  bodyColor: '#94a3b8',
                  cornerRadius: 10,
                }
              },
              cutout: '65%',
            }} />
          </div>
        </div>
      </div>

      {/* Category Bar Chart */}
      <div className="glass-panel rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Document Categories Breakdown</h3>
            <p className="text-[10px] text-slate-600">Top categories by document count</p>
          </div>
        </div>
        <div className="h-48">
          <Bar data={categoriesChartData} options={chartBaseOptions} />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-700/10 border border-violet-500/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">User Accounts</h3>
            <p className="text-[10px] text-slate-600">{users.length} registered users</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="pb-3 pt-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest first:pl-2 last:text-right last:pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {users.map((item) => (
                <tr key={item._id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.fullName)}&background=7c3aed&color=fff&bold=true&size=64`} 
                          className="h-8 w-8 rounded-full object-cover border-2 border-slate-700/50 group-hover:border-violet-500/30 transition-colors" 
                          alt={item.fullName} 
                        />
                        {item.role === 'admin' && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 border border-dark-950 flex items-center justify-center">
                            <Crown className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-white text-sm">{item.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 font-mono text-xs text-slate-500">{item.email}</td>
                  <td className="py-3.5">
                    <span className={`badge ${item.role === 'admin' ? 'badge-brand' : 'badge-slate'}`}>
                      {item.role === 'admin' ? <><Crown className="h-2.5 w-2.5" /> ADMIN</> : <><UserCheck className="h-2.5 w-2.5" /> USER</>}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-slate-600">{new Date(item.createdAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</td>
                  <td className="py-3.5 pr-2">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleToggleRole(item._id, item.role)}
                        className="px-3 py-1.5 text-[10px] font-bold text-violet-400 hover:text-violet-300 bg-violet-500/8 hover:bg-violet-500/15 rounded-lg border border-violet-500/15 transition-all"
                      >
                        Toggle Role
                      </button>
                      <button
                        onClick={() => handleDeleteUser(item._id)}
                        className="p-1.5 text-rose-400/60 hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/15 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600/20 to-orange-700/10 border border-amber-500/20 flex items-center justify-center">
            <Fingerprint className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Security Audit Logs</h3>
            <p className="text-[10px] text-slate-600">Real-time system event trail</p>
          </div>
        </div>

        {logsLoading ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
            <p className="text-slate-500 text-xs">Loading audit logs...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    {['Timestamp', 'Action', 'Performed By', 'Details', 'IP'].map(h => (
                      <th key={h} className="pb-3 pt-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest first:pl-2 last:pr-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/20">
                  {logs.map((log) => {
                    const actionLower = log.action?.toLowerCase() || '';
                    const badgeClass = Object.keys(LOG_ACTION_COLORS).find(k => actionLower.includes(k));
                    return (
                      <tr key={log._id} className="hover:bg-slate-800/15 transition-colors">
                        <td className="py-3 pl-2 text-[11px] font-mono text-slate-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td className="py-3">
                          <span className={`badge ${badgeClass ? LOG_ACTION_COLORS[badgeClass] : 'badge-slate'} text-[10px]`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-violet-400 font-medium whitespace-nowrap">
                          {log.performedBy ? `${log.performedBy.fullName}` : 'System'}
                        </td>
                        <td className="py-3 text-xs text-slate-500 max-w-[200px] truncate" title={log.details}>{log.details}</td>
                        <td className="py-3 pr-2 text-[11px] font-mono text-slate-600">{log.ipAddress || 'localhost'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800/40">
              <span className="text-xs text-slate-600 font-medium">
                Page <span className="text-slate-400">{logPage}</span> of <span className="text-slate-400">{logPagesCount}</span>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={logPage === 1}
                  onClick={() => fetchLogs(logPage - 1)}
                  className="btn-ghost py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <button
                  disabled={logPage === logPagesCount}
                  onClick={() => fetchLogs(logPage + 1)}
                  className="btn-ghost py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
