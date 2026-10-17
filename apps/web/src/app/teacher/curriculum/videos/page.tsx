'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SceneScript {
  sceneNumber: number;
  slideTitle: string;
  slideVisualPrompt: string;
  ttsScript: string;
  durationSeconds: number;
}

interface VideoProject {
  id: string;
  title: string;
  level: 'slides_tts' | 'avatar';
  targetLesson: string;
  totalDurationSeconds: number;
  status: 'scripting' | 'script_review' | 'rendering' | 'video_review' | 'published';
  scriptApprovedBy?: string | null;
  scriptApprovedAt?: string | null;
  renderedVideoUrl?: string;
  scenes: SceneScript[];
}

export default function VideoCurriculumPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoProject>({
    id: 'vid-001',
    title: 'Unit 1 Lesson 1.2: Thì Hiện Tại Đơn và Thói Quen Hàng Ngày',
    level: 'slides_tts',
    targetLesson: 'Lesson 1.2: Present Simple for Routines & Habits',
    totalDurationSeconds: 480, // 8 phút <= 10 phút (TC-075)
    status: 'script_review',
    scriptApprovedBy: null,
    scriptApprovedAt: null,
    scenes: [
      {
        sceneNumber: 1,
        slideTitle: 'Giới thiệu bài học & Khởi động',
        slideVisualPrompt: 'Illustration of morning clock, breakfast table with tea and cheerful student icon',
        ttsScript:
          'Chào các em học sinh yêu quý! Hôm nay chúng ta sẽ cùng nhau tìm hiểu cách mô tả những hoạt động thường ngày quen thuộc bằng thì Hiện tại đơn.',
        durationSeconds: 90,
      },
      {
        sceneNumber: 2,
        slideTitle: 'Cấu trúc câu khẳng định & Ngôi thứ ba số ít (he/she/it)',
        slideVisualPrompt: 'Comparison grammar formula card: S + V(s/es) with highlighted bold letters',
        ttsScript:
          'Chú ý quy tắc thêm S hoặc ES đối với ngôi thứ ba số ít như he, she hoặc it. Ví dụ: He washes his face every morning.',
        durationSeconds: 150,
      },
      {
        sceneNumber: 3,
        slideTitle: 'Luyện tập tình huống thực tế qua đoạn hội thoại mẫu',
        slideVisualPrompt: 'Comic strip dialogue bubble: "What time do you usually wake up?"',
        ttsScript:
          'Bây giờ, chúng ta cùng lắng nghe đoạn hội thoại ngắn giữa Alex và Mai về lịch trình sinh hoạt cuối tuần nhé.',
        durationSeconds: 140,
      },
      {
        sceneNumber: 4,
        slideTitle: 'Tổng kết & Bài tập ứng dụng về nhà',
        slideVisualPrompt: 'Summary checklist with 3 key takeaway bullet points and star icons',
        ttsScript:
          'Các em hãy ghi nhớ quy tắc biến đổi động từ và hoàn thành 5 câu luyện tập trên ứng dụng CoreLink nhé. Hẹn gặp lại các em!',
        durationSeconds: 100,
      },
    ],
  });

  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const handleApproveScript = () => {
    setSelectedVideo((prev) => ({
      ...prev,
      scriptApprovedBy: 'Trưởng bộ môn (lead_teacher_01)',
      scriptApprovedAt: new Date().toLocaleTimeString('vi-VN'),
      status: 'video_review',
    }));
  };

  const handleStartRender = () => {
    // TC-075 check: Không thể render nếu kịch bản chưa duyệt
    if (!selectedVideo.scriptApprovedBy) {
      alert('⛔ LỖI BẢO VỆ CHẤT LƯỢNG (TC-075):\nKịch bản chưa được Trưởng bộ môn phê duyệt! Vui lòng nhấn "Duyệt kịch bản" trước khi tiến hành dựng video.');
      return;
    }

    setIsRendering(true);
    setRenderProgress(10);
    setSelectedVideo((prev) => ({ ...prev, status: 'rendering' }));

    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          setSelectedVideo((old) => ({
            ...old,
            status: 'video_review',
            renderedVideoUrl: 'https://corelink.edu.vn/cdn/videos/unit1_lesson1_2_tts.mp4',
          }));
          alert('🎉 Quá trình dựng video bài giảng Slides + TTS hoàn tất (Chuẩn hóa <= 10 phút)!');
          return 100;
        }
        return prev + 30;
      });
    }, 600);
  };

  const handlePublishVideo = () => {
    setSelectedVideo((prev) => ({ ...prev, status: 'published' }));
    alert('✅ Video bài giảng đã được xuất bản chính thức vào thư viện khóa học!');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs > 0 ? secs + ' giây' : ''}`;
  };

  const activeScene = selectedVideo.scenes[currentSceneIdx];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <Link href="/teacher/curriculum" className="hover:underline">
                Giáo trình M05
              </Link>
              <span>/</span>
              <span>Dựng video bài giảng AI</span>
            </div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <span>🎬</span> Video Bài Giảng AI: Kịch Bản & Dựng Phim (TC-075)
            </h1>
            <p className="text-indigo-100 text-xs mt-1">
              Quy trình kiểm soát chất lượng video: AI sinh kịch bản → Trưởng bộ môn duyệt → Dựng video mức 1 (slides_tts ≤ 10 phút) hoặc mức 2 (avatar).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/teacher/curriculum"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              ← Cây giáo trình
            </Link>
            <Link
              href="/teacher/curriculum/suggestions"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              🎯 Đề xuất chuẩn AI
            </Link>
          </div>
        </div>

        {/* Video Pipeline Status Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                  Mức 1: Slides + Voice TTS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                  Thời lượng: {formatDuration(selectedVideo.totalDurationSeconds)} / 10 phút tối đa
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-800">{selectedVideo.title}</h2>
              <p className="text-xs text-slate-500">Gắn với bài học: {selectedVideo.targetLesson}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!selectedVideo.scriptApprovedBy ? (
                <button
                  onClick={handleApproveScript}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>✍️</span> Duyệt Kịch Bản (Trưởng BM)
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span>✓</span> Đã duyệt bởi {selectedVideo.scriptApprovedBy}
                </div>
              )}

              <button
                onClick={handleStartRender}
                disabled={isRendering}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                  !selectedVideo.scriptApprovedBy
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isRendering
                    ? 'bg-indigo-300 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <span>{isRendering ? '⏳' : '⚙️'}</span>
                {isRendering ? `Đang dựng video (${renderProgress}%)...` : 'Dựng Video (Render)'}
              </button>

              {selectedVideo.status === 'video_review' && selectedVideo.renderedVideoUrl && (
                <button
                  onClick={handlePublishVideo}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>🚀</span> Xuất Bản Video
                </button>
              )}

              {selectedVideo.status === 'published' && (
                <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 font-bold text-xs">
                  ★ Đã xuất bản
                </span>
              )}
            </div>
          </div>

          {/* Render Progress Bar */}
          {isRendering && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-xs text-indigo-700 font-bold mb-1">
                <span>Dựng phim AI: Ghép slides, tạo giọng đọc TTS và phụ đề tự động...</span>
                <span>{renderProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Video Editor & Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Preview Player Simulator (6 Cols) */}
          <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-5 shadow-lg flex flex-col justify-between text-white space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-mono flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                PREVIEW BÀI GIẢNG SLIDES + TTS
              </span>
              <span>
                Cảnh {currentSceneIdx + 1} / {selectedVideo.scenes.length}
              </span>
            </div>

            {/* Video Canvas Simulation */}
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-indigo-950 rounded-xl border border-slate-700 p-6 flex flex-col justify-between relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-xs font-bold">
                  CoreLink Video AI
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {formatDuration(activeScene.durationSeconds)}
                </span>
              </div>

              {/* Slide Content Visual */}
              <div className="text-center space-y-3 my-auto">
                <h3 className="text-xl font-black text-amber-300 tracking-wide drop-shadow-md">
                  {activeScene.slideTitle}
                </h3>
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 max-w-sm mx-auto text-xs text-slate-200 italic">
                  🎨 Visual: {activeScene.slideVisualPrompt}
                </div>
              </div>

              {/* Subtitles Overlay */}
              <div className="bg-black/80 backdrop-blur-md p-3 rounded-lg border border-white/10 text-center">
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  🔊 &ldquo;{activeScene.ttsScript}&rdquo;
                </p>
              </div>
            </div>

            {/* Playback Controls & Timeline Scrubber */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                    className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs"
                  >
                    {isPlayingPreview ? '⏸' : '▶'}
                  </button>
                  <span className="font-mono text-[11px]">
                    00:{currentSceneIdx * 90 < 100 ? `0${currentSceneIdx * 90}` : currentSceneIdx * 90} / 08:00
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span>Âm giọng:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold">
                    Vietnamese Female (Giáo viên AI)
                  </span>
                </div>
              </div>

              {/* Scene Timeline Selector */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {selectedVideo.scenes.map((scene, idx) => (
                  <button
                    key={scene.sceneNumber}
                    onClick={() => setCurrentSceneIdx(idx)}
                    className={`p-2 rounded-lg text-left text-xs transition-all border ${
                      currentSceneIdx === idx
                        ? 'bg-indigo-600/40 border-indigo-400 text-white'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <p className="font-bold text-[10px] uppercase truncate">Cảnh {scene.sceneNumber}</p>
                    <p className="text-[11px] font-semibold text-slate-200 truncate">{scene.slideTitle}</p>
                    <span className="text-[10px] text-slate-400">{scene.durationSeconds}s</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Scene Scripts & Slide Prompts Detail (6 Cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>📝</span> Chi Tiết Kịch Bản Cảnh {activeScene.sceneNumber}
                </h3>
                <p className="text-xs text-slate-500">Nội dung slide và kịch bản thuyết minh TTS</p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Thời lượng: {activeScene.durationSeconds}s
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề Slide:</label>
                <input
                  type="text"
                  value={activeScene.slideTitle}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setSelectedVideo((prev) => ({
                      ...prev,
                      scenes: prev.scenes.map((s, idx) =>
                        idx === currentSceneIdx ? { ...s, slideTitle: newTitle } : s,
                      ),
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả hình ảnh đồ họa (Slide Prompt):</label>
                <textarea
                  rows={2}
                  value={activeScene.slideVisualPrompt}
                  onChange={(e) => {
                    const newPrompt = e.target.value;
                    setSelectedVideo((prev) => ({
                      ...prev,
                      scenes: prev.scenes.map((s, idx) =>
                        idx === currentSceneIdx ? { ...s, slideVisualPrompt: newPrompt } : s,
                      ),
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kịch bản đọc thuyết minh (TTS Script & Subtitles):
                </label>
                <textarea
                  rows={4}
                  value={activeScene.ttsScript}
                  onChange={(e) => {
                    const newScript = e.target.value;
                    setSelectedVideo((prev) => ({
                      ...prev,
                      scenes: prev.scenes.map((s, idx) =>
                        idx === currentSceneIdx ? { ...s, ttsScript: newScript } : s,
                      ),
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 flex items-start gap-2">
                <span className="text-base">ℹ️</span>
                <div className="space-y-0.5">
                  <p className="font-bold">Quy chuẩn thời lượng bài giảng (TC-075):</p>
                  <p className="text-indigo-700 text-[11px]">
                    Video bài giảng Mức 1 có tổng thời lượng {formatDuration(selectedVideo.totalDurationSeconds)}. Đảm bảo thời lượng tối đa không vượt quá 10 phút (600 giây) để duy trì sự tập trung tối ưu của học viên.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
