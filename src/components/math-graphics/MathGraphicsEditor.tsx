/**
 * EduTest Smart - Math Graphics Editor Component
 * Trình biên tập tham số và góc nhìn 2D/3D trực quan với Canvas tương tác
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  MathGraphicConfig,
  Camera3D,
  GraphicViewSettings,
} from '../../types/mathGraphics';
import { renderGraphicToCanvas } from '../../services/mathGraphics/renderEngine';
import {
  RotateCcw,
  Eye,
  Grid,
  Type,
  Maximize2,
  Compass,
} from 'lucide-react';

interface MathGraphicsEditorProps {
  config: MathGraphicConfig;
  onChange: (newConfig: MathGraphicConfig) => void;
  width?: number;
  height?: number;
}

export const MathGraphicsEditor: React.FC<MathGraphicsEditorProps> = ({
  config,
  onChange,
  width = 540,
  height = 360,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const [localParams, setLocalParams] = useState<Record<string, any>>(config.params);
  const [localCamera, setLocalCamera] = useState<Camera3D>(
    config.camera || { rotX: 20, rotY: -30, zoom: 1 }
  );
  const [localView, setLocalView] = useState<GraphicViewSettings>(
    config.viewSettings || {
      showGrid: true,
      showAxes: true,
      showLabels: true,
      showHiddenLines: true,
      theme: 'clean_white',
    }
  );
  const [caption, setCaption] = useState(config.caption || config.title || '');

  // Keep local state in sync when config prop changes identity
  useEffect(() => {
    setLocalParams(config.params);
    if (config.camera) setLocalCamera(config.camera);
    if (config.viewSettings) setLocalView(config.viewSettings);
    setCaption(config.caption || config.title || '');
  }, [config.id]);

  // Update parent
  const notifyChange = useCallback(
    (
      newParams: Record<string, any>,
      newCamera: Camera3D,
      newView: GraphicViewSettings,
      newCaption: string
    ) => {
      onChange({
        ...config,
        params: newParams,
        camera: newCamera,
        viewSettings: newView,
        caption: newCaption,
        version: config.version + 1,
        updatedAt: new Date().toISOString(),
      });
    },
    [config, onChange]
  );

  // Redraw canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    const activeConfig: MathGraphicConfig = {
      ...config,
      params: localParams,
      camera: localCamera,
      viewSettings: localView,
    };

    renderGraphicToCanvas(ctx, activeConfig, width, height);
  }, [config, localParams, localCamera, localView, width, height]);

  // Handle 3D rotation via mouse drag on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (config.type !== 'space_3d_oxyz' && config.type !== 'solid_geometry_3d') return;
    isDraggingRef.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    const newCam: Camera3D = {
      ...localCamera,
      rotY: localCamera.rotY + dx * 0.7,
      rotX: Math.max(-85, Math.min(85, localCamera.rotX - dy * 0.7)),
    };
    setLocalCamera(newCam);
    notifyChange(localParams, newCam, localView, caption);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleParamChange = (key: string, val: any) => {
    const next = { ...localParams, [key]: val };
    setLocalParams(next);
    notifyChange(next, localCamera, localView, caption);
  };

  const handleToggleView = (key: keyof GraphicViewSettings) => {
    const next: GraphicViewSettings = { ...localView, [key]: !localView[key] };
    setLocalView(next);
    notifyChange(localParams, localCamera, next, caption);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setCaption(next);
    notifyChange(localParams, localCamera, localView, next);
  };

  const is3D = config.type === 'space_3d_oxyz' || config.type === 'solid_geometry_3d';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Canvas Viewport */}
      <div className="lg:col-span-7 flex flex-col items-center">
        <div className="relative border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden w-full">
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: `${height}px` }}
            className={`block ${is3D ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* 3D Drag Hint */}
          {is3D && (
            <div className="absolute bottom-2 left-3 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/80 text-[10px] text-slate-500 font-medium flex items-center gap-1.5 pointer-events-none">
              <Compass className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
              <span>Kéo chuột trên hình để xoay không gian 3D</span>
            </div>
          )}

          {/* Quick Toolbar */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleToggleView('showGrid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                localView.showGrid ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Bật/Tắt Lưới tọa độ"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleView('showAxes')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                localView.showAxes ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Bật/Tắt Trục tọa độ"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleView('showLabels')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                localView.showLabels ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Bật/Tắt Nhãn và Tọa độ"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            {is3D && (
              <button
                type="button"
                onClick={() => handleToggleView('showHiddenLines')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  localView.showHiddenLines ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Bật/Tắt Đường nét đứt khuất"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Caption Input */}
        <div className="w-full mt-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Chú thích dưới hình (hiển thị trong đề thi):
          </label>
          <input
            type="text"
            value={caption}
            onChange={handleCaptionChange}
            placeholder="Ví dụ: Hình 1. Đồ thị hàm số y = f(x)"
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Parameter Controls Panel */}
      <div className="lg:col-span-5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <h4 className="font-bold text-slate-800 text-[13px]">{config.title}</h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
            Toán {config.grade}
          </span>
        </div>

        {/* Specific Model Parameter Controls */}
        <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
          {/* CUBIC FUNCTION */}
          {config.type === 'cubic_function' && (
            <>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Hệ số a (bậc 3):</span>
                  <span className="font-mono text-indigo-600">{localParams.a}</span>
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.5"
                  value={localParams.a}
                  onChange={(e) => handleParamChange('a', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Hệ số b (bậc 2):</span>
                  <span className="font-mono text-indigo-600">{localParams.b}</span>
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={localParams.b}
                  onChange={(e) => handleParamChange('b', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Hệ số c (bậc 1):</span>
                  <span className="font-mono text-indigo-600">{localParams.c}</span>
                </label>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="0.5"
                  value={localParams.c}
                  onChange={(e) => handleParamChange('c', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Hệ số d (tự do):</span>
                  <span className="font-mono text-indigo-600">{localParams.d}</span>
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={localParams.d}
                  onChange={(e) => handleParamChange('d', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </>
          )}

          {/* PARABOLA */}
          {config.type === 'parabola_quadratic' && (
            <>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Hệ số a:</span>
                  <span className="font-mono text-indigo-600">{localParams.a}</span>
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.5"
                  value={localParams.a}
                  onChange={(e) => handleParamChange('a', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Hệ số b:</span>
                  <span className="font-mono text-indigo-600">{localParams.b}</span>
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={localParams.b}
                  onChange={(e) => handleParamChange('b', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Hệ số c:</span>
                  <span className="font-mono text-indigo-600">{localParams.c}</span>
                </label>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="0.5"
                  value={localParams.c}
                  onChange={(e) => handleParamChange('c', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </>
          )}

          {/* 3D OXYZ PLANE */}
          {config.type === 'space_3d_oxyz' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Hệ số A:</label>
                  <input
                    type="number"
                    value={localParams.planeA}
                    onChange={(e) => handleParamChange('planeA', parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Hệ số B:</label>
                  <input
                    type="number"
                    value={localParams.planeB}
                    onChange={(e) => handleParamChange('planeB', parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Hệ số C:</label>
                  <input
                    type="number"
                    value={localParams.planeC}
                    onChange={(e) => handleParamChange('planeC', parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Hệ số D:</label>
                  <input
                    type="number"
                    value={localParams.planeD}
                    onChange={(e) => handleParamChange('planeD', parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">Góc xoay camera 3D:</span>
                <div>
                  <label className="flex justify-between font-semibold text-slate-600 text-[10px]">
                    <span>Góc nghiêng (Pitch X):</span>
                    <span className="font-mono">{localCamera.rotX.toFixed(0)}°</span>
                  </label>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    value={localCamera.rotX}
                    onChange={(e) => {
                      const next = { ...localCamera, rotX: parseFloat(e.target.value) };
                      setLocalCamera(next);
                      notifyChange(localParams, next, localView, caption);
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="flex justify-between font-semibold text-slate-600 text-[10px]">
                    <span>Góc quay (Yaw Y):</span>
                    <span className="font-mono">{localCamera.rotY.toFixed(0)}°</span>
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={localCamera.rotY}
                    onChange={(e) => {
                      const next = { ...localCamera, rotY: parseFloat(e.target.value) };
                      setLocalCamera(next);
                      notifyChange(localParams, next, localView, caption);
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* SOLID GEOMETRY 3D PYRAMID */}
          {config.type === 'solid_geometry_3d' && (
            <>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Cạnh đáy hình vuông (a):</span>
                  <span className="font-mono text-indigo-600">{localParams.baseA}</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  step="0.5"
                  value={localParams.baseA}
                  onChange={(e) => handleParamChange('baseA', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Chiều cao hình chóp (h):</span>
                  <span className="font-mono text-indigo-600">{localParams.heightH}</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="7"
                  step="0.5"
                  value={localParams.heightH}
                  onChange={(e) => handleParamChange('heightH', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </>
          )}

          {/* TRIG CIRCLE */}
          {config.type === 'trig_circle' && (
            <>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Góc lượng giác α:</span>
                  <span className="font-mono text-indigo-600">{localParams.angleDeg}°</span>
                </label>
                <input
                  type="range"
                  min="-360"
                  max="360"
                  step="15"
                  value={localParams.angleDeg}
                  onChange={(e) => handleParamChange('angleDeg', parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </>
          )}

          {/* CONIC */}
          {config.type === 'conic_sections' && (
            <>
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Dạng đường Conic:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['ellipse', 'hyperbola', 'parabola'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleParamChange('conicType', t)}
                      className={`py-1 rounded-lg text-xs font-semibold capitalize border ${
                        localParams.conicType === t
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {t === 'ellipse' ? 'Elip' : t === 'hyperbola' ? 'Hypebol' : 'Parabol'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Bán trục lớn a:</span>
                  <span className="font-mono text-indigo-600">{localParams.a}</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  step="0.5"
                  value={localParams.a}
                  onChange={(e) => handleParamChange('a', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Bán trục bé b:</span>
                  <span className="font-mono text-indigo-600">{localParams.b}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.5"
                  value={localParams.b}
                  onChange={(e) => handleParamChange('b', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </>
          )}

          {/* 2D VECTORS */}
          {config.type === 'vector_2d' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700">Tọa độ ux:</label>
                <input
                  type="number"
                  value={localParams.ux}
                  onChange={(e) => handleParamChange('ux', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Tọa độ uy:</label>
                <input
                  type="number"
                  value={localParams.uy}
                  onChange={(e) => handleParamChange('uy', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Tọa độ vx:</label>
                <input
                  type="number"
                  value={localParams.vx}
                  onChange={(e) => handleParamChange('vx', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Tọa độ vy:</label>
                <input
                  type="number"
                  value={localParams.vy}
                  onChange={(e) => handleParamChange('vy', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>
          )}

          {/* BOX PLOT */}
          {config.type === 'statistics_box_plot' && (
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Dãy số liệu thống kê (phân cách dấu phẩy):</label>
              <textarea
                rows={3}
                value={localParams.rawData}
                onChange={(e) => handleParamChange('rawData', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-xs"
              />
            </div>
          )}

          {/* SET VENN */}
          {config.type === 'set_venn' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700">Tập A mút trái (a1):</label>
                <input
                  type="number"
                  value={localParams.a1}
                  onChange={(e) => handleParamChange('a1', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Tập A mút phải (a2):</label>
                <input
                  type="number"
                  value={localParams.a2}
                  onChange={(e) => handleParamChange('a2', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Tập B mút trái (b1):</label>
                <input
                  type="number"
                  value={localParams.b1}
                  onChange={(e) => handleParamChange('b1', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Tập B mút phải (b2):</label>
                <input
                  type="number"
                  value={localParams.b2}
                  onChange={(e) => handleParamChange('b2', parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathGraphicsEditor;
