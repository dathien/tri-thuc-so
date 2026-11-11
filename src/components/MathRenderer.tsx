import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
  block?: boolean;
}

/**
 * MathRenderer parses content strings for LaTeX delimiters ($$...$$, $...$, \[...\], \(...\))
 * or renders pure LaTeX math expressions directly via KaTeX without leaking raw LaTeX code.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
  block = false,
}) => {
  const isDisplayMode = Boolean(block);

  const renderedContent = useMemo(() => {
    if (!content) return '';

    // 1. If explicit delimiters are present: $$, $, \[, \(
    const delimiterRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;

    if (delimiterRegex.test(content)) {
      delimiterRegex.lastIndex = 0;
      const parts: string[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;

      while ((match = delimiterRegex.exec(content)) !== null) {
        if (match.index > lastIdx) {
          parts.push(escapeHtml(content.substring(lastIdx, match.index)));
        }
        const raw = match[0];
        const isBlockSegment = raw.startsWith('$$') || raw.startsWith('\\[');
        let math = '';
        if (raw.startsWith('$$') || raw.startsWith('\\[')) {
          math = raw.slice(2, -2).trim();
        } else {
          math = raw.slice(1, -1).trim();
        }

        try {
          parts.push(
            katex.renderToString(math, {
              displayMode: isBlockSegment || (block && !inline),
              throwOnError: false,
            })
          );
        } catch {
          parts.push(escapeHtml(math));
        }
        lastIdx = delimiterRegex.lastIndex;
      }

      if (lastIdx < content.length) {
        parts.push(escapeHtml(content.substring(lastIdx)));
      }
      return parts.join('');
    }

    // 2. No explicit delimiters. Check if it contains LaTeX commands or mathematical operators
    const hasLatex = /\\[a-zA-Z]+|\^|_|\\text|\\frac|\\sqrt|\\alpha|\\circ/.test(content);
    if (hasLatex) {
      // First, attempt direct full parse
      try {
        return katex.renderToString(content, {
          displayMode: isDisplayMode,
          throwOnError: true,
        });
      } catch {
        // Direct parse threw an error. It might be mixed plain text with un-delimited LaTeX tokens.
      }

      // If mixed text, extract math segments starting with backslash or formulas
      const tokenRegex = /(\\([a-zA-Z]+|text\{[^{}]*\})(\{[^{}]*\}|\[[^\[\]]*\])*(\^[0-9a-zA-Z\{\}\\]+|_[0-9a-zA-Z\{\}\\]+)*(\s*[\+\-\*\/\=\<\>\:\approx\ne\le\ge]\s*(\\[a-zA-Z]+|\d+([\,\.]\d+)?|[a-zA-Z]|\{[^{}]*\}|\^[0-9a-zA-Z\{\}\\]+|_[0-9a-zA-Z\{\}\\]+))*)/g;
      
      let lastPos = 0;
      const parts: string[] = [];
      let tokenMatch: RegExpExecArray | null;

      while ((tokenMatch = tokenRegex.exec(content)) !== null) {
        if (tokenMatch.index > lastPos) {
          parts.push(escapeHtml(content.substring(lastPos, tokenMatch.index)));
        }
        const rawToken = tokenMatch[0];
        try {
          parts.push(
            katex.renderToString(rawToken, {
              displayMode: false,
              throwOnError: false,
            })
          );
        } catch {
          parts.push(escapeHtml(rawToken));
        }
        lastPos = tokenRegex.lastIndex;
      }

      if (lastPos < content.length) {
        parts.push(escapeHtml(content.substring(lastPos)));
      }

      if (parts.length > 0) {
        return parts.join('');
      }

      // Fallback
      return katex.renderToString(content, { displayMode: false, throwOnError: false });
    }

    // 3. Plain text
    return escapeHtml(content);
  }, [content, inline, isDisplayMode]);

  return (
    <span
      className={`${isDisplayMode ? 'block-math-container my-1.5 block text-center' : 'inline-math-container'} leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br />');
}

export default MathRenderer;
