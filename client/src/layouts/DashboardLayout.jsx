import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutSuccess } from '../store/slices/authSlice';
import api from '../services/api';
import { LogOut, User, BrainCircuit, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user }  = useSelector((state) => state.auth);
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const location  = useLocation();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (e) {}
    dispatch(logoutSuccess());
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#ffffff' }}>

      {/* ── Top Navbar ──────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 z-10 relative"
        style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}
      >
        {/* Left — brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #d97706, #b85c05)', boxShadow: '0 3px 10px rgba(217,119,6,0.3)' }}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-extrabold text-sm leading-tight" style={{ color: '#92400e' }}>DocuMind AI</span>

          {/* Admin link */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="ml-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all"
              style={
                location.pathname === '/admin'
                  ? { background: 'rgba(217,119,6,0.08)', borderColor: 'rgba(217,119,6,0.25)', color: '#b85c05' }
                  : { background: 'transparent', borderColor: '#e5e7eb', color: '#78716c' }
              }
            >
              <ShieldAlert className="h-3 w-3" /> Admin
            </Link>
          )}
        </div>

        {/* Right — user + sign out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)' }}>
              <User className="h-3 w-3" style={{ color: '#d97706' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#1c1917' }}>{user?.fullName}</span>
            {user?.role === 'admin' && (
              <span className="badge badge-brand text-[9px] py-0.5">ADMIN</span>
            )}
          </div>
          <div className="w-px h-4" style={{ background: '#e5e7eb' }} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg border border-transparent transition-colors"
            style={{ color: '#78716c' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#78716c'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden relative z-10" style={{ background: '#fafaf9' }}>
        {children}
      </div>
    </div>
  );
}
