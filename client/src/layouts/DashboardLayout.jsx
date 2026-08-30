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
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#100d09' }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="orb orb-brand w-80 h-80 -top-20 -left-20 opacity-30 animate-orb" />
        <div className="orb orb-sage  w-72 h-72 bottom-0 right-0 opacity-20 animate-orb" style={{ animationDelay: '5s' }} />
      </div>

      {/* ── Top bar: Logo (left) + Admin link + User + Sign Out (right) ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 z-10 relative border-b"
        style={{ borderColor: 'rgba(150,115,75,0.1)', background: 'rgba(9,7,4,0.65)', backdropFilter: 'blur(16px)' }}
      >
        {/* Left — small brand mark */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 3px 10px rgba(217,119,6,0.35)' }}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-brand-50" />
          </div>
          <span className="text-gradient font-extrabold text-sm leading-tight">DocuMind AI</span>

          {/* Admin link (only for admins) */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`ml-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                location.pathname === '/admin'
                  ? 'bg-brand-500/15 border-brand-500/25 text-brand-300'
                  : 'border-dark-700/50 text-dark-400 hover:text-dark-200 hover:border-dark-600'
              }`}
            >
              <ShieldAlert className="h-3 w-3" /> Admin
            </Link>
          )}
        </div>

        {/* Right — user name + sign out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <User className="h-3 w-3 text-brand-400" />
            </div>
            <span className="text-sm font-semibold text-dark-200">{user?.fullName}</span>
            {user?.role === 'admin' && (
              <span className="badge badge-brand text-[9px] py-0.5">ADMIN</span>
            )}
          </div>
          <div className="w-px h-4 bg-dark-700" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-dark-400 hover:text-rose-400 transition-colors py-1 px-2 rounded-lg hover:bg-rose-500/8 border border-transparent hover:border-rose-500/15"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Main content (full width, no sidebar) ─────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden relative z-10">
        {children}
      </div>
    </div>
  );
}
