/**
 * EduTest Smart - Type Definitions
 * Chuẩn chương trình Giáo dục Phổ thông 2018 - Môn Toán THPT
 */

import { MathGraphicConfig } from './mathGraphics';
export * from './mathGraphics';

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title: string;
  school?: string;
  subject?: string;
  classId?: string; // If student
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: 10 | 11 | 12;
  schoolYear: string;
  studentCount: number;
  roomCode: string;
  homeroomTeacher: string;
  description: string;
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  className: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Nam' | 'Nữ';
  averageScore: number;
  completedExams: number;
  status: 'active' | 'suspended';
}

export type CognitiveLevel = 'recognition' | 'comprehension' | 'application' | 'high_application';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface QuestionSubItem {
  id: string;
  label: 'a' | 'b' | 'c' | 'd';
  content: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  code: string;
  grade: 10 | 11 | 12;
  semester: 1 | 2;
  chapter: string;
  lesson: string;
  topic: string;
  cognitiveLevel: CognitiveLevel;
  questionType: QuestionType;
  content: string; // supports KaTeX equations
  options?: string[]; // for multiple_choice (A, B, C, D)
  subItems?: QuestionSubItem[]; // for true_false (a, b, c, d)
  correctAnswer: string | boolean[] | number | string[];
  acceptableAnswers?: string[]; // for short_answer numerical / expression equivalence
  explanation?: string;
  points: number;
  part?: 1 | 2 | 3;
  graphics?: MathGraphicConfig;
  createdAt: string;
}

export interface MatrixItem {
  chapter: string;
  topic: string;
  learningObjective?: string;
  recognition: number;
  comprehension: number;
  application: number;
  highApplication: number;
  part1Count?: number; // Trắc nghiệm nhiều lựa chọn
  part2Count?: number; // Đúng / Sai
  part3Count?: number; // Trả lời ngắn
  totalQuestions: number;
  totalPoints: number;
}

export interface ExamMatrix {
  id: string;
  title: string;
  grade: 10 | 11 | 12;
  examType: '15_min' | '45_min' | 'midterm' | 'final';
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  items: MatrixItem[];
  formatRatio: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
    essay: number;
  };
  cognitiveRatio: {
    recognition: number;
    comprehension: number;
    application: number;
    highApplication: number;
  };
}

export type ExamGradingRulePart2 = 'official_moet' | 'equal_split';

export interface ExamPartConfig {
  enabled: boolean;
  title: string;
  description: string;
  questionCount: number;
  pointsPerQuestion: number;
  totalPoints: number;
}

export interface ExamStructureConfig {
  grade: 10 | 11 | 12;
  semester: 1 | 2;
  examType: '15_min' | '45_min' | 'midterm' | 'final' | 'national_mock';
  durationMinutes: number;
  totalPoints: number;
  gradingRulePart2: ExamGradingRulePart2;
  part1: ExamPartConfig;
  part2: {
    enabled: boolean;
    title: string;
    description: string;
    questionCount: number;
    subItemsPerQuestion: number;
    maxPointsPerQuestion: number;
    totalPoints: number;
  };
  part3: ExamPartConfig;
  cognitiveRatio: {
    recognition: number;
    comprehension: number;
    application: number;
    highApplication: number;
  };
}

export interface SpecificationItem {
  id: string;
  order: number;
  chapter: string;
  lesson?: string;
  topic: string;
  learningObjective: string;
  part: 1 | 2 | 3;
  questionType: QuestionType;
  cognitiveLevel: CognitiveLevel;
  questionNumber: number;
  subItemCount?: number;
  points: number;
  matchedQuestionId?: string;
  matchedQuestionCode?: string;
}

export interface ExamVariant {
  code: string; // Mã đề: 101, 102, 103, 104
  questionIds: string[];
  orderMap: { originalId: string; newNumber: number; shuffledOptions?: number[] }[];
  answerKeyPart1: Record<number, string>;
  answerKeyPart2: Record<number, Record<'a' | 'b' | 'c' | 'd', boolean>>;
  answerKeyPart3: Record<number, string>;
  questions?: Question[]; // Danh sách câu hỏi đã hoán vị phương án riêng cho mã đề này
}

export interface ExamBundle {
  id: string;
  code: string;
  title: string;
  managingAgency?: string; // Cơ quan quản lý GD (Sở GD&ĐT / Phòng GD&ĐT)
  schoolName: string;
  department?: string; // Tổ chuyên môn, ví dụ: Tổ Toán - Tin học
  academicYear: string; // Năm học, ví dụ: 2026 - 2027
  examPeriod?: string; // Tên kỳ kiểm tra, ví dụ: Kiểm tra cuối học kỳ I
  grade: 10 | 11 | 12;
  semester: 1 | 2;
  subject: string;
  durationMinutes: number;
  totalPoints: number;
  pageCount?: number; // Số trang thực tế / ước tính
  status: 'draft' | 'approved' | 'published' | 'archived';
  structure: ExamStructureConfig;
  matrixItems: MatrixItem[];
  specifications: SpecificationItem[];
  questions: Question[];
  variants: ExamVariant[];
  masterAnswerKey: {
    part1: { questionNumber: number; answer: string; points: number }[];
    part2: { questionNumber: number; subItems: { label: 'a' | 'b' | 'c' | 'd'; isCorrect: boolean }[]; maxPoints: number }[];
    part3: { questionNumber: number; answer: string; acceptableAnswers?: string[]; points: number }[];
  };
  gradingGuide: {
    part1Guide: string;
    part2Guide: string;
    part3Guide: string;
    solutions: { questionNumber: number; part: number; content: string; solution: string; points: number }[];
  };
  proctoringConfig?: ProctoringConfig;
  assignedClassIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProctoringMode = 'strict_lock' | 'monitor_only';

export interface ProctoringConfig {
  mode: ProctoringMode;
  lockThreshold: 1 | 2 | 3;
  unlockPin?: string;
  continueTimerOnLock: boolean;
  detectTabSwitch: boolean;
  detectFullscreenExit: boolean;
  detectFocusLoss: boolean;
}

export interface ProctoringEvent {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  eventType:
    | 'tab_switch'
    | 'fullscreen_exit'
    | 'focus_loss'
    | 'network_disconnect'
    | 'network_reconnect'
    | 'exam_locked'
    | 'exam_unlocked_remote'
    | 'exam_unlocked_pin';
  isViolation: boolean;
  description: string;
  severity: 'info' | 'warning' | 'danger';
  performedBy?: string;
}

export interface Exam {
  id: string;
  code: string;
  title: string;
  grade: 10 | 11 | 12;
  semester: 1 | 2;
  durationMinutes: number;
  totalPoints: number;
  questionsCount: number;
  questionIds: string[];
  assignedClassIds: string[];
  status: 'draft' | 'published' | 'closed';
  allowReview: boolean;
  proctoringEnabled: boolean;
  proctoringMode?: ProctoringMode;
  proctoringConfig?: ProctoringConfig;
  bundle?: ExamBundle;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  score: number;
  maxScore: number;
  durationSpentMinutes: number;
  submittedAt: string;
  status: 'submitted' | 'graded';
  tabViolationsCount: number;
  isLocked?: boolean;
  lockReason?: string;
  lockedAt?: string;
  proctoringMode?: ProctoringMode;
  unlockHistory?: { unlockedAt: string; unlockedBy: string; method: 'pin' | 'remote' }[];
  proctoringEvents?: ProctoringEvent[];
  answers: Record<string, any>;
  feedback?: string;
}

export interface MathLabModule {
  id: string;
  code: string;
  grade: 10 | 11 | 12;
  semester: 1 | 2;
  category: 'Đại số & Giải tích' | 'Hình học & Tọa độ' | 'Thống kê & Xác suất';
  chapter: string;
  lesson: string;
  topic: string;
  mathType: '2D' | '3D' | 'interactive_calc' | 'data_simulation';
  title: string;
  description: string;
  objectives: string[];
  isImplemented: boolean;
  badgeText: string;
  lessonCode?: string;
  testStatus?: 'tested' | 'in_progress' | 'planned';
  testResult?: 'pass' | 'pending';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  linkSection?: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  role: string;
  action: string;
  detail: string;
  timeAgo: string;
  timestamp: string;
}
