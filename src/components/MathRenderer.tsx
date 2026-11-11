import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
  block?: boolean;
}

/**
 * Normalizes LaTeX input strings:
 * - Fixes double-escaped LaTeX commands (e.g. \\vec -> \vec) caused by JSON serialization
 * - Auto-repairs unclosed single dollar delimiters to prevent leaking raw LaTeX
 * - Sanitizes consecutive $$ inside inline text
 */
export function normalizeLatexString(raw: string): string {
  if (!raw) return '';
  let str = raw;

  // 1. Fix double-escaped backslashes before known LaTeX command names
  str = str.replace(
    /\\\\(vec|frac|sqrt|alpha|beta|gamma|delta|Delta|pi|theta|sigma|omega|lim|int|sum|prod|infty|le|ge|ne|approx|in|notin|subset|times|cdot|circ|pm|mp|iff|implies|to|quad|qquad|text|mathbf|mathrm|left|right|begin|end|over|matrix|pmatrix|bmatrix)/g,
    '\\$1'
  );

  // 2. Count unescaped single $ signs
  let singleDollarCount = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '$' && (i === 0 || str[i - 1] !== '\\')) {
      singleDollarCount++;
    }
  }

  // 3. Auto-close if odd number of $ delimiters
  if (singleDollarCount % 2 === 1) {
    str += '$';
  }

  return str;
}

/**
 * MathRenderer parses content strings for LaTeX delimiters ($$...$$, $...$, \[...\], \(...\))
 * or renders mathematical expressions & coordinate tuples directly via KaTeX without leaking raw LaTeX code.
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

    const normalized = normalizeLatexString(content);

    // 1. Delimiter-based parsing: $$, $, \[, \(
    const delimiterRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;

    if (delimiterRegex.test(normalized)) {
      delimiterRegex.lastIndex = 0;
      const parts: string[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;

      while ((match = delimiterRegex.exec(normalized)) !== null) {
        if (match.index > lastIdx) {
          parts.push(escapeHtml(normalized.substring(lastIdx, match.index)));
        }
        const raw = match[0];
        const isBlockSegment = raw.startsWith('$$') || raw.startsWith('\\[');
        let math = '';
        if (raw.startsWith('$$') || raw.startsWith('\\[')) {
          math = raw.slice(2, -2).trim();
        } else {
          math = raw.slice(1, -1).trim();
        }

        // Clean any double-escaped commands inside math snippet
        math = math.replace(
          /\\\\(vec|frac|sqrt|alpha|beta|gamma|delta|Delta|pi|theta|sigma|omega|lim|int|sum|prod|infty|le|ge|ne|approx|in|notin|subset|times|cdot|circ|pm|mp|iff|implies|to|quad|qquad|text|mathbf|mathrm|left|right)/g,
          '\\$1'
        );

        try {
          const display = !inline && (isBlockSegment || isDisplayMode);
          parts.push(
            katex.renderToString(math, {
              displayMode: display,
              throwOnError: false,
            })
          );
        } catch {
          parts.push(escapeHtml(math));
        }
        lastIdx = delimiterRegex.lastIndex;
      }

      if (lastIdx < normalized.length) {
        parts.push(escapeHtml(normalized.substring(lastIdx)));
      }
      return parts.join('');
    }

    // 2. Check if content is a pure coordinate tuple, e.g. (3;-2;8) or (4; -2; 6) or [-1; 5)
    const isCoordinateOrInterval = /^\s*[\(\[]\s*[\+\-]?[0-9a-zA-Z\.\,\s;\\\/_\^]+\s*[\)\]]\s*$/.test(
      normalized
    );
    if (isCoordinateOrInterval) {
      try {
        return katex.renderToString(normalized.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return escapeHtml(normalized);
      }
    }

    // 3. Check if content contains un-delimited LaTeX commands or mathematical operators
    const hasLatex = /\\[a-zA-Z]+|\^|_|\\text|\\frac|\\sqrt|\\alpha|\\Delta|\\pm|\\le|\\ge|\\in|\\notin|\\approx|\\ne|\\int|\\lim|\\sum|\\infty|\\vec/.test(
      normalized
    );
    if (hasLatex) {
      try {
        return katex.renderToString(normalized, {
          displayMode: isDisplayMode && !inline,
          throwOnError: false,
        });
      } catch {
        // Fallback to token replacement
      }

      const tokenRegex = /(\\([a-zA-Z]+|text\{[^{}]*\})(\{[^{}]*\}|\[[^\[\]]*\])*(\^[0-9a-zA-Z\{\}\\]+|_[0-9a-zA-Z\{\}\\]+)*(\s*[\+\-\*\/\=\<\>\:\approx\ne\le\ge]\s*(\\[a-zA-Z]+|\d+([\,\.]\d+)?|[a-zA-Z]|\{[^{}]*\}|\^[0-9a-zA-Z\{\}\\]+|_[0-9a-zA-Z\{\}\\]+))*)/g;

      let lastPos = 0;
      const parts: string[] = [];
      let tokenMatch: RegExpExecArray | null;

      while ((tokenMatch = tokenRegex.exec(normalized)) !== null) {
        if (tokenMatch.index > lastPos) {
          parts.push(escapeHtml(normalized.substring(lastPos, tokenMatch.index)));
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

      if (lastPos < normalized.length) {
        parts.push(escapeHtml(normalized.substring(lastPos)));
      }

      if (parts.length > 0) {
        return parts.join('');
      }

      return katex.renderToString(normalized, { displayMode: false, throwOnError: false });
    }

    // 4. Plain text
    return escapeHtml(normalized);
  }, [content, inline, isDisplayMode]);

  return (
    <span
      className={`${isDisplayMode && !inline ? 'block-math-container my-1.5 block text-center' : 'inline-math-container align-baseline'} leading-relaxed ${className}`}
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
