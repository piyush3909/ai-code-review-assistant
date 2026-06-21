import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Block {
  type: 'code' | 'text';
  language?: string;
  content: string;
}

interface MarkdownRendererProps {
  content: string;
}

// Escapes HTML and tokenizes code string with regex rules
const tokenize = (code: string, _language: string) => {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (_language.toLowerCase() === 'diff') {
    const lines = escaped.split('\n');
    return lines.map(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return `<span class="hl-diff-add">${line}</span>`;
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        return `<span class="hl-diff-delete">${line}</span>`;
      }
      return line;
    }).join('\n');
  }

  const rules = [
    { name: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/ },
    { name: 'string', regex: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/ },
    { name: 'annotation', regex: /(@[a-zA-Z_][a-zA-Z0-9_]*)/ },
    { name: 'number', regex: /\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/ },
    { name: 'keyword', regex: /\b(class|interface|extends|implements|package|import|public|private|protected|static|final|volatile|transient|synchronized|native|strictfp|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|throws|new|this|super|instanceof|const|let|var|function|async|await|export|from|def|elif|import|as|lambda|assert|in|is|not|and|or|pass|try|except|raise|with|yield|bool|char|double|float|int|long|short|void|boolean|string|number|any|unknown|never|null|undefined|true|false)\b/ },
    { name: 'type', regex: /\b([A-Z][a-zA-Z0-9_]*)\b/ },
    { name: 'method', regex: /\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/ },
  ];

  const combinedRegex = new RegExp(
    rules.map(r => `(?<${r.name}>${r.regex.source})`).join('|'),
    'g'
  );

  let html = '';
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(escaped)) !== null) {
    html += escaped.substring(lastIndex, match.index);

    const groups = match.groups as Record<string, string>;
    let matchedType = '';
    let matchedValue = '';

    for (const key of Object.keys(groups)) {
      if (groups[key]) {
        matchedType = key;
        matchedValue = groups[key];
        break;
      }
    }

    if (matchedType) {
      html += `<span class="hl-${matchedType}">${matchedValue}</span>`;
    } else {
      html += match[0];
    }

    lastIndex = combinedRegex.lastIndex;
  }

  html += escaped.substring(lastIndex);
  return html;
};

// Parses inline Markdown styles (bold, italics, inline code)
const parseInline = (text: string): React.ReactNode[] => {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="inline-code">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

// Parses block Markdown styles (headings, lists, paragraphs)
const parseTextToJSX = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (key: number) => {
    if (!currentList) return null;
    const ListTag = currentList.type;
    const el = (
      <ListTag key={`list-${key}`} className={`markdown-${currentList.type}`}>
        {currentList.items.map((item, i) => (
          <li key={i}>{parseInline(item)}</li>
        ))}
      </ListTag>
    );
    currentList = null;
    return el;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      if (currentList) {
        elements.push(flushList(i));
      }
      continue;
    }

    // Headings #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (currentList) {
        elements.push(flushList(i));
      }
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      // Map h1->h2, h2->h3, h3->h4, h4->h5 to respect page DOM structure
      const HeadingTag = `h${level + 1}` as 'h2' | 'h3' | 'h4' | 'h5';
      elements.push(
        <HeadingTag key={`h-${i}`} className={`markdown-h${level}`}>
          {parseInline(content)}
        </HeadingTag>
      );
      continue;
    }

    // Unordered lists (- or *)
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      const content = ulMatch[1];
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(content);
      } else {
        if (currentList) {
          elements.push(flushList(i));
        }
        currentList = { type: 'ul', items: [content] };
      }
      continue;
    }

    // Ordered lists (1.)
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      const content = olMatch[2];
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(content);
      } else {
        if (currentList) {
          elements.push(flushList(i));
        }
        currentList = { type: 'ol', items: [content] };
      }
      continue;
    }

    // Plain paragraphs
    if (currentList) {
      elements.push(flushList(i));
    }

    elements.push(
      <p key={`p-${i}`} className="markdown-p">
        {parseInline(line)}
      </p>
    );
  }

  if (currentList) {
    elements.push(flushList(lines.length));
  }

  return elements;
};

// Fenced Code Block component
export function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const isDiff = language.toLowerCase() === 'diff' || 
    (language.toLowerCase() === 'plaintext' && (
      code.startsWith('diff --git') || 
      code.includes('--- a/') || 
      code.includes('+++ b/') || 
      /^\s*@@\s+-\d+,\d+\s+\+\d+,\d+\s*@@/m.test(code) ||
      /^[+-]\s/m.test(code)
    ));

  const displayLanguage = isDiff ? 'diff' : language;
  const highlightedHtml = tokenize(code, displayLanguage);
  const lines = code.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-lang">{displayLanguage}</span>
        <button className="code-block-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={13} className="copied-icon" /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="code-block-content">
        <div className="line-numbers">
          {lines.map((_, i) => (
            <span key={i} className="line-number-item">{i + 1}</span>
          ))}
        </div>
        <pre className="code-pre">
          <code
            className={`language-${displayLanguage}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
}

// Parses full response into structured blocks of text & code
const parseBlocks = (text: string): Block[] => {
  const blocks: Block[] = [];
  const regex = /```([a-zA-Z0-9+#-]+)?\n([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      blocks.push({ type: 'text', content: textBefore });
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'plaintext',
      content: match[2],
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      blocks.push({ type: 'text', content: remainingText });
    }
  }

  // Fallback if no code blocks are parsed but there is content
  if (blocks.length === 0 && text) {
    blocks.push({ type: 'text', content: text });
  }

  return blocks;
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="markdown-container">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={index}
              language={block.language || 'plaintext'}
              code={block.content}
            />
          );
        } else {
          return <div key={index} className="text-block">{parseTextToJSX(block.content)}</div>;
        }
      })}
    </div>
  );
}
