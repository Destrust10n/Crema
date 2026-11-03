import React from 'react';

export interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'amber' | 'emerald' | 'subtle';
  icon?: React.ReactNode;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'neutral',
  icon,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'amber':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-300';
      case 'emerald':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300';
      case 'subtle':
        return 'bg-white/[0.03] border-white/[0.06] text-white/50';
      case 'neutral':
      default:
        return 'bg-white/[0.06] border-white/[0.12] text-white/80';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide border backdrop-blur-md transition-colors ${getVariantStyles()} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
