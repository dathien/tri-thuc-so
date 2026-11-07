import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Upload,
  Download,
  GraduationCap,
  Mail,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';
import { ClassRoom, Student } from '../../types';
import { soundService } from '../../utils/audio';

interface ClassesViewProps {
  classes: ClassRoom[];
  students: Student[];
  onAddClass: (newClass: Omit<ClassRoom, 'id' | 'createdAt'>) => void;
  onAddStudent: (newStudent: Omit<Student, 'id'>) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  onAddClass,
  onAddStudent,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<'all' | 10 | 11 | 12>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showImportToast, setShowImportToast] = useState(false);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<10 | 11 | 12>(12);
  const [newClassDescription, setNewClassDescription] = useState('');

  // New Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Nam' | 'Nữ'>('Nam');

  const filteredClasses = classes.filter((c) =>
    selectedGrade === 'all' ? true : c.grade === selectedGrade
  );

  const selectedClass = classes.find((c) => c.id === selectedClassId) || filteredClasses[0];

  const classStudents = students.filter((s) => {
    const matchClass = selectedClass ? s.classId === selectedClass.id : true;
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const roomCode = `MAT-${newClassName.replace(/\s+/g, '').toUpperCase()}`;
    onAddClass({
      name: newClassName.trim(),
      grade: newClassGrade,
      schoolYear: '2025-2026',
      studentCount: 0,
      roomCode,
      homeroomTeacher: 'GV. Hồ Nguyễn Đa Thiện',
      description: newClassDescription || 'Lớp học Toán THPT',
    });

    setNewClassName('');
    setNewClassDescription('');
    setShowAddClassModal(false);
    soundService.playSuccess();
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !selectedClass) return;

    onAddStudent({
      classId: selectedClass.id,
      className: selectedClass.name.split(' ')[1] || selectedClass.name,
      studentCode: newStudentCode || `HS2026${Math.floor(100 + Math.random() * 900)}`,
      name: newStudentName.trim(),
      email: newStudentEmail || `${newStudentCode.toLowerCase()}@edutest.edu.vn`,
      phone: '0987654321',
      gender: newStudentGender,
      averageScore: 8.0,
      completedExams: 0,
      status: 'active',
    });

    setNewStudentName('');
    setNewStudentCode('');
    setNewStudentEmail('');
    setShowAddStudentModal(false);
    soundService.playSuccess();
  };

  const handleExportExcel = () => {
    soundService.playClick();
    // Simulate Excel file download
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Mã học sinh,Họ và tên,Lớp,Giới tính,Email,Điểm trung bình\n' +
      classStudents
        .map((s) => `${s.studentCode},"${s.name}",${s.className},${s.gender},${s.email},${s.averageScore}`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_hoc_sinh_${selectedClass?.name || 'lop'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Quản lý Lớp học &amp; Học sinh
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              {classes.length} Lớp đang mở
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổ chức lớp học, danh sách học sinh, phân quyền giao bài và quản lý kết quả học tập.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Xuất Excel
          </button>

          <button
            type="button"
            onClick={() => {
              setShowImportToast(true);
              soundService.playSuccess();
              setTimeout(() => setShowImportToast(false), 4000);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Nhập từ Excel
          </button>

          <button
            type="button"
            onClick={() => setShowAddClassModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm lớp mới
          </button>
        </div>
      </div>

      {/* Import Toast feedback */}
      {showImportToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Mẫu định dạng Excel chuẩn đã sẵn sàng: Cột (Mã HS, Họ tên, Giới tính, Email, Lớp). Hệ thống hỗ trợ file .xlsx, .csv.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowImportToast(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Grade Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl max-w-fit">
        {(['all', 12, 11, 10] as const).map((grade) => (
          <button
            key={grade}
            type="button"
            onClick={() => {
              setSelectedGrade(grade);
              soundService.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedGrade === grade
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {grade === 'all' ? 'Tất cả các khối' : `Khối ${grade}`}
          </button>
        ))}
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => {
          const isSelected = selectedClass?.id === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => {
                setSelectedClassId(cls.id);
                soundService.playClick();
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                    Khối {cls.grade}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{cls.name}</h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                    {cls.roomCode}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{cls.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  {cls.studentCount} học sinh
                </span>
                <span className="text-slate-400 text-[11px]">{cls.homeroomTeacher}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Roster Table for Selected Class */}
      {selectedClass && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900">
                Danh sách học sinh · {selectedClass.name}
              </h2>
              <p className="text-xs text-slate-500">
                Hiển thị {classStudents.length} học sinh trong danh sách
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên, mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50 w-52"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddStudentModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm học sinh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Mã HS</th>
                  <th className="px-4 py-3">Họ và tên</th>
                  <th className="px-4 py-3">Giới tính</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Điểm TB</th>
                  <th className="px-4 py-3">Bài đã làm</th>
                  <th className="px-4 py-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Không tìm thấy học sinh nào phù hợp
                    </td>
                  </tr>
                ) : (
                  classStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {student.studentCode}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{student.gender}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {student.email}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700 tabular-nums">
                        {student.averageScore.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {student.completedExams} bài
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Đang học
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Tạo Lớp học mới</h3>
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên lớp học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lớp 12A2 - Tự nhiên"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(Number(e.target.value) as 10 | 11 | 12)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value={12}>Khối 12</option>
                  <option value={11}>Khối 11</option>
                  <option value={10}>Khối 10</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả lớp</label>
                <textarea
                  rows={2}
                  placeholder="Mục tiêu giảng dạy và trọng tâm chuyên đề..."
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Xác nhận tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Thêm học sinh vào {selectedClass?.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Tuấn Kiệt"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã học sinh</label>
                  <input
                    type="text"
                    placeholder="Tự sinh nếu bỏ trống"
                    value={newStudentCode}
                    onChange={(e) => setNewStudentCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email học sinh</label>
                <input
                  type="email"
                  placeholder="email@edutest.edu.vn"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Thêm vào danh sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesView;
