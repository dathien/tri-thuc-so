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
} from 'docx';
import { ExamBundle, Question, MatrixItem, SpecificationItem, ExamVariant } from '../types';

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
    const schoolName = options.schoolName || bundle.schoolName || 'TRƯỜNG THPT CHU VĂN AN';

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

      // Part I
      const part1Questions = bundle.questions.filter((q) => q.part === 1);
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
            this.createMultipleChoiceQuestionParagraph(q, idx + 1, fontHalfPoints)
          );
        });
      }

      // Part II
      const part2Questions = bundle.questions.filter((q) => q.part === 2);
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
      const part3Questions = bundle.questions.filter((q) => q.part === 3);
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
            this.createShortAnswerQuestionParagraph(q, idx + 1, fontHalfPoints)
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

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: schoolName.toUpperCase(),
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
                      text: 'TỔ TOÁN - TIN HỌC',
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
                      text: '(Đề thi có 22 câu / 4 trang)',
                      italics: true,
                      font: 'Times New Roman',
                      size: fontHalfPoints - 4,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: bundle.title.toUpperCase(),
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
                      text: `NĂM HỌC 2025 - 2026`,
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
                      size: fontHalfPoints,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
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
  createMultipleChoiceQuestionParagraph(q: Question, number: number, fontHalfPoints: number): Paragraph {
    const cleanedContent = cleanLatexForDocx(q.content);
    const optionsText = (q.options || [])
      .map((opt, i) => `${String.fromCharCode(65 + i)}. ${cleanLatexForDocx(opt)}`)
      .join('     ');

    return new Paragraph({
      children: [
        new TextRun({
          text: `Câu ${number}: `,
          bold: true,
          font: 'Times New Roman',
          size: fontHalfPoints,
        }),
        new TextRun({
          text: cleanedContent,
          font: 'Times New Roman',
          size: fontHalfPoints,
        }),
        new TextRun({
          text: '\n' + optionsText,
          font: 'Times New Roman',
          size: fontHalfPoints,
        }),
      ],
      spacing: { before: 100, after: 120 },
    });
  },

  /**
   * Helper: True / False Question
   */
  createTrueFalseQuestionParagraphs(q: Question, number: number, fontHalfPoints: number): Paragraph[] {
    const cleanedContent = cleanLatexForDocx(q.content);
    const result: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: `Câu ${number}: `,
            bold: true,
            font: 'Times New Roman',
            size: fontHalfPoints,
          }),
          new TextRun({
            text: cleanedContent,
            font: 'Times New Roman',
            size: fontHalfPoints,
          }),
        ],
        spacing: { before: 120, after: 60 },
      }),
    ];

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
            new TextRun({
              text: cleanLatexForDocx(sub.content),
              font: 'Times New Roman',
              size: fontHalfPoints,
            }),
          ],
          spacing: { before: 40, after: 40 },
        })
      );
    });

    return result;
  },

  /**
   * Helper: Short Answer Question
   */
  createShortAnswerQuestionParagraph(q: Question, number: number, fontHalfPoints: number): Paragraph {
    const cleanedContent = cleanLatexForDocx(q.content);
    return new Paragraph({
      children: [
        new TextRun({
          text: `Câu ${number}: `,
          bold: true,
          font: 'Times New Roman',
          size: fontHalfPoints,
        }),
        new TextRun({
          text: cleanedContent,
          font: 'Times New Roman',
          size: fontHalfPoints,
        }),
        new TextRun({
          text: '\n    Đáp số: .................................................',
          italics: true,
          font: 'Times New Roman',
          size: fontHalfPoints - 2,
        }),
      ],
      spacing: { before: 100, after: 120 },
    });
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
