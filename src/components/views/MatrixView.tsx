import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Trash2,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { ExamMatrix, MatrixItem } from '../../types';
import { SectionKey } from '../Sidebar';
import { soundService } from '../../utils/audio';

interface MatrixViewProps {
  matrices: ExamMatrix[];
  onNavigate: (section: SectionKey) => void;
  onUpdateMatrix?: (updated: ExamMatrix) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  matrices,
  onNavigate,
  onUpdateMatrix,
}) => {
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>(matrices[0]?.id || '');
  const [currentMatrix, setCurrentMatrix] = useState<ExamMatrix | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync active matrix when selected ID or matrices prop changes
  useEffect(() => {
    const found = matrices.find((m) => m.id === selectedMatrixId) || matrices[0];
    if (found) {
      // deep clone items to allow local editing
      setCurrentMatrix(JSON.parse(JSON.stringify(found)));
    }
  }, [selectedMatrixId, matrices]);

  if (!currentMatrix) {
    return null;
  }

  // Dynamic calculations based on currentMatrix items
  const totalRec = currentMatrix.items.reduce((s, i) => s + (Number(i.recognition) || 0), 0);
  const totalComp = currentMatrix.items.reduce((s, i) => s + (Number(i.comprehension) || 0), 0);
  const totalApp = currentMatrix.items.reduce((s, i) => s + (Number(i.application) || 0), 0);
  const totalHigh = currentMatrix.items.reduce((s, i) => s + (Number(i.highApplication) || 0), 0);
  const totalQuestionsCount = totalRec + totalComp + totalApp + totalHigh;

  const totalCalculatedPoints = currentMatrix.items.reduce(
    (acc, item) => acc + (Number(item.totalPoints) || 0),
    0
  );

  // Percentages by question count
  const recPct = totalQuestionsCount > 0 ? (totalRec / totalQuestionsCount) * 100 : 0;
  const compPct = totalQuestionsCount > 0 ? (totalComp / totalQuestionsCount) * 100 : 0;
  const appPct = totalQuestionsCount > 0 ? (totalApp / totalQuestionsCount) * 100 : 0;
  const highPct = totalQuestionsCount > 0 ? (totalHigh / totalQuestionsCount) * 100 : 0;
  const totalPct = totalQuestionsCount > 0 ? 100 : 0;

  // Validation checks
  const isPointsConsistent = Math.abs(totalCalculatedPoints - currentMatrix.totalPoints) < 0.05;
  const isQuestionsConsistent = totalQuestionsCount === currentMatrix.totalQuestions;

  // Row update handlers
  const handleItemChange = (index: number, field: keyof MatrixItem, value: any) => {
    const updatedItems = [...currentMatrix.items];
    const item = { ...updatedItems[index], [field]: value };

    // auto-recalc totalQuestions for this item
    item.totalQuestions =
      (Number(item.recognition) || 0) +
      (Number(item.comprehension) || 0) +
      (Number(item.application) || 0) +
      (Number(item.highApplication) || 0);

    updatedItems[index] = item;

    const newMatrix: ExamMatrix = {
      ...currentMatrix,
      items: updatedItems,
      totalQuestions: updatedItems.reduce((s, i) => s + i.totalQuestions, 0),
    };
    setCurrentMatrix(newMatrix);
  };

  const handleAddNewItem = () => {
    soundService.playClick();
    const newItem: MatrixItem = {
      chapter: 'Chuyên đề mới bổ sung',
      topic: 'Kiến thức vận dụng theo yêu cầu đề',
      recognition: 2,
      comprehension: 2,
      application: 1,
      highApplication: 0,
      totalQuestions: 5,
      totalPoints: 1.5,
    };
    const updatedItems = [...currentMatrix.items, newItem];
    const newMatrix: ExamMatrix = {
      ...currentMatrix,
      items: updatedItems,
      totalQuestions: updatedItems.reduce((s, i) => s + i.totalQuestions, 0),
    };
    setCurrentMatrix(newMatrix);
  };

  const handleDeleteItem = (index: number) => {
    soundService.playClick();
    const updatedItems = currentMatrix.items.filter((_, i) => i !== index);
    const newMatrix: ExamMatrix = {
      ...currentMatrix,
      items: updatedItems,
      totalQuestions: updatedItems.reduce((s, i) => s + i.totalQuestions, 0),
    };
    setCurrentMatrix(newMatrix);
  };

  // Quick preset template applicator
  const applyPresetRatio = (preset: 'standard' | 'basic15' | 'advanced' | 'balanced') => {
    soundService.playClick();
    let updatedItems = [...currentMatrix.items];

    if (preset === 'basic15') {
      // 15 min basic: 60% Nhận biết, 40% Thông hiểu, 0% Vận dụng, 0% Vận dụng cao
      updatedItems = updatedItems.map((item, idx) => ({
        ...item,
        recognition: idx === 0 ? 4 : 2,
        comprehension: idx === 0 ? 3 : 1,
        application: 0,
        highApplication: 0,
        totalQuestions: idx === 0 ? 7 : 3,
        totalPoints: idx === 0 ? 6.0 : 4.0,
      }));
    } else if (preset === 'advanced') {
      // Advanced: 0% Nhận biết, 20% Thông hiểu, 50% Vận dụng, 30% Vận dụng cao
      updatedItems = updatedItems.map((item, idx) => ({
        ...item,
        recognition: 0,
        comprehension: idx === 0 ? 2 : 1,
        application: idx === 0 ? 4 : 3,
        highApplication: idx === 0 ? 2 : 1,
        totalQuestions: idx === 0 ? 8 : 5,
        totalPoints: idx === 0 ? 6.0 : 4.0,
      }));
    } else if (preset === 'balanced') {
      // Balanced 25-25-25-25
      updatedItems = updatedItems.map((item) => ({
        ...item,
        recognition: 2,
        comprehension: 2,
        application: 2,
        highApplication: 1,
        totalQuestions: 7,
        totalPoints: 3.3,
      }));
    } else {
      // Standard GDPT 2018 (40 - 35 - 20 - 5)
      updatedItems = [
        {
          chapter: 'Tính đơn điệu và cực trị hàm số',
          topic: 'Nhận biết & bảng biến thiên',
          recognition: 4,
          comprehension: 3,
          application: 2,
          highApplication: 1,
          totalQuestions: 10,
          totalPoints: 4.0,
        },
        {
          chapter: 'Giá trị lớn nhất, nhỏ nhất & Tiệm cận',
          topic: 'Khảo sát tiệm cận & GTLN-GTNN',
          recognition: 3,
          comprehension: 3,
          application: 2,
          highApplication: 0,
          totalQuestions: 8,
          totalPoints: 3.5,
        },
        {
          chapter: 'Vectơ trong không gian Oxyz',
          topic: 'Tọa độ vectơ & tích vô hướng',
          recognition: 2,
          comprehension: 2,
          application: 0,
          highApplication: 0,
          totalQuestions: 4,
          totalPoints: 2.5,
        },
      ];
    }

    const newMatrix: ExamMatrix = {
      ...currentMatrix,
      items: updatedItems,
      totalQuestions: updatedItems.reduce((s, i) => s + i.totalQuestions, 0),
    };
    setCurrentMatrix(newMatrix);
  };

  const handleSaveMatrix = () => {
    soundService.playSuccess();
    if (onUpdateMatrix && currentMatrix) {
      onUpdateMatrix({
        ...currentMatrix,
        totalQuestions: totalQuestionsCount,
        cognitiveRatio: {
          recognition: Math.round(recPct),
          comprehension: Math.round(compPct),
          application: Math.round(appPct),
          highApplication: Math.round(highPct),
        },
      });
    }
    setSaveSuccessMsg('Đã lưu thành công cấu hình ma trận & các mức độ nhận thức!');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Ma trận &amp; Bản đặc tả Đề kiểm tra
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              Chuẩn GDPT 2018
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự do tùy chỉnh 4 mức độ nhận thức (có thể đặt mức độ bất kỳ bằng 0), hệ thống tự động tính toán lại câu hỏi, điểm số và tỉ lệ phần trăm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveMatrix}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi ma trận
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onNavigate('exam-builder');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            Tạo đề từ Ma trận này
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Matrix Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {matrices.map((matrix) => (
          <button
            key={matrix.id}
            type="button"
            onClick={() => {
              setSelectedMatrixId(matrix.id);
              soundService.playClick();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              currentMatrix?.id === matrix.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {matrix.title} (Khối {matrix.grade})
          </button>
        ))}
      </div>

      {/* Preset Quick Actions Bar */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Mẫu phân bổ mức độ nhận thức nhanh:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPresetRatio('standard')}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            Chuẩn GDPT (40-35-20-5)
          </button>
          <button
            type="button"
            onClick={() => applyPresetRatio('basic15')}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            15 phút cơ bản (60-40-0-0)
          </button>
          <button
            type="button"
            onClick={() => applyPresetRatio('advanced')}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-700 font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            Khảo sát nâng cao (0-20-50-30)
          </button>
          <button
            type="button"
            onClick={() => applyPresetRatio('balanced')}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            Đồng đều (25-25-25-25)
          </button>
        </div>
      </div>

      {/* Consistency & Validation Check Bar */}
      <div
        className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isPointsConsistent && isQuestionsConsistent
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isPointsConsistent && isQuestionsConsistent ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <p className="font-bold">
              {isPointsConsistent && isQuestionsConsistent
                ? 'Ma trận đã kiểm tra: Thống nhất hoàn toàn với cấu trúc thang điểm 10.0'
                : 'Cảnh báo tính toán: Tổng điểm hoặc số câu hỏi chưa khớp hoàn toàn!'}
            </p>
            <p className="text-[11px] opacity-85 mt-0.5">
              Tổng điểm phân bổ: <span className="font-mono font-bold">{totalCalculatedPoints.toFixed(2)} / {currentMatrix.totalPoints}</span> điểm · Tổng câu hỏi: <span className="font-mono font-bold">{totalQuestionsCount}</span> câu · Tổng tỉ lệ: <span className="font-mono font-bold">{totalPct}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-lg border border-current shadow-2xs">
            Thời gian: {currentMatrix.durationMinutes} phút
          </span>
          <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-lg border border-current shadow-2xs">
            Thang điểm: {currentMatrix.totalPoints}đ
          </span>
        </div>
      </div>

      {/* 4 Cognitive Levels Summary & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dynamic Cognitive Level Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Tỉ lệ 4 Mức độ Nhận thức (Tự động tính)
              </h3>
              <p className="text-[11px] text-slate-500">Mức độ không dùng hiển thị 0 câu (0%)</p>
            </div>
            <span className="text-[11px] font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">
              Tổng: {totalPct}%
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Nhận biết: <span className="font-bold font-mono text-emerald-700">{totalRec} câu</span> ({recPct.toFixed(1)}%)
                </span>
                <span className="font-mono font-bold text-slate-600">
                  {((totalRec / (totalQuestionsCount || 1)) * currentMatrix.totalPoints).toFixed(1)} điểm
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${recPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Thông hiểu: <span className="font-bold font-mono text-blue-700">{totalComp} câu</span> ({compPct.toFixed(1)}%)
                </span>
                <span className="font-mono font-bold text-slate-600">
                  {((totalComp / (totalQuestionsCount || 1)) * currentMatrix.totalPoints).toFixed(1)} điểm
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${compPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Vận dụng: <span className="font-bold font-mono text-amber-700">{totalApp} câu</span> ({appPct.toFixed(1)}%)
                </span>
                <span className="font-mono font-bold text-slate-600">
                  {((totalApp / (totalQuestionsCount || 1)) * currentMatrix.totalPoints).toFixed(1)} điểm
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${appPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Vận dụng cao: <span className="font-bold font-mono text-rose-700">{totalHigh} câu</span> ({highPct.toFixed(1)}%)
                </span>
                <span className="font-mono font-bold text-slate-600">
                  {((totalHigh / (totalQuestionsCount || 1)) * currentMatrix.totalPoints).toFixed(1)} điểm
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${highPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question Format & Guidance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Hướng dẫn &amp; Nguyên tắc Khảo thí
            </h3>
            <span className="text-[11px] text-slate-400">GDPT 2018 Môn Toán</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-600">
                <p className="font-semibold text-slate-800">Quy tắc linh hoạt mức độ:</p>
                <p>
                  Giáo viên có thể tăng giảm số câu hoặc đặt mức độ bất kỳ về <span className="font-bold text-indigo-700">0 câu</span> nếu đề kiểm tra (như bài 15 phút, kiểm tra chuyên đề) không cần tới mức độ đó.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-600">
                <p className="font-semibold text-slate-800">Tự động cân bằng tỉ lệ:</p>
                <p>
                  Khi thay đổi số câu ở bảng bên dưới, hệ thống tự động cập nhật tổng số câu, tổng điểm và tỉ lệ % trực tiếp theo thời gian thực.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Matrix Items Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Bản đặc tả chi tiết nội dung &amp; Ma trận đề (Cho phép chỉnh sửa trực tiếp)
            </h3>
            <p className="text-xs text-slate-500">
              Nhập trực tiếp số lượng câu hỏi của từng mức độ nhận thức (có thể gõ 0) và điểm số tương ứng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNewItem}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm chủ đề mới
            </button>
          </div>
        </div>

        {/* Desktop Table View (Visible on md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">Chương / Mạch kiến thức</th>
                <th className="px-4 py-3 min-w-[200px]">Chủ đề chi tiết</th>
                <th className="px-2 py-3 text-center min-w-[75px] text-emerald-700">Nhận biết</th>
                <th className="px-2 py-3 text-center min-w-[75px] text-blue-700">Thông hiểu</th>
                <th className="px-2 py-3 text-center min-w-[75px] text-amber-700">Vận dụng</th>
                <th className="px-2 py-3 text-center min-w-[75px] text-rose-700">Vận dụng cao</th>
                <th className="px-3 py-3 text-center font-bold">Tổng cộng</th>
                <th className="px-3 py-3 text-right font-bold min-w-[90px]">Điểm số</th>
                <th className="px-3 py-3 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {currentMatrix.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={item.chapter}
                      onChange={(e) => handleItemChange(idx, 'chapter', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded font-semibold text-slate-900 focus:outline-none text-[14px]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={item.topic}
                      onChange={(e) => handleItemChange(idx, 'topic', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded text-slate-600 focus:outline-none text-[14px]"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      value={item.recognition}
                      onChange={(e) =>
                        handleItemChange(idx, 'recognition', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-14 px-1.5 py-1 text-center font-mono font-bold text-emerald-700 bg-emerald-50/60 border border-emerald-200 rounded focus:bg-white focus:outline-none text-[14px]"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      value={item.comprehension}
                      onChange={(e) =>
                        handleItemChange(idx, 'comprehension', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-14 px-1.5 py-1 text-center font-mono font-bold text-blue-700 bg-blue-50/60 border border-blue-200 rounded focus:bg-white focus:outline-none text-[14px]"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      value={item.application}
                      onChange={(e) =>
                        handleItemChange(idx, 'application', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-14 px-1.5 py-1 text-center font-mono font-bold text-amber-700 bg-amber-50/60 border border-amber-200 rounded focus:bg-white focus:outline-none text-[14px]"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      value={item.highApplication}
                      onChange={(e) =>
                        handleItemChange(idx, 'highApplication', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-14 px-1.5 py-1 text-center font-mono font-bold text-rose-700 bg-rose-50/60 border border-rose-200 rounded focus:bg-white focus:outline-none text-[14px]"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900 text-[14px]">
                    {item.totalQuestions}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={item.totalPoints}
                      onChange={(e) =>
                        handleItemChange(idx, 'totalPoints', Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-16 px-1.5 py-1 text-right font-mono font-bold text-indigo-700 bg-indigo-50/60 border border-indigo-200 rounded focus:bg-white focus:outline-none text-[14px]"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      disabled={currentMatrix.items.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                      title="Xóa dòng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 text-[14px]">
              <tr>
                <td colSpan={2} className="px-4 py-3 uppercase text-[12px]">
                  Tổng cộng toàn đề thi:
                </td>
                <td className="px-2 py-3 text-center font-mono text-emerald-700">
                  {totalRec} ({recPct.toFixed(0)}%)
                </td>
                <td className="px-2 py-3 text-center font-mono text-blue-700">
                  {totalComp} ({compPct.toFixed(0)}%)
                </td>
                <td className="px-2 py-3 text-center font-mono text-amber-700">
                  {totalApp} ({appPct.toFixed(0)}%)
                </td>
                <td className="px-2 py-3 text-center font-mono text-rose-700">
                  {totalHigh} ({highPct.toFixed(0)}%)
                </td>
                <td className="px-3 py-3 text-center font-mono text-slate-900">
                  {totalQuestionsCount} câu
                </td>
                <td className="px-3 py-3 text-right font-mono text-indigo-700">
                  {totalCalculatedPoints.toFixed(2)}đ
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Adaptive Card View (Visible on small screens < md) */}
        <div className="block md:hidden divide-y divide-slate-100 p-4 space-y-4">
          {currentMatrix.items.map((item, idx) => (
            <div key={idx} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Chủ đề {idx + 1}</span>
                  <input
                    type="text"
                    value={item.chapter}
                    onChange={(e) => handleItemChange(idx, 'chapter', e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-900 text-[14px]"
                    placeholder="Tên chương/mạch kiến thức"
                  />
                  <input
                    type="text"
                    value={item.topic}
                    onChange={(e) => handleItemChange(idx, 'topic', e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 text-[13px]"
                    placeholder="Chủ đề chi tiết"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(idx)}
                  disabled={currentMatrix.items.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 4 Cognitive Levels in 2x2 grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span className="text-emerald-800 font-semibold text-[12px]">Nhận biết</span>
                  <input
                    type="number"
                    min={0}
                    value={item.recognition}
                    onChange={(e) =>
                      handleItemChange(idx, 'recognition', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-12 px-1 py-0.5 text-center font-mono font-bold bg-white border border-emerald-300 rounded text-emerald-800"
                  />
                </div>
                <div className="bg-blue-50/70 p-2 rounded-lg border border-blue-200 flex items-center justify-between">
                  <span className="text-blue-800 font-semibold text-[12px]">Thông hiểu</span>
                  <input
                    type="number"
                    min={0}
                    value={item.comprehension}
                    onChange={(e) =>
                      handleItemChange(idx, 'comprehension', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-12 px-1 py-0.5 text-center font-mono font-bold bg-white border border-blue-300 rounded text-blue-800"
                  />
                </div>
                <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                  <span className="text-amber-800 font-semibold text-[12px]">Vận dụng</span>
                  <input
                    type="number"
                    min={0}
                    value={item.application}
                    onChange={(e) =>
                      handleItemChange(idx, 'application', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-12 px-1 py-0.5 text-center font-mono font-bold bg-white border border-amber-300 rounded text-amber-800"
                  />
                </div>
                <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-200 flex items-center justify-between">
                  <span className="text-rose-800 font-semibold text-[12px]">Vận dụng cao</span>
                  <input
                    type="number"
                    min={0}
                    value={item.highApplication}
                    onChange={(e) =>
                      handleItemChange(idx, 'highApplication', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-12 px-1 py-0.5 text-center font-mono font-bold bg-white border border-rose-300 rounded text-rose-800"
                  />
                </div>
              </div>

              {/* Card totals */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-600">
                  Tổng câu: <strong className="text-slate-900 font-mono">{item.totalQuestions}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Điểm:</span>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    value={item.totalPoints}
                    onChange={(e) =>
                      handleItemChange(idx, 'totalPoints', Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-14 px-1 py-0.5 text-right font-mono font-bold text-indigo-700 bg-white border border-slate-300 rounded"
                  />
                  <span className="text-slate-500">đ</span>
                </div>
              </div>
            </div>
          ))}

          {/* Mobile Summary footer card */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-xs">
            <p className="font-bold text-indigo-950">Tổng cộng ma trận:</p>
            <p className="text-slate-700">
              Tổng số câu: <strong className="font-mono text-indigo-700">{totalQuestionsCount} câu</strong> · Tổng điểm: <strong className="font-mono text-indigo-700">{totalCalculatedPoints.toFixed(2)}đ</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              NB: {totalRec} ({recPct.toFixed(0)}%) · TH: {totalComp} ({compPct.toFixed(0)}%) · VD: {totalApp} ({appPct.toFixed(0)}%) · VDC: {totalHigh} ({highPct.toFixed(0)}%)
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            * Sau khi tinh chỉnh các mức độ nhận thức, bấm nút <strong>Lưu thay đổi ma trận</strong> để hệ thống ghi nhớ.
          </span>
          <button
            type="button"
            onClick={handleSaveMatrix}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi ma trận
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatrixView;
