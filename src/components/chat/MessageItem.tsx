import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Terminal,
  ExternalLink,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { ChatMessage, UserPreferences } from '../../types';
import { SITE_CONFIG } from '../../config/site';
import { playTactileSound, speakText, stopSpeech } from '../../utils/audio';
import { animateMessageEntrance } from '../../animations/gsapAnimations';

interface MessageItemProps {
  message: ChatMessage;
  userName: string;
  preferences: UserPreferences;
  isStreaming?: boolean;
  onOpenArtifact?: (artifact: { title: string; language: string; content: string }) => void;
}

const MessageItemComponent: React.FC<MessageItemProps> = ({
  message,
  userName,
  preferences,
  isStreaming = false,
  onOpenArtifact,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null);

  const messageRef = useRef<HTMLDivElement>(null);

  // Memoize rendered markdown to avoid AST re-parsing during rapid parent re-renders
  const renderedContent = React.useMemo(() => {
    return renderMarkdown(message.content, preferences.soundEffects, onOpenArtifact);
  }, [message.content, preferences.soundEffects, onOpenArtifact]);

  // GSAP Smooth Entrance Animation
  useGSAP(
    () => {
      if (messageRef.current) {
        animateMessageEntrance(messageRef.current, { isUser });
      }
    },
    { scope: messageRef, dependencies: [message.id] }
  );

  // Copy assistant response
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTactileSound('click', preferences.soundEffects);
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text to Speech
  const handleSpeechToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
    } else {
      playTactileSound('click', preferences.soundEffects);
      setSpeaking(true);
      speakText(message.content, () => setSpeaking(false));
    }
  };

  const handleReaction = (type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    playTactileSound('click', preferences.soundEffects);
    setReaction((prev) => (prev === type ? null : type));
  };

  useEffect(() => {
    return () => {
      if (speaking) {
        stopSpeech();
      }
    };
  }, [speaking]);

  return (
    <div
      ref={messageRef}
      className={`flex flex-col w-full my-3 ${isUser ? 'items-end' : 'items-start'}`}
      style={{
        contentVisibility: isStreaming ? 'visible' : 'auto',
        containIntrinsicSize: isUser ? '0 52px' : '0 120px',
      }}
    >
      {/* Sender & Timestamp Metadata */}
      <div className="flex items-center gap-2 mb-1.5 px-2 text-[11px] font-mono text-white/40">
        <span className="font-medium text-white/60">
          {isUser ? userName : SITE_CONFIG.organizationName}
        </span>
        <span aria-hidden="true" className="text-white/20">·</span>
        <span>{message.timestamp}</span>
        {!isUser && message.model && (
          <>
            <span aria-hidden="true" className="text-white/20">·</span>
            <span style={{ color: 'var(--theme-accent-primary)' }}>{message.model}</span>
          </>
        )}
      </div>

      {/* Message Chassis */}
      {isUser ? (
        /* User Glass Pill — Dynamic Theme Surface */
        <div
          className="relative max-w-[90%] sm:max-w-[78%] rounded-3xl rounded-tr-sm px-5 py-3.5 backdrop-blur-2xl text-[14px] sm:text-[15px] leading-relaxed transition-all duration-300"
          style={{
            background: 'var(--theme-surface-user)',
            border: '1px solid var(--theme-border-ambient)',
            boxShadow: '0 12px 36px var(--theme-shadow-ambient), inset 0 1px 1px var(--theme-border-specular)',
            color: 'var(--theme-text-primary)',
          }}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      ) : (
        /* Apple-Grade Liquid Glass Assistant Surface — Dynamic Theme Reactive */
        <div
          className="relative max-w-[94%] sm:max-w-[88%] w-full rounded-3xl rounded-tl-sm p-5 sm:p-6 backdrop-blur-3xl transition-all duration-300"
          style={{
            background: 'var(--theme-surface-assistant)',
            border: '1px solid var(--theme-border-ambient)',
            boxShadow: '0 24px 70px var(--theme-shadow-ambient), inset 0 1.5px 1px var(--theme-border-specular), inset 0 -1px 1px rgba(0,0,0,0.6)',
            color: 'var(--theme-text-primary)',
          }}
        >
          {/* Top Specular Rim Reflection */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--theme-border-specular)] to-transparent"
          />

          {/* Theme Atmospheric Sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-10 w-48 h-48 rounded-full blur-3xl opacity-50"
            style={{ background: 'var(--theme-accent-glow)' }}
          />

          {/* Rich Markdown & Content Flow */}
          <div className="relative z-10 text-[14px] sm:text-[15px] leading-relaxed font-light break-words space-y-3.5">
            {message.error ? (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="text-[13px] leading-relaxed font-sans">{message.content}</div>
              </div>
            ) : (
              renderedContent
            )}

            {isStreaming && (
              <span
                className="inline-block w-2 h-4 ml-1 align-middle rounded-sm animate-pulse"
                style={{
                  backgroundColor: 'var(--theme-accent-primary)',
                  boxShadow: '0 0 8px var(--theme-accent-glow)',
                }}
              />
            )}
          </div>

          {/* Integrated Glass Action Toolbar */}
          <div className="relative z-10 mt-5 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] text-[11px] font-sans text-white/50">
            {/* Left Tools: Copy, TTS, Feedback */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={(e) => handleCopy(e)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] hover:text-white transition-all cursor-pointer active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => handleSpeechToggle(e)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                  speaking
                    ? 'font-medium'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] hover:text-white'
                }`}
                style={
                  speaking
                    ? {
                        backgroundColor: 'var(--theme-accent-soft-glow)',
                        color: 'var(--theme-accent-primary)',
                        border: '1px solid var(--theme-border-focus)',
                      }
                    : undefined
                }
              >
                {speaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--theme-accent-primary)' }} />
                    <span>Speaking...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>

              <div className="h-3 w-[1px] bg-white/10 mx-1" />

              <button
                type="button"
                onClick={(e) => handleReaction('up', e)}
                title="Helpful Response"
                className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                  reaction === 'up'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] hover:text-white'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => handleReaction('down', e)}
                title="Needs Improvement"
                className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                  reaction === 'down'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] hover:text-white'
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>

            {/* Right Badge: Optical Engine */}
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono tracking-wider uppercase"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Aetheria Optical Engine
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MessageItem = React.memo(MessageItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.model === nextProps.message.model &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.userName === nextProps.userName &&
    prevProps.preferences.soundEffects === nextProps.preferences.soundEffects &&
    prevProps.preferences.theme === nextProps.preferences.theme &&
    prevProps.preferences.fontSize === nextProps.preferences.fontSize
  );
});

/**
 * High-Fidelity Code Block with Theme Accentuation
 */
interface SyntaxCodeBlockProps {
  language: string;
  code: string;
  soundEffects: boolean;
  onOpenArtifact?: (artifact: { title: string; language: string; content: string }) => void;
}

const SyntaxCodeBlock: React.FC<SyntaxCodeBlockProps> = ({ language, code, soundEffects, onOpenArtifact }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    playTactileSound('click', soundEffects);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedCode = React.useMemo(() => highlightSyntax(code), [code]);

  return (
    <div
      className="my-4 rounded-2xl overflow-hidden backdrop-blur-2xl transition-all duration-300"
      style={{
        background: 'var(--theme-surface-code)',
        border: '1px solid var(--theme-border-ambient)',
        boxShadow: '0 16px 40px var(--theme-shadow-ambient), inset 0 1px 1px var(--theme-border-specular)',
      }}
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-transparent border-b border-white/[0.08] text-[11px] font-mono text-white/70">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent-primary)' }} />
          <span
            className="uppercase tracking-wider font-semibold"
            style={{ color: 'var(--theme-accent-secondary)' }}
          >
            {language || 'plaintext'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenArtifact && (
            <button
              type="button"
              onClick={() => {
                playTactileSound('click', soundEffects);
                onOpenArtifact({
                  title: `${(language || 'code').toUpperCase()} Artifact`,
                  language: language || 'text',
                  content: code,
                });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-100 border border-indigo-500/30 transition-all cursor-pointer active:scale-95 text-[11px]"
              title="Inspect in Cognitive Artifact Studio"
            >
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Inspect Artifact</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Pre/Body */}
      <pre className="p-4 overflow-x-auto font-mono text-neutral-100 leading-relaxed text-xs sm:text-[13px] bg-black/40">
        <code>{highlightedCode}</code>
      </pre>
    </div>
  );
};

/**
 * Lightweight syntax colorizer for keywords, strings, and comments
 */
function highlightSyntax(code: string) {
  const lines = code.split('\n');
  return lines.map((line, idx) => {
    // Check comments
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
      return (
        <span key={idx} className="block text-white/40 italic">
          {line}
        </span>
      );
    }

    // Colorize keywords and punctuation
    const tokens = line.split(/(\b(?:const|let|var|function|return|import|export|from|async|await|class|interface|type|if|else|for|while|try|catch|default|switch|case|new)\b|"[^"]*"|'[^']*'|`[^`]*`)/g);

    return (
      <span key={idx} className="block">
        {tokens.map((token, tIdx) => {
          if (/^(?:const|let|var|function|return|import|export|from|async|await|class|interface|type|if|else|for|while|try|catch|default|switch|case|new)$/.test(token)) {
            return (
              <span
                key={tIdx}
                className="font-medium"
                style={{ color: 'var(--theme-accent-primary)' }}
              >
                {token}
              </span>
            );
          }
          if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
            return (
              <span key={tIdx} className="text-emerald-300">
                {token}
              </span>
            );
          }
          return <span key={tIdx}>{token}</span>;
        })}
      </span>
    );
  });
}

/**
 * Comprehensive Markdown Renderer with Tables, Quotes, Headings, and Lists
 */
function renderMarkdown(
  content: string,
  soundEffects = true,
  onOpenArtifact?: (artifact: { title: string; language: string; content: string }) => void
): React.ReactNode {
  if (!content) return null;

  // Split code blocks first
  const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(renderBlocks(content.slice(lastIndex, match.index), `blk-${lastIndex}`));
    }

    const language = match[1] || 'code';
    const code = match[2];

    nodes.push(
      <SyntaxCodeBlock
        key={`code-${match.index}`}
        language={language}
        code={code}
        soundEffects={soundEffects}
        onOpenArtifact={onOpenArtifact}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    nodes.push(renderBlocks(content.slice(lastIndex), `blk-${lastIndex}`));
  }

  return nodes;
}

function renderBlocks(text: string, keyPrefix: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Table detection: starts with '|' and ends with '|'
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(renderTable(tableLines, `${keyPrefix}-tbl-${i}`));
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`${keyPrefix}-${i}`} className="text-lg sm:text-xl font-semibold text-white tracking-tight pt-2 border-b border-white/[0.08] pb-1.5">
          {renderInlineFormatting(line.replace('# ', ''))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3
          key={`${keyPrefix}-${i}`}
          className="text-base sm:text-lg font-semibold tracking-tight pt-1.5"
          style={{ color: 'var(--theme-text-accent)' }}
        >
          {renderInlineFormatting(line.replace('## ', ''))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h4
          key={`${keyPrefix}-${i}`}
          className="text-sm sm:text-base font-medium pt-1 tracking-tight"
          style={{ color: 'var(--theme-accent-secondary)' }}
        >
          {renderInlineFormatting(line.replace('### ', ''))}
        </h4>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`${keyPrefix}-${i}`}
          className="pl-4 py-1.5 my-2 border-l-2 bg-white/[0.03] rounded-r-xl italic text-white/85"
          style={{ borderLeftColor: 'var(--theme-accent-primary)' }}
        >
          {renderInlineFormatting(line.replace('> ', ''))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Bullet List
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={`${keyPrefix}-${i}`} className="flex items-start gap-2.5 pl-2 my-1">
          <span
            className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
            style={{
              backgroundColor: 'var(--theme-accent-primary)',
              boxShadow: '0 0 6px var(--theme-accent-glow)',
            }}
          />
          <span className="text-white/90 leading-relaxed">{renderInlineFormatting(line.slice(2))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered List
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`${keyPrefix}-${i}`} className="flex items-start gap-2.5 pl-2 my-1">
          <span
            className="font-mono text-xs font-semibold pt-0.5 shrink-0"
            style={{ color: 'var(--theme-accent-primary)' }}
          >
            {numMatch[1]}.
          </span>
          <span className="text-white/90 leading-relaxed">{renderInlineFormatting(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={`${keyPrefix}-${i}`} className="leading-relaxed text-white/90">
        {renderInlineFormatting(line)}
      </p>
    );
    i++;
  }

  return <div key={keyPrefix} className="space-y-2">{elements}</div>;
}

/**
 * Render Markdown Table in Apple Glass style
 */
function renderTable(lines: string[], key: string) {
  if (lines.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

  const headerCells = parseRow(lines[0]);
  const rowLines = lines.slice(1).filter((l) => !l.includes('---'));

  return (
    <div
      key={key}
      className="my-4 overflow-x-auto rounded-2xl backdrop-blur-xl"
      style={{
        background: 'var(--theme-surface-base)',
        border: '1px solid var(--theme-border-ambient)',
      }}
    >
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="bg-white/[0.05] border-b border-white/[0.08]">
            {headerCells.map((cell, idx) => (
              <th
                key={idx}
                className="p-3 font-semibold font-mono text-xs"
                style={{ color: 'var(--theme-accent-secondary)' }}
              >
                {renderInlineFormatting(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {rowLines.map((row, rIdx) => {
            const cells = parseRow(row);
            return (
              <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3 text-white/80">
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Bold, Italic, Code, Link Inlining
 */
function renderInlineFormatting(str: string): React.ReactNode {
  // Links: [Text](url)
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts = str.split(linkRegex);

  if (parts.length > 1) {
    const result: React.ReactNode[] = [];
    let pIdx = 0;
    while (pIdx < parts.length) {
      if (pIdx % 3 === 0) {
        result.push(renderBoldAndCode(parts[pIdx], `t-${pIdx}`));
      } else if (pIdx % 3 === 1) {
        const text = parts[pIdx];
        const url = parts[pIdx + 1];
        result.push(
          <a
            key={`link-${pIdx}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-4 transition-colors"
            style={{
              color: 'var(--theme-accent-primary)',
            }}
          >
            <span>{text}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        );
        pIdx++; // skip url
      }
      pIdx++;
    }
    return result;
  }

  return renderBoldAndCode(str, 'base');
}

function renderBoldAndCode(str: string, keyPrefix: string): React.ReactNode {
  const tokens = str.split(/(\*\*.*?\*\*|`.*?`)/g);
  return (
    <React.Fragment key={keyPrefix}>
      {tokens.map((token, i) => {
        if (token.startsWith('**') && token.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-white">
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith('`') && token.endsWith('`')) {
          return (
            <code
              key={i}
              className="font-mono text-xs px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: 'var(--theme-accent-soft-glow)',
                color: 'var(--theme-accent-secondary)',
                border: '1px solid var(--theme-border-ambient)',
              }}
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        return token;
      })}
    </React.Fragment>
  );
}
