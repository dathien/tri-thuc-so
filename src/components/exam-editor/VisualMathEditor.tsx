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

type Props = { value: string; onChange: (value: string) => void; onFocus?: () => void; placeholder?: string; rows?: number; editorId: string; };
export default function VisualMathEditor({ value, onChange, onFocus, placeholder = 'Nhập nội dung và chèn công thức trực tiếp...', rows = 3, editorId }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastValue = useRef<string | null>(null);
  const [editing, setEditing] = useState<HTMLElement | null>(null);
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number] | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [advanced, setAdvanced] = useState(false);
  const [latex, setLatex] = useState('');
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
    setLatex(token?.getAttribute('data-math') || t.make(t.defaults));
    setAdvanced(!!token);
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
  const preview = advanced ? latex : template?.make(fields) || '';
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
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Chèn nhanh ký hiệu vô cực">
      <span className="text-[12px] text-slate-600 mr-1">Chèn nhanh:</span>
      {([{ label: '∞', formula: '\\infty' }, { label: '+∞', formula: '+\\infty' }, { label: '−∞', formula: '-\\infty' }]).map(item =>
        <button type="button" key={item.label} title={`Chèn ${item.label} tại vị trí con trỏ`} onMouseDown={e => e.preventDefault()} onClick={() => insert(item.formula)} className="min-w-10 px-2.5 py-1.5 text-[16px] font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50">{item.label}</button>
      )}
    </div>
    {showTools && <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 p-2 bg-slate-50">{TEMPLATES.map(t => <button type="button" key={t.title} onMouseDown={e => e.preventDefault()} onClick={() => { if (!t.fields.length) insert(t.make([])); else open(t); }} className="px-2.5 py-1.5 text-[13px] font-medium rounded-lg bg-white border border-slate-200 hover:border-indigo-400">{t.label}</button>)}</div>}
    {template && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-3" aria-label="Chỉnh sửa công thức">
      <div className="font-bold text-indigo-900 text-[14px]">{editing ? 'Chỉnh sửa công thức' : `Chèn ${template.title}`}</div>
      {editing && <div className="text-[12px] text-slate-600">Chọn mẫu mới bên dưới hoặc mở chế độ nâng cao để chỉnh sửa công thức đã có.</div>}
      <div className="flex flex-wrap gap-1">{TEMPLATES.filter(t => t.fields.length).map(t => <button type="button" key={t.title} onClick={() => { setTemplate(t); setFields([...t.defaults]); setAdvanced(false); }} className="px-2 py-1 text-[12px] rounded border bg-white">{t.label}</button>)}</div>
      {!advanced ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{template.fields.map((name, i) => <label key={i} className="text-[13px] text-slate-700">{name}<input className="block w-full mt-1 p-2 border rounded-lg bg-white" value={fields[i] || ''} onChange={e => setFields(old => old.map((v,j) => i === j ? e.target.value : v))}/></label>)}</div> : <label className="text-[13px] text-slate-700 block">Mã công thức nâng cao (tùy chọn)<input className="block w-full mt-1 p-2 border rounded-lg bg-white font-mono" value={latex} onChange={e => setLatex(e.target.value)} /></label>}
      <button type="button" onClick={() => { setLatex(template.make(fields)); setAdvanced(v => !v); }} className="text-[12px] underline text-indigo-700">{advanced ? 'Chuyển về nhập theo mẫu' : 'Chỉnh sửa nâng cao'}</button>
      <div className="min-h-10 p-2 rounded-lg bg-white border border-indigo-100 text-center text-lg">{valid ? <span dangerouslySetInnerHTML={{ __html: katex.renderToString(preview, { throwOnError: false }) }} /> : <span className="text-rose-600 text-sm">Biểu thức chưa hợp lệ</span>}</div>
      <div className="flex gap-2"><button type="button" disabled={!valid} onClick={() => insert(preview)} className="bg-indigo-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-bold">{editing ? 'Cập nhật công thức' : 'Chèn vào nội dung'}</button><button type="button" onClick={() => { setTemplate(null); setEditing(null); }} className="bg-white border px-4 py-2 rounded-lg text-sm">Hủy</button>{editing && <button type="button" onClick={() => { editing.remove(); emit(); setEditing(null); setTemplate(null); }} className="text-rose-600 border border-rose-200 px-3 py-2 rounded-lg text-sm">Xóa công thức</button>}</div>
    </div>}
  </div>;
}
