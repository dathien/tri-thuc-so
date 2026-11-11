import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ExamVersionRecord, ExamBundle } from '../../types';
import { soundService } from '../../utils/audio';

interface ExamVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examTitle: string;
  currentVersion: string;
  history: ExamVersionRecord[];
  onRollbackToVersion: (record: ExamVersionRecord) => void;
  isPublished?: boolean;
}

export const ExamVersionHistoryModal: React.FC<ExamVersionHistoryModalProps> = ({
  isOpen,
  onClose,
  examId,
  examTitle,
  currentVersion,
  history,
  onRollbackToVersion,
  isPublished,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<ExamVersionRecord | null>(
    history.length > 0 ? history[0] : null
  );

  if (!isOpen) return null;

  const handleRollback = (record: ExamVersionRecord) => {
    if (isPublished) {
      alert('Đề thi đã phát hành không thể khôi phục trực tiếp để bảo vệ kết quả học sinh. Bạn có thể tạo phiên bản mới.');
      return;
    }
    const confirmed = window.confirm(`Bạn có chắc chắn muốn khôi phục đề thi về phiên bản ${record.version} (${record.timestamp})?`);
    if (confirmed) {
      soundService.playSuccess();
      onRollbackToVersion(record);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Lịch sử Phiên bản &amp; Nhật ký Chỉnh sửa Đề thi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  Hiện tại: {currentVersion || 'v1.0'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-lg">
                Đề: {examTitle} (Mã ID: {examId})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row text-xs">
          {/* Left: Version Timeline List */}
          <div className="w-full md:w-80 border-r border-slate-200 p-4 overflow-y-auto space-y-2 bg-slate-50/50">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Dòng thời gian các phiên bản ({history.length})
            </span>

            {history.length === 0 ? (
              <div className="p-4 text-center text-slate-400 italic">
                Chưa có lịch sử phiên bản nào được ghi nhận.
              </div>
            ) : (
              history.map((rec) => {
                const isSelected = selectedRecord?.id === rec.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setSelectedRecord(rec);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-white border-indigo-500 shadow-xs ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-700">{rec.version}</span>
                      <span className="text-[10px] text-slate-400">{rec.timestamp.slice(11, 16)}</span>
                    </div>

                    <div className="font-semibold text-slate-900 mt-1 line-clamp-1">{rec.summary}</div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {rec.author}
                      </span>
                      {rec.variantCode && (
                        <span className="bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                          Mã {rec.variantCode}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Selected Version Details & Diff */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white">
            {selectedRecord ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-mono font-bold text-indigo-700">{selectedRecord.version}</span>
                      {selectedRecord.variantCode && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Chỉnh sửa riêng Mã {selectedRecord.variantCode}
                        </span>
                      )}
                    </div>

                    {!isPublished && (
                      <button
                        type="button"
                        onClick={() => handleRollback(selectedRecord)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-indigo-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Khôi phục phiên bản này</span>
                      </button>
                    )}
                  </div>

                  <p className="text-slate-800 font-medium">{selectedRecord.summary}</p>

                  <div className="grid grid-cols-2 gap-2 text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    <div>Thời điểm lưu: <strong>{selectedRecord.timestamp}</strong></div>
                    <div>Người thực hiện: <strong>{selectedRecord.author}</strong></div>
                  </div>
                </div>

                {/* Audit Details */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                    Chi tiết các thay đổi trong phiên bản ({selectedRecord.changesCount || 1} mục)
                  </span>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-700">
                    <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Loại thao tác: {selectedRecord.changeType}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Toàn bộ cấu trúc câu hỏi, ma trận và bảng đáp án tại thời điểm này đã được lưu giữ trong bản chụp (Snapshot) an toàn.
                    </p>
                    <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Tổng số câu: {selectedRecord.snapshotBundle?.questions?.length || 22}</span>
                      <span>·</span>
                      <span>Số mã đề: {selectedRecord.snapshotBundle?.variants?.length || 4} mã</span>
                      <span>·</span>
                      <span>Thang điểm: {selectedRecord.snapshotBundle?.totalPoints || 10.0}đ</span>
                    </div>
                  </div>
                </div>

                {isPublished && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Đề thi này đã phát hành. Quy tắc an toàn không cho phép Rollback trực tiếp. Hãy dùng tính năng <strong>Đính chính đáp án</strong> hoặc <strong>Nhân bản tạo đề mới</strong>.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                Chọn một phiên bản bên trái để xem chi tiết.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs rounded-b-2xl">
          <span className="text-slate-500">Mỗi lần lưu đề thi tự động tạo một phiên bản lịch sử bất biến.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
