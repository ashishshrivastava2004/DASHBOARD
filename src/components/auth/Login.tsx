import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, signUp, demoSignIn, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMessage(error.message || 'Authentication failed. Please verify your credentials.');
      }
    } else {
      const { error, needsConfirmation } = await signUp(email, password);
      if (error) {
        setErrorMessage(error.message || 'Registration failed.');
      } else if (needsConfirmation) {
        setSuccessMessage('Registration successful! Please check your email to confirm your account.');
      }
    }

    setIsLoading(false);
  };

  const handleQuickDemo = () => {
    demoSignIn('Store Director');
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased">
      {/* Background Subtle Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(#111827 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white border border-[#E5E7EB] rounded-xl shadow-xs mb-4">
            <span className="font-clash text-xl font-bold tracking-tight text-neutral-900">A</span>
          </div>
          <h1 className="font-clash text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            ATELIER // ADMIN
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-normal">
            Drop 01 Operations & Supabase Store Engine
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className="mb-4">
          {isConfigured ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-neutral-600 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected to live Supabase project</span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-neutral-600 shadow-2xs">
              <Sparkles className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-neutral-900">Ready for Keys: </span>
                <span>Paste your keys in <code className="bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> to connect live Supabase, or test right now with 1-click demo.</span>
              </div>
            </div>
          )}
        </div>

        {/* Minimalist White Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 shadow-xs">
          {/* Tab Switcher */}
          <div className="flex border-b border-[#E5E7EB] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-sm font-medium transition-colors relative flex-1 text-center ${
                mode === 'signin'
                  ? 'text-neutral-900 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Sign In
              {mode === 'signin' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`pb-3 text-sm font-medium transition-colors relative flex-1 text-center ${
                mode === 'signup'
                  ? 'text-neutral-900 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Create Account
              {mode === 'signup' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />
              )}
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-50/70 border border-red-200 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@atelier-vault.com"
                  autoComplete="email"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors pl-10"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-700">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@atelier-vault.com');
                      setPassword('atelier_secret_2026');
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 underline"
                  >
                    Use sample password
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors pl-10 pr-10"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Dashboard' : 'Register Admin Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <p className="text-xs text-neutral-500 text-center mb-3">
              Instant evaluation without Supabase sign up
            </p>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-neutral-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-neutral-700" />
              <span>Enter as Store Director (1-Click Demo)</span>
            </button>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-6 text-center text-xs text-neutral-400">
          <span>Shopify Minimalist Architecture · Supabase v2.4+ Client</span>
        </div>
      </div>
    </div>
  );
};
