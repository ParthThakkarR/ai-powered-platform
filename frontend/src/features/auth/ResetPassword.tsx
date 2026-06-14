import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { passwordResetApi } from '../../services/api';
import { toast } from 'sonner';
import { Lock, Loader2, ArrowLeft, Zap, CheckCircle } from 'lucide-react';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await passwordResetApi.reset(token, password);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid or expired token');
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
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 mt-2">Enter your new password below.</p>
        </div>

        <div className="bg-surface-1 rounded-2xl border border-glass-border p-6">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Password Reset!</h2>
              <p className="text-sm text-slate-400 mb-6">Your password has been updated successfully.</p>
              <Link to="/login" className="text-brand-primary font-semibold hover:text-brand-secondary text-sm">
                Go to Login
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center py-4">
              <p className="text-red-400 text-sm">Invalid reset link. Please request a new one.</p>
              <Link to="/forgot-password" className="text-brand-primary font-semibold hover:text-brand-secondary text-sm mt-4 inline-block">
                Request Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={8}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 outline-none text-sm"
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
                <input
                  type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 outline-none text-sm"
                  placeholder="Re-enter password"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full px-4 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center text-sm">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
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
