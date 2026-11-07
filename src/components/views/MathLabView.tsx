import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ZoomIn,
  ZoomOut,
  Compass,
  Filter,
  Search,
  BookOpen,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowRight,
  ChevronRight,
  CircleDot,
  Box,
  Binary,
  Check,
  Grid3X3,
  Activity,
  Calculator,
} from 'lucide-react';
import { MathLabModule } from '../../types';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';

interface MathLabViewProps {
  catalog: MathLabModule[];
}

/**
 * Utility: Greatest common divisor for simplifying fractions
 */
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/**
 * Utility: Format fraction into LaTeX and decimal string
 */
function formatFraction(num: number, den: number): {
  fracLatex: string;
  decVal: number;
  decLatex: string;
  isInteger: boolean;
} {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const div = gcd(num, den);
  const sNum = num / div;
  const sDen = den / div;
  const decVal = sNum / sDen;
  const isInteger = sDen === 1;

  let decLatex = '';
  if (isInteger) {
    decLatex = `${sNum}`;
  } else {
    const rounded = Math.round(decVal * 100) / 100;
    decLatex = String(rounded).replace('.', '{,}');
  }

  let fracLatex = '';
  if (isInteger) {
    fracLatex = `${sNum}`;
  } else if (sNum < 0) {
    fracLatex = `-\\frac{${Math.abs(sNum)}}{${sDen}}`;
  } else {
    fracLatex = `\\frac{${sNum}}{${sDen}}`;
  }

  return { fracLatex, decVal, decLatex, isInteger };
}

/**
 * Format dynamic radian expression:
 * \alpha = 45^\circ = \frac{\pi}{4}\ \text{rad} \approx 0{,}7854\ \text{rad}
 */
function formatRadianLatex(deg: number): string {
  const radVal = (deg * Math.PI) / 180;
  const decStr = radVal.toFixed(4).replace('.', '{,}');

  if (deg === 0) {
    return `\\alpha = 0^\\circ = 0\\ \\text{rad}`;
  }

  const div = gcd(deg, 180);
  const num = deg / div;
  const den = 180 / div;

  let fracPart = '';
  if (den === 1) {
    fracPart = num === 1 ? '\\pi' : `${num}\\pi`;
  } else {
    const numPart = num === 1 ? '\\pi' : `${num}\\pi`;
    fracPart = `\\frac{${numPart}}{${den}}`;
  }

  return `\\alpha = ${deg}^\\circ = ${fracPart}\\ \\text{rad} \\approx ${decStr}\\ \\text{rad}`;
}

/**
 * Format plane equation: (\alpha): Ax + By + Cz + D = 0
 */
function formatPlaneEquation(A: number, B: number, C: number, D: number): string {
  if (A === 0 && B === 0 && C === 0) {
    return `(\\alpha): ${D} = 0`;
  }

  const parts: string[] = [];

  if (A !== 0) {
    if (A === 1) parts.push('x');
    else if (A === -1) parts.push('-x');
    else parts.push(`${A}x`);
  }

  if (B !== 0) {
    if (parts.length === 0) {
      if (B === 1) parts.push('y');
      else if (B === -1) parts.push('-y');
      else parts.push(`${B}y`);
    } else {
      const sign = B > 0 ? '+' : '-';
      const absB = Math.abs(B);
      parts.push(`${sign} ${absB === 1 ? '' : absB}y`);
    }
  }

  if (C !== 0) {
    if (parts.length === 0) {
      if (C === 1) parts.push('z');
      else if (C === -1) parts.push('-z');
      else parts.push(`${C}z`);
    } else {
      const sign = C > 0 ? '+' : '-';
      const absC = Math.abs(C);
      parts.push(`${sign} ${absC === 1 ? '' : absC}z`);
    }
  }

  if (D !== 0) {
    if (parts.length === 0) {
      parts.push(`${D}`);
    } else {
      const sign = D > 0 ? '+' : '-';
      parts.push(`${sign} ${Math.abs(D)}`);
    }
  }

  return `(\\alpha): ${parts.join(' ')} = 0`;
}

/**
 * Format cubic function: y = ax^3 + bx^2 + cx + d
 */
function formatCubicEquation(a: number, b: number, c: number, d: number): string {
  const parts: string[] = [];

  if (a !== 0) {
    if (a === 1) parts.push('x^3');
    else if (a === -1) parts.push('-x^3');
    else parts.push(`${a}x^3`);
  }

  if (b !== 0) {
    if (parts.length === 0) {
      if (b === 1) parts.push('x^2');
      else if (b === -1) parts.push('-x^2');
      else parts.push(`${b}x^2`);
    } else {
      parts.push(b > 0 ? `+ ${b === 1 ? '' : b}x^2` : `- ${Math.abs(b) === 1 ? '' : Math.abs(b)}x^2`);
    }
  }

  if (c !== 0) {
    if (parts.length === 0) {
      if (c === 1) parts.push('x');
      else if (c === -1) parts.push('-x');
      else parts.push(`${c}x`);
    } else {
      parts.push(c > 0 ? `+ ${c === 1 ? '' : c}x` : `- ${Math.abs(c) === 1 ? '' : Math.abs(c)}x`);
    }
  }

  if (d !== 0) {
    if (parts.length === 0) {
      parts.push(`${d}`);
    } else {
      parts.push(d > 0 ? `+ ${d}` : `- ${Math.abs(d)}`);
    }
  }

  return `y = ${parts.length > 0 ? parts.join(' ') : '0'}`;
}

/**
 * Format quadratic function: y = ax^2 + bx + c
 */
function formatParabolEquation(a: number, b: number, c: number): string {
  const parts: string[] = [];

  if (a !== 0) {
    if (a === 1) parts.push('x^2');
    else if (a === -1) parts.push('-x^2');
    else parts.push(`${a}x^2`);
  }

  if (b !== 0) {
    if (parts.length === 0) {
      if (b === 1) parts.push('x');
      else if (b === -1) parts.push('-x');
      else parts.push(`${b}x`);
    } else {
      parts.push(b > 0 ? `+ ${b === 1 ? '' : b}x` : `- ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
    }
  }

  if (c !== 0) {
    if (parts.length === 0) {
      parts.push(`${c}`);
    } else {
      parts.push(c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`);
    }
  }

  return `y = ${parts.length > 0 ? parts.join(' ') : '0'}`;
}

export const MathLabView: React.FC<MathLabViewProps> = ({ catalog }) => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'catalog'>('simulation');
  const [activeLabId, setActiveLabId] = useState<string>('lab-12-02');

  // Filter States for Lab Navigator
  const [filterGrade, setFilterGrade] = useState<'all' | 10 | 11 | 12>('all');
  const [filterSemester, setFilterSemester] = useState<'all' | 1 | 2>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------------------
  // Lab 1 State: Cubic Function y = ax^3 + bx^2 + cx + d
  // -------------------------------------------------------------------------
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(-3);
  const [paramC, setParamC] = useState(0);
  const [paramD, setParamD] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 2 State: 3D Oxyz Space & Plane Ax + By + Cz + D = 0
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Lab 3 State: Trigonometric Circle & Wave
  // -------------------------------------------------------------------------
  const [angleDeg, setAngleDeg] = useState(45);
  const canvasTrigRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 4 State: Parabola y = ax^2 + bx + c
  // -------------------------------------------------------------------------
  const [parabolA, setParabolA] = useState(1);
  const [parabolB, setParabolB] = useState(-2);
  const [parabolC, setParabolC] = useState(-3);
  const canvasParabolRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 5 State: Set Theory & Intervals
  // -------------------------------------------------------------------------
  const [intervalA1, setIntervalA1] = useState(-4);
  const [intervalA2, setIntervalA2] = useState(2);
  const [intervalB1, setIntervalB1] = useState(-1);
  const [intervalB2, setIntervalB2] = useState(5);
  const [setOpMode, setSetOpMode] = useState<'intersection' | 'union' | 'diffAB' | 'diffBA'>('intersection');
  const canvasSetRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 6 State: Conic Sections (Elip, Hyperbol, Parabol)
  // -------------------------------------------------------------------------
  const [conicType, setConicType] = useState<'ellipse' | 'hyperbola' | 'parabola'>('ellipse');
  const [conicA, setConicA] = useState(4);
  const [conicB, setConicB] = useState(2.5);
  const [conicP, setConicP] = useState(2);
  const canvasConicRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 7 State: Dynamic 2D Vectors & Dot Product
  // -------------------------------------------------------------------------
  const [vecUx, setVecUx] = useState(3);
  const [vecUy, setVecUy] = useState(2);
  const [vecVx, setVecVx] = useState(-1);
  const [vecVy, setVecVy] = useState(3);
  const canvasVecRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 8 State: Exponential & Logarithmic Functions
  // -------------------------------------------------------------------------
  const [baseA, setBaseA] = useState(2);
  const canvasExpLogRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 9 State: Derivative & Tangent Line Secant Limit
  // -------------------------------------------------------------------------
  const [tangentX0, setTangentX0] = useState(1);
  const [secantDeltaX, setSecantDeltaX] = useState(0.8);
  const canvasTangentRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 10 State: Riemann Integral & Area Under Curve
  // -------------------------------------------------------------------------
  const [riemannN, setRiemannN] = useState(12);
  const [riemannA, setRiemannA] = useState(0);
  const [riemannB, setRiemannB] = useState(3);
  const canvasRiemannRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 11 State: 3D Pyramid Geometry
  // -------------------------------------------------------------------------
  const [pyrBaseA, setPyrBaseA] = useState(3.5);
  const [pyrHeightH, setPyrHeightH] = useState(4);
  const [pyrRotX, setPyrRotX] = useState(20);
  const [pyrRotY, setPyrRotY] = useState(-40);
  const canvasPyrRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 12 State: Bayes Diagnostic Tree Simulation
  // -------------------------------------------------------------------------
  const [bayesPrevalence, setBayesPrevalence] = useState(0.02); // 2% disease prevalence
  const [bayesSensitivity, setBayesSensitivity] = useState(0.95); // 95% sensitivity P(Pos|Disease)
  const [bayesFalsePos, setBayesFalsePos] = useState(0.05); // 5% false positive P(Pos|Healthy)

  // -------------------------------------------------------------------------
  // Lab 13 State: Descriptive Statistics & Box Plot
  // -------------------------------------------------------------------------
  const [statDataRaw, setStatDataRaw] = useState<number[]>([4, 5, 6, 6, 7, 7, 7, 8, 8, 8.5, 9, 9, 9.5, 10]);
  const canvasBoxPlotRef = useRef<HTMLCanvasElement | null>(null);

  // =========================================================================
  // Canvas Renderers
  // =========================================================================

  // Lab 1: 2D Cubic Curve
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
    const scale = 32;

    // Grid
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

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 14, originY - 6);
    ctx.fillText('y', originX + 6, 14);
    ctx.fillText('O', originX - 14, originY + 14);

    for (let i = -7; i <= 7; i++) {
      if (i === 0) continue;
      const xPos = originX + i * scale;
      const yPos = originY - i * scale;
      if (xPos > 0 && xPos < width) {
        ctx.fillText(String(i), xPos - 4, originY + 14);
      }
      if (yPos > 0 && yPos < height) {
        ctx.fillText(String(i), originX + 6, yPos + 4);
      }
    }

    // Cubic Curve
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

    // Critical Points
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
            ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
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

  // Lab 2: 3D Oxyz Space & Plane
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

    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const project = (x: number, y: number, z: number) => {
      const x1 = x * Math.cos(radY) + z * Math.sin(radY);
      const z1 = -x * Math.sin(radY) + z * Math.cos(radY);
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

      return {
        px: cx + x1 * baseScale,
        py: cy - y2 * baseScale,
        depth: z2,
      };
    };

    const origin = project(0, 0, 0);

    // Coordinate grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let gx = -4; gx <= 4; gx++) {
      const p1 = project(gx, -4, 0);
      const p2 = project(gx, 4, 0);
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();
    }
    for (let gy = -4; gy <= 4; gy++) {
      const p1 = project(-4, gy, 0);
      const p2 = project(4, gy, 0);
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();
    }

    // Axes
    const drawAxis = (x: number, y: number, z: number, color: string, label: string) => {
      const tip = project(x, y, z);
      const negTip = project(-x * 0.4, -y * 0.4, -z * 0.4);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(negTip.px, negTip.py);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(tip.px, tip.py);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(label, tip.px + 6, tip.py + 4);
    };

    drawAxis(5, 0, 0, '#ef4444', 'Ox');
    drawAxis(0, 5, 0, '#10b981', 'Oy');
    drawAxis(0, 0, 5, '#38bdf8', 'Oz');

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('O', origin.px - 12, origin.py + 12);

    // Plane Drawing
    const hasPlaneCoeffs = planeA !== 0 || planeB !== 0 || planeC !== 0;
    if (hasPlaneCoeffs) {
      if (planeA !== 0 && planeB !== 0 && planeC !== 0) {
        const pX = -planeD / planeA;
        const pY = -planeD / planeB;
        const pZ = -planeD / planeC;

        const ptA = project(pX, 0, 0);
        const ptB = project(0, pY, 0);
        const ptC = project(0, 0, pZ);

        ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ptA.px, ptA.py);
        ctx.lineTo(ptB.px, ptB.py);
        ctx.lineTo(ptC.px, ptC.py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const points = [
          { pt: ptA, name: `A(${pX % 1 === 0 ? pX : pX.toFixed(1)}; 0; 0)` },
          { pt: ptB, name: `B(0; ${pY % 1 === 0 ? pY : pY.toFixed(1)}; 0)` },
          { pt: ptC, name: `C(0; 0; ${pZ % 1 === 0 ? pZ : pZ.toFixed(1)})` },
        ];

        points.forEach((item) => {
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          ctx.arc(item.pt.px, item.pt.py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.fillText(item.name, item.pt.px + 6, item.pt.py - 6);
        });
      } else {
        let p0 = { x: 0, y: 0, z: 0 };
        if (planeC !== 0) p0 = { x: 0, y: 0, z: -planeD / planeC };
        else if (planeB !== 0) p0 = { x: 0, y: -planeD / planeB, z: 0 };
        else if (planeA !== 0) p0 = { x: -planeD / planeA, y: 0, z: 0 };

        let u = { x: 0, y: 0, z: 0 };
        if (planeA === 0 && planeB === 0) {
          u = { x: 1, y: 0, z: 0 };
        } else {
          u = { x: -planeB, y: planeA, z: 0 };
        }
        const uLen = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z) || 1;
        u.x /= uLen;
        u.y /= uLen;
        u.z /= uLen;

        const v = {
          x: planeB * u.z - planeC * u.y,
          y: planeC * u.x - planeA * u.z,
          z: planeA * u.y - planeB * u.x,
        };
        const vLen = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
        v.x /= vLen;
        v.y /= vLen;
        v.z /= vLen;

        const size = 3.5;
        const c1 = project(p0.x + size * (u.x + v.x), p0.y + size * (u.y + v.y), p0.z + size * (u.z + v.z));
        const c2 = project(p0.x + size * (-u.x + v.x), p0.y + size * (-u.y + v.y), p0.z + size * (-u.z + v.z));
        const c3 = project(p0.x + size * (-u.x - v.x), p0.y + size * (-u.y - v.y), p0.z + size * (-u.z - v.z));
        const c4 = project(p0.x + size * (u.x - v.x), p0.y + size * (u.y - v.y), p0.z + size * (u.z - v.z));

        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(c1.px, c1.py);
        ctx.lineTo(c2.px, c2.py);
        ctx.lineTo(c3.px, c3.py);
        ctx.lineTo(c4.px, c4.py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Normal Vector
      const normTip = project(planeA, planeB, planeC);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(origin.px, origin.py);
      ctx.lineTo(normTip.px, normTip.py);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(normTip.px, normTip.py, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(`n(${planeA}; ${planeB}; ${planeC})`, normTip.px + 6, normTip.py - 6);
    }
  }, [activeLabId, planeA, planeB, planeC, planeD, rotX, rotY, zoom]);

  // Lab 3: Unit Trig Circle & Sine Wave
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
    const radius = 70;

    // Unit Circle
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(circleCx, circleCy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Circle Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(circleCx - radius - 24, circleCy);
    ctx.lineTo(circleCx + radius + 24, circleCy);
    ctx.moveTo(circleCx, circleCy - radius - 24);
    ctx.lineTo(circleCx, circleCy + radius + 24);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('cos α', circleCx + radius + 8, circleCy - 6);
    ctx.fillText('sin α', circleCx + 6, circleCy - radius - 8);
    ctx.fillText('O', circleCx - 12, circleCy + 14);
    ctx.fillText('1', circleCx + radius + 2, circleCy + 12);
    ctx.fillText('-1', circleCx - radius - 16, circleCy + 12);
    ctx.fillText('1', circleCx + 6, circleCy - radius + 4);
    ctx.fillText('-1', circleCx + 6, circleCy + radius + 12);

    const rad = (angleDeg * Math.PI) / 180;
    const cosVal = Math.cos(rad);
    const sinVal = Math.sin(rad);
    const mx = circleCx + radius * cosVal;
    const my = circleCy - radius * sinVal;

    if (angleDeg > 0) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(circleCx, circleCy, 24, 0, -rad, true);
      ctx.stroke();

      ctx.fillStyle = '#9333ea';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText('α', circleCx + 26 * Math.cos(rad / 2), circleCy - 26 * Math.sin(rad / 2));
    }

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(circleCx, circleCy);
    ctx.lineTo(mx, my);
    ctx.stroke();

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, circleCy);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(circleCx, my);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`M(${cosVal.toFixed(2)}; ${sinVal.toFixed(2)})`, mx + 6, my - 6);

    // Sine Wave on Right
    const waveStartX = width * 0.54;
    const waveEndX = width - 24;
    const waveWidth = waveEndX - waveStartX;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(waveStartX, circleCy);
    ctx.lineTo(waveEndX, circleCy);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText('0', waveStartX, circleCy + 12);
    ctx.fillText('π/2', waveStartX + waveWidth * 0.25 - 6, circleCy + 12);
    ctx.fillText('π', waveStartX + waveWidth * 0.5 - 4, circleCy + 12);
    ctx.fillText('3π/2', waveStartX + waveWidth * 0.75 - 10, circleCy + 12);
    ctx.fillText('2π', waveEndX - 10, circleCy + 12);

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

    const currentWaveX = waveStartX + (angleDeg / 360) * waveWidth;
    const currentWaveY = circleCy - radius * sinVal;

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(currentWaveX, currentWaveY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(currentWaveX, currentWaveY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeLabId, angleDeg]);

  // Lab 4: Parabola y = ax^2 + bx + c
  useEffect(() => {
    if (activeLabId !== 'lab-10-01') return;
    const canvas = canvasParabolRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const originX = width / 2;
    const originY = height / 2;
    const scale = 30;

    // Grid
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

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 14, originY - 6);
    ctx.fillText('y', originX + 6, 14);
    ctx.fillText('O', originX - 14, originY + 14);

    for (let i = -8; i <= 8; i++) {
      if (i === 0) continue;
      const xPos = originX + i * scale;
      const yPos = originY - i * scale;
      if (xPos > 0 && xPos < width) {
        ctx.fillText(String(i), xPos - 4, originY + 14);
      }
      if (yPos > 0 && yPos < height) {
        ctx.fillText(String(i), originX + 6, yPos + 4);
      }
    }

    if (parabolA !== 0) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let started = false;
      for (let px = 0; px <= width; px += 2) {
        const xVal = (px - originX) / scale;
        const yVal = parabolA * Math.pow(xVal, 2) + parabolB * xVal + parabolC;
        const py = originY - yVal * scale;

        if (py >= -100 && py <= height + 100) {
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

      const vertexX = -parabolB / (2 * parabolA);
      const delta = parabolB * parabolB - 4 * parabolA * parabolC;
      const vertexY = -delta / (4 * parabolA);

      const vxPx = originX + vertexX * scale;
      const vyPx = originY - vertexY * scale;

      // Axis of Symmetry
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(vxPx, 0);
      ctx.lineTo(vxPx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(vxPx, vyPx, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillText(
        `Đỉnh I(${vertexX.toFixed(1)}; ${vertexY.toFixed(1)})`,
        vxPx + 8,
        vyPx - 6
      );

      if (delta >= 0) {
        const x1 = (-parabolB - Math.sqrt(delta)) / (2 * parabolA);
        const x2 = (-parabolB + Math.sqrt(delta)) / (2 * parabolA);

        [x1, x2].forEach((rootX) => {
          const rxPx = originX + rootX * scale;
          if (rxPx >= 0 && rxPx <= width) {
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(rxPx, originY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }
    }
  }, [activeLabId, parabolA, parabolB, parabolC]);

  // Lab 5: Set Theory & Intervals on Number Line
  useEffect(() => {
    if (activeLabId !== 'lab-10-set01') return;
    const canvas = canvasSetRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const minVal = -8;
    const maxVal = 8;
    const padding = 50;
    const axisY = height / 2;

    const valToX = (val: number) => padding + ((val - minVal) / (maxVal - minVal)) * (width - 2 * padding);

    // Number Line Axis
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding - 20, axisY);
    ctx.lineTo(width - padding + 20, axisY);
    ctx.stroke();

    // Arrows
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(width - padding + 20, axisY);
    ctx.lineTo(width - padding + 10, axisY - 5);
    ctx.lineTo(width - padding + 10, axisY + 5);
    ctx.closePath();
    ctx.fill();

    // Number ticks
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';
    for (let i = minVal; i <= maxVal; i += 2) {
      const px = valToX(i);
      ctx.beginPath();
      ctx.moveTo(px, axisY - 4);
      ctx.lineTo(px, axisY + 4);
      ctx.stroke();
      ctx.fillText(String(i), px - 4, axisY + 18);
    }

    // Interval A: [intervalA1, intervalA2] (Indigo)
    const ax1 = valToX(intervalA1);
    const ax2 = valToX(intervalA2);
    ctx.fillStyle = 'rgba(79, 70, 229, 0.25)';
    ctx.fillRect(ax1, axisY - 26, ax2 - ax1, 16);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax1, axisY - 26, ax2 - ax1, 16);

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText('[', ax1 - 3, axisY - 14);
    ctx.fillText(']', ax2 - 2, axisY - 14);
    ctx.fillText(`Tập A [${intervalA1}; ${intervalA2}]`, ax1 + 4, axisY - 32);

    // Interval B: [intervalB1, intervalB2] (Amber)
    const bx1 = valToX(intervalB1);
    const bx2 = valToX(intervalB2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fillRect(bx1, axisY + 10, bx2 - bx1, 16);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx1, axisY + 10, bx2 - bx1, 16);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText('[', bx1 - 3, axisY + 22);
    ctx.fillText(']', bx2 - 2, axisY + 22);
    ctx.fillText(`Tập B [${intervalB1}; ${intervalB2}]`, bx1 + 4, axisY + 40);

    // Highlight Result Area based on setOpMode
    const interLeft = Math.max(intervalA1, intervalB1);
    const interRight = Math.min(intervalA2, intervalB2);
    const hasIntersection = interLeft <= interRight;

    if (setOpMode === 'intersection' && hasIntersection) {
      const rx1 = valToX(interLeft);
      const rx2 = valToX(interRight);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.fillRect(rx1, axisY - 6, rx2 - rx1, 12);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(rx1, axisY - 6, rx2 - rx1, 12);
    }
  }, [activeLabId, intervalA1, intervalA2, intervalB1, intervalB2, setOpMode]);

  // Lab 6: Conic Sections (Ellipse, Hyperbola, Parabola)
  useEffect(() => {
    if (activeLabId !== 'lab-10-conic01') return;
    const canvas = canvasConicRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = 28;

    // Grid & Axes
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = cx % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = cy % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('x', width - 12, cy - 6);
    ctx.fillText('y', cx + 6, 12);
    ctx.fillText('O', cx - 12, cy + 12);

    if (conicType === 'ellipse') {
      const a = conicA;
      const b = conicB;
      const c = Math.sqrt(Math.max(0, a * a - b * b));

      // Draw Ellipse
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, a * scale, b * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Foci F1, F2
      const f1x = cx - c * scale;
      const f2x = cx + c * scale;
      [f1x, f2x].forEach((fx, idx) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(fx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(idx === 0 ? `F1(-${c.toFixed(1)};0)` : `F2(${c.toFixed(1)};0)`, fx - 10, cy + 16);
      });
    } else if (conicType === 'hyperbola') {
      const a = conicA;
      const b = conicB;
      const c = Math.sqrt(a * a + b * b);

      // Asymptotes y = +/- (b/a)x
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, cy - ((-cx) * b) / a);
      ctx.lineTo(width, cy - ((width - cx) * b) / a);
      ctx.moveTo(0, cy + ((-cx) * b) / a);
      ctx.lineTo(width, cy + ((width - cx) * b) / a);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right & Left Hyperbola branches
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;

      const drawBranch = (sign: number) => {
        ctx.beginPath();
        let started = false;
        for (let py = 0; py <= height; py += 2) {
          const yVal = (cy - py) / scale;
          const xValSqr = a * a * (1 + (yVal * yVal) / (b * b));
          const xVal = sign * Math.sqrt(xValSqr);
          const px = cx + xVal * scale;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      };

      drawBranch(1);
      drawBranch(-1);

      // Foci F1, F2
      [cx - c * scale, cx + c * scale].forEach((fx, idx) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(fx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(idx === 0 ? 'F1' : 'F2', fx - 4, cy + 16);
      });
    } else {
      // Parabola y^2 = 2px
      const p = conicP;
      const focusX = cx + (p / 2) * scale;
      const directrixX = cx - (p / 2) * scale;

      // Directrix line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(directrixX, 0);
      ctx.lineTo(directrixX, height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.fillText('Đường chuẩn Δ', directrixX - 70, 20);

      // Focus
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(focusX, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`F(${p / 2}; 0)`, focusX + 6, cy - 6);

      // Curve
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let py = 0; py <= height; py += 2) {
        const yVal = (cy - py) / scale;
        const xVal = (yVal * yVal) / (2 * p);
        const px = cx + xVal * scale;
        if (px >= 0 && px <= width) {
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();
    }
  }, [activeLabId, conicType, conicA, conicB, conicP]);

  // Lab 7: Dynamic 2D Vectors & Dot Product
  useEffect(() => {
    if (activeLabId !== 'lab-10-vec01') return;
    const canvas = canvasVecRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = width / 2;
    const oy = height / 2;
    const scale = 28;

    // Grid & Axes
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = ox % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = oy % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    const drawVector = (vx: number, vy: number, color: string, label: string) => {
      const tipX = ox + vx * scale;
      const tipY = oy - vy * scale;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(oy - tipY, tipX - ox);
      const headLen = 10;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - headLen * Math.cos(angle - Math.PI / 6), tipY + headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tipX - headLen * Math.cos(angle + Math.PI / 6), tipY + headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(`${label}(${vx}; ${vy})`, tipX + 8, tipY - 6);
    };

    drawVector(vecUx, vecUy, '#4f46e5', 'u');
    drawVector(vecVx, vecVy, '#10b981', 'v');

    // Vector Sum u + v (Parallelogram rule)
    const sumX = vecUx + vecVx;
    const sumY = vecUy + vecVy;
    drawVector(sumX, sumY, '#f59e0b', 'u+v');

    // Dashed parallelogram lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + vecUx * scale, oy - vecUy * scale);
    ctx.lineTo(ox + sumX * scale, oy - sumY * scale);
    ctx.moveTo(ox + vecVx * scale, oy - vecVy * scale);
    ctx.lineTo(ox + sumX * scale, oy - sumY * scale);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeLabId, vecUx, vecUy, vecVx, vecVy]);

  // Lab 8: Exponential & Logarithmic Functions
  useEffect(() => {
    if (activeLabId !== 'lab-11-mulog01') return;
    const canvas = canvasExpLogRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = width / 2;
    const oy = height / 2;
    const scale = 32;

    // Grid & Axes
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = ox % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = oy % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    // Line y = x (Mirror symmetry)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, oy + ox);
    ctx.lineTo(width, oy - (width - ox));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('y = x', width - 35, 20);

    // Exponential y = a^x (Indigo)
    if (baseA > 0 && baseA !== 1) {
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= width; px += 2) {
        const xVal = (px - ox) / scale;
        const yVal = Math.pow(baseA, xVal);
        const py = oy - yVal * scale;
        if (py >= -20 && py <= height + 20) {
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();

      // Logarithm y = log_a(x) (Emerald)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      started = false;
      for (let px = ox + 1; px <= width; px += 2) {
        const xVal = (px - ox) / scale;
        const yVal = Math.log(xVal) / Math.log(baseA);
        const py = oy - yVal * scale;
        if (py >= -20 && py <= height + 20) {
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();

      // Key points (0, 1) and (1, 0)
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.arc(ox, oy - 1 * scale, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('(0; 1)', ox + 6, oy - 1 * scale - 4);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(ox + 1 * scale, oy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('(1; 0)', ox + 1 * scale + 4, oy + 14);
    }
  }, [activeLabId, baseA]);

  // Lab 9: Derivative & Tangent Line Secant Limit
  useEffect(() => {
    if (activeLabId !== 'lab-11-daoham01') return;
    const canvas = canvasTangentRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = width / 2;
    const oy = height / 2;
    const scale = 36;

    // Grid & Axes
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = ox % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = oy % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    // Curve f(x) = x^2 / 2 - 1
    const f = (x: number) => (x * x) / 2 - 1;
    const fPrime = (x: number) => x;

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= width; px += 2) {
      const xVal = (px - ox) / scale;
      const yVal = f(xVal);
      const py = oy - yVal * scale;
      if (py >= -20 && py <= height + 20) {
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
    }
    ctx.stroke();

    // Point M0(x0, f(x0))
    const x0 = tangentX0;
    const y0 = f(x0);
    const m0Px = ox + x0 * scale;
    const m0Py = oy - y0 * scale;

    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(m0Px, m0Py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(`M0(${x0.toFixed(1)}; ${y0.toFixed(1)})`, m0Px + 8, m0Py - 6);

    // Tangent Line at x0 (Emerald)
    const kTangent = fPrime(x0);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tanX1 = -5;
    const tanY1 = y0 + kTangent * (tanX1 - x0);
    const tanX2 = 5;
    const tanY2 = y0 + kTangent * (tanX2 - x0);
    ctx.moveTo(ox + tanX1 * scale, oy - tanY1 * scale);
    ctx.lineTo(ox + tanX2 * scale, oy - tanY2 * scale);
    ctx.stroke();

    // Secant point M(x0 + Δx, f(x0 + Δx))
    if (Math.abs(secantDeltaX) > 0.05) {
      const xSec = x0 + secantDeltaX;
      const ySec = f(xSec);
      const mSecPx = ox + xSec * scale;
      const mSecPy = oy - ySec * scale;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(mSecPx, mSecPy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Secant Line (Amber dashed)
      const kSec = (ySec - y0) / secantDeltaX;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ox + tanX1 * scale, oy - (y0 + kSec * (tanX1 - x0)) * scale);
      ctx.lineTo(ox + tanX2 * scale, oy - (y0 + kSec * (tanX2 - x0)) * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [activeLabId, tangentX0, secantDeltaX]);

  // Lab 10: Riemann Integral & Area Under Curve
  useEffect(() => {
    if (activeLabId !== 'lab-12-dientich01') return;
    const canvas = canvasRiemannRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = 60;
    const oy = height - 50;
    const scaleX = (width - 120) / 4;
    const scaleY = (height - 100) / 4;

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox - 20, oy);
    ctx.lineTo(width - 30, oy);
    ctx.moveTo(ox, height - 20);
    ctx.lineTo(ox, 20);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('x', width - 20, oy + 14);
    ctx.fillText('y', ox - 16, 26);
    ctx.fillText('O', ox - 14, oy + 14);

    // Function f(x) = x^2 / 3 + 0.5
    const f = (x: number) => (x * x) / 3 + 0.5;

    // Riemann Rectangles (Midpoint)
    const a = riemannA;
    const b = riemannB;
    const n = riemannN;
    const dx = (b - a) / n;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;

    for (let i = 0; i < n; i++) {
      const xMid = a + (i + 0.5) * dx;
      const hVal = f(xMid);
      const rectX = ox + (a + i * dx) * scaleX;
      const rectW = dx * scaleX;
      const rectH = hVal * scaleY;
      const rectY = oy - rectH;

      ctx.fillRect(rectX, rectY, rectW, rectH);
      ctx.strokeRect(rectX, rectY, rectW, rectH);
    }

    // Exact Curve f(x)
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = ox; px <= ox + 4 * scaleX; px += 2) {
      const xVal = (px - ox) / scaleX;
      const yVal = f(xVal);
      const py = oy - yVal * scaleY;
      if (px === ox) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [activeLabId, riemannA, riemannB, riemannN]);

  // Lab 11: 3D Pyramid Geometry
  useEffect(() => {
    if (activeLabId !== 'lab-11-hinhdadien01') return;
    const canvas = canvasPyrRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.65;
    const baseScale = 26;

    const radX = (pyrRotX * Math.PI) / 180;
    const radY = (pyrRotY * Math.PI) / 180;

    const project = (x: number, y: number, z: number) => {
      const x1 = x * Math.cos(radY) + z * Math.sin(radY);
      const z1 = -x * Math.sin(radY) + z * Math.cos(radY);
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);

      return {
        px: cx + x1 * baseScale,
        py: cy - y2 * baseScale,
      };
    };

    const halfA = pyrBaseA / 2;
    const ptA = project(-halfA, 0, -halfA);
    const ptB = project(halfA, 0, -halfA);
    const ptC = project(halfA, 0, halfA);
    const ptD = project(-halfA, 0, halfA);
    const ptS = project(0, pyrHeightH, 0);
    const ptO = project(0, 0, 0);

    // Shaded Base
    ctx.fillStyle = 'rgba(241, 245, 249, 0.6)';
    ctx.beginPath();
    ctx.moveTo(ptA.px, ptA.py);
    ctx.lineTo(ptB.px, ptB.py);
    ctx.lineTo(ptC.px, ptC.py);
    ctx.lineTo(ptD.px, ptD.py);
    ctx.closePath();
    ctx.fill();

    // Height SO (dashed line)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ptS.px, ptS.py);
    ctx.lineTo(ptO.px, ptO.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Solid Edges
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    const drawEdge = (p1: { px: number; py: number }, p2: { px: number; py: number }, dashed = false) => {
      ctx.beginPath();
      if (dashed) ctx.setLineDash([3, 3]);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();
      if (dashed) ctx.setLineDash([]);
    };

    drawEdge(ptB, ptC);
    drawEdge(ptC, ptD);
    drawEdge(ptD, ptA, true);
    drawEdge(ptA, ptB, true);

    drawEdge(ptS, ptB);
    drawEdge(ptS, ptC);
    drawEdge(ptS, ptD);
    drawEdge(ptS, ptA, true);

    // Labels
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText('S', ptS.px - 4, ptS.py - 8);
    ctx.fillText('A', ptA.px - 12, ptA.py + 4);
    ctx.fillText('B', ptB.px + 6, ptB.py + 4);
    ctx.fillText('C', ptC.px + 6, ptC.py + 4);
    ctx.fillText('D', ptD.px - 14, ptD.py + 4);
    ctx.fillText('O', ptO.px + 4, ptO.py + 4);
  }, [activeLabId, pyrBaseA, pyrHeightH, pyrRotX, pyrRotY]);

  // Lab 13: Box Plot
  useEffect(() => {
    if (activeLabId !== 'lab-10-thongke01') return;
    const canvas = canvasBoxPlotRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Sorted data
    const sorted = [...statDataRaw].sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return;

    const min = sorted[0];
    const max = sorted[n - 1];

    const getMedian = (arr: number[]) => {
      const len = arr.length;
      if (len === 0) return 0;
      const mid = Math.floor(len / 2);
      return len % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const q2 = getMedian(sorted);
    const lowerHalf = sorted.filter((v) => v < q2);
    const upperHalf = sorted.filter((v) => v > q2);
    const q1 = getMedian(lowerHalf.length ? lowerHalf : [min]);
    const q3 = getMedian(upperHalf.length ? upperHalf : [max]);

    const padX = 60;
    const lineY = height * 0.55;
    const boxHeight = 45;

    const dataMin = 0;
    const dataMax = 12;
    const toPx = (val: number) => padX + ((val - dataMin) / (dataMax - dataMin)) * (width - 2 * padX);

    // Axis Line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, lineY + 40);
    ctx.lineTo(width - padX, lineY + 40);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    for (let v = dataMin; v <= dataMax; v += 1) {
      const px = toPx(v);
      ctx.beginPath();
      ctx.moveTo(px, lineY + 36);
      ctx.lineTo(px, lineY + 44);
      ctx.stroke();
      ctx.fillText(String(v), px - 4, lineY + 56);
    }

    // Box from Q1 to Q3
    const q1Px = toPx(q1);
    const q3Px = toPx(q3);
    const q2Px = toPx(q2);
    const minPx = toPx(min);
    const maxPx = toPx(max);

    // Whisker lines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(minPx, lineY);
    ctx.lineTo(q1Px, lineY);
    ctx.moveTo(q3Px, lineY);
    ctx.lineTo(maxPx, lineY);
    ctx.stroke();

    // Min and Max whisker caps
    ctx.beginPath();
    ctx.moveTo(minPx, lineY - 14);
    ctx.lineTo(minPx, lineY + 14);
    ctx.moveTo(maxPx, lineY - 14);
    ctx.lineTo(maxPx, lineY + 14);
    ctx.stroke();

    // Box body
    ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
    ctx.fillRect(q1Px, lineY - boxHeight / 2, q3Px - q1Px, boxHeight);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.strokeRect(q1Px, lineY - boxHeight / 2, q3Px - q1Px, boxHeight);

    // Median line Q2
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(q2Px, lineY - boxHeight / 2);
    ctx.lineTo(q2Px, lineY + boxHeight / 2);
    ctx.stroke();

    // Labels
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Min: ${min}`, minPx - 14, lineY - 22);
    ctx.fillText(`Max: ${max}`, maxPx - 14, lineY - 22);
    ctx.fillStyle = '#4f46e5';
    ctx.fillText(`Q1: ${q1.toFixed(1)}`, q1Px - 16, lineY + 32);
    ctx.fillText(`Q3: ${q3.toFixed(1)}`, q3Px - 16, lineY + 32);
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`Median Q2: ${q2.toFixed(1)}`, q2Px - 30, lineY - 30);
  }, [activeLabId, statDataRaw]);

  // Intercept calculations for Lab 2:
  const interceptOx = useMemo(() => {
    if (planeA === 0) {
      if (planeD === 0) {
        return { type: 'contains', text: 'Mặt phẳng $(\\alpha)$ chứa trục $Ox$' };
      }
      return { type: 'parallel', text: 'Mặt phẳng $(\\alpha) \\parallel Ox$ (không cắt trục $Ox$)' };
    }
    const { fracLatex, decLatex } = formatFraction(-planeD, planeA);
    return {
      type: 'point',
      pointLatex: `A(${decLatex}; 0; 0)`,
      stepLatex: `x = ${fracLatex}`,
      text: `đặt $y = z = 0$, suy ra $x = ${fracLatex}$, được $A(${decLatex}; 0; 0)$`,
    };
  }, [planeA, planeD]);

  const interceptOy = useMemo(() => {
    if (planeB === 0) {
      if (planeD === 0) {
        return { type: 'contains', text: 'Mặt phẳng $(\\alpha)$ chứa trục $Oy$' };
      }
      return { type: 'parallel', text: 'Mặt phẳng $(\\alpha) \\parallel Oy$ (không cắt trục $Oy$)' };
    }
    const { fracLatex, decLatex } = formatFraction(-planeD, planeB);
    return {
      type: 'point',
      pointLatex: `B(0; ${decLatex}; 0)`,
      stepLatex: `y = ${fracLatex}`,
      text: `đặt $x = z = 0$, suy ra $y = ${fracLatex}$, được $B(0; ${decLatex}; 0)$`,
    };
  }, [planeB, planeD]);

  const interceptOz = useMemo(() => {
    if (planeC === 0) {
      if (planeD === 0) {
        return { type: 'contains', text: 'Mặt phẳng $(\\alpha)$ chứa trục $Oz$' };
      }
      return { type: 'parallel', text: 'Mặt phẳng $(\\alpha) \\parallel Oz$ (không cắt trục $Oz$)' };
    }
    const { fracLatex, decLatex } = formatFraction(-planeD, planeC);
    return {
      type: 'point',
      pointLatex: `C(0; 0; ${decLatex})`,
      stepLatex: `z = ${fracLatex}`,
      text: `đặt $x = y = 0$, suy ra $z = ${fracLatex}$, được $C(0; 0; ${decLatex})$`,
    };
  }, [planeC, planeD]);

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

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      if (filterGrade !== 'all' && item.grade !== filterGrade) return false;
      if (filterSemester !== 'all' && item.semester !== filterSemester) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchLesson = item.lesson.toLowerCase().includes(query);
        const matchChapter = item.chapter.toLowerCase().includes(query);
        const matchTopic = item.topic.toLowerCase().includes(query);
        const matchCode = item.code.toLowerCase().includes(query);
        return matchTitle || matchLesson || matchChapter || matchTopic || matchCode;
      }
      return true;
    });
  }, [catalog, filterGrade, filterSemester, filterCategory, searchQuery]);

  const activeModule = catalog.find((m) => m.id === activeLabId) || catalog[0];

  const totalTested = catalog.filter((m) => m.testStatus === 'tested' || m.isImplemented).length;
  const coveragePercent = Math.round((totalTested / catalog.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Phòng Lab Toán học THPT Trực quan
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {totalTested} Lab Đã kiểm thử · 6 Học kỳ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Môi trường thực hành, khám phá tương tác 2D/3D bao phủ trọn vẹn chương trình Toán 10, 11 và 12.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('simulation');
              soundService.playClick();
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'simulation'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Mô phỏng Trực quan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('catalog');
              soundService.playClick();
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Bảng Độ bao phủ &amp; SGK ({catalog.length} Bài)</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SIMULATION SANDBOX VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'simulation' && (
        <div className="space-y-5">
          {/* Filters & Search Toolbar (Section 7: Bộ lọc Khối, Học kỳ, Mạch kiến thức) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Grade Filters */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" /> Khối:
                </span>
                {(['all', 10, 11, 12] as const).map((g) => (
                  <button
                    key={String(g)}
                    type="button"
                    onClick={() => {
                      setFilterGrade(g);
                      soundService.playClick();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterGrade === g
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {g === 'all' ? 'Tất cả' : `Toán ${g}`}
                  </button>
                ))}
              </div>

              {/* Semester Filters */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 mr-1">Học kỳ:</span>
                {(['all', 1, 2] as const).map((sem) => (
                  <button
                    key={String(sem)}
                    type="button"
                    onClick={() => {
                      setFilterSemester(sem);
                      soundService.playClick();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterSemester === sem
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sem === 'all' ? 'Tất cả' : `Học kỳ ${sem}`}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm dạng toán, bài học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Category Domain Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 border-t border-slate-100 pt-2 text-xs">
              <span className="font-semibold text-slate-500 shrink-0">Mạch kiến thức:</span>
              {[
                { key: 'all', label: 'Tất cả phân môn' },
                { key: 'Đại số & Giải tích', label: 'Đại số & Giải tích' },
                { key: 'Hình học & Tọa độ', label: 'Hình học & Tọa độ' },
                { key: 'Thống kê & Xác suất', label: 'Thống kê & Xác suất' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setFilterCategory(cat.key);
                    soundService.playClick();
                  }}
                  className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                    filterCategory === cat.key
                      ? 'bg-indigo-100 text-indigo-800 font-bold'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Available Labs Grid Carousel / Selector (Section 7: Không dùng thanh tab ngang dài tràn) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
                Chọn phòng Lab mô phỏng ({filteredCatalog.length} bài phù hợp)
              </span>
              <span className="text-[11px]">Bấm vào thẻ để tải bài thực hành</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {filteredCatalog.map((lab) => {
                const isSelected = activeLabId === lab.id;
                return (
                  <button
                    key={lab.id}
                    type="button"
                    onClick={() => {
                      setActiveLabId(lab.id);
                      soundService.playClick();
                    }}
                    className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          T{lab.grade} · HK{lab.semester}
                        </span>
                        <span
                          className={`text-[9px] px-1 rounded font-semibold ${
                            isSelected ? 'bg-indigo-700/70 text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {lab.mathType}
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {lab.title}
                      </p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-slate-100/30 flex items-center justify-between text-[10px]">
                      <span className={isSelected ? 'text-indigo-100' : 'text-slate-400'}>
                        {lab.code}
                      </span>
                      {lab.testStatus === 'tested' && (
                        <span className={`flex items-center gap-0.5 font-bold ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`}>
                          <Check className="w-2.5 h-2.5" /> Đã kiểm thử
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* ACTIVE LAB WORKSPACE HEADER (12 Elements structure) */}
          {/* ================================================================= */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-400/30">
                    {activeModule.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300">
                    Toán {activeModule.grade} · Học kỳ {activeModule.semester} · {activeModule.chapter}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {activeModule.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  {activeModule.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã kiểm thử thực tế
                </span>
              </div>
            </div>

            {/* Objectives Bar (Mục tiêu khám phá) */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-200">
              <span className="font-bold text-slate-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Mục tiêu bài học:
              </span>
              {activeModule.objectives.map((obj, i) => (
                <span key={i} className="flex items-center gap-1 text-[11px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {obj}
                </span>
              ))}
            </div>
          </div>

          {/* ================================================================= */}
          {/* SIMULATION IMPLEMENTATIONS */}
          {/* ================================================================= */}

          {/* 1. LAB 12-02: 3D Oxyz Space & Plane */}
          {activeLabId === 'lab-12-02' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Mô hình Không gian 3D Oxyz
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                      Kéo chuột xoay 360°
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoom((prev) => Math.min(1.6, prev + 0.1))}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                      title="Phóng to"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.1))}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRotX(25);
                        setRotY(-35);
                        setZoom(1);
                        soundService.playClick();
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1 ml-1"
                      title="Đặt lại góc nhìn"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                  <div className="absolute top-3 left-3 text-[10px] text-slate-300 font-mono bg-black/50 px-2 py-1 rounded backdrop-blur-xs">
                    Xoay X: {Math.round(rotX)}° · Y: {Math.round(rotY)}° · Zoom: {zoom.toFixed(1)}x
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded">
                    <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Ox
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Oy
                    </span>
                    <span className="inline-flex items-center gap-1 text-sky-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Oz
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-400 font-bold ml-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> <MathRenderer content="\vec{n}" inline />
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 gap-2">
                  <span className="font-semibold">Phương trình hiện thời:</span>
                  <div className="bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-indigo-900 font-bold">
                    <MathRenderer content={formatPlaneEquation(planeA, planeB, planeC, planeD)} inline />
                  </div>
                </div>
              </div>

              {/* Right Deck */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Hệ số &amp; Phân tích Mặt phẳng
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaneA(1);
                      setPlaneB(2);
                      setPlaneC(-1);
                      setPlaneD(-3);
                      soundService.playClick();
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Mẫu chuẩn (1; 2; -1; -3)
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold">Dạng tổng quát:</span>
                    <span className="font-bold text-slate-900">
                      <MathRenderer content="(\alpha): Ax + By + Cz + D = 0" inline />
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 border-t border-slate-200/60 pt-2">
                    <span className="font-semibold">Vectơ pháp tuyến:</span>
                    <span className="font-bold text-amber-700">
                      <MathRenderer content={`\\vec{n} = (${planeA}; ${planeB}; ${planeC})`} inline />
                    </span>
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Hệ số A (trục Ox)</span>
                      <span className="font-mono text-indigo-700 font-bold">{planeA}</span>
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
                      <span>Hệ số B (trục Oy)</span>
                      <span className="font-mono text-indigo-700 font-bold">{planeB}</span>
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
                      <span>Hệ số C (trục Oz)</span>
                      <span className="font-mono text-indigo-700 font-bold">{planeC}</span>
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
                      <span>Hệ số tự do D</span>
                      <span className="font-mono text-indigo-700 font-bold">{planeD}</span>
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
                </div>

                {/* Intersections */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                  <span className="font-bold block text-slate-900 border-b border-indigo-200/60 pb-1.5 uppercase text-[11px] tracking-wider">
                    Giao điểm với các trục tọa độ:
                  </span>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800">• Trục <MathRenderer content="Ox" inline />:</span>
                    <div className="text-slate-700 pl-3">
                      <MathRenderer content={interceptOx.text} inline />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800">• Trục <MathRenderer content="Oy" inline />:</span>
                    <div className="text-slate-700 pl-3">
                      <MathRenderer content={interceptOy.text} inline />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800">• Trục <MathRenderer content="Oz" inline />:</span>
                    <div className="text-slate-700 pl-3">
                      <MathRenderer content={interceptOz.text} inline />
                    </div>
                  </div>
                </div>

                {/* Question & Hint */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Câu hỏi quan sát:
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Khi đặt hệ số D = 0, mặt phẳng đi qua điểm đặc biệt nào trong không gian Oxyz?
                  </p>
                  <p className="text-[10px] text-amber-800 italic pt-1 border-t border-amber-200/60">
                    Gợi ý: Điểm O(0; 0; 0) luôn thỏa mãn phương trình Ax + By + Cz = 0.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. LAB 11-01: Unit Trig Circle & Sine Wave */}
          {activeLabId === 'lab-11-01' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Vòng tròn Lượng giác Đơn vị &amp; Đồ thị Sóng Sin
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quan sát điểm M trên đường tròn đơn vị và đồ thị hàm số sin tuần hoàn
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-indigo-900 font-bold text-xs sm:text-sm">
                  <MathRenderer content={formatRadianLatex(angleDeg)} inline />
                </div>
              </div>

              <div className="flex justify-center border border-slate-100 rounded-xl bg-slate-50 p-2">
                <canvas
                  ref={canvasTrigRef}
                  width={640}
                  height={260}
                  className="w-full max-w-2xl block"
                />
              </div>

              <div className="max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between items-center font-semibold text-slate-800">
                  <span className="flex items-center gap-1">
                    Điều khiển góc quay <MathRenderer content="\alpha" inline />
                  </span>
                  <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {angleDeg}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={angleDeg}
                  onChange={(e) => setAngleDeg(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />

                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px]">
                  {[0, 30, 45, 60, 90, 180, 270, 360].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => {
                        setAngleDeg(deg);
                        soundService.playClick();
                      }}
                      className={`px-2 py-0.5 rounded font-mono font-semibold transition-colors ${
                        angleDeg === deg
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs max-w-3xl mx-auto">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block mb-1">
                    Tung độ (Sin)
                  </span>
                  <MathRenderer
                    content={`\\sin(${angleDeg}^\\circ) = ${Math.sin((angleDeg * Math.PI) / 180).toFixed(4).replace('.', '{,}')}`}
                    inline
                  />
                </div>

                <div className="p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block mb-1">
                    Hoành độ (Cos)
                  </span>
                  <MathRenderer
                    content={`\\cos(${angleDeg}^\\circ) = ${Math.cos((angleDeg * Math.PI) / 180).toFixed(4).replace('.', '{,}')}`}
                    inline
                  />
                </div>

                <div className="p-3 rounded-xl bg-sky-50 text-sky-900 border border-sky-200">
                  <span className="text-[10px] text-sky-700 font-bold uppercase block mb-1">
                    Tang
                  </span>
                  {angleDeg === 90 || angleDeg === 270 ? (
                    <span className="font-semibold text-slate-500">Không xác định</span>
                  ) : (
                    <MathRenderer
                      content={`\\tan(${angleDeg}^\\circ) = ${Math.tan((angleDeg * Math.PI) / 180).toFixed(4).replace('.', '{,}')}`}
                      inline
                    />
                  )}
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 font-bold uppercase block mb-1">
                    Hệ thức cơ bản
                  </span>
                  <MathRenderer content="\\sin^2\\alpha + \\cos^2\\alpha = 1" inline />
                </div>
              </div>
            </div>
          )}

          {/* 3. LAB 12-01: Cubic Function 2D */}
          {activeLabId === 'lab-12-01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Mặt phẳng Đồ thị 2D: <MathRenderer content="y = ax^3 + bx^2 + cx + d" inline />
                  </span>
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
                    title="Đặt lại tham số"
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
                    <MathRenderer content={formatCubicEquation(paramA, paramB, paramC, paramD)} inline />
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Thanh trượt Tham số &amp; Phân tích
                </h3>

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

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    Tính chất toán học tức thời:
                  </span>
                  <div className="text-slate-700">
                    • Đạo hàm:{' '}
                    <span className="font-bold">
                      <MathRenderer
                        content={`y' = ${3 * paramA}x^2 ${2 * paramB >= 0 ? `+ ${2 * paramB}` : `- ${Math.abs(2 * paramB)}`}x ${paramC >= 0 ? `+ ${paramC}` : `- ${Math.abs(paramC)}`}`}
                        inline
                      />
                    </span>
                  </div>
                  <div className="text-slate-700">
                    • Biệt thức:{' '}
                    <span className="font-bold">
                      <MathRenderer
                        content={`\\Delta' = b^2 - 3ac = ${Math.pow(paramB, 2) - 3 * paramA * paramC}`}
                        inline
                      />
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {Math.pow(paramB, 2) - 3 * paramA * paramC > 0
                      ? '✓ Hàm số có 2 điểm cực trị phân biệt.'
                      : '✓ Hàm số không có cực trị (đơn điệu trên R).'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. LAB 10-01: Parabola 2D */}
          {activeLabId === 'lab-10-01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Mặt phẳng Đồ thị Parabol: <MathRenderer content="y = ax^2 + bx + c" inline />
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setParabolA(1);
                      setParabolB(-2);
                      setParabolC(-3);
                      soundService.playClick();
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                    title="Đặt lại tham số"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative border border-slate-100 rounded-xl overflow-hidden bg-white flex justify-center">
                  <canvas
                    ref={canvasParabolRef}
                    width={520}
                    height={380}
                    className="w-full max-w-lg aspect-[52/38] block"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Đỉnh Parabol <MathRenderer content="I" inline />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Giao điểm trục hoành
                  </span>
                  <span className="text-indigo-700 font-bold text-xs">
                    <MathRenderer content={formatParabolEquation(parabolA, parabolB, parabolC)} inline />
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Hệ số Parabol &amp; Tọa độ Đỉnh
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Hệ số a (Định hướng bề lõm, a ≠ 0)</span>
                      <span className="font-mono text-indigo-700 font-bold">{parabolA}</span>
                    </div>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.5}
                      value={parabolA}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setParabolA(val === 0 ? 0.5 : val);
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Hệ số b</span>
                      <span className="font-mono text-indigo-700 font-bold">{parabolB}</span>
                    </div>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={0.5}
                      value={parabolB}
                      onChange={(e) => setParabolB(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Hệ số tự do c (Giao trục Oy)</span>
                      <span className="font-mono text-indigo-700 font-bold">{parabolC}</span>
                    </div>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={0.5}
                      value={parabolC}
                      onChange={(e) => setParabolC(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                {(() => {
                  const vx = -parabolB / (2 * parabolA);
                  const delta = parabolB * parabolB - 4 * parabolA * parabolC;
                  const vy = -delta / (4 * parabolA);
                  const vxFrac = formatFraction(-parabolB, 2 * parabolA);
                  const vyFrac = formatFraction(-delta, 4 * parabolA);

                  return (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                        Phân tích giải tích Parabol:
                      </span>
                      <div className="text-slate-700">
                        • Tọa độ đỉnh:{' '}
                        <span className="font-bold text-indigo-700">
                          <MathRenderer
                            content={`I\\left(${vxFrac.fracLatex}; ${vyFrac.fracLatex}\\right) \\approx I(${vx.toFixed(2).replace('.', '{,}')}; ${vy.toFixed(2).replace('.', '{,}')})`}
                            inline
                          />
                        </span>
                      </div>
                      <div className="text-slate-700">
                        • Trục đối xứng:{' '}
                        <span className="font-bold">
                          <MathRenderer content={`x = ${vxFrac.fracLatex}`} inline />
                        </span>
                      </div>
                      <div className="text-slate-700">
                        • Biệt thức:{' '}
                        <span className="font-bold">
                          <MathRenderer content={`\\Delta = b^2 - 4ac = ${delta}`} inline />
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 5. LAB 10-SET01: Set Theory & Intervals */}
          {activeLabId === 'lab-10-set01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Trục số Thực &amp; Giao - Hợp - Hiệu Khoảng Số
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIntervalA1(-4);
                      setIntervalA2(2);
                      setIntervalB1(-1);
                      setIntervalB2(5);
                      soundService.playClick();
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                    title="Đặt lại khoảng"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="border border-slate-100 rounded-xl bg-slate-50 p-2 flex justify-center">
                  <canvas ref={canvasSetRef} width={520} height={220} className="w-full max-w-lg block" />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="font-semibold text-slate-700 mr-1">Phép toán đang tô màu:</span>
                  {[
                    { id: 'intersection', label: 'Giao A ∩ B' },
                    { id: 'union', label: 'Hợp A ∪ B' },
                    { id: 'diffAB', label: 'Hiệu A \\ B' },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setSetOpMode(op.id as any)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        setOpMode === op.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Điều chỉnh Mút Khoảng Số
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Tập A = [a1; a2]</span>
                      <span className="font-mono text-indigo-700 font-bold">[{intervalA1}; {intervalA2}]</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="range"
                        min={-7}
                        max={intervalA2 - 1}
                        value={intervalA1}
                        onChange={(e) => setIntervalA1(Number(e.target.value))}
                        className="accent-indigo-600"
                      />
                      <input
                        type="range"
                        min={intervalA1 + 1}
                        max={7}
                        value={intervalA2}
                        onChange={(e) => setIntervalA2(Number(e.target.value))}
                        className="accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Tập B = [b1; b2]</span>
                      <span className="font-mono text-amber-700 font-bold">[{intervalB1}; {intervalB2}]</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="range"
                        min={-7}
                        max={intervalB2 - 1}
                        value={intervalB1}
                        onChange={(e) => setIntervalB1(Number(e.target.value))}
                        className="accent-amber-600"
                      />
                      <input
                        type="range"
                        min={intervalB1 + 1}
                        max={7}
                        value={intervalB2}
                        onChange={(e) => setIntervalB2(Number(e.target.value))}
                        className="accent-amber-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    Kết quả tập hợp chính xác:
                  </span>
                  {(() => {
                    const lInter = Math.max(intervalA1, intervalB1);
                    const rInter = Math.min(intervalA2, intervalB2);
                    const hasInter = lInter <= rInter;
                    const lUnion = Math.min(intervalA1, intervalB1);
                    const rUnion = Math.max(intervalA2, intervalB2);

                    return (
                      <div className="space-y-1 text-slate-700">
                        <p>• Giao: <MathRenderer content={`A \\cap B = ${hasInter ? `[${lInter}; ${rInter}]` : '\\emptyset'}`} inline /></p>
                        <p>• Hợp: <MathRenderer content={`A \\cup B = [${lUnion}; ${rUnion}]`} inline /></p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* 6. LAB 10-CONIC01: Conic Sections */}
          {activeLabId === 'lab-10-conic01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Khảo sát Ba đường Conic: Elip, Hyperbol, Parabol
                  </span>
                  <div className="flex items-center gap-1">
                    {(['ellipse', 'hyperbola', 'parabola'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setConicType(t)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          conicType === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t === 'ellipse' ? 'Elip' : t === 'hyperbola' ? 'Hyperbol' : 'Parabol'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl bg-white p-2 flex justify-center">
                  <canvas ref={canvasConicRef} width={520} height={320} className="w-full max-w-lg block" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Tham số Hình học Conic
                </h3>

                {conicType === 'ellipse' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Bán trục lớn a</span>
                        <span className="font-mono text-indigo-700 font-bold">{conicA}</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={6}
                        step={0.5}
                        value={conicA}
                        onChange={(e) => setConicA(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Bán trục nhỏ b</span>
                        <span className="font-mono text-indigo-700 font-bold">{conicB}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={conicA - 0.5}
                        step={0.5}
                        value={conicB}
                        onChange={(e) => setConicB(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <p>• Phương trình: <MathRenderer content={`\\frac{x^2}{${conicA * conicA}} + \\frac{y^2}{${(conicB * conicB).toFixed(1)}} = 1`} inline /></p>
                      <p>• Tiêu cự 2c: <MathRenderer content={`2c = 2\\sqrt{a^2 - b^2} = ${(2 * Math.sqrt(conicA * conicA - conicB * conicB)).toFixed(2)}`} inline /></p>
                      <p>• Tâm sai: <MathRenderer content={`e = \\frac{c}{a} = ${(Math.sqrt(conicA * conicA - conicB * conicB) / conicA).toFixed(3)} < 1`} inline /></p>
                    </div>
                  </div>
                )}

                {conicType === 'hyperbola' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Bán trục thực a</span>
                        <span className="font-mono text-indigo-700 font-bold">{conicA}</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={5}
                        step={0.5}
                        value={conicA}
                        onChange={(e) => setConicA(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Bán trục ảo b</span>
                        <span className="font-mono text-indigo-700 font-bold">{conicB}</span>
                      </div>
                      <input
                        type="range"
                        min={1.5}
                        max={5}
                        step={0.5}
                        value={conicB}
                        onChange={(e) => setConicB(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <p>• Phương trình: <MathRenderer content={`\\frac{x^2}{${conicA * conicA}} - \\frac{y^2}{${(conicB * conicB).toFixed(1)}} = 1`} inline /></p>
                      <p>• Tâm sai: <MathRenderer content={`e = \\frac{c}{a} = ${(Math.sqrt(conicA * conicA + conicB * conicB) / conicA).toFixed(3)} > 1`} inline /></p>
                      <p>• Tiệm cận: <MathRenderer content={`y = \\pm \\frac{${conicB}}{${conicA}}x`} inline /></p>
                    </div>
                  </div>
                )}

                {conicType === 'parabola' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Tham số tiêu p</span>
                        <span className="font-mono text-indigo-700 font-bold">{conicP}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={conicP}
                        onChange={(e) => setConicP(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <p>• Phương trình chính tắc: <MathRenderer content={`y^2 = ${2 * conicP}x`} inline /></p>
                      <p>• Tiêu điểm: <MathRenderer content={`F\\left(${conicP / 2}; 0\\right)`} inline /></p>
                      <p>• Đường chuẩn: <MathRenderer content={`\\Delta: x = -${conicP / 2}`} inline /></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. LAB 10-VEC01: Vectors & Operations */}
          {activeLabId === 'lab-10-vec01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Phép toán Vectơ &amp; Tích vô hướng
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVecUx(3);
                      setVecUy(2);
                      setVecVx(-1);
                      setVecVy(3);
                      soundService.playClick();
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="border border-slate-100 rounded-xl bg-white p-2 flex justify-center">
                  <canvas ref={canvasVecRef} width={520} height={320} className="w-full max-w-lg block" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Tọa độ Hai Vectơ
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Vectơ u = (x1, y1)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        value={vecUx}
                        onChange={(e) => setVecUx(Number(e.target.value))}
                        className="accent-indigo-600"
                      />
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        value={vecUy}
                        onChange={(e) => setVecUy(Number(e.target.value))}
                        className="accent-indigo-600"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Vectơ v = (x2, y2)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        value={vecVx}
                        onChange={(e) => setVecVx(Number(e.target.value))}
                        className="accent-emerald-600"
                      />
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        value={vecVy}
                        onChange={(e) => setVecVy(Number(e.target.value))}
                        className="accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {(() => {
                  const dot = vecUx * vecVx + vecUy * vecVy;
                  const lenU = Math.sqrt(vecUx * vecUx + vecUy * vecUy);
                  const lenV = Math.sqrt(vecVx * vecVx + vecVy * vecVy);
                  const cosTheta = lenU * lenV > 0 ? dot / (lenU * lenV) : 0;
                  const thetaDeg = Math.round((Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180) / Math.PI);

                  return (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <p>• Tổng: <MathRenderer content={`\\vec{u} + \\vec{v} = (${vecUx + vecVx}; ${vecUy + vecVy})`} inline /></p>
                      <p>• Tích vô hướng: <MathRenderer content={`\\vec{u} \\cdot \\vec{v} = ${dot}`} inline /></p>
                      <p>• Góc kẹp: <MathRenderer content={`\\theta \\approx ${thetaDeg}^\\circ`} inline /></p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 8. LAB 11-MULOG01: Exponential & Logarithm */}
          {activeLabId === 'lab-11-mulog01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Đối xứng Gương qua Đường thẳng y = x
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700">Cơ số a = {baseA}</span>
                </div>
                <div className="border border-slate-100 rounded-xl bg-white p-2 flex justify-center">
                  <canvas ref={canvasExpLogRef} width={520} height={320} className="w-full max-w-lg block" />
                </div>
              </div>
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Điều khiển Cơ số a (a &gt; 0, a ≠ 1)
                </h3>
                <div className="space-y-3 text-xs">
                  <input
                    type="range"
                    min={0.3}
                    max={4}
                    step={0.1}
                    value={baseA}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBaseA(val === 1 ? 1.1 : val);
                    }}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setBaseA(2)} className="px-2 py-1 bg-slate-100 rounded text-xs">a = 2</button>
                    <button type="button" onClick={() => setBaseA(0.5)} className="px-2 py-1 bg-slate-100 rounded text-xs">a = 0.5 (Nghịch biến)</button>
                    <button type="button" onClick={() => setBaseA(2.72)} className="px-2 py-1 bg-slate-100 rounded text-xs">a = e (2.718)</button>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <p>• Hàm số mũ: <MathRenderer content={`y = ${baseA}^x`} inline /> (cắt Oy tại (0; 1))</p>
                  <p>• Hàm số logarit: <MathRenderer content={`y = \\log_{${baseA}}(x)`} inline /> (cắt Ox tại (1; 0))</p>
                  <p>• Chiều biến thiên: {baseA > 1 ? 'Đồng biến trên tập xác định' : 'Nghịch biến trên tập xác định'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 9. LAB 12-DIENTICH01: Riemann Integral Area */}
          {activeLabId === 'lab-12-dientich01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Xấp xỉ Tổng Riemann Phân hoạch n Hình chữ nhật
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700">n = {riemannN} dải</span>
                </div>
                <div className="border border-slate-100 rounded-xl bg-white p-2 flex justify-center">
                  <canvas ref={canvasRiemannRef} width={520} height={320} className="w-full max-w-lg block" />
                </div>
              </div>
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Số lượng Phân hoạch n
                </h3>
                <div className="space-y-3 text-xs">
                  <input
                    type="range"
                    min={4}
                    max={50}
                    step={2}
                    value={riemannN}
                    onChange={(e) => setRiemannN(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    Hội tụ Tích phân Riemann:
                  </span>
                  <p>• Hàm số: <MathRenderer content="f(x) = \frac{x^2}{3} + 0{,}5" inline /> trên đoạn [0; 3]</p>
                  <p>• Diện tích tích phân giải tích: <MathRenderer content="S = \int_0^3 f(x)dx = \left[\frac{x^3}{9} + 0{,}5x\right]_0^3 = 3 + 1{,}5 = 4{,}5" inline /></p>
                  <p>• Khi n tiến ra vô cực (n → ∞), sai số giữa tổng Riemann và tích phân dần tiến về 0.</p>
                </div>
              </div>
            </div>
          )}

          {/* 10. LAB 12-BAYES01: Bayes Tree & Conditional Probability */}
          {activeLabId === 'lab-12-bayes01' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Mô hình Sơ đồ Cây Bayes &amp; Xét nghiệm Y khoa
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khảo sát nghịch lý dương tính giả trong bài toán xét nghiệm bệnh hiếm
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Tỉ lệ nhiễm bệnh trong cộng đồng P(B): {(bayesPrevalence * 100).toFixed(1)}%
                  </span>
                  <input
                    type="range"
                    min={0.005}
                    max={0.1}
                    step={0.005}
                    value={bayesPrevalence}
                    onChange={(e) => setBayesPrevalence(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Độ nhạy của que thử P(Dương tính | Bệnh): {(bayesSensitivity * 100).toFixed(1)}%
                  </span>
                  <input
                    type="range"
                    min={0.8}
                    max={0.99}
                    step={0.01}
                    value={bayesSensitivity}
                    onChange={(e) => setBayesSensitivity(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Tỉ lệ dương tính giả P(Dương tính | Khỏe mạnh): {(bayesFalsePos * 100).toFixed(1)}%
                  </span>
                  <input
                    type="range"
                    min={0.01}
                    max={0.15}
                    step={0.01}
                    value={bayesFalsePos}
                    onChange={(e) => setBayesFalsePos(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {(() => {
                const pop = 10000;
                const sick = pop * bayesPrevalence;
                const healthy = pop - sick;
                const truePos = sick * bayesSensitivity;
                const falsePos = healthy * bayesFalsePos;
                const totalPos = truePos + falsePos;
                const posteriorProb = totalPos > 0 ? (truePos / totalPos) * 100 : 0;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block mb-1 font-semibold">Tổng ca dương tính / 10.000 người</span>
                      <span className="text-2xl font-extrabold text-slate-900 font-mono">{Math.round(totalPos)}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                      <span className="text-[11px] text-indigo-700 block mb-1 font-semibold">Xác suất thật sự mắc bệnh P(B|A)</span>
                      <span className="text-2xl font-extrabold text-indigo-700 font-mono">{posteriorProb.toFixed(2)}%</span>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[11px] text-amber-700 block mb-1 font-semibold">Dương tính giả nhưng không có bệnh</span>
                      <span className="text-2xl font-extrabold text-amber-800 font-mono">{Math.round(falsePos)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 11. LAB 10-THONGKE01: Box Plot */}
          {activeLabId === 'lab-10-thongke01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Biểu đồ Hộp &amp; Râu (Box-and-Whisker Plot)
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setStatDataRaw([4, 5, 6, 6, 7, 7, 7, 8, 8, 8.5, 9, 9, 9.5, 10])}
                      className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold"
                    >
                      Mẫu 1 (Điểm thi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatDataRaw([2, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8, 8.5, 11])}
                      className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold"
                    >
                      Mẫu 2 (Có ngoại lệ)
                    </button>
                  </div>
                </div>
                <div className="border border-slate-100 rounded-xl bg-white p-2 flex justify-center">
                  <canvas ref={canvasBoxPlotRef} width={520} height={260} className="w-full max-w-lg block" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Giá trị Thống kê Đo Xu thế Trung tâm
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <p>• Cỡ mẫu: <span className="font-bold">{statDataRaw.length} phần tử</span></p>
                  <p>• Dãy số liệu sắp thứ tự: [{[...statDataRaw].sort((a, b) => a - b).join(', ')}]</p>
                  <p>• Khoảng tứ phân vị: <MathRenderer content="\text{IQR} = Q_3 - Q_1" inline /></p>
                  <p>• Ranh giới phát hiện ngoại lệ: <MathRenderer content="[Q_1 - 1{,}5\text{IQR};\ Q_3 + 1{,}5\text{IQR}]" inline /></p>
                </div>
              </div>
            </div>
          )}

          {/* 12. LAB 11-HINHDADIEN01: 3D Pyramid Geometry */}
          {activeLabId === 'lab-11-hinhdadien01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Không gian 3D: Hình chóp Đều S.ABCD
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPyrRotX(20);
                        setPyrRotY(-40);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="border border-slate-100 rounded-xl bg-slate-900 p-2 flex justify-center">
                  <canvas ref={canvasPyrRef} width={520} height={320} className="w-full max-w-lg block" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Kích thước Đáy &amp; Chiều cao
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Cạnh đáy a</span>
                      <span className="font-mono text-indigo-700 font-bold">{pyrBaseA}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={5}
                      step={0.5}
                      value={pyrBaseA}
                      onChange={(e) => setPyrBaseA(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Chiều cao h = SO</span>
                      <span className="font-mono text-indigo-700 font-bold">{pyrHeightH}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={6}
                      step={0.5}
                      value={pyrHeightH}
                      onChange={(e) => setPyrHeightH(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <p>• Diện tích đáy: <MathRenderer content={`S_{ABCD} = a^2 = ${(pyrBaseA * pyrBaseA).toFixed(1)}`} inline /></p>
                  <p>• Thể tích chóp: <MathRenderer content={`V = \\frac{1}{3}Bh = \\frac{1}{3}(${(pyrBaseA * pyrBaseA).toFixed(1)})(${pyrHeightH}) \\approx ${((pyrBaseA * pyrBaseA * pyrHeightH) / 3).toFixed(2)}`} inline /></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* CURRICULUM COVERAGE MATRIX (Bảng Độ bao phủ 6 Học kỳ SGK) */}
      {/* ===================================================================== */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-5 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Bảng Đối chiếu &amp; Theo dõi Độ bao phủ Phòng Lab Toán THPT
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Đối chiếu chi tiết 6 học kỳ theo chuẩn SGK. Mỗi bài học có mã định danh và trạng thái kiểm thử minh bạch.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                {totalTested} / {catalog.length} Đã kiểm thử ({coveragePercent}%)
              </div>
            </div>
          </div>

          {/* Filter Bar in Catalog */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Lọc theo khối:</span>
            {(['all', 10, 11, 12] as const).map((g) => (
              <button
                key={String(g)}
                type="button"
                onClick={() => setFilterGrade(g)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  filterGrade === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {g === 'all' ? 'Tất cả' : `Toán ${g}`}
              </button>
            ))}

            <span className="font-semibold text-slate-600 ml-3">Học kỳ:</span>
            {(['all', 1, 2] as const).map((sem) => (
              <button
                key={String(sem)}
                type="button"
                onClick={() => setFilterSemester(sem)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  filterSemester === sem ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {sem === 'all' ? 'Tất cả' : `Học kỳ ${sem}`}
              </button>
            ))}
          </div>

          {/* Coverage Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Khối</th>
                  <th className="px-4 py-3">Học kỳ</th>
                  <th className="px-4 py-3">Chương SGK</th>
                  <th className="px-4 py-3">Bài học &amp; Dạng toán</th>
                  <th className="px-4 py-3">Mã Lab</th>
                  <th className="px-4 py-3">Dạng tương tác</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Khám phá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredCatalog.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-700">Toán {mod.grade}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">HK{mod.semester}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs">{mod.chapter}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{mod.lesson}</p>
                      <p className="text-[11px] text-slate-500">{mod.topic}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{mod.code}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                        {mod.mathType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mod.testStatus === 'tested' || mod.isImplemented
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                        {mod.testStatus === 'tested' || mod.isImplemented ? 'Đã kiểm thử' : 'Đang hoàn thiện'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLabId(mod.id);
                          setActiveTab('simulation');
                          soundService.playClick();
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition-colors shadow-2xs inline-flex items-center gap-1"
                      >
                        <span>Mở Lab</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
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
