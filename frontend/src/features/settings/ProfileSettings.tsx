import { useState, useEffect } from 'react';
import { userProfileApi, orgApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner';
import { User, Mail, Lock, Save, Loader2, Building2 } from 'lucide-react';

export const ProfileSettings = () => {
  const { user, fetchUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgId, setOrgId] = useState<number | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
    }
    orgApi.list().then(res => {
      if (res.data.length > 0) {
        const org = res.data[0];
        setOrgId(org.id);
        setOrgName(org.name);
        setOrgDesc(org.description || '');
      }
    }).catch(() => {});
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const payload: { full_name?: string; email?: string; password?: string } = {};
      if (fullName !== user?.full_name) payload.full_name = fullName;
      if (email !== user?.email) payload.email = email;
      if (password) payload.password = password;

      if (Object.keys(payload).length > 0) {
        await userProfileApi.update(payload);
        toast.success('Profile updated!');
        setPassword('');
        setConfirmPassword('');
        fetchUser();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !orgName.trim()) return;
    setSavingOrg(true);
    try {
      await orgApi.update(orgId, { name: orgName.trim(), description: orgDesc.trim() || undefined });
      toast.success('Organization updated!');
    } catch {
      toast.error('Failed to update organization');
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
      <p className="text-slate-400 mb-8">Manage your account and organization.</p>

      {/* Profile Section */}
      <div className="bg-surface-1 rounded-2xl border border-glass-border p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-primary" />
          Profile
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 gradient-brand text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-brand-primary/20 font-semibold text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </div>

      {/* Organization Section */}
      {orgId && (
        <div className="bg-surface-1 rounded-2xl border border-glass-border p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-primary" />
            Organization
          </h2>
          <form onSubmit={handleSaveOrg} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                rows={3}
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingOrg}
              className="flex items-center gap-2 gradient-brand text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-brand-primary/20 font-semibold text-sm disabled:opacity-50"
            >
              {savingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Organization
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
