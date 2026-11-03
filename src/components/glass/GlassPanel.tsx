import React, { useRef, useState } from 'react';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'base' | 'elevated' | 'dock' | 'subtle';
  glowColor?: 'amber' | 'espresso' | 'obsidian' | 'none';
  hasBevel?: boolean;
  interactiveGlare?: boolean;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  variant = 'elevated',
  glowColor = 'none',
  hasBevel = true,
  interactiveGlare = false,
  className = '',
  ...props
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveGlare || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlarePos({ x, y });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'base':
        return 'liquid-glass-base';
      case 'dock':
        return 'liquid-glass-dock';
      case 'subtle':
        return 'bg-white/[0.03] backdrop-blur-md border border-white/[0.06] shadow-lg';
      case 'elevated':
      default:
        return 'liquid-glass-elevated';
    }
  };

  const getGlowStyles = () => {
    switch (glowColor) {
      case 'amber':
        return 'shadow-[0_24px_70px_rgba(245,158,11,0.06)] border-amber-500/15';
      case 'espresso':
        return 'shadow-[0_24px_70px_rgba(24,14,10,0.8)] border-[#3d271c]/30';
      case 'obsidian':
        return 'shadow-[0_24px_70px_rgba(0,0,0,0.9)] border-white/10';
      default:
        return '';
    }
  };

  return (
    <div
      ref={panelRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${getVariantStyles()} ${getGlowStyles()} ${
        hasBevel ? 'specular-bevel-top' : ''
      } ${className}`}
      {...props}
    >
      {/* Specular Interactive Cursor Glare */}
      {interactiveGlare && isHovered && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 opacity-100"
          style={{
            background: `radial-gradient(circle 260px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.12), transparent 70%)`,
          }}
        />
      )}

      {/* Subtle Upper Glass Gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent opacity-60"
      />

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
