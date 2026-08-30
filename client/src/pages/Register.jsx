import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { loginSuccess } from '../store/slices/authSlice';
import axios from 'axios';
import {
  BrainCircuit, Lock, Mail, User, ArrowRight, CheckCircle,
  AlertCircle, Sparkles, FileText, Cpu, Globe
} from 'lucide-react';

const perks = [
  { icon: FileText, text: 'Process any document format — PDF, DOCX, images' },
  { icon: Cpu,      text: 'AI-powered OCR, summarization, and semantic indexing' },
  { icon: Globe,    text: 'Ask questions and get cited, grounded answers' },
];

export default function Register() {
  const [successMsg, setSuccessMsg] = useState('');
  const [simToken,   setSimToken]   = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [verifying,  setVerifying]  = useState(false);
  const [password,   setPassword]   = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Password strength
  const getStrength = (pw) => {
    let s = 0;
    if (pw.length >= 6)  s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = getStrength(password);
  const strengthColors = ['','bg-rose-500','bg-amber-500','bg-yellow-400','bg-emerald-400','bg-emerald-500'];
  const strengthLabels = ['','Very Weak','Weak','Fair','Strong','Very Strong'];
  const strengthText   = ['','text-rose-400','text-amber-400','text-yellow-400','text-emerald-400','text-emerald-400'];

  const onSubmit = async (data) => {
    setLoading(true); setErrorMsg(''); setSuccessMsg(''); setSimToken('');
    try {
      const res = await axios.post('/api/v1/auth/register', data);
      setSuccessMsg(res.data.message);
      if (res.data.verificationToken) setSimToken(res.data.verificationToken);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error during registration');
    } finally { setLoading(false); }
  };

  const handleSimVerify = async () => {
    if (!simToken) return;
    setVerifying(true);
    try {
      const res = await axios.get(`/api/v1/auth/verify-email?token=${simToken}`);
      if (res.data.token) {
        dispatch(loginSuccess({ user: res.data.user, accessToken: res.data.token, refreshToken: res.data.refreshToken }));
      }
      setSuccessMsg('Email verified! Redirecting…');
      setSimToken('');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed');
    } finally { setVerifying(false); }
  };

  return (
    <div className="min-h-screen flex" style={{
      background: 'radial-gradient(ellipse 80% 60% at 75% 50%, rgba(74,124,95,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 65%, rgba(217,119,6,0.08) 0%, transparent 50%), #100d09'
    }}>
      {/* ── Left Form Panel ───────────────────────────────────────────── */}
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
            <div className="absolute top-0 left-0 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-dark-800/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-dark-100">Create your account</h2>
                <p className="text-dark-500 text-sm mt-1">Join DocuMind and transform your documents</p>
              </div>

              {/* Success */}
              {successMsg && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-sm flex flex-col gap-3 animate-fade-up">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{successMsg}</span>
                  </div>
                  {simToken && (
                    <div className="p-3 rounded-xl bg-dark-950/60 border border-dark-700 flex flex-col gap-2">
                      <p className="text-xs text-dark-400"><strong className="text-dark-200">Dev Mode:</strong> Skip email — verify instantly.</p>
                      <button onClick={handleSimVerify} disabled={verifying}
                        className="py-2 px-4 bg-brand-500/15 text-brand-300 border border-brand-500/25 rounded-xl text-xs font-bold hover:bg-brand-500/25 transition-all flex items-center justify-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        {verifying ? 'Verifying…' : 'Simulate Email Verification'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2.5 animate-fade-up">
                  <AlertCircle className="h-4 w-4 shrink-0" /> <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-600 pointer-events-none" />
                    <input type="text" placeholder="Jane Doe"
                      {...register('fullName', { required: 'Name is required' })}
                      className="input-field pl-10" />
                  </div>
                  {errors.fullName && <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-600 pointer-events-none" />
                    <input type="email" placeholder="name@example.com"
                      {...register('email', { required: 'Email is required' })}
                      className="input-field pl-10" />
                  </div>
                  {errors.email && <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-600 pointer-events-none" />
                    <input type="password" placeholder="••••••••"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'At least 6 characters' },
                        onChange: (e) => setPassword(e.target.value),
                      })}
                      className="input-field pl-10" />
                  </div>
                  {errors.password && <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.password.message}</p>}
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i<=strength ? strengthColors[strength] : 'bg-dark-800'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-semibold ${strengthText[strength]}`}>{strengthLabels[strength]}</p>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-brand-100/20 border-t-brand-100 rounded-full animate-spin"/>Creating Account…</>
                    : <>Create Account <ArrowRight className="h-4 w-4"/></>}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-sm text-dark-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">Sign In</Link>
          </p>
        </div>
      </div>

      {/* ── Right Brand Panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden">
        <div className="orb orb-sage  w-[500px] h-[500px] -top-32 -right-32 opacity-35 animate-orb" />
        <div className="orb orb-brand w-72   h-72   bottom-16 left-0 opacity-30 animate-orb" style={{animationDelay:'3s'}} />
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

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-5xl font-black text-dark-100 leading-[1.1] tracking-tight">
              Everything you need<br />
              to <span className="text-gradient">understand docs</span>
            </h2>
            <p className="text-dark-400 mt-4 text-lg">Free to start. No credit card required.</p>
          </div>
          <div className="space-y-4">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-up" style={{animationDelay:`${i*0.12}s`}}>
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <p.icon className="h-4 w-4 text-brand-400" />
                </div>
                <p className="text-dark-300 text-sm font-medium">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-xs text-brand-400 font-semibold">Powered by Gemini AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}