'use client';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-black text-blue-500 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-white mb-2">Không tìm thấy trang</h2>
      <p className="text-slate-400 max-w-md mb-8">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <a
        href="/"
        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium"
      >
        Về trang chủ
      </a>
    </div>
  );
}
