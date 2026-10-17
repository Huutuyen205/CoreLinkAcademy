'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-red-500 mb-4">Đã xảy ra lỗi hệ thống</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Hệ thống ghi nhận sự cố tạm thời. Vui lòng thử tải lại hoặc liên hệ hỗ trợ.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700"
      >
        Thử lại
      </button>
    </div>
  );
}
