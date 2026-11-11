import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  FileText,
  Save,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Exam, ExamBundle, CorrectionLogItem, Question } from '../../types';
import { soundService } from '../../utils/audio';

interface ExamCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  onSaveCorrection: (log: CorrectionLogItem, updatedBundle: ExamBundle) => void;
  authorName: string;
}

export const ExamCorrectionModal: React.FC<ExamCorrectionModalProps> = ({
  isOpen,
  onClose,
  exam,
  onSaveCorrection,
  authorName,
}) => {
  const bundle = exam.bundle;
  const questions = bundle?.questions || [];

  const [selectedQNumber, setSelectedQNumber] = useState<number>(1);
  const [subLabel, setSubLabel] = useState<'a' | 'b' | 'c' | 'd'>('a');
  const [newAnswer, setNewAnswer] = useState<string>('B');
  const [reason, setReason] = useState<string>('');

  if (!isOpen || !bundle) return null;

  const targetQ = questions[selectedQNumber - 1];
  const partType = targetQ?.part || (targetQ?.questionType === 'multiple_choice' ? 1 : targetQ?.questionType === 'true_false' ? 2 : 3);

  const getOldAnswer = (): string => {
    if (!targetQ) return '';
    if (partType === 1) return String(targetQ.correctAnswer || 'A');
    if (partType === 2) {
      const sub = targetQ.subItems?.find((s) => s.label === subLabel);
      return sub ? (sub.isCorrect ? 'ĐÚNG' : 'SAI') : 'SAI';
    }
    return String(targetQ.correctAnswer || '');
  };

  const oldAnswer = getOldAnswer();

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do đính chính đáp án (ví dụ: phát hiện lỗi nhầm phương án chuẩn, câu hỏi có 2 đáp án chấp nhận, v.v.)');
      return;
    }

    soundService.playSuccess();

    // Create log item
    const logItem: CorrectionLogItem = {
      id: `corr-${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      teacherName: authorName || 'Giáo viên',
      questionNumber: selectedQNumber,
      part: partType as 1 | 2 | 3,
      subLabel: partType === 2 ? subLabel : undefined,
      oldAnswer,
      newAnswer,
      reason,
      affectedCount: 0,
    };

    // Update bundle's master question & answers
    const updatedQuestions = questions.map((q, idx) => {
      if (idx !== selectedQNumber - 1) return q;

      if (partType === 1) {
        return { ...q, correctAnswer: newAnswer };
      } else if (partType === 2) {
        const nextSubs = (q.subItems || []).map((s) =>
          s.label === subLabel ? { ...s, isCorrect: newAnswer === 'ĐÚNG' } : s
        );
        return { ...q, subItems: nextSubs };
      } else {
        return { ...q, correctAnswer: newAnswer };
      }
    });

    // Update masterAnswerKey
    const updatedMasterKey = {
      ...bundle.masterAnswerKey,
      part1: bundle.masterAnswerKey.part1.map((item) =>
        item.questionNumber === selectedQNumber && partType === 1
          ? { ...item, answer: newAnswer }
          : item
      ),
      part2: bundle.masterAnswerKey.part2.map((item) =>
        item.questionNumber === selectedQNumber && partType === 2
          ? {
              ...item,
              subItems: item.subItems.map((s) =>
                s.label === subLabel ? { ...s, isCorrect: newAnswer === 'ĐÚNG' } : s
              ),
            }
          : item
      ),
      part3: bundle.masterAnswerKey.part3.map((item) =>
        item.questionNumber === selectedQNumber && partType === 3
          ? { ...item, answer: newAnswer }
          : item
      ),
    };

    const updatedBundle: ExamBundle = {
      ...bundle,
      questions: updatedQuestions,
      masterAnswerKey: updatedMasterKey,
      correctionLogs: [logItem, ...(bundle.correctionLogs || [])],
      updatedAt: new Date().toISOString(),
    };

    onSaveCorrection(logItem, updatedBundle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Quy trình Đính chính Đáp án &amp; Chấm lại Bài thi
              </h3>
              <p className="text-xs text-slate-500">Áp dụng cho đề đã phát hành: bảo toàn bài làm gốc của học sinh</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Chọn câu hỏi cần đính chính:</label>
            <select
              value={selectedQNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value) || 1;
                setSelectedQNumber(num);
                const q = questions[num - 1];
                const p = q?.part || (q?.questionType === 'multiple_choice' ? 1 : q?.questionType === 'true_false' ? 2 : 3);
                if (p === 1) setNewAnswer('A');
                else if (p === 2) setNewAnswer('ĐÚNG');
                else setNewAnswer(String(q?.correctAnswer || ''));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              {questions.map((q, idx) => (
                <option key={q.id} value={idx + 1}>
                  Câu {idx + 1}: {q.content.slice(0, 70)}...
                </option>
              ))}
            </select>
          </div>

          {partType === 2 && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Chọn ý Đúng/Sai:</label>
              <div className="flex items-center gap-2">
                {(['a', 'b', 'c', 'd'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setSubLabel(l)}
                    className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                      subLabel === l ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Ý {l})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Old vs New comparison */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Đáp án hiện tại (Cũ)</span>
              <span className="font-mono text-base font-bold text-rose-700">{oldAnswer}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Đáp án đính chính (Mới)</span>
              {partType === 1 ? (
                <div className="flex items-center gap-1.5 mt-1">
                  {['A', 'B', 'C', 'D'].map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setNewAnswer(letter)}
                      className={`w-7 h-7 rounded font-bold text-xs ${newAnswer === letter ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700'}`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              ) : partType === 2 ? (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewAnswer('ĐÚNG')}
                    className={`px-3 py-1 rounded font-bold text-xs ${newAnswer === 'ĐÚNG' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700'}`}
                  >
                    ĐÚNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAnswer('SAI')}
                    className={`px-3 py-1 rounded font-bold text-xs ${newAnswer === 'SAI' ? 'bg-rose-600 text-white' : 'bg-white border text-slate-700'}`}
                  >
                    SAI
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-indigo-700 text-xs"
                />
              )}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Lý do đính chính (bắt buộc ghi nhật ký):</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Đính chính lại đáp án câu 3 do đề có 2 cách hiểu, chấp nhận phương án B và C..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
            <span className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Lưu ý quy tắc khảo thí an toàn:
            </span>
            <p>
              Hệ thống sẽ lưu vết lịch sử đính chính với tên giáo viên và thời điểm cụ thể. Khi học sinh hoặc giáo viên mở bảng điểm, điểm số sẽ được cập nhật lại tự động dựa trên khóa đáp án mới.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Xác nhận đính chính &amp; Ghi nhật ký</span>
          </button>
        </div>
      </div>
    </div>
  );
};
