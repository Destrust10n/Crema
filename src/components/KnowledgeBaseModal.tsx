import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Upload,
  FileJson,
  Check,
  Trash2,
  Search,
  Sparkles,
  X,
  Code2,
  Copy,
  Layers,
  Info,
} from 'lucide-react';
import { playTactileSound } from '../utils/audio';

export interface GroundedDataset {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  byteSize: string;
  updatedAt: number;
  data: unknown;
}

const STORAGE_KEY_GROUNDED_DATA = 'aetheria_grounded_knowledge_v1';

// Default starter knowledge bases for competition demo
const SAMPLE_DATASETS: GroundedDataset[] = [
  {
    id: 'sample-tech-spec',
    name: 'Aetheria Systems & Hardware Matrix',
    description: 'Scraped technical specifications for neural engines, optical liquid-glass matrices, and latency profiles.',
    itemCount: 8,
    byteSize: '14.2 KB',
    updatedAt: Date.now() - 3600000,
    data: {
      platform: 'Aetheria Neural Core v3',
      architecture: 'Asymmetric Multi-Engine Cognitive Mesh',
      engines: [
        {
          id: 'gemini-flash',
          name: 'Google Gemini 2.5 Flash',
          ttft_ms: 180,
          max_context: '1,048,576 tokens',
          grounding_support: true,
          capabilities: ['multimodal', 'streaming', 'code-synthesis'],
        },
        {
          id: 'liquid-glass-v2',
          name: 'Liquid Glass Specular Pipeline',
          blur_intensity: '40px Gaussian saturate(200%)',
          chromatic_aberration: '0.12px physical refraction',
          fps_target: 120,
        },
      ],
      benchmarks: {
        reasoning_score: '96.4%',
        zero_shot_accuracy: '94.8%',
        streaming_latency_avg: '14ms/token',
      },
    },
  },
  {
    id: 'sample-customer-faq',
    name: 'Knowledge Base: Autonomous Intelligence FAQ',
    description: 'Scraped knowledge articles, product invariants, and customer resolution guidelines.',
    itemCount: 12,
    byteSize: '9.8 KB',
    updatedAt: Date.now() - 7200000,
    data: {
      faq_entries: [
        {
          question: 'What is AETHERIA?',
          answer: 'AETHERIA is an Apple-inspired cognitive synthesis engine built with liquid-glass optics and multi-provider grounding.',
        },
        {
          question: 'How does dataset grounding work?',
          answer: 'Any scraped JSON or text dataset uploaded into the Knowledge Studio is directly injected into the LLM context window for factual citation.',
        },
        {
          question: 'Is my data secure?',
          answer: 'Yes, datasets remain inside your local cognitive session with zero external telemetric leakage.',
        },
      ],
    },
  },
];

export function loadGroundedData(): GroundedDataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GROUNDED_DATA);
    if (!raw) return SAMPLE_DATASETS[0];
    return JSON.parse(raw);
  } catch {
    return SAMPLE_DATASETS[0];
  }
}

export function saveGroundedData(dataset: GroundedDataset | null): void {
  try {
    if (dataset) {
      localStorage.setItem(STORAGE_KEY_GROUNDED_DATA, JSON.stringify(dataset));
    } else {
      localStorage.removeItem(STORAGE_KEY_GROUNDED_DATA);
    }
  } catch {
    // Storage unavailable
  }
}

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  activeDataset: GroundedDataset | null;
  onSelectDataset: (dataset: GroundedDataset | null) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  activeDataset,
  onSelectDataset,
}) => {
  const [datasets, setDatasets] = useState<GroundedDataset[]>(SAMPLE_DATASETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [datasetName, setDatasetName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<GroundedDataset | null>(activeDataset || SAMPLE_DATASETS[0]);
  const [mobileTab, setMobileTab] = useState<'datasets' | 'preview'>('datasets');

  useEffect(() => {
    if (activeDataset) {
      setSelectedPreview(activeDataset);
    }
  }, [activeDataset]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playTactileSound('click', soundEnabled);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const sizeStr = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

        const newDataset: GroundedDataset = {
          id: `dataset-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          description: `Custom uploaded scraped dataset (${file.name})`,
          itemCount: Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length,
          byteSize: sizeStr,
          updatedAt: Date.now(),
          data: parsed,
        };

        setDatasets((prev) => [newDataset, ...prev]);
        setSelectedPreview(newDataset);
        onSelectDataset(newDataset);
        saveGroundedData(newDataset);
        setIsUploading(false);
        setUploadError(null);
        playTactileSound('receive', soundEnabled);
      } catch (err) {
        setUploadError(`Invalid JSON file format: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualJsonSubmit = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      const byteSize = `${Math.round(new Blob([jsonInput]).size / 1024)} KB`;
      const name = datasetName.trim() || `Dataset ${datasets.length + 1}`;

      const newDataset: GroundedDataset = {
        id: `dataset-${Date.now()}`,
        name,
        description: 'Pasted scraped data / custom knowledge base',
        itemCount: Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length,
        byteSize,
        updatedAt: Date.now(),
        data: parsed,
      };

      setDatasets((prev) => [newDataset, ...prev]);
      setSelectedPreview(newDataset);
      onSelectDataset(newDataset);
      saveGroundedData(newDataset);
      setJsonInput('');
      setDatasetName('');
      setIsUploading(false);
      setUploadError(null);
      playTactileSound('receive', soundEnabled);
    } catch (err) {
      setUploadError(`JSON parse error: ${(err as Error).message}`);
    }
  };

  const handleCopyPreview = () => {
    if (!selectedPreview) return;
    playTactileSound('click', soundEnabled);
    navigator.clipboard.writeText(JSON.stringify(selectedPreview.data, null, 2));
    setCopiedId(selectedPreview.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    playTactileSound('click', soundEnabled);
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    if (activeDataset?.id === id) {
      onSelectDataset(null);
      saveGroundedData(null);
    }
    if (selectedPreview?.id === id) {
      setSelectedPreview(datasets.find((d) => d.id !== id) || null);
    }
  };

  const filtered = datasets.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            playTactileSound('click', soundEnabled);
            onClose();
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-5xl h-[88vh] max-h-[780px] rounded-3xl overflow-hidden flex flex-col shadow-2xl border"
          style={{
            background: 'var(--theme-surface-modal, #0d0806)',
            borderColor: 'var(--theme-border-ambient, rgba(255,255,255,0.12))',
            boxShadow: '0 32px 100px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.15)',
          }}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md"
                style={{
                  background: 'var(--theme-accent-soft-glow)',
                  border: '1px solid var(--theme-border-specular)',
                  color: 'var(--theme-accent-primary)',
                }}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                  <span>Grounded Knowledge Studio</span>
                  <span
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: 'var(--theme-accent-soft-glow)',
                      color: 'var(--theme-accent-primary)',
                      border: '1px solid var(--theme-border-ambient)',
                    }}
                  >
                    Scraped Data Injection
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  Connect scraped datasets, product inventories, or research documents to ground AI responses with real facts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEnabled);
                onClose();
              }}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden items-center border-b border-white/[0.08] bg-black/40 px-4 py-2 shrink-0">
            <div className="flex w-full rounded-xl bg-white/[0.05] p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  playTactileSound('click', soundEnabled);
                  setMobileTab('datasets');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mobileTab === 'datasets'
                    ? 'bg-amber-400 text-black shadow-sm font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Datasets ({datasets.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  playTactileSound('click', soundEnabled);
                  setMobileTab('preview');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mobileTab === 'preview'
                    ? 'bg-amber-400 text-black shadow-sm font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                JSON Inspector {selectedPreview ? `(${selectedPreview.byteSize})` : ''}
              </button>
            </div>
          </div>

          {/* Main Grid Content */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left Column: Datasets List (5 cols) */}
            <div className={`md:col-span-5 border-r border-white/[0.08] flex flex-col h-full overflow-hidden bg-black/20 ${
              mobileTab === 'datasets' ? 'flex' : 'hidden md:flex'
            }`}>
              {/* Search & Actions Bar */}
              <div className="p-4 border-b border-white/[0.06] flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search datasets..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-amber-400/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playTactileSound('click', soundEnabled);
                    setIsUploading(!isUploading);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-transform active:scale-95"
                  style={{
                    background: 'var(--theme-btn-primary-bg)',
                    color: 'var(--theme-btn-primary-text)',
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Close' : 'Import'}</span>
                </button>
              </div>

              {/* Upload Panel if Active */}
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 border-b border-white/[0.08] bg-white/[0.03] space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">Upload Scraped Data</span>
                      <label className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Select .JSON file</span>
                        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      placeholder="Dataset Name (e.g. Scraped Product Catalog)"
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    />

                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='Paste raw JSON here: [{"id": 1, "title": "Scraped item"}, ...]'
                      rows={3}
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl p-2.5 text-[11px] font-mono text-white/90 outline-none resize-none"
                    />

                    {uploadError && (
                      <p className="text-[11px] text-red-400 leading-tight">{uploadError}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleManualJsonSubmit}
                      disabled={!jsonInput.trim()}
                      className="w-full py-1.5 rounded-xl text-xs font-medium text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Save & Activate Grounding
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dataset Cards List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filtered.map((item) => {
                  const isActive = activeDataset?.id === item.id;
                  const isSelected = selectedPreview?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        playTactileSound('click', soundEnabled);
                        setSelectedPreview(item);
                        setMobileTab('preview');
                      }}
                      className={`group p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-amber-400/50 bg-white/[0.08]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
                          <h4 className="text-xs font-semibold text-white/95 truncate">{item.name}</h4>
                        </div>

                        {isActive ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0 font-medium">
                            <Check className="w-2.5 h-2.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTactileSound('toggle', soundEnabled);
                              onSelectDataset(item);
                              saveGroundedData(item);
                            }}
                            className="text-[10px] text-white/50 hover:text-white px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors shrink-0"
                          >
                            Activate
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04] text-[10px] font-mono text-white/40">
                        <span>{item.itemCount} entries · {item.byteSize}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            title="Delete dataset"
                            className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="text-center py-10 text-white/40 text-xs">
                    No datasets found. Import your scraped JSON dataset above.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Data Inspector (7 cols) */}
            <div className={`md:col-span-7 flex flex-col h-full overflow-hidden bg-black/40 ${
              mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
            }`}>
              {selectedPreview ? (
                <>
                  <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-white/[0.01]">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono text-white/90 font-medium">
                        {selectedPreview.name}.json
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">
                        ({selectedPreview.byteSize})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyPreview}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs text-white/80 transition-colors cursor-pointer"
                      >
                        {copiedId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[11px]">Copy JSON</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playTactileSound('toggle', soundEnabled);
                          const nextState = activeDataset?.id === selectedPreview.id ? null : selectedPreview;
                          onSelectDataset(nextState);
                          saveGroundedData(nextState);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                          activeDataset?.id === selectedPreview.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-400 text-black hover:bg-amber-300'
                        }`}
                      >
                        {activeDataset?.id === selectedPreview.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Grounded (Active)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Set as Active Grounding</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Schema Preview */}
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-white/80 leading-relaxed bg-[#060403] select-text">
                    <pre className="whitespace-pre-wrap break-all">
                      <code>{JSON.stringify(selectedPreview.data, null, 2)}</code>
                    </pre>
                  </div>

                  {/* Footer Grounding Banner */}
                  <div className="px-6 py-2.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {activeDataset?.id === selectedPreview.id
                          ? 'This dataset is currently active. Every prompt will be grounded against this data.'
                          : 'Dataset ready. Click "Set as Active Grounding" to enable model citation.'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/40 text-xs gap-2">
                  <Database className="w-8 h-8 opacity-40 text-amber-400" />
                  <span>Select or upload a dataset to preview schema</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
