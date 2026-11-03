import React from 'react';
import { playTactileSound } from '../../utils/audio';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'amber' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  soundEnabled?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  soundEnabled = true,
  icon,
  children,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    playTactileSound('click', soundEnabled);
    if (onClick) onClick(e);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs gap-1.5 rounded-full';
      case 'lg':
        return 'px-6 py-3 text-base gap-2.5 rounded-2xl';
      case 'md':
      default:
        return 'px-4 py-2 text-sm gap-2 rounded-xl';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-white text-black font-semibold hover:bg-neutral-200 active:scale-95 shadow-[0_4px_16px_rgba(255,255,255,0.2)]';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-semibold hover:from-amber-400 hover:to-amber-500 shadow-[0_6px_20px_rgba(245,158,11,0.3)] active:scale-95 border border-amber-300/30';
      case 'ghost':
        return 'bg-transparent text-white/70 hover:text-white hover:bg-white/[0.06] active:scale-95';
      case 'danger':
        return 'bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25 active:scale-95';
      case 'secondary':
      default:
        return 'glass-pill text-white/85 hover:text-white';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-sans transition-all duration-200 select-none cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none ${getSizeStyles()} ${getVariantStyles()} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
