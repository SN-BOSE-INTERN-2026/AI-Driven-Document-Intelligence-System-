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

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const { register: loginReg,  handleSubmit: handleLoginSubmit,  formState: { errors: loginErrors  } } = useForm();
  const { register: forgotReg, handleSubmit: handleForgotSubmit, formState: { errors: forgotErrors } } = useForm();

  useEffect(() => { dispatch(clearError()); setLocalError(''); setSuccessMsg(''); }, [forgotMode, dispatch]);
  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  const onLogin = async (data) => {
    dispatch(setLoading(true));
    dispatch(clearError());
    setLocalError('');
    try {
      const res = await axios.post('/api/v1/auth/login', data);
      dispatch(loginSuccess(res.data));
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid login details';
      dispatch(setError(msg));
      setLocalError(msg);
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
    <div className="min-h-screen flex" style={{
      background: 'radial-gradient(ellipse 80% 60% at 25% 50%, rgba(217,119,6,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 65%, rgba(74,124,95,0.05) 0%, transparent 50%), #100d09'
    }}>
      {/* ── Left Brand Panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden">
        {/* Orb decorations — warm */}
        <div className="orb orb-brand w-[600px] h-[600px] -top-40 -left-40 opacity-40 animate-orb" />
        <div className="orb orb-sage  w-80  h-80  bottom-16 right-0 opacity-30 animate-orb" style={{animationDelay:'4s'}} />
        <div className="absolute inset-0 mesh-bg opacity-30" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center animate-glow-pulse"
              style={{boxShadow:'0 4px 24px rgba(217,119,6,0.4)'}}>
              <BrainCircuit className="h-6 w-6 text-brand-50" />
            </div>
            <div>
              <span className="text-gradient font-extrabold text-xl leading-none block">DocuMind AI</span>
              <span className="text-[10px] text-dark-500 uppercase tracking-widest">Intelligence Platform</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl xl:text-6xl font-black text-dark-100 leading-[1.1] tracking-tight">
              Turn documents<br />
              into <span className="text-gradient">intelligence</span>
            </h1>
            <p className="text-dark-400 mt-4 text-lg leading-relaxed max-w-md">
              Upload any document and unlock instant AI summaries, intelligent Q&A, and deep semantic understanding.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4 border border-dark-700/40 animate-fade-up" style={{animationDelay:`${i*0.1}s`}}>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-5 w-5 text-brand-400" />
                </div>
                <div>
                  <p className="font-semibold text-dark-100 text-sm">{f.label}</p>
                  <p className="text-dark-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-semibold">All systems operational</span>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-brand-50" />
            </div>
            <span className="text-gradient font-extrabold text-xl">DocuMind AI</span>
          </div>

          <div className="glass-panel-deep rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0  w-32 h-32 bg-dark-800/30        rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {!forgotMode ? (
                <>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-dark-100">Welcome back</h2>
                    <p className="text-dark-500 text-sm mt-1">Sign in to your DocuMind workspace</p>
                  </div>

                  {localError && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2.5 animate-fade-up">
                      <AlertCircle className="h-4 w-4 shrink-0" /> <span>{localError}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-sm flex flex-col gap-3 animate-fade-up">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> <p>{successMsg}</p>
                      </div>
                      {resetSentToken && (
                        <div className="p-2 rounded-lg bg-dark-950 font-mono text-[11px] text-dark-400 select-all border border-dark-700 break-all">
                          Reset Token: {resetSentToken}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-600 pointer-events-none" />
                        <input type="email" placeholder="name@example.com"
                          {...loginReg('email', { required: 'Email is required' })}
                          className="input-field pl-10" />
                      </div>
                      {loginErrors.email && <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{loginErrors.email.message}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Password</label>
                        <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-600 pointer-events-none" />
                        <input type="password" placeholder="••••••••"
                          {...loginReg('password', { required: 'Password is required' })}
                          className="input-field pl-10" />
                      </div>
                      {loginErrors.password && <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{loginErrors.password.message}</p>}
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
                      {loading
                        ? <><div className="w-4 h-4 border-2 border-brand-100/20 border-t-brand-100 rounded-full animate-spin"/>Authenticating…</>
                        : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-dark-100">Reset Password</h2>
                    <p className="text-dark-500 text-sm mt-1">We'll send a recovery token to your email</p>
                  </div>

                  {localError && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0" /> <span>{localError}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-sm flex flex-col gap-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> <p>{successMsg}</p>
                      </div>
                      {resetSentToken && (
                        <div className="p-2 rounded-lg bg-dark-950 font-mono text-[11px] text-dark-400 select-all border border-dark-700 break-all">
                          Reset Token: {resetSentToken}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleForgotSubmit(onForgot)} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-600 pointer-events-none" />
                        <input type="email" placeholder="name@example.com"
                          {...forgotReg('email', { required: 'Email is required' })}
                          className="input-field pl-10" />
                      </div>
                      {forgotErrors.email && <p className="text-rose-400 text-xs mt-1.5">{forgotErrors.email.message}</p>}
                    </div>
                    <button type="submit" className="btn-primary w-full py-3.5">
                      <Sparkles className="h-4 w-4" /> Generate Recovery Link
                    </button>
                    <button type="button" onClick={() => setForgotMode(false)}
                      className="w-full text-sm text-dark-500 hover:text-dark-300 transition-colors py-2 font-medium">
                      ← Back to Sign In
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {!forgotMode && (
            <p className="text-center text-sm text-dark-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
                Create account
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
