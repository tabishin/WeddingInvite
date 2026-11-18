import React, { useState } from 'react';
import { 
  Shield, 
  KeyRound, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  EyeOff,
  HelpCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { getAdminCredentials, updateAdminCredentials, resetAdminCredentialsToDefault } from '../../services/auth';
import { WeddingTheme } from '../../types/wedding';

interface AdminSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: WeddingTheme;
  onCredentialsUpdated: () => void;
}

export const AdminSecurityModal: React.FC<AdminSecurityModalProps> = ({
  isOpen,
  onClose,
  theme,
  onCredentialsUpdated,
}) => {
  const currentCreds = getAdminCredentials();
  const [username, setUsername] = useState(currentCreds.username);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState(currentCreds.passwordHint || '');
  const [showHintOnLoginPage, setShowHintOnLoginPage] = useState<boolean>(currentCreds.showHintOnLoginPage);
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate current password
    if (currentPasswordInput !== currentCreds.password) {
      setErrorMsg('The current password you entered is incorrect. Default password is: wedding2025');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('User ID / Username cannot be empty.');
      return;
    }

    // Determine target password
    const targetPassword = newPassword.trim() ? newPassword.trim() : currentCreds.password;

    if (newPassword.trim()) {
      if (newPassword.length < 4) {
        setErrorMsg('New password must be at least 4 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }
    }

    const updated = updateAdminCredentials(
      username.trim(), 
      targetPassword, 
      passwordHint.trim(),
      showHintOnLoginPage
    );

    if (updated) {
      setSuccessMsg('Admin login password & hint successfully updated!');
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      onCredentialsUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg('Failed to update credentials. Please check your input values.');
    }
  };

  const handleResetToFactoryDefault = () => {
    if (window.confirm('Reset admin credentials back to default (User: admin / Password: wedding2025)?')) {
      resetAdminCredentialsToDefault();
      setUsername('admin');
      setPasswordHint('Default demo password is wedding2025');
      setShowHintOnLoginPage(true);
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      onCredentialsUpdated();
      setSuccessMsg('Reset credentials to default (admin / wedding2025).');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden my-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">
              Admin Login & Password Settings
            </h3>
            <p className="text-xs text-stone-500">
              Change your login password, username, and customize the password hint shown on the login page.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Username & Current Password */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              1. Admin Identification & Verification
            </span>

            {/* User ID */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Admin User ID / Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. admin or sophia_alex"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                />
              </div>
            </div>

            {/* Current Password Verification */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1 flex items-center justify-between">
                <span>Current Password (Required to authorize changes) *</span>
                <span className="text-[10px] text-stone-400 font-normal">(Initial default: wedding2025)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: New Password */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              2. Set New Login Password
            </span>

            {/* New Password */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                New Password (leave empty to keep current password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 4 characters)"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                />
              </div>
            </div>

            {/* Confirm New Password */}
            {newPassword.trim() && (
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password exactly"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Password Hint & Display Options */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                3. Login Page Password Hint
              </span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                Custom Hint
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Custom Password Hint Text
              </label>
              <input
                type="text"
                value={passwordHint}
                onChange={(e) => setPasswordHint(e.target.value)}
                placeholder="e.g. Wedding city + year / Bride's birthday / Sacred date"
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                This hint helps you remember your password when accessing the admin portal.
              </p>
            </div>

            {/* Toggle Show Hint on Login Screen */}
            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-stone-800 text-xs">Display Hint on Login Screen</p>
                <p className="text-[10px] text-stone-500">Enable to show this reminder on the login box</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHintOnLoginPage}
                  onChange={(e) => setShowHintOnLoginPage(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {/* Quick Reset Option */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetToFactoryDefault}
              className="text-[11px] text-stone-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to default (admin / wedding2025)</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-white font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Save New Password & Hint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
