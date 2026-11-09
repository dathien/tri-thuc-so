/**
 * EduTest Smart - Math Graphics Render Engine
 * Bộ máy dựng hình học 2D/3D dùng chung, thuần túy toán học và độc lập trạng thái
 */

import {
  MathGraphicConfig,
  MathGraphicType,
  GraphicModelMetadata,
  Camera3D,
} from '../../types/mathGraphics';

export const GRAPHIC_MODELS_CATALOG: GraphicModelMetadata[] = [
  {
    type: 'cubic_function',
    name: 'Đồ thị hàm số bậc ba (y = ax³ + bx² + cx + d)',
    grade: 12,
    dimension: '2D',
    category: 'Hàm số & Đồ thị',
    description: 'Khảo sát sự biến thiên, cực trị, điểm uốn và tiệm cận của hàm đa thức bậc 3.',
    defaultParams: { a: 1, b: -3, c: 0, d: 2, scale: 28 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'parabola_quadratic',
    name: 'Đồ thị Parabol bậc hai (y = ax² + bx + c)',
    grade: 10,
    dimension: '2D',
    category: 'Hàm số & Đồ thị',
    description: 'Đồ thị parabol, tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng và bề lõm.',
    defaultParams: { a: 1, b: -2, c: -3, scale: 28 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'space_3d_oxyz',
    name: 'Mặt phẳng & Hệ tọa độ Oxyz 3D',
    grade: 12,
    dimension: '3D',
    category: 'Hình học không gian',
    description: 'Mặt phẳng (α): Ax + By + Cz + D = 0, vectơ pháp tuyến n(A,B,C) và các giao điểm trên hệ trục.',
    defaultParams: { planeA: 1, planeB: 2, planeC: -1, planeD: -3 },
    defaultCamera: { rotX: 25, rotY: -35, zoom: 1 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'solid_geometry_3d',
    name: 'Hình chóp tứ giác đều S.ABCD (3D)',
    grade: 11,
    dimension: '3D',
    category: 'Hình học không gian',
    description: 'Mô hình không gian hình chóp S.ABCD, đường cao SH, nét khuất và góc nghiêng tùy chỉnh.',
    defaultParams: { baseA: 3.5, heightH: 4 },
    defaultCamera: { rotX: 20, rotY: -30, zoom: 1 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'trig_circle',
    name: 'Vòng tròn lượng giác đơn vị',
    grade: 11,
    dimension: '2D',
    category: 'Lượng giác & Conic',
    description: 'Vòng tròn đơn vị bán kính R=1, góc α, trục sin - cos, điểm ngọn M và hình chiếu.',
    defaultParams: { angleDeg: 45, showWave: true },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'conic_sections',
    name: 'Đường Conic (Elip, Hyperbol, Parabol)',
    grade: 10,
    dimension: '2D',
    category: 'Lượng giác & Conic',
    description: 'Phương trình chính tắc của Elip, Hyperbol và Parabol kèm tiêu điểm và đường chuẩn.',
    defaultParams: { conicType: 'ellipse', a: 4, b: 2.5, p: 2, scale: 32 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'vector_2d',
    name: 'Vectơ & Tích vô hướng trong Oxy',
    grade: 10,
    dimension: '2D',
    category: 'Vectơ & Tọa độ',
    description: 'Biểu diễn hai vectơ u và v, tọa độ điểm mút, góc giữa hai vectơ và tích vô hướng.',
    defaultParams: { ux: 3, uy: 2, vx: -1, vy: 3, scale: 36 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'exp_log_symmetry',
    name: 'Đồ thị Hàm số Mũ và Lôgarit',
    grade: 11,
    dimension: '2D',
    category: 'Hàm số & Đồ thị',
    description: 'Tính đối xứng của đồ thị y = aˣ và y = log_a(x) qua đường phân giác y = x.',
    defaultParams: { baseA: 2, scale: 32 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'derivative_tangent',
    name: 'Tiếp tuyến đồ thị & Ý nghĩa đạo hàm',
    grade: 11,
    dimension: '2D',
    category: 'Giải tích',
    description: 'Tiếp tuyến tại điểm M0(x0, y0), cát tuyến khi Δx dần tới 0 minh họa định nghĩa đạo hàm.',
    defaultParams: { x0: 1, deltaX: 0.8, scale: 36 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'integral_riemann_area',
    name: 'Tích phân & Tổng diện tích Riemann',
    grade: 12,
    dimension: '2D',
    category: 'Giải tích',
    description: 'Minh họa diện tích hình phẳng giới hạn bởi đồ thị hàm số bằng các hình chữ nhật Riemann.',
    defaultParams: { a: 0, b: 3, n: 12 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'statistics_box_plot',
    name: 'Biểu đồ hộp Box Plot & Tứ phân vị',
    grade: 10,
    dimension: '2D',
    category: 'Thống kê & Tập hợp',
    description: 'Trực quan hóa mẫu số liệu ghép nhóm: Min, Q1, Trung vị Q2, Q3, Max và khoảng tứ phân vị.',
    defaultParams: { rawData: '4, 6, 7, 7, 8, 8, 8, 9, 10, 10, 11, 14, 18' },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'set_venn',
    name: 'Tập hợp & Biểu diễn trên trục số',
    grade: 10,
    dimension: '2D',
    category: 'Thống kê & Tập hợp',
    description: 'Giao, hợp, hiệu của hai khoảng A = [a1, a2] và B = [b1, b2] trên trục số thực.',
    defaultParams: { a1: -4, a2: 2, b1: -1, b2: 5, scale: 38 },
    supportedFormats: ['PNG', 'SVG'],
  },
];

/**
 * Deep clone an immutable MathGraphicConfig
 */
export function cloneGraphicConfig(config: MathGraphicConfig): MathGraphicConfig {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Create a fresh default configuration for a given graphic type
 */
export function createDefaultGraphic(type: MathGraphicType, idPrefix = 'fig'): MathGraphicConfig {
  const model = GRAPHIC_MODELS_CATALOG.find((m) => m.type === type) || GRAPHIC_MODELS_CATALOG[0];
  const now = new Date().toISOString();

  return {
    id: `${idPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: model.type,
    title: model.name,
    grade: model.grade,
    topic: model.category,
    params: { ...model.defaultParams },
    viewSettings: {
      showGrid: true,
      showAxes: true,
      showLabels: true,
      showHiddenLines: true,
      width: 560,
      height: 380,
      theme: 'clean_white',
    },
    camera: model.defaultCamera ? { ...model.defaultCamera } : undefined,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Master Drawing Function - Renders any graphic configuration onto a Canvas 2D context
 */
export function renderGraphicToCanvas(
  ctx: CanvasRenderingContext2D,
  config: MathGraphicConfig,
  width: number,
  height: number
): void {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Background style
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const { showGrid = true, showAxes = true, showLabels = true, showHiddenLines = true } =
    config.viewSettings || {};

  switch (config.type) {
    case 'cubic_function':
      drawCubicFunction(ctx, config.params, width, height, showGrid, showAxes, showLabels);
      break;

    case 'parabola_quadratic':
      drawParabola(ctx, config.params, width, height, showGrid, showAxes, showLabels);
      break;

    case 'space_3d_oxyz':
      drawSpace3dOxyz(
        ctx,
        config.params,
        config.camera || { rotX: 25, rotY: -35, zoom: 1 },
        width,
        height,
        showGrid,
        showAxes,
        showLabels
      );
      break;

    case 'solid_geometry_3d':
      drawSolidGeometry3d(
        ctx,
        config.params,
        config.camera || { rotX: 20, rotY: -30, zoom: 1 },
        width,
        height,
        showHiddenLines,
        showLabels
      );
      break;

    case 'trig_circle':
      drawTrigCircle(ctx, config.params, width, height, showAxes, showLabels);
      break;

    case 'conic_sections':
      drawConicSections(ctx, config.params, width, height, showGrid, showAxes, showLabels);
      break;

    case 'vector_2d':
      drawVector2d(ctx, config.params, width, height, showGrid, showAxes, showLabels);
      break;

    case 'exp_log_symmetry':
      drawExpLogSymmetry(ctx, config.params, width, height, showAxes, showLabels);
      break;

    case 'derivative_tangent':
      drawDerivativeTangent(ctx, config.params, width, height, showAxes, showLabels);
      break;

    case 'integral_riemann_area':
      drawIntegralRiemannArea(ctx, config.params, width, height, showAxes, showLabels);
      break;

    case 'statistics_box_plot':
      drawStatisticsBoxPlot(ctx, config.params, width, height, showLabels);
      break;

    case 'set_venn':
      drawSetVenn(ctx, config.params, width, height, showLabels);
      break;

    default:
      drawPlaceholder(ctx, config.title || 'Mô hình Toán học', width, height);
      break;
  }
}

// ---------------------------------------------------------------------------
// 1. CUBIC FUNCTION
// ---------------------------------------------------------------------------
function drawCubicFunction(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showGrid: boolean,
  showAxes: boolean,
  showLabels: boolean
) {
  const a = Number(params.a ?? 1);
  const b = Number(params.b ?? -3);
  const c = Number(params.c ?? 0);
  const d = Number(params.d ?? 2);
  const scale = Number(params.scale ?? 28);

  const ox = width / 2;
  const oy = height / 2;

  // Grid
  if (showGrid) {
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
  }

  // Axes
  if (showAxes) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    // Arrows & Origin
    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 15, oy - 6);
    ctx.fillText('y', ox + 6, 15);
    ctx.fillText('O', ox - 14, oy + 14);
  }

  const f = (x: number) => a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d;

  // Curve
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  for (let px = 0; px <= width; px += 2) {
    const xVal = (px - ox) / scale;
    const yVal = f(xVal);
    const py = oy - yVal * scale;
    if (py >= -60 && py <= height + 60) {
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
  }
  ctx.stroke();

  // Inflection point: x = -b / (3a)
  if (showLabels && Math.abs(a) > 0.001) {
    const xInfl = -b / (3 * a);
    const yInfl = f(xInfl);
    const pxInfl = ox + xInfl * scale;
    const pyInfl = oy - yInfl * scale;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pxInfl, pyInfl, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(`I(${xInfl.toFixed(1)}; ${yInfl.toFixed(1)})`, pxInfl + 8, pyInfl - 4);
  }
}

// ---------------------------------------------------------------------------
// 2. PARABOLA
// ---------------------------------------------------------------------------
function drawParabola(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showGrid: boolean,
  showAxes: boolean,
  showLabels: boolean
) {
  const a = Number(params.a ?? 1);
  const b = Number(params.b ?? -2);
  const c = Number(params.c ?? -3);
  const scale = Number(params.scale ?? 28);

  const ox = width / 2;
  const oy = height / 2;

  if (showGrid) {
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
  }

  if (showAxes) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 15, oy - 6);
    ctx.fillText('y', ox + 6, 15);
    ctx.fillText('O', ox - 14, oy + 14);
  }

  const f = (x: number) => a * x * x + b * x + c;

  // Parabola curve
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  for (let px = 0; px <= width; px += 2) {
    const xVal = (px - ox) / scale;
    const yVal = f(xVal);
    const py = oy - yVal * scale;
    if (py >= -60 && py <= height + 60) {
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
  }
  ctx.stroke();

  // Vertex
  if (showLabels && Math.abs(a) > 0.001) {
    const xV = -b / (2 * a);
    const yV = f(xV);
    const pxV = ox + xV * scale;
    const pyV = oy - yV * scale;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pxV, 0);
    ctx.lineTo(pxV, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pxV, pyV, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(`Đỉnh I(${xV.toFixed(1)}; ${yV.toFixed(1)})`, pxV + 8, pyV - 6);
  }
}

// ---------------------------------------------------------------------------
// 3. 3D OXYZ SPACE & PLANE
// ---------------------------------------------------------------------------
function drawSpace3dOxyz(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  camera: Camera3D,
  width: number,
  height: number,
  showGrid: boolean,
  showAxes: boolean,
  showLabels: boolean
) {
  const A = Number(params.planeA ?? 1);
  const B = Number(params.planeB ?? 2);
  const C = Number(params.planeC ?? -1);
  const D = Number(params.planeD ?? -3);

  const cx = width / 2;
  const cy = height / 2;
  const scale = 36 * (camera.zoom || 1);

  const radX = (camera.rotX * Math.PI) / 180;
  const radY = (camera.rotY * Math.PI) / 180;

  const project = (x: number, y: number, z: number) => {
    const x1 = x * Math.cos(radY) + y * Math.sin(radY);
    const y1 = -x * Math.sin(radY) + y * Math.cos(radY);
    const z1 = z;
    const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);
    return { px: cx + x1 * scale, py: cy - z2 * scale };
  };

  const origin = project(0, 0, 0);
  const axisLen = 5.5;
  const pX = project(axisLen, 0, 0);
  const pY = project(0, axisLen, 0);
  const pZ = project(0, 0, axisLen);

  // Grid in Oxy plane
  if (showGrid) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.8;
    for (let i = -4; i <= 4; i++) {
      const g1 = project(i, -4, 0);
      const g2 = project(i, 4, 0);
      ctx.beginPath();
      ctx.moveTo(g1.px, g1.py);
      ctx.lineTo(g2.px, g2.py);
      ctx.stroke();

      const g3 = project(-4, i, 0);
      const g4 = project(4, i, 0);
      ctx.beginPath();
      ctx.moveTo(g3.px, g3.py);
      ctx.lineTo(g4.px, g4.py);
      ctx.stroke();
    }
  }

  // Axes lines
  if (showAxes) {
    // Ox: Red
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(pX.px, pX.py);
    ctx.stroke();

    // Oy: Green
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(pY.px, pY.py);
    ctx.stroke();

    // Oz: Blue
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(pZ.px, pZ.py);
    ctx.stroke();

    if (showLabels) {
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('x', pX.px + 6, pX.py + 4);
      ctx.fillStyle = '#10b981';
      ctx.fillText('y', pY.px + 6, pY.py + 4);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('z', pZ.px + 4, pZ.py - 6);
      ctx.fillStyle = '#64748b';
      ctx.fillText('O', origin.px - 14, origin.py + 14);
    }
  }

  // Plane Intercepts
  const pts: { x: number; y: number; z: number }[] = [];
  if (Math.abs(A) > 0.001) pts.push({ x: -D / A, y: 0, z: 0 });
  if (Math.abs(B) > 0.001) pts.push({ x: 0, y: -D / B, z: 0 });
  if (Math.abs(C) > 0.001) pts.push({ x: 0, y: 0, z: -D / C });

  if (pts.length >= 3) {
    const pr0 = project(pts[0].x, pts[0].y, pts[0].z);
    const pr1 = project(pts[1].x, pts[1].y, pts[1].z);
    const pr2 = project(pts[2].x, pts[2].y, pts[2].z);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.28)';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(pr0.px, pr0.py);
    ctx.lineTo(pr1.px, pr1.py);
    ctx.lineTo(pr2.px, pr2.py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (showLabels) {
      pts.forEach((pt, idx) => {
        const pr = project(pt.x, pt.y, pt.z);
        ctx.fillStyle = '#4338ca';
        ctx.beginPath();
        ctx.arc(pr.px, pr.py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px monospace';
        ctx.fillText(
          idx === 0 ? `X0(${pt.x.toFixed(1)})` : idx === 1 ? `Y0(${pt.y.toFixed(1)})` : `Z0(${pt.z.toFixed(1)})`,
          pr.px + 6,
          pr.py - 4
        );
      });
    }
  }

  // Normal Vector n = (A, B, C)
  const normLen = Math.sqrt(A * A + B * B + C * C) || 1;
  const nScale = 2.5 / normLen;
  const normEnd = project(A * nScale, B * nScale, C * nScale);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(origin.px, origin.py);
  ctx.lineTo(normEnd.px, normEnd.py);
  ctx.stroke();
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(normEnd.px, normEnd.py, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (showLabels) {
    ctx.fillText(`n(${A}; ${B}; ${C})`, normEnd.px + 6, normEnd.py - 6);
  }
}

// ---------------------------------------------------------------------------
// 4. SOLID GEOMETRY 3D (PYRAMID S.ABCD)
// ---------------------------------------------------------------------------
function drawSolidGeometry3d(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  camera: Camera3D,
  width: number,
  height: number,
  showHiddenLines: boolean,
  showLabels: boolean
) {
  const a = Number(params.baseA ?? 3.5);
  const h = Number(params.heightH ?? 4);

  const cx = width / 2;
  const cy = height / 2 + 30;
  const scale = 34 * (camera.zoom || 1);

  const radX = (camera.rotX * Math.PI) / 180;
  const radY = (camera.rotY * Math.PI) / 180;

  const project = (x: number, y: number, z: number) => {
    const x1 = x * Math.cos(radY) + y * Math.sin(radY);
    const y1 = -x * Math.sin(radY) + y * Math.cos(radY);
    const z1 = z;
    const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);
    return { px: cx + x1 * scale, py: cy - z2 * scale };
  };

  const pA = project(-a / 2, -a / 2, 0);
  const pB = project(a / 2, -a / 2, 0);
  const pC = project(a / 2, a / 2, 0);
  const pD = project(-a / 2, a / 2, 0);
  const pS = project(0, 0, h);
  const pH = project(0, 0, 0);

  // Base polygon fill
  ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
  ctx.beginPath();
  ctx.moveTo(pA.px, pA.py);
  ctx.lineTo(pB.px, pB.py);
  ctx.lineTo(pC.px, pC.py);
  ctx.lineTo(pD.px, pD.py);
  ctx.closePath();
  ctx.fill();

  // Base edges
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lateral edges to S
  [pA, pB, pC, pD].forEach((pt) => {
    ctx.beginPath();
    ctx.moveTo(pt.px, pt.py);
    ctx.lineTo(pS.px, pS.py);
    ctx.stroke();
  });

  // Altitude SH
  if (showHiddenLines) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pH.px, pH.py);
    ctx.lineTo(pS.px, pS.py);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Vertices points & Labels
  if (showLabels) {
    const vertices = [
      { name: 'S', pt: pS, color: '#ef4444' },
      { name: 'A', pt: pA, color: '#4338ca' },
      { name: 'B', pt: pB, color: '#4338ca' },
      { name: 'C', pt: pC, color: '#4338ca' },
      { name: 'D', pt: pD, color: '#4338ca' },
      { name: 'H', pt: pH, color: '#d97706' },
    ];

    ctx.font = 'bold 12px JetBrains Mono, monospace';
    vertices.forEach((v) => {
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.arc(v.pt.px, v.pt.py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(v.name, v.pt.px + 6, v.pt.py - 4);
    });
  }
}

// ---------------------------------------------------------------------------
// 5. TRIG CIRCLE
// ---------------------------------------------------------------------------
function drawTrigCircle(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showAxes: boolean,
  showLabels: boolean
) {
  const angleDeg = Number(params.angleDeg ?? 45);
  const showWave = params.showWave !== false;

  const ox = showWave ? 140 : width / 2;
  const oy = height / 2;
  const radius = showWave ? 90 : 120;

  const rad = (angleDeg * Math.PI) / 180;
  const cosVal = Math.cos(rad);
  const sinVal = Math.sin(rad);

  // Unit Circle
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ox, oy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Axes
  if (showAxes) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox - radius - 25, oy);
    ctx.lineTo(ox + radius + 25, oy);
    ctx.moveTo(ox, oy - radius - 25);
    ctx.lineTo(ox, oy + radius + 25);
    ctx.stroke();

    if (showLabels) {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('cos α', ox + radius + 6, oy - 6);
      ctx.fillText('sin α', ox + 6, oy - radius - 10);
      ctx.fillText('O', ox - 12, oy + 12);
    }
  }

  // Point M
  const mx = ox + radius * cosVal;
  const my = oy - radius * sinVal;

  // Angle Arc
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, 28, 0, -rad, angleDeg > 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Projections
  ctx.strokeStyle = '#ef4444'; // Cos
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(mx, oy);
  ctx.stroke();

  ctx.strokeStyle = '#10b981'; // Sin
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, my);
  ctx.stroke();

  // Dotted lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx, oy);
  ctx.moveTo(mx, my);
  ctx.lineTo(ox, my);
  ctx.stroke();
  ctx.setLineDash([]);

  // Radius OM
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(mx, my);
  ctx.stroke();

  ctx.fillStyle = '#4338ca';
  ctx.beginPath();
  ctx.arc(mx, my, 5, 0, Math.PI * 2);
  ctx.fill();

  if (showLabels) {
    ctx.fillText(`M(${cosVal.toFixed(2)}; ${sinVal.toFixed(2)})`, mx + 8, my - 6);
  }

  // Wave trace on the right
  if (showWave && width > 340) {
    const waveStartX = ox + radius + 40;
    const waveEndX = width - 20;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(waveStartX, oy);
    ctx.lineTo(waveEndX, oy);
    ctx.stroke();

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = waveStartX; px <= waveEndX; px++) {
      const phase = ((px - waveStartX) / (waveEndX - waveStartX)) * (Math.PI * 2);
      const py = oy - radius * Math.sin(phase);
      if (px === waveStartX) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const wavePointX = waveStartX + ((rad % (Math.PI * 2)) / (Math.PI * 2)) * (waveEndX - waveStartX);
    if (wavePointX >= waveStartX && wavePointX <= waveEndX) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(wavePointX, my, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(wavePointX, my);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. CONIC SECTIONS
// ---------------------------------------------------------------------------
function drawConicSections(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showGrid: boolean,
  showAxes: boolean,
  showLabels: boolean
) {
  const conicType = params.conicType || 'ellipse';
  const a = Number(params.a ?? 4);
  const b = Number(params.b ?? 2.5);
  const p = Number(params.p ?? 2);
  const scale = Number(params.scale ?? 32);

  const ox = width / 2;
  const oy = height / 2;

  if (showGrid) {
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
  }

  if (showAxes) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 15, oy - 6);
    ctx.fillText('y', ox + 6, 15);
    ctx.fillText('O', ox - 14, oy + 14);
  }

  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2.5;

  if (conicType === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(ox, oy, a * scale, b * scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Foci
    const c = Math.sqrt(Math.max(0, a * a - b * b));
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ox - c * scale, oy, 4.5, 0, Math.PI * 2);
    ctx.arc(ox + c * scale, oy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    if (showLabels) {
      ctx.fillText('F1', ox - c * scale - 14, oy - 8);
      ctx.fillText('F2', ox + c * scale + 6, oy - 8);
    }
  } else if (conicType === 'hyperbola') {
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      let started = false;
      for (let py = 0; py <= height; py += 2) {
        const y = (oy - py) / scale;
        const x = sign * a * Math.sqrt(1 + (y * y) / (b * b));
        const px = ox + x * scale;
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
  } else {
    // Parabola y^2 = 2px
    ctx.beginPath();
    let started = false;
    for (let py = 0; py <= height; py += 2) {
      const y = (oy - py) / scale;
      const x = (y * y) / (2 * p);
      const px = ox + x * scale;
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
}

// ---------------------------------------------------------------------------
// 7. 2D VECTORS
// ---------------------------------------------------------------------------
function drawVector2d(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showGrid: boolean,
  showAxes: boolean,
  showLabels: boolean
) {
  const ux = Number(params.ux ?? 3);
  const uy = Number(params.uy ?? 2);
  const vx = Number(params.vx ?? -1);
  const vy = Number(params.vy ?? 3);
  const scale = Number(params.scale ?? 36);

  const ox = width / 2;
  const oy = height / 2;

  if (showGrid) {
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
  }

  if (showAxes) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();
  }

  // Vector u
  const uxPx = ox + ux * scale;
  const uyPx = oy - uy * scale;
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(uxPx, uyPx);
  ctx.stroke();
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.arc(uxPx, uyPx, 5, 0, Math.PI * 2);
  ctx.fill();

  // Vector v
  const vxPx = ox + vx * scale;
  const vyPx = oy - vy * scale;
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(vxPx, vyPx);
  ctx.stroke();
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(vxPx, vyPx, 5, 0, Math.PI * 2);
  ctx.fill();

  if (showLabels) {
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillStyle = '#4f46e5';
    ctx.fillText(`u(${ux}; ${uy})`, uxPx + 8, uyPx - 6);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`v(${vx}; ${vy})`, vxPx + 8, vyPx - 6);
  }
}

// ---------------------------------------------------------------------------
// 8. EXP & LOG
// ---------------------------------------------------------------------------
function drawExpLogSymmetry(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showAxes: boolean,
  showLabels: boolean
) {
  const baseA = Number(params.baseA ?? 2);
  const scale = Number(params.scale ?? 32);

  const ox = width / 2;
  const oy = height / 2;

  if (showAxes) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();
  }

  // Symmetry y = x
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // y = a^x
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  for (let px = 0; px <= width; px += 2) {
    const x = (px - ox) / scale;
    const y = Math.pow(baseA, x);
    const py = oy - y * scale;
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

  // y = log_a(x)
  ctx.strokeStyle = '#10b981';
  ctx.beginPath();
  started = false;
  for (let px = ox + 1; px <= width; px += 2) {
    const x = (px - ox) / scale;
    if (x > 0.01) {
      const y = Math.log(x) / Math.log(baseA);
      const py = oy - y * scale;
      if (py >= -20 && py <= height + 20) {
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
    }
  }
  ctx.stroke();

  if (showLabels) {
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillStyle = '#4f46e5';
    ctx.fillText(`y = ${baseA}^x`, ox + 40, oy - 80);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`y = log_${baseA}(x)`, ox + 80, oy - 20);
    ctx.fillStyle = '#d97706';
    ctx.fillText('y = x', width - 40, 25);
  }
}

// ---------------------------------------------------------------------------
// 9. DERIVATIVE & TANGENT
// ---------------------------------------------------------------------------
function drawDerivativeTangent(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showAxes: boolean,
  showLabels: boolean
) {
  const x0 = Number(params.x0 ?? 1);
  const deltaX = Number(params.deltaX ?? 0.8);
  const scale = Number(params.scale ?? 36);

  const ox = width / 2;
  const oy = height / 2;

  if (showAxes) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();
  }

  const f = (x: number) => (x * x) / 2 - 1;
  const fPrime = (x: number) => x;

  // Curve
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

  // Tangent at x0
  const y0 = f(x0);
  const m0Px = ox + x0 * scale;
  const m0Py = oy - y0 * scale;

  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.arc(m0Px, m0Py, 5, 0, Math.PI * 2);
  ctx.fill();

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

  if (showLabels) {
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Tiếp tuyến k = ${kTangent.toFixed(1)}`, ox + tanX2 * scale - 120, oy - tanY2 * scale - 6);
  }
}

// ---------------------------------------------------------------------------
// 10. RIEMANN INTEGRAL
// ---------------------------------------------------------------------------
function drawIntegralRiemannArea(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showAxes: boolean,
  showLabels: boolean
) {
  const a = Number(params.a ?? 0);
  const b = Number(params.b ?? 3);
  const n = Math.max(2, Number(params.n ?? 12));

  const ox = 70;
  const oy = height - 50;
  const scaleX = (width - 120) / 4.5;
  const scaleY = (height - 90) / 12;

  if (showAxes) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, oy);
    ctx.lineTo(width - 20, oy);
    ctx.moveTo(ox, 20);
    ctx.lineTo(ox, height - 20);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 20, oy - 6);
    ctx.fillText('y', ox + 6, 25);
  }

  const f = (x: number) => x * x + 1;
  const dx = (b - a) / n;

  // Riemann Rectangles
  ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 1;

  for (let i = 0; i < n; i++) {
    const xi = a + i * dx;
    const hVal = f(xi + dx / 2);
    const rx = ox + xi * scaleX;
    const ry = oy - hVal * scaleY;
    const rw = dx * scaleX;
    const rh = hVal * scaleY;

    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);
  }

  // Curve
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let px = 0; px <= 4; px += 0.05) {
    const pxCanvas = ox + px * scaleX;
    const pyCanvas = oy - f(px) * scaleY;
    if (px === 0) ctx.moveTo(pxCanvas, pyCanvas);
    else ctx.lineTo(pxCanvas, pyCanvas);
  }
  ctx.stroke();

  if (showLabels) {
    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(`Diện tích Riemann [${a}; ${b}] (n=${n})`, ox + 20, 45);
  }
}

// ---------------------------------------------------------------------------
// 11. STATISTICS BOX PLOT
// ---------------------------------------------------------------------------
function drawStatisticsBoxPlot(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showLabels: boolean
) {
  const raw = String(params.rawData || '4, 6, 7, 7, 8, 8, 8, 9, 10, 10, 11, 14, 18');
  const nums = raw
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (nums.length < 4) {
    drawPlaceholder(ctx, 'Cần tối thiểu 4 giá trị số liệu', width, height);
    return;
  }

  const min = nums[0];
  const max = nums[nums.length - 1];
  const n = nums.length;

  const median = (arr: number[]) => {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  const q2 = median(nums);
  const halfLen = Math.floor(n / 2);
  const lowerHalf = nums.slice(0, halfLen);
  const upperHalf = n % 2 === 0 ? nums.slice(halfLen) : nums.slice(halfLen + 1);
  const q1 = median(lowerHalf);
  const q3 = median(upperHalf);

  const pad = 40;
  const plotWidth = width - pad * 2;
  const range = Math.max(1, max - min + 4);
  const toPx = (val: number) => pad + ((val - (min - 2)) / range) * plotWidth;

  const yMid = height / 2;
  const boxH = 44;

  // Axis
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, yMid + 35);
  ctx.lineTo(width - pad, yMid + 35);
  ctx.stroke();

  for (let v = Math.floor(min - 2); v <= Math.ceil(max + 2); v += 2) {
    const px = toPx(v);
    if (px >= pad && px <= width - pad) {
      ctx.beginPath();
      ctx.moveTo(px, yMid + 30);
      ctx.lineTo(px, yMid + 40);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(v), px, yMid + 52);
    }
  }

  // Whiskers
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toPx(min), yMid);
  ctx.lineTo(toPx(q1), yMid);
  ctx.moveTo(toPx(q3), yMid);
  ctx.lineTo(toPx(max), yMid);
  ctx.stroke();

  // Box Q1 to Q3
  ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  ctx.fillRect(toPx(q1), yMid - boxH / 2, toPx(q3) - toPx(q1), boxH);
  ctx.strokeRect(toPx(q1), yMid - boxH / 2, toPx(q3) - toPx(q1), boxH);

  // Median Q2
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(toPx(q2), yMid - boxH / 2);
  ctx.lineTo(toPx(q2), yMid + boxH / 2);
  ctx.stroke();

  if (showLabels) {
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Q1=${q1}`, toPx(q1), yMid - boxH / 2 - 8);
    ctx.fillText(`Med=${q2}`, toPx(q2), yMid - boxH / 2 - 20);
    ctx.fillText(`Q3=${q3}`, toPx(q3), yMid - boxH / 2 - 8);
    ctx.fillText(`Min=${min}`, toPx(min), yMid + 20);
    ctx.fillText(`Max=${max}`, toPx(max), yMid + 20);
  }
}

// ---------------------------------------------------------------------------
// 12. SET VENN & REAL AXIS
// ---------------------------------------------------------------------------
function drawSetVenn(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showLabels: boolean
) {
  const a1 = Number(params.a1 ?? -4);
  const a2 = Number(params.a2 ?? 2);
  const b1 = Number(params.b1 ?? -1);
  const b2 = Number(params.b2 ?? 5);
  const scale = Number(params.scale ?? 38);

  const ox = width / 2;
  const yAxis = height / 2;

  // Real Axis
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(25, yAxis);
  ctx.lineTo(width - 25, yAxis);
  ctx.stroke();

  // Axis Arrow
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(width - 20, yAxis);
  ctx.lineTo(width - 30, yAxis - 5);
  ctx.lineTo(width - 30, yAxis + 5);
  ctx.closePath();
  ctx.fill();

  // Ticks
  for (let val = -7; val <= 7; val++) {
    const px = ox + val * scale;
    if (px > 30 && px < width - 30) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, yAxis - 4);
      ctx.lineTo(px, yAxis + 4);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), px, yAxis + 18);
    }
  }

  // Interval A
  const pxA1 = ox + Math.min(a1, a2) * scale;
  const pxA2 = ox + Math.max(a1, a2) * scale;
  const yA = yAxis - 45;
  ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2.5;
  ctx.fillRect(pxA1, yA - 10, pxA2 - pxA1, 20);
  ctx.strokeRect(pxA1, yA - 10, pxA2 - pxA1, 20);

  // Interval B
  const pxB1 = ox + Math.min(b1, b2) * scale;
  const pxB2 = ox + Math.max(b1, b2) * scale;
  const yB = yAxis + 45;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.fillRect(pxB1, yB - 10, pxB2 - pxB1, 20);
  ctx.strokeRect(pxB1, yB - 10, pxB2 - pxB1, 20);

  if (showLabels) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Tập A = [${Math.min(a1, a2)}; ${Math.max(a1, a2)}]`, (pxA1 + pxA2) / 2, yA - 16);

    ctx.fillStyle = '#065f46';
    ctx.fillText(`Tập B = [${Math.min(b1, b2)}; ${Math.max(b1, b2)}]`, (pxB1 + pxB2) / 2, yB + 28);
  }
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, msg: string, width: number, height: number) {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(0, 0, width, height);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(msg, width / 2, height / 2);
}

// ---------------------------------------------------------------------------
// EXPORT HELPERS (PNG & SVG)
// ---------------------------------------------------------------------------

/**
 * Export graphic to PNG Data URL (using offscreen canvas)
 */
export function exportGraphicToPngDataUrl(
  config: MathGraphicConfig,
  width = 600,
  height = 400
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  renderGraphicToCanvas(ctx, config, width, height);
  return canvas.toDataURL('image/png');
}

/**
 * Export graphic to pure vector SVG string
 */
export function exportGraphicToSvg(
  config: MathGraphicConfig,
  width = 600,
  height = 400
): string {
  // Generate valid SVG XML
  const { title = 'Hình vẽ Toán học', type } = config;
  let content = '';

  if (type === 'cubic_function') {
    const a = Number(config.params.a ?? 1);
    const b = Number(config.params.b ?? -3);
    const c = Number(config.params.c ?? 0);
    const d = Number(config.params.d ?? 2);
    const scale = Number(config.params.scale ?? 28);
    const ox = width / 2;
    const oy = height / 2;
    const f = (x: number) => a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d;

    let pathD = '';
    for (let px = 0; px <= width; px += 2) {
      const xVal = (px - ox) / scale;
      const py = oy - f(xVal) * scale;
      if (py >= -60 && py <= height + 60) {
        pathD += (pathD === '' ? 'M ' : ' L ') + `${px} ${py.toFixed(1)}`;
      }
    }

    content = `
      <!-- Axes -->
      <line x1="0" y1="${oy}" x2="${width}" y2="${oy}" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="${ox}" y1="0" x2="${ox}" y2="${height}" stroke="#94a3b8" stroke-width="1.5" />
      <text x="${width - 15}" y="${oy - 6}" font-family="monospace" font-size="11" fill="#64748b">x</text>
      <text x="${ox + 6}" y="15" font-family="monospace" font-size="11" fill="#64748b">y</text>
      <!-- Curve -->
      <path d="${pathD}" fill="none" stroke="#4f46e5" stroke-width="2.5" />
    `;
  } else if (type === 'parabola_quadratic') {
    const a = Number(config.params.a ?? 1);
    const b = Number(config.params.b ?? -2);
    const c = Number(config.params.c ?? -3);
    const scale = Number(config.params.scale ?? 28);
    const ox = width / 2;
    const oy = height / 2;
    const f = (x: number) => a * x * x + b * x + c;

    let pathD = '';
    for (let px = 0; px <= width; px += 2) {
      const xVal = (px - ox) / scale;
      const py = oy - f(xVal) * scale;
      if (py >= -60 && py <= height + 60) {
        pathD += (pathD === '' ? 'M ' : ' L ') + `${px} ${py.toFixed(1)}`;
      }
    }

    content = `
      <line x1="0" y1="${oy}" x2="${width}" y2="${oy}" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="${ox}" y1="0" x2="${ox}" y2="${height}" stroke="#94a3b8" stroke-width="1.5" />
      <path d="${pathD}" fill="none" stroke="#4f46e5" stroke-width="2.5" />
    `;
  } else {
    // Default SVG container using rendered PNG inside foreignObject or fallback
    const pngDataUrl = exportGraphicToPngDataUrl(config, width, height);
    content = `
      <image href="${pngDataUrl}" width="${width}" height="${height}" />
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <title>${title}</title>
  <rect width="${width}" height="${height}" fill="#ffffff" />
  ${content}
</svg>`;
}
