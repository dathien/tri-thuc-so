import React, { useState, useRef, useEffect } from 'react';
import {
  Dices,
  RotateCw,
  Users,
  Sparkles,
  Trophy,
  CheckCircle2,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, ClassRoom } from '../../types';
import { soundService } from '../../utils/audio';

interface MinigameViewProps {
  classes: ClassRoom[];
  students: Student[];
}

const SECTOR_COLORS = [
  '#4f46e5',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#8b5cf6',
  '#ef4444',
  '#3b82f6',
];

export const MinigameView: React.FC<MinigameViewProps> = ({ classes, students }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [groupCount, setGroupCount] = useState<number>(3);
  const [generatedGroups, setGeneratedGroups] = useState<Student[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) =>
    selectedClass ? s.classId === selectedClass.id : true
  );

  // If there are fewer than 2 students, use fallbacks from class
  const studentNames =
    classStudents.length >= 2
      ? classStudents.map((s) => s.name)
      : ['Nguyễn Văn An', 'Trần Thị Ngọc Bích', 'Lê Minh Cường', 'Phạm Hồng Diễm', 'Hoàng Hải Đăng', 'Vũ Thảo Hương'];

  // Draw wheel on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 15;

    ctx.clearRect(0, 0, width, height);

    const totalSectors = studentNames.length;
    const sectorAngle = (Math.PI * 2) / totalSectors;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotationAngle * Math.PI) / 180);

    studentNames.forEach((name, i) => {
      const startAngle = i * sectorAngle;
      const endAngle = startAngle + sectorAngle;

      // Draw Sector
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = SECTOR_COLORS[i % SECTOR_COLORS.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw Name Text
      ctx.save();
      ctx.rotate(startAngle + sectorAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Plus Jakarta Sans';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 2;
      ctx.fillText(name, radius - 15, 4);
      ctx.restore();
    });

    ctx.restore();

    // Center hub
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4f46e5';
    ctx.stroke();

    // Center icon text
    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 14px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy);

    // Pointer indicator at the right
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(cx + radius + 10, cy);
    ctx.lineTo(cx + radius - 5, cy - 10);
    ctx.lineTo(cx + radius - 5, cy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [rotationAngle, studentNames]);

  // Spin wheel action
  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWinnerName(null);
    soundService.playClick();

    const randomExtraSpins = 5 + Math.random() * 5;
    const targetSector = Math.floor(Math.random() * studentNames.length);
    const sectorAngleDeg = 360 / studentNames.length;
    // Calculate final rotation so arrow lands on targetSector
    const targetDeg = 360 * randomExtraSpins - (targetSector * sectorAngleDeg + sectorAngleDeg / 2);

    let startAngle = rotationAngle % 360;
    const totalRotation = startAngle + targetDeg;
    const durationMs = 3800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (totalRotation - startAngle) * ease;
      setRotationAngle(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winner = studentNames[targetSector];
        setWinnerName(winner);
        soundService.playSuccess();
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Group generator
  const handleGenerateGroups = () => {
    soundService.playClick();
    const shuffled = [...classStudents].sort(() => 0.5 - Math.random());
    const groups: Student[][] = Array.from({ length: groupCount }, () => []);

    shuffled.forEach((student, index) => {
      groups[index % groupCount].push(student);
    });

    setGeneratedGroups(groups);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Minigame Vui nhộn &amp; Vòng quay Gọi tên
            </h1>
            <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              Hoạt động lớp sôi nổi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổ chức gọi tên học sinh ngẫu nhiên lên bảng, bốc thăm câu hỏi và chia nhóm thảo luận tức thì.
          </p>
        </div>

        {/* Class Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Lớp học:</span>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setWinnerName(null);
              soundService.playClick();
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 focus:bg-white focus:outline-none"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.studentCount} HS)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Wheel & Grouping Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Spinning Wheel Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center space-y-5">
          <div className="text-center space-y-1">
            <h2 className="font-bold text-sm sm:text-base text-slate-900">
              Vòng quay gọi tên · {selectedClass?.name}
            </h2>
            <p className="text-xs text-slate-400">
              Kết nối trực tiếp danh sách {studentNames.length} học sinh trong lớp
            </p>
          </div>

          {/* Canvas Wheel */}
          <div className="relative p-2">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="max-w-full aspect-square drop-shadow-md rounded-full"
            />
          </div>

          {/* Spin Trigger Button */}
          <button
            type="button"
            disabled={isSpinning}
            onClick={handleSpin}
            className={`px-8 py-3 rounded-2xl font-bold text-sm text-white shadow-md transition-all active:scale-95 flex items-center gap-2 ${
              isSpinning
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:shadow-lg'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? 'Đang quay...' : 'Quay gọi tên ngẫu nhiên'}
          </button>

          {/* Winner Announcement Card */}
          {winnerName && (
            <div className="w-full max-w-sm p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-center space-y-2 animate-in fade-in zoom-in-95">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                🎉 Học sinh may mắn được gọi lên bảng:
              </span>
              <p className="text-xl font-extrabold text-slate-900">{winnerName}</p>
              <p className="text-[11px] text-slate-500 italic">
                * Lưu ý quy tắc: Không tự động ghi điểm số chỉ từ việc được gọi tên ngẫu nhiên.
              </p>
            </div>
          )}
        </div>

        {/* Right: Team Grouping Tool (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Chia nhóm học tập ngẫu nhiên</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Số lượng nhóm muốn chia:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setGroupCount(count);
                      soundService.playClick();
                    }}
                    className={`px-2.5 py-1 rounded font-bold ${
                      groupCount === count ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateGroups}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Zap className="w-4 h-4" />
              Chia đều {classStudents.length} học sinh thành {groupCount} nhóm
            </button>
          </div>

          {/* Generated Groups Display */}
          {generatedGroups.length > 0 && (
            <div className="space-y-3 pt-2">
              {generatedGroups.map((group, gIdx) => (
                <div key={gIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="text-indigo-700">Nhóm {gIdx + 1} ({group.length} em):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.map((stu) => (
                      <span
                        key={stu.id}
                        className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700"
                      >
                        {stu.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinigameView;
