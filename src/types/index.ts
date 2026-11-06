/**
 * EduTest Smart - Type Definitions
 * Chuẩn chương trình Giáo dục Phổ thông 2018 - Môn Toán THPT
 */

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
  options?: string[]; // for multiple_choice & true_false
  correctAnswer: string | boolean[] | number | string[];
  explanation?: string;
  points: number;
  createdAt: string;
}

export interface MatrixItem {
  chapter: string;
  topic: string;
  recognition: number;
  comprehension: number;
  application: number;
  highApplication: number;
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
