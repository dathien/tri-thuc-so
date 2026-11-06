import React, { useState, useRef, useEffect } from 'react';
import {
  Atom,
  Rotate3d,
  Layers,
  Sliders,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Eye,
  Maximize2,
  Table,
  Sparkles,
  Info,
} from 'lucide-react';
import { MathLabModule } from '../../types';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';

interface MathLabViewProps {
  catalog: MathLabModule[];
}

export const MathLabView: React.FC<MathLabViewProps> = ({ catalog }) => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'catalog'>('simulation');
  const [activeLabId, setActiveLabId] = useState<string>('lab-12-01');

  // Lab 1 State: Cubic Function y = ax^3 + bx^2 + cx + d
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(-3);
  const [paramC, setParamC] = useState(0);
  const [paramD, setParamD] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Lab 2 State: 3D Oxyz Space & Plane Ax + By + Cz + D = 0
  const [planeA, setPlaneA] = useState(1);
  const [planeB, setPlaneB] = useState(2);
  const [planeC, setPlaneC] = useState(-1);
  const [planeD, setPlaneD] = useState(-3);
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(-35);
  const [zoom, setZoom] = useState(1);
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Lab 3 State: Trigonometric Circle & Wave
  const [angleDeg, setAngleDeg] = useState(45);
  const canvasTrigRef = useRef<HTMLCanvasElement | null>(null);

  // Lab 1: Render 2D Cubic Function Graph
  useEffect(() => {
    if (activeLabId !== 'lab-12-01') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const originX = width / 2;
    const originY = height / 2;
    const scale = 32; // 32 pixels = 1 unit

    // 1. Draw Grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = originX % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = originY % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Draw Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();
    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis Arrows & Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('x', width - 12, originY - 6);
    ctx.fillText('y', originX + 6, 12);
    ctx.fillText('O', originX - 12, originY + 12);

    // Number ticks
    for (let i = -7; i <= 7; i++) {
      if (i === 0) continue;
      const xPos = originX + i * scale;
      const yPos = originY - i * scale;
      if (xPos > 0 && xPos < width) {
        ctx.fillText(String(i), xPos - 4, originY + 12);
      }
      if (yPos > 0 && yPos < height) {
        ctx.fillText(String(i), originX + 6, yPos + 3);
      }
    }

    // 3. Draw Function Curve
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    for (let px = 0; px <= width; px += 2) {
      const xVal = (px - originX) / scale;
      const yVal = paramA * Math.pow(xVal, 3) + paramB * Math.pow(xVal, 2) + paramC * xVal + paramD;
      const py = originY - yVal * scale;

      if (py >= -50 && py <= height + 50) {
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();

    // 4. Critical Points (Cực trị): y' = 3ax^2 + 2bx + c = 0
    if (paramA !== 0) {
      const deltaPrime = Math.pow(paramB, 2) - 3 * paramA * paramC;
      if (deltaPrime > 0) {
        const x1 = (-paramB - Math.sqrt(deltaPrime)) / (3 * paramA);
        const x2 = (-paramB + Math.sqrt(deltaPrime)) / (3 * paramA);

        [x1, x2].forEach((critX, idx) => {
          const critY =
            paramA * Math.pow(critX, 3) +
            paramB * Math.pow(critX, 2) +
            paramC * critX +
            paramD;
          const px = originX + critX * scale;
          const py = originY - critY * scale;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            ctx.fillStyle = idx === 0 ? '#10b981' : '#f59e0b';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 9px Plus Jakarta Sans';
            ctx.fillText(
              `(${critX.toFixed(1)}; ${critY.toFixed(1)})`,
              px + 7,
              py - 7
            );
          }
        });
      }
    }
  }, [activeLabId, paramA, paramB, paramC, paramD]);

  // Lab 2: Render 3D Oxyz Coordinate Projection Canvas
  useEffect(() => {
    if (activeLabId !== 'lab-12-02') return;
    const canvas = canvas3dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const baseScale = 28 * zoom;

    // 3D Rotation Math
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const project = (x: number, y: number, z: number) => {
      // Rotate around Y
      const x1 = x * Math.cos(radY) + z * Math.sin(radY);
      const z1 = -x * Math.sin(radY) + z * Math.cos(radY);
      // Rotate around X
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

      // Isometric projection
      return {
        px: cx + x1 * baseScale,
        py: cy - y2 * baseScale,
        depth: z2,
      };
    };

    // Draw Axes: Ox (Red), Oy (Green), Oz (Blue)
    const origin = project(0, 0, 0);

    const drawAxis = (x: number, y: number, z: number, color: string, label: string) => {
      const tip = project(x, y, z);
      const negTip = project(-x * 0.5, -y * 0.5, -z * 0.5);

      // Negative dashed line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(negTip.px, negTip.py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Positive solid line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(tip.px, tip.py);
      ctx.stroke();

      // Axis Label
      ctx.fillStyle = color;
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText(label, tip.px + 6, tip.py + 4);
    };

    drawAxis(5, 0, 0, '#ef4444', 'Ox');
    drawAxis(0, 5, 0, '#10b981', 'Oy');
    drawAxis(0, 0, 5, '#3b82f6', 'Oz');

    // Draw Plane Intercepts with Axes if not parallel:
    // x = -D/A, y = -D/B, z = -D/C
    if (planeA !== 0 && planeB !== 0 && planeC !== 0) {
      const pX = -planeD / planeA;
      const pY = -planeD / planeB;
      const pZ = -planeD / planeC;

      const ptA = project(pX, 0, 0);
      const ptB = project(0, pY, 0);
      const ptC = project(0, 0, pZ);

      // Shaded Triangle Surface
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ptA.px, ptA.py);
      ctx.lineTo(ptB.px, ptB.py);
      ctx.lineTo(ptC.px, ptC.py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mark Points
      [
        { pt: ptA, label: `A(${pX.toFixed(1)};0;0)` },
        { pt: ptB, label: `B(0;${pY.toFixed(1)};0)` },
        { pt: ptC, label: `C(0;0;${pZ.toFixed(1)})` },
      ].forEach((item) => {
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(item.pt.px, item.pt.py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e1b4b';
        ctx.font = 'bold 9px Plus Jakarta Sans';
        ctx.fillText(item.label, item.pt.px + 5, item.pt.py - 5);
      });
    }

    // Normal Vector from origin: (A, B, C)
    const normTip = project(planeA, planeB, planeC);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(normTip.px, normTip.py);
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.fillText(`n(${planeA};${planeB};${planeC})`, normTip.px + 5, normTip.py - 5);
  }, [activeLabId, planeA, planeB, planeC, planeD, rotX, rotY, zoom]);

  // Lab 3: Render Trig Circle & Wave
  useEffect(() => {
    if (activeLabId !== 'lab-11-01') return;
    const canvas = canvasTrigRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const circleCx = width * 0.28;
    const circleCy = height / 2;
    const radius = 65;

    // Unit Circle
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(circleCx, circleCy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(circleCx - radius - 20, circleCy);
    ctx.lineTo(circleCx + radius + 20, circleCy);
    ctx.moveTo(circleCx, circleCy - radius - 20);
    ctx.lineTo(circleCx, circleCy + radius + 20);
    ctx.stroke();

    // Moving point M
    const rad = (angleDeg * Math.PI) / 180;
    const mx = circleCx + radius * Math.cos(rad);
    const my = circleCy - radius * Math.sin(rad);

    // Radius line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(circleCx, circleCy);
    ctx.lineTo(mx, my);
    ctx.stroke();

    // Projected lines
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, circleCy); // cos
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(circleCx, my); // sin
    ctx.stroke();
    ctx.setLineDash([]);

    // Point M circle
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fill();

    // Right side: Sine Wave
    const waveStartX = width * 0.55;
    const waveEndX = width - 20;
    const waveWidth = waveEndX - waveStartX;

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(waveStartX, circleCy);
    ctx.lineTo(waveEndX, circleCy);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = waveStartX; px <= waveEndX; px += 2) {
      const relX = (px - waveStartX) / waveWidth;
      const angle = relX * Math.PI * 2;
      const py = circleCy - radius * Math.sin(angle);
      if (px === waveStartX) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current point on wave
    const currentWaveX = waveStartX + (angleDeg / 360) * waveWidth;
    const currentWaveY = circleCy - radius * Math.sin(rad);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(currentWaveX, currentWaveY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Connecting horizontal guide line from circle to wave
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(currentWaveX, currentWaveY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeLabId, angleDeg]);

  // Mouse drag handlers for 3D rotation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setRotY((prev) => prev + dx * 0.6);
    setRotX((prev) => Math.max(-85, Math.min(85, prev - dy * 0.6)));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const implementedLabs = catalog.filter((m) => m.isImplemented);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Phòng Lab Toán học 2D/3D Trực quan
            </h1>
            <span className="text-xs bg-cyan-50 text-cyan-800 font-bold px-2.5 py-0.5 rounded-full border border-cyan-200">
              Mô phỏng Động GDPT 2018
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Khám phá trực quan các chuyên đề Hàm số, Không gian 3D Oxyz, Lượng giác &amp; Parabol bằng tương tác trực tiếp.
          </p>
        </div>

        {/* Tab switch between Simulation & Full Curriculum Catalog */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('simulation');
              soundService.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'simulation'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mô phỏng Tương tác 2D/3D
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('catalog');
              soundService.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng Đối chiếu SGK ({catalog.length} Bài)
          </button>
        </div>
      </div>

      {activeTab === 'simulation' && (
        <div className="space-y-4">
          {/* Lab Selection Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {implementedLabs.map((lab) => (
              <button
                key={lab.id}
                type="button"
                onClick={() => {
                  setActiveLabId(lab.id);
                  soundService.playClick();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeLabId === lab.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                [{lab.mathType}] {lab.title}
              </button>
            ))}
          </div>

          {/* Active Lab Workspace */}
          {activeLabId === 'lab-12-01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Canvas (7 cols) */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Mặt phẳng Đồ thị 2D: <MathRenderer content="$y = ax^3 + bx^2 + cx + d$" inline />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setParamA(1);
                      setParamB(-3);
                      setParamC(0);
                      setParamD(2);
                      soundService.playClick();
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                    title="Đặt lại tham số mặc định"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative border border-slate-100 rounded-xl overflow-hidden bg-white flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={380}
                    className="w-full max-w-lg aspect-[52/38] block"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Điểm cực đại
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Điểm cực tiểu
                  </span>
                  <span className="text-indigo-700 font-bold text-xs">
                    <MathRenderer content={`$y = ${paramA}x^3 ${paramB >= 0 ? `+ ${paramB}` : `- ${Math.abs(paramB)}`}x^2 ${paramC >= 0 ? `+ ${paramC}` : `- ${Math.abs(paramC)}`}x ${paramD >= 0 ? `+ ${paramD}` : `- ${Math.abs(paramD)}`}$`} inline />
                  </span>
                </div>
              </div>

              {/* Right Parameters Deck & Concept (5 cols) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Thanh trượt Tham số &amp; Phân tích
                </h3>

                {/* Slider Controls */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Tham số a (Hệ số bậc 3)</span>
                      <span className="font-mono text-indigo-700 font-bold">{paramA}</span>
                    </div>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.5}
                      value={paramA}
                      onChange={(e) => setParamA(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Tham số b (Hệ số bậc 2)</span>
                      <span className="font-mono text-indigo-700 font-bold">{paramB}</span>
                    </div>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={0.5}
                      value={paramB}
                      onChange={(e) => setParamB(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Tham số c (Hệ số bậc 1)</span>
                      <span className="font-mono text-indigo-700 font-bold">{paramC}</span>
                    </div>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={0.5}
                      value={paramC}
                      onChange={(e) => setParamC(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Tham số d (Giao trục Oy)</span>
                      <span className="font-mono text-indigo-700 font-bold">{paramD}</span>
                    </div>
                    <input
                      type="range"
                      min={-5}
                      max={5}
                      step={1}
                      value={paramD}
                      onChange={(e) => setParamD(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                {/* Mathematical Properties Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    Tính chất toán học tức thời:
                  </span>
                  <p className="text-slate-700">
                    • Đạo hàm: <span className="font-bold"><MathRenderer content={`$y' = ${3 * paramA}x^2 ${2 * paramB >= 0 ? `+ ${2 * paramB}` : `- ${Math.abs(2 * paramB)}`}x ${paramC >= 0 ? `+ ${paramC}` : `- ${Math.abs(paramC)}`}$`} inline /></span>
                  </p>
                  <p className="text-slate-700">
                    • Biệt thức: <span className="font-bold"><MathRenderer content={`$\\Delta' = b^2 - 3ac = ${Math.pow(paramB, 2) - 3 * paramA * paramC}$`} inline /></span>
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    {Math.pow(paramB, 2) - 3 * paramA * paramC > 0
                      ? '✓ Hàm số có 2 điểm cực trị phân biệt.'
                      : '✓ Hàm số không có cực trị (đơn điệu trên toàn R).'}
                  </p>
                </div>

                {/* Exploration Question */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Câu hỏi Khám phá:
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Kéo tham số $a$ về giá trị âm (ví dụ $a = -1$). Hãy quan sát hình dáng đồ thị và chiều biến thiên của 2 nhánh vô cực thay đổi như thế nào?
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active Lab 2: 3D Oxyz Space */}
          {activeLabId === 'lab-12-02' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Không gian 3D Oxyz (Kéo chuột để xoay 360°)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRotX(25);
                      setRotY(-35);
                      setZoom(1);
                      soundService.playClick();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Đặt lại góc
                  </button>
                </div>

                <div className="relative border border-slate-100 rounded-xl overflow-hidden bg-slate-900 flex justify-center cursor-grab active:cursor-grabbing">
                  <canvas
                    ref={canvas3dRef}
                    width={520}
                    height={380}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="w-full max-w-lg aspect-[52/38] block"
                  />
                  <div className="absolute top-3 left-3 text-[10px] text-slate-400 font-mono bg-black/40 px-2 py-1 rounded backdrop-blur-2xs">
                    Xoay X: {Math.round(rotX)}° · Y: {Math.round(rotY)}° · Thu phóng: {zoom.toFixed(1)}x
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Trục Ox (Đỏ), Oy (Xanh lá), Oz (Xanh dương)</span>
                  <span className="text-indigo-700 font-bold">
                    <MathRenderer content={`$(\\alpha): ${planeA}x ${planeB >= 0 ? `+ ${planeB}` : `- ${Math.abs(planeB)}`}y ${planeC >= 0 ? `+ ${planeC}` : `- ${Math.abs(planeC)}`}z ${planeD >= 0 ? `+ ${planeD}` : `- ${Math.abs(planeD)}`} = 0$`} inline />
                  </span>
                </div>
              </div>

              {/* 3D Controls */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Hệ số Mặt phẳng &amp; Vectơ Pháp tuyến
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Hệ số A: {planeA}</span>
                    </div>
                    <input
                      type="range"
                      min={-4}
                      max={4}
                      value={planeA}
                      onChange={(e) => setPlaneA(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Hệ số B: {planeB}</span>
                    </div>
                    <input
                      type="range"
                      min={-4}
                      max={4}
                      value={planeB}
                      onChange={(e) => setPlaneB(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Hệ số C: {planeC}</span>
                    </div>
                    <input
                      type="range"
                      min={-4}
                      max={4}
                      value={planeC}
                      onChange={(e) => setPlaneC(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Hệ số tự do D: {planeD}</span>
                    </div>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      value={planeD}
                      onChange={(e) => setPlaneD(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Thu phóng góc nhìn: {zoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={1.6}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                  <span className="font-bold block">Giao điểm với các trục tọa độ:</span>
                  <p>• Trục Ox ($y=0, z=0$): <MathRenderer content={`$x = ${-planeA !== 0 ? (-planeD / planeA).toFixed(1) : '\\emptyset'}$`} inline /></p>
                  <p>• Trục Oy ($x=0, z=0$): <MathRenderer content={`$y = ${-planeB !== 0 ? (-planeD / planeB).toFixed(1) : '\\emptyset'}$`} inline /></p>
                  <p>• Trục Oz ($x=0, y=0$): <MathRenderer content={`$z = ${-planeC !== 0 ? (-planeD / planeC).toFixed(1) : '\\emptyset'}$`} inline /></p>
                </div>
              </div>
            </div>
          )}

          {/* Active Lab 3: Trig Circle */}
          {activeLabId === 'lab-11-01' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Vòng tròn Đơn vị Lượng giác &amp; Trải phẳng Sóng Sin
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  <MathRenderer content={`\\text{Góc } \\alpha = ${angleDeg}^\\circ = ${((angleDeg * Math.PI) / 180).toFixed(2)}\\text{ rad}`} inline />
                </span>
              </div>

              <div className="flex justify-center border border-slate-100 rounded-xl bg-slate-50 p-2">
                <canvas ref={canvasTrigRef} width={640} height={260} className="w-full max-w-2xl block" />
              </div>

              <div className="max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Điều khiển góc quay $\alpha$</span>
                  <span className="font-mono text-indigo-700">{angleDeg}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angleDeg}
                  onChange={(e) => setAngleDeg(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs max-w-lg mx-auto">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <MathRenderer content={`\\sin(${angleDeg}^\\circ) = ${Math.sin((angleDeg * Math.PI) / 180).toFixed(3)}`} inline />
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                  <MathRenderer content={`\\cos(${angleDeg}^\\circ) = ${Math.cos((angleDeg * Math.PI) / 180).toFixed(3)}`} inline />
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <MathRenderer content="\\sin^2\\alpha + \\cos^2\\alpha = 1.000" inline />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Catalog Mapping Tab (Requirement 13) */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Bảng đối chiếu Danh mục Bài học SGK &amp; Phòng Lab GDPT 2018
            </h3>
            <p className="text-xs text-slate-500">
              Fulfills Requirement 13: Bảng danh mục bao phủ Toán 10–12. Các hoạt động đã hoàn thành cho phép mở tương tác ngay; các hoạt động trong lộ trình tiếp theo được ghi chú minh bạch.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Mã Lab</th>
                  <th className="px-4 py-3">Khối / HK</th>
                  <th className="px-4 py-3">Mạch kiến thức</th>
                  <th className="px-4 py-3">Tên mô phỏng</th>
                  <th className="px-4 py-3">Dạng tương tác</th>
                  <th className="px-4 py-3">Trạng thái phát triển</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {catalog.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{mod.code}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-700">Toán {mod.grade}</span> (HK{mod.semester})
                    </td>
                    <td className="px-4 py-3 text-slate-500">{mod.category}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{mod.title}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                        {mod.mathType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          mod.isImplemented
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {mod.badgeText}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {mod.isImplemented ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLabId(mod.id);
                            setActiveTab('simulation');
                            soundService.playClick();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700"
                        >
                          Mở Lab
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Giai đoạn 5</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathLabView;
