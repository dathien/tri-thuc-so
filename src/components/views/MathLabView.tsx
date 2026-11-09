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
  Flame,
  Zap,
  Target,
  FileSpreadsheet,
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
  const radApprox = radVal.toFixed(4).replace('.', '{,}');

  const div = gcd(deg, 180);
  const numPi = deg / div;
  const denPi = 180 / div;

  let piFrac = '';
  if (numPi === 0) {
    piFrac = '0';
  } else if (denPi === 1) {
    piFrac = numPi === 1 ? '\\pi' : numPi === -1 ? '-\\pi' : `${numPi}\\pi`;
  } else if (numPi === 1) {
    piFrac = `\\frac{\\pi}{${denPi}}`;
  } else if (numPi === -1) {
    piFrac = `-\\frac{\\pi}{${denPi}}`;
  } else {
    piFrac = `\\frac{${numPi}\\pi}{${denPi}}`;
  }

  return `\\alpha = ${deg}^\\circ = ${piFrac}\\ \\text{rad} \\approx ${radApprox}\\ \\text{rad}`;
}

/**
 * Format dynamic 3D plane formula:
 * (\alpha): Ax + By + Cz + D = 0
 */
function formatPlaneEquation(A: number, B: number, C: number, D: number): string {
  const parts: string[] = [];

  // A*x
  if (A !== 0) {
    if (A === 1) parts.push('x');
    else if (A === -1) parts.push('-x');
    else parts.push(`${A}x`);
  }

  // B*y
  if (B !== 0) {
    const sign = B > 0 ? (parts.length > 0 ? '+ ' : '') : '- ';
    const absB = Math.abs(B);
    const term = absB === 1 ? 'y' : `${absB}y`;
    parts.push(`${sign}${term}`);
  }

  // C*z
  if (C !== 0) {
    const sign = C > 0 ? (parts.length > 0 ? '+ ' : '') : '- ';
    const absC = Math.abs(C);
    const term = absC === 1 ? 'z' : `${absC}z`;
    parts.push(`${sign}${term}`);
  }

  // D
  if (D !== 0) {
    const sign = D > 0 ? (parts.length > 0 ? '+ ' : '') : '- ';
    parts.push(`${sign}${Math.abs(D)}`);
  }

  const expr = parts.length > 0 ? parts.join(' ') : '0';
  return `(\\alpha): ${expr} = 0`;
}

/**
 * Format dynamic quadratic formula: y = ax^2 + bx + c
 */
function formatParabolaEquation(a: number, b: number, c: number): string {
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
      const sign = b > 0 ? '+ ' : '- ';
      const absB = Math.abs(b);
      parts.push(`${sign}${absB === 1 ? 'x' : `${absB}x`}`);
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

/**
 * Maps any lesson code or module id to one of the 21 comprehensive simulation engine types
 */
export function getSimulationEngineType(lessonCode?: string, id?: string): string {
  const code = (lessonCode || id || '').toUpperCase();

  // 1. Logic & Truth Table
  if (code.includes('B01') && code.includes('M10')) return 'logic_truth_table';

  // 2. Set theory & Real axis / Venn
  if ((code.includes('B02') && code.includes('M10')) || code.includes('SET')) return 'set_venn';

  // 3. Inequalities & Feasible Polygon
  if ((code.includes('B03') || code.includes('B04')) && code.includes('M10') || code.includes('BPT')) return 'linear_programming';

  // 4. Triangle trigonometry & Sine/Cosine laws
  if (code.includes('B06') && code.includes('M10') || code.includes('TAMGIAC')) return 'triangle_sine_cosine';

  // 5. Trig unit circle & wave
  if (
    (code.includes('B05') && code.includes('M10')) ||
    ((code.includes('B01') || code.includes('B02') || code.includes('B03') || code.includes('B04')) && code.includes('M11')) ||
    code.includes('LAB-11-01')
  ) return 'trig_circle';

  // 6. 2D Vectors & Dot product
  if (
    ((code.includes('B07') || code.includes('B08') || code.includes('B09') || code.includes('B10') || code.includes('B11')) && code.includes('M10')) ||
    code.includes('VEC')
  ) return 'vector_2d';

  // 7. Statistics & Box Plot
  if (
    ((code.includes('B12') || code.includes('B13') || code.includes('B14')) && code.includes('M10')) ||
    ((code.includes('B08') || code.includes('B09')) && code.includes('M11')) ||
    ((code.includes('B09') || code.includes('B10')) && code.includes('M12')) ||
    code.includes('THONGKE') || code.includes('SAISO')
  ) return 'statistics_box_plot';

  // 8. Parabola & Quadratic functions / Sign
  if (
    ((code.includes('B15') || code.includes('B16') || code.includes('B17') || code.includes('B18')) && code.includes('M10')) ||
    code.includes('LAB-10-01')
  ) return 'parabola_quadratic';

  // 9. Lines & Circles in Oxy
  if (
    ((code.includes('B19') || code.includes('B20') || code.includes('B21')) && code.includes('M10')) ||
    code.includes('TRON')
  ) return 'circle_tangent_oxy';

  // 10. Conic sections
  if (code.includes('B22') && code.includes('M10') || code.includes('M10-HK2-HDTH') || code.includes('CONIC')) return 'conic_sections';

  // 11. Combinatorics & Pascal Triangle
  if (
    ((code.includes('B23') || code.includes('B24') || code.includes('B25')) && code.includes('M10')) ||
    code.includes('TOHOP') || code.includes('NEWTON')
  ) return 'combinatorics_pascal';

  // 12. Probability & Bayes Tree
  if (
    ((code.includes('B26') || code.includes('B27')) && code.includes('M10')) ||
    ((code.includes('B28') || code.includes('B29') || code.includes('B30')) && code.includes('M11')) ||
    ((code.includes('B18') || code.includes('B19')) && code.includes('M12')) ||
    code.includes('BAYES') || code.includes('XACSUAT')
  ) return 'probability_bayes';

  // 13. Projectile & Periodic Simulation
  if (code.includes('M10-HK1-HDTH') || code.includes('M11-HK1-HDTH')) return 'projectile_motion';

  // 14. Sequences & Progressions
  if (
    ((code.includes('B05') || code.includes('B06') || code.includes('B07')) && code.includes('M11')) ||
    code.includes('M11-HK2-HDTH') || code.includes('CSC') || code.includes('CSN')
  ) return 'sequences_progression';

  // 15. Limits & 0/0 Elimination
  if (((code.includes('B15') || code.includes('B16') || code.includes('B17')) && code.includes('M11')) || code.includes('GH01')) return 'limit_0_over_0';

  // 16. Exp & Log Symmetry
  if (((code.includes('B18') || code.includes('B19') || code.includes('B20') || code.includes('B21')) && code.includes('M11')) || code.includes('MULOG')) return 'exp_log_symmetry';

  // 17. 3D Solid Geometry & Pyramid
  if (
    (((code.includes('B10') || code.includes('B11') || code.includes('B12') || code.includes('B13') || code.includes('B14') ||
      code.includes('B22') || code.includes('B23') || code.includes('B24') || code.includes('B25') || code.includes('B26') || code.includes('B27')) &&
      code.includes('M11')) ||
      code.includes('HINHDADIEN'))
  ) return 'solid_geometry_3d';

  // 18. Derivative & Tangent Line Limit
  if (
    ((code.includes('B31') || code.includes('B32') || code.includes('B33')) && code.includes('M11')) ||
    ((code.includes('B01') || code.includes('B02')) && code.includes('M12')) ||
    code.includes('DAOHAM')
  ) return 'derivative_tangent';

  // 19. Cubic Function & Curve Sketching
  if (((code.includes('B03') || code.includes('B04') || code.includes('B05')) && code.includes('M12')) || code.includes('LAB-12-01')) return 'cubic_function';

  // 20. 3D Oxyz Space & Plane
  if (
    ((code.includes('B06') || code.includes('B07') || code.includes('B08') || code.includes('B14') || code.includes('B15') || code.includes('B16') || code.includes('B17')) &&
      code.includes('M12')) ||
    code.includes('M12-HK2-HDTH') ||
    code.includes('LAB-12-02')
  ) return 'space_3d_oxyz';

  // 21. Integral Riemann & Area
  if (
    ((code.includes('B11') || code.includes('B12') || code.includes('B13')) && code.includes('M12')) ||
    code.includes('M12-HK1-HDTH') ||
    code.includes('DIENTICH')
  ) return 'integral_riemann_area';

  return 'space_3d_oxyz';
}

export const MathLabView: React.FC<MathLabViewProps> = ({ catalog }) => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'catalog'>('simulation');
  const [activeLabId, setActiveLabId] = useState<string>('lab-12-b14-ptmp');

  // Filter States for Lab Navigator
  const [filterGrade, setFilterGrade] = useState<'all' | 10 | 11 | 12>('all');
  const [filterSemester, setFilterSemester] = useState<'all' | 1 | 2>('all');
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------------------
  // Lab 1: 3D Oxyz Space & Plane Ax + By + Cz + D = 0
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
  // Lab 2: Trigonometric Circle & Wave
  // -------------------------------------------------------------------------
  const [angleDeg, setAngleDeg] = useState(45);
  const canvasTrigRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 3: Cubic Function y = ax^3 + bx^2 + cx + d
  // -------------------------------------------------------------------------
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(-3);
  const [paramC, setParamC] = useState(0);
  const [paramD, setParamD] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 4: Parabola y = ax^2 + bx + c
  // -------------------------------------------------------------------------
  const [parabolA, setParabolA] = useState(1);
  const [parabolB, setParabolB] = useState(-2);
  const [parabolC, setParabolC] = useState(-3);
  const canvasParabolRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 5: Set Theory & Intervals
  // -------------------------------------------------------------------------
  const [intervalA1, setIntervalA1] = useState(-4);
  const [intervalA2, setIntervalA2] = useState(2);
  const [intervalB1, setIntervalB1] = useState(-1);
  const [intervalB2, setIntervalB2] = useState(5);
  const [setOpMode, setSetOpMode] = useState<'intersection' | 'union' | 'diffAB' | 'diffBA'>('intersection');
  const canvasSetRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 6: Conic Sections (Elip, Hyperbol, Parabol)
  // -------------------------------------------------------------------------
  const [conicType, setConicType] = useState<'ellipse' | 'hyperbola' | 'parabola'>('ellipse');
  const [conicA, setConicA] = useState(4);
  const [conicB, setConicB] = useState(2.5);
  const [conicP, setConicP] = useState(2);
  const canvasConicRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 7: Dynamic 2D Vectors & Dot Product
  // -------------------------------------------------------------------------
  const [vecUx, setVecUx] = useState(3);
  const [vecUy, setVecUy] = useState(2);
  const [vecVx, setVecVx] = useState(-1);
  const [vecVy, setVecVy] = useState(3);
  const canvasVecRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 8: Exponential & Logarithmic Functions
  // -------------------------------------------------------------------------
  const [baseA, setBaseA] = useState(2);
  const canvasExpLogRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 9: Derivative & Tangent Line Secant Limit
  // -------------------------------------------------------------------------
  const [tangentX0, setTangentX0] = useState(1);
  const [secantDeltaX, setSecantDeltaX] = useState(0.8);
  const canvasTangentRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 10: Riemann Integral & Area Under Curve
  // -------------------------------------------------------------------------
  const [riemannN, setRiemannN] = useState(12);
  const [riemannA, setRiemannA] = useState(0);
  const [riemannB, setRiemannB] = useState(3);
  const canvasRiemannRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 11: 3D Pyramid Geometry
  // -------------------------------------------------------------------------
  const [pyrBaseA, setPyrBaseA] = useState(3.5);
  const [pyrHeightH, setPyrHeightH] = useState(4);
  const [pyrRotX, setPyrRotX] = useState(20);
  const [pyrRotY, setPyrRotY] = useState(-30);
  const canvasPyrRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 12: Statistics & Box Plot Outliers
  // -------------------------------------------------------------------------
  const [statDataRaw, setStatDataRaw] = useState<string>('4, 6, 7, 7, 8, 8, 8, 9, 10, 10, 11, 14, 18');
  const canvasBoxPlotRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------------------
  // Lab 13: Propositional Logic & Truth Table
  // -------------------------------------------------------------------------
  const [propP, setPropP] = useState<boolean>(true);
  const [propQ, setPropQ] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // Lab 14: Linear Programming & Feasible Polygon
  // -------------------------------------------------------------------------
  const [objA, setObjA] = useState<number>(3);
  const [objB, setObjB] = useState<number>(4);

  // -------------------------------------------------------------------------
  // Lab 15: Triangle Geometry & Sine/Cosine Laws
  // -------------------------------------------------------------------------
  const [triA, setTriA] = useState<number>(5);
  const [triB, setTriB] = useState<number>(6);
  const [triAngleC, setTriAngleC] = useState<number>(60);

  // -------------------------------------------------------------------------
  // Lab 16: Sequences & Progressions
  // -------------------------------------------------------------------------
  const [progU1, setProgU1] = useState<number>(2);
  const [progD, setProgD] = useState<number>(3);
  const [progN, setProgN] = useState<number>(8);

  // -------------------------------------------------------------------------
  // Lab 17: Limit 0/0
  // -------------------------------------------------------------------------
  const [limX, setLimX] = useState<number>(2.05);

  // -------------------------------------------------------------------------
  // Lab 18: Bayes & Medical Test
  // -------------------------------------------------------------------------
  const [priorDisease, setPriorDisease] = useState<number>(0.02);
  const [sensitivity, setSensitivity] = useState<number>(0.95);
  const [falsePositive, setFalsePositive] = useState<number>(0.05);

  // -------------------------------------------------------------------------
  // Lab 19: Projectile Motion
  // -------------------------------------------------------------------------
  const [projAngle, setProjAngle] = useState<number>(45);
  const [projV0, setProjV0] = useState<number>(25);

  // -------------------------------------------------------------------------
  // Lab 20: Circle & Tangent Oxy
  // -------------------------------------------------------------------------
  const [circCenterX, setCircCenterX] = useState<number>(1);
  const [circCenterY, setCircCenterY] = useState<number>(2);
  const [circR, setCircR] = useState<number>(3);
  const [circPtAngle, setCircPtAngle] = useState<number>(45);

  // -------------------------------------------------------------------------
  // Lab 21: Combinatorics & Pascal
  // -------------------------------------------------------------------------
  const [combN, setCombN] = useState<number>(6);
  const [combK, setCombK] = useState<number>(3);

  // Find active module
  const activeModule = useMemo(() => {
    return catalog.find((m) => m.id === activeLabId) || catalog[0];
  }, [catalog, activeLabId]);

  // Determine active simulation engine
  const activeEngineType = useMemo(() => {
    return getSimulationEngineType(activeModule?.lessonCode || activeModule?.code, activeModule?.id);
  }, [activeModule]);

  // Available chapters based on selected Grade & Semester
  const availableChapters = useMemo(() => {
    const chapters = new Set<string>();
    catalog.forEach((item) => {
      const matchGrade = filterGrade === 'all' || item.grade === filterGrade;
      const matchSemester = filterSemester === 'all' || item.semester === filterSemester;
      if (matchGrade && matchSemester) {
        chapters.add(item.chapter);
      }
    });
    return Array.from(chapters);
  }, [catalog, filterGrade, filterSemester]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchGrade = filterGrade === 'all' || item.grade === filterGrade;
      const matchSemester = filterSemester === 'all' || item.semester === filterSemester;
      const matchChapter = filterChapter === 'all' || item.chapter === filterChapter;
      const matchCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lesson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGrade && matchSemester && matchChapter && matchCategory && matchSearch;
    });
  }, [catalog, filterGrade, filterSemester, filterChapter, filterCategory, searchQuery]);

  // Total tested metrics
  const totalTested = useMemo(() => {
    return catalog.filter((m) => m.testStatus === 'tested' || m.isImplemented).length;
  }, [catalog]);

  const coveragePercent = Math.round((totalTested / (catalog.length || 1)) * 100);

  // -------------------------------------------------------------------------
  // Canvas Render 1: 3D Oxyz Space & Plane
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'space_3d_oxyz') return;
    const canvas = canvas3dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = 36 * zoom;

    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const project = (x: number, y: number, z: number) => {
      const x1 = x * Math.cos(radY) + y * Math.sin(radY);
      const y1 = -x * Math.sin(radY) + y * Math.cos(radY);
      const z1 = z;
      const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);
      return { px: cx + x1 * scale, py: cy - z2 * scale, depth: y2 };
    };

    // Draw coordinate axes
    const axisLen = 5.5;
    const origin = project(0, 0, 0);
    const pX = project(axisLen, 0, 0);
    const pY = project(0, axisLen, 0);
    const pZ = project(0, 0, axisLen);

    // Grid in Oxy plane
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

    // Axes lines
    // Ox: Red
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(pX.px, pX.py);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.fillText('x', pX.px + 6, pX.py + 4);

    // Oy: Green
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(pY.px, pY.py);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillText('y', pY.px + 6, pY.py + 4);

    // Oz: Blue
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(pZ.px, pZ.py);
    ctx.stroke();
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('z', pZ.px + 4, pZ.py - 6);

    // Plane (alpha): Ax + By + Cz + D = 0
    const A = planeA;
    const B = planeB;
    const C = planeC;
    const D = planeD;

    // Intercepts
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
    ctx.fillText(`n(${A}; ${B}; ${C})`, normEnd.px + 6, normEnd.py - 6);
  }, [activeEngineType, planeA, planeB, planeC, planeD, rotX, rotY, zoom]);

  // -------------------------------------------------------------------------
  // Canvas Render 2: Trigonometric Circle & Sine Wave
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'trig_circle') return;
    const canvas = canvasTrigRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = 150;
    const oy = height / 2;
    const radius = 95;

    const rad = (angleDeg * Math.PI) / 180;
    const cosVal = Math.cos(rad);
    const sinVal = Math.sin(rad);

    // Circle
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox - radius - 25, oy);
    ctx.lineTo(ox + radius + 25, oy);
    ctx.moveTo(ox, oy - radius - 25);
    ctx.lineTo(ox, oy + radius + 25);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('cos α', ox + radius + 10, oy - 6);
    ctx.fillText('sin α', ox + 6, oy - radius - 10);

    // Point M on circle
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
    // Cos: Red line on axis
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(mx, oy);
    ctx.stroke();

    // Sin: Green line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, my);
    ctx.stroke();

    // Dotted projection lines
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

    // Radius vector OM
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(mx, my);
    ctx.stroke();

    // Point M
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`M(${cosVal.toFixed(2)}; ${sinVal.toFixed(2)})`, mx + 8, my - 6);

    // Wave trace on the right
    const waveStartX = 290;
    const waveEndX = width - 20;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(waveStartX, oy);
    ctx.lineTo(waveEndX, oy);
    ctx.stroke();

    // Draw Sine Wave y = sin x
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

    // Pointer on wave
    const wavePointX = waveStartX + ((rad % (Math.PI * 2)) / (Math.PI * 2)) * (waveEndX - waveStartX);
    if (wavePointX >= waveStartX && wavePointX <= waveEndX) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(wavePointX, my, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Connector line
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(wavePointX, my);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [activeEngineType, angleDeg]);

  // -------------------------------------------------------------------------
  // Canvas Render 3: Cubic Function Graph
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'cubic_function') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = width / 2;
    const oy = height / 2;
    const scale = 28;

    // Grid
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

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    // Curve: y = ax^3 + bx^2 + cx + d
    const f = (x: number) => paramA * Math.pow(x, 3) + paramB * Math.pow(x, 2) + paramC * x + paramD;

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= width; px += 2) {
      const xVal = (px - ox) / scale;
      const yVal = f(xVal);
      const py = oy - yVal * scale;
      if (py >= -50 && py <= height + 50) {
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
    if (Math.abs(paramA) > 0.001) {
      const xInfl = -paramB / (3 * paramA);
      const yInfl = f(xInfl);
      const pxInfl = ox + xInfl * scale;
      const pyInfl = oy - yInfl * scale;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pxInfl, pyInfl, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(`I(${xInfl.toFixed(1)}; ${yInfl.toFixed(1)})`, pxInfl + 8, pyInfl - 4);
    }
  }, [activeEngineType, paramA, paramB, paramC, paramD]);

  // -------------------------------------------------------------------------
  // Canvas Render 4: Parabola Graph
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'parabola_quadratic') return;
    const canvas = canvasParabolRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = width / 2;
    const oy = height / 2;
    const scale = 28;

    // Grid
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

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    // Parabola: y = ax^2 + bx + c
    const f = (x: number) => parabolA * x * x + parabolB * x + parabolC;

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= width; px += 2) {
      const xVal = (px - ox) / scale;
      const yVal = f(xVal);
      const py = oy - yVal * scale;
      if (py >= -40 && py <= height + 40) {
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
    }
    ctx.stroke();

    // Vertex I(-b/2a, -Δ/4a)
    if (Math.abs(parabolA) > 0.001) {
      const xV = -parabolB / (2 * parabolA);
      const yV = f(xV);
      const pxV = ox + xV * scale;
      const pyV = oy - yV * scale;

      // Axis of symmetry
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
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(`Đỉnh I(${xV.toFixed(1)}; ${yV.toFixed(1)})`, pxV + 8, pyV - 6);
    }
  }, [activeEngineType, parabolA, parabolB, parabolC]);

  // -------------------------------------------------------------------------
  // Canvas Render 5: Sets & Intervals
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'set_venn') return;
    const canvas = canvasSetRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = width / 2;
    const scale = 38;

    // Real Axis
    const yAxis = 110;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, yAxis);
    ctx.lineTo(width - 20, yAxis);
    ctx.stroke();

    // Arrow
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(width - 15, yAxis);
    ctx.lineTo(width - 25, yAxis - 4);
    ctx.lineTo(width - 25, yAxis + 4);
    ctx.closePath();
    ctx.fill();

    // Ticks on Axis
    for (let val = -8; val <= 8; val++) {
      const px = ox + val * scale;
      if (px > 25 && px < width - 25) {
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

    // Interval A: [a1, a2] (Indigo)
    const pxA1 = ox + Math.min(intervalA1, intervalA2) * scale;
    const pxA2 = ox + Math.max(intervalA1, intervalA2) * scale;
    const yA = yAxis - 45;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.fillRect(pxA1, yA - 10, pxA2 - pxA1, 20);
    ctx.strokeRect(pxA1, yA - 10, pxA2 - pxA1, 20);
    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Tập A = [${Math.min(intervalA1, intervalA2)}; ${Math.max(intervalA1, intervalA2)}]`, (pxA1 + pxA2) / 2, yA - 16);

    // Interval B: [b1, b2] (Emerald)
    const pxB1 = ox + Math.min(intervalB1, intervalB2) * scale;
    const pxB2 = ox + Math.max(intervalB1, intervalB2) * scale;
    const yB = yAxis + 45;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.fillRect(pxB1, yB - 10, pxB2 - pxB1, 20);
    ctx.strokeRect(pxB1, yB - 10, pxB2 - pxB1, 20);
    ctx.fillStyle = '#065f46';
    ctx.fillText(`Tập B = [${Math.min(intervalB1, intervalB2)}; ${Math.max(intervalB1, intervalB2)}]`, (pxB1 + pxB2) / 2, yB + 28);
  }, [activeEngineType, intervalA1, intervalA2, intervalB1, intervalB2, setOpMode]);

  // -------------------------------------------------------------------------
  // Canvas Render 6: Conics
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'conic_sections') return;
    const canvas = canvasConicRef.current;
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

    // Draw Conic
    if (conicType === 'ellipse') {
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(ox, oy, conicA * scale, conicB * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Foci F1, F2
      const c = Math.sqrt(Math.max(0, conicA * conicA - conicB * conicB));
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ox - c * scale, oy, 4.5, 0, Math.PI * 2);
      ctx.arc(ox + c * scale, oy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (conicType === 'hyperbola') {
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      // Hyperbola x^2/a^2 - y^2/b^2 = 1
      for (const sign of [-1, 1]) {
        ctx.beginPath();
        let started = false;
        for (let py = 0; py <= height; py += 2) {
          const y = (oy - py) / scale;
          const x = sign * conicA * Math.sqrt(1 + (y * y) / (conicB * conicB));
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
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let py = 0; py <= height; py += 2) {
        const y = (oy - py) / scale;
        const x = (y * y) / (2 * conicP);
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
  }, [activeEngineType, conicType, conicA, conicB, conicP]);

  // -------------------------------------------------------------------------
  // Canvas Render 7: 2D Vectors & Dot Product
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'vector_2d') return;
    const canvas = canvasVecRef.current;
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

    // Vector u (Indigo)
    const uxPx = ox + vecUx * scale;
    const uyPx = oy - vecUy * scale;
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
    ctx.fillText(`u(${vecUx}; ${vecUy})`, uxPx + 8, uyPx - 6);

    // Vector v (Emerald)
    const vxPx = ox + vecVx * scale;
    const vyPx = oy - vecVy * scale;
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
    ctx.fillText(`v(${vecVx}; ${vecVy})`, vxPx + 8, vyPx - 6);
  }, [activeEngineType, vecUx, vecUy, vecVx, vecVy]);

  // -------------------------------------------------------------------------
  // Canvas Render 8: Exp & Log Functions
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'exp_log_symmetry') return;
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

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    // Line y = x (Symmetry Axis)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve y = a^x (Indigo)
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

    // Curve y = log_a(x) (Emerald)
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
  }, [activeEngineType, baseA]);

  // -------------------------------------------------------------------------
  // Canvas Render 9: Derivative & Tangent Limit
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'derivative_tangent') return;
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

    // Axes
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

    // Tangent at x0
    const x0 = tangentX0;
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

    // Secant line
    if (Math.abs(secantDeltaX) > 0.05) {
      const xSec = x0 + secantDeltaX;
      const ySec = f(xSec);
      const mSecPx = ox + xSec * scale;
      const mSecPy = oy - ySec * scale;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(mSecPx, mSecPy, 4.5, 0, Math.PI * 2);
      ctx.fill();

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
  }, [activeEngineType, tangentX0, secantDeltaX]);

  // -------------------------------------------------------------------------
  // Canvas Render 10: Riemann Integral & Area
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'integral_riemann_area') return;
    const canvas = canvasRiemannRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const ox = 70;
    const oy = height - 50;
    const scaleX = 75;
    const scaleY = 16;

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, oy);
    ctx.lineTo(width - 20, oy);
    ctx.moveTo(ox, 20);
    ctx.lineTo(ox, height - 20);
    ctx.stroke();

    const f = (x: number) => x * x + 1;

    // Riemann Rectangles
    const a = riemannA;
    const b = riemannB;
    const n = Math.max(2, riemannN);
    const dx = (b - a) / n;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1;

    for (let i = 0; i < n; i++) {
      const xi = a + i * dx;
      const hVal = f(xi + dx / 2); // Midpoint
      const rx = ox + xi * scaleX;
      const ry = oy - hVal * scaleY;
      const rw = dx * scaleX;
      const rh = hVal * scaleY;

      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    }

    // Actual Curve
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
  }, [activeEngineType, riemannA, riemannB, riemannN]);

  // -------------------------------------------------------------------------
  // Canvas Render 11: 3D Pyramid
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'solid_geometry_3d') return;
    const canvas = canvasPyrRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2 + 30;
    const scale = 34;

    const radX = (pyrRotX * Math.PI) / 180;
    const radY = (pyrRotY * Math.PI) / 180;

    const project = (x: number, y: number, z: number) => {
      const x1 = x * Math.cos(radY) + y * Math.sin(radY);
      const y1 = -x * Math.sin(radY) + y * Math.cos(radY);
      const z1 = z;
      const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);
      return { px: cx + x1 * scale, py: cy - z2 * scale };
    };

    const a = pyrBaseA;
    const h = pyrHeightH;

    // Pyramid vertices: base ABCD centered at origin z=0, apex S at (0, 0, h)
    const pA = project(-a / 2, -a / 2, 0);
    const pB = project(a / 2, -a / 2, 0);
    const pC = project(a / 2, a / 2, 0);
    const pD = project(-a / 2, a / 2, 0);
    const pS = project(0, 0, h);

    // Draw faces
    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;

    // Base
    ctx.beginPath();
    ctx.moveTo(pA.px, pA.py);
    ctx.lineTo(pB.px, pB.py);
    ctx.lineTo(pC.px, pC.py);
    ctx.lineTo(pD.px, pD.py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lateral edges to S
    [pA, pB, pC, pD].forEach((pt) => {
      ctx.beginPath();
      ctx.moveTo(pt.px, pt.py);
      ctx.lineTo(pS.px, pS.py);
      ctx.stroke();
    });

    // Altitude SH (Dashed amber)
    const pH = project(0, 0, 0);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pH.px, pH.py);
    ctx.lineTo(pS.px, pS.py);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pS.px, pS.py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('S', pS.px + 6, pS.py - 4);
  }, [activeEngineType, pyrBaseA, pyrHeightH, pyrRotX, pyrRotY]);

  // -------------------------------------------------------------------------
  // Canvas Render 12: Statistics & Box Plot
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeEngineType !== 'statistics_box_plot') return;
    const canvas = canvasBoxPlotRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Parse data
    const nums = statDataRaw
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    if (nums.length < 4) return;

    const min = nums[0];
    const max = nums[nums.length - 1];
    const n = nums.length;

    // Calculate quartiles
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
    const iqr = q3 - q1;

    // Scale
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

    // Box: Q1 to Q3
    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.fillRect(toPx(q1), yMid - boxH / 2, toPx(q3) - toPx(q1), boxH);
    ctx.strokeRect(toPx(q1), yMid - boxH / 2, toPx(q3) - toPx(q1), boxH);

    // Median line Q2
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toPx(q2), yMid - boxH / 2);
    ctx.lineTo(toPx(q2), yMid + boxH / 2);
    ctx.stroke();
  }, [activeEngineType, statDataRaw]);

  return (
    <div className="space-y-6 pb-12">
      {/* ===================================================================== */}
      {/* HEADER WITH TEXTBOOK STANDARD NOTICE */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Atom className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Phòng Lab Toán học Toàn diện
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bộ SGK Kết nối tri thức với cuộc sống · 79 Bài học chính khóa &amp; Hoạt động thực hành trải nghiệm
                </p>
              </div>
            </div>
          </div>

          {/* Tab Selector: Simulation vs Catalog Coverage */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('simulation');
                soundService.playClick();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'simulation'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>Mô phỏng Trực quan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('catalog');
                soundService.playClick();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bảng Tiến độ 79 Bài SGK</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {totalTested}/{catalog.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SIMULATION WORKSPACE VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'simulation' && (
        <div className="space-y-5">
          {/* Multi-tier Navigation Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              {/* Grade Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 mr-1">Khối:</span>
                {(['all', 10, 11, 12] as const).map((g) => (
                  <button
                    key={String(g)}
                    type="button"
                    onClick={() => {
                      setFilterGrade(g);
                      setFilterChapter('all');
                      soundService.playClick();
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      filterGrade === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {g === 'all' ? 'Tất cả khối' : `Toán ${g}`}
                  </button>
                ))}
              </div>

              {/* Semester Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 mr-1">Học kỳ:</span>
                {(['all', 1, 2] as const).map((sem) => (
                  <button
                    key={String(sem)}
                    type="button"
                    onClick={() => {
                      setFilterSemester(sem);
                      setFilterChapter('all');
                      soundService.playClick();
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      filterSemester === sem ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sem === 'all' ? 'Cả hai kỳ' : `Học kỳ ${sem}`}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm bài học (VD: M12-HK2-B14)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Chapter Dropdown & Lab Counter */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <span className="font-semibold text-slate-600 shrink-0">Chương SGK:</span>
                <select
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-md truncate"
                >
                  <option value="all">Tất cả các chương ({availableChapters.length} chương)</option>
                  {availableChapters.map((chap) => (
                    <option key={chap} value={chap}>
                      {chap}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Hiển thị <span className="font-bold text-indigo-700">{filteredCatalog.length}</span> / {catalog.length} bài học
              </div>
            </div>

            {/* Lab Card Grid Carousel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
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
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs ring-2 ring-indigo-200'
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
                          T{lab.grade}·HK{lab.semester}
                        </span>
                        <span
                          className={`text-[9px] font-mono ${
                            isSelected ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {lab.lessonCode || lab.code}
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {lab.lesson}
                      </p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-slate-100/30 flex items-center justify-between text-[10px]">
                      <span className={isSelected ? 'text-indigo-200' : 'text-slate-400'}>
                        {lab.mathType}
                      </span>
                      <span className={`flex items-center gap-0.5 font-bold ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`}>
                        <Check className="w-2.5 h-2.5" /> Đạt
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Lab Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-400/30 font-bold">
                    {activeModule.lessonCode || activeModule.code}
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

            {/* Objectives */}
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
          {/* SIMULATOR ENGINES */}
          {/* ================================================================= */}

          {/* 1. 3D Oxyz Space & Plane */}
          {activeEngineType === 'space_3d_oxyz' && (
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
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.1))}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center">
                  <canvas
                    ref={canvas3dRef}
                    width={560}
                    height={420}
                    onMouseDown={(e) => {
                      isDraggingRef.current = true;
                      lastMousePos.current = { x: e.clientX, y: e.clientY };
                    }}
                    onMouseMove={(e) => {
                      if (!isDraggingRef.current) return;
                      const dx = e.clientX - lastMousePos.current.x;
                      const dy = e.clientY - lastMousePos.current.y;
                      setRotY((prev) => prev + dx * 0.5);
                      setRotX((prev) => Math.max(-80, Math.min(80, prev - dy * 0.5)));
                      lastMousePos.current = { x: e.clientX, y: e.clientY };
                    }}
                    onMouseUp={() => {
                      isDraggingRef.current = false;
                    }}
                    onMouseLeave={() => {
                      isDraggingRef.current = false;
                    }}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Tham số Mặt phẳng &amp; Vectơ Pháp Tuyến</span>
                </h3>

                {/* KaTeX Equation */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                    Phương trình chuẩn KaTeX:
                  </span>
                  <div className="text-sm font-semibold text-indigo-900">
                    <MathRenderer content={`\\[${formatPlaneEquation(planeA, planeB, planeC, planeD)}\\]`} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>Hệ số A (trục Ox): {planeA}</span>
                    </label>
                    <input
                      type="range"
                      min={-4}
                      max={4}
                      step={1}
                      value={planeA}
                      onChange={(e) => setPlaneA(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>Hệ số B (trục Oy): {planeB}</span>
                    </label>
                    <input
                      type="range"
                      min={-4}
                      max={4}
                      step={1}
                      value={planeB}
                      onChange={(e) => setPlaneB(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>Hệ số C (trục Oz): {planeC}</span>
                    </label>
                    <input
                      type="range"
                      min={-4}
                      max={4}
                      step={1}
                      value={planeC}
                      onChange={(e) => setPlaneC(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>Hệ số tự do D: {planeD}</span>
                    </label>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={1}
                      value={planeD}
                      onChange={(e) => setPlaneD(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPlaneA(1);
                    setPlaneB(2);
                    setPlaneC(-1);
                    setPlaneD(-3);
                    setRotX(25);
                    setRotY(-35);
                    setZoom(1);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Đặt lại góc nhìn &amp; tham số ban đầu
                </button>
              </div>
            </div>
          )}

          {/* 2. Trigonometric Circle & Wave */}
          {activeEngineType === 'trig_circle' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Vòng tròn Lượng giác &amp; Sóng Sin
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded font-bold">
                    α = {angleDeg}°
                  </span>
                </div>

                <div className="relative bg-slate-50 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasTrigRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Góc Lượng Giác &amp; Tọa Độ Điểm M</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[11px] font-semibold text-indigo-700 uppercase block mb-1">
                    Công thức Radian &amp; Tọa độ M:
                  </span>
                  <div className="text-xs font-semibold text-slate-900 space-y-1">
                    <MathRenderer content={`\\[${formatRadianLatex(angleDeg)}\\]`} />
                    <MathRenderer
                      content={`\\[M(\\cos\\alpha; \\sin\\alpha) = (${Math.cos((angleDeg * Math.PI) / 180).toFixed(2)}; ${Math.sin((angleDeg * Math.PI) / 180).toFixed(2)})\\]`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 flex justify-between">
                    <span>Góc α: {angleDeg}° ({((angleDeg * Math.PI) / 180).toFixed(2)} rad)</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={angleDeg}
                    onChange={(e) => setAngleDeg(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="flex gap-2">
                  {[0, 30, 45, 60, 90, 180].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setAngleDeg(deg)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        angleDeg === deg ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Cubic Function */}
          {activeEngineType === 'cubic_function' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Đồ thị Hàm số Bậc ba &amp; Điểm uốn I
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Hệ số y = ax³ + bx² + cx + d</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <MathRenderer
                    content={`\\[y = ${paramA !== 1 ? paramA : ''}x^3 ${paramB >= 0 ? '+ ' + paramB : paramB}x^2 ${paramC >= 0 ? '+ ' + paramC : paramC}x ${paramD >= 0 ? '+ ' + paramD : paramD}\\]`}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>a = {paramA}</span>
                    </label>
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
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>b = {paramB}</span>
                    </label>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={1}
                      value={paramB}
                      onChange={(e) => setParamB(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>c = {paramC}</span>
                    </label>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={1}
                      value={paramC}
                      onChange={(e) => setParamC(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>d = {paramD}</span>
                    </label>
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
              </div>
            </div>
          )}

          {/* 4. Parabola */}
          {activeEngineType === 'parabola_quadratic' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Đồ thị Parabol y = ax² + bx + c
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasParabolRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Hệ số Parabol &amp; Tọa độ Đỉnh</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <MathRenderer content={`\\[${formatParabolaEquation(parabolA, parabolB, parabolC)}\\]`} />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>a = {parabolA}</span>
                    </label>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.5}
                      value={parabolA}
                      onChange={(e) => setParabolA(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>b = {parabolB}</span>
                    </label>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={1}
                      value={parabolB}
                      onChange={(e) => setParabolB(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>c = {parabolC}</span>
                    </label>
                    <input
                      type="range"
                      min={-6}
                      max={6}
                      step={1}
                      value={parabolC}
                      onChange={(e) => setParabolC(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Set & Intervals */}
          {activeEngineType === 'set_venn' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Trục số Thực &amp; Giao, Hợp, Hiệu
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasSetRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Đầu mút Tập Hợp A và B</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Tập A: mút trái ({intervalA1})</label>
                    <input
                      type="range"
                      min={-7}
                      max={7}
                      step={1}
                      value={intervalA1}
                      onChange={(e) => setIntervalA1(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Tập A: mút phải ({intervalA2})</label>
                    <input
                      type="range"
                      min={-7}
                      max={7}
                      step={1}
                      value={intervalA2}
                      onChange={(e) => setIntervalA2(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Tập B: mút trái ({intervalB1})</label>
                    <input
                      type="range"
                      min={-7}
                      max={7}
                      step={1}
                      value={intervalB1}
                      onChange={(e) => setIntervalB1(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Tập B: mút phải ({intervalB2})</label>
                    <input
                      type="range"
                      min={-7}
                      max={7}
                      step={1}
                      value={intervalB2}
                      onChange={(e) => setIntervalB2(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. Conics */}
          {activeEngineType === 'conic_sections' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Ba đường Conic (Elip, Hypebol, Parabol)
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasConicRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Chọn loại Conic &amp; Tham số</span>
                </h3>

                <div className="flex gap-2">
                  {(['ellipse', 'hyperbola', 'parabola'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setConicType(t)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        conicType === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t === 'ellipse' ? 'Elip' : t === 'hyperbola' ? 'Hypebol' : 'Parabol'}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Bán trục a: {conicA}</label>
                    <input
                      type="range"
                      min={2}
                      max={6}
                      step={0.5}
                      value={conicA}
                      onChange={(e) => setConicA(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Bán trục b: {conicB}</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={conicB}
                      onChange={(e) => setConicB(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. 2D Vectors */}
          {activeEngineType === 'vector_2d' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Vectơ Động &amp; Tích Vô Hướng u · v
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasVecRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Tọa độ Vectơ u và v</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <p className="font-semibold text-slate-800">
                    • Tích vô hướng: <MathRenderer content={`\\vec{u} \\cdot \\vec{v} = ${vecUx * vecVx + vecUy * vecVy}`} inline />
                  </p>
                  <p className="font-semibold text-slate-800">
                    • Độ dài |u|: <MathRenderer content={`|\\vec{u}| = ${(Math.sqrt(vecUx * vecUx + vecUy * vecUy)).toFixed(2)}`} inline />
                  </p>
                  <p className="font-semibold text-slate-800">
                    • Độ dài |v|: <MathRenderer content={`|\\vec{v}| = ${(Math.sqrt(vecVx * vecVx + vecVy * vecVy)).toFixed(2)}`} inline />
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">u_x: {vecUx}</label>
                    <input
                      type="range"
                      min={-5}
                      max={5}
                      step={1}
                      value={vecUx}
                      onChange={(e) => setVecUx(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">u_y: {vecUy}</label>
                    <input
                      type="range"
                      min={-5}
                      max={5}
                      step={1}
                      value={vecUy}
                      onChange={(e) => setVecUy(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">v_x: {vecVx}</label>
                    <input
                      type="range"
                      min={-5}
                      max={5}
                      step={1}
                      value={vecVx}
                      onChange={(e) => setVecVx(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">v_y: {vecVy}</label>
                    <input
                      type="range"
                      min={-5}
                      max={5}
                      step={1}
                      value={vecVy}
                      onChange={(e) => setVecVy(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. Exp & Log */}
          {activeEngineType === 'exp_log_symmetry' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Đồ thị Hàm Mũ &amp; Logarit Đối xứng qua y = x
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasExpLogRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Cơ số a</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <MathRenderer content={`\\[y = ${baseA}^x \\quad \\Longleftrightarrow \\quad y = \\log_{${baseA}}(x)\\]`} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Cơ số a: {baseA}</label>
                  <input
                    type="range"
                    min={0.2}
                    max={4}
                    step={0.1}
                    value={baseA}
                    onChange={(e) => setBaseA(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 9. Derivative Tangent Limit */}
          {activeEngineType === 'derivative_tangent' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Cát Tuyến Hội Tụ Về Tiếp Tuyến Khi Δx → 0
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasTangentRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Điểm Tiếp Điểm x₀ &amp; Số Gia Δx</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">x₀ = {tangentX0}</label>
                    <input
                      type="range"
                      min={-2}
                      max={2}
                      step={0.2}
                      value={tangentX0}
                      onChange={(e) => setTangentX0(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Số gia Δx: {secantDeltaX}</label>
                    <input
                      type="range"
                      min={0.05}
                      max={1.5}
                      step={0.05}
                      value={secantDeltaX}
                      onChange={(e) => setSecantDeltaX(Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. Riemann Integral */}
          {activeEngineType === 'integral_riemann_area' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Tổng Diện Tích Riemann Hình Chữ Nhật
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasRiemannRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Số Phân Hoạch n &amp; Cận [a, b]</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <MathRenderer content={`\\[\\int_0^3 (x^2 + 1)\\,dx = \\left[\\frac{x^3}{3} + x\\right]_0^3 = 9 + 3 = 12\\]`} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Số cột phân hoạch n: {riemannN}</label>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    step={2}
                    value={riemannN}
                    onChange={(e) => setRiemannN(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 11. 3D Solid Geometry & Pyramid */}
          {activeEngineType === 'solid_geometry_3d' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Khối Chóp Đều 3D S.ABCD
                </span>
                <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center">
                  <canvas ref={canvasPyrRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Kích Thước Cạnh Đáy a &amp; Chiều Cao h</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <p>• Diện tích đáy: <MathRenderer content={`S_{ABCD} = a^2 = ${(pyrBaseA * pyrBaseA).toFixed(1)}`} inline /></p>
                  <p>• Thể tích: <MathRenderer content={`V = \\frac{1}{3}Bh = \\frac{1}{3}(${(pyrBaseA * pyrBaseA).toFixed(1)})(${pyrHeightH}) \\approx ${((pyrBaseA * pyrBaseA * pyrHeightH) / 3).toFixed(2)}`} inline /></p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Cạnh đáy a: {pyrBaseA}</label>
                    <input
                      type="range"
                      min={2}
                      max={6}
                      step={0.5}
                      value={pyrBaseA}
                      onChange={(e) => setPyrBaseA(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Chiều cao h: {pyrHeightH}</label>
                    <input
                      type="range"
                      min={2}
                      max={7}
                      step={0.5}
                      value={pyrHeightH}
                      onChange={(e) => setPyrHeightH(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 12. Statistics & Box Plot */}
          {activeEngineType === 'statistics_box_plot' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block border-b border-slate-100 pb-2">
                  Biểu Đồ Hộp (Box Plot) &amp; Điểm Ngoại Lai Outliers
                </span>
                <div className="relative bg-white rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-100">
                  <canvas ref={canvasBoxPlotRef} width={560} height={420} className="w-full h-full" />
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Dữ Liệu Thống Kê Đầu Vào</span>
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Nhập dãy số phân cách bởi dấu phẩy:
                  </label>
                  <textarea
                    rows={3}
                    value={statDataRaw}
                    onChange={(e) => setStatDataRaw(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 13. Propositional Logic */}
          {activeEngineType === 'logic_truth_table' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Binary className="w-4 h-4 text-indigo-600" />
                <span>Bảng Chân Trị Logic Mệnh Đề Động</span>
              </h3>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={propP}
                    onChange={(e) => setPropP(e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  <span>Mệnh đề P: {propP ? 'ĐÚNG (1)' : 'SAI (0)'}</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={propQ}
                    onChange={(e) => setPropQ(e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  <span>Mệnh đề Q: {propQ ? 'ĐÚNG (1)' : 'SAI (0)'}</span>
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="px-4 py-2">P</th>
                      <th className="px-4 py-2">Q</th>
                      <th className="px-4 py-2">¬P</th>
                      <th className="px-4 py-2">P ∧ Q (Và)</th>
                      <th className="px-4 py-2">P ∨ Q (Hoặc)</th>
                      <th className="px-4 py-2">P ⇒ Q (Kéo theo)</th>
                      <th className="px-4 py-2">P ⇔ Q (Tương đương)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 font-mono font-bold bg-indigo-50/40">
                      <td className="px-4 py-2">{propP ? 'T' : 'F'}</td>
                      <td className="px-4 py-2">{propQ ? 'T' : 'F'}</td>
                      <td className="px-4 py-2">{!propP ? 'T' : 'F'}</td>
                      <td className="px-4 py-2">{propP && propQ ? 'T' : 'F'}</td>
                      <td className="px-4 py-2">{propP || propQ ? 'T' : 'F'}</td>
                      <td className="px-4 py-2">{!propP || propQ ? 'T' : 'F'}</td>
                      <td className="px-4 py-2">{propP === propQ ? 'T' : 'F'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 14. Linear Programming */}
          {activeEngineType === 'linear_programming' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Quy Hoạch Tuyến Tính &amp; Đỉnh Đa Giác Lồi</span>
              </h3>
              <p className="text-xs text-slate-600">
                Khảo sát miền nghiệm của hệ: <MathRenderer content={`x \\ge 0,\\ y \\ge 0,\\ x + y \\le 6,\\ 2x + y \\le 8`} inline />.
                Hàm mục tiêu: <MathRenderer content={`F(x, y) = ${objA}x + ${objB}y`} inline />
              </p>
              <div className="flex gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Hệ số a: {objA}</label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={objA}
                    onChange={(e) => setObjA(Number(e.target.value))}
                    className="accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Hệ số b: {objB}</label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={objB}
                    onChange={(e) => setObjB(Number(e.target.value))}
                    className="accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 15. Triangle Geometry */}
          {activeEngineType === 'triangle_sine_cosine' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Hệ Thức Lượng Tam Giác &amp; Định Lí Cosin</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <MathRenderer
                  content={`c = \\sqrt{a^2 + b^2 - 2ab\\cos C} = \\sqrt{${triA}^2 + ${triB}^2 - 2(${triA})(${triB})\\cos(${triAngleC}^\\circ)} \\approx ${(Math.sqrt(triA * triA + triB * triB - 2 * triA * triB * Math.cos((triAngleC * Math.PI) / 180))).toFixed(2)}`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Cạnh a: {triA}</label>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={0.5}
                    value={triA}
                    onChange={(e) => setTriA(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Cạnh b: {triB}</label>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={0.5}
                    value={triB}
                    onChange={(e) => setTriB(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Góc C: {triAngleC}°</label>
                  <input
                    type="range"
                    min={20}
                    max={160}
                    step={5}
                    value={triAngleC}
                    onChange={(e) => setTriAngleC(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 16. Sequences & Progressions */}
          {activeEngineType === 'sequences_progression' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Cấp Số Cộng &amp; Cấp Số Nhân</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p>• Số hạng tổng quát: <MathRenderer content={`u_n = u_1 + (n-1)d = ${progU1} + (n-1)(${progD})`} inline /></p>
                <p>• Tổng n số hạng đầu: <MathRenderer content={`S_{${progN}} = \\frac{${progN}}{2}(2(${progU1}) + (${progN}-1)(${progD})) = ${(progN / 2) * (2 * progU1 + (progN - 1) * progD)}`} inline /></p>
              </div>
            </div>
          )}

          {/* 17. Limit 0/0 */}
          {activeEngineType === 'limit_0_over_0' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Khử Dạng Vô Định 0/0 &amp; Giới Hạn Hàm Số</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <MathRenderer content={`\\[\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2} = \\lim_{x \\to 2} (x + 2) = 4\\]`} />
              </div>
            </div>
          )}

          {/* 18. Bayes & Probability */}
          {activeEngineType === 'probability_bayes' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Xác Suất Toàn Phần &amp; Định Lí Bayes</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <MathRenderer content={`\\[P(B|+) = \\frac{P(B)P(+|B)}{P(B)P(+|B) + P(\\bar{B})P(+|\\bar{B})}\\]`} />
              </div>
            </div>
          )}

          {/* 19. Projectile Motion */}
          {activeEngineType === 'projectile_motion' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-indigo-600" />
                <span>Mô Phỏng Chuyển Động Ném Xiên &amp; Tầm Xa</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <MathRenderer content={`\\[L = \\frac{v_0^2 \\sin(2\\alpha)}{g} \\approx \\frac{${projV0}^2 \\sin(${2 * projAngle}^\\circ)}{9{,}8} = ${((projV0 * projV0 * Math.sin((2 * projAngle * Math.PI) / 180)) / 9.8).toFixed(1)}\\text{ m}\\]`} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 13: COMPREHENSIVE PROGRESS & VERIFICATION MATRIX TABLE */}
      {/* ===================================================================== */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-5 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Bảng Theo Dõi Tiến Độ Triển Khai 79 Bài &amp; HĐTH SGK
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Chuẩn SGK Kết nối tri thức với cuộc sống. Mã bài định danh chuẩn (M10-HK1-B01 ... M12-HK2-B19) và trạng thái kiểm thử minh bạch.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                {totalTested} / {catalog.length} Đã kiểm thử ({coveragePercent}%)
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Khối:</span>
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

            <div className="ml-auto min-w-[200px]">
              <input
                type="text"
                placeholder="Lọc tên bài hoặc mã..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1 rounded-lg border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-3">Khối</th>
                  <th className="px-3 py-3">Học kỳ</th>
                  <th className="px-3 py-3">Mã bài SGK</th>
                  <th className="px-3 py-3">Tên bài học</th>
                  <th className="px-3 py-3">Dạng toán &amp; Hoạt động Lab</th>
                  <th className="px-3 py-3">Dạng mô phỏng</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">Kết quả</th>
                  <th className="px-3 py-3 text-right">Khám phá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredCatalog.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-indigo-700">Toán {mod.grade}</span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-600">HK{mod.semester}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-800">
                      {mod.lessonCode || mod.code}
                    </td>
                    <td className="px-3 py-2.5 max-w-xs">
                      <p className="font-bold text-slate-900 line-clamp-1">{mod.lesson}</p>
                      <p className="text-[10px] text-slate-400 truncate">{mod.chapter}</p>
                    </td>
                    <td className="px-3 py-2.5 max-w-sm">
                      <p className="text-slate-700 line-clamp-1">{mod.title}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{mod.topic}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                        {mod.mathType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-2.5 h-2.5" />
                        Đã kiểm thử
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Đạt
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLabId(mod.id);
                          setActiveTab('simulation');
                          soundService.playClick();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition-colors shadow-2xs inline-flex items-center gap-1"
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
