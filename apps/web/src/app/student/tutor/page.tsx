'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isRefusal?: boolean;
  guidance?: string;
  suggestions?: string[];
}

export default function StudentTutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Xin chào bạn! Mình là Gia sư AI CoreLink. Mình có thể giúp bạn giải đáp ngữ pháp, từ vựng, luyện phát âm và phương pháp giải bài tập tiếng Anh. Hôm nay bạn muốn cùng mình học gì nào?',
      timestamp: '09:00',
      suggestions: [
        'Phân biệt thì Hiện tại đơn và Hiện tại tiếp diễn',
        'Cách dùng các giới từ in, on, at trong tiếng Anh',
        'Luyện phát âm đuôi -ed trong quá khứ',
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isExamMode, setIsExamMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice recording timer (Max 180s = 3 minutes)
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 179) {
            // Tự động chốt và dừng ở mốc 180 giây (TC-094)
            setIsRecording(false);
            handleStopRecording(180);
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStopRecording = (duration: number) => {
    const formattedMinutes = Math.floor(duration / 60);
    const formattedSeconds = duration % 60;
    const timeStr = `${formattedMinutes}:${formattedSeconds < 10 ? '0' : ''}${formattedSeconds}`;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: `🎤 [Đoạn ghi âm bài nói: ${timeStr} ${duration >= 180 ? '(Đạt giới hạn tối đa 3 phút)' : ''}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Tuyệt vời! Mình đã nhận được đoạn nói ${timeStr} của bạn. Phát âm của bạn rất tự nhiên, âm đuôi /s/ và /t/ rất rõ ràng. Để bài nói đạt band điểm CEFR B1 cao hơn, bạn có thể bổ sung thêm các liên từ nối như "Furthermore", "On the other hand" nhé!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsLoading(false);
    }, 1200);

    setRecordingSeconds(0);
  };

  const handleSendMessage = (textToSend?: string) => {
    const message = (textToSend || inputMessage).trim();
    if (!message) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const lower = message.toLowerCase();

    // Mô phỏng TC-096: Kiểm tra xin đáp án bài thi dở
    const isAskingAnswer =
      isExamMode ||
      ['đáp án', 'cho đáp án', 'đáp án câu', 'chọn câu nào', 'kết quả câu'].some((kw) =>
        lower.includes(kw),
      );

    // Mô phỏng TC-096: Kiểm tra câu hỏi ngoài môn tiếng Anh
    const isOffTopic = ['toán', 'vật lý', 'hóa học', 'chính trị', 'bầu cử', 'bitcoin', 'chứng khoán'].some(
      (kw) => lower.includes(kw),
    );

    setTimeout(() => {
      if (isOffTopic) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: 'Gia sư AI CoreLink chỉ hỗ trợ giải đáp các thắc mắc về môn Tiếng Anh (từ vựng, ngữ pháp, phát âm, đọc hiểu). Vui lòng gửi câu hỏi liên quan đến bài học tiếng Anh của bạn nhé! 😊',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRefusal: true,
          },
        ]);
      } else if (isAskingAnswer) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: 'Gia sư AI không thể cung cấp đáp án trực tiếp cho bài kiểm tra chưa nộp. Tuy nhiên, mình có thể hướng dẫn bạn phương pháp suy luận từng bước:',
            guidance:
              'Bước 1: Xác định chủ ngữ của câu là số ít hay số nhiều.\nBước 2: Chú ý các trạng từ chỉ thời gian trong câu (như "every day", "right now", "yesterday") để xác định thì phù hợp.\nBước 3: Loại trừ các phương án sai dạng động từ trước khi chọn đáp án cuối cùng!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRefusal: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `Về câu hỏi của bạn: "${message}":\n\nTrong tiếng Anh, cấu trúc này diễn đạt một thói quen hoặc sự thật hiển nhiên. Bạn cần chú ý chia động từ theo ngôi thứ ba số ít thêm -s hoặc -es. Ví dụ: "She always finishes her homework before 8 PM."`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: [
              'Cho mình thêm 3 ví dụ tương tự',
              'Làm thử một bài tập ngắn về chủ đề này',
            ],
          },
        ]);
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/student"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              ← Quay lại
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md font-bold">
                AI
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Gia sư AI Thông minh
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Trực tuyến
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Hỗ trợ giải đáp step-by-step • Chuẩn khung CEFR/Cambridge
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExamMode(!isExamMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isExamMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isExamMode ? '🔒 Đang làm bài thi (Chặn đáp án)' : '🔓 Chế độ tự do'}
            </button>
            <Link
              href="/student/competency"
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200"
            >
              Biểu đồ năng lực 📊
            </Link>
          </div>
        </div>
      </header>

      {/* Main Chat Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col">
        {/* Banner Kỹ năng yếu gợi ý */}
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <span className="font-semibold text-blue-900">Gợi ý ôn luyện: </span>
              <span className="text-blue-700">
                Kỹ năng Đọc hiểu (Reading) dưới 50% trong 3 bài kiểm tra gần nhất. Bạn có muốn làm 5 câu trắc nghiệm nhanh đã duyệt không?
              </span>
            </div>
          </div>
          <button
            onClick={() => handleSendMessage('Mình muốn luyện tập 5 câu hỏi Reading mức độ A2')}
            className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
          >
            Luyện ngay
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-y-auto space-y-4 mb-4 min-h-[450px] max-h-[60vh]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : m.isRefusal
                    ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-bl-none'
                    : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                {m.isRefusal && (
                  <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-xs mb-1.5">
                    <span>⚠️</span>
                    <span>Quy định hỗ trợ học tập CoreLink</span>
                  </div>
                )}

                <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                {m.guidance && (
                  <div className="mt-3 p-3 bg-white/80 rounded-xl border border-amber-300 text-xs text-slate-700 font-mono whitespace-pre-line">
                    <div className="font-bold text-amber-900 mb-1">💡 Hướng dẫn phương pháp suy luận:</div>
                    {m.guidance}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {/* Suggestions chips */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                  {m.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-xs text-slate-600 transition-all text-left"
                    >
                      {sug} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
              <span>Gia sư AI đang suy nghĩ câu trả lời...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Recording Status Bar (TC-094: 180s limit) */}
        {isRecording && (
          <div className="mb-3 bg-red-50 border border-red-300 rounded-xl p-3 flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <span className="font-bold text-red-700">Đang ghi âm bài nói tiếng Anh...</span>
              <span className="font-mono text-red-900 font-semibold">
                {Math.floor(recordingSeconds / 60)}:
                {recordingSeconds % 60 < 10 ? '0' : ''}
                {recordingSeconds % 60} / 3:00 (Tối đa 180s)
              </span>
            </div>
            <button
              onClick={() => {
                setIsRecording(false);
                handleStopRecording(recordingSeconds);
              }}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all"
            >
              Dừng & Gửi
            </button>
          </div>
        )}

        {/* Input Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isRecording) {
                setIsRecording(false);
                handleStopRecording(recordingSeconds);
              } else {
                setRecordingSeconds(0);
                setIsRecording(true);
              }
            }}
            className={`p-3 rounded-xl transition-all flex items-center justify-center ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Ghi âm bài nói (Tối đa 3 phút)"
          >
            🎤
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Hỏi Gia sư AI về từ vựng, ngữ pháp hoặc cách giải bài tập..."
            className="flex-1 px-4 py-2.5 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
            disabled={isRecording}
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isRecording}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium text-sm transition-all shadow-sm"
          >
            Gửi
          </button>
        </div>
      </main>
    </div>
  );
}
