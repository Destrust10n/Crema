import React, { useEffect, useRef } from 'react';
import { ThemePreset } from '../types';

interface BackgroundEnvironmentProps {
  theme?: ThemePreset;
  enableParticles?: boolean;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  speedX: number;
  speedY: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export const BackgroundEnvironment: React.FC<BackgroundEnvironmentProps> = ({
  theme = 'espresso',
  enableParticles = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Pure base with distinctly unique ambient glows for each theme
  const getThemePalette = () => {
    switch (theme) {
      case 'obsidian':
        return {
          glow1: 'rgba(180, 195, 215, 0.22)',
          glow2: 'rgba(110, 125, 145, 0.18)',
          particleColor: 'rgba(240, 248, 255,',
        };
      case 'amber':
        return {
          glow1: 'rgba(245, 158, 11, 0.38)',
          glow2: 'rgba(217, 119, 6, 0.28)',
          particleColor: 'rgba(254, 243, 199,',
        };
      case 'mocha':
        return {
          glow1: 'rgba(219, 39, 119, 0.24)',
          glow2: 'rgba(157, 23, 77, 0.20)',
          particleColor: 'rgba(253, 232, 245,',
        };
      case 'espresso':
      default:
        return {
          glow1: 'rgba(180, 83, 9, 0.32)',
          glow2: 'rgba(120, 53, 15, 0.24)',
          particleColor: 'rgba(255, 237, 213,',
        };
    }
  };

  const palette = getThemePalette();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enableParticles) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particleCount = Math.min(Math.floor((width * height) / 22000), 75);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const z = 0.2 + Math.random() * 0.8;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        size: 0.8 + z * 1.2,
        alpha: 0.15 + Math.random() * 0.45,
        baseAlpha: 0.15 + Math.random() * 0.45,
        speedX: (Math.random() - 0.5) * 0.16 * z,
        speedY: -0.07 - Math.random() * 0.14 * z,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const parallaxX = mouseRef.current.x * 16;
      const parallaxY = mouseRef.current.y * 16;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.speedX;
        p.y += p.speedY;
        p.pulsePhase += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const dynamicAlpha = p.baseAlpha * (0.8 + Math.sin(p.pulsePhase) * 0.2);
        const drawX = p.x + parallaxX * p.z;
        const drawY = p.y + parallaxY * p.z;

        ctx.fillStyle = `${palette.particleColor} ${Math.max(0, Math.min(1, dynamicAlpha))})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enableParticles, theme]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none transition-colors duration-700"
      style={{ backgroundColor: 'var(--theme-canvas-bg, #080605)' }}
    >
      {/* 3D Atmospheric ambient light pools responding in real-time to active theme */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[68vw] h-[68vw] max-w-[850px] max-h-[850px] rounded-full blur-[160px] opacity-75 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle, ${palette.glow1} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />
      <div
        className="absolute top-[35%] right-[-10%] w-[58vw] h-[58vw] max-w-[750px] max-h-[750px] rounded-full blur-[170px] opacity-65 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle, ${palette.glow2} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[25%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full blur-[150px] opacity-50 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle, ${palette.glow1} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-black/80" />

      {/* Tiny floating particles canvas */}
      {enableParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-80"
        />
      )}
    </div>
  );
};
