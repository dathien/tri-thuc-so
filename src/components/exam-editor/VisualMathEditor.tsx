import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';

/* The stored format remains the existing inline $...$ format for compatibility
   with the question bank, MathRenderer and document exporters. */
const TOKEN = /\$([^$\n]+)\$/g;
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function render(value: string): string {
  let html = '', last = 0;
  for (const match of value.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    html += escapeHtml(value.slice(last, at)).replace(/\n/g, '<br>');
    const latex = match[1];
    let visual: string;
    try { visual = katex.renderToString(latex, { throwOnError: true, output: 'html', strict: 'ignore' }); }
    catch { visual = escapeHtml(latex); }
    html += `<span class="visual-math-token" contenteditable="false" data-math="${escapeHtml(latex)}" title="Nhấp để chỉnh sửa công thức" style="display:inline-block;vertical-align:middle;cursor:pointer;border-radius:5px;padding:2px 5px;background:#eef2ff;border:1px solid #c7d2fe">${visual}</span>`;
    last = at + match[0].length;
  }
  return html + escapeHtml(value.slice(last)).replace(/\n/g, '<br>');
}
function serialize(root: HTMLElement): string {
  let result = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { result += node.textContent || ''; return; }
    if (!(node instanceof HTMLElement)) return;
    if (node.hasAttribute('data-math')) { result += '$' + node.getAttribute('data-math') + '$'; return; }
    if (node.tagName === 'BR') { result += '\n'; return; }
    if (node !== root && (node.tagName === 'DIV' || node.tagName === 'P') && result && !result.endsWith('\n')) result += '\n';
    Array.from(node.childNodes).forEach(walk);
  };
  Array.from(root.childNodes).forEach(walk);
  return result.replace(/\n$/, '');
}

const TEMPLATES: { label: string; title: string; make: (fields: string[]) => string; fields: string[]; defaults: string[] }[] = [
  { label: 'Phân số', title: 'Phân số', fields: ['Tử số', 'Mẫu số'], defaults: ['a','b'], make: a => `\\frac{${a[0]}}{${a[1]}}` },
  { label: 'Căn', title: 'Căn bậc hai', fields: ['Biểu thức dưới căn'], defaults: ['x'], make: a => `\\sqrt{${a[0]}}` },
  { label: 'Căn bậc n', title: 'Căn bậc n', fields: ['Bậc căn','Biểu thức'], defaults: ['3','x'], make: a => `\\sqrt[${a[0]}]{${a[1]}}` },
  { label: 'Lũy thừa', title: 'Lũy thừa', fields: ['Cơ số','Số mũ'], defaults: ['x','2'], make: a => `{${a[0]}}^{${a[1]}}` },
  { label: 'Chỉ số dưới', title: 'Chỉ số dưới', fields: ['Ký hiệu','Chỉ số'], defaults: ['x','1'], make: a => `{${a[0]}}_{${a[1]}}` },
  { label: 'Vectơ', title: 'Vectơ', fields: ['Tên vectơ'], defaults: ['a'], make: a => `\\vec{${a[0]}}` },
  { label: 'Giới hạn', title: 'Giới hạn', fields: ['Biến','Tiến đến','Biểu thức'], defaults: ['x','+\\infty','f(x)'], make: a => `\\lim_{${a[0]}\\to ${a[1]}} ${a[2]}` },
  { label: 'Tích phân', title: 'Tích phân', fields: ['Cận dưới','Cận trên','Hàm số','Biến'], defaults: ['a','b','f(x)','x'], make: a => `\\int_{${a[0]}}^{${a[1]}} ${a[2]}\\,d${a[3]}` },
  { label: 'Tổng', title: 'Tổng', fields: ['Chỉ số bắt đầu','Chỉ số kết thúc','Biểu thức'], defaults: ['i=1','n','a_i'], make: a => `\\sum_{${a[0]}}^{${a[1]}} ${a[2]}` },
  { label: 'Tập số thực', title: 'Tập số thực', fields: [], defaults: [], make: () => '\\mathbb{R}' },
  { label: '∞', title: 'Vô cực', fields: [], defaults: [], make: () => '\\infty' },
  { label: '+∞', title: 'Dương vô cực', fields: [], defaults: [], make: () => '+\\infty' },
  { label: '−∞', title: 'Âm vô cực', fields: [], defaults: [], make: () => '-\\infty' },
  { label: '≤', title: 'Nhỏ hơn hoặc bằng', fields: [], defaults: [], make: () => '\\leq' },
  { label: '≥', title: 'Lớn hơn hoặc bằng', fields: [], defaults: [], make: () => '\\geq' },
  { label: '≠', title: 'Khác', fields: [], defaults: [], make: () => '\\ne' },
  { label: '∈', title: 'Thuộc', fields: [], defaults: [], make: () => '\\in' },
  { label: '⇒', title: 'Suy ra', fields: [], defaults: [], make: () => '\\Rightarrow' },
  { label: '⇔', title: 'Tương đương', fields: [], defaults: [], make: () => '\\Leftrightarrow' },
  { label: 'π', title: 'Pi', fields: [], defaults: [], make: () => '\\pi' },
  { label: 'α', title: 'Alpha', fields: [], defaults: [], make: () => '\\alpha' },
];

// Parse common legacy formulas into human-readable fields; keep the original storage format.
function extractGroup(source: string, start: number): { content: string; end: number } | null {
  if (source[start] !== '{') return null;
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return { content: source.slice(start + 1, i), end: i + 1 };
  }
  return null;
}
function simpleText(source: string): string {
  return source.replace(/\\infty/g, '∞').replace(/\\pi/g, 'π').replace(/\\alpha/g, 'α')
    .replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\ne/g, '≠')
    .replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/\\to/g, '→')
    .replace(/\\,/g, ' ').replace(/\\;/g, ' ').replace(/\\ /g, ' ');
}
function toLatexText(source: string): string {
  return source.replace(/∞/g, '\\infty').replace(/π/g, '\\pi').replace(/α/g, '\\alpha')
    .replace(/≤/g, '\\leq ').replace(/≥/g, '\\geq ').replace(/≠/g, '\\ne ')
    .replace(/×/g, '\\times ').replace(/·/g, '\\cdot ').replace(/→/g, '\\to ');
}
function parseEditableFormula(source: string): { kind: string; fields: string[] } | null {
  const fracIndex = source.indexOf('\\frac');
  if (fracIndex >= 0) {
    let i = fracIndex + 5;
    while (source[i] === ' ') i++;
    const numerator = extractGroup(source, i);
    if (numerator) {
      i = numerator.end;
      while (source[i] === ' ') i++;
      const denominator = extractGroup(source, i);
      if (denominator) return { kind: 'fraction', fields: [simpleText(source.slice(0, fracIndex)), simpleText(numerator.content), simpleText(denominator.content), simpleText(source.slice(denominator.end))] };
    }
  }
  const sqrtIndex = source.indexOf('\\sqrt');
  if (sqrtIndex >= 0) {
    let i = sqrtIndex + 5;
    if (source[i] === '{') {
      const inside = extractGroup(source, i);
      if (inside) return { kind: 'root', fields: [simpleText(source.slice(0, sqrtIndex)), simpleText(inside.content), simpleText(source.slice(inside.end))] };
    }
  }
  // Khoảng/đoạn: (2;+\\infty), [-1;3], ...; chỉnh từng đầu mút và dấu ngoặc.
  const interval = source.trim().match(/^([([])\s*(.*?)\s*([;,])\s*(.*?)\s*([)\]])$/);
  if (interval) return { kind: 'interval', fields: [interval[1], simpleText(interval[2]), simpleText(interval[4]), interval[5], interval[3]] };
  if (!source.includes('\\') && !/[{}]/.test(source)) return { kind: 'plain', fields: [simpleText(source)] };
  return null;
}
function makeEditableFormula(kind: string, fields: string[]): string {
  if (kind === 'fraction') return `${toLatexText(fields[0])}\\frac{${toLatexText(fields[1])}}{${toLatexText(fields[2])}}${toLatexText(fields[3])}`;
  if (kind === 'interval') return `${fields[0]}${toLatexText(fields[1])}${fields[4] || ';'}${toLatexText(fields[2])}${fields[3]}`;
  if (kind === 'root') return `${toLatexText(fields[0])}\\sqrt{${toLatexText(fields[1])}}${toLatexText(fields[2])}`;
  return toLatexText(fields[0] || '');
}
type Props = { value: string; onChange: (value: string) => void; onFocus?: () => void; placeholder?: string; rows?: number; editorId: string; };
export default function VisualMathEditor({ value, onChange, onFocus, placeholder = 'Nhập nội dung và chèn công thức trực tiếp...', rows = 3, editorId }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastValue = useRef<string | null>(null);
  const [editing, setEditing] = useState<HTMLElement | null>(null);
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number] | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [visualKind, setVisualKind] = useState('plain');
  const [uneditable, setUneditable] = useState(false);
  const [showTools, setShowTools] = useState(false);
  useEffect(() => {
    const el = editor.current;
    if (el && value !== lastValue.current) { el.innerHTML = render(value); lastValue.current = value; }
  }, [value]);
  const emit = () => {
    if (!editor.current) return;
    const next = serialize(editor.current);
    lastValue.current = next;
    onChange(next);
  };
  const remember = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editor.current?.contains(selection.anchorNode)) savedRange.current = selection.getRangeAt(0).cloneRange();
  };
  const open = (t: (typeof TEMPLATES)[number], token?: HTMLElement) => {
    remember();
    setEditing(token || null);
    setTemplate(t);
    setFields([...t.defaults]);
    const current = token?.getAttribute('data-math');
    const parsed = current ? parseEditableFormula(current) : null;
    setUneditable(!!current && !parsed);
    if (parsed) { setVisualKind(parsed.kind); setFields(parsed.fields); }
    else { setVisualKind(t.label === 'Phân số' ? 'fraction' : t.label === 'Căn' ? 'root' : 'template'); }
  };
  const insert = (formula: string) => {
    const el = editor.current;
    if (!el) return;
    let visual: string;
    try { visual = katex.renderToString(formula, { throwOnError: true, strict: 'ignore' }); }
    catch { return; }
    const span = document.createElement('span');
    span.className = 'visual-math-token';
    span.contentEditable = 'false';
    span.dataset.math = formula;
    span.title = 'Nhấp để chỉnh sửa công thức';
    span.style.cssText = 'display:inline-block;vertical-align:middle;cursor:pointer;border-radius:5px;padding:2px 5px;background:#eef2ff;border:1px solid #c7d2fe';
    span.innerHTML = visual;
    if (editing?.isConnected) editing.replaceWith(span);
    else {
      el.focus();
      const sel = window.getSelection();
      const range = savedRange.current && el.contains(savedRange.current.commonAncestorContainer) ? savedRange.current : document.createRange();
      if (!savedRange.current || !el.contains(range.commonAncestorContainer)) { range.selectNodeContents(el); range.collapse(false); }
      range.deleteContents(); range.insertNode(span);
      const space = document.createTextNode('\u00a0'); span.after(space);
      range.setStartAfter(space); range.collapse(true);
      sel?.removeAllRanges(); sel?.addRange(range);
    }
    emit(); setTemplate(null); setEditing(null); savedRange.current = null;
  };
  const preview = visualKind !== 'template' && !uneditable ? makeEditableFormula(visualKind, fields) : template?.make(fields) || ''; 
  const valid = (() => { try { katex.renderToString(preview, { throwOnError: true }); return true; } catch { return false; } })();
  return <div className="space-y-2">
    <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Soạn nội dung và công thức trực quan" aria-multiline="true" data-placeholder={placeholder}
      onFocus={onFocus} onMouseUp={remember} onKeyUp={remember} onInput={emit}
      onClick={e => { const target = (e.target as HTMLElement).closest('[data-math]') as HTMLElement | null; if (target) open(TEMPLATES[0], target); }}
      onPaste={e => { e.preventDefault(); const text = e.clipboardData.getData('text/plain'); document.execCommand('insertText', false, text); }}
      style={{ minHeight: `${Math.max(2, rows) * 30}px`, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-[16px] leading-[1.8] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setShowTools(v => !v)} className="rounded-lg px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[13px] font-semibold">{showTools ? 'Ẩn công cụ toán' : '+ Chèn công thức toán'}</button>
      <span className="text-[12px] text-slate-500">Công thức hiển thị trực tiếp; nhấp vào công thức để sửa.</span>
    </div>
    {showTools && <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 p-2 bg-slate-50">{TEMPLATES.map(t => <button type="button" key={t.title} onMouseDown={e => e.preventDefault()} onClick={() => { if (!t.fields.length) insert(t.make([])); else open(t); }} className="px-2.5 py-1.5 text-[13px] font-medium rounded-lg bg-white border border-slate-200 hover:border-indigo-400">{t.label}</button>)}</div>}
    {template && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-3" aria-label="Chỉnh sửa công thức">
      <div className="font-bold text-indigo-900 text-[14px]">{editing ? 'Chỉnh sửa công thức' : `Chèn ${template.title}`}</div>
      {uneditable ? <div className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">Chưa thể sửa công thức này bằng các ô nhập. Thầy cô có thể nhấn Hủy để giữ nguyên, hoặc chọn một mẫu trên thanh công cụ để thay thế.</div> : <div className="text-[12px] text-slate-600">Chọn ô cần thay đổi, nhập giá trị mới rồi nhấn Lưu công thức.</div>}
      {!uneditable && visualKind === 'interval' ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-white p-3 border border-indigo-100">
        <label className="text-xs text-slate-700">Dấu đầu<select aria-label="Dấu đầu khoảng" className="block w-full mt-1 p-2 border rounded" value={fields[0]} onChange={e => setFields(a => a.map((v,i) => i === 0 ? e.target.value : v))}><option value="(">( Mở</option><option value="[">[ Đóng</option></select></label>
        <label className="text-xs text-slate-700">Đầu mút trái<input aria-label="Đầu mút trái" className="block w-full mt-1 p-2 border rounded" value={fields[1]} onChange={e => setFields(a => a.map((v,i) => i === 1 ? e.target.value : v))}/></label>
        <label className="text-xs text-slate-700">Đầu mút phải<input aria-label="Đầu mút phải" className="block w-full mt-1 p-2 border rounded" value={fields[2]} onChange={e => setFields(a => a.map((v,i) => i === 2 ? e.target.value : v))}/><span className="block mt-1">Có thể nhập ∞, +∞ hoặc −∞</span></label>
        <label className="text-xs text-slate-700">Dấu cuối<select aria-label="Dấu cuối khoảng" className="block w-full mt-1 p-2 border rounded" value={fields[3]} onChange={e => setFields(a => a.map((v,i) => i === 3 ? e.target.value : v))}><option value=")">) Mở</option><option value="]">] Đóng</option></select></label>
      </div> : !uneditable && visualKind === 'fraction' ? <div className="rounded-lg bg-white p-3 border border-indigo-100 flex items-center justify-center gap-2 flex-wrap">
        <input aria-label="Biểu thức trước phân số" placeholder="Trước phân số (ví dụ: y =)" className="w-24 min-w-0 p-2 border rounded text-center" value={fields[0] || ''} onChange={e => setFields(a => a.map((v,i) => i === 0 ? e.target.value : v))}/>
        <div className="inline-flex flex-col items-stretch min-w-28 gap-1">
          <input aria-label="Tử số" placeholder="Tử số" className="w-full p-2 border rounded text-center" value={fields[1] || ''} onChange={e => setFields(a => a.map((v,i) => i === 1 ? e.target.value : v))}/>
          <div className="border-t-2 border-slate-800" />
          <input aria-label="Mẫu số" placeholder="Mẫu số" className="w-full p-2 border rounded text-center" value={fields[2] || ''} onChange={e => setFields(a => a.map((v,i) => i === 2 ? e.target.value : v))}/>
        </div>
        <input aria-label="Biểu thức sau phân số" placeholder="Sau phân số" className="w-24 min-w-0 p-2 border rounded text-center" value={fields[3] || ''} onChange={e => setFields(a => a.map((v,i) => i === 3 ? e.target.value : v))}/>
      </div> : !uneditable && visualKind === 'root' ? <div className="flex gap-2 items-center flex-wrap bg-white rounded-lg p-3">
        {['Trước căn', 'Biểu thức dưới căn', 'Sau căn'].map((name,i) => <label key={name} className="text-xs flex-1 min-w-28">{name}<input className="block w-full p-2 border rounded mt-1" value={fields[i] || ''} onChange={e => setFields(a => a.map((v,j) => i === j ? e.target.value : v))}/></label>)}
      </div> : !uneditable && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{(visualKind === 'plain' ? ['Biểu thức'] : template.fields).map((name, i) => <label key={i} className="text-[13px] text-slate-700">{name}<input className="block w-full mt-1 p-2 border rounded-lg bg-white" value={fields[i] || ''} onChange={e => setFields(old => old.map((v,j) => i === j ? e.target.value : v))}/></label>)}</div>}
      <div className="min-h-10 p-2 rounded-lg bg-white border border-indigo-100 text-center text-lg">{uneditable ? <span className="text-slate-700 text-sm">Công thức hiện tại vẫn được giữ nguyên.</span> : valid ? <span dangerouslySetInnerHTML={{ __html: katex.renderToString(preview, { throwOnError: false }) }} /> : <span className="text-amber-700 text-sm">Vui lòng kiểm tra các ô vừa nhập để xem trước công thức.</span>}</div>
      <div className="flex gap-2"><button type="button" disabled={!valid || uneditable} onClick={() => insert(preview)} className="bg-indigo-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-bold">{editing ? 'Lưu công thức' : 'Chèn vào nội dung'}</button><button type="button" onClick={() => { setTemplate(null); setEditing(null); }} className="bg-white border px-4 py-2 rounded-lg text-sm">Hủy</button>{editing && <button type="button" onClick={() => { editing.remove(); emit(); setEditing(null); setTemplate(null); }} className="text-rose-600 border border-rose-200 px-3 py-2 rounded-lg text-sm">Xóa công thức</button>}</div>
    </div>}
  </div>;
}
