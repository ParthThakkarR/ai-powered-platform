import { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordResetApi } from '../../services/api';
import { toast } from 'sonner';
import { Mail, Loader2, ArrowLeft, Zap, ExternalLink } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await passwordResetApi.forgot(email);
      setSent(true);
      if (res.data.reset_url) {
        setResetUrl(res.data.reset_url);
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mx-auto mb-4 glow-brand">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-slate-400 mt-2">Enter your email to receive a reset link.</p>
        </div>

        <div className="bg-surface-1 rounded-2xl border border-glass-border p-6">
          {sent ? (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
              <p className="text-sm text-slate-400 mb-6">
                If an account exists with <span className="text-white">{email}</span>, we've sent a password reset link.
              </p>
              {resetUrl && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-300 mb-2">SMTP not configured. Use this link:</p>
                  <a
                    href={resetUrl}
                    className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 break-all"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    Reset Password
                  </a>
                </div>
              )}
              <Link to="/login" className="text-brand-primary font-semibold hover:text-brand-secondary text-sm">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 outline-none text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full px-4 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center text-sm">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
