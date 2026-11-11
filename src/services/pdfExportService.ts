import { ExamBundle, MathGraphicConfig } from '../types';
import { exportGraphicToSvg } from './mathGraphics/renderEngine';
import { normalizeLatexString } from '../components/MathRenderer';

export type PdfDocumentType = 'student_exam' | 'full_bundle' | 'grading_guide';

/**
 * Service to generate high-fidelity printable HTML with Times New Roman and KaTeX
 * which can be saved directly as PDF via the browser's vector print engine.
 */
export const pdfExportService = {
  /**
   * Generates the complete HTML string for standard A4 printing
   */
  generatePrintableHtml(bundle: ExamBundle, type: PdfDocumentType, variantCode: string = '101'): string {
    const isStudentOnly = type === 'student_exam';
    const isGuideOnly = type === 'grading_guide';
    const isFull = type === 'full_bundle';

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${bundle.title} - Mã đề ${variantCode}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 15mm 18mm 20mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.35;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: top;
      text-align: center;
      padding: 2px 8px;
    }
    .header-left {
      width: 45%;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
    }
    .header-right {
      width: 55%;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
    }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .student-info {
      margin: 12px 0 16px 0;
      font-style: italic;
      font-size: 12pt;
    }
    .section-title {
      font-weight: bold;
      font-size: 13pt;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    .section-desc {
      font-style: italic;
      font-size: 11.5pt;
      font-weight: normal;
    }
    .question-item {
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .question-title {
      font-weight: bold;
      display: inline;
    }
    .options-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px 16px;
      margin-top: 4px;
      margin-left: 16px;
    }
    .subitem-list {
      margin-top: 4px;
      margin-left: 20px;
    }
    .subitem-row {
      margin-bottom: 3px;
    }
    .short-ans-box {
      margin-top: 4px;
      margin-left: 20px;
      font-style: italic;
      color: #333;
    }
    .divider {
      text-align: center;
      font-weight: bold;
      margin: 20px 0;
      letter-spacing: 2px;
    }
    .page-break {
      page-break-before: always;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11.5pt;
      page-break-inside: avoid;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      text-align: left;
    }
    table.data-table th {
      background-color: #f2f2f2;
      text-align: center;
      font-weight: bold;
    }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${!isGuideOnly ? `
  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td class="header-left">
        <div class="bold uppercase" style="font-size: 11.5pt;">${bundle.schoolName ? escapeHtml(bundle.schoolName) : 'TRƯỜNG THPT'}</div>
        <div class="bold" style="font-size: 11.5pt;">TỔ TOÁN - TIN HỌC</div>
        <div class="italic" style="font-size: 10.5pt; margin-top: 4px;">(Đề thi gồm có 22 câu / 4 trang)</div>
      </td>
      <td class="header-right">
        <div class="bold uppercase" style="font-size: 12.5pt;">${bundle.title}</div>
        <div class="bold" style="font-size: 11.5pt;">NĂM HỌC 2025 - 2026</div>
        <div class="italic" style="font-size: 11pt;">Thời gian làm bài: ${bundle.durationMinutes} phút (không kể phát đề)</div>
        <div class="bold" style="font-size: 12pt; margin-top: 4px;">MÃ ĐỀ THI: ${variantCode}</div>
      </td>
    </tr>
  </table>

  <!-- STUDENT INFO -->
  <div class="student-info">
    Họ và tên thí sinh: ................................................................................... Số báo danh: ....................... Lớp: .............
  </div>

  <!-- PART I -->
  <div class="section-title">
    PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
    <span class="section-desc">(Thí sinh trả lời từ câu 1 đến câu 12. Mỗi câu hỏi chỉ chọn một phương án).</span>
  </div>

  ${bundle.questions
    .filter((q) => q.part === 1)
    .map((q, idx) => `
      <div class="question-item">
        <span class="question-title">Câu ${idx + 1}: </span>
        <span>${formatLatexForPdf(q.content)}</span>
        ${renderQuestionGraphicHtml(q.graphics)}
        <div class="options-grid">
          ${(q.options || [])
            .map((opt, i) => `<div><strong>${String.fromCharCode(65 + i)}.</strong> ${formatLatexForPdf(opt)}</div>`)
            .join('')}
        </div>
      </div>
    `)
    .join('')}

  <!-- PART II -->
  <div class="section-title">
    PHẦN II. Câu trắc nghiệm đúng sai.
    <span class="section-desc">(Thí sinh trả lời từ câu 1 đến câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai).</span>
  </div>

  ${bundle.questions
    .filter((q) => q.part === 2)
    .map((q, idx) => `
      <div class="question-item">
        <span class="question-title">Câu ${idx + 1}: </span>
        <span>${formatLatexForPdf(q.content)}</span>
        ${renderQuestionGraphicHtml(q.graphics)}
        <div class="subitem-list">
          ${(q.subItems || [])
            .map((sub) => `
              <div class="subitem-row">
                <strong>${sub.label})</strong> ${formatLatexForPdf(sub.content)}
                <span style="float: right; margin-right: 20px;">[ ] Đúng &nbsp;&nbsp;&nbsp; [ ] Sai</span>
              </div>
            `)
            .join('')}
        </div>
      </div>
    `)
    .join('')}

  <!-- PART III -->
  <div class="section-title">
    PHẦN III. Câu trắc nghiệm trả lời ngắn.
    <span class="section-desc">(Thí sinh trả lời từ câu 1 đến câu 6. Viết kết quả vào ô trả lời tương ứng).</span>
  </div>

  ${bundle.questions
    .filter((q) => q.part === 3)
    .map((q, idx) => `
      <div class="question-item">
        <span class="question-title">Câu ${idx + 1}: </span>
        <span>${formatLatexForPdf(q.content)}</span>
        ${renderQuestionGraphicHtml(q.graphics)}
        <div class="short-ans-box">
          Đáp số: ........................................................................................
        </div>
      </div>
    `)
    .join('')}

  <div class="divider">---------- HẾT ----------</div>
  ` : ''}

  ${(isFull || isGuideOnly) ? `
  <div class="${!isGuideOnly ? 'page-break' : ''}"></div>

  <table class="header-table" style="margin-bottom: 12px;">
    <tr>
      <td class="header-left">
        <div class="bold uppercase" style="font-size: 11pt;">${bundle.schoolName ? escapeHtml(bundle.schoolName) : 'TRƯỜNG THPT'}</div>
        <div class="bold" style="font-size: 11pt;">TỔ TOÁN - TIN HỌC</div>
      </td>
      <td class="header-right">
        <div class="bold uppercase" style="font-size: 12pt;">HƯỚNG DẪN CHẤM &amp; ĐÁP ÁN</div>
        <div class="italic" style="font-size: 10.5pt;">${escapeHtml(bundle.title)}</div>
      </td>
    </tr>
  </table>

  <div class="text-center bold uppercase" style="font-size: 14pt; margin-bottom: 4px;">
    ĐÁP ÁN VÀ THANG ĐIỂM CHI TIẾT
  </div>
  <div class="text-center italic" style="margin-bottom: 14px;">
    Đề kiểm tra môn Toán - Khối ${bundle.grade} - Mã đề ${variantCode}
  </div>

  <!-- PART 1 KEY -->
  <div class="bold" style="margin: 10px 0 6px 0;">I. ĐÁP ÁN PHẦN I (Mỗi câu đúng 0,25 điểm)</div>
  <table class="data-table">
    <tr>
      ${bundle.masterAnswerKey.part1.slice(0, 6).map((item) => `<th class="text-center">Câu ${item.questionNumber}</th>`).join('')}
    </tr>
    <tr>
      ${bundle.masterAnswerKey.part1.slice(0, 6).map((item) => `<td class="text-center bold" style="color: #1e3a8a;">${item.answer}</td>`).join('')}
    </tr>
    <tr>
      ${bundle.masterAnswerKey.part1.slice(6, 12).map((item) => `<th class="text-center">Câu ${item.questionNumber}</th>`).join('')}
    </tr>
    <tr>
      ${bundle.masterAnswerKey.part1.slice(6, 12).map((item) => `<td class="text-center bold" style="color: #1e3a8a;">${item.answer}</td>`).join('')}
    </tr>
  </table>

  <!-- PART 2 KEY -->
  <div class="bold" style="margin: 14px 0 6px 0;">II. ĐÁP ÁN PHẦN II (Trắc nghiệm đúng/sai - 4,0 điểm)</div>
  <div class="italic" style="font-size: 11pt; margin-bottom: 6px;">Quy tắc: Đúng 1 ý: 0,1đ | Đúng 2 ý: 0,25đ | Đúng 3 ý: 0,5đ | Đúng 4 ý: 1,0đ</div>
  <table class="data-table">
    <tr>
      <th class="text-center">Câu</th>
      <th class="text-center">Ý a)</th>
      <th class="text-center">Ý b)</th>
      <th class="text-center">Ý c)</th>
      <th class="text-center">Ý d)</th>
    </tr>
    ${bundle.masterAnswerKey.part2.map((item) => {
      const a = item.subItems.find(s => s.label === 'a')?.isCorrect ? 'ĐÚNG' : 'SAI';
      const b = item.subItems.find(s => s.label === 'b')?.isCorrect ? 'ĐÚNG' : 'SAI';
      const c = item.subItems.find(s => s.label === 'c')?.isCorrect ? 'ĐÚNG' : 'SAI';
      const d = item.subItems.find(s => s.label === 'd')?.isCorrect ? 'ĐÚNG' : 'SAI';
      return `
        <tr>
          <td class="text-center bold">Câu ${item.questionNumber}</td>
          <td class="text-center bold" style="color: ${a === 'ĐÚNG' ? '#047857' : '#b91c1c'}">${a}</td>
          <td class="text-center bold" style="color: ${b === 'ĐÚNG' ? '#047857' : '#b91c1c'}">${b}</td>
          <td class="text-center bold" style="color: ${c === 'ĐÚNG' ? '#047857' : '#b91c1c'}">${c}</td>
          <td class="text-center bold" style="color: ${d === 'ĐÚNG' ? '#047857' : '#b91c1c'}">${d}</td>
        </tr>
      `;
    }).join('')}
  </table>

  <!-- PART 3 KEY -->
  <div class="bold" style="margin: 14px 0 6px 0;">III. ĐÁP ÁN PHẦN III (Trả lời ngắn - Mỗi câu đúng 0,5 điểm)</div>
  <table class="data-table">
    <tr>
      ${bundle.masterAnswerKey.part3.map((item) => `<th class="text-center">Câu ${item.questionNumber}</th>`).join('')}
    </tr>
    <tr>
      ${bundle.masterAnswerKey.part3.map((item) => `<td class="text-center bold" style="color: #1d4ed8; font-size: 13pt;">${item.answer}</td>`).join('')}
    </tr>
  </table>
  ` : ''}

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\[', right: '\\]', display: true},
          {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false
      });
    });
  </script>
</body>
</html>
    `;
  },

  /**
   * Opens a new print window and triggers vector print-to-PDF
   */
  printPdf(bundle: ExamBundle, type: PdfDocumentType, variantCode: string = '101') {
    const html = this.generatePrintableHtml(bundle, type, variantCode);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép pop-up để xuất PDF.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for KaTeX to render before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 800);
  },
};

function renderQuestionGraphicHtml(graphics?: MathGraphicConfig): string {
  if (!graphics) return '';
  if (graphics.exportedImageData) {
    return `<div style="text-align:center;margin:8px 0;"><img src="${graphics.exportedImageData}" style="max-height:160px;max-width:320px;border-radius:4px;" /></div>`;
  }
  if (graphics.svgData) {
    return `<div style="text-align:center;margin:8px 0;">${graphics.svgData}</div>`;
  }
  try {
    const svg = exportGraphicToSvg(graphics, 320, 180);
    return `<div style="text-align:center;margin:8px 0;">${svg}</div>`;
  } catch {
    return '';
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatLatexForPdf(text: string): string {
  if (!text) return '';
  const normalized = normalizeLatexString(text);
  return escapeHtml(normalized);
}
