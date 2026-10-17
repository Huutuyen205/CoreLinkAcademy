import vi from '../../messages/vi.json';

export default function HomePage() {
  return (
    <main className="flex-1 hero-gradient flex flex-col items-center justify-center p-6 md:p-12 text-center">
      {/* Badge AI */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Hệ thống Đào tạo & AI Thông minh 2026
      </div>

      {/* Hero Title */}
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
        {vi.home.title}
      </h1>

      {/* Hero Subtitle */}
      <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
        {vi.home.subtitle}
      </p>

      {/* CTA Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
        <a
          href="/register-trial"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition duration-200"
        >
          {vi.home.registerTrial}
        </a>
        <a
          href="/placement-test"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass-card hover:bg-slate-800/80 text-slate-200 font-semibold border border-slate-700 transition duration-200"
        >
          {vi.home.placementTest}
        </a>
      </div>

      {/* Feature Highlight Cards */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left">
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-4">
            01
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Đa Vai Trò Tích Hợp</h2>
          <p className="text-sm text-slate-400">
            Một web app PWA thống nhất cho Học sinh, Phụ huynh, Giáo viên và Ban giám trị trên mọi thiết bị.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-4">
            02
          </div>
          <h2 className="text-lg font-bold text-white mb-2">AI Soạn, Người Duyệt</h2>
          <p className="text-sm text-slate-400">
            14 tính năng AI hỗ trợ phân tích giáo trình, soạn đề, chấm bài và nhận xét; giáo viên luôn kiểm soát cuối cùng.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-4">
            03
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Điểm Danh & Báo Cáo Minh Bạch</h2>
          <p className="text-sm text-slate-400">
            Điểm danh QR đổi mỗi buổi, thông báo lập tức phụ huynh và tóm tắt tiến độ tự động lúc 20:00.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-slate-800/80 w-full text-slate-500 text-sm">
        <p>{vi.footer.copyright}</p>
      </footer>
    </main>
  );
}
