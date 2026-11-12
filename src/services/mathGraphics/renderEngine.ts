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
  // 1. Tam giác, đường tròn, tứ giác
  {
    type: 'plane_geometry',
    name: 'Tam giác, Đường tròn & Tứ giác phẳng',
    grade: 10,
    dimension: '2D',
    category: 'Tam giác, đường tròn, tứ giác',
    description: 'Tam giác với trực tâm, trọng tâm, tâm nội/ngoại tiếp; đường tròn và tứ giác nội tiếp.',
    defaultParams: {
      shape: 'triangle_incenter', // 'triangle_incenter' | 'triangle_circumcenter' | 'circle_chord' | 'trapezoid'
      labelA: 'A',
      labelB: 'B',
      labelC: 'C',
      labelD: 'D',
      showHeights: true,
      showMedians: false,
    },
    supportedFormats: ['PNG', 'SVG'],
  },

  // 2. Hình chóp, lăng trụ, hình hộp, đa diện
  {
    type: 'solid_geometry_3d',
    name: 'Hình chóp, Lăng trụ & Hình hộp (3D)',
    grade: 11,
    dimension: '3D',
    category: 'Hình chóp, lăng trụ, hình hộp, đa diện',
    description: 'Mô hình không gian hình chóp S.ABCD, S.ABC, lăng trụ tam giác và hình hộp chữ nhật với đường cao, nét đứt khuất.',
    defaultParams: {
      solidType: 'pyramid_quad', // 'pyramid_quad' | 'pyramid_tri' | 'prism_tri' | 'box_cuboid'
      baseA: 3.5,
      heightH: 4.0,
      showAltitude: true,
    },
    defaultCamera: { rotX: 20, rotY: -30, zoom: 1 },
    supportedFormats: ['PNG', 'SVG'],
  },

  // 3. Hình học tọa độ Oxy và Oxyz
  {
    type: 'space_3d_oxyz',
    name: 'Mặt phẳng & Hệ tọa độ Oxyz (3D)',
    grade: 12,
    dimension: '3D',
    category: 'Hình học tọa độ Oxy và Oxyz',
    description: 'Mặt phẳng (α): Ax + By + Cz + D = 0, vectơ pháp tuyến n(A,B,C) và các giao điểm trên hệ trục Oxyz.',
    defaultParams: { planeA: 1, planeB: 2, planeC: -1, planeD: -3 },
    defaultCamera: { rotX: 25, rotY: -35, zoom: 1 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'vector_2d',
    name: 'Hệ trục Oxy, Vectơ & Tọa độ phẳng',
    grade: 10,
    dimension: '2D',
    category: 'Hình học tọa độ Oxy và Oxyz',
    description: 'Hệ tọa độ Oxy, các vectơ u, v, tọa độ điểm và tích vô hướng.',
    defaultParams: { ux: 3, uy: 2, vx: -1, vy: 3, scale: 36 },
    supportedFormats: ['PNG', 'SVG'],
  },

  // 4. Đồ thị hàm số
  {
    type: 'cubic_function',
    name: 'Đồ thị hàm số bậc ba (y = ax³ + bx² + cx + d)',
    grade: 12,
    dimension: '2D',
    category: 'Đồ thị hàm số',
    description: 'Khảo sát sự biến thiên, cực đại, cực tiểu, điểm uốn và giao điểm trục tọa độ.',
    defaultParams: { a: 1, b: 0, c: -3, d: 2, scale: 32 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'rational_function',
    name: 'Đồ thị hàm phân thức bậc nhất y = (ax + b)/(cx + d)',
    grade: 12,
    dimension: '2D',
    category: 'Đồ thị hàm số',
    description: 'Khảo sát tiệm cận đứng, tiệm cận ngang, tâm đối xứng và hai nhánh hypebol.',
    defaultParams: { a: 2, b: 1, c: 1, d: -1, scale: 28 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'parabola_quadratic',
    name: 'Đồ thị Parabol bậc hai (y = ax² + bx + c)',
    grade: 10,
    dimension: '2D',
    category: 'Đồ thị hàm số',
    description: 'Đồ thị parabol, tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng và bề lõm.',
    defaultParams: { a: 1, b: -2, c: -3, scale: 28 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'exp_log_symmetry',
    name: 'Đồ thị Hàm số Mũ và Lôgarit',
    grade: 11,
    dimension: '2D',
    category: 'Đồ thị hàm số',
    description: 'Tính đối xứng của đồ thị y = aˣ và y = log_a(x) qua đường phân giác y = x.',
    defaultParams: { baseA: 2, scale: 32 },
    supportedFormats: ['PNG', 'SVG'],
  },

  // 5. Bảng biến thiên
  {
    type: 'variation_table',
    name: 'Bảng biến thiên (BBT) hàm số chuẩn',
    grade: 12,
    dimension: '2D',
    category: 'Bảng biến thiên',
    description: 'Bảng biến thiên 3 hàng: x, y\', y với các điểm tới hạn, dấu đạo hàm và chiều biến thiên mũi tên.',
    defaultParams: {
      fnPreset: 'cubic', // 'cubic' | 'rational' | 'quartic' | 'quadratic'
      xValues: '-∞, -1, 1, +∞',
      derivativeSigns: '+, 0, -, 0, +',
      yValues: '-∞, 4, 0, +∞',
    },
    supportedFormats: ['PNG', 'SVG'],
  },

  // 6. Hình nón, trụ, cầu, khối tròn xoay
  {
    type: 'round_solids',
    name: 'Khối tròn xoay (Hình nón, Hình trụ, Mặt cầu)',
    grade: 12,
    dimension: '2D',
    category: 'Hình nón, trụ, cầu, khối tròn xoay',
    description: 'Hình nón đỉnh S bán kính R đường sinh l; hình trụ hai đáy O, O\'; hình cầu tâm O bán kính R với các đường sinh và nét khuất.',
    defaultParams: {
      solidType: 'cone', // 'cone' | 'cylinder' | 'sphere'
      radiusR: 3.0,
      heightH: 4.5,
      showDimensions: true,
    },
    supportedFormats: ['PNG', 'SVG'],
  },

  // 7. Hình theo tọa độ hoặc tham số giáo viên nhập
  {
    type: 'custom_coords',
    name: 'Hình theo Tọa độ & Tham số giáo viên tự nhập',
    grade: 10,
    dimension: '2D',
    category: 'Hình theo tọa độ / tham số tùy chỉnh',
    description: 'Vẽ đa giác, đoạn thẳng, điểm và nét khuất linh hoạt theo tọa độ hoặc phương trình giáo viên chỉ định.',
    defaultParams: {
      points: 'A(-3, -2), B(3, -2), C(2, 3), D(-2, 3)',
      segments: 'AB, BC, CD, DA, AC, BD',
      dashedSegments: 'BD',
      showPointLabels: true,
      scale: 32,
    },
    supportedFormats: ['PNG', 'SVG'],
  },

  // Bổ sung các công cụ hỗ trợ
  {
    type: 'trig_circle',
    name: 'Vòng tròn lượng giác đơn vị',
    grade: 11,
    dimension: '2D',
    category: 'Tam giác, đường tròn, tứ giác',
    description: 'Vòng tròn đơn vị bán kính R=1, góc α, trục sin - cos, điểm ngọn M và hình chiếu.',
    defaultParams: { angleDeg: 45, showWave: true },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'conic_sections',
    name: 'Đường Conic (Elip, Hyperbol, Parabol)',
    grade: 10,
    dimension: '2D',
    category: 'Đồ thị hàm số',
    description: 'Phương trình chính tắc của Elip, Hyperbol và Parabol kèm tiêu điểm và đường chuẩn.',
    defaultParams: { conicType: 'ellipse', a: 4, b: 2.5, p: 2, scale: 32 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'derivative_tangent',
    name: 'Tiếp tuyến đồ thị & Ý nghĩa đạo hàm',
    grade: 11,
    dimension: '2D',
    category: 'Đồ thị hàm số',
    description: 'Tiếp tuyến tại điểm M0(x0, y0), cát tuyến khi Δx dần tới 0 minh họa định nghĩa đạo hàm.',
    defaultParams: { x0: 1, deltaX: 0.8, scale: 36 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'integral_riemann_area',
    name: 'Tích phân & Tổng diện tích Riemann',
    grade: 12,
    dimension: '2D',
    category: 'Đồ thị hàm số',
    description: 'Minh họa diện tích hình phẳng giới hạn bởi đồ thị hàm số bằng các hình chữ nhật Riemann.',
    defaultParams: { a: 0, b: 3, n: 12 },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'statistics_box_plot',
    name: 'Biểu đồ hộp Box Plot & Tứ phân vị',
    grade: 10,
    dimension: '2D',
    category: 'Bảng biến thiên',
    description: 'Trực quan hóa mẫu số liệu ghép nhóm: Min, Q1, Trung vị Q2, Q3, Max và khoảng tứ phân vị.',
    defaultParams: { rawData: '4, 6, 7, 7, 8, 8, 8, 9, 10, 10, 11, 14, 18' },
    supportedFormats: ['PNG', 'SVG'],
  },
  {
    type: 'set_venn',
    name: 'Tập hợp & Biểu diễn trên trục số',
    grade: 10,
    dimension: '2D',
    category: 'Tam giác, đường tròn, tứ giác',
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
    case 'rational_function':
      drawRationalFunction(ctx, config.params, width, height, showGrid, showAxes, showLabels);
      break;

    case 'variation_table':
      drawVariationTable(ctx, config.params, width, height, showLabels);
      break;

    case 'plane_geometry':
      drawPlaneGeometry(ctx, config.params, width, height, showLabels);
      break;

    case 'round_solids':
      drawRoundSolids(ctx, config.params, width, height, showHiddenLines, showLabels);
      break;

    case 'custom_coords':
      drawCustomCoords(ctx, config.params, width, height, showGrid, showAxes, showLabels);
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
// 1. CUBIC FUNCTION (y = ax³ + bx² + cx + d)
// ---------------------------------------------------------------------------

function solveCubicRoots(a: number, b: number, c: number, d: number): number[] {
  // Solve ax^3 + bx^2 + cx + d = 0 for real roots
  if (Math.abs(a) < 1e-9) return [];
  const p = (3 * a * c - b * b) / (3 * a * a);
  const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
  const shift = -b / (3 * a);
  const D = (q / 2) ** 2 + (p / 3) ** 3;

  const rawRoots: number[] = [];

  if (D > 1e-9) {
    const sqrtD = Math.sqrt(D);
    const u = Math.cbrt(-q / 2 + sqrtD);
    const v = Math.cbrt(-q / 2 - sqrtD);
    rawRoots.push(u + v + shift);
  } else if (Math.abs(D) <= 1e-9) {
    if (Math.abs(p) < 1e-9 && Math.abs(q) < 1e-9) {
      rawRoots.push(shift);
    } else {
      const u = Math.cbrt(-q / 2);
      rawRoots.push(2 * u + shift);
      rawRoots.push(-u + shift);
    }
  } else {
    // 3 real roots
    const r = 2 * Math.sqrt(-p / 3);
    const phi = Math.acos(Math.max(-1, Math.min(1, ((3 * q) / (2 * p)) * Math.sqrt(-3 / p)))) / 3;
    rawRoots.push(r * Math.cos(phi) + shift);
    rawRoots.push(r * Math.cos(phi + (2 * Math.PI) / 3) + shift);
    rawRoots.push(r * Math.cos(phi + (4 * Math.PI) / 3) + shift);
  }

  // Filter unique roots sorted ascending, rounded to 3 decimals
  const sorted = rawRoots.sort((x, y) => x - y);
  const unique: number[] = [];
  for (const r of sorted) {
    if (!unique.some((u) => Math.abs(u - r) < 1e-3)) {
      unique.push(Math.round(r * 1000) / 1000);
    }
  }
  return unique;
}

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
  const b = Number(params.b ?? 0);
  const c = Number(params.c ?? -3);
  const d = Number(params.d ?? 2);

  // Validate a !== 0
  if (Math.abs(a) < 1e-5) {
    ctx.fillStyle = '#fee2e2';
    ctx.fillRect(10, 10, width - 20, height - 20);
    ctx.strokeStyle = '#ef4444';
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Lỗi: Hệ số a phải khác 0 đối với hàm số bậc ba.', width / 2, height / 2);
    return;
  }

  const f = (x: number) => a * x * x * x + b * x * x + c * x + d;

  // 1. Calculate Extrema from y' = 3ax² + 2bx + c
  // Δ' = b² - 3ac
  const deltaPrime = b * b - 3 * a * c;
  let localMax: { x: number; y: number } | null = null;
  let localMin: { x: number; y: number } | null = null;

  if (deltaPrime > 1e-6) {
    const sqrtDelta = Math.sqrt(deltaPrime);
    const x1 = (-b - sqrtDelta) / (3 * a);
    const x2 = (-b + sqrtDelta) / (3 * a);
    const xLeft = Math.min(x1, x2);
    const xRight = Math.max(x1, x2);
    const yLeft = f(xLeft);
    const yRight = f(xRight);

    if (a > 0) {
      localMax = { x: xLeft, y: yLeft };
      localMin = { x: xRight, y: yRight };
    } else {
      localMin = { x: xLeft, y: yLeft };
      localMax = { x: xRight, y: yRight };
    }
  }

  // 2. Inflection point I(-b / (3a), f(-b / (3a)))
  const xInfl = -b / (3 * a);
  const yInfl = f(xInfl);

  // 3. Y-intercept: (0, d)
  const yIntercept = { x: 0, y: d };

  // 4. Roots: f(x) = 0
  const realRoots = solveCubicRoots(a, b, c, d);

  // 5. Compute adaptive bounding box with generous padding
  const keyX = [0, xInfl, yIntercept.x];
  const keyY = [0, yInfl, yIntercept.y];

  if (localMax) {
    keyX.push(localMax.x);
    keyY.push(localMax.y);
  }
  if (localMin) {
    keyX.push(localMin.x);
    keyY.push(localMin.y);
  }
  realRoots.forEach((r) => {
    keyX.push(r);
    keyY.push(0);
  });

  const minXVal = Math.min(...keyX);
  const maxXVal = Math.max(...keyX);
  const minYVal = Math.min(...keyY);
  const maxYVal = Math.max(...keyY);

  const spanX = Math.max(3.5, maxXVal - minXVal);
  const spanY = Math.max(3.5, maxYVal - minYVal);

  // Proper padding so labels, extreme points and intercept marks never get clipped
  const padRatioX = 0.38;
  const padRatioY = 0.32;
  const domainMinX = minXVal - spanX * padRatioX;
  const domainMaxX = maxXVal + spanX * padRatioX;
  const domainMinY = minYVal - spanY * padRatioY;
  const domainMaxY = maxYVal + spanY * padRatioY;

  // Viewport mapping with equal geometric aspect ratio (no distortion)
  const marginX = 40;
  const marginY = 32;
  const plotWidth = width - marginX * 2;
  const plotHeight = height - marginY * 2;

  const scaleX = plotWidth / (domainMaxX - domainMinX);
  const scaleY = plotHeight / (domainMaxY - domainMinY);
  const scale = Math.min(scaleX, scaleY);

  // Center axes based on domain center
  const centerDomainX = (domainMinX + domainMaxX) / 2;
  const centerDomainY = (domainMinY + domainMaxY) / 2;
  const ox = width / 2 - centerDomainX * scale;
  const oy = height / 2 + centerDomainY * scale;

  const toPxX = (x: number) => ox + x * scale;
  const toPxY = (y: number) => oy - y * scale;

  // 6. Draw Grid
  if (showGrid) {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const startTickX = Math.floor(domainMinX);
    const endTickX = Math.ceil(domainMaxX);
    for (let tx = startTickX; tx <= endTickX; tx++) {
      const px = toPxX(tx);
      if (px >= 0 && px <= width) {
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
      }
    }
    const startTickY = Math.floor(domainMinY);
    const endTickY = Math.ceil(domainMaxY);
    for (let ty = startTickY; ty <= endTickY; ty++) {
      const py = toPxY(ty);
      if (py >= 0 && py <= height) {
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }
    }
  }

  // 7. Draw Coordinate Axes
  if (showAxes) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;

    // Ox axis
    if (oy >= 0 && oy <= height) {
      ctx.beginPath();
      ctx.moveTo(0, oy);
      ctx.lineTo(width - 4, oy);
      ctx.stroke();

      // Ox Arrow
      ctx.beginPath();
      ctx.moveTo(width - 4, oy);
      ctx.lineTo(width - 12, oy - 4);
      ctx.lineTo(width - 12, oy + 4);
      ctx.closePath();
      ctx.fillStyle = '#64748b';
      ctx.fill();
    }

    // Oy axis
    if (ox >= 0 && ox <= width) {
      ctx.beginPath();
      ctx.moveTo(ox, height);
      ctx.lineTo(ox, 4);
      ctx.stroke();

      // Oy Arrow
      ctx.beginPath();
      ctx.moveTo(ox, 4);
      ctx.lineTo(ox - 4, 12);
      ctx.lineTo(ox + 4, 12);
      ctx.closePath();
      ctx.fillStyle = '#64748b';
      ctx.fill();
    }

    // Axis Labels & Origin
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 14, Math.min(height - 8, Math.max(16, oy - 7)));
    ctx.fillText('y', Math.min(width - 14, Math.max(16, ox + 8)), 16);
    ctx.fillText('O', Math.max(8, ox - 13), Math.min(height - 8, oy + 14));
  }

  // 8. Draw Cubic Curve
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  const stepPx = 1.5;
  let started = false;
  for (let px = 0; px <= width; px += stepPx) {
    const xVal = (px - ox) / scale;
    const yVal = f(xVal);
    const py = toPxY(yVal);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();

  // 9. Draw Projection Lines and Key Points
  if (showLabels) {
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;

    // Helper for key point dashed lines & label
    const drawDashedToAxes = (ptX: number, ptY: number) => {
      const px = toPxX(ptX);
      const py = toPxY(ptY);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, oy);
      ctx.moveTo(px, py);
      ctx.lineTo(ox, py);
      ctx.stroke();
    };

    // Projection for Local Max
    if (localMax && (Math.abs(localMax.x) > 0.05 || Math.abs(localMax.y) > 0.05)) {
      drawDashedToAxes(localMax.x, localMax.y);
    }
    // Projection for Local Min
    if (localMin && (Math.abs(localMin.x) > 0.05 || Math.abs(localMin.y) > 0.05)) {
      drawDashedToAxes(localMin.x, localMin.y);
    }
    ctx.setLineDash([]); // Reset to solid

    // Draw Points and Clear Academic Labels
    // Point: Cực đại
    if (localMax) {
      const px = toPxX(localMax.x);
      const py = toPxY(localMax.y);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(
        `CĐ(${localMax.x.toFixed(0)}; ${localMax.y.toFixed(0)})`,
        px - 28,
        py - 8
      );
    }

    // Point: Cực tiểu
    if (localMin) {
      const px = toPxX(localMin.x);
      const py = toPxY(localMin.y);
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(
        `CT(${localMin.x.toFixed(0)}; ${localMin.y.toFixed(0)})`,
        px + 6,
        py + 16
      );
    }

    // Point: Y-intercept (0, d)
    // IMPORTANT: Do NOT label as extremum!
    {
      const pyD = toPxY(d);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(ox, pyD, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(
        d.toFixed(0),
        ox + 6,
        pyD + (d > 0 ? 3 : 12)
      );
    }

    // Points: Real Roots on Ox (Giao điểm với trục hoành)
    realRoots.forEach((root) => {
      const pxR = toPxX(root);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(pxR, oy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(
        root.toFixed(0),
        pxR - 4,
        oy + 14
      );
    });

    // Mark integer ticks on axes for extrema coordinates if needed
    if (localMax) {
      const pxX = toPxX(localMax.x);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(localMax.x.toFixed(0), pxX - 4, oy + 13);
      const pyY = toPxY(localMax.y);
      ctx.fillText(localMax.y.toFixed(0), ox - 14, pyY + 4);
    }
    if (localMin && Math.abs(localMin.y) > 0.05) {
      const pyY = toPxY(localMin.y);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(localMin.y.toFixed(0), ox - 14, pyY + 4);
    }
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

  let cx = width / 2;
  let cy = height / 2;
  let scale = 36 * (camera.zoom || 1);

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

  // Auto-fit the complete drawing (axes, grid, intercepts, normal and labels)
  // into the actual canvas viewport. Never change the mathematical coordinates.
  const axisLen = 5.5;
  const fitPoints: Array<[number, number, number]> = [
    [0, 0, 0], [axisLen, 0, 0], [0, axisLen, 0], [0, 0, axisLen],
  ];
  if (showGrid) {
    for (const x of [-4, 4]) for (const y of [-4, 4]) fitPoints.push([x, y, 0]);
  }
  if (Math.abs(A) > 0.001) fitPoints.push([-D / A, 0, 0]);
  if (Math.abs(B) > 0.001) fitPoints.push([0, -D / B, 0]);
  if (Math.abs(C) > 0.001) fitPoints.push([0, 0, -D / C]);
  const normalLength = Math.hypot(A, B, C) || 1;
  fitPoints.push([2.5 * A / normalLength, 2.5 * B / normalLength, 2.5 * C / normalLength]);
  const projected = fitPoints.map(([x, y, z]) => project(x, y, z));
  const left = Math.min(...projected.map(p => p.px));
  const right = Math.max(...projected.map(p => p.px));
  const top = Math.min(...projected.map(p => p.py));
  const bottom = Math.max(...projected.map(p => p.py));
  // Extra room for axis arrows and long coordinate labels.
  const marginX = Math.min(70, width * 0.19);
  const marginY = Math.min(52, height * 0.16);
  const factor = Math.min(
    1,
    (width - 2 * marginX) / Math.max(1, right - left),
    (height - 2 * marginY) / Math.max(1, bottom - top)
  );
  scale *= Math.max(0.001, factor);
  cx = width / 2 - ((left + right) / 2 - width / 2) * factor;
  cy = height / 2 - ((top + bottom) / 2 - height / 2) * factor;

  const origin = project(0, 0, 0);
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
  const solidType = params.solidType || 'pyramid_quad';
  const a = Number(params.baseA ?? 3.5);
  const h = Number(params.heightH ?? 4);

  const cx = width / 2;
  const cy = height / 2 + 25;
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

  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (solidType === 'pyramid_tri') {
    // S.ABC (Tetrahedron)
    const pA = project(-a * 0.7, -a * 0.5, 0);
    const pB = project(a * 0.8, -a * 0.4, 0);
    const pC = project(0, a * 0.6, 0);
    const pS = project(0, 0, h);
    const pH = project(0, 0, 0);

    // Base ABC
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.beginPath();
    ctx.moveTo(pA.px, pA.py);
    ctx.lineTo(pB.px, pB.py);
    ctx.lineTo(pC.px, pC.py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lateral edges SA, SB, SC
    [pA, pB, pC].forEach((pt) => {
      ctx.beginPath();
      ctx.moveTo(pt.px, pt.py);
      ctx.lineTo(pS.px, pS.py);
      ctx.stroke();
    });

    if (showHiddenLines) {
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pH.px, pH.py);
      ctx.lineTo(pS.px, pS.py);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (showLabels) {
      const vertices = [
        { name: 'S', pt: pS, color: '#ef4444' },
        { name: 'A', pt: pA, color: '#4338ca' },
        { name: 'B', pt: pB, color: '#4338ca' },
        { name: 'C', pt: pC, color: '#4338ca' },
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
  } else if (solidType === 'prism_tri') {
    // ABC.A'B'C' (Triangular Prism)
    const pA = project(-a * 0.6, -a * 0.4, -h / 2);
    const pB = project(a * 0.7, -a * 0.3, -h / 2);
    const pC = project(0, a * 0.5, -h / 2);

    const pA1 = project(-a * 0.6, -a * 0.4, h / 2);
    const pB1 = project(a * 0.7, -a * 0.3, h / 2);
    const pC1 = project(0, a * 0.5, h / 2);

    // Top Base A'B'C'
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.beginPath();
    ctx.moveTo(pA1.px, pA1.py);
    ctx.lineTo(pB1.px, pB1.py);
    ctx.lineTo(pC1.px, pC1.py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom Base ABC
    ctx.beginPath();
    ctx.moveTo(pA.px, pA.py);
    ctx.lineTo(pB.px, pB.py);
    ctx.lineTo(pC.px, pC.py);
    ctx.closePath();
    ctx.stroke();

    // Side edges AA', BB', CC'
    [
      [pA, pA1],
      [pB, pB1],
      [pC, pC1],
    ].forEach(([from, to]) => {
      ctx.beginPath();
      ctx.moveTo(from.px, from.py);
      ctx.lineTo(to.px, to.py);
      ctx.stroke();
    });

    if (showLabels) {
      const vertices = [
        { name: "A'", pt: pA1 },
        { name: "B'", pt: pB1 },
        { name: "C'", pt: pC1 },
        { name: 'A', pt: pA },
        { name: 'B', pt: pB },
        { name: 'C', pt: pC },
      ];
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillStyle = '#4338ca';
      vertices.forEach((v) => {
        ctx.beginPath();
        ctx.arc(v.pt.px, v.pt.py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(v.name, v.pt.px + 5, v.pt.py - 4);
      });
    }
  } else if (solidType === 'box_cuboid') {
    // ABCD.A'B'C'D' (Rectangular Box)
    const w = a * 0.9;
    const d = a * 0.6;
    const pA = project(-w, -d, -h / 2);
    const pB = project(w, -d, -h / 2);
    const pC = project(w, d, -h / 2);
    const pD = project(-w, d, -h / 2);

    const pA1 = project(-w, -d, h / 2);
    const pB1 = project(w, -d, h / 2);
    const pC1 = project(w, d, h / 2);
    const pD1 = project(-w, d, h / 2);

    // Top face
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.beginPath();
    ctx.moveTo(pA1.px, pA1.py);
    ctx.lineTo(pB1.px, pB1.py);
    ctx.lineTo(pC1.px, pC1.py);
    ctx.lineTo(pD1.px, pD1.py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Visible edges
    [
      [pB, pC],
      [pC, pD],
      [pA, pB],
      [pB, pB1],
      [pC, pC1],
      [pD, pD1],
      [pA, pA1],
    ].forEach(([from, to]) => {
      ctx.beginPath();
      ctx.moveTo(from.px, from.py);
      ctx.lineTo(to.px, to.py);
      ctx.stroke();
    });

    if (showLabels) {
      const vertices = [
        { name: "A'", pt: pA1 },
        { name: "B'", pt: pB1 },
        { name: "C'", pt: pC1 },
        { name: "D'", pt: pD1 },
        { name: 'A', pt: pA },
        { name: 'B', pt: pB },
        { name: 'C', pt: pC },
        { name: 'D', pt: pD },
      ];
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillStyle = '#4338ca';
      vertices.forEach((v) => {
        ctx.beginPath();
        ctx.arc(v.pt.px, v.pt.py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(v.name, v.pt.px + 5, v.pt.py - 4);
      });
    }
  } else {
    // Default: Pyramid S.ABCD
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

// ---------------------------------------------------------------------------
// 13. RATIONAL FUNCTION y = (ax + b) / (cx + d)
// ---------------------------------------------------------------------------
function drawRationalFunction(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showGrid: boolean,
  showAxes: boolean,
  showLabels: boolean
) {
  const a = Number(params.a ?? 2);
  const b = Number(params.b ?? 1);
  const c = Number(params.c ?? 1);
  const d = Number(params.d ?? -1);
  const scale = Number(params.scale ?? 28);

  // Check valid rational function (c != 0 and ad - bc != 0)
  if (Math.abs(c) < 1e-4) {
    drawPlaceholder(ctx, 'Hàm số phân thức yêu cầu mẫu số có c ≠ 0', width, height);
    return;
  }
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-4) {
    drawPlaceholder(ctx, 'Hàm số suy biến do tử số và mẫu số có nghiệm chung (ad - bc = 0)', width, height);
    return;
  }

  const ox = width / 2;
  const oy = height / 2;

  // Asymptotes
  const xAsymptote = -d / c;
  const yAsymptote = a / c;

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
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width - 4, oy);
    ctx.moveTo(ox, height);
    ctx.lineTo(ox, 4);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 14, oy - 7);
    ctx.fillText('y', ox + 8, 16);
    ctx.fillText('O', ox - 14, oy + 14);
  }

  // Draw Asymptotes (Dashed lines)
  const pxAsymp = ox + xAsymptote * scale;
  const pyAsymp = oy - yAsymptote * scale;

  ctx.strokeStyle = '#dc2626'; // Red dashed asymptotes
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);

  // Vertical Asymptote x = -d/c
  if (pxAsymp >= 0 && pxAsymp <= width) {
    ctx.beginPath();
    ctx.moveTo(pxAsymp, 0);
    ctx.lineTo(pxAsymp, height);
    ctx.stroke();
  }

  // Horizontal Asymptote y = a/c
  if (pyAsymp >= 0 && pyAsymp <= height) {
    ctx.beginPath();
    ctx.moveTo(0, pyAsymp);
    ctx.lineTo(width, pyAsymp);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw Hyperbola Curves (Left branch & Right branch)
  const f = (x: number) => (a * x + b) / (c * x + d);

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.5;

  // Left branch (x < xAsymptote)
  ctx.beginPath();
  let startedLeft = false;
  for (let px = 0; px < pxAsymp - 3; px += 2) {
    const x = (px - ox) / scale;
    const y = f(x);
    const py = oy - y * scale;
    if (py >= -100 && py <= height + 100) {
      if (!startedLeft) {
        ctx.moveTo(px, py);
        startedLeft = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
  }
  ctx.stroke();

  // Right branch (x > xAsymptote)
  ctx.beginPath();
  let startedRight = false;
  for (let px = pxAsymp + 3; px <= width; px += 2) {
    const x = (px - ox) / scale;
    const y = f(x);
    const py = oy - y * scale;
    if (py >= -100 && py <= height + 100) {
      if (!startedRight) {
        ctx.moveTo(px, py);
        startedRight = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
  }
  ctx.stroke();

  // Center of Symmetry I(-d/c; a/c) & Intercepts
  if (showLabels) {
    // Center point I
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(pxAsymp, pyAsymp, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(`I(${xAsymptote.toFixed(1)}; ${yAsymptote.toFixed(1)})`, pxAsymp + 8, pyAsymp - 8);

    // X-intercept (-b/a; 0) if a != 0
    if (Math.abs(a) > 1e-4) {
      const x0 = -b / a;
      const px0 = ox + x0 * scale;
      if (px0 >= 0 && px0 <= width) {
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(px0, oy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`(${x0.toFixed(1)}; 0)`, px0 - 10, oy + 16);
      }
    }

    // Y-intercept (0; b/d) if d != 0
    if (Math.abs(d) > 1e-4) {
      const y0 = b / d;
      const py0 = oy - y0 * scale;
      if (py0 >= 0 && py0 <= height) {
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(ox, py0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`(0; ${y0.toFixed(1)})`, ox + 8, py0 + 4);
      }
    }

    // Label asymptotes
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(`x = ${xAsymptote.toFixed(1)}`, pxAsymp + 6, height - 12);
    ctx.fillText(`y = ${yAsymptote.toFixed(1)}`, width - 60, pyAsymp - 6);
  }
}

// ---------------------------------------------------------------------------
// 14. VARIATION TABLE (BẢNG BIẾN THIÊN)
// ---------------------------------------------------------------------------
function drawVariationTable(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showLabels: boolean
) {
  const preset = params.fnPreset || 'cubic';
  const tableMargin = 30;
  const tableW = width - tableMargin * 2;
  const tableH = Math.min(220, height - 60);
  const startX = tableMargin;
  const startY = (height - tableH) / 2;

  // Header column width
  const col1W = 60;
  const contentW = tableW - col1W;

  // Row heights: row x (35px), row y' (35px), row y (rest)
  const row1H = 36;
  const row2H = 36;
  const row3H = tableH - row1H - row2H;

  // Draw Table Outer Frame & Headers
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(startX, startY, col1W, tableH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(startX + col1W, startY, contentW, tableH);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(startX, startY, tableW, tableH);

  // Horizontal divider lines
  ctx.beginPath();
  ctx.moveTo(startX, startY + row1H);
  ctx.lineTo(startX + tableW, startY + row1H);
  ctx.moveTo(startX, startY + row1H + row2H);
  ctx.lineTo(startX + tableW, startY + row1H + row2H);
  ctx.stroke();

  // Vertical divider for header column
  ctx.beginPath();
  ctx.moveTo(startX + col1W, startY);
  ctx.lineTo(startX + col1W, startY + tableH);
  ctx.stroke();

  // Labels for header column (x, y', y)
  ctx.fillStyle = '#1e293b';
  ctx.font = 'italic bold 15px Times New Roman, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('x', startX + col1W / 2, startY + row1H / 2);
  ctx.fillText("y'", startX + col1W / 2, startY + row1H + row2H / 2);
  ctx.fillText('y', startX + col1W / 2, startY + row1H + row2H + row3H / 2);

  // Content Data based on preset
  let xPts = ['-∞', '-1', '1', '+∞'];
  let signs = ['+', '0', '-', '0', '+'];
  let yVals = ['-∞', '4', '0', '+∞'];

  if (preset === 'rational') {
    xPts = ['-∞', '1', '+∞'];
    signs = ['-', '||', '-'];
    yVals = ['2', '-∞', '+∞', '2'];
  } else if (preset === 'quadratic') {
    xPts = ['-∞', '1', '+∞'];
    signs = ['-', '0', '+'];
    yVals = ['+∞', '-3', '+∞'];
  } else if (preset === 'quartic') {
    xPts = ['-∞', '-1', '0', '1', '+∞'];
    signs = ['-', '0', '+', '0', '-', '0', '+'];
    yVals = ['+∞', '-2', '1', '-2', '+∞'];
  } else if (params.xValues) {
    xPts = String(params.xValues).split(',').map((s) => s.trim());
    signs = String(params.derivativeSigns || '+, 0, -, 0, +').split(',').map((s) => s.trim());
    yVals = String(params.yValues || '-∞, 4, 0, +∞').split(',').map((s) => s.trim());
  }

  // Draw X values along Row 1
  const numXPts = xPts.length;
  const xPositions: number[] = [];
  ctx.font = '13px JetBrains Mono, monospace';
  ctx.fillStyle = '#1e293b';

  for (let i = 0; i < numXPts; i++) {
    const px = startX + col1W + (contentW * (i + 0.5)) / numXPts;
    xPositions.push(px);
    ctx.fillText(xPts[i], px, startY + row1H / 2);

    // Draw vertical dotted guide lines from interior points through row y'
    if (i > 0 && i < numXPts - 1) {
      if (preset === 'rational' && xPts[i] === '1') {
        // Double line for discontinuity
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px - 2, startY + row1H);
        ctx.lineTo(px - 2, startY + tableH);
        ctx.moveTo(px + 2, startY + row1H);
        ctx.lineTo(px + 2, startY + tableH);
        ctx.stroke();
        ctx.strokeStyle = '#334155';
      } else {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(px, startY + row1H);
        ctx.lineTo(px, startY + row1H + row2H);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // Draw Y' Signs along Row 2
  const numSigns = signs.length;
  for (let i = 0; i < numSigns; i++) {
    const px = startX + col1W + (contentW * (i + 0.5)) / numSigns;
    const sign = signs[i];
    if (sign === '+') {
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('+', px, startY + row1H + row2H / 2);
    } else if (sign === '-') {
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('-', px, startY + row1H + row2H / 2);
    } else if (sign === '0') {
      ctx.fillStyle = '#475569';
      ctx.font = '13px monospace';
      ctx.fillText('0', px, startY + row1H + row2H / 2);
    } else if (sign === '||') {
      // Discontinuity already drawn
    }
  }

  // Draw Y Variation Arrows along Row 3
  const yRowTop = startY + row1H + row2H + 12;
  const yRowBottom = startY + tableH - 14;

  ctx.strokeStyle = '#1e293b';
  ctx.fillStyle = '#1e293b';
  ctx.lineWidth = 1.8;

  if (preset === 'cubic') {
    // Starts at -inf (bottom), rises to 4 (top), drops to 0 (bottom), rises to +inf (top)
    const p1 = { x: xPositions[0], y: yRowBottom };
    const p2 = { x: xPositions[1], y: yRowTop };
    const p3 = { x: xPositions[2], y: yRowBottom };
    const p4 = { x: xPositions[3], y: yRowTop };

    drawArrow(ctx, p1.x + 15, p1.y, p2.x - 15, p2.y);
    drawArrow(ctx, p2.x + 15, p2.y, p3.x - 15, p3.y);
    drawArrow(ctx, p3.x + 15, p3.y, p4.x - 15, p4.y);

    ctx.fillText('-∞', p1.x, p1.y + 4);
    ctx.fillText('4', p2.x, p2.y - 2);
    ctx.fillText('0', p3.x, p3.y + 4);
    ctx.fillText('+∞', p4.x, p4.y - 2);
  } else if (preset === 'rational') {
    // Branch 1: drops from 2 (mid) to -inf (bottom)
    const midY = (yRowTop + yRowBottom) / 2;
    drawArrow(ctx, xPositions[0] + 15, midY, xPositions[1] - 20, yRowBottom);
    ctx.fillText('2', xPositions[0] + 10, midY);
    ctx.fillText('-∞', xPositions[1] - 22, yRowBottom + 2);

    // Branch 2: drops from +inf (top) to 2 (mid)
    drawArrow(ctx, xPositions[1] + 20, yRowTop, xPositions[2] - 15, midY);
    ctx.fillText('+∞', xPositions[1] + 22, yRowTop - 2);
    ctx.fillText('2', xPositions[2] - 10, midY);
  } else {
    // Quadratic: drops from +inf to min, rises to +inf
    const p1 = { x: xPositions[0], y: yRowTop };
    const p2 = { x: xPositions[1], y: yRowBottom };
    const p3 = { x: xPositions[2], y: yRowTop };

    drawArrow(ctx, p1.x + 15, p1.y, p2.x - 15, p2.y);
    drawArrow(ctx, p2.x + 15, p2.y, p3.x - 15, p3.y);

    ctx.fillText('+∞', p1.x, p1.y - 2);
    ctx.fillText('-3', p2.x, p2.y + 4);
    ctx.fillText('+∞', p3.x, p3.y - 2);
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
  const headlen = 8;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------------------
// 15. PLANE GEOMETRY (TAM GIÁC, ĐƯỜNG TRÒN, TỨ GIÁC)
// ---------------------------------------------------------------------------
function drawPlaneGeometry(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showLabels: boolean
) {
  const shape = params.shape || 'triangle_incenter';
  const labelA = params.labelA || 'A';
  const labelB = params.labelB || 'B';
  const labelC = params.labelC || 'C';
  const labelD = params.labelD || 'D';

  const cx = width / 2;
  const cy = height / 2;

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (shape === 'triangle_incenter' || shape === 'triangle_circumcenter') {
    // Triangle Vertices
    const A = { x: cx, y: cy - 100 };
    const B = { x: cx - 130, y: cy + 70 };
    const C = { x: cx + 130, y: cy + 70 };

    // Fill triangle
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (shape === 'triangle_incenter') {
      // Incenter I and Incircle
      // Side lengths
      const a = Math.hypot(C.x - B.x, C.y - B.y);
      const b = Math.hypot(A.x - C.x, A.y - C.y);
      const c = Math.hypot(A.x - B.x, A.y - B.y);
      const p = a + b + c;
      const Ix = (a * A.x + b * B.x + c * C.x) / p;
      const Iy = (a * A.y + b * B.y + c * C.y) / p;
      const s = p / 2;
      const area = Math.sqrt(Math.max(1, s * (s - a) * (s - b) * (s - c)));
      const r = area / s;

      // Incircle
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(Ix, Iy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Bisectors (dashed)
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(Ix, Iy);
      ctx.moveTo(B.x, B.y);
      ctx.lineTo(Ix, Iy);
      ctx.moveTo(C.x, C.y);
      ctx.lineTo(Ix, Iy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Incenter point
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(Ix, Iy, 4, 0, Math.PI * 2);
      ctx.fill();

      if (showLabels) {
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.fillText('I', Ix + 8, Iy - 4);
      }
    } else {
      // Circumcircle & Circumcenter O
      const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
      const Ox =
        ((A.x * A.x + A.y * A.y) * (B.y - C.y) +
          (B.x * B.x + B.y * B.y) * (C.y - A.y) +
          (C.x * C.x + C.y * C.y) * (A.y - B.y)) /
        d;
      const Oy =
        ((A.x * A.x + A.y * A.y) * (C.x - B.x) +
          (B.x * B.x + B.y * B.y) * (A.x - C.x) +
          (C.x * C.x + C.y * C.y) * (B.x - A.x)) /
        d;
      const R = Math.hypot(A.x - Ox, A.y - Oy);

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(Ox, Oy, R, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(Ox, Oy, 4, 0, Math.PI * 2);
      ctx.fill();

      if (showLabels) {
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.fillText('O', Ox + 8, Oy - 4);
      }
    }

    if (showLabels) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px JetBrains Mono, monospace';
      ctx.fillText(labelA, A.x - 5, A.y - 12);
      ctx.fillText(labelB, B.x - 18, B.y + 14);
      ctx.fillText(labelC, C.x + 8, C.y + 14);
    }
  } else if (shape === 'circle_chord') {
    // Circle with chord AB and altitude OH
    const R = 95;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Chord AB
    const angleA = Math.PI * 0.75;
    const angleB = Math.PI * 0.25;
    const A = { x: cx + R * Math.cos(angleA), y: cy + R * Math.sin(angleA) };
    const B = { x: cx + R * Math.cos(angleB), y: cy + R * Math.sin(angleB) };
    const H = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();

    // Radii OA, OB & Altitude OH (dashed)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(A.x, A.y);
    ctx.moveTo(cx, cy);
    ctx.lineTo(B.x, B.y);
    ctx.moveTo(cx, cy);
    ctx.lineTo(H.x, H.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right angle marker at H
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(H.x - 6, H.y - 12, 12, 12);

    // Center point O
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.arc(H.x, H.y, 3, 0, Math.PI * 2);
    ctx.fill();

    if (showLabels) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText('O', cx - 14, cy - 8);
      ctx.fillText(labelA, A.x - 18, A.y + 16);
      ctx.fillText(labelB, B.x + 8, B.y + 16);
      ctx.fillText('H', H.x - 4, H.y + 18);
    }
  } else {
    // Trapezoid ABCD
    const A = { x: cx - 70, y: cy - 70 };
    const B = { x: cx + 70, y: cy - 70 };
    const C = { x: cx + 130, y: cy + 70 };
    const D = { x: cx - 130, y: cy + 70 };
    const H = { x: A.x, y: D.y };

    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.lineTo(D.x, D.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Altitude AH (dashed)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(H.x, H.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (showLabels) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(labelA, A.x - 12, A.y - 8);
      ctx.fillText(labelB, B.x + 6, B.y - 8);
      ctx.fillText(labelC, C.x + 8, C.y + 12);
      ctx.fillText(labelD, D.x - 18, D.y + 12);
      ctx.fillText('H', H.x - 14, H.y + 14);
    }
  }
}

// ---------------------------------------------------------------------------
// 16. ROUND SOLIDS (KHỐI TRÒN XOAY: NÓN, TRỤ, CẦU)
// ---------------------------------------------------------------------------
function drawRoundSolids(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showHiddenLines: boolean,
  showLabels: boolean
) {
  const solidType = params.solidType || 'cone';
  const cx = width / 2;
  const cy = height / 2;

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (solidType === 'cone') {
    // Cone: Apex S, Base Ellipse center O, Radius R, Height H
    const rX = 110;
    const rY = 32;
    const baseY = cy + 70;
    const apexS = { x: cx, y: cy - 90 };
    const O = { x: cx, y: baseY };
    const A = { x: cx - rX, y: baseY };
    const B = { x: cx + rX, y: baseY };

    // Fill body
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.beginPath();
    ctx.moveTo(apexS.x, apexS.y);
    ctx.lineTo(A.x, A.y);
    ctx.ellipse(cx, baseY, rX, rY, 0, Math.PI, 0, true);
    ctx.lineTo(apexS.x, apexS.y);
    ctx.fill();

    // Slant heights SA, SB
    ctx.beginPath();
    ctx.moveTo(apexS.x, apexS.y);
    ctx.lineTo(A.x, A.y);
    ctx.moveTo(apexS.x, apexS.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();

    // Base front half ellipse (Solid)
    ctx.beginPath();
    ctx.ellipse(cx, baseY, rX, rY, 0, 0, Math.PI, false);
    ctx.stroke();

    // Base back half ellipse (Dashed)
    if (showHiddenLines) {
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, baseY, rX, rY, 0, Math.PI, 0, false);
      ctx.stroke();

      // Altitude SO & Radius OA (Dashed)
      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(apexS.x, apexS.y);
      ctx.lineTo(O.x, O.y);
      ctx.stroke();

      ctx.strokeStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = '#1e293b';
    }

    // Points
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(apexS.x, apexS.y, 4, 0, Math.PI * 2);
    ctx.arc(O.x, O.y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (showLabels) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText('S', apexS.x - 4, apexS.y - 10);
      ctx.fillText('O', O.x - 4, O.y - 8);
      ctx.fillText('A', A.x - 16, A.y + 4);
      ctx.fillText('B', B.x + 8, B.y + 4);
      ctx.fillStyle = '#2563eb';
      ctx.fillText('R', (O.x + B.x) / 2, baseY - 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillText('h', cx + 6, cy);
    }
  } else if (solidType === 'cylinder') {
    // Cylinder: Top ellipse center O1, Bottom ellipse center O2
    const rX = 100;
    const rY = 28;
    const topY = cy - 65;
    const botY = cy + 65;
    const O1 = { x: cx, y: topY };
    const O2 = { x: cx, y: botY };

    // Fill
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.fillRect(cx - rX, topY, rX * 2, botY - topY);

    // Lateral generators AA', BB'
    ctx.beginPath();
    ctx.moveTo(cx - rX, topY);
    ctx.lineTo(cx - rX, botY);
    ctx.moveTo(cx + rX, topY);
    ctx.lineTo(cx + rX, botY);
    ctx.stroke();

    // Top ellipse (Fully solid)
    ctx.beginPath();
    ctx.ellipse(cx, topY, rX, rY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom ellipse: front solid, back dashed
    ctx.beginPath();
    ctx.ellipse(cx, botY, rX, rY, 0, 0, Math.PI, false);
    ctx.stroke();

    if (showHiddenLines) {
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, botY, rX, rY, 0, Math.PI, 0, false);
      ctx.stroke();

      // Axis O1O2
      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(O1.x, O1.y);
      ctx.lineTo(O2.x, O2.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#1e293b';
    }

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(O1.x, O1.y, 3.5, 0, Math.PI * 2);
    ctx.arc(O2.x, O2.y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (showLabels) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText("O'", O1.x - 4, O1.y - 8);
      ctx.fillText('O', O2.x - 4, O2.y + 16);
    }
  } else {
    // Sphere: Great circle, equator ellipse (front solid, back dashed)
    const R = 90;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Equator front solid
    ctx.beginPath();
    ctx.ellipse(cx, cy, R, 25, 0, 0, Math.PI, false);
    ctx.stroke();

    if (showHiddenLines) {
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, 25, 0, Math.PI, 0, false);
      ctx.stroke();

      // Radius line
      ctx.strokeStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#1e293b';
    }

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    if (showLabels) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText('O', cx - 14, cy - 6);
      ctx.fillStyle = '#2563eb';
      ctx.fillText('R', cx + R / 2 - 4, cy - 6);
    }
  }
}

// ---------------------------------------------------------------------------
// 17. CUSTOM COORDS (HÌNH THEO TỌA ĐỘ GIÁO VIÊN NHẬP)
// ---------------------------------------------------------------------------
function drawCustomCoords(
  ctx: CanvasRenderingContext2D,
  params: Record<string, any>,
  width: number,
  height: number,
  showGrid: boolean,
  showAxes: boolean,
  showLabels: boolean
) {
  const pointsStr = String(params.points || 'A(-3, -2), B(3, -2), C(2, 3), D(-2, 3)');
  const segmentsStr = String(params.segments || 'AB, BC, CD, DA, AC, BD');
  const dashedStr = String(params.dashedSegments || 'BD');
  const scale = Number(params.scale ?? 32);

  const ox = width / 2;
  const oy = height / 2;

  // Draw Grid & Axes
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
    ctx.lineTo(width - 4, oy);
    ctx.moveTo(ox, height);
    ctx.lineTo(ox, 4);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText('x', width - 14, oy - 7);
    ctx.fillText('y', ox + 8, 16);
    ctx.fillText('O', ox - 14, oy + 14);
  }

  // Parse points: e.g. "A(-3, -2), B(3, -2)"
  const ptRegex = /([A-Za-z0-9_']+)\s*\(\s*(-?[\d.]+)\s*[,;]\s*(-?[\d.]+)\s*\)/g;
  const pointMap = new Map<string, { x: number; y: number; px: number; py: number }>();
  let match: RegExpExecArray | null;

  while ((match = ptRegex.exec(pointsStr)) !== null) {
    const name = match[1];
    const xVal = parseFloat(match[2]);
    const yVal = parseFloat(match[3]);
    const px = ox + xVal * scale;
    const py = oy - yVal * scale;
    pointMap.set(name, { x: xVal, y: yVal, px, py });
  }

  // Parse dashed list
  const dashedSet = new Set(
    dashedStr
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );

  // Draw segments: e.g. "AB, BC, CD"
  const segList = segmentsStr
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  segList.forEach((seg) => {
    // Seg name can be "AB" or "A-B"
    const cleaned = seg.replace('-', '');
    let pt1Name = '';
    let pt2Name = '';
    if (cleaned.length === 2) {
      pt1Name = cleaned[0];
      pt2Name = cleaned[1];
    } else {
      // Find names matching keys in pointMap
      for (const k1 of pointMap.keys()) {
        if (cleaned.startsWith(k1)) {
          const rem = cleaned.slice(k1.length);
          if (pointMap.has(rem)) {
            pt1Name = k1;
            pt2Name = rem;
            break;
          }
        }
      }
    }

    const p1 = pointMap.get(pt1Name);
    const p2 = pointMap.get(pt2Name);
    if (p1 && p2) {
      const isDashed = dashedSet.has(seg) || dashedSet.has(pt1Name + pt2Name) || dashedSet.has(pt2Name + pt1Name);
      ctx.strokeStyle = isDashed ? '#ef4444' : '#2563eb';
      ctx.lineWidth = isDashed ? 1.8 : 2.2;
      if (isDashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Draw points & labels
  pointMap.forEach((pt, name) => {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(pt.px, pt.py, 4.5, 0, Math.PI * 2);
    ctx.fill();

    if (showLabels) {
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(`${name}(${pt.x}; ${pt.y})`, pt.px + 8, pt.py - 6);
    }
  });
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
    const b = Number(config.params.b ?? 0);
    const c = Number(config.params.c ?? -3);
    const d = Number(config.params.d ?? 2);

    if (Math.abs(a) < 1e-5) {
      content = `<text x="${width / 2}" y="${height / 2}" font-family="sans-serif" font-size="12" fill="#ef4444" text-anchor="middle">Lỗi: Hệ số a phải khác 0 đối với hàm số bậc ba.</text>`;
    } else {
      const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
      const deltaPrime = b * b - 3 * a * c;
      let localMax: { x: number; y: number } | null = null;
      let localMin: { x: number; y: number } | null = null;

      if (deltaPrime > 1e-6) {
        const sqrtDelta = Math.sqrt(deltaPrime);
        const x1 = (-b - sqrtDelta) / (3 * a);
        const x2 = (-b + sqrtDelta) / (3 * a);
        const xLeft = Math.min(x1, x2);
        const xRight = Math.max(x1, x2);
        if (a > 0) {
          localMax = { x: xLeft, y: f(xLeft) };
          localMin = { x: xRight, y: f(xRight) };
        } else {
          localMin = { x: xLeft, y: f(xLeft) };
          localMax = { x: xRight, y: f(xRight) };
        }
      }

      const xInfl = -b / (3 * a);
      const yInfl = f(xInfl);
      const realRoots = solveCubicRoots(a, b, c, d);

      const keyX = [0, xInfl, 0];
      const keyY = [0, yInfl, d];
      if (localMax) { keyX.push(localMax.x); keyY.push(localMax.y); }
      if (localMin) { keyX.push(localMin.x); keyY.push(localMin.y); }
      realRoots.forEach((r) => { keyX.push(r); keyY.push(0); });

      const minXVal = Math.min(...keyX);
      const maxXVal = Math.max(...keyX);
      const minYVal = Math.min(...keyY);
      const maxYVal = Math.max(...keyY);
      const spanX = Math.max(3.5, maxXVal - minXVal);
      const spanY = Math.max(3.5, maxYVal - minYVal);

      const domainMinX = minXVal - spanX * 0.38;
      const domainMaxX = maxXVal + spanX * 0.38;
      const domainMinY = minYVal - spanY * 0.32;
      const domainMaxY = maxYVal + spanY * 0.32;

      const marginX = 40;
      const marginY = 32;
      const plotWidth = width - marginX * 2;
      const plotHeight = height - marginY * 2;
      const scale = Math.min(plotWidth / (domainMaxX - domainMinX), plotHeight / (domainMaxY - domainMinY));

      const centerDomainX = (domainMinX + domainMaxX) / 2;
      const centerDomainY = (domainMinY + domainMaxY) / 2;
      const ox = width / 2 - centerDomainX * scale;
      const oy = height / 2 + centerDomainY * scale;

      const toPxX = (x: number) => ox + x * scale;
      const toPxY = (y: number) => oy - y * scale;

      let pathD = '';
      for (let px = 0; px <= width; px += 2) {
        const xVal = (px - ox) / scale;
        const py = toPxY(f(xVal));
        pathD += (pathD === '' ? 'M ' : ' L ') + `${px.toFixed(1)} ${py.toFixed(1)}`;
      }

      let pointsSvg = '';
      if (localMax) {
        const px = toPxX(localMax.x);
        const py = toPxY(localMax.y);
        pointsSvg += `
          <line x1="${px}" y1="${py}" x2="${px}" y2="${oy}" stroke="#94a3b8" stroke-dasharray="3,3" />
          <line x1="${px}" y1="${py}" x2="${ox}" y2="${py}" stroke="#94a3b8" stroke-dasharray="3,3" />
          <circle cx="${px}" cy="${py}" r="4" fill="#ef4444" />
          <text x="${px - 28}" y="${py - 8}" font-family="monospace" font-size="11" font-weight="bold" fill="#b91c1c">CĐ(${localMax.x.toFixed(0)}; ${localMax.y.toFixed(0)})</text>
        `;
      }
      if (localMin) {
        const px = toPxX(localMin.x);
        const py = toPxY(localMin.y);
        pointsSvg += `
          <line x1="${px}" y1="${py}" x2="${px}" y2="${oy}" stroke="#94a3b8" stroke-dasharray="3,3" />
          <line x1="${px}" y1="${py}" x2="${ox}" y2="${py}" stroke="#94a3b8" stroke-dasharray="3,3" />
          <circle cx="${px}" cy="${py}" r="4" fill="#059669" />
          <text x="${px + 6}" y="${py + 16}" font-family="monospace" font-size="11" font-weight="bold" fill="#047857">CT(${localMin.x.toFixed(0)}; ${localMin.y.toFixed(0)})</text>
        `;
      }
      // Intercept (0, d)
      pointsSvg += `
        <circle cx="${ox}" cy="${toPxY(d)}" r="3.5" fill="#475569" />
        <text x="${ox + 6}" y="${toPxY(d) + (d > 0 ? 3 : 12)}" font-family="monospace" font-size="11" font-weight="bold" fill="#475569">${d.toFixed(0)}</text>
      `;
      // Roots
      realRoots.forEach((root) => {
        const px = toPxX(root);
        pointsSvg += `
          <circle cx="${px}" cy="${oy}" r="3" fill="#1e293b" />
          <text x="${px - 4}" y="${oy + 14}" font-family="monospace" font-size="11" font-weight="bold" fill="#1e293b">${root.toFixed(0)}</text>
        `;
      });

      content = `
        <!-- Axes -->
        <line x1="0" y1="${oy}" x2="${width - 4}" y2="${oy}" stroke="#64748b" stroke-width="1.5" />
        <line x1="${ox}" y1="${height}" x2="${ox}" y2="4" stroke="#64748b" stroke-width="1.5" />
        <text x="${width - 14}" y="${oy - 7}" font-family="monospace" font-size="11" font-weight="bold" fill="#475569">x</text>
        <text x="${ox + 8}" y="16" font-family="monospace" font-size="11" font-weight="bold" fill="#475569">y</text>
        <text x="${ox - 13}" y="${oy + 14}" font-family="monospace" font-size="11" font-weight="bold" fill="#475569">O</text>
        <!-- Curve -->
        <path d="${pathD}" fill="none" stroke="#3b82f6" stroke-width="2.5" />
        ${pointsSvg}
      `;
    }
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
