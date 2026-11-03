import { SITE_CONFIG } from '../config/site';

interface MockResponseGeneratorOptions {
  userPrompt: string;
  userName: string;
  conversationTitle?: string;
  tone?: 'Deep Thought' | 'Creative' | 'Concise';
}

export function generateMockAiResponse(options: MockResponseGeneratorOptions): string {
  const { userPrompt, userName, tone = 'Deep Thought' } = options;
  const promptLower = userPrompt.toLowerCase().trim();

  // Tone modifiers
  if (tone === 'Concise') {
    if (promptLower.includes('hello') || promptLower.includes('hi')) {
      return `Hello ${userName}. All systems are optimal within ${SITE_CONFIG.organizationName}. How can I assist you right now?`;
    }
    if (promptLower.includes('code') || promptLower.includes('architecture')) {
      return `\`\`\`typescript
export const liquidGlass = {
  backdropFilter: 'blur(28px) saturate(180%)',
  background: 'rgba(24, 16, 11, 0.55)',
  borderTop: '1px solid rgba(255, 255, 255, 0.3)',
};
\`\`\`
**Summary:** Use high-blur backdrops with double-bevel highlights to simulate physical glass depth with zero render stalls.`;
    }
    return `**Direct Synthesis on "${userPrompt}":**
1. **Core Invariant:** Focus strictly on the primary leverage point.
2. **Execution Vector:** Eliminate secondary friction; test with a 24-hour prototype.
3. **Outcome:** Higher signal fidelity with minimum cognitive overhead.`;
  }

  if (tone === 'Creative') {
    if (promptLower.includes('hello') || promptLower.includes('hi')) {
      return `Welcome, ${userName}. Light refracts through dark obsidian, illuminating a quiet room where thoughts take shape. 

What vision or melody of ideas shall we sculpt into form today?`;
    }
    return `Beneath the surface of **"${userPrompt}"** lies a quiet architecture of meaning.

Imagine an interface not as cold glass and silicon, but as liquid light suspended in stillness—where every question sends subtle ripples across a dark lake of memory.

> *"Simplicity is not the absence of clutter, that's too simple a consequence of it. Simplicity is somehow essentially describing the purpose and place of an object and product."*

We stand at the intersection of computational rigor and poetic stillness. Where shall our exploration travel next, ${userName}?`;
  }

  // Default: Deep Thought
  if (promptLower.includes('hello') || promptLower.includes('hi') || promptLower.includes('hey')) {
    return `Greetings, ${userName}. It is an honor to converse with you within ${SITE_CONFIG.organizationName} Chat.

I am configured with our proprietary neural reflection architecture—calibrated for precision, clarity, and deep contextual reasoning.

How may I assist your inquiries today? Whether you are drafting technical architectures, deconstructing philosophical treatises, or exploring creative horizons, I am at your command.`;
  }

  if (promptLower.includes('who are you') || promptLower.includes('what are you') || promptLower.includes('tell me about')) {
    return `${SITE_CONFIG.organizationName} Chat is a bespoke synthesis engine built upon the tenets of quiet computing, high-density reasoning, and physical optical fidelity.

### Core Capabilities
- **Non-destructive Reasoning**: Multistep analytical decomposition without synthetic distortion.
- **Physical Optical Interface**: Floating liquid-glass surface with sub-pixel depth mapping and warm amber luminance.
- **Absolute Privacy**: Zero external telemetric leakage. All states reside within your local cognitive session.

What domain would you like to investigate?`;
  }

  if (promptLower.includes('code') || promptLower.includes('react') || promptLower.includes('typescript') || promptLower.includes('architecture')) {
    return `Here is a high-order architectural implementation of our liquid-glass optical layer in TypeScript and modern React:

\`\`\`typescript
interface LiquidGlassSurfaceProps {
  blurRadius: number; // 24px - 40px
  amberTint: string;  // rgba(34, 21, 14, 0.42)
  specularAngle: number;
}

export const createLiquidGlassMesh = ({
  blurRadius,
  amberTint,
  specularAngle,
}: LiquidGlassSurfaceProps) => {
  return {
    backdropFilter: \`blur(\${blurRadius}px) saturate(180%)\`,
    background: \`radial-gradient(circle at \${specularAngle}% 0%, rgba(255,255,255,0.08), \${amberTint})\`,
    borderTop: '1px solid rgba(255, 255, 255, 0.22)',
    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 24px 64px rgba(0, 0, 0, 0.55)',
  };
};
\`\`\`

### Architectural Observations:
1. **Double-layer Specular Refraction**: By layering an inset white rim light along the upper edge, we mimic physical crystal density.
2. **Dynamic Amber Dispersion**: Warm undertones eliminate the cold clinical blue cast typical of generic software, harmonizing with human circadian rhythms.`;
  }

  if (promptLower.includes('quantum') || promptLower.includes('physics') || promptLower.includes('science')) {
    return `### Quantum Entanglement & Coherence Invariance

In quantum information theory, quantum coherence is the foundational condition allowing superposition states $|\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ to persist without premature phase collapse.

1. **Phase Decoherence ($T_2$)**: Environmental interaction imparts stochastic phase shifts, deteriorating off-diagonal elements in the density matrix $\\rho$.
2. **Topological Protection**: By encoding state non-locally across braided Majorana zero modes, modern topological qubits isolate quantum information from local thermal fluctuations.

> *"Nature isn't classical, dammit, and if you want to make a simulation of nature, you'd better make it quantum mechanical."* — Richard Feynman

In ${SITE_CONFIG.organizationName}'s computational modeling, we treat context vectors with analogous coherence preservation, ensuring ideas do not decohere over extended dialogues.`;
  }

  if (promptLower.includes('philosophy') || promptLower.includes('design') || promptLower.includes('apple') || promptLower.includes('dieter')) {
    return `### The Triad of Industrial Harmony

The union of Dieter Rams' *Ten Principles*, Jony Ive's visceral materiality, and the liquid-glass interface philosophy forms a unified doctrine:

- **Less, But Better (*Weniger, aber besser*)**: Every bevel and specular gradient serves to ground the user's focus, never to distract.
- **Physical Honesty**: When glass catches light, it reflects its physical environment. Our warm brown palette grounds the screen in earthy, tactile reality rather than an endless cold void.
- **Quiet Dignity**: A tool should remain invisible until invoked. The blank white opening transition serves as a silent breath—a palette cleanser before deep concentration.

As ${userName}, your dialogue here exists within this sanctuary of intentional stillness.`;
  }

  // General sophisticated fallback response
  return `I have parsed your synthesis request: **"${userPrompt}"**.

### Synthesis & Strategic Evaluation
1. **Core Principle**:
   When structuring this inquiry, we must identify the underlying invariants. The most potent solutions arise not from superficial additions, but from isolating the critical constraint.

2. **Actionable Trajectory**:
   - First, establish foundational baseline criteria.
   - Second, reduce extraneous complexity until only the irreducible signal remains.
   - Third, iterate with rapid, measured validation loops.

3. **Inquiry Extension**:
   Would you like me to formalize this into a structured implementation roadmap, or shall we drill down into specific mathematical, algorithmic, or strategic components?`;
}
