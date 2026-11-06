import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * MathRenderer parses content strings for LaTeX delimiters ($$...$$, $...$, \[...\], \(...\))
 * or renders pure LaTeX math expressions directly via KaTeX without leaking raw LaTeX code.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
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
        const isBlock = raw.startsWith('$$') || raw.startsWith('\\[');
        let math = '';
        if (raw.startsWith('$$') || raw.startsWith('\\[')) {
          math = raw.slice(2, -2).trim();
        } else {
          math = raw.slice(1, -1).trim();
        }

        try {
          parts.push(
            katex.renderToString(math, {
              displayMode: isBlock,
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
    const hasLatex = /\\[a-zA-Z]+|\^|_/.test(content);
    if (hasLatex) {
      // Check if it is a pure formula (no Vietnamese accent letters)
      const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(content);

      if (!hasVietnamese) {
        try {
          return katex.renderToString(content, {
            displayMode: !inline,
            throwOnError: false,
          });
        } catch {
          // If direct KaTeX parse fails, fallback to regex extraction
        }
      }

      // If it contains mixed text with un-delimited LaTeX commands like (\alpha): Ax + By + Cz + D = 0
      const mathTokenRegex = /(\(?\\[a-zA-Z]+(?:\s*\{[^{}]*\})*(?:\s*[\+\-\*\/\=\<\>\:\^\_\|\;]\s*[\w\d\.\,\(\)\{\}\\\^]+)*\)?)/g;
      return content.replace(mathTokenRegex, (m) => {
        try {
          return katex.renderToString(m, { displayMode: false, throwOnError: false });
        } catch {
          return escapeHtml(m);
        }
      });
    }

    // 3. Plain text
    return escapeHtml(content);
  }, [content, inline]);

  return (
    <span
      className={`inline-math-container leading-relaxed ${className}`}
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

