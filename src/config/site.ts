/**
 * Global Configuration for Aetheria Chat
 * Centralized settings including organization branding.
 */

const getSavedOrg = () => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('aetheria_org_name') : null;
  } catch {
    return null;
  }
};

const currentOrg = getSavedOrg() || 'Crema';

export const SITE_CONFIG = {
  // Project name matches organization name: Crema
  organizationName: currentOrg,
  productName: currentOrg,
  tagline: 'Your AI Study Buddy. Quizzes, Solvers, Plans & Deep Chat.',
  version: '3.0.0',
  description: 'Crema - AI Study-Buddy Workspace for quizzes, file/Drive summaries, photo question solving, study planner, exam tracking, flashcards, and streaming study chat.',
  storageKeyUser: 'crema_user_profile',
  storageKeyChats: 'crema_conversations',
  storageKeyPrefs: 'crema_preferences',
  storageKeyOrg: 'crema_org_name',
  storageKeyGuestToken: 'crema_guest_token',
} as const;

export function updateOrganizationName(newName: string) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crema_org_name', newName.trim());
      window.location.reload();
    }
  } catch {
    // Storage unavailable
  }
}

export const STARTER_PROMPTS = [
  {
    title: 'Generate Practice Quiz',
    prompt: 'Generate an interactive 5-question multiple choice quiz on Cellular Respiration with explanations.',
    category: 'Quiz',
  },
  {
    title: 'Study Planner Schedule',
    prompt: 'Help me build a 2-week study schedule for my upcoming Calculus final exam with 3 hours per day.',
    category: 'Planner',
  },
  {
    title: 'Summarize Study Material',
    prompt: 'Summarize the core concepts of Macroeconomic Monetary Policy and explain Keynesian vs Monetarist views.',
    category: 'Summary',
  },
  {
    title: 'Explain Like I am 5',
    prompt: 'Explain how Fourier Transforms work with an intuitive analogy that is easy to remember for an exam.',
    category: 'Conceptual',
  },
];
