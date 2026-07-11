import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Bell, Shield, Palette, Database, Save, Eye, EyeOff } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settings.service';
import { authService } from '../services/auth.service';
import { useUIStore } from '../store/ui.store';
import { toast } from 'sonner';
import type { Setting } from '../services/settings.service';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useUIStore();

  // Company settings state
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  // Notification settings (local prefs)
  const [emailNotifs, setEmailNotifs] = useState('all');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getAll(),
  });

  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data as Setting[];
      const get = (key: string) => s.find((x) => x.setting_key === key)?.setting_value || '';
      setCompanyName(get('company_name'));
      setCompanyAddress(get('company_address'));
      setCompanyEmail(get('company_email'));
      setCompanyPhone(get('company_phone'));
      setSessionTimeout(get('session_timeout') || '30');
    }
  }, [settingsData]);

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      await settingsService.updateMultiple({
        company_name: companyName,
        company_address: companyAddress,
        company_email: companyEmail,
        company_phone: companyPhone,
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Company settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifs(true);
    try {
      // Store notification prefs in localStorage (UI preference)
      localStorage.setItem('emailNotifs', emailNotifs);
      await settingsService.updateMultiple({ session_timeout: sessionTimeout });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Notification settings saved');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' },
  ];

  const notifOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'important', label: 'Important Only' },
    { value: 'none', label: 'None' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage system settings and preferences</p>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-text-secondary">Loading settings...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Bell className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
            </div>
            <div className="space-y-4">
              <Select
                label="Email Notifications"
                value={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.value)}
                options={notifOptions}
              />
              <Input
                label="Session Timeout (minutes)"
                type="number"
                min="5"
                max="480"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
              />
              <Button onClick={handleSaveNotifications} disabled={savingNotifs} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {savingNotifs ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-100 rounded-lg">
                <Palette className="w-5 h-5 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Appearance</h3>
            </div>
            <div className="space-y-4">
              <Select
                label="Theme"
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value as 'light' | 'dark' | 'system');
                  toast.success(`Theme changed to ${e.target.value}`);
                }}
                options={themeOptions}
              />
              <Select
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'hi', label: 'Hindi' },
                ]}
              />
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm text-text-secondary">
                  Theme changes apply instantly. Language support coming soon.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success-100 rounded-lg">
                <Shield className="w-5 h-5 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Security</h3>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="absolute right-3 top-[34px] text-text-secondary hover:text-text-primary"
                >
                  {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-[34px] text-text-secondary hover:text-text-primary"
                >
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
              <Button type="submit" disabled={changingPassword} className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                {changingPassword ? 'Changing...' : 'Update Password'}
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Company Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Database className="w-5 h-5 text-warning-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Company Settings</h3>
            </div>
            <div className="space-y-4">
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Satral Dairy"
              />
              <Input
                label="Company Address"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Satral Dairy Farm"
              />
              <Input
                label="Contact Email"
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="info@satral.com"
              />
              <Input
                label="Contact Phone"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="+91 XXXXXXXXXX"
              />
              <Button onClick={handleSaveCompany} disabled={savingCompany} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {savingCompany ? 'Saving...' : 'Save Company Settings'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
