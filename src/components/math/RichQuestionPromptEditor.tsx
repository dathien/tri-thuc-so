import React, { useEffect, useRef, useState } from 'react';
import { Check, Edit3, Plus, X } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

export interface RichQuestionPromptEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  onOpenVisualFormulaModal?: () => void;
  rows?: number;
}

type FormulaKind = 'fraction' | 'root' | 'power' | 'subscript' | 'vector' | 'limit' | 'integral' | 'interval' | 'set' | 'custom';
const TOOLS: { kind: FormulaKind; label: string }[] = [
  { kind: 'fraction', label: 'Phân số' }, { kind: 'root', label: 'Căn' },
  { kind: 'power', label: 'Lũy thừa' }, { kind: 'subscript', label: 'Chỉ số' },
  { kind: 'vector', label: 'Vectơ' }, { kind: 'limit', label: 'Giới hạn' },
  { kind: 'integral', label: 'Tích phân' }, { kind: 'interval', label: 'Khoảng' },
  { kind: 'set', label: 'Tập hợp' }, { kind: 'custom', label: 'Nâng cao' },
];
const defaults: Record<FormulaKind, string[]> = {
  fraction: ['a', 'b'], root: ['x'], power: ['x', '2'], subscript: ['x', '1'],
  vector: ['a'], limit: ['x', '+\\infty', 'f(x)'], integral: ['0', '1', 'f(x)'],
  interval: ['-\\infty', '0'], set: ['-1'], custom: ['\\frac{a}{b}'],
};
const labels: Record<FormulaKind, string[]> = {
  fraction: ['Tử số', 'Mẫu số'], root: ['Biểu thức dưới căn'],
  power: ['Cơ số', 'Số mũ'], subscript: ['Ký hiệu', 'Chỉ số dưới'],
  vector: ['Tên vectơ'], limit: ['Biến', 'Tiến tới', 'Biểu thức'],
  integral: ['Cận dưới', 'Cận trên', 'Hàm dưới dấu tích phân'],
  interval: ['Đầu trái', 'Đầu phải'], set: ['Giá trị loại trừ'], custom: ['Công thức LaTeX'],
};
const build = (kind: FormulaKind, p: string[]) => {
  const a = p[0] || 'a'; const b = p[1] || 'b'; const c = p[2] || 'f(x)';
  switch (kind) {
    case 'fraction': return `\\frac{${a}}{${b}}`;
    case 'root': return `\\sqrt{${a}}`;
    case 'power': return `{${a}}^{${b}}`;
    case 'subscript': return `{${a}}_{${b}}`;
    case 'vector': return `\\vec{${a}}`;
    case 'limit': return `\\lim_{${a}\\to ${b}} ${c}`;
    case 'integral': return `\\int_{${a}}^{${b}} ${c}\\,\\mathrm{d}x`;
    case 'interval': return `(${a};${b})`;
    case 'set': return `\\mathbb{R}\\setminus\\{${a}\\}`;
    default: return a;
  }
};

/** Inline formula builder: teachers use labelled fields, not LaTeX delimiters. */
export const RichQuestionPromptEditor: React.FC<RichQuestionPromptEditorProps> = ({
  value, onChange, placeholder = 'Nhập nội dung câu hỏi...', rows = 4,
}) => {
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<FormulaKind | null>(null);
  const [parts, setParts] = useState<string[]>([]);
  const [advanced, setAdvanced] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  useEffect(() => { if (editing) textRef.current?.focus(); }, [editing]);
  const remember = () => {
    const el = textRef.current;
    if (el) selection.current = { start: el.selectionStart, end: el.selectionEnd };
  };
  const choose = (next: FormulaKind) => {
    remember(); setKind(next); setParts([...defaults[next]]);
  };
  const insert = () => {
    if (!kind) return;
    const formula = `$${build(kind, parts)}$`;
    const start = Math.min(selection.current.start, value.length);
    const end = Math.min(selection.current.end, value.length);
    const next = value.slice(0, start) + formula + value.slice(end);
    onChange(next);
    const cursor = start + formula.length;
    selection.current = { start: cursor, end: cursor };
    setKind(null);
    requestAnimationFrame(() => {
      textRef.current?.focus();
      textRef.current?.setSelectionRange(cursor, cursor);
    });
  };
  return (
    <section className="space-y-3" aria-label="Biên tập nội dung câu hỏi">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="font-semibold text-slate-800 text-base">3. Nội dung câu hỏi</label>
        <button type="button" onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
          {editing ? <Check size={16}/> : <Edit3 size={16}/>} {editing ? 'Hoàn tất' : 'Chỉnh sửa'}
        </button>
      </div>
      {editing ? (
        <div className="space-y-3 rounded-xl border border-indigo-200 bg-white p-3">
          <div className="flex flex-wrap gap-2" aria-label="Thanh công cụ công thức">
            {TOOLS.map(tool => (
              <button type="button" key={tool.kind} onClick={() => choose(tool.kind)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:border-indigo-400">
                <Plus size={13} className="mr-1 inline"/>{tool.label}
              </button>
            ))}
          </div>
          <textarea ref={textRef} rows={rows} value={value} placeholder={placeholder}
            onChange={e => onChange(e.target.value)} onSelect={remember} onClick={remember} onKeyUp={remember}
            className="w-full resize-y rounded-lg border border-slate-300 p-3 text-base leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-none"/>
          {kind && (
            <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3" aria-label="Chèn công thức trực quan">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-base text-slate-800">{TOOLS.find(t => t.kind === kind)?.label}</strong>
                <button type="button" onClick={() => setKind(null)} aria-label="Đóng công cụ công thức"><X size={18}/></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {parts.map((part, i) => (
                  <label key={`${kind}-${i}`} className="block text-sm font-medium text-slate-700">
                    {labels[kind][i]}
                    <input value={part} onChange={e => setParts(prev => prev.map((v,j) => i === j ? e.target.value : v))}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-base"/>
                  </label>
                ))}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-base" aria-live="polite">
                <MathRenderer content={`$${build(kind, parts)}$`}/>
              </div>
              <button type="button" onClick={insert} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Chèn vào câu hỏi</button>
            </div>
          )}
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="mb-2 text-sm font-semibold text-slate-600">Xem trước nội dung</div>
            <div className="text-base leading-relaxed text-slate-900"><MathRenderer content={value || '(Chưa có nội dung)'}/></div>
          </div>
          <button type="button" onClick={() => setAdvanced(!advanced)} className="text-sm text-indigo-700 underline">
            {advanced ? 'Ẩn hướng dẫn nâng cao' : 'Dành cho giáo viên biết LaTeX'}
          </button>
          {advanced && <p className="text-sm text-slate-600">Có thể nhập trực tiếp công thức trong cặp dấu $...$ tại ô nội dung. Chế độ trực quan phía trên không yêu cầu nhập các dấu này.</p>}
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="block min-h-24 w-full rounded-xl border border-slate-200 bg-white p-4 text-left text-base leading-relaxed text-slate-900 hover:border-indigo-300">
          <MathRenderer content={value || placeholder}/>
          <span className="mt-3 block text-sm text-indigo-600">Nhấn để chỉnh sửa nội dung và chèn công thức</span>
        </button>
      )}
    </section>
  );
};
