import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { loginSuccess, setError, clearError, setLoading } from '../store/slices/authSlice';
import axios from 'axios';
import {
  BrainCircuit, Lock, Mail, ArrowRight, CheckCircle,
  AlertCircle, Sparkles, Zap, Shield, Brain
} from 'lucide-react';

const features = [
  { icon: Brain,  label: 'AI Summarization', desc: 'Instant multi-format document summaries' },
  { icon: Zap,    label: 'RAG Q&A Engine',   desc: 'Ask anything, get grounded cited answers' },
  { icon: Shield, label: 'OCR Intelligence', desc: 'Extract text from any document type' },
];

export default function Login() {
  const [forgotMode,     setForgotMode]     = useState(false);
  const [resetSentToken, setResetSentToken] = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');
  const [localError,     setLocalError]     = useState('');
  const [localLoading,   setLocalLoading]   = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const { register: loginReg,  handleSubmit: handleLoginSubmit,  formState: { errors: loginErrors  } } = useForm();
  const { register: forgotReg, handleSubmit: handleForgotSubmit, formState: { errors: forgotErrors } } = useForm();

  useEffect(() => { dispatch(clearError()); setLocalError(''); setSuccessMsg(''); }, [forgotMode, dispatch]);
  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  const onLogin = async (data) => {
    setLocalLoading(true);
    setLocalError('');
    dispatch(clearError());
    try {
      const res = await axios.post('/api/v1/auth/login', data);
      dispatch(loginSuccess(res.data));
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid login details';
      dispatch(setError(msg));
      setLocalError(msg);
    } finally {
      setLocalLoading(false);
    }
  };

  const onForgot = async (data) => {
    setLocalError(''); setSuccessMsg('');
    try {
      const res = await axios.post('/api/v1/auth/forgot-password', data);
      setSuccessMsg(res.data.message);
      if (res.data.resetToken) setResetSentToken(res.data.resetToken);
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Error executing forgot request');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#ffffff' }}>

      {/* ── Left Brand Panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #fff7ed 0%, #fffbf5 60%, #f0fdf4 100%)', borderRight: '1px solid #e5e7eb' }}>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #d97706, #b85c05)', boxShadow: '0 4px 16px rgba(217,119,6,0.3)' }}>
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl leading-none block" style={{ color: '#92400e' }}>DocuMind AI</span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: '#d97706' }}>Intelligence Platform</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight" style={{ color: '#1c1917' }}>
              Turn documents<br />
              into <span style={{ color: '#d97706' }}>intelligence</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed max-w-md" style={{ color: '#57534e' }}>
              Upload any document and unlock instant AI summaries, intelligent Q&A, and deep semantic understanding.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl p-4 flex items-center gap-4 animate-fade-up"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', animationDelay: `${i * 0.1}s` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}>
                  <f.icon className="h-5 w-5" style={{ color: '#d97706' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>{f.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#78716c' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: '#059669' }}>All systems operational</span>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ background: '#ffffff' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #d97706, #b85c05)' }}>
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl" style={{ color: '#92400e' }}>DocuMind AI</span>
          </div>

          <div className="rounded-3xl p-8 relative overflow-hidden"
            style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

            <div className="relative z-10">
              {!forgotMode ? (
                <>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold" style={{ color: '#1c1917' }}>Welcome back</h2>
                    <p className="text-sm mt-1" style={{ color: '#78716c' }}>Sign in to your DocuMind workspace</p>
                  </div>

                  {localError && (
                    <div className="mb-5 p-3.5 rounded-xl text-sm flex items-center gap-2.5 animate-fade-up"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
                      <AlertCircle className="h-4 w-4 shrink-0" /> <span>{localError}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-5 p-3.5 rounded-xl text-sm flex flex-col gap-3 animate-fade-up"
                      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' }}>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> <p>{successMsg}</p>
                      </div>
                      {resetSentToken && (
                        <div className="p-2 rounded-lg font-mono text-[11px] select-all break-all"
                          style={{ background: '#f5f5f4', border: '1px solid #e7e5e4', color: '#44403c' }}>
                          Reset Token: {resetSentToken}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#57534e' }}>
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#a8a29e' }} />
                        <input type="email" placeholder="name@example.com"
                          {...loginReg('email', { required: 'Email is required' })}
                          className="input-field pl-10" />
                      </div>
                      {loginErrors.email && <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#dc2626' }}><AlertCircle className="h-3 w-3" />{loginErrors.email.message}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#57534e' }}>Password</label>
                        <button type="button" onClick={() => setForgotMode(true)}
                          className="text-xs font-semibold transition-colors" style={{ color: '#d97706' }}>
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#a8a29e' }} />
                        <input type="password" placeholder="••••••••"
                          {...loginReg('password', { required: 'Password is required' })}
                          className="input-field pl-10" />
                      </div>
                      {loginErrors.password && <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#dc2626' }}><AlertCircle className="h-3 w-3" />{loginErrors.password.message}</p>}
                    </div>

                    <button type="submit" disabled={localLoading} className="btn-primary w-full py-3.5 mt-2">
                      {localLoading
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Authenticating…</>
                        : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold" style={{ color: '#1c1917' }}>Reset Password</h2>
                    <p className="text-sm mt-1" style={{ color: '#78716c' }}>We'll send a recovery token to your email</p>
                  </div>

                  {localError && (
                    <div className="mb-5 p-3.5 rounded-xl text-sm flex items-center gap-2.5"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>
                      <AlertCircle className="h-4 w-4 shrink-0" /> <span>{localError}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="mb-5 p-3.5 rounded-xl text-sm flex flex-col gap-3"
                      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' }}>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> <p>{successMsg}</p>
                      </div>
                      {resetSentToken && (
                        <div className="p-2 rounded-lg font-mono text-[11px] select-all break-all"
                          style={{ background: '#f5f5f4', border: '1px solid #e7e5e4', color: '#44403c' }}>
                          Reset Token: {resetSentToken}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleForgotSubmit(onForgot)} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#57534e' }}>
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#a8a29e' }} />
                        <input type="email" placeholder="name@example.com"
                          {...forgotReg('email', { required: 'Email is required' })}
                          className="input-field pl-10" />
                      </div>
                      {forgotErrors.email && <p className="text-xs mt-1.5" style={{ color: '#dc2626' }}>{forgotErrors.email.message}</p>}
                    </div>
                    <button type="submit" className="btn-primary w-full py-3.5">
                      <Sparkles className="h-4 w-4" /> Generate Recovery Link
                    </button>
                    <button type="button" onClick={() => setForgotMode(false)}
                      className="w-full text-sm font-medium py-2 transition-colors" style={{ color: '#78716c' }}>
                      ← Back to Sign In
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {!forgotMode && (
            <p className="text-center text-sm mt-6" style={{ color: '#78716c' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-bold transition-colors" style={{ color: '#d97706' }}>
                Create account
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
