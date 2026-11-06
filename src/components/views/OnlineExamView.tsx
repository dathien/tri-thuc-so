import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  RotateCcw,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { Exam, Question, ExamSubmission, UserProfile } from '../../types';
import MathRenderer from '../MathRenderer';
import { soundService } from '../../utils/audio';

interface OnlineExamViewProps {
  currentUser: UserProfile;
  exams: Exam[];
  questions: Question[];
  onSubmitExam: (submission: Omit<ExamSubmission, 'id'>) => void;
}

export const OnlineExamView: React.FC<OnlineExamViewProps> = ({
  currentUser,
  exams,
  questions,
  onSubmitExam,
}) => {
  const publishedExams = exams.filter((e) => e.status === 'published');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [tabViolations, setTabViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examCompleted, setExamCompleted] = useState<ExamSubmission | null>(null);

  const examQuestions = selectedExam
    ? questions.filter((q) => selectedExam.questionIds.includes(q.id))
    : [];

  const timerRef = useRef<number | null>(null);

  // Start exam session
  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam);
    setTimeLeftSeconds(exam.durationMinutes * 60);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTabViolations(0);
    setExamStarted(true);
    setExamCompleted(null);
    soundService.playSuccess();
  };

  // Timer countdown
  useEffect(() => {
    if (!examStarted || timeLeftSeconds <= 0) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, timeLeftSeconds]);

  // Tab switch monitor
  useEffect(() => {
    if (!examStarted || !selectedExam?.proctoringEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolations((prev) => prev + 1);
        setShowViolationWarning(true);
        soundService.playWarning();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examStarted, selectedExam]);

  const handleSelectOption = (questionId: string, optionLetter: string) => {
    soundService.playClick();
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  const handleAutoSubmit = () => {
    doSubmitExam();
  };

  const doSubmitExam = () => {
    if (!selectedExam) return;

    // Calculate score
    let correctCount = 0;
    examQuestions.forEach((q) => {
      const studentAns = answers[q.id];
      if (studentAns && String(studentAns).toUpperCase() === String(q.correctAnswer).toUpperCase()) {
        correctCount += 1;
      }
    });

    const calculatedScore =
      examQuestions.length > 0
        ? Number(((correctCount / examQuestions.length) * selectedExam.totalPoints).toFixed(2))
        : 0;

    const submissionData: Omit<ExamSubmission, 'id'> = {
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      studentId: currentUser.id,
      studentName: currentUser.name,
      classId: currentUser.classId || 'class-12a1',
      className: '12A1',
      score: calculatedScore,
      maxScore: selectedExam.totalPoints,
      durationSpentMinutes: Math.round(
        (selectedExam.durationMinutes * 60 - timeLeftSeconds) / 60
      ) || 1,
      submittedAt: new Date().toLocaleString('vi-VN'),
      status: 'graded',
      tabViolationsCount: tabViolations,
      answers,
      feedback:
        calculatedScore >= 8
          ? 'Nắm rất vững kiến thức trọng tâm GDPT 2018!'
          : 'Cần ôn tập kỹ hơn các công thức và dạng toán tương tự.',
    };

    onSubmitExam(submissionData);
    setExamCompleted({
      ...submissionData,
      id: `sub-${Date.now()}`,
    });
    setExamStarted(false);
    setShowSubmitModal(false);
    soundService.playSuccess();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Result screen after submitting
  if (examCompleted) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Hoàn thành Bài kiểm tra!
          </h2>
          <p className="text-xs text-slate-500">{examCompleted.examTitle}</p>
        </div>

        {/* Score Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Kết quả bài làm của bạn
          </span>
          <div className="text-4xl font-extrabold text-indigo-900 font-mono">
            {examCompleted.score}{' '}
            <span className="text-sm font-normal text-slate-500">/ {examCompleted.maxScore}</span>
          </div>
          <p className="text-xs text-indigo-700 font-medium">{examCompleted.feedback}</p>
        </div>

        {/* Details Strip */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block">Thời gian làm</span>
            <span className="font-bold text-slate-800">{examCompleted.durationSpentMinutes} phút</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Cảnh báo giám sát</span>
            <span className="font-bold text-slate-800">{examCompleted.tabViolationsCount} lần</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Thời gian nộp</span>
            <span className="font-bold text-slate-800">{examCompleted.submittedAt}</span>
          </div>
        </div>

        {/* Review Answers */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Xem lại chi tiết bài làm
          </h3>

          {examQuestions.map((q, idx) => {
            const studentAns = answers[q.id];
            const isCorrect =
              studentAns && String(studentAns).toUpperCase() === String(q.correctAnswer).toUpperCase();
            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Câu {idx + 1}:</span>
                  <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                    {isCorrect ? 'Chính xác (+0.25đ)' : 'Chưa chính xác (0đ)'}
                  </span>
                </div>
                <div className="text-slate-800">
                  <MathRenderer content={q.content} />
                </div>
                <div className="text-[11px] text-slate-600">
                  Bạn chọn:{' '}
                  <strong className="font-bold text-slate-900">{studentAns || 'Chưa trả lời'}</strong> · Đáp án đúng:{' '}
                  <strong className="font-bold text-emerald-700">{String(q.correctAnswer)}</strong>
                </div>
                {q.explanation && (
                  <div className="mt-1 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <MathRenderer content={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setExamCompleted(null);
              setSelectedExam(null);
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
          >
            Quay lại danh sách bài kiểm tra
          </button>
        </div>
      </div>
    );
  }

  // 2. Active Exam Session
  if (examStarted && selectedExam) {
    const currentQuestion = examQuestions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="space-y-4">
        {/* Tab switch warning banner */}
        {showViolationWarning && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Cảnh báo giám sát thi:</strong> Phát hiện thao tác rời khỏi màn hình làm bài (Lần {tabViolations}). Thông tin này đã được lưu vào nhật ký.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowViolationWarning(false)}
              className="text-amber-800 font-bold ml-2"
            >
              Đã hiểu
            </button>
          </div>
        )}

        {/* Exam Session Top Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 sticky top-18 z-30">
          <div>
            <h2 className="font-bold text-sm text-slate-900">{selectedExam.title}</h2>
            <p className="text-xs text-slate-500">
              Học sinh: <strong className="text-slate-800">{currentUser.name}</strong> · Đã trả lời:{' '}
              <strong className="text-indigo-600 font-mono">{answeredCount} / {examQuestions.length}</strong> câu
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live countdown timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border ${
                timeLeftSeconds < 300
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Nộp bài
            </button>
          </div>
        </div>

        {/* Question Area & Navigator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Question Card (8 cols) */}
          {currentQuestion && (
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  Câu hỏi {currentQuestionIndex + 1} / {examQuestions.length}
                </span>
                <span className="text-slate-400 font-mono">{currentQuestion.points} điểm</span>
              </div>

              {/* Question Text with KaTeX */}
              <div className="text-sm font-medium text-slate-900 leading-relaxed">
                <MathRenderer content={currentQuestion.content} />
              </div>

              {/* Options */}
              {currentQuestion.options && (
                <div className="space-y-2.5 pt-2">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isSelected = answers[currentQuestion.id] === letter;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQuestion.id, letter)}
                        className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold ring-1 ring-indigo-300'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-600'
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="flex-1 min-w-0">
                          <MathRenderer content={opt} inline />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Prev / Next Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                    soundService.playClick();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Câu trước
                </button>

                <button
                  type="button"
                  disabled={currentQuestionIndex === examQuestions.length - 1}
                  onClick={() => {
                    setCurrentQuestionIndex((prev) =>
                      Math.min(examQuestions.length - 1, prev + 1)
                    );
                    soundService.playClick();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
                >
                  Câu tiếp theo
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Question Palette (4 cols) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Danh sách câu hỏi
            </h3>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {examQuestions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      soundService.playClick();
                    }}
                    className={`h-9 rounded-xl font-bold font-mono text-xs transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white shadow-xs'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                <span>Chưa trả lời ({examQuestions.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-600" />
                <span>Đang chọn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận nộp bài thi?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bạn đã trả lời{' '}
                  <strong className="text-slate-900">{answeredCount} / {examQuestions.length}</strong>{' '}
                  câu hỏi. Thời gian còn lại: <strong>{formatTimer(timeLeftSeconds)}</strong>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  onClick={doSubmitExam}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Xác nhận nộp bài
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Exams List to Take
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Kiểm tra Trực tuyến &amp; Phòng thi Số
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100">
              {publishedExams.length} Đề đang mở
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Làm bài kiểm tra trắc nghiệm, hiển thị công thức chuẩn KaTeX, giám sát và chấm điểm tự động.
          </p>
        </div>
      </div>

      {/* Available Exams Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {publishedExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all space-y-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {exam.code}
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Khối {exam.grade} · HK{exam.semester}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Đang mở
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mt-2">{exam.title}</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
              <div>
                <span className="text-[10px] text-slate-400 block">Thời gian</span>
                <span className="font-bold font-mono text-slate-800">{exam.durationMinutes} phút</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Số lượng câu</span>
                <span className="font-bold font-mono text-slate-800">{exam.questionsCount} câu</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Thang điểm</span>
                <span className="font-bold font-mono text-indigo-700">{exam.totalPoints} điểm</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {exam.proctoringEnabled ? 'Có giám sát trực tuyến' : 'Không giám sát'}
              </span>

              <button
                type="button"
                onClick={() => handleStartExam(exam)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Bắt đầu làm bài</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineExamView;
