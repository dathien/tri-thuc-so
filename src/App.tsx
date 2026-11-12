import DrawingToolsPage from './components/drawing/DrawingToolsPage';
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar, { SectionKey } from './components/Sidebar';
import Footer from './components/Footer';

// Views
import OverviewView from './components/views/OverviewView';
import ClassesView from './components/views/ClassesView';
import QuestionsView from './components/views/QuestionsView';
import MatrixView from './components/views/MatrixView';
import ExamBuilderView from './components/views/ExamBuilderView';
import ExamVaultView from './components/views/ExamVaultView';
import OnlineExamView from './components/views/OnlineExamView';
import ProctoringView from './components/views/ProctoringView';
import GradingView from './components/views/GradingView';
import LearningPathView from './components/views/LearningPathView';
import MathLabView from './components/views/MathLabView';
import MathTreasureView from './components/views/MathTreasureView';
import MinigameView from './components/views/MinigameView';
import SettingsView from './components/views/SettingsView';

// Data & Types
import {
  INITIAL_TEACHER,
  INITIAL_STUDENT,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_QUESTIONS,
  INITIAL_MATRICES,
  INITIAL_EXAMS,
  INITIAL_SUBMISSIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  MATH_LAB_CURRICULUM_CATALOG,
} from './data/initialData';
import {
  UserProfile,
  ClassRoom,
  Student,
  Question,
  Exam,
  ExamMatrix,
  ExamSubmission,
  NotificationItem,
  ActivityLog,
} from './types';
import { soundService } from './utils/audio';

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname === "/drawing-tools") return <DrawingToolsPage />;
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_TEACHER);
  const [currentSection, setCurrentSection] = useState<SectionKey>('overview');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.isEnabled());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core Data States with localStorage persistence
  const [classes, setClasses] = useState<ClassRoom[]>(INITIAL_CLASSES);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('edutest_smart_questions');
      return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });
  const [matrices, setMatrices] = useState<ExamMatrix[]>(() => {
    try {
      const saved = localStorage.getItem('edutest_smart_matrices');
      return saved ? JSON.parse(saved) : INITIAL_MATRICES;
    } catch {
      return INITIAL_MATRICES;
    }
  });
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(INITIAL_SUBMISSIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  // Sync questions and matrices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('edutest_smart_questions', JSON.stringify(questions));
    } catch (e) {
      console.warn('Cannot save questions to localStorage', e);
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('edutest_smart_matrices', JSON.stringify(matrices));
    } catch (e) {
      console.warn('Cannot save matrices to localStorage', e);
    }
  }, [matrices]);

  // Switch role between teacher and student
  const handleSwitchRole = (newRole: 'teacher' | 'student') => {
    if (newRole === 'teacher') {
      setCurrentUser(INITIAL_TEACHER);
    } else {
      setCurrentUser(INITIAL_STUDENT);
      // If student was on an admin-only page, redirect to overview
      if (['classes', 'questions', 'matrix', 'exam-builder', 'exam-vault', 'proctoring'].includes(currentSection)) {
        setCurrentSection('overview');
      }
    }
  };

  const handleToggleSound = () => {
    const newState = soundService.toggleSound();
    setSoundEnabled(newState);
  };

  const handleMarkNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  // State modification handlers
  const handleAddClass = (newClass: Omit<ClassRoom, 'id' | 'createdAt'>) => {
    const created: ClassRoom = {
      ...newClass,
      id: `class-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setClasses((prev) => [created, ...prev]);

    // Log activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role === 'teacher' ? 'Giáo viên' : 'Học sinh',
      action: 'Tạo lớp học mới',
      detail: `Đã mở ${created.name} (${created.roomCode})`,
      timeAgo: 'Vừa xong',
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleAddStudent = (newStudent: Omit<Student, 'id'>) => {
    const created: Student = {
      ...newStudent,
      id: `hs-${Date.now()}`,
    };
    setStudents((prev) => [created, ...prev]);

    // Update class studentCount
    setClasses((prev) =>
      prev.map((c) =>
        c.id === newStudent.classId ? { ...c, studentCount: c.studentCount + 1 } : c
      )
    );
  };

  const handleAddQuestion = (newQ: Omit<Question, 'id' | 'createdAt'>) => {
    const created: Question = {
      ...newQ,
      id: `q-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setQuestions((prev) => [created, ...prev]);

    // Log activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      role: 'Giáo viên',
      action: 'Soạn câu hỏi mới',
      detail: `Thêm câu hỏi ${created.code} vào ngân hàng Toán ${created.grade}`,
      timeAgo: 'Vừa xong',
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateQuestion = (updatedQ: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
  };

  const handleUpdateMatrix = (updatedMatrix: ExamMatrix) => {
    setMatrices((prev) => prev.map((m) => (m.id === updatedMatrix.id ? updatedMatrix : m)));
  };

  const handleSaveExam = (newExam: Omit<Exam, 'id' | 'createdAt'>) => {
    const created: Exam = {
      ...newExam,
      id: `exam-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setExams((prev) => [created, ...prev]);

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      role: 'Giáo viên',
      action: created.status === 'published' ? 'Phát hành đề thi' : 'Lưu bản nháp đề thi',
      detail: `Đề: ${created.title} (${created.durationMinutes} phút)`,
      timeAgo: 'Vừa xong',
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleSubmitExam = (submissionData: Omit<ExamSubmission, 'id'>) => {
    const created: ExamSubmission = {
      ...submissionData,
      id: `sub-${Date.now()}`,
    };
    setSubmissions((prev) => [created, ...prev]);

    // Update student's completedExams count & recalculate average
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === created.studentId) {
          const newCompleted = s.completedExams + 1;
          const newAvg = Number(((s.averageScore * s.completedExams + created.score) / newCompleted).toFixed(1));
          return {
            ...s,
            completedExams: newCompleted,
            averageScore: newAvg,
          };
        }
        return s;
      })
    );

    // Log activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      user: created.studentName,
      role: 'Học sinh',
      action: 'Nộp bài thi thành công',
      detail: `Đạt ${created.score}/${created.maxScore} điểm trong bài "${created.examTitle}"`,
      timeAgo: 'Vừa xong',
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleResetData = () => {
    setClasses(INITIAL_CLASSES);
    setStudents(INITIAL_STUDENTS);
    setQuestions(INITIAL_QUESTIONS);
    setMatrices(INITIAL_MATRICES);
    setExams(INITIAL_EXAMS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setActivities(INITIAL_ACTIVITY_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onNavigateToSection={(sec) => setCurrentSection(sec as SectionKey)}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Body Layout: Sidebar + Workspace */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
          userRole={currentUser.role}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        {/* Center Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {currentSection === 'overview' && (
            <OverviewView
              currentUser={currentUser}
              classes={classes}
              students={students}
              questions={questions}
              exams={exams}
              submissions={submissions}
              activities={activities}
              onNavigate={(sec) => setCurrentSection(sec)}
            />
          )}

          {currentSection === 'classes' && (
            <ClassesView
              classes={classes}
              students={students}
              onAddClass={handleAddClass}
              onAddStudent={handleAddStudent}
            />
          )}

          {currentSection === 'questions' && (
            <QuestionsView
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
            />
          )}

          {currentSection === 'matrix' && (
            <MatrixView
              matrices={matrices}
              onUpdateMatrix={handleUpdateMatrix}
              onNavigate={(sec) => setCurrentSection(sec)}
            />
          )}

          {currentSection === 'exam-builder' && (
            <ExamBuilderView
              questions={questions}
              classes={classes}
              onSaveExam={handleSaveExam}
              onNavigateToVault={() => setCurrentSection('exam-vault')}
            />
          )}

          {currentSection === 'exam-vault' && (
            <ExamVaultView
              exams={exams}
              classes={classes}
              onNavigate={(sec) => setCurrentSection(sec)}
            />
          )}

          {currentSection === 'online-exam' && (
            <OnlineExamView
              currentUser={currentUser}
              exams={exams}
              questions={questions}
              onSubmitExam={handleSubmitExam}
            />
          )}

          {currentSection === 'proctoring' && (
            <ProctoringView
              students={students}
              submissions={submissions}
              exams={exams}
            />
          )}

          {currentSection === 'grading' && (
            <GradingView
              submissions={submissions}
              exams={exams}
            />
          )}

          {currentSection === 'learning-path' && (
            <LearningPathView
              onNavigate={(sec) => setCurrentSection(sec)}
            />
          )}

          {currentSection === 'math-lab' && (
            <MathLabView
              catalog={MATH_LAB_CURRICULUM_CATALOG}
            />
          )}

          {currentSection === 'math-treasure' && (
            <MathTreasureView />
          )}

          {currentSection === 'minigame' && (
            <MinigameView
              classes={classes}
              students={students}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              onResetData={handleResetData}
            />
          )}

          {/* Footer Component */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
