import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = (pass: string): { label: string; color: string; width: string } => {
    if (pass.length === 0) return { label: '', color: '', width: '0%' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (pass.length < 8) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (pass.length < 12) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });

      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-0">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="relative z-10 max-w-md px-8 animate-fade-in">
          <h1 className="text-5xl font-bold gradient-text mb-6">
            AIFlow
          </h1>
          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            Join thousands of engineering teams optimizing their workflows with AI.
          </p>

          <div className="space-y-4">
            {[
              'Automated task prioritization',
              'Real-time anomaly detection',
              'Natural language task creation',
              'Sprint velocity analytics',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold gradient-text">AIFlow</h1>
          </div>

          <div className="glass-strong rounded-2xl p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
              <p className="text-slate-400 text-sm">
                Start building smarter workflows today
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="register-name"
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-1 border border-glass-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-1 border border-glass-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="register-password"
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-1 border border-glass-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500">Password strength</span>
                      <span className={`text-xs font-medium ${
                        strength.label === 'Strong' ? 'text-emerald-400' :
                        strength.label === 'Good' ? 'text-blue-400' :
                        strength.label === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                id="register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 transition-all glow-brand"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
