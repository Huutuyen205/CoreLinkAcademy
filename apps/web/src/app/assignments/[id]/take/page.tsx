'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';

interface QuestionItem {
  assignmentQuestionId: string;
  sortOrder: number;
  points: number;
  question: {
    id: string;
    type: string;
    stem: string;
    options?: any;
    skill: string;
    difficulty: number;
  };
}

interface AssignmentData {
  id: string;
  title: string;
  kind: string;
  instructions?: string;
  timeLimitMin?: number;
  questions: QuestionItem[];
}

export default function TakeAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;
  const router = useRouter();

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User responses state: { [questionId]: any }
  const [responses, setResponses] = useState<{ [qId: string]: any }>({});
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [isOnline, setIsOnline] = useState(true);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [tabLeaves, setTabLeaves] = useState(0);

  const responsesRef = useRef(responses);
  responsesRef.current = responses;

  useEffect(() => {
    initExam();

    // Listen to network status
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSave();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track tab leaves (FR-612)
    const handleVisibility = () => {
      if (document.hidden) {
        setTabLeaves((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [assignmentId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeftSeconds === null) return;
    if (timeLeftSeconds <= 0) {
      handleAutoSubmitTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  // Periodic Auto-save every 10 seconds (TC-081, FR-605)
  useEffect(() => {
    if (!attemptId) return;

    const interval = setInterval(() => {
      triggerAutoSave();
    }, 10000);

    return () => clearInterval(interval);
  }, [attemptId]);

  const initExam = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

      // 1. Fetch assignment details
      const asgRes = await fetch(`/api/v1/assessment/assignments/${assignmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!asgRes.ok) throw new Error('Không tải được đề thi');
      const asgData: AssignmentData = await asgRes.json();
      setAssignment(asgData);

      // Set timer if time limit exists
      if (asgData.timeLimitMin) {
        setTimeLeftSeconds(asgData.timeLimitMin * 60);
      }

      // 2. Start or resume attempt
      const attemptRes = await fetch(`/api/v1/assessment/assignments/${assignmentId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (attemptRes.ok) {
        const attData = await attemptRes.json();
        setAttemptId(attData.id);

        // Load offline cached answers from localStorage/IndexedDB if available
        const localKey = `offline_answers_${attData.id}`;
        const cached = localStorage.getItem(localKey);
        if (cached) {
          try {
            setResponses(JSON.parse(cached));
          } catch {}
        }
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khởi tạo bài làm');
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (qId: string, val: any) => {
    setResponses((prev) => {
      const updated = { ...prev, [qId]: val };
      if (attemptId) {
        localStorage.setItem(`offline_answers_${attemptId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const triggerAutoSave = async () => {
    if (!attemptId) return;
    const currentResponses = responsesRef.current;
    const answersPayload = Object.keys(currentResponses).map((qId) => ({
      questionId: qId,
      response: currentResponses[qId],
    }));

    if (answersPayload.length === 0) return;

    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    try {
      setSyncStatus('saving');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/assessment/attempts/${attemptId}/answers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers: answersPayload }),
      });
      if (res.ok) {
        setSyncStatus('synced');
      }
    } catch {
      setSyncStatus('offline');
    }
  };

  const handleAutoSubmitTimeout = async () => {
    alert('Hết giờ làm bài! Hệ thống đang tự động nộp bài làm của bạn.');
    await handleSubmit('timeout');
  };

  const handleSubmit = async (submitMode: 'manual' | 'timeout' = 'manual') => {
    if (submitting || !attemptId) return;

    if (submitMode === 'manual') {
      const confirmSubmit = window.confirm('Bạn có chắc chắn muốn nộp bài thi không?');
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      // Lưu nháp lần cuối
      await triggerAutoSave();

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/assessment/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ submitMode, tabLeaves }),
      });

      if (res.ok) {
        localStorage.removeItem(`offline_answers_${attemptId}`);
        router.push(`/assignments/${assignmentId}/results`);
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi nộp bài');
        setSubmitting(false);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi nộp bài');
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !assignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-slate-600 font-medium animate-pulse">Đang nạp đề thi & chuẩn bị phòng thi...</div>
      </div>
    );
  }

  const currentQ = assignment.questions[currentIndex];
  const qData = currentQ?.question;
  const currentResp = qData ? responses[qData.id] : undefined;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Exam Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
            Màn hình S14
          </span>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
            {assignment.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Sync indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500'
                  : syncStatus === 'saving'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-600">
              {syncStatus === 'synced'
                ? 'Đã lưu nháp'
                : syncStatus === 'saving'
                ? 'Đang lưu...'
                : 'Mất mạng (Lưu offline)'}
            </span>
          </div>

          {/* Countdown Clock */}
          {timeLeftSeconds !== null && (
            <div
              className={`px-3 py-1.5 rounded-xl font-mono text-sm font-bold flex items-center gap-1.5 border ${
                timeLeftSeconds < 300
                  ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimer(timeLeftSeconds)}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={() => handleSubmit('manual')}
            disabled={submitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-xl text-sm shadow transition"
          >
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ && qData && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Question Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-indigo-600">
                    Câu hỏi {currentIndex + 1} / {assignment.questions.length}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-semibold">
                    {qData.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {currentQ.points} điểm
                </span>
              </div>

              {/* Stem / Content */}
              <div className="text-base text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
                {qData.stem}
              </div>

              {/* Specific Question Renderers */}
              <div className="pt-2">
                {/* 1. Single Choice & 3. True / False */}
                {(qData.type === 'single_choice' || qData.type === 'true_false') && (
                  <div className="space-y-3">
                    {(qData.options || [
                      { id: 'true', text: 'Đúng (True)' },
                      { id: 'false', text: 'Sai (False)' },
                    ]).map((opt: any, i: number) => {
                      const optId = opt.id ?? String(i);
                      const isSelected = currentResp?.selected === optId;
                      return (
                        <button
                          key={optId}
                          type="button"
                          onClick={() => updateResponse(qData.id, { selected: optId })}
                          className={`w-full text-left p-4 rounded-xl border transition flex items-center gap-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-400'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <span>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Multiple Choice */}
                {qData.type === 'multi_choice' && (
                  <div className="space-y-3">
                    {(qData.options || []).map((opt: any, i: number) => {
                      const optId = opt.id ?? String(i);
                      const selectedList: string[] = currentResp?.selected || [];
                      const isSelected = selectedList.includes(optId);

                      const toggle = () => {
                        const next = isSelected
                          ? selectedList.filter((x) => x !== optId)
                          : [...selectedList, optId];
                        updateResponse(qData.id, { selected: next });
                      };

                      return (
                        <button
                          key={optId}
                          type="button"
                          onClick={toggle}
                          className={`w-full text-left p-4 rounded-xl border transition flex items-center gap-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-400'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <span>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 4. Fill in the blank */}
                {qData.type === 'fill_blank' && (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-medium">Nhập câu trả lời của bạn:</label>
                    <input
                      type="text"
                      value={currentResp?.text || ''}
                      onChange={(e) => updateResponse(qData.id, { text: e.target.value })}
                      placeholder="Gõ từ hoặc cụm từ điền vào chỗ trống..."
                      className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                    />
                  </div>
                )}

                {/* 5. Matching (Nối cặp) */}
                {qData.type === 'matching' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">Ghép mỗi mục ở Cột A với mục tương ứng ở Cột B:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {qData.options?.pairs?.map((p: any, idx: number) => {
                        const currentVal =
                          (currentResp?.pairs || []).find((x: any) => x.left === p.left)?.right || '';

                        return (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <span className="text-sm font-semibold text-slate-800">{p.left}</span>
                            <select
                              value={currentVal}
                              onChange={(e) => {
                                const oldPairs = currentResp?.pairs || [];
                                const filtered = oldPairs.filter((x: any) => x.left !== p.left);
                                updateResponse(qData.id, {
                                  pairs: [...filtered, { left: p.left, right: e.target.value }],
                                });
                              }}
                              className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white"
                            >
                              <option value="">-- Chọn đáp án tương ứng --</option>
                              {qData.options?.pairs?.map((optB: any, bIdx: number) => (
                                <option key={bIdx} value={optB.right}>
                                  {optB.right}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Ordering (Sắp xếp) */}
                {qData.type === 'ordering' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">Sắp xếp các mục theo đúng thứ tự (Bấm ▲ hoặc ▼):</p>
                    {(() => {
                      const currentOrder = currentResp?.order || qData.options?.items || [];
                      return (
                        <div className="space-y-2">
                          {currentOrder.map((itemText: string, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl"
                            >
                              <span className="text-sm font-medium text-slate-800">
                                {i + 1}. {itemText}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={i === 0}
                                  onClick={() => {
                                    const next = [...currentOrder];
                                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                    updateResponse(qData.id, { order: next });
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-slate-200 disabled:opacity-30 border rounded text-xs"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={i === currentOrder.length - 1}
                                  onClick={() => {
                                    const next = [...currentOrder];
                                    [next[i + 1], next[i]] = [next[i], next[i + 1]];
                                    updateResponse(qData.id, { order: next });
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-slate-200 disabled:opacity-30 border rounded text-xs"
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 7. Listening */}
                {qData.type === 'listening' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                      <span className="text-2xl">🎧</span>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-indigo-900 block">Đoạn băng nghe:</span>
                        <audio
                          controls
                          src={qData.options?.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}
                          className="w-full mt-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(qData.options?.choices || [
                        { id: 'A', text: 'Lựa chọn A' },
                        { id: 'B', text: 'Lựa chọn B' },
                        { id: 'C', text: 'Lựa chọn C' },
                      ]).map((opt: any) => {
                        const isSelected = currentResp?.selected === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => updateResponse(qData.id, { selected: opt.id })}
                            className={`w-full text-left p-3.5 rounded-xl border transition flex items-center gap-3 ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold text-xs">{opt.id}.</span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 8. Essay */}
                {qData.type === 'essay' && (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-medium">Nhập bài viết luận của bạn:</label>
                    <textarea
                      rows={8}
                      value={currentResp?.text || ''}
                      onChange={(e) => updateResponse(qData.id, { text: e.target.value })}
                      placeholder="Trình bày bài làm chi tiết tại đây..."
                      className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                    />
                  </div>
                )}

                {/* 9. File Upload */}
                {qData.type === 'file_upload' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">Tải lên tệp đính kèm bài làm hoặc ảnh chụp bài viết tay:</p>
                    <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateResponse(qData.id, {
                              fileName: file.name,
                              fileSize: file.size,
                              uploadedAt: new Date().toISOString(),
                            });
                          }
                        }}
                        className="text-sm text-slate-600"
                      />
                      {currentResp?.fileName && (
                        <p className="text-xs font-semibold text-emerald-600">
                          Đã chọn file: {currentResp.fileName} ({(currentResp.fileSize / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-medium rounded-xl text-sm transition"
                >
                  ← Câu trước
                </button>
                <button
                  type="button"
                  disabled={currentIndex === assignment.questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 font-semibold rounded-xl text-sm transition"
                >
                  Câu tiếp theo →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Question Palette Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Danh sách câu hỏi</h3>
            <div className="grid grid-cols-5 gap-2">
              {assignment.questions.map((aq, idx) => {
                const isAnswered = !!responses[aq.question.id];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={aq.question.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition border ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>Đã trả lời ({Object.keys(responses).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                <span>Chưa trả lời ({assignment.questions.length - Object.keys(responses).length})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
