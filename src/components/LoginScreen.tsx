import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SITE_CONFIG } from '../config/site';
import { signInWithGoogle, auth } from '../lib/firebase';
import { Check, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: (name: string, email?: string) => void;
  onBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onBack }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUser = auth.currentUser;

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    setStatusMessage(`Connecting to ${SITE_CONFIG.organizationName}...`);

    try {
      let user = auth.currentUser;

      if (!user) {
        setStatusMessage(`Authorizing with ${SITE_CONFIG.organizationName}...`);
        user = await signInWithGoogle();
      }

      const displayName = user?.displayName || user?.email?.split('@')[0] || 'Aetheria User';
      const email = user?.email || undefined;

      setStatusMessage(`${SITE_CONFIG.organizationName} Identity Verified · Opening...`);

      setTimeout(() => {
        onSuccess(displayName, email);
      }, 500);
    } catch (err: unknown) {
      console.warn('Authentication error:', err);
      setIsAuthenticating(false);
      setStatusMessage(null);
      
      const errorStr = String(err);
      if (errorStr.includes('unauthorized-domain')) {
        setErrorMessage('This domain was just linked to your Firebase project. If propagation is pending, you can continue as Guest below or retry.');
      } else if (errorStr.includes('popup-closed-by-user')) {
        setErrorMessage('Authentication window was closed. Click below to retry.');
      } else if (errorStr.includes('popup-blocked')) {
        setErrorMessage('Popup was blocked by your browser. Please allow popups or continue as guest.');
      } else {
        setErrorMessage(`Unable to complete connection to ${SITE_CONFIG.organizationName}. You can retry or proceed directly as Guest.`);
      }
    }
  };

  const handleGuestContinue = () => {
    onSuccess('Guest Explorer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-black select-none px-4"
    >
      <div className="w-full max-w-[420px] mx-auto">
        {/* Apple-styled Minimal Container with crisp border */}
        <div className="relative rounded-3xl border-2 border-black bg-white px-8 py-9 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          {/* Top Tag */}
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[10px] font-mono uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-3 h-3 text-neutral-700" />
              <span>{SITE_CONFIG.organizationName} Identity</span>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Sign in to {SITE_CONFIG.organizationName}
          </h1>

          <p className="text-xs sm:text-[13px] text-neutral-500 font-medium mt-2 leading-relaxed">
            Authorize your identity to enter the {SITE_CONFIG.organizationName} liquid glass workspace and encrypted cloud dialogues.
          </p>

          {/* Current user active session pill if previously logged in */}
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Active Session Found
                </div>
                <div className="text-xs font-bold text-black truncate mt-0.5">
                  {currentUser.email || currentUser.displayName || 'Authorized Account'}
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-mono font-semibold">
                <Check className="w-2.5 h-2.5" />
                Ready
              </span>
            </motion.div>
          )}

          {/* Error Message banner if popup failed */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Primary Action: Continue with Google */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={handleGoogleLogin}
              className="w-full relative group flex items-center justify-center gap-3 py-4 px-5 rounded-2xl border-2 border-black bg-black text-white hover:bg-neutral-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.12)] active:scale-[0.98]"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span className="text-sm font-black uppercase tracking-wider">
                    {statusMessage || 'Verifying...'}
                  </span>
                </>
              ) : (
                <>
                  {/* Official Google G Icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-sm font-black uppercase tracking-wider">
                    {currentUser ? `Continue to ${SITE_CONFIG.organizationName}` : `Connect to ${SITE_CONFIG.organizationName}`}
                  </span>
                </>
              )}
            </button>

            {/* Fallback option if user prefers guest entry without Google */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleGuestContinue}
                className="text-xs font-semibold text-neutral-400 hover:text-black transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Skip and continue as Guest
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Sub-caption */}
        <div className="mt-4 text-center">
          <span className="text-[11px] font-mono font-medium text-neutral-400 tracking-wider">
            {SITE_CONFIG.organizationName} · SECURE GATE
          </span>
        </div>
      </div>
    </motion.div>
  );
};
