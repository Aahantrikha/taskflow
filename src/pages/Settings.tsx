import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Briefcase,
  Shield,
  Save,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { GlassCard } from '@/components/custom/GlassCard';
import { UserAvatar } from '@/components/custom/UserAvatar';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { user } = useStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    jobTitle: user?.jobTitle || '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await authApi.updateProfile({ name: formData.name, jobTitle: formData.jobTitle });
      setSaveMsg({ type: 'success', text: 'Profile updated successfully' });
      // Update store
      useStore.setState((state) => ({
        user: state.user ? { ...state.user, name: formData.name, jobTitle: formData.jobTitle } : null,
      }));
    } catch (err) {
      setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (newPassword.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    if (newPassword !== confirmPassword) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    setPwSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change password' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
      </div>

      {/* Profile Card */}
      <GlassCard hover={false}>
        <div className="flex items-center gap-5 mb-6">
          <UserAvatar user={user} size="xl" />
          <div>
            <h2 className="text-xl font-semibold">{user?.name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-400">
              <Shield className="w-3 h-3" />
              {user?.role === 'admin' ? 'Admin' : user?.role === 'project_lead' ? 'Project Lead' : user?.role === 'quality_reviewer' ? 'Reviewer' : 'Tasker'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Job Title</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email (read-only)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {saveMsg && (
          <div className={cn('flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-sm', saveMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
            {saveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {saveMsg.text}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </GlassCard>

      {/* Change Password */}
      <GlassCard hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold font-display">Change Password</h3>
        </div>
        <div className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
            />
          </div>

          {pwMsg && (
            <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm', pwMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
              {pwMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pwMsg.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={pwSaving || !currentPassword || !newPassword}
            className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
