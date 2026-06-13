import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, ShieldCheck, Eye, X, Loader2 } from 'lucide-react';
import { teamApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner';

interface TeamMember {
  id: number;
  organization_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user_email: string | null;
  user_name: string | null;
}

const roleConfig: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  ADMIN: { icon: ShieldCheck, color: 'text-amber-400', label: 'Admin' },
  MEMBER: { icon: Shield, color: 'text-blue-400', label: 'Member' },
  VIEWER: { icon: Eye, color: 'text-slate-400', label: 'Viewer' },
};

export const TeamMembersPage = () => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await teamApi.listMembers();
      setMembers(res.data);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await teamApi.invite({ email: inviteEmail.trim(), role: inviteRole });
      toast.success('Invitation sent!');
      setInviteEmail('');
      setInviteRole('MEMBER');
      setShowInvite(false);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: number, newRole: string) => {
    try {
      await teamApi.updateRole(memberId, newRole);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async (memberId: number) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await teamApi.removeMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Team Members</h1>
            <p className="text-sm text-slate-400">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 gradient-brand text-white px-4 py-2 rounded-xl hover:opacity-90 transition shadow-lg shadow-brand-primary/20 font-semibold text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 bg-surface-1 rounded-2xl border border-glass-border">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">No team members yet</p>
          <p className="text-slate-600 text-sm mt-1">Invite your first team member to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => {
            const cfg = roleConfig[member.role] || roleConfig.MEMBER;
            const RoleIcon = cfg.icon;
            const isCurrentUser = member.user_id === user?.id;

            return (
              <div key={member.id} className="flex items-center gap-4 p-4 bg-surface-1 rounded-xl border border-glass-border hover:border-surface-3 transition-all">
                <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center font-bold text-white text-sm uppercase flex-shrink-0">
                  {member.user_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {member.user_name || 'Unknown'} {isCurrentUser && <span className="text-xs text-slate-500">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{member.user_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-0 ${cfg.color}`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{cfg.label}</span>
                  </div>
                  {!isCurrentUser && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-surface-0 border border-glass-border text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="bg-surface-1 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-glass-border animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-glass-border">
              <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-glass-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-0 border border-glass-border text-white text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none cursor-pointer"
                >
                  <option value="ADMIN">Admin - Full access</option>
                  <option value="MEMBER">Member - Can create & edit tasks</option>
                  <option value="VIEWER">Viewer - Read only</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-glass-border text-slate-300 font-semibold hover:bg-glass-white transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center text-sm"
                >
                  {inviting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
