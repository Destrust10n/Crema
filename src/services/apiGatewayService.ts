import {
  CustomProviderConfig,
  HealthCheckResult,
  ProviderCatalogItem,
  GatewayTelemetryEvent,
  ProviderId,
} from '../types/api';

const STORAGE_KEY_API_CONFIG = 'aetheria_provider_config_v2';

const DEFAULT_CONFIG: CustomProviderConfig = {
  customKeys: {},
  customEndpoints: {
    ollama: 'http://127.0.0.1:11434',
  },
  preferredProvider: 'gemini',
  preferredModel: {
    gemini: 'gemini-flash-latest',
    groq: 'llama-3.3-70b-versatile',
    openai: 'gpt-4o-mini',
    openrouter: 'meta-llama/llama-3.3-70b-instruct',
    ollama: 'llama3.2',
    'aetheria-local': 'aetheria-optical-2.5',
  },
  modelRouting: 'auto',
  fallbackOrder: ['gemini', 'groq', 'openai', 'openrouter', 'ollama'],
};

export function loadProviderConfig(): CustomProviderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_API_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      customKeys: parsed.customKeys || {},
      customEndpoints: { ...DEFAULT_CONFIG.customEndpoints, ...parsed.customEndpoints },
      preferredModel: { ...DEFAULT_CONFIG.preferredModel, ...parsed.preferredModel },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveProviderConfig(config: CustomProviderConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_API_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save provider config:', err);
  }
}

export async function fetchProvidersCatalog(config: CustomProviderConfig): Promise<ProviderCatalogItem[]> {
  try {
    const res = await fetch('/api/providers', {
      headers: {
        'x-custom-keys': JSON.stringify(config.customKeys),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.providers || [];
  } catch (err) {
    console.warn('Failed to fetch catalog from gateway, using fallback static catalog:', err);
    return [
      {
        id: 'gemini',
        displayName: 'Google Gemini',
        defaultModel: 'gemini-flash-latest',
        supportedModels: ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
        isConfigured: true,
        circuitOpen: false,
      },
      {
        id: 'groq',
        displayName: 'Groq Cloud (LPU)',
        defaultModel: 'llama-3.3-70b-versatile',
        supportedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        isConfigured: Boolean(config.customKeys.groq),
        circuitOpen: false,
      },
      {
        id: 'openai',
        displayName: 'OpenAI',
        defaultModel: 'gpt-4o-mini',
        supportedModels: ['gpt-4o', 'gpt-4o-mini'],
        isConfigured: Boolean(config.customKeys.openai),
        circuitOpen: false,
      },
      {
        id: 'ollama',
        displayName: 'Local Ollama',
        defaultModel: 'llama3.2',
        supportedModels: ['llama3.2', 'deepseek-r1'],
        isConfigured: true,
        circuitOpen: false,
      },
    ];
  }
}

export async function testProviderConnection(
  providerId: ProviderId,
  config: CustomProviderConfig,
  modelOverride?: string
): Promise<HealthCheckResult> {
  const customKey = config.customKeys[providerId];
  const customEndpoint = config.customEndpoints[providerId];
  const model = modelOverride || config.preferredModel[providerId];

  try {
    const res = await fetch('/api/providers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        customKey,
        customEndpoint,
        model,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data.result;
  } catch (err) {
    return {
      providerId,
      model: model || 'default',
      status: 'failed',
      latencyMs: 0,
      message: (err as Error).message || 'Connection test failed',
      capabilities: { streaming: false, vision: false, systemInstruction: false },
      timestamp: Date.now(),
    };
  }
}

export async function fetchGatewayTelemetry(): Promise<GatewayTelemetryEvent[]> {
  try {
    const res = await fetch('/api/providers/telemetry');
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}

export async function fetchGeminiModelProfiles(): Promise<Record<string, import('../types/api').ModelLatencyMetric>> {
  try {
    const res = await fetch('/api/providers/gemini/models');
    if (!res.ok) return {};
    const data = await res.json();
    return data.models || {};
  } catch {
    return {};
  }
}

export async function fetchCacheStats(): Promise<import('../types/api').CacheStats | null> {
  try {
    const res = await fetch('/api/gateway/cache');
    if (!res.ok) return null;
    const data = await res.json();
    return data.cache || null;
  } catch {
    return null;
  }
}

export async function clearGatewayCache(): Promise<import('../types/api').CacheStats | null> {
  try {
    const res = await fetch('/api/gateway/cache/clear', { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.cache || null;
  } catch {
    return null;
  }
}

export async function runSpeedBenchmark(
  config: CustomProviderConfig
): Promise<import('../types/api').BenchmarkReport | null> {
  try {
    const res = await fetch('/api/gateway/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customKeys: config.customKeys }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.report || null;
  } catch {
    return null;
  }
}
