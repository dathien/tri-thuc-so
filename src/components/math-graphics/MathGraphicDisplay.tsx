/**
 * EduTest Smart - Math Graphic Display Component
 * Thành phần hiển thị hình vẽ 2D/3D trong thẻ câu hỏi, đề thi và hướng dẫn chấm
 */

import React, { useEffect, useRef } from 'react';
import { MathGraphicConfig } from '../../types/mathGraphics';
import { renderGraphicToCanvas, exportGraphicToPngDataUrl } from '../../services/mathGraphics/renderEngine';
import { Download } from 'lucide-react';

interface MathGraphicDisplayProps {
  config: MathGraphicConfig;
  className?: string;
  width?: number;
  height?: number;
  showCaption?: boolean;
  allowDownload?: boolean;
}

export const MathGraphicDisplay: React.FC<MathGraphicDisplayProps> = ({
  config,
  className = '',
  width = 460,
  height = 300,
  showCaption = true,
  allowDownload = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // High-DPI support
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    renderGraphicToCanvas(ctx, config, width, height);
  }, [config, width, height]);

  const handleDownload = () => {
    const dataUrl = config.exportedImageData || exportGraphicToPngDataUrl(config, width * 2, height * 2);
    const link = document.createElement('a');
    link.download = `${config.type}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={`inline-block my-2 text-center print-avoid-break ${className}`}>
      <div className="relative inline-block rounded-xl border border-slate-200 bg-white shadow-2xs group">
        <canvas
          ref={canvasRef}
          style={{ width: `${width}px`, height: `${height}px` }}
          className="max-w-full h-auto block"
        />

        {allowDownload && (
          <button
            type="button"
            onClick={handleDownload}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs text-xs flex items-center gap-1"
            title="Tải ảnh PNG hình vẽ"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold">Tải ảnh</span>
          </button>
        )}
      </div>

      {showCaption && (
        <p className="text-[11px] font-semibold text-slate-500 mt-1 italic">
          {config.caption || config.title || 'Hình vẽ minh họa'}
        </p>
      )}
    </div>
  );
};

export default MathGraphicDisplay;
