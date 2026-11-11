import JSZip from 'jszip';
import { Question, CognitiveLevel, QuestionType, MathGraphicConfig } from '../types';

export interface ParsedQuestionItem {
  id: string;
  code: string;
  grade: 10 | 11 | 12;
  semester: 1 | 2;
  chapter: string;
  topic: string;
  cognitiveLevel: CognitiveLevel;
  questionType: QuestionType;
  part: 1 | 2 | 3;
  content: string;
  options?: string[];
  subItems?: { id: string; label: 'a' | 'b' | 'c' | 'd'; content: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  graphics?: MathGraphicConfig;
  status: 'ready' | 'needs_review';
  warnings: string[];
  missingAnswer: boolean;
}

export interface ParsedDocxResult {
  metadata: {
    title: string;
    schoolName?: string;
    department?: string;
    academicYear?: string;
    grade?: 10 | 11 | 12;
    semester?: 1 | 2;
    durationMinutes?: number;
    subject?: string;
    examTitle?: string;
    examPeriod?: string;
  };
  questions: ParsedQuestionItem[];
  summary: {
    total: number;
    readyCount: number;
    needsReviewCount: number;
    unresolvedFormulasCount: number;
    unresolvedImagesCount: number;
  };
}

export type DocxParseResult = ParsedDocxResult;

/**
 * Convert OMML XML Node to clean KaTeX / LaTeX formula string
 */
function ommlNodeToLatex(node: Element): string {
  const tagName = node.localName || node.nodeName;

  switch (tagName) {
    case 'oMath':
    case 'oMathPara':
    case 'e': // math argument / expression
      return Array.from(node.children)
        .map((child) => ommlNodeToLatex(child as Element))
        .join('');

    case 'r': // math run
      return Array.from(node.getElementsByTagNameNS('*', 't'))
        .map((t) => t.textContent || '')
        .join('');

    case 't': // math text
      return node.textContent || '';

    case 'f': {
      // Fraction: num / den
      const numNode = node.getElementsByTagNameNS('*', 'num')[0];
      const denNode = node.getElementsByTagNameNS('*', 'den')[0];
      const num = numNode ? ommlNodeToLatex(numNode) : '';
      const den = denNode ? ommlNodeToLatex(denNode) : '';
      return `\\frac{${num.trim()}}{${den.trim()}}`;
    }

    case 'rad': {
      // Radical: sqrt[deg]{base}
      const degNode = node.getElementsByTagNameNS('*', 'deg')[0];
      const baseNode = node.getElementsByTagNameNS('*', 'e')[0];
      const deg = degNode ? ommlNodeToLatex(degNode).trim() : '';
      const base = baseNode ? ommlNodeToLatex(baseNode).trim() : '';
      if (deg && deg !== '2') {
        return `\\sqrt[${deg}]{${base}}`;
      }
      return `\\sqrt{${base}}`;
    }

    case 'sSup': {
      // Superscript: base^sup
      const baseNode = node.getElementsByTagNameNS('*', 'e')[0];
      const supNode = node.getElementsByTagNameNS('*', 'sup')[0];
      const base = baseNode ? ommlNodeToLatex(baseNode).trim() : '';
      const sup = supNode ? ommlNodeToLatex(supNode).trim() : '';
      return `${base}^{${sup}}`;
    }

    case 'sSub': {
      // Subscript: base_sub
      const baseNode = node.getElementsByTagNameNS('*', 'e')[0];
      const subNode = node.getElementsByTagNameNS('*', 'sub')[0];
      const base = baseNode ? ommlNodeToLatex(baseNode).trim() : '';
      const sub = subNode ? ommlNodeToLatex(subNode).trim() : '';
      return `${base}_{${sub}}`;
    }

    case 'sSubSup': {
      // Subscript and Superscript: base_sub^sup
      const baseNode = node.getElementsByTagNameNS('*', 'e')[0];
      const subNode = node.getElementsByTagNameNS('*', 'sub')[0];
      const supNode = node.getElementsByTagNameNS('*', 'sup')[0];
      const base = baseNode ? ommlNodeToLatex(baseNode).trim() : '';
      const sub = subNode ? ommlNodeToLatex(subNode).trim() : '';
      const sup = supNode ? ommlNodeToLatex(supNode).trim() : '';
      return `${base}_{${sub}}^{${sup}}`;
    }

    case 'd': {
      // Delimiters (parentheses, brackets, braces)
      const baseNode = node.getElementsByTagNameNS('*', 'e')[0];
      const inner = baseNode ? ommlNodeToLatex(baseNode).trim() : '';
      return `\\left(${inner}\\right)`;
    }

    case 'nary': {
      // Integral / Sum / Product
      const subNode = node.getElementsByTagNameNS('*', 'sub')[0];
      const supNode = node.getElementsByTagNameNS('*', 'sup')[0];
      const baseNode = node.getElementsByTagNameNS('*', 'e')[0];
      const sub = subNode ? ommlNodeToLatex(subNode).trim() : '';
      const sup = supNode ? ommlNodeToLatex(supNode).trim() : '';
      const base = baseNode ? ommlNodeToLatex(baseNode).trim() : '';
      if (sub && sup) {
        return `\\int_{${sub}}^{${sup}} ${base}`;
      }
      return `\\int ${base}`;
    }

    default:
      return Array.from(node.children)
        .map((child) => ommlNodeToLatex(child as Element))
        .join('');
  }
}

/**
 * Parse paragraph node in document.xml, extracting normal text, OMML math, and image references
 */
function parseParagraphNode(
  pNode: Element,
  relsMap: Map<string, string>,
  imageMap: Map<string, string>
): { text: string; imageBase64?: string } {
  let paraText = '';
  let foundImageBase64: string | undefined;

  for (const child of Array.from(pNode.children)) {
    const tagName = child.localName || child.nodeName;

    if (tagName === 'r') {
      // Check for drawing / blip image
      const blips = child.getElementsByTagNameNS('*', 'blip');
      if (blips.length > 0) {
        const embedId = blips[0].getAttribute('r:embed') || blips[0].getAttribute('embed');
        if (embedId && relsMap.has(embedId)) {
          const target = relsMap.get(embedId)!;
          const imgData = imageMap.get(target);
          if (imgData) {
            foundImageBase64 = imgData;
          }
        }
      }

      // Check text runs
      const tNodes = child.getElementsByTagNameNS('*', 't');
      for (const t of Array.from(tNodes)) {
        paraText += t.textContent || '';
      }
    } else if (tagName === 'oMath' || tagName === 'oMathPara') {
      // Convert OMML formula to KaTeX
      const latex = ommlNodeToLatex(child);
      if (latex.trim()) {
        paraText += ` $${latex.trim()}$ `;
      }
    }
  }

  return { text: paraText.trim(), imageBase64: foundImageBase64 };
}

export const docxImportService = {
  /**
   * Main entry to import and parse a .docx file buffer
   */
  async parseDocxFile(file: File | Blob): Promise<ParsedDocxResult> {
    const zip = await JSZip.loadAsync(file);

    // 1. Parse Relationships (word/_rels/document.xml.rels) to resolve image rId
    const relsMap = new Map<string, string>();
    const relsFile = zip.file('word/_rels/document.xml.rels');
    if (relsFile) {
      const relsXml = await relsFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(relsXml, 'application/xml');
      const relElements = doc.getElementsByTagName('Relationship');
      for (let i = 0; i < relElements.length; i++) {
        const id = relElements[i].getAttribute('Id');
        const target = relElements[i].getAttribute('Target');
        if (id && target) {
          // Normalize target e.g. media/image1.png -> media/image1.png
          const cleanTarget = target.replace(/^(\.\.\/)+/, '').replace(/^word\//, '');
          relsMap.set(id, cleanTarget);
        }
      }
    }

    // 2. Load all embedded images from word/media/
    const imageMap = new Map<string, string>();
    const mediaFiles = Object.keys(zip.files).filter((path) => path.startsWith('word/media/'));
    for (const path of mediaFiles) {
      const fileData = zip.file(path);
      if (fileData) {
        const base64 = await fileData.async('base64');
        const ext = path.split('.').pop()?.toLowerCase() || 'png';
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = `data:${mime};base64,${base64}`;
        const relativeKey = path.replace('word/', '');
        imageMap.set(relativeKey, dataUrl);
      }
    }

    // 3. Parse main document (word/document.xml)
    const docFile = zip.file('word/document.xml');
    if (!docFile) {
      throw new Error('Tệp không đúng định dạng Word (.docx): không tìm thấy word/document.xml');
    }

    const docXml = await docFile.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(docXml, 'application/xml');

    const paragraphs = Array.from(doc.getElementsByTagNameNS('*', 'p'));
    const parsedLines: { text: string; imageBase64?: string }[] = [];

    for (const p of paragraphs) {
      const res = parseParagraphNode(p, relsMap, imageMap);
      if (res.text || res.imageBase64) {
        parsedLines.push(res);
      }
    }

    // 4. Extract Header / Metadata from first 15 lines
    const metadata: ParsedDocxResult['metadata'] = {
      title: 'Đề kiểm tra môn Toán THPT',
      schoolName: '',
      department: 'Tổ Toán - Tin học',
      academicYear: '2026 - 2027',
      grade: 12,
      semester: 1,
      durationMinutes: 90,
      subject: 'Toán học',
    };

    const headerCandidates = parsedLines.slice(0, 15);
    for (const item of headerCandidates) {
      const t = item.text.toUpperCase();
      if (t.includes('TRƯỜNG') || t.includes('THPT') || t.includes('SỞ GD')) {
        metadata.schoolName = item.text.replace(/^[•\-\s:]+/, '').trim();
      }
      if (t.includes('TỔ TOÁN') || t.includes('TỔ CHUYÊN MÔN')) {
        metadata.department = item.text.trim();
      }
      if (t.includes('NĂM HỌC')) {
        const match = item.text.match(/\d{4}\s*[-–]\s*\d{4}/);
        if (match) metadata.academicYear = match[0].replace(/\s+/g, ' ');
      }
      if (t.includes('ĐỀ KIỂM TRA') || t.includes('ĐỀ THI') || t.includes('KHẢO SÁT')) {
        metadata.title = item.text.trim();
      }
      if (t.includes('LỚP 10') || t.includes('KHỐI 10')) metadata.grade = 10;
      if (t.includes('LỚP 11') || t.includes('KHỐI 11')) metadata.grade = 11;
      if (t.includes('LỚP 12') || t.includes('KHỐI 12')) metadata.grade = 12;
      if (t.includes('HỌC KỲ I') || t.includes('HỌC KÌ I') || t.includes('HỌC KỲ 1')) metadata.semester = 1;
      if (t.includes('HỌC KỲ II') || t.includes('HỌC KÌ II') || t.includes('HỌC KỲ 2')) metadata.semester = 2;

      const minMatch = item.text.match(/(\d{2,3})\s*phút/i);
      if (minMatch) {
        metadata.durationMinutes = parseInt(minMatch[1], 10);
      }
    }

    // 5. Structure lines into Questions
    const questions: ParsedQuestionItem[] = [];
    let currentPart: 1 | 2 | 3 = 1;
    let currentQ: {
      content: string;
      options: string[];
      subItems: { id: string; label: 'a' | 'b' | 'c' | 'd'; content: string; isCorrect: boolean }[];
      correctAnswer: string;
      shortAnswer: string;
      image?: string;
      part: 1 | 2 | 3;
      warnings: string[];
    } | null = null;

    const commitCurrentQuestion = () => {
      if (!currentQ || !currentQ.content.trim()) return;

      const idx = questions.length + 1;
      let questionType: QuestionType = 'multiple_choice';
      let points = 0.25;

      if (currentQ.part === 1) {
        questionType = 'multiple_choice';
        points = 0.25;
      } else if (currentQ.part === 2) {
        questionType = 'true_false';
        points = 1.0;
      } else {
        questionType = 'short_answer';
        points = 0.5;
      }

      const warnings = [...currentQ.warnings];
      let missingAnswer = false;

      // Validate question completeness
      if (questionType === 'multiple_choice') {
        if (currentQ.options.length < 4) {
          warnings.push(`Thiếu phương án trắc nghiệm (hiện có ${currentQ.options.length}/4 phương án).`);
        }
        if (!currentQ.correctAnswer) {
          missingAnswer = true;
          warnings.push('Chưa xác định được đáp án đúng (A/B/C/D).');
        }
      } else if (questionType === 'true_false') {
        if (currentQ.subItems.length < 4) {
          warnings.push(`Chưa đủ 4 ý a), b), c), d) cho câu đúng/sai (hiện có ${currentQ.subItems.length}/4).`);
        }
      } else {
        if (!currentQ.shortAnswer && !currentQ.correctAnswer) {
          missingAnswer = true;
          warnings.push('Chưa xác định được đáp số cho câu trả lời ngắn.');
        }
      }

      const status: 'ready' | 'needs_review' = warnings.length === 0 && !missingAnswer ? 'ready' : 'needs_review';

      let graphicsConfig: MathGraphicConfig | undefined;
      if (currentQ.image) {
        graphicsConfig = {
          id: `fig-imported-${Date.now()}-${idx}`,
          type: 'custom_coords',
          title: `Hình minh họa Câu ${idx}`,
          caption: `Hình vẽ trích xuất từ tài liệu Word`,
          grade: metadata.grade || 12,
          params: {},
          viewSettings: { theme: 'clean_white' },
          version: 1,
          createdAt: new Date().toISOString(),
          exportedImageData: currentQ.image,
        };
      }

      questions.push({
        id: `imported-q-${Date.now()}-${idx}`,
        code: `DE-WORD-${metadata.grade || 12}-P${currentQ.part}-${String(idx).padStart(2, '0')}`,
        grade: metadata.grade || 12,
        semester: metadata.semester || 1,
        chapter: 'Khảo sát và Ứng dụng Toán học THPT',
        topic: 'Nhập từ tài liệu Word',
        cognitiveLevel: idx <= 12 ? (idx <= 6 ? 'recognition' : 'comprehension') : (idx <= 18 ? 'application' : 'high_application'),
        questionType,
        part: currentQ.part,
        content: currentQ.content.trim(),
        options: questionType === 'multiple_choice' ? currentQ.options : undefined,
        subItems: questionType === 'true_false' ? currentQ.subItems : undefined,
        correctAnswer: questionType === 'multiple_choice' ? currentQ.correctAnswer : currentQ.shortAnswer,
        points,
        graphics: graphicsConfig,
        status,
        warnings,
        missingAnswer,
      });

      currentQ = null;
    };

    // Regex matchers
    const part1Regex = /PHẦN\s*I[\.:\s]/i;
    const part2Regex = /PHẦN\s*II[\.:\s]/i;
    const part3Regex = /PHẦN\s*III[\.:\s]/i;
    const questionStartRegex = /^(Câu|Bài)\s*(\d+)[\.:\s]/i;
    const optionARegex = /^[A][\.:\s]/;
    const optionBRegex = /^[B][\.:\s]/;
    const optionCRegex = /^[C][\.:\s]/;
    const optionDRegex = /^[D][\.:\s]/;
    const subItemRegex = /^[a-d]\)[\s]/i;

    for (const item of parsedLines) {
      const line = item.text.trim();

      // Check section change
      if (part1Regex.test(line)) {
        commitCurrentQuestion();
        currentPart = 1;
        continue;
      }
      if (part2Regex.test(line)) {
        commitCurrentQuestion();
        currentPart = 2;
        continue;
      }
      if (part3Regex.test(line)) {
        commitCurrentQuestion();
        currentPart = 3;
        continue;
      }

      // Check start of a new question
      const qMatch = line.match(questionStartRegex);
      if (qMatch) {
        commitCurrentQuestion();
        currentQ = {
          content: line.replace(questionStartRegex, '').trim(),
          options: [],
          subItems: [],
          correctAnswer: '',
          shortAnswer: '',
          image: item.imageBase64,
          part: currentPart,
          warnings: [],
        };
        continue;
      }

      // If we are inside an active question
      if (currentQ) {
        if (item.imageBase64 && !currentQ.image) {
          currentQ.image = item.imageBase64;
        }

        // Check options for Part 1
        if (currentQ.part === 1) {
          // Check if multiple options are on one line e.g. "A. x = 1    B. x = 2   C. x = 3   D. x = 4"
          const splitOptions = line.split(/(?=[A-D][\.:\s])/);
          let matchedSplit = false;
          for (const optCandidate of splitOptions) {
            const cleanOpt = optCandidate.trim();
            if (/^[A-D][\.:\s]/.test(cleanOpt)) {
              matchedSplit = true;
              const optLetter = cleanOpt[0].toUpperCase();
              const optContent = cleanOpt.substring(2).trim();
              currentQ.options.push(optContent);
              // Check if marked as correct (e.g. asterisks or [x])
              if (optCandidate.includes('*') || optCandidate.includes('✓') || optCandidate.includes('đúng')) {
                currentQ.correctAnswer = optLetter;
              }
            }
          }
          if (matchedSplit) continue;

          // Single option per line
          if (optionARegex.test(line) || optionBRegex.test(line) || optionCRegex.test(line) || optionDRegex.test(line)) {
            const optLetter = line[0].toUpperCase();
            const optContent = line.substring(2).trim();
            currentQ.options.push(optContent);
            if (line.includes('*') || line.includes('✓') || line.includes('đúng')) {
              currentQ.correctAnswer = optLetter;
            }
            continue;
          }
        }

        // Check sub-items for Part 2
        if (currentQ.part === 2) {
          if (subItemRegex.test(line)) {
            const label = line[0].toLowerCase() as 'a' | 'b' | 'c' | 'd';
            const subContent = line.substring(2).trim();
            const isCorrect = /đúng|true|1/i.test(line) && !/sai|false|0/i.test(line);
            currentQ.subItems.push({
              id: `${label}-${Date.now()}`,
              label,
              content: subContent.replace(/\[\s*\]\s*(Đúng|Sai)/gi, '').trim(),
              isCorrect,
            });
            continue;
          }
        }

        // Check short answer for Part 3
        if (currentQ.part === 3) {
          const ansMatch = line.match(/(Đáp số|Kết quả|Đáp án)[\s:]*([^\n\r]+)/i);
          if (ansMatch) {
            currentQ.shortAnswer = ansMatch[2].trim();
            continue;
          }
        }

        // Otherwise, append to question content
        currentQ.content += `\n${line}`;
      }
    }

    commitCurrentQuestion();

    // 6. Check for separate Answer Key Table at bottom of file (e.g. 1. A, 2. B...)
    const fullText = parsedLines.map((l) => l.text).join('\n');
    const answerTableIndex = fullText.search(/(BẢNG\s*ĐÁP\s*ÁN|ĐÁP\s*ÁN\s*CHI\s*TIẾT|HƯỚNG\s*DẪN\s*CHẤM)/i);
    if (answerTableIndex !== -1) {
      const answerSection = fullText.substring(answerTableIndex);
      // Match patterns like "1. A", "1-A", "Câu 1: A", "1A"
      const ansMatches = Array.from(answerSection.matchAll(/(?:Câu\s*)?(\d+)[\s.:\-=]+([A-D]|[\d\.,\-\/]+)/gi));
      for (const m of ansMatches) {
        const qNum = parseInt(m[1], 10);
        const ansVal = m[2].trim().toUpperCase();
        if (qNum > 0 && qNum <= questions.length) {
          const targetQ = questions[qNum - 1];
          if (targetQ.questionType === 'multiple_choice' && ['A', 'B', 'C', 'D'].includes(ansVal)) {
            targetQ.correctAnswer = ansVal;
            targetQ.missingAnswer = false;
            targetQ.warnings = targetQ.warnings.filter((w) => !w.includes('đáp án đúng'));
            if (targetQ.warnings.length === 0) targetQ.status = 'ready';
          } else if (targetQ.questionType === 'short_answer') {
            targetQ.correctAnswer = ansVal;
            targetQ.missingAnswer = false;
            targetQ.warnings = targetQ.warnings.filter((w) => !w.includes('đáp số'));
            if (targetQ.warnings.length === 0) targetQ.status = 'ready';
          }
        }
      }
    }

    // 7. Calculate Summaries
    const total = questions.length;
    const readyCount = questions.filter((q) => q.status === 'ready').length;
    const needsReviewCount = questions.filter((q) => q.status === 'needs_review').length;
    const unresolvedFormulasCount = questions.filter((q) => q.content.includes('\\text{?') || q.content.includes('???')).length;
    const unresolvedImagesCount = questions.filter((q) => q.warnings.some((w) => w.includes('hình'))).length;

    return {
      metadata,
      questions,
      summary: {
        total,
        readyCount,
        needsReviewCount,
        unresolvedFormulasCount,
        unresolvedImagesCount,
      },
    };
  },

  async parseDocxBlob(file: Blob | File): Promise<ParsedDocxResult> {
    return this.parseDocxFile(file);
  },
};
