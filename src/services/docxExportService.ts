import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  Math as DocxMath,
  MathRun,
  MathFraction,
  MathRadical,
  ImageRun,
} from 'docx';
import { ExamBundle, Question, MatrixItem, SpecificationItem, ExamVariant } from '../types';
import { exportGraphicToPngDataUrl } from './mathGraphics/renderEngine';

export type DocxTemplateType = 'full' | 'exam_only' | 'key_only' | 'matrix_spec';

export interface DocxExportOptions {
  template: DocxTemplateType;
  selectedVariantCode?: string;
  schoolName?: string;
  fontSizePt?: number; // default 13
  includeWatermark?: boolean;
}

/**
 * Utility to convert raw LaTeX strings into readable mathematical typography for Word
 */
export function cleanLatexForDocx(content: string): string {
  if (!content) return '';

  let text = content;

  // Common replacements for clean mathematical display
  text = text.replace(/\\mathbb\{R\}/g, 'ℝ');
  text = text.replace(/\\mathbb\{Z\}/g, 'ℤ');
  text = text.replace(/\\mathbb\{N\}/g, 'ℕ');
  text = text.replace(/\\pm/g, '±');
  text = text.replace(/\\le/g, '≤');
  text = text.replace(/\\ge/g, '≥');
  text = text.replace(/\\ne/g, '≠');
  text = text.replace(/\\approx/g, '≈');
  text = text.replace(/\\in/g, '∈');
  text = text.replace(/\\notin/g, '∉');
  text = text.replace(/\\subset/g, '⊂');
  text = text.replace(/\\infty/g, '∞');
  text = text.replace(/\\alpha/g, 'α');
  text = text.replace(/\\beta/g, 'β');
  text = text.replace(/\\gamma/g, 'γ');
  text = text.replace(/\\delta/g, 'δ');
  text = text.replace(/\\Delta/g, 'Δ');
  text = text.replace(/\\pi/g, 'π');
  text = text.replace(/\\times/g, '×');
  text = text.replace(/\\cdot/g, '·');
  text = text.replace(/\\circ/g, '°');
  text = text.replace(/\\iff/g, ' ⇔ ');
  text = text.replace(/\\implies/g, ' ⇒ ');
  text = text.replace(/\\to/g, ' → ');
  text = text.replace(/\\quad/g, '  ');
  text = text.replace(/\\text\{([^{}]+)\}/g, '$1');
  text = text.replace(/\\vec\{([^{}]+)\}/g, '$1⃗');
  text = text.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  text = text.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  text = text.replace(/\\max_\{[^{}]+\}/g, 'max');
  text = text.replace(/\\min_\{[^{}]+\}/g, 'min');
  text = text.replace(/\\lim_\{[^{}]+\}/g, 'lim');
  text = text.replace(/\\int/g, '∫');

  // Strip remaining $ signs
  text = text.replace(/\$/g, '');

  return text;
}

/**
 * Convert Base64 Data URL to Uint8Array for ImageRun
 */
export function convertDataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const base64Index = dataUrl.indexOf(';base64,');
    if (base64Index === -1) return null;
    const base64Data = dataUrl.substring(base64Index + 8);
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Convert LaTeX mathematical fragment into native Word OMML Math container
 */
export function convertLatexToDocxMath(latex: string): DocxMath | null {
  try {
    const mathChildren: any[] = [];
    const trimmed = latex.trim();

    // Check fraction \frac{a}{b}
    if (trimmed.includes('\\frac{')) {
      const fracRegex = /\\frac\{([^{}]+)\}\{([^{}]+)\}/;
      const match = trimmed.match(fracRegex);
      if (match) {
        const parts = trimmed.split(fracRegex);
        if (parts[0]) mathChildren.push(new MathRun(cleanLatexForDocx(parts[0])));
        mathChildren.push(
          new MathFraction({
            numerator: [new MathRun(cleanLatexForDocx(match[1]))],
            denominator: [new MathRun(cleanLatexForDocx(match[2]))],
          })
        );
        if (parts[3]) mathChildren.push(new MathRun(cleanLatexForDocx(parts[3])));
        return new DocxMath({ children: mathChildren });
      }
    }

    // Check radical \sqrt{...}
    if (trimmed.includes('\\sqrt{')) {
      const sqrtRegex = /\\sqrt\{([^{}]+)\}/;
      const match = trimmed.match(sqrtRegex);
      if (match) {
        const parts = trimmed.split(sqrtRegex);
        if (parts[0]) mathChildren.push(new MathRun(cleanLatexForDocx(parts[0])));
        mathChildren.push(
          new MathRadical({
            children: [new MathRun(cleanLatexForDocx(match[1]))],
          })
        );
        if (parts[2]) mathChildren.push(new MathRun(cleanLatexForDocx(parts[2])));
        return new DocxMath({ children: mathChildren });
      }
    }

    // Standard MathRun with typography cleaned inside DocxMath
    return new DocxMath({
      children: [new MathRun(cleanLatexForDocx(trimmed))],
    });
  } catch {
    return null;
  }
}

/**
 * Parses mixed paragraph text and LaTeX expressions ($...$) into TextRun and DocxMath objects
 */
export function parseTextWithMathRuns(
  rawText: string,
  fontHalfPoints: number,
  baseTextRunOptions: Record<string, any> = {}
): (TextRun | DocxMath)[] {
  if (!rawText) return [];

  const segments = rawText.split(/(\$[^$]+\$)/g);
  const elements: (TextRun | DocxMath)[] = [];

  for (const seg of segments) {
    if (!seg) continue;
    if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
      const mathInner = seg.slice(1, -1).trim();
      const mathObj = convertLatexToDocxMath(mathInner);
      if (mathObj) {
        elements.push(mathObj);
        continue;
      }
    }

    elements.push(
      new TextRun({
        text: cleanLatexForDocx(seg),
        font: 'Times New Roman',
        size: fontHalfPoints,
        ...baseTextRunOptions,
      })
    );
  }

  return elements;
}

/**
 * Service to generate authentic .docx files complying with MOET standards
 */
export const docxExportService = {
  /**
   * Generates a genuine .docx file and returns a Blob
   */
  async generateDocxBlob(bundle: ExamBundle, options: DocxExportOptions): Promise<Blob> {
    const fontSize = options.fontSizePt || 13;
    const fontHalfPoints = fontSize * 2;
    const variantCode = options.selectedVariantCode || bundle.variants[0]?.code || '101';
    const schoolName = (options.schoolName ?? bundle.schoolName ?? '').trim();

    const sections: any[] = [];

    // Common Page Layout Settings (A4, 20mm Top/Bottom/Left, 15mm Right)
    const pageMargins = {
      top: 1134, // 20mm
      bottom: 1134, // 20mm
      left: 1134, // 20mm
      right: 850, // 15mm
    };

    const header = new Header({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `${bundle.title} - Mã đề: ${variantCode}`,
              font: 'Times New Roman',
              size: 18, // 9pt
              color: '888888',
              italics: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
      ],
    });

    const footer = new Footer({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Trang ',
              font: 'Times New Roman',
              size: 20, // 10pt
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              font: 'Times New Roman',
              size: 20,
            }),
            new TextRun({
              text: ' / ',
              font: 'Times New Roman',
              size: 20,
            }),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
              font: 'Times New Roman',
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

    // -------------------------------------------------------------
    // SECTION 1: EXAM PAPER (ĐỀ KIỂM TRA)
    // -------------------------------------------------------------
    if (options.template === 'full' || options.template === 'exam_only') {
      const examChildren: any[] = [];

      // 1. Header Table (Sở / Trường - Đề thi / Mã đề)
      examChildren.push(
        this.createExamHeaderTable(bundle, schoolName, variantCode, fontHalfPoints)
      );

      examChildren.push(
        new Paragraph({
          text: '',
          spacing: { after: 180 },
        })
      );

      // Student info block (for student exam)
      if (options.template === 'exam_only' || options.template === 'full') {
        examChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Họ và tên thí sinh: ............................................................................  Số báo danh: .......................  Lớp: ...........',
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
                italics: true,
              }),
            ],
            spacing: { after: 240 },
          })
        );
      }

      // Divider line
      examChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '--------------------------------------------------------------------------------------------------------------------',
              font: 'Times New Roman',
              size: 16,
              color: 'AAAAAA',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      // Extract questions for this specific variant
      const targetVariant = bundle.variants.find((v) => v.code === variantCode);
      const activeQuestions =
        targetVariant?.questions && targetVariant.questions.length > 0
          ? targetVariant.questions
          : bundle.questions;

      // Part I
      const part1Questions = activeQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice');
      if (part1Questions.length > 0) {
        examChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.',
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
              new TextRun({
                text: ` (Thí sinh trả lời từ câu 1 đến câu ${part1Questions.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án).`,
                italics: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            spacing: { before: 180, after: 120 },
          })
        );

        part1Questions.forEach((q, idx) => {
          examChildren.push(
            ...this.createMultipleChoiceQuestionParagraph(q, idx + 1, fontHalfPoints)
          );
        });
      }

      // Part II
      const part2Questions = activeQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false');
      if (part2Questions.length > 0) {
        examChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN II. Câu trắc nghiệm đúng sai.',
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
              new TextRun({
                text: ` (Thí sinh trả lời từ câu 1 đến câu ${part2Questions.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai).`,
                italics: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        );

        part2Questions.forEach((q, idx) => {
          examChildren.push(...this.createTrueFalseQuestionParagraphs(q, idx + 1, fontHalfPoints));
        });
      }

      // Part III
      const part3Questions = activeQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer');
      if (part3Questions.length > 0) {
        examChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN III. Câu trắc nghiệm trả lời ngắn.',
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
              new TextRun({
                text: ` (Thí sinh trả lời từ câu 1 đến câu ${part3Questions.length}. Viết câu trả lời vào ô quy định).`,
                italics: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        );

        part3Questions.forEach((q, idx) => {
          examChildren.push(
            ...this.createShortAnswerQuestionParagraph(q, idx + 1, fontHalfPoints)
          );
        });
      }

      // End of Exam Marker
      examChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '---------- HẾT ----------',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 300 },
        })
      );

      sections.push({
        properties: {
          page: {
            margin: pageMargins,
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: examChildren,
      });
    }

    // -------------------------------------------------------------
    // SECTION 2: MATRIX & SPECIFICATION (MA TRẬN & ĐẶC TẢ ĐỀ THI)
    // -------------------------------------------------------------
    if (options.template === 'full' || options.template === 'matrix_spec') {
      const specChildren: any[] = [];

      // School & Department heading if schoolName is provided
      if (schoolName) {
        specChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: schoolName.toUpperCase(),
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
              new TextRun({
                text: '   |   TỔ TOÁN - TIN HỌC',
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
          })
        );
      }

      // Matrix Heading
      specChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ MÔN TOÁN',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints + 4,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Môn: Toán - Khối: ${bundle.grade} - Thời gian làm bài: ${bundle.durationMinutes} phút`,
              font: 'Times New Roman',
              size: fontHalfPoints,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      // Matrix Table
      specChildren.push(this.createMatrixTable(bundle.matrixItems, fontHalfPoints));

      specChildren.push(
        new Paragraph({
          text: '',
          spacing: { after: 240 },
        })
      );

      // School & Department heading if schoolName is provided
      if (schoolName) {
        specChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: schoolName.toUpperCase(),
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
              new TextRun({
                text: '   |   TỔ TOÁN - TIN HỌC',
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 60 },
          })
        );
      }

      // Specification Heading
      specChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ MÔN TOÁN',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints + 4,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Chương trình Giáo dục phổ thông 2018 - Môn Toán Lớp ${bundle.grade}`,
              font: 'Times New Roman',
              size: fontHalfPoints,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      // Specification Table
      specChildren.push(this.createSpecificationTable(bundle.specifications, fontHalfPoints));

      sections.push({
        properties: {
          page: {
            margin: pageMargins,
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: specChildren,
      });
    }

    // -------------------------------------------------------------
    // SECTION 3: ANSWER KEY & GRADING GUIDE (ĐÁP ÁN & HƯỚNG DẪN CHẤM)
    // -------------------------------------------------------------
    if (options.template === 'full' || options.template === 'key_only') {
      const keyChildren: any[] = [];

      if (schoolName) {
        keyChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: schoolName.toUpperCase(),
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
              new TextRun({
                text: '   |   TỔ TOÁN - TIN HỌC',
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
          })
        );
      }

      keyChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM ĐỀ KIỂM TRA',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints + 4,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Mã đề: ${variantCode} - Thang điểm 10.0 - Thời gian: ${bundle.durationMinutes} phút`,
              font: 'Times New Roman',
              size: fontHalfPoints,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      // Answer Tables
      keyChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'I. BẢNG ĐÁP ÁN PHẦN I (Trắc nghiệm nhiều lựa chọn - 3,0 điểm)',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints,
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );

      keyChildren.push(this.createPart1AnswerTable(bundle, fontHalfPoints));

      keyChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'II. BẢNG ĐÁP ÁN PHẦN II (Trắc nghiệm đúng/sai - 4,0 điểm)',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints,
            }),
          ],
          spacing: { before: 180, after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Quy tắc chấm: Đúng 1 ý: 0,1đ | Đúng 2 ý: 0,25đ | Đúng 3 ý: 0,5đ | Đúng 4 ý: 1,0đ',
              italics: true,
              font: 'Times New Roman',
              size: fontHalfPoints - 2,
            }),
          ],
          spacing: { after: 100 },
        })
      );

      keyChildren.push(this.createPart2AnswerTable(bundle, fontHalfPoints));

      keyChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'III. BẢNG ĐÁP ÁN PHẦN III (Trả lời ngắn - 3,0 điểm)',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints,
            }),
          ],
          spacing: { before: 180, after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Mỗi câu đúng được 0,5 điểm. Chấp nhận các biểu diễn tương đương.',
              italics: true,
              font: 'Times New Roman',
              size: fontHalfPoints - 2,
            }),
          ],
          spacing: { after: 100 },
        })
      );

      keyChildren.push(this.createPart3AnswerTable(bundle, fontHalfPoints));

      // Detailed step-by-step solutions
      keyChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'IV. HƯỚNG DẪN GIẢI VÀ BIỂU ĐIỂM CHI TIẾT',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints + 2,
            }),
          ],
          spacing: { before: 240, after: 140 },
        })
      );

      bundle.questions.forEach((q, idx) => {
        keyChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Câu ${idx + 1} (${q.points} điểm): `,
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
              new TextRun({
                text: cleanLatexForDocx(q.content),
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
            ],
            spacing: { before: 120, after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Lời giải: ',
                bold: true,
                italics: true,
                font: 'Times New Roman',
                size: fontHalfPoints,
                color: '1E3A8A',
              }),
              new TextRun({
                text: cleanLatexForDocx(q.explanation || 'Xem đáp án trong bảng.'),
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
            ],
            spacing: { after: 140 },
          })
        );
      });

      sections.push({
        properties: {
          page: {
            margin: pageMargins,
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: keyChildren,
      });
    }

    const doc = new Document({
      sections,
    });

    return await Packer.toBlob(doc);
  },

  /**
   * Helper: Exam Header Table
   */
  createExamHeaderTable(
    bundle: ExamBundle,
    schoolName: string,
    variantCode: string,
    fontHalfPoints: number
  ): Table {
    const borders = {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    };

    const managingAgency = bundle.managingAgency?.trim() || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO';
    const dept = bundle.department?.trim() || 'TỔ TOÁN - TIN HỌC';
    const academicYear = bundle.academicYear?.trim() || 'NĂM HỌC 2026 - 2027';

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 48, type: WidthType.PERCENTAGE },
              borders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: managingAgency.toUpperCase(),
                      font: 'Times New Roman',
                      size: fontHalfPoints - 4,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: schoolName ? schoolName.toUpperCase() : 'TRƯỜNG THPT',
                      bold: true,
                      font: 'Times New Roman',
                      size: fontHalfPoints - 2,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: dept.toUpperCase(),
                      bold: true,
                      font: 'Times New Roman',
                      size: fontHalfPoints - 2,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `(Đề thi có ${bundle.questions.length} câu / ${bundle.pageCount || 4} trang)`,
                      italics: true,
                      font: 'Times New Roman',
                      size: fontHalfPoints - 4,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40 },
                }),
              ],
            }),
            new TableCell({
              width: { size: 52, type: WidthType.PERCENTAGE },
              borders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: (bundle.examPeriod || bundle.title).toUpperCase(),
                      bold: true,
                      font: 'Times New Roman',
                      size: fontHalfPoints,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: academicYear.toUpperCase(),
                      bold: true,
                      font: 'Times New Roman',
                      size: fontHalfPoints - 2,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Môn: ${bundle.subject || 'Toán'} - Lớp: ${bundle.grade}`,
                      font: 'Times New Roman',
                      size: fontHalfPoints - 2,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Thời gian làm bài: ${bundle.durationMinutes} phút (không kể phát đề)`,
                      italics: true,
                      font: 'Times New Roman',
                      size: fontHalfPoints - 2,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `MÃ ĐỀ THI: ${variantCode}`,
                      bold: true,
                      font: 'Times New Roman',
                      size: fontHalfPoints + 1,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40 },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  },

  /**
   * Helper: Multiple Choice Question
   */
  createMultipleChoiceQuestionParagraph(q: Question, number: number, fontHalfPoints: number): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Question statement with KaTeX/LaTeX parsed to native OMML / TextRuns
    const runs: (TextRun | DocxMath)[] = [
      new TextRun({
        text: `Câu ${number}: `,
        bold: true,
        font: 'Times New Roman',
        size: fontHalfPoints,
      }),
      ...parseTextWithMathRuns(q.content, fontHalfPoints),
    ];

    paragraphs.push(
      new Paragraph({
        children: runs,
        spacing: { before: 120, after: 60 },
      })
    );

    // If there is an attached diagram/graphic, embed ImageRun
    const graphicData = q.graphics?.exportedImageData || (q.graphics ? exportGraphicToPngDataUrl(q.graphics, 360, 220) : null);
    if (graphicData) {
      const bytes = convertDataUrlToUint8Array(graphicData);
      if (bytes) {
        paragraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: bytes,
                type: 'png',
                transformation: {
                  width: 300,
                  height: 180,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 80 },
          })
        );
      }
    }

    // Render options A, B, C, D
    if (q.options && q.options.length > 0) {
      const isShort = q.options.every((opt) => opt.length < 22);

      if (isShort && q.options.length === 4) {
        // Render 4 options on 1 or 2 lines
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'A. ', bold: true, font: 'Times New Roman', size: fontHalfPoints }),
              ...parseTextWithMathRuns(q.options[0], fontHalfPoints),
              new TextRun({ text: '          B. ', bold: true, font: 'Times New Roman', size: fontHalfPoints }),
              ...parseTextWithMathRuns(q.options[1], fontHalfPoints),
            ],
            spacing: { before: 30, after: 30 },
            indent: { left: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'C. ', bold: true, font: 'Times New Roman', size: fontHalfPoints }),
              ...parseTextWithMathRuns(q.options[2], fontHalfPoints),
              new TextRun({ text: '          D. ', bold: true, font: 'Times New Roman', size: fontHalfPoints }),
              ...parseTextWithMathRuns(q.options[3], fontHalfPoints),
            ],
            spacing: { before: 30, after: 80 },
            indent: { left: 240 },
          })
        );
      } else {
        q.options.forEach((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${letter}. `,
                  bold: true,
                  font: 'Times New Roman',
                  size: fontHalfPoints,
                }),
                ...parseTextWithMathRuns(opt, fontHalfPoints),
              ],
              spacing: { before: 30, after: 30 },
              indent: { left: 240 },
            })
          );
        });
      }
    }

    return paragraphs;
  },

  /**
   * Helper: True / False Question
   */
  createTrueFalseQuestionParagraphs(q: Question, number: number, fontHalfPoints: number): Paragraph[] {
    const result: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: `Câu ${number}: `,
            bold: true,
            font: 'Times New Roman',
            size: fontHalfPoints,
          }),
          ...parseTextWithMathRuns(q.content, fontHalfPoints),
        ],
        spacing: { before: 120, after: 60 },
      }),
    ];

    const graphicData = q.graphics?.exportedImageData || (q.graphics ? exportGraphicToPngDataUrl(q.graphics, 360, 220) : null);
    if (graphicData) {
      const bytes = convertDataUrlToUint8Array(graphicData);
      if (bytes) {
        result.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: bytes,
                type: 'png',
                transformation: {
                  width: 300,
                  height: 180,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 80 },
          })
        );
      }
    }

    (q.subItems || []).forEach((sub) => {
      result.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `    ${sub.label}) `,
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints,
            }),
            ...parseTextWithMathRuns(sub.content, fontHalfPoints),
          ],
          spacing: { before: 40, after: 40 },
          indent: { left: 240 },
        })
      );
    });

    return result;
  },

  /**
   * Helper: Short Answer Question
   */
  createShortAnswerQuestionParagraph(q: Question, number: number, fontHalfPoints: number): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: `Câu ${number}: `,
            bold: true,
            font: 'Times New Roman',
            size: fontHalfPoints,
          }),
          ...parseTextWithMathRuns(q.content, fontHalfPoints),
        ],
        spacing: { before: 120, after: 60 },
      }),
    ];

    const graphicData = q.graphics?.exportedImageData || (q.graphics ? exportGraphicToPngDataUrl(q.graphics, 360, 220) : null);
    if (graphicData) {
      const bytes = convertDataUrlToUint8Array(graphicData);
      if (bytes) {
        paragraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: bytes,
                type: 'png',
                transformation: {
                  width: 300,
                  height: 180,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 80 },
          })
        );
      }
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '    Đáp số: .................................................',
            italics: true,
            font: 'Times New Roman',
            size: fontHalfPoints - 2,
          }),
        ],
        spacing: { before: 40, after: 120 },
      })
    );

    return paragraphs;
  },

  /**
   * Helper: Matrix Table for Docx
   */
  createMatrixTable(items: MatrixItem[], fontHalfPoints: number): Table {
    const totalRec = items.reduce((s, i) => s + (i.recognition || 0), 0);
    const totalComp = items.reduce((s, i) => s + (i.comprehension || 0), 0);
    const totalApp = items.reduce((s, i) => s + (i.application || 0), 0);
    const totalHigh = items.reduce((s, i) => s + (i.highApplication || 0), 0);
    const totalQ = totalRec + totalComp + totalApp + totalHigh;
    const totalPts = items.reduce((s, i) => s + (i.totalPoints || 0), 0);

    const rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            children: [makePara('TT', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 6, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [makePara('Chủ đề / Đơn vị kiến thức', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [makePara('Nhận biết', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [makePara('Thông hiểu', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [makePara('Vận dụng', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [makePara('Vận dụng cao', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [makePara('Tổng câu', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 7, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [makePara('Tổng điểm', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 7, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ];

    items.forEach((item, idx) => {
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [makePara(String(idx + 1), { align: AlignmentType.CENTER })] }),
            new TableCell({
              children: [
                makePara(item.chapter, { bold: true }),
                makePara(item.topic, { italics: true, size: fontHalfPoints - 4 }),
              ],
            }),
            new TableCell({ children: [makePara(String(item.recognition), { align: AlignmentType.CENTER })] }),
            new TableCell({ children: [makePara(String(item.comprehension), { align: AlignmentType.CENTER })] }),
            new TableCell({ children: [makePara(String(item.application), { align: AlignmentType.CENTER })] }),
            new TableCell({ children: [makePara(String(item.highApplication), { align: AlignmentType.CENTER })] }),
            new TableCell({ children: [makePara(String(item.totalQuestions), { align: AlignmentType.CENTER, bold: true })] }),
            new TableCell({ children: [makePara(`${item.totalPoints.toFixed(1)}đ`, { align: AlignmentType.RIGHT, bold: true })] }),
          ],
        })
      );
    });

    // Total Row
    rows.push(
      new TableRow({
        children: [
          new TableCell({ children: [makePara('Tổng', { bold: true, align: AlignmentType.CENTER })] }),
          new TableCell({ children: [makePara('TỔNG CỘNG TOÀN BỘ ĐỀ', { bold: true })] }),
          new TableCell({ children: [makePara(`${totalRec} (${((totalRec / totalQ) * 100).toFixed(0)}%)`, { bold: true, align: AlignmentType.CENTER })] }),
          new TableCell({ children: [makePara(`${totalComp} (${((totalComp / totalQ) * 100).toFixed(0)}%)`, { bold: true, align: AlignmentType.CENTER })] }),
          new TableCell({ children: [makePara(`${totalApp} (${((totalApp / totalQ) * 100).toFixed(0)}%)`, { bold: true, align: AlignmentType.CENTER })] }),
          new TableCell({ children: [makePara(`${totalHigh} (${((totalHigh / totalQ) * 100).toFixed(0)}%)`, { bold: true, align: AlignmentType.CENTER })] }),
          new TableCell({ children: [makePara(`${totalQ} câu`, { bold: true, align: AlignmentType.CENTER })] }),
          new TableCell({ children: [makePara(`${totalPts.toFixed(1)}đ`, { bold: true, align: AlignmentType.RIGHT })] }),
        ],
      })
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    });
  },

  /**
   * Helper: Specification Table for Docx
   */
  createSpecificationTable(specs: SpecificationItem[], fontHalfPoints: number): Table {
    const rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ children: [makePara('TT', { bold: true, align: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Nội dung kiến thức', { bold: true, align: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Yêu cầu cần đạt chuẩn GDPT', { bold: true, align: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Mức độ', { bold: true, align: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Dạng câu', { bold: true, align: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Câu số', { bold: true, align: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
        ],
      }),
    ];

    const levelLabels: Record<string, string> = {
      recognition: 'Nhận biết',
      comprehension: 'Thông hiểu',
      application: 'Vận dụng',
      high_application: 'Vận dụng cao',
    };

    const typeLabels: Record<string, string> = {
      multiple_choice: 'Nhiều L.C',
      true_false: 'Đúng / Sai',
      short_answer: 'Trả lời ngắn',
      essay: 'Tự luận',
    };

    specs.forEach((s, idx) => {
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [makePara(String(idx + 1), { align: AlignmentType.CENTER })] }),
            new TableCell({ children: [makePara(`${s.chapter}\n- ${s.topic}`)] }),
            new TableCell({ children: [makePara(s.learningObjective)] }),
            new TableCell({ children: [makePara(levelLabels[s.cognitiveLevel] || s.cognitiveLevel, { align: AlignmentType.CENTER })] }),
            new TableCell({ children: [makePara(typeLabels[s.questionType] || s.questionType, { align: AlignmentType.CENTER })] }),
            new TableCell({ children: [makePara(`Câu ${s.questionNumber}`, { align: AlignmentType.CENTER, bold: true })] }),
          ],
        })
      );
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    });
  },

  /**
   * Helper: Part 1 Answer Table (12 MC)
   */
  createPart1AnswerTable(bundle: ExamBundle, fontHalfPoints: number): Table {
    const part1 = bundle.masterAnswerKey.part1;
    const colCount = Math.min(6, part1.length);
    const rows: TableRow[] = [];

    // Chunk into 6 per row
    for (let i = 0; i < part1.length; i += 6) {
      const slice = part1.slice(i, i + 6);

      // Question Numbers
      rows.push(
        new TableRow({
          children: slice.map((item) => (
            new TableCell({
              children: [makePara(`Câu ${item.questionNumber}`, { bold: true, align: AlignmentType.CENTER })],
              width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
            })
          )),
        })
      );

      // Answers
      rows.push(
        new TableRow({
          children: slice.map((item) => (
            new TableCell({
              children: [makePara(item.answer, { bold: true, align: AlignmentType.CENTER, size: fontHalfPoints + 2 })],
              width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
            })
          )),
        })
      );
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    });
  },

  /**
   * Helper: Part 2 Answer Table (4 TF, 16 sub-items)
   */
  createPart2AnswerTable(bundle: ExamBundle, fontHalfPoints: number): Table {
    const part2 = bundle.masterAnswerKey.part2;
    const rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ children: [makePara('Câu', { bold: true, align: AlignmentType.CENTER })], width: { size: 16, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Ý a)', { bold: true, align: AlignmentType.CENTER })], width: { size: 21, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Ý b)', { bold: true, align: AlignmentType.CENTER })], width: { size: 21, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Ý c)', { bold: true, align: AlignmentType.CENTER })], width: { size: 21, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [makePara('Ý d)', { bold: true, align: AlignmentType.CENTER })], width: { size: 21, type: WidthType.PERCENTAGE } }),
        ],
      }),
    ];

    part2.forEach((item) => {
      const subMap: Record<string, boolean> = {};
      item.subItems.forEach((sub) => {
        subMap[sub.label] = sub.isCorrect;
      });

      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [makePara(`Câu ${item.questionNumber}`, { bold: true, align: AlignmentType.CENTER })] }),
            new TableCell({ children: [makePara(subMap['a'] ? 'ĐÚNG' : 'SAI', { bold: true, align: AlignmentType.CENTER, color: subMap['a'] ? '059669' : 'DC2626' })] }),
            new TableCell({ children: [makePara(subMap['b'] ? 'ĐÚNG' : 'SAI', { bold: true, align: AlignmentType.CENTER, color: subMap['b'] ? '059669' : 'DC2626' })] }),
            new TableCell({ children: [makePara(subMap['c'] ? 'ĐÚNG' : 'SAI', { bold: true, align: AlignmentType.CENTER, color: subMap['c'] ? '059669' : 'DC2626' })] }),
            new TableCell({ children: [makePara(subMap['d'] ? 'ĐÚNG' : 'SAI', { bold: true, align: AlignmentType.CENTER, color: subMap['d'] ? '059669' : 'DC2626' })] }),
          ],
        })
      );
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    });
  },

  /**
   * Helper: Part 3 Answer Table (6 Short Answer)
   */
  createPart3AnswerTable(bundle: ExamBundle, fontHalfPoints: number): Table {
    const part3 = bundle.masterAnswerKey.part3;
    const rows: TableRow[] = [
      new TableRow({
        children: part3.map((item) => (
          new TableCell({
            children: [makePara(`Câu ${item.questionNumber}`, { bold: true, align: AlignmentType.CENTER })],
            width: { size: Math.floor(100 / part3.length), type: WidthType.PERCENTAGE },
          })
        )),
      }),
      new TableRow({
        children: part3.map((item) => (
          new TableCell({
            children: [makePara(item.answer, { bold: true, align: AlignmentType.CENTER, color: '1D4ED8' })],
            width: { size: Math.floor(100 / part3.length), type: WidthType.PERCENTAGE },
          })
        )),
      }),
    ];

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    });
  },

  /**
   * Generates a single consolidated .docx containing all exam variants (e.g., 101 to 10N)
   */
  async generateAllVariantsBlob(bundle: ExamBundle, options: DocxExportOptions): Promise<Blob> {
    const fontSize = options.fontSizePt || 13;
    const fontHalfPoints = fontSize * 2;
    const schoolName = (options.schoolName ?? bundle.schoolName ?? '').trim();

    const pageMargins = {
      top: 1134,
      bottom: 1134,
      left: 1134,
      right: 850,
    };

    const sections: any[] = [];
    const variants = bundle.variants.length > 0 ? bundle.variants : [{ code: '101', questionIds: [], orderMap: [], answerKeyPart1: {}, answerKeyPart2: {}, answerKeyPart3: {} }];

    for (const variant of variants) {
      const examChildren: any[] = [];
      const vCode = variant.code;

      const header = new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `${bundle.title} - Mã đề: ${vCode}`,
                font: 'Times New Roman',
                size: 18,
                color: '888888',
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      });

      const footer = new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Trang ', font: 'Times New Roman', size: 20 }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20 }),
              new TextRun({ text: ' / ', font: 'Times New Roman', size: 20 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Times New Roman', size: 20 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      });

      // Exam Header
      examChildren.push(this.createExamHeaderTable(bundle, schoolName, vCode, fontHalfPoints));
      examChildren.push(new Paragraph({ text: '', spacing: { after: 140 } }));

      // Student info block
      examChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Họ và tên thí sinh: ............................................................................  Số báo danh: .......................  Lớp: ...........',
              font: 'Times New Roman',
              size: fontHalfPoints - 2,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        })
      );

      examChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '--------------------------------------------------------------------------------------------------------------------',
              font: 'Times New Roman',
              size: 16,
              color: 'AAAAAA',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
        })
      );

      const activeQuestions = variant.questions && variant.questions.length > 0 ? variant.questions : bundle.questions;

      // Part I
      const p1 = activeQuestions.filter((q) => q.part === 1 || q.questionType === 'multiple_choice');
      if (p1.length > 0) {
        examChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.',
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
              new TextRun({
                text: ` (Thí sinh trả lời từ câu 1 đến câu ${p1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án).`,
                italics: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            spacing: { before: 160, after: 100 },
          })
        );
        p1.forEach((q, idx) => {
          examChildren.push(...this.createMultipleChoiceQuestionParagraph(q, idx + 1, fontHalfPoints));
        });
      }

      // Part II
      const p2 = activeQuestions.filter((q) => q.part === 2 || q.questionType === 'true_false');
      if (p2.length > 0) {
        examChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN II. Câu trắc nghiệm đúng sai.',
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
              new TextRun({
                text: ` (Thí sinh trả lời từ câu 1 đến câu ${p2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai).`,
                italics: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
        p2.forEach((q, idx) => {
          examChildren.push(...this.createTrueFalseQuestionParagraphs(q, idx + 1, fontHalfPoints));
        });
      }

      // Part III
      const p3 = activeQuestions.filter((q) => q.part === 3 || q.questionType === 'short_answer');
      if (p3.length > 0) {
        examChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN III. Câu trắc nghiệm trả lời ngắn.',
                bold: true,
                font: 'Times New Roman',
                size: fontHalfPoints,
              }),
              new TextRun({
                text: ` (Thí sinh trả lời từ câu 1 đến câu ${p3.length}. Viết câu trả lời vào ô quy định).`,
                italics: true,
                font: 'Times New Roman',
                size: fontHalfPoints - 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
        p3.forEach((q, idx) => {
          examChildren.push(...this.createShortAnswerQuestionParagraph(q, idx + 1, fontHalfPoints));
        });
      }

      examChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '---------- HẾT ----------',
              bold: true,
              font: 'Times New Roman',
              size: fontHalfPoints,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
        })
      );

      sections.push({
        properties: { page: { margin: pageMargins } },
        headers: { default: header },
        footers: { default: footer },
        children: examChildren,
      });
    }

    const doc = new Document({ sections });
    return await Packer.toBlob(doc);
  },

  /**
   * Generates a comparison matrix .docx document comparing all variant answer keys side-by-side
   */
  async generateAnswerKeysMatrixBlob(bundle: ExamBundle): Promise<Blob> {
    const fontHalfPoints = 22; // 11pt
    const pageMargins = { top: 1134, bottom: 1134, left: 1134, right: 850 };
    const variants = bundle.variants.length > 0 ? bundle.variants : [{ code: '101', questionIds: [], orderMap: [], answerKeyPart1: {}, answerKeyPart2: {}, answerKeyPart3: {} }];
    const vCodes = variants.map((v) => v.code);

    const children: any[] = [];

    // Title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'BẢNG ĐỐI CHIẾU ĐÁP ÁN CÁC MÃ ĐỀ KIỂM TRA',
            bold: true,
            font: 'Times New Roman',
            size: 28, // 14pt
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${bundle.title} - ${bundle.academicYear || 'NĂM HỌC 2026 - 2027'} - Môn Toán Lớp ${bundle.grade}`,
            italics: true,
            font: 'Times New Roman',
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // PART I Table
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'I. BẢNG ĐÁP ÁN PHẦN I (TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN)',
            bold: true,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
        spacing: { before: 160, after: 80 },
      })
    );

    const p1Rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            children: [makePara('Câu', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
          ...variants.map((v) =>
            new TableCell({
              children: [makePara(`Mã ${v.code}`, { bold: true, align: AlignmentType.CENTER })],
              width: { size: Math.floor(90 / variants.length), type: WidthType.PERCENTAGE },
            })
          ),
        ],
      }),
    ];

    const p1Count = bundle.masterAnswerKey.part1.length || 12;
    for (let i = 1; i <= p1Count; i++) {
      p1Rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [makePara(String(i), { bold: true, align: AlignmentType.CENTER })],
            }),
            ...variants.map((v) => {
              const ans = v.answerKeyPart1?.[i] || bundle.masterAnswerKey.part1.find((p) => p.questionNumber === i)?.answer || '-';
              return new TableCell({
                children: [makePara(ans, { bold: true, align: AlignmentType.CENTER, color: '1D4ED8' })],
              });
            }),
          ],
        })
      );
    }
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: p1Rows }));

    // PART II Table
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'II. BẢNG ĐÁP ÁN PHẦN II (TRẮC NGHIỆM ĐÚNG SAI)',
            bold: true,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
        spacing: { before: 240, after: 80 },
      })
    );

    const p2Rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            children: [makePara('Câu - Ý', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 12, type: WidthType.PERCENTAGE },
          }),
          ...variants.map((v) =>
            new TableCell({
              children: [makePara(`Mã ${v.code}`, { bold: true, align: AlignmentType.CENTER })],
              width: { size: Math.floor(88 / variants.length), type: WidthType.PERCENTAGE },
            })
          ),
        ],
      }),
    ];

    const p2Count = bundle.masterAnswerKey.part2.length || 4;
    const subLabels: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];
    for (let qNum = 1; qNum <= p2Count; qNum++) {
      for (const sub of subLabels) {
        p2Rows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [makePara(`Câu ${qNum}.${sub}`, { align: AlignmentType.CENTER })],
              }),
              ...variants.map((v) => {
                const subObj = v.answerKeyPart2?.[qNum];
                let isTrue = false;
                if (subObj && typeof subObj[sub] === 'boolean') {
                  isTrue = subObj[sub];
                } else {
                  const masterItem = bundle.masterAnswerKey.part2.find((m) => m.questionNumber === qNum);
                  const masterSub = masterItem?.subItems.find((s) => s.label === sub);
                  isTrue = masterSub?.isCorrect ?? false;
                }
                return new TableCell({
                  children: [
                    makePara(isTrue ? 'Đ' : 'S', {
                      bold: true,
                      align: AlignmentType.CENTER,
                      color: isTrue ? '059669' : 'DC2626',
                    }),
                  ],
                });
              }),
            ],
          })
        );
      }
    }
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: p2Rows }));

    // PART III Table
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'III. BẢNG ĐÁP ÁN PHẦN III (TRẮC NGHIỆM TRẢ LỜI NGẮN)',
            bold: true,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
        spacing: { before: 240, after: 80 },
      })
    );

    const p3Rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            children: [makePara('Câu', { bold: true, align: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
          ...variants.map((v) =>
            new TableCell({
              children: [makePara(`Mã ${v.code}`, { bold: true, align: AlignmentType.CENTER })],
              width: { size: Math.floor(90 / variants.length), type: WidthType.PERCENTAGE },
            })
          ),
        ],
      }),
    ];

    const p3Count = bundle.masterAnswerKey.part3.length || 6;
    for (let i = 1; i <= p3Count; i++) {
      p3Rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [makePara(String(i), { bold: true, align: AlignmentType.CENTER })],
            }),
            ...variants.map((v) => {
              const ans = v.answerKeyPart3?.[i] || bundle.masterAnswerKey.part3.find((p) => p.questionNumber === i)?.answer || '-';
              return new TableCell({
                children: [makePara(ans, { bold: true, align: AlignmentType.CENTER, color: '1D4ED8' })],
              });
            }),
          ],
        })
      );
    }
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: p3Rows }));

    const doc = new Document({
      sections: [
        {
          properties: { page: { margin: pageMargins } },
          children,
        },
      ],
    });

    return await Packer.toBlob(doc);
  },

  /**
   * Triggers a browser file download of the generated DOCX blob
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

function makePara(
  text: string,
  opts?: { bold?: boolean; italics?: boolean; size?: number; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }
): Paragraph {
  return new Paragraph({
    alignment: opts?.align || AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italics,
        size: opts?.size,
        color: opts?.color,
        font: 'Times New Roman',
      }),
    ],
  });
}
