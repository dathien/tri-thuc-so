/**
 * EduTest Smart - Math Graphics Picker Modal
 * Trình duyệt và chèn hình học / đồ thị 2D/3D vào câu hỏi Ngân hàng và Đề thi
 */

import React, { useState } from 'react';
import {
  MathGraphicConfig,
  MathGraphicType,
} from '../../types/mathGraphics';
import {
  GRAPHIC_MODELS_CATALOG,
  createDefaultGraphic,
  cloneGraphicConfig,
  exportGraphicToPngDataUrl,
  exportGraphicToSvg,
} from '../../services/mathGraphics/renderEngine';
import MathGraphicsEditor from './MathGraphicsEditor';
import {
  X,
  Check,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
  Download,
  AlertCircle,
} from 'lucide-react';
import { soundService } from '../../utils/audio';

interface MathGraphicsPickerProps {
  initialConfig?: MathGraphicConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (config: MathGraphicConfig) => void;
}

export const MathGraphicsPicker: React.FC<MathGraphicsPickerProps> = ({
  initialConfig,
  isOpen,
  onClose,
  onSelect,
}) => {
  const [selectedType, setSelectedType] = useState<MathGraphicType>(
    initialConfig?.type || 'cubic_function'
  );

  const [activeConfig, setActiveConfig] = useState<MathGraphicConfig>(() => {
    if (initialConfig) return cloneGraphicConfig(initialConfig);
    return createDefaultGraphic('cubic_function');
  });

  const [filterGrade, setFilterGrade] = useState<'all' | 10 | 11 | 12>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filtered models
  const filteredModels = GRAPHIC_MODELS_CATALOG.filter((m) => {
    const matchGrade = filterGrade === 'all' || m.grade === filterGrade;
    const matchCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchCategory && matchSearch;
  });

  const handleSelectModelType = (type: MathGraphicType) => {
    setSelectedType(type);
    const newConf = createDefaultGraphic(type);
    setActiveConfig(newConf);
    soundService.playClick();
  };

  const handleConfirmInsert = () => {
    // Generate static snapshot images for reliable offline rendering and export
    const cloned = cloneGraphicConfig(activeConfig);
    cloned.exportedImageData = exportGraphicToPngDataUrl(cloned, 600, 400);
    cloned.svgData = exportGraphicToSvg(cloned, 600, 400);
    cloned.updatedAt = new Date().toISOString();

    onSelect(cloned);
    soundService.playSuccess();
    onClose();
  };

  const categories = [
    'all',
    'Tam giác, đường tròn, tứ giác',
    'Hình chóp, lăng trụ, hình hộp, đa diện',
    'Hình học tọa độ Oxy và Oxyz',
    'Đồ thị hàm số',
    'Bảng biến thiên',
    'Hình nón, trụ, cầu, khối tròn xoay',
    'Hình theo tọa độ / tham số tùy chỉnh',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Bộ công cụ vẽ Hình học & Đồ thị 2D/3D
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Dùng chung với Phòng Lab
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Lựa chọn mô hình toán học chuẩn xác, tinh chỉnh tham số, xoay 3D và chèn trực tiếp vào câu hỏi.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
            {/* Grade filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 text-[11px]">Khối lớp:</span>
              {(['all', 10, 11, 12] as const).map((g) => (
                <button
                  key={String(g)}
                  type="button"
                  onClick={() => setFilterGrade(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterGrade === g
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {g === 'all' ? 'Tất cả lớp' : `Toán ${g}`}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-600 text-[11px]">Chủ đề:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Tất cả chủ đề</option>
                {categories.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Model Selection Carousel / Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Chọn mô hình đồ thị / hình học ({filteredModels.length} mô hình sẵn sàng):
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredModels.map((model) => {
                const isSelected = selectedType === model.type;
                return (
                  <button
                    key={model.type}
                    type="button"
                    onClick={() => handleSelectModelType(model.type)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                          {model.dimension}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Lớp {model.grade}
                        </span>
                      </div>
                      <p className="font-bold text-[11px] text-slate-900 leading-tight line-clamp-2">
                        {model.name.replace(/\(.*\)/, '')}
                      </p>
                    </div>

                    <p className="text-[9px] text-slate-500 mt-2 line-clamp-1 italic">
                      {model.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Workspace */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Tinh chỉnh tham số, nhãn và góc nhìn:
              </span>
              <span className="text-[11px] text-slate-500">
                Dữ liệu được lưu độc lập vào câu hỏi, không làm ảnh hưởng mô hình gốc trong Phòng Lab.
              </span>
            </div>

            <MathGraphicsEditor
              config={activeConfig}
              onChange={(updated) => setActiveConfig(updated)}
              width={540}
              height={340}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Hình ảnh sẽ được nhúng trực tiếp với độ phân giải cao vào nội dung câu hỏi và xuất Word/PDF.
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
            <button
              type="button"
              onClick={handleConfirmInsert}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Chèn hình vào câu hỏi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathGraphicsPicker;
