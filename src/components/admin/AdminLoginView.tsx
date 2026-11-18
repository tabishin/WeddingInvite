import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft, 
  AlertCircle
} from 'lucide-react';
import { loginAdmin } from '../../services/auth';
import { WeddingTheme } from '../../types/wedding';

interface AdminLoginViewProps {
  theme: WeddingTheme;
  coupleTitle: string;
  onLoginSuccess: () => void;
  onBackToGuestView: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  theme,
  coupleTitle,
  onLoginSuccess,
  onBackToGuestView,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your User ID or Username');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your Password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const success = loginAdmin(username, password, rememberMe);
      setIsLoading(false);

      if (success) {
        onLoginSuccess();
      } else {
        setErrorMessage('Invalid User ID or Password. Please check your credentials and try again.');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center px-4 py-12 relative selection:bg-rose-500 selection:text-white">
      {/* Background Glow */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none -top-20 -left-20"
        style={{ backgroundColor: theme.colors.primary }}
      />
      <div 
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none -bottom-20 -right-20"
        style={{ backgroundColor: theme.colors.goldOrMetallic }}
      />

      <div className="max-w-md w-full relative z-10">
        {/* Back Link */}
        <button
          onClick={onBackToGuestView}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Wedding Invitation</span>
        </button>

        {/* Login Card */}
        <div className="bg-stone-800/95 backdrop-blur-xl border border-stone-700/80 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Header Icon */}
          <div className="text-center space-y-3 mb-8">
            <div 
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Lock className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              Host & Admin Portal
            </h1>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Secure access for <strong className="text-stone-200">{coupleTitle}</strong> to manage events, typography, themes, and guest RSVPs.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID Field */}
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                User ID / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-stone-900/90 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-stone-900/90 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-rose-600 focus:ring-rose-500/20"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform active:scale-98 flex items-center justify-center gap-2 mt-4 hover:brightness-110"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Admin Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <p className="text-center text-[11px] text-stone-500 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-stone-500 inline" />
          <span>Authorized wedding organizers and couple access only.</span>
        </p>
      </div>
    </div>
  );
};
