import { Conversation } from '../types';
import { SITE_CONFIG } from '../config/site';

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Liquid Glass Optical Materiality',
    preview: 'Synthesizing the optical dispersion and warm amber refraction in UI...',
    createdAt: Date.now() - 1000 * 60 * 35, // 35 mins ago
    updatedAt: Date.now() - 1000 * 60 * 35,
    isPinned: true,
    category: 'Today',
    messages: [
      {
        id: 'msg-1-1',
        role: 'user',
        content: 'How do we design realistic liquid glass with warm amber refraction without slowing down the frame rate?',
        timestamp: '10:24 AM',
      },
      {
        id: 'msg-1-2',
        role: 'assistant',
        content: `To achieve genuine optical depth while maintaining a rock-solid 60 to 120 FPS, we decompose the glass physics into three GPU compositor-friendly layers:

1. **Backdrop Dispersion**: \`backdrop-filter: blur(28px) saturate(180%)\`. This softens background noise into a warm, creamy luminescence.
2. **Double Bevel Highlights**: An upper hairline border with \`rgba(255, 255, 255, 0.22)\` paired with a bottom border at \`rgba(255, 255, 255, 0.04)\`. This reflects an ambient ceiling light source.
3. **Warm Obsidian Core**: Tinting the surface with deep roasted cocoa and espresso (\`rgba(28, 18, 13, 0.55)\`) rather than pure gray.

This produces physical presence without costly raymarching overhead.`,
        timestamp: '10:25 AM',
        model: `${SITE_CONFIG.organizationName} Optical 2.5`,
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Distributed Event Mesh for Spatial Sync',
    preview: 'Designing sub-millisecond CRDT synchronization for multi-user canvases...',
    createdAt: Date.now() - 1000 * 60 * 180, // 3 hours ago
    updatedAt: Date.now() - 1000 * 60 * 180,
    isPinned: false,
    category: 'Today',
    messages: [
      {
        id: 'msg-2-1',
        role: 'user',
        content: 'What is the optimal consensus strategy for multi-user spatial canvas state sync across geographic edges?',
        timestamp: '8:40 AM',
      },
      {
        id: 'msg-2-2',
        role: 'assistant',
        content: `For geographic edge collaboration, state-based Conflict-Free Replicated Data Types (CRDTs) like Yjs or Automerge with delta-state mutations provide deterministic eventual consistency without centralized lock contention.

- **Ephemeral Transport**: Use WebRTC data channels for low-latency cursor tracking (<30ms).
- **Persistent Mesh**: Buffer vector clocks over durable WebSocket gateways with snapshot compaction.
- **Tension Management**: Prioritize local optimistic execution with micro-rollback vectors for zero perceptual lag.`,
        timestamp: '8:42 AM',
        model: `${SITE_CONFIG.organizationName} Core`,
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Cognitive Load Reduction in Executive Memos',
    preview: 'Framework for high-signal, zero-fluff strategic briefings...',
    createdAt: Date.now() - 1000 * 60 * 60 * 26, // Yesterday
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    isPinned: false,
    category: 'Yesterday',
    messages: [
      {
        id: 'msg-3-1',
        role: 'user',
        content: 'Draft a three-tier executive memo structure that eliminates corporate boilerplate.',
        timestamp: 'Yesterday at 3:15 PM',
      },
      {
        id: 'msg-3-2',
        role: 'assistant',
        content: `### High-Signal Executive Memo Architecture

1. **The Invariant Decision (1 sentence)**: The exact choice being made and the irreversible consequence if delayed.
2. **Asymmetric Evidence (3 bullet points)**:
   - Primary metric with timeframe and confidence interval.
   - Counterfactual opportunity cost.
   - Operational bottleneck.
3. **The Immediate Reversible Step**: The 48-hour pilot required to confirm the hypothesis.`,
        timestamp: 'Yesterday at 3:16 PM',
        model: `${SITE_CONFIG.organizationName} Strategic`,
      },
    ],
  },
  {
    id: 'conv-4',
    title: 'Topological Quantum Qubits & Braiding',
    preview: 'Exploring non-Abelian anyon exchanges in low-temperature semiconductors...',
    createdAt: Date.now() - 1000 * 60 * 60 * 96, // 4 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 96,
    isPinned: false,
    category: 'Previous 7 Days',
    messages: [
      {
        id: 'msg-4-1',
        role: 'user',
        content: 'Summarize how Majorana zero modes achieve non-local quantum state preservation.',
        timestamp: 'Oct 28',
      },
      {
        id: 'msg-4-2',
        role: 'assistant',
        content: `Majorana zero modes appear at the boundaries of topological superconductors. Because a single fermion state is split into two spatially separated zero modes, local noise cannot simultaneously perturb both ends. The information is stored non-locally, making it intrinsically immune to local decoherence.`,
        timestamp: 'Oct 28',
        model: `${SITE_CONFIG.organizationName} Science`,
      },
    ],
  },
];
