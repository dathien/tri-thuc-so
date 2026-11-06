import React, { useState } from 'react';
import {
  Grid3X3,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart2,
  PieChart,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ExamMatrix, MatrixItem } from '../../types';
import { SectionKey } from '../Sidebar';
import { soundService } from '../../utils/audio';

interface MatrixViewProps {
  matrices: ExamMatrix[];
  onNavigate: (section: SectionKey) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({ matrices, onNavigate }) => {
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>(matrices[0]?.id || '');
  const activeMatrix = matrices.find((m) => m.id === selectedMatrixId) || matrices[0];

  // Consistency checks
  const totalCalculatedPoints = activeMatrix
    ? activeMatrix.items.reduce((acc, item) => acc + item.totalPoints, 0)
    : 0;

  const totalCalculatedQuestions = activeMatrix
    ? activeMatrix.items.reduce((acc, item) => acc + item.totalQuestions, 0)
    : 0;

  const isPointsConsistent = Math.abs(totalCalculatedPoints - activeMatrix.totalPoints) < 0.01;
  const isQuestionsConsistent = totalCalculatedQuestions === activeMatrix.totalQuestions;

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
            Thiết lập phạm vi kiến thức, mức độ nhận thức, tỉ lệ điểm và kiểm tra tính thống nhất trước khi phát hành đề.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              activeMatrix?.id === matrix.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {matrix.title} (Khối {matrix.grade})
          </button>
        ))}
      </div>

      {activeMatrix && (
        <>
          {/* Consistency Check Bar */}
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
                    ? 'Ma trận đã được kiểm tra: Thống nhất hoàn toàn với yêu cầu định dạng đề thi'
                    : 'Phát hiện sai lệch giữa phân bổ chi tiết và tổng điểm ma trận!'}
                </p>
                <p className="text-[11px] opacity-85 mt-0.5">
                  Tổng điểm phân bổ: <span className="font-mono font-bold">{totalCalculatedPoints.toFixed(1)} / {activeMatrix.totalPoints}</span> điểm · Tổng câu hỏi: <span className="font-mono font-bold">{totalCalculatedQuestions} / {activeMatrix.totalQuestions}</span> câu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-lg border border-current shadow-2xs">
                Thời gian: {activeMatrix.durationMinutes} phút
              </span>
            </div>
          </div>

          {/* Ratios Breakdown (Cognitive Level & Format) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cognitive Level Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Tỉ lệ Mức độ Nhận thức
                </h3>
                <span className="text-[11px] text-indigo-600 font-semibold">Chuẩn GDPT 2018</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Nhận biết (40%)</span>
                    <span className="font-bold font-mono">4.0 điểm</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Thông hiểu (35%)</span>
                    <span className="font-bold font-mono">3.5 điểm</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Vận dụng (20%)</span>
                    <span className="font-bold font-mono">2.0 điểm</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Vận dụng cao (5%)</span>
                    <span className="font-bold font-mono">0.5 điểm</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Question Format Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Cấu trúc Định dạng Câu hỏi
                </h3>
                <span className="text-[11px] text-slate-400">Theo Thông tư Khảo thí</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Phần I: Trắc nghiệm 4 lựa chọn</p>
                    <p className="text-[11px] text-slate-500">Mỗi câu 0.25 điểm</p>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-1 rounded border border-slate-200">
                    12 câu · 3.0đ
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Phần II: Trắc nghiệm Đúng / Sai</p>
                    <p className="text-[11px] text-slate-500">Mỗi câu gồm 4 ý a, b, c, d</p>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-1 rounded border border-slate-200">
                    4 câu · 4.0đ
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Phần III: Trả lời ngắn / Tự luận</p>
                    <p className="text-[11px] text-slate-500">Điền số hoặc phân số tối giản</p>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-1 rounded border border-slate-200">
                    6 câu · 3.0đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Items Detailed Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Bản đặc tả chi tiết nội dung &amp; Ma trận đề
                </h3>
                <p className="text-xs text-slate-500">
                  Phân bổ từng chủ đề theo 4 mức độ nhận thức
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Chương / Mạch kiến thức</th>
                    <th className="px-4 py-3">Chủ đề chi tiết</th>
                    <th className="px-3 py-3 text-center">Nhận biết</th>
                    <th className="px-3 py-3 text-center">Thông hiểu</th>
                    <th className="px-3 py-3 text-center">Vận dụng</th>
                    <th className="px-3 py-3 text-center">Vận dụng cao</th>
                    <th className="px-3 py-3 text-center font-bold">Tổng số câu</th>
                    <th className="px-4 py-3 text-right font-bold">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {activeMatrix.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.chapter}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.topic}</td>
                      <td className="px-3 py-3 text-center font-mono tabular-nums text-emerald-700">
                        {item.recognition}
                      </td>
                      <td className="px-3 py-3 text-center font-mono tabular-nums text-blue-700">
                        {item.comprehension}
                      </td>
                      <td className="px-3 py-3 text-center font-mono tabular-nums text-amber-700">
                        {item.application}
                      </td>
                      <td className="px-3 py-3 text-center font-mono tabular-nums text-rose-700">
                        {item.highApplication}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-900">
                        {item.totalQuestions}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                        {item.totalPoints.toFixed(1)}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 uppercase text-[11px]">
                      Tổng cộng toàn đề thi:
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-emerald-700">
                      {activeMatrix.items.reduce((s, i) => s + i.recognition, 0)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-blue-700">
                      {activeMatrix.items.reduce((s, i) => s + i.comprehension, 0)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-amber-700">
                      {activeMatrix.items.reduce((s, i) => s + i.application, 0)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-rose-700">
                      {activeMatrix.items.reduce((s, i) => s + i.highApplication, 0)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-900">
                      {totalCalculatedQuestions} câu
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-700">
                      {totalCalculatedPoints.toFixed(1)} điểm
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MatrixView;
