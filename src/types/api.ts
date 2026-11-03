export type ProviderId = 'gemini' | 'openai' | 'groq' | 'openrouter' | 'ollama' | 'aetheria-local';

export type ErrorClassification =
  | 'CONFIGURATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'QUOTA_ERROR'
  | 'TEMPORARY_PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'MODEL_COMPATIBILITY_ERROR'
  | 'APPLICATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface ProviderCatalogItem {
  id: ProviderId;
  displayName: string;
  defaultModel: string;
  supportedModels: string[];
  isConfigured: boolean;
  circuitOpen: boolean;
}

export interface HealthCheckResult {
  providerId: ProviderId;
  model: string;
  status: 'operational' | 'degraded' | 'failed' | 'scope_restricted' | 'untested';
  latencyMs: number;
  message: string;
  errorClassification?: ErrorClassification;
  capabilities: {
    streaming: boolean;
    vision: boolean;
    systemInstruction: boolean;
    maxContextTokens?: number;
  };
  timestamp: number;
}

export interface GatewayTelemetryEvent {
  id: string;
  timestamp: number;
  provider: ProviderId;
  model: string;
  status: 'success' | 'fallback' | 'failed';
  latencyMs: number;
  tokensStreamed?: number;
  fallbackTo?: ProviderId;
  errorDetails?: string;
  errorClassification?: ErrorClassification;
}

export interface ModelLatencyMetric {
  model: string;
  avgLatencyMs: number;
  sampleCount: number;
  speedBadge: string;
  tier: 'instant' | 'standard' | 'deep';
  description: string;
}

export interface CustomProviderConfig {
  customKeys: Partial<Record<ProviderId, string>>;
  customEndpoints: Partial<Record<ProviderId, string>>;
  preferredProvider: ProviderId;
  preferredModel: Record<ProviderId, string>;
  fallbackOrder: ProviderId[];
  modelRouting?: 'auto' | 'manual';
}

export interface CacheStats {
  enabled: boolean;
  entriesCount: number;
  maxEntries: number;
  hits: number;
  misses: number;
  hitRatio: number;
  memoryUsageKb: number;
  ttlSeconds: number;
  recentEntries: Array<{
    hash: string;
    promptSnippet: string;
    model: string;
    provider: string;
    hits: number;
    ageSeconds: number;
  }>;
}

export interface BenchmarkItemResult {
  providerId: ProviderId;
  providerName: string;
  model: string;
  status: 'operational' | 'degraded' | 'failed' | 'unconfigured';
  ttftMs: number;
  totalTimeMs: number;
  tokensCount: number;
  tokensPerSec: number;
  snippet: string;
  error?: string;
}

export interface BenchmarkReport {
  timestamp: number;
  probePrompt: string;
  results: BenchmarkItemResult[];
  fastestProvider: string;
  lowestTtftMs: number;
}
