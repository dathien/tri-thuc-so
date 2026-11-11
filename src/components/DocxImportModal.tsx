import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Edit2,
  Check,
  RefreshCw,
  Eye,
  Info,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import {
  docxImportService,
  ParsedDocxResult,
  ParsedQuestionItem,
} from '../services/docxImportService';
import { Question, CognitiveLevel, QuestionType } from '../types';
import MathRenderer from './MathRenderer';
import { soundService } from '../utils/audio';

export interface DocxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMode?: 'question_bank' | 'exam_builder';
  onImportToBank?: (questions: Omit<Question, 'id' | 'createdAt'>[]) => void;
  onImportToExam?: (
    metadata: ParsedDocxResult['metadata'],
    questions: Question[]
  ) => void;
  onImportQuestions?: (questions: Question[], result?: ParsedDocxResult) => void;
}

export const DocxImportModal: React.FC<DocxImportModalProps> = ({
  isOpen,
  onClose,
  targetMode = 'exam_builder',
  onImportToBank,
  onImportToExam,
  onImportQuestions,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedDocxResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'ready' | 'needs_review'>('all');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.docx')) {
      setParseError('Vui lòng chọn tệp Word định dạng .docx chuẩn.');
      return;
    }
    setFile(selected);
    setParseError(null);
    setIsParsing(true);
    soundService.playClick();

    try {
      const result = await docxImportService.parseDocxBlob(selected);
      setParseResult(result);
      soundService.playSuccess();
    } catch (err: any) {
      console.error('Docx parse error:', err);
      setParseError(
        err.message || 'Không thể đọc nội dung tệp .docx. Vui lòng kiểm tra lại định dạng tệp.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!dropped.name.toLowerCase().endsWith('.docx')) {
      setParseError('Vui lòng chọn tệp Word định dạng .docx chuẩn.');
      return;
    }
    setFile(dropped);
    setParseError(null);
    setIsParsing(true);
    soundService.playClick();

    try {
      const result = await docxImportService.parseDocxBlob(dropped);
      setParseResult(result);
      soundService.playSuccess();
    } catch (err: any) {
      console.error('Docx parse error:', err);
      setParseError(
        err.message || 'Không thể đọc nội dung tệp .docx. Vui lòng kiểm tra lại định dạng tệp.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  // Update question within parseResult
  const handleUpdateQuestion = (updated: ParsedQuestionItem) => {
    if (!parseResult) return;
    const nextList = parseResult.questions.map((q) => (q.id === updated.id ? updated : q));
    const readyCount = nextList.filter((q) => q.status === 'ready').length;
    const needsReviewCount = nextList.filter((q) => q.status === 'needs_review').length;

    setParseResult({
      ...parseResult,
      questions: nextList,
      summary: {
        ...parseResult.summary,
        readyCount,
        needsReviewCount,
      },
    });
  };

  const handleSetCorrectOption = (q: ParsedQuestionItem, optLetter: string) => {
    const updated: ParsedQuestionItem = {
      ...q,
      correctAnswer: optLetter,
      missingAnswer: false,
      warnings: q.warnings.filter((w) => !w.includes('đáp án đúng')),
    };
    if (updated.warnings.length === 0) updated.status = 'ready';
    handleUpdateQuestion(updated);
    soundService.playClick();
  };

  const handleToggleSubItem = (q: ParsedQuestionItem, subId: string) => {
    if (!q.subItems) return;
    const nextSubs = q.subItems.map((s) => (s.id === subId ? { ...s, isCorrect: !s.isCorrect } : s));
    const updated: ParsedQuestionItem = {
      ...q,
      subItems: nextSubs,
    };
    handleUpdateQuestion(updated);
    soundService.playClick();
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    soundService.playSuccess();

    if (targetMode === 'question_bank') {
      const formattedForBank: Omit<Question, 'id' | 'createdAt'>[] = parseResult.questions.map(
        (q, idx) => ({
          code: q.code || `TOAN${q.grade}-${Math.floor(100 + Math.random() * 900)}`,
          grade: q.grade,
          semester: q.semester,
          chapter: q.chapter,
          lesson: `Bài ${idx + 1}`,
          topic: q.topic,
          cognitiveLevel: q.cognitiveLevel,
          questionType: q.questionType,
          part: q.part,
          content: q.content,
          options: q.options || [],
          subItems: q.subItems,
          correctAnswer: q.correctAnswer || (q.questionType === 'multiple_choice' ? 'A' : ''),
          explanation: q.explanation || '',
          points: q.points || 0.25,
          graphics: q.graphics,
        })
      );
      onImportToBank?.(formattedForBank);
    } else {
      const formattedForExam: Question[] = parseResult.questions.map((q, idx) => ({
        id: `q-docx-${Date.now()}-${idx}`,
        code: q.code || `TOAN${q.grade}-${Math.floor(100 + Math.random() * 900)}`,
        grade: q.grade,
        semester: q.semester,
        chapter: q.chapter,
        lesson: `Bài ${idx + 1}`,
        topic: q.topic,
        cognitiveLevel: q.cognitiveLevel,
        questionType: q.questionType,
        part: q.part,
        content: q.content,
        options: q.options || [],
        subItems: q.subItems,
        correctAnswer: q.correctAnswer || (q.questionType === 'multiple_choice' ? 'A' : ''),
        explanation: q.explanation || '',
        points: q.points || 0.25,
        graphics: q.graphics,
        createdAt: new Date().toISOString(),
      }));
      onImportToExam?.(parseResult.metadata, formattedForExam);
      onImportQuestions?.(formattedForExam, parseResult);
    }
    onClose();
  };

  const filteredQuestions = (parseResult?.questions || []).filter((q) => {
    if (activeFilter === 'ready') return q.status === 'ready';
    if (activeFilter === 'needs_review') return q.status === 'needs_review';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Nhập đề thi từ tệp Word (.docx)
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Hỗ trợ công thức KaTeX / OMML & Hình ảnh
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Tự động bóc tách Phần I, II, III, bảng đáp án, công thức toán và hình ảnh đính kèm từ tệp Word.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Upload Dropzone if no file or result */}
          {!parseResult && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Kéo thả tệp Word (.docx) vào đây, hoặc bấm để duyệt tệp
              </h4>
              <p className="text-xs text-slate-500 max-w-md mb-4">
                Hệ thống tự động nhận diện cấu trúc đề thi THPT 2018 (Phần I, II, III), bóc tách công thức toán OMML sang KaTeX, và đính kèm hình ảnh chuẩn xác.
              </p>
              <div className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
                {isParsing ? 'Đang phân tích cấu trúc tệp Word...' : 'Chọn tệp .docx từ máy tính'}
              </div>

              {parseError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* Review Screen after parsing */}
          {parseResult && (
            <div className="space-y-4">
              {/* Document Metadata Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">
                      {parseResult.metadata.title || 'Đề kiểm tra môn Toán'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-[11px]">
                      Lớp {parseResult.metadata.grade || 12}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {parseResult.metadata.schoolName ? `${parseResult.metadata.schoolName} • ` : ''}
                    {parseResult.metadata.department ? `${parseResult.metadata.department} • ` : ''}
                    {parseResult.metadata.academicYear ? `Năm học ${parseResult.metadata.academicYear} • ` : ''}
                    Thời gian: {parseResult.metadata.durationMinutes || 90} phút
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParseResult(null);
                    setFile(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Chọn tệp khác
                </button>
              </div>

              {/* Status Summary & Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({parseResult.summary.total} câu)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ready')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeFilter === 'ready'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sẵn sàng ({parseResult.summary.readyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('needs_review')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeFilter === 'needs_review'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Cần kiểm tra ({parseResult.summary.needsReviewCount})
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  Bấm trực tiếp vào phương án A/B/C/D để chọn đáp án đúng nếu tệp chưa có bảng đáp án.
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredQuestions.map((q, qIndex) => {
                  const isEditing = editingQuestionId === q.id;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        q.status === 'needs_review'
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            Câu {qIndex + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {q.part === 1
                              ? 'Phần I (Trắc nghiệm)'
                              : q.part === 2
                              ? 'Phần II (Đúng/Sai)'
                              : 'Phần III (Trả lời ngắn)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Cognitive Level Selector */}
                          <select
                            value={q.cognitiveLevel}
                            onChange={(e) =>
                              handleUpdateQuestion({
                                ...q,
                                cognitiveLevel: e.target.value as CognitiveLevel,
                              })
                            }
                            className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
                          >
                            <option value="recognition">Nhận biết</option>
                            <option value="comprehension">Thông hiểu</option>
                            <option value="application">Vận dụng</option>
                            <option value="high_application">Vận dụng cao</option>
                          </select>

                          {q.status === 'ready' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Đạt chuẩn
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Cần rà soát
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            title="Sửa nội dung câu hỏi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Warnings if any */}
                      {q.warnings.length > 0 && (
                        <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-0.5">
                          {q.warnings.map((w, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content Area */}
                      {isEditing ? (
                        <div className="space-y-2 mb-3">
                          <textarea
                            rows={3}
                            value={q.content}
                            onChange={(e) =>
                              handleUpdateQuestion({ ...q, content: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingQuestionId(null)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold"
                          >
                            Xong
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-800 mb-3 leading-relaxed">
                          <MathRenderer content={q.content} />
                        </div>
                      )}

                      {/* Embedded Image preview if attached */}
                      {q.graphics?.exportedImageData && (
                        <div className="mb-3 max-w-sm border border-slate-200 rounded-xl overflow-hidden p-1 bg-white">
                          <img
                            src={q.graphics.exportedImageData}
                            alt="Hình vẽ câu hỏi"
                            className="w-full h-auto object-contain max-h-48"
                          />
                        </div>
                      )}

                      {/* Part 1 Options */}
                      {q.part === 1 && q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((optText, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isCorrect = q.correctAnswer === letter;

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSetCorrectOption(q, letter)}
                                className={`p-2 rounded-xl border text-left flex items-start gap-2 transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-medium'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {letter}
                                </span>
                                <div className="flex-1">
                                  <MathRenderer content={optText} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Part 2 Sub-items */}
                      {q.part === 2 && q.subItems && (
                        <div className="space-y-1.5 text-xs">
                          {q.subItems.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 font-mono">
                                  {sub.label})
                                </span>
                                <div className="text-slate-800">
                                  <MathRenderer content={sub.content} />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleSubItem(q, sub.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                  sub.isCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Part 3 Short Answer input */}
                      {q.part === 3 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-600">Đáp số chuẩn:</span>
                          <input
                            type="text"
                            value={q.correctAnswer || ''}
                            onChange={(e) => {
                              const updated: ParsedQuestionItem = {
                                ...q,
                                correctAnswer: e.target.value,
                                missingAnswer: !e.target.value.trim(),
                              };
                              if (e.target.value.trim()) {
                                updated.warnings = q.warnings.filter((w) => !w.includes('đáp số'));
                                if (updated.warnings.length === 0) updated.status = 'ready';
                              }
                              handleUpdateQuestion(updated);
                            }}
                            placeholder="Nhập giá trị số hoặc biểu thức..."
                            className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {parseResult
                ? `Đã nhận diện ${parseResult.summary.readyCount}/${parseResult.summary.total} câu hỏi sẵn sàng nhập.`
                : 'Đề thi Word chuẩn gồm 3 phần I, II, III và bảng đáp án ở cuối sẽ được nhận diện tự động 100%.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>

            {parseResult && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                {targetMode === 'question_bank'
                  ? `Lưu ${parseResult.summary.total} câu vào Ngân hàng`
                  : `Nạp ${parseResult.summary.total} câu vào Đề kiểm tra`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocxImportModal;
