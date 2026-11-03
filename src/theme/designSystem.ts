/**
 * Aetheria Design System — Central Theme Token Engine
 * Supreme Theme Color Consistency for all 4 Luxury Themes:
 * 1. Warm Espresso
 * 2. Obsidian Noir
 * 3. Amber Cognac
 * 4. Velvet Mocha
 */

import { ThemePreset } from '../types';

export interface ThemePalette {
  id: ThemePreset;
  name: string;
  tagline: string;
  description: string;
  swatches: {
    canvas: string;
    surface: string;
    accent: string;
    specular: string;
  };
  colors: {
    canvasBg: string;
    surfaceBase: string;
    surfaceElevated: string;
    surfaceDock: string;
    surfaceSidebar: string;
    surfaceAssistant: string;
    surfaceUser: string;
    surfaceCode: string;
    surfacePopover: string;
    
    borderAmbient: string;
    borderSpecular: string;
    borderFocus: string;
    
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textAccent: string;
    
    accentPrimary: string;
    accentSecondary: string;
    accentGlow: string;
    accentSoftGlow: string;
    
    btnPrimaryBg: string;
    btnPrimaryText: string;
    btnPrimaryHover: string;
    
    glassRadial: string;
    glassMultiply: string;
    shadowAmbient: string;
  };
}

export const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  espresso: {
    id: 'espresso',
    name: 'Warm Espresso',
    tagline: 'Warm roasted coffee & golden caramel',
    description: 'Deep espresso tones, rich mocha surfaces, soft cream typography, and subtle caramel glass reflections.',
    swatches: {
      canvas: '#0a0604',
      surface: '#180f0a',
      accent: '#f59e0b',
      specular: '#ffe5cc',
    },
    colors: {
      canvasBg: '#0a0604',
      surfaceBase: 'rgba(20, 13, 9, 0.78)',
      surfaceElevated: 'rgba(28, 18, 12, 0.86)',
      surfaceDock: 'rgba(24, 15, 10, 0.90)',
      surfaceSidebar: 'linear-gradient(180deg, rgba(24, 15, 10, 0.95) 0%, rgba(18, 11, 7, 0.97) 60%, rgba(10, 6, 4, 0.99) 100%)',
      surfaceAssistant: 'linear-gradient(180deg, rgba(28, 18, 12, 0.82) 0%, rgba(20, 13, 9, 0.88) 60%, rgba(14, 9, 6, 0.94) 100%)',
      surfaceUser: 'linear-gradient(135deg, rgba(46, 28, 18, 0.92) 0%, rgba(32, 19, 12, 0.95) 100%)',
      surfaceCode: 'rgba(14, 9, 6, 0.96)',
      surfacePopover: 'rgba(26, 17, 11, 0.96)',
      
      borderAmbient: 'rgba(245, 220, 195, 0.12)',
      borderSpecular: 'rgba(255, 235, 215, 0.28)',
      borderFocus: 'rgba(245, 158, 11, 0.60)',
      
      textPrimary: '#faf6f0',
      textSecondary: 'rgba(250, 246, 240, 0.72)',
      textMuted: 'rgba(250, 246, 240, 0.44)',
      textAccent: '#fbbf24',
      
      accentPrimary: '#f59e0b',
      accentSecondary: '#fbbf24',
      accentGlow: 'rgba(245, 158, 11, 0.28)',
      accentSoftGlow: 'rgba(245, 158, 11, 0.10)',
      
      btnPrimaryBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      btnPrimaryText: '#180a02',
      btnPrimaryHover: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      
      glassRadial: 'rgba(255, 220, 180, 0.09)',
      glassMultiply: 'rgba(42, 26, 17, 0.80)',
      shadowAmbient: 'rgba(0, 0, 0, 0.85)',
    },
  },

  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Noir',
    tagline: 'Deep obsidian black & cool platinum',
    description: 'Minimal charcoal graphite surfaces, crisp silver metallic highlights, and sleek futuristic reflections without neon noise.',
    swatches: {
      canvas: '#050506',
      surface: '#121216',
      accent: '#e2e8f0',
      specular: '#ffffff',
    },
    colors: {
      canvasBg: '#050506',
      surfaceBase: 'rgba(14, 14, 18, 0.80)',
      surfaceElevated: 'rgba(22, 22, 28, 0.86)',
      surfaceDock: 'rgba(18, 18, 24, 0.92)',
      surfaceSidebar: 'linear-gradient(180deg, rgba(16, 16, 22, 0.96) 0%, rgba(12, 12, 16, 0.98) 60%, rgba(6, 6, 8, 1) 100%)',
      surfaceAssistant: 'linear-gradient(180deg, rgba(22, 22, 28, 0.82) 0%, rgba(16, 16, 20, 0.88) 60%, rgba(10, 10, 14, 0.95) 100%)',
      surfaceUser: 'linear-gradient(135deg, rgba(38, 38, 48, 0.94) 0%, rgba(26, 26, 34, 0.96) 100%)',
      surfaceCode: 'rgba(10, 10, 13, 0.96)',
      surfacePopover: 'rgba(24, 24, 30, 0.96)',
      
      borderAmbient: 'rgba(255, 255, 255, 0.10)',
      borderSpecular: 'rgba(255, 255, 255, 0.32)',
      borderFocus: 'rgba(226, 232, 240, 0.65)',
      
      textPrimary: '#f8fafc',
      textSecondary: 'rgba(241, 245, 249, 0.74)',
      textMuted: 'rgba(203, 213, 225, 0.45)',
      textAccent: '#e2e8f0',
      
      accentPrimary: '#e2e8f0',
      accentSecondary: '#cbd5e1',
      accentGlow: 'rgba(226, 232, 240, 0.22)',
      accentSoftGlow: 'rgba(226, 232, 240, 0.08)',
      
      btnPrimaryBg: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
      btnPrimaryText: '#0a0a0d',
      btnPrimaryHover: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
      
      glassRadial: 'rgba(255, 255, 255, 0.07)',
      glassMultiply: 'rgba(18, 18, 24, 0.85)',
      shadowAmbient: 'rgba(0, 0, 0, 0.92)',
    },
  },

  amber: {
    id: 'amber',
    name: 'Amber Cognac',
    tagline: 'Rich cognac brown & burnished gold',
    description: 'Dark caramel glass, radiant amber highlights, soft ivory typography, and opulent golden reflections.',
    swatches: {
      canvas: '#0c0703',
      surface: '#221307',
      accent: '#fbbf24',
      specular: '#fef3c7',
    },
    colors: {
      canvasBg: '#0c0703',
      surfaceBase: 'rgba(28, 15, 6, 0.80)',
      surfaceElevated: 'rgba(38, 20, 8, 0.88)',
      surfaceDock: 'rgba(32, 17, 7, 0.92)',
      surfaceSidebar: 'linear-gradient(180deg, rgba(32, 17, 7, 0.96) 0%, rgba(22, 11, 4, 0.98) 60%, rgba(12, 6, 2, 1) 100%)',
      surfaceAssistant: 'linear-gradient(180deg, rgba(40, 21, 9, 0.84) 0%, rgba(28, 15, 6, 0.90) 60%, rgba(18, 9, 3, 0.95) 100%)',
      surfaceUser: 'linear-gradient(135deg, rgba(64, 34, 12, 0.94) 0%, rgba(44, 22, 7, 0.96) 100%)',
      surfaceCode: 'rgba(16, 8, 3, 0.96)',
      surfacePopover: 'rgba(36, 19, 8, 0.96)',
      
      borderAmbient: 'rgba(251, 191, 36, 0.16)',
      borderSpecular: 'rgba(253, 230, 138, 0.38)',
      borderFocus: 'rgba(251, 191, 36, 0.70)',
      
      textPrimary: '#fffbeb',
      textSecondary: 'rgba(254, 243, 199, 0.76)',
      textMuted: 'rgba(253, 230, 138, 0.46)',
      textAccent: '#f59e0b',
      
      accentPrimary: '#f59e0b',
      accentSecondary: '#fbbf24',
      accentGlow: 'rgba(245, 158, 11, 0.38)',
      accentSoftGlow: 'rgba(245, 158, 11, 0.14)',
      
      btnPrimaryBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
      btnPrimaryText: '#180a02',
      btnPrimaryHover: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
      
      glassRadial: 'rgba(251, 191, 36, 0.11)',
      glassMultiply: 'rgba(54, 26, 8, 0.82)',
      shadowAmbient: 'rgba(0, 0, 0, 0.90)',
    },
  },

  mocha: {
    id: 'mocha',
    name: 'Velvet Mocha',
    tagline: 'Deep velvet plum & dusty rose cocoa',
    description: 'Muted burgundy undertones, rich cocoa surfaces, soft dusty rose specular highlights, and warm champagne accents.',
    swatches: {
      canvas: '#0a0609',
      surface: '#1c101a',
      accent: '#f472b6',
      specular: '#fce7f3',
    },
    colors: {
      canvasBg: '#0a0609',
      surfaceBase: 'rgba(24, 14, 22, 0.80)',
      surfaceElevated: 'rgba(34, 20, 30, 0.88)',
      surfaceDock: 'rgba(30, 17, 26, 0.92)',
      surfaceSidebar: 'linear-gradient(180deg, rgba(28, 16, 25, 0.96) 0%, rgba(20, 11, 18, 0.98) 60%, rgba(10, 5, 9, 1) 100%)',
      surfaceAssistant: 'linear-gradient(180deg, rgba(36, 21, 32, 0.84) 0%, rgba(26, 14, 23, 0.90) 60%, rgba(16, 8, 14, 0.95) 100%)',
      surfaceUser: 'linear-gradient(135deg, rgba(58, 29, 49, 0.94) 0%, rgba(40, 20, 34, 0.96) 100%)',
      surfaceCode: 'rgba(15, 8, 13, 0.96)',
      surfacePopover: 'rgba(32, 18, 28, 0.96)',
      
      borderAmbient: 'rgba(244, 114, 182, 0.15)',
      borderSpecular: 'rgba(253, 226, 243, 0.32)',
      borderFocus: 'rgba(244, 114, 182, 0.65)',
      
      textPrimary: '#fdf2f8',
      textSecondary: 'rgba(252, 231, 243, 0.74)',
      textMuted: 'rgba(244, 114, 182, 0.44)',
      textAccent: '#f472b6',
      
      accentPrimary: '#f472b6',
      accentSecondary: '#fb7185',
      accentGlow: 'rgba(244, 114, 182, 0.30)',
      accentSoftGlow: 'rgba(244, 114, 182, 0.10)',
      
      btnPrimaryBg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      btnPrimaryText: '#ffffff',
      btnPrimaryHover: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
      
      glassRadial: 'rgba(244, 114, 182, 0.09)',
      glassMultiply: 'rgba(48, 20, 38, 0.84)',
      shadowAmbient: 'rgba(0, 0, 0, 0.88)',
    },
  },
};

export const getThemePalette = (theme: ThemePreset): ThemePalette => {
  return THEME_PALETTES[theme] || THEME_PALETTES.espresso;
};

export const AETHERIA_TOKENS = {
  typography: {
    fontSans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    fontMono: "'JetBrains Mono', 'SF Mono', Menlo, Monaco, Consolas, monospace",
  },
} as const;
