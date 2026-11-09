/**
 * EduTest Smart - Math Graphics Type Definitions
 * Hệ thống mô hình toán học & đồ thị 2D/3D dùng chung
 */

export type MathGraphicType =
  | 'space_3d_oxyz'        // Mặt phẳng và Hệ trục Oxyz 3D
  | 'solid_geometry_3d'    // Hình học không gian 3D (Hình chóp S.ABCD)
  | 'cubic_function'       // Đồ thị hàm số bậc ba y = ax³ + bx² + cx + d
  | 'parabola_quadratic'   // Đồ thị parabol bậc hai y = ax² + bx + c
  | 'trig_circle'          // Vòng tròn lượng giác đơn vị
  | 'conic_sections'       // Đường conic: Elip, Hyperbol, Parabol
  | 'vector_2d'            // Vectơ trong mặt phẳng Oxy
  | 'exp_log_symmetry'     // Hàm số Mũ và Lôgarit y = aˣ, y = log_a(x)
  | 'derivative_tangent'   // Tiếp tuyến và Cát tuyến đạo hàm
  | 'integral_riemann_area'// Tích phân & Diện tích hình phẳng (Riemann)
  | 'statistics_box_plot'  // Biểu đồ hộp Box Plot & Tứ phân vị
  | 'set_venn';            // Tập hợp & Trục số thực

export interface Camera3D {
  rotX: number;
  rotY: number;
  zoom: number;
}

export interface GraphicViewSettings {
  showGrid?: boolean;
  showAxes?: boolean;
  showLabels?: boolean;
  showHiddenLines?: boolean;
  width?: number;
  height?: number;
  theme?: 'clean_white' | 'math_blue' | 'print_mono';
}

export interface MathGraphicConfig {
  id: string;
  type: MathGraphicType;
  title: string;
  caption?: string;
  grade: 10 | 11 | 12;
  chapter?: string;
  topic?: string;
  params: Record<string, any>;
  viewSettings: GraphicViewSettings;
  camera?: Camera3D;
  version: number;
  createdAt: string;
  updatedAt?: string;
  exportedImageData?: string; // Data URL PNG cho in ấn và hiển thị ngoại tuyến
  svgData?: string;           // Chuỗi mã SVG chuẩn vector
}

export interface GraphicModelMetadata {
  type: MathGraphicType;
  name: string;
  grade: 10 | 11 | 12;
  dimension: '2D' | '3D';
  category: 'Hàm số & Đồ thị' | 'Hình học không gian' | 'Lượng giác & Conic' | 'Vectơ & Tọa độ' | 'Giải tích' | 'Thống kê & Tập hợp';
  description: string;
  defaultParams: Record<string, any>;
  defaultCamera?: Camera3D;
  supportedFormats: ('PNG' | 'SVG')[];
}
