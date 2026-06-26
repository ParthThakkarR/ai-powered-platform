import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Lock, Mail, AlertCircle, ArrowRight, Zap, BarChart3, Bot } from 'lucide-react';
import { googleAuthApi } from '../../services/api';

declare global {
  interface Window {
    google?: any;
  }
}

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef<any>(null);
  const googleInitializedRef = useRef(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'github-login-failed') {
      setError('GitHub login failed. Please try again.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleCredentialResponse = useCallback(async (response: any) => {
    try {
      setError('');
      setIsLoading(true);
      const res = await googleAuthApi.login({ id_token: response.credential });
      await login(res.data.access_token);
      navigate('/dashboard');
    } catch {
      setError('Google login failed');
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    callbackRef.current = handleGoogleCredentialResponse;
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (window.google && !googleInitializedRef.current) {
        googleInitializedRef.current = true;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => callbackRef.current?.(response),
        });
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
          });
        }
        window.google.accounts.id.prompt();
      }
    };

    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initGoogle;
    document.body.appendChild(script);

    return () => {
      if (window.google && googleInitializedRef.current) {
        googleInitializedRef.current = false;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      await login(response.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-0">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="relative z-10 max-w-md px-8 animate-fade-in">
          <h1 className="text-5xl font-bold gradient-text mb-6">AIFlow</h1>
          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            AI-powered engineering workflow platform that automates task management and boosts team velocity.
          </p>

          <div className="space-y-5">
            {[
              { icon: Zap, text: 'Smart task prioritization with ML' },
              { icon: BarChart3, text: 'Real-time sprint analytics' },
              { icon: Bot, text: 'AI-powered bug analysis' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-slate-300" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold gradient-text">AIFlow</h1>
          </div>

          <div className="glass-strong rounded-2xl p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-slate-400 text-sm">Sign in to continue to your workspace</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-1 border border-glass-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-1 border border-glass-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 transition-all glow-brand"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 text-center">
              <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-brand-primary transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-glass-border" />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 h-px bg-glass-border" />
            </div>

            {/* Google Login Button */}
            <div ref={googleBtnRef} className="w-full min-h-[44px] [&>div]:!w-full [&>div>iframe]:!w-full" />

            {/* GitHub Login Button */}
            <button
              id="github-login"
              onClick={() => {
                const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
                if (!clientId) return;
                const redirectUri = `${window.location.origin}/auth/callback/github`;
                window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-1 border border-glass-border text-white font-semibold text-sm hover:bg-surface-2 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>

            <p className="mt-6 text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
