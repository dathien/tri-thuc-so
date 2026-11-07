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
    // Format to max 2 decimals with comma separator
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

  // A*x
  if (A !== 0) {
    if (A === 1) parts.push('x');
    else if (A === -1) parts.push('-x');
    else parts.push(`${A}x`);
  }

  // B*y
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

  // C*z
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

  // Constant D
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

  // ax^3
  if (a !== 0) {
    if (a === 1) parts.push('x^3');
    else if (a === -1) parts.push('-x^3');
    else parts.push(`${a}x^3`);
  }

  // bx^2
  if (b !== 0) {
    if (parts.length === 0) {
      if (b === 1) parts.push('x^2');
      else if (b === -1) parts.push('-x^2');
      else parts.push(`${b}x^2`);
    } else {
      parts.push(b > 0 ? `+ ${b === 1 ? '' : b}x^2` : `- ${Math.abs(b) === 1 ? '' : Math.abs(b)}x^2`);
    }
  }

  // cx
  if (c !== 0) {
    if (parts.length === 0) {
      if (c === 1) parts.push('x');
      else if (c === -1) parts.push('-x');
      else parts.push(`${c}x`);
    } else {
      parts.push(c > 0 ? `+ ${c === 1 ? '' : c}x` : `- ${Math.abs(c) === 1 ? '' : Math.abs(c)}x`);
    }
  }

  // d
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

  // ax^2
  if (a !== 0) {
    if (a === 1) parts.push('x^2');
    else if (a === -1) parts.push('-x^2');
    else parts.push(`${a}x^2`);
  }

  // bx
  if (b !== 0) {
    if (parts.length === 0) {
      if (b === 1) parts.push('x');
      else if (b === -1) parts.push('-x');
      else parts.push(`${b}x`);
    } else {
      parts.push(b > 0 ? `+ ${b === 1 ? '' : b}x` : `- ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
    }
  }

  // c
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

  // Lab 1: Cubic Function
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(-3);
  const [paramC, setParamC] = useState(0);
  const [paramD, setParamD] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Lab 2: 3D Oxyz Space & Plane
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

  // Lab 3: Unit Trig Circle & Wave
  const [angleDeg, setAngleDeg] = useState(45);
  const canvasTrigRef = useRef<HTMLCanvasElement | null>(null);

  // Lab 4: Parabola y = ax^2 + bx + c
  const [parabolA, setParabolA] = useState(1);
  const [parabolB, setParabolB] = useState(-2);
  const [parabolC, setParabolC] = useState(-3);
  const canvasParabolRef = useRef<HTMLCanvasElement | null>(null);

  // =========================================================================
  // LAB 1: 2D Cubic Function Graph
  // =========================================================================
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

    // Axis labels in clean text
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

  // =========================================================================
  // LAB 2: 3D Oxyz Space & Plane
  // =========================================================================
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
      // Rotate around Y
      const x1 = x * Math.cos(radY) + z * Math.sin(radY);
      const z1 = -x * Math.sin(radY) + z * Math.cos(radY);
      // Rotate around X
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

      return {
        px: cx + x1 * baseScale,
        py: cy - y2 * baseScale,
        depth: z2,
      };
    };

    const origin = project(0, 0, 0);

    // Coordinate grid on xOy plane (z = 0)
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

      // Negative dashed line
      ctx.strokeStyle = '#475569';
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

      // Label (Pure text, no raw LaTeX)
      ctx.fillStyle = color;
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(label, tip.px + 6, tip.py + 4);
    };

    drawAxis(5, 0, 0, '#ef4444', 'Ox');
    drawAxis(0, 5, 0, '#10b981', 'Oy');
    drawAxis(0, 0, 5, '#38bdf8', 'Oz');

    // Origin label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('O', origin.px - 12, origin.py + 12);

    // Plane Polygon Drawing
    const hasPlaneCoeffs = planeA !== 0 || planeB !== 0 || planeC !== 0;
    if (hasPlaneCoeffs) {
      // If plane intersects all 3 axes within reasonable bounds
      if (planeA !== 0 && planeB !== 0 && planeC !== 0) {
        const pX = -planeD / planeA;
        const pY = -planeD / planeB;
        const pZ = -planeD / planeC;

        const ptA = project(pX, 0, 0);
        const ptB = project(0, pY, 0);
        const ptC = project(0, 0, pZ);

        // Draw Intersecting Triangle
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

        // Points
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
        // Plane is parallel or contains one or two axes.
        // Draw bounded planar sheet centered near the plane.
        let p0 = { x: 0, y: 0, z: 0 };
        if (planeC !== 0) p0 = { x: 0, y: 0, z: -planeD / planeC };
        else if (planeB !== 0) p0 = { x: 0, y: -planeD / planeB, z: 0 };
        else if (planeA !== 0) p0 = { x: -planeD / planeA, y: 0, z: 0 };

        // Construct 2 orthogonal vectors on the plane
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

        // v = n x u
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

      // Normal Vector n = (A, B, C)
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

      // Normal Vector text label without raw LaTeX
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(`n(${planeA}; ${planeB}; ${planeC})`, normTip.px + 6, normTip.py - 6);
    }
  }, [activeLabId, planeA, planeB, planeC, planeD, rotX, rotY, zoom]);

  // =========================================================================
  // LAB 3: Unit Trig Circle & Sine Wave
  // =========================================================================
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

    // Unit Circle background grid
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

    // Axis labels in pure text
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('cos α', circleCx + radius + 8, circleCy - 6);
    ctx.fillText('sin α', circleCx + 6, circleCy - radius - 8);
    ctx.fillText('O', circleCx - 12, circleCy + 14);
    ctx.fillText('1', circleCx + radius + 2, circleCy + 12);
    ctx.fillText('-1', circleCx - radius - 16, circleCy + 12);
    ctx.fillText('1', circleCx + 6, circleCy - radius + 4);
    ctx.fillText('-1', circleCx + 6, circleCy + radius + 12);

    // Moving point M
    const rad = (angleDeg * Math.PI) / 180;
    const cosVal = Math.cos(rad);
    const sinVal = Math.sin(rad);
    const mx = circleCx + radius * cosVal;
    const my = circleCy - radius * sinVal;

    // Angle Arc
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

    // Radius line OM
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(circleCx, circleCy);
    ctx.lineTo(mx, my);
    ctx.stroke();

    // Projected lines (cos: red on horizontal axis, sin: emerald on vertical axis)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, circleCy); // projection to cos
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(circleCx, my); // projection to sin
    ctx.stroke();
    ctx.setLineDash([]);

    // Highlight segments on axes
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(circleCx, circleCy);
    ctx.lineTo(mx, circleCy);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(circleCx, circleCy);
    ctx.lineTo(circleCx, my);
    ctx.stroke();

    // Point M circle
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

    // Right side: Sine Wave
    const waveStartX = width * 0.54;
    const waveEndX = width - 24;
    const waveWidth = waveEndX - waveStartX;

    // Axis for wave
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

    // Sine Wave Curve
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

    // Point on Wave
    const currentWaveX = waveStartX + (angleDeg / 360) * waveWidth;
    const currentWaveY = circleCy - radius * sinVal;

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(currentWaveX, currentWaveY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Connecting dashed line
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(currentWaveX, currentWaveY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeLabId, angleDeg]);

  // =========================================================================
  // LAB 4: Parabola y = ax^2 + bx + c
  // =========================================================================
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

    // Parabola Curve
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

      // Vertex I (-b / 2a, -delta / 4a)
      const vertexX = -parabolB / (2 * parabolA);
      const delta = parabolB * parabolB - 4 * parabolA * parabolC;
      const vertexY = -delta / (4 * parabolA);

      const vxPx = originX + vertexX * scale;
      const vyPx = originY - vertexY * scale;

      // Axis of Symmetry (dashed line x = vertexX)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(vxPx, 0);
      ctx.lineTo(vxPx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mark Vertex I
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

      // Roots on Ox if delta >= 0
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

  // Mouse handlers for 3D rotation
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

  // Tab definitions with concise, non-overflowing labels
  const labTabs = [
    {
      id: 'lab-12-02',
      name: 'Mặt phẳng 3D Oxyz',
      grade: 'K12',
      type: '3D',
      icon: Rotate3d,
    },
    {
      id: 'lab-11-01',
      name: 'Lượng giác & Sóng Sin',
      grade: 'K11',
      type: '2D',
      icon: Compass,
    },
    {
      id: 'lab-12-01',
      name: 'Hàm bậc ba 2D',
      grade: 'K12',
      type: '2D',
      icon: Layers,
    },
    {
      id: 'lab-10-01',
      name: 'Parabol Bậc hai 2D',
      grade: 'K10',
      type: '2D',
      icon: Sliders,
    },
  ];

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
            Khám phá trực quan Không gian 3D Oxyz, Đường tròn lượng giác, Hàm bậc ba và Parabol bậc hai.
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
          {/* Lab Selection Bar: Compact, clean, non-overflowing horizontal scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {labTabs.map((lab) => {
              const Icon = lab.icon;
              const isActive = activeLabId === lab.id;
              return (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => {
                    setActiveLabId(lab.id);
                    soundService.playClick();
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{lab.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                      isActive ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {lab.grade} · {lab.type}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ================================================================= */}
          {/* LAB 2: 3D Oxyz Space & Plane Ax + By + Cz + D = 0 */}
          {/* ================================================================= */}
          {activeLabId === 'lab-12-02' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Canvas (7 cols) */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Mô hình Không gian 3D Oxyz
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                      Kéo chuột để xoay 360°
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

                {/* 3D Canvas Viewport */}
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

                {/* Equation badge */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 gap-2">
                  <div className="font-semibold">
                    Phương trình hiện thời:
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-indigo-900 font-bold">
                    <MathRenderer content={formatPlaneEquation(planeA, planeB, planeC, planeD)} inline />
                  </div>
                </div>
              </div>

              {/* Right Deck: Controls & Step-by-Step Derivation (5 cols) */}
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

                {/* General Equation Display Card */}
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

                {/* Sliders for A, B, C, D */}
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

                {/* Intersections with Axes: Step-by-Step with precise math */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                  <span className="font-bold block text-slate-900 border-b border-indigo-200/60 pb-1.5 uppercase text-[11px] tracking-wider">
                    Giao điểm với các trục tọa độ:
                  </span>

                  {/* Ox */}
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800">
                      • Trục <MathRenderer content="Ox" inline />:
                    </span>
                    <div className="text-slate-700 pl-3">
                      <MathRenderer content={interceptOx.text} inline />
                    </div>
                  </div>

                  {/* Oy */}
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800">
                      • Trục <MathRenderer content="Oy" inline />:
                    </span>
                    <div className="text-slate-700 pl-3">
                      <MathRenderer content={interceptOy.text} inline />
                    </div>
                  </div>

                  {/* Oz */}
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800">
                      • Trục <MathRenderer content="Oz" inline />:
                    </span>
                    <div className="text-slate-700 pl-3">
                      <MathRenderer content={interceptOz.text} inline />
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Thử nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaneA(0);
                      setPlaneB(1);
                      setPlaneC(1);
                      setPlaneD(-2);
                      soundService.playClick();
                    }}
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold"
                  >
                    A = 0 (// Ox)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaneA(1);
                      setPlaneB(1);
                      setPlaneC(1);
                      setPlaneD(0);
                      soundService.playClick();
                    }}
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold"
                  >
                    D = 0 (Qua O)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* LAB 3: Unit Trig Circle & Sine Wave */}
          {/* ================================================================= */}
          {activeLabId === 'lab-11-01' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Vòng tròn Lượng giác Đơn vị &amp; Đồ thị Sóng Sin
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Liên hệ trực quan giữa tọa độ điểm M trên đường tròn đơn vị và đồ thị hàm số sin
                  </p>
                </div>

                {/* Dynamic Radians and Degree Header */}
                <div className="bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-indigo-900 font-bold text-xs sm:text-sm">
                  <MathRenderer content={formatRadianLatex(angleDeg)} inline />
                </div>
              </div>

              {/* Canvas Visualizer */}
              <div className="flex justify-center border border-slate-100 rounded-xl bg-slate-50 p-2">
                <canvas
                  ref={canvasTrigRef}
                  width={640}
                  height={260}
                  className="w-full max-w-2xl block"
                />
              </div>

              {/* Slider Control with Proper MathRenderer for alpha */}
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

                {/* Preset Angle Buttons */}
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

              {/* Mathematical Values Grid */}
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

          {/* ================================================================= */}
          {/* LAB 1: Cubic Function 2D */}
          {/* ================================================================= */}
          {activeLabId === 'lab-12-01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Canvas (7 cols) */}
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
                    <MathRenderer content={formatCubicEquation(paramA, paramB, paramC, paramD)} inline />
                  </span>
                </div>
              </div>

              {/* Right Parameters Deck (5 cols) */}
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

                {/* Exploration Question */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Câu hỏi Khám phá:
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Kéo tham số <MathRenderer content="a" inline /> về giá trị âm (ví dụ <MathRenderer content="a = -1" inline />). Hãy quan sát hình dáng đồ thị và chiều biến thiên của 2 nhánh vô cực thay đổi như thế nào?
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* LAB 4: Parabola y = ax^2 + bx + c */}
          {/* ================================================================= */}
          {activeLabId === 'lab-10-01' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Canvas (7 cols) */}
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
                    title="Đặt lại tham số mặc định"
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

              {/* Right Parameters Deck (5 cols) */}
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

                {/* Analytical Card */}
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
                      <p className="text-slate-600 text-[11px] pt-1">
                        {delta > 0
                          ? '✓ Parabol cắt trục Ox tại 2 điểm phân biệt.'
                          : delta === 0
                          ? '✓ Parabol tiếp xúc với trục Ox tại đỉnh I.'
                          : '✓ Parabol không cắt trục Ox (nằm hẳn về một phía).'}
                      </p>
                    </div>
                  );
                })()}
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
              Bảng danh mục bao phủ Toán 10–12. Các hoạt động đã hoàn thành cho phép mở tương tác ngay; các hoạt động trong lộ trình tiếp theo được ghi chú minh bạch.
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
