import Image from "next/image";
import Link from "next/link";
import { CourseCard } from "@/components/catalog/course-card";
import {
  AwardStarIcon,
  GraduationLadderIcon,
  SparkleIcon,
  SubjectIcon,
  TargetShieldIcon,
  UsersGroupIcon,
} from "@/components/catalog/subject-icons";
import { BridgeArc } from "@/components/layout/brand";
import { ButtonLink } from "@/components/ui/button";
import { listFeaturedCourses, listSubjectsWithCourses } from "@/server/catalog/public";

export const dynamic = "force-dynamic";

const steps = [
  {
    step: "01",
    title: "Đăng ký học thử miễn phí",
    detail: "Để lại thông tin trong 2 phút, không cần tạo tài khoản. Chọn môn học và khối lớp mong muốn.",
  },
  {
    step: "02",
    title: "Tư vấn & Xếp lớp chuẩn năng lực",
    detail: "Giáo vụ liên hệ trao đổi mục tiêu học tập của con, đánh giá trình độ và hẹn lịch buổi học thử phù hợp.",
  },
  {
    step: "03",
    title: "Đồng hành & Theo dõi sát sao",
    detail: "Học sinh học trải nghiệm tại lớp 7–12 bạn. Phụ huynh theo dõi chuyên cần và điểm số trực tiếp trên cổng phụ huynh.",
  },
];

const pillars = [
  {
    icon: AwardStarIcon,
    tag: "10+ NĂM",
    title: "Kinh nghiệm giảng dạy",
    desc: "Đội ngũ thầy cô giàu chuyên môn, phương pháp gợi mở, sát cánh cùng học sinh chinh phục các kỳ thi điểm và chuẩn quốc tế.",
    color: "from-blue-600 to-indigo-700",
  },
  {
    icon: UsersGroupIcon,
    tag: "7–12 HS/LỚP",
    title: "Sĩ số chuẩn vàng",
    desc: "Quy mô lớp nhỏ tối đa 7–12 bạn giúp giáo viên kèm cặp trực tiếp từng em, giải đáp ngay mọi thắc mắc trong giờ học.",
    color: "from-accent to-blue-700",
  },
  {
    icon: TargetShieldIcon,
    tag: "CAM KẾT",
    title: "Chất lượng đầu ra",
    desc: "Lộ trình học tập rõ ràng, kiểm tra đánh giá định kỳ, bảo đảm tiến bộ vững chắc về tư duy và điểm số ở trường.",
    color: "from-indigo-600 to-primary",
  },
  {
    icon: GraduationLadderIcon,
    tag: "LIÊN CẤP",
    title: "Tiền TH đến THPT",
    desc: "Chương trình chuẩn quốc tế từ Tiền tiểu học, Tiểu học, THCS đến ôn thi vào 10 và kỳ thi THPT Quốc gia.",
    color: "from-primary to-primary-strong",
  },
];

// FR-001: chỉ hiển thị môn/khóa đã xuất bản.
export default async function HomePage() {
  const [subjects, featured] = await Promise.all([listSubjectsWithCourses(), listFeaturedCourses(3)]);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO SHOWCASE VỚI BANNER CHÍNH THỨC */}
      <section aria-labelledby="gioi-thieu" className="relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Tagline thương hiệu */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/80 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs backdrop-blur-xs">
            <SparkleIcon className="size-3.5 text-accent animate-pulse" />
            <span>HỌC VIỆN ĐÀO TẠO &amp; LUYỆN THI CHUẨN QUỐC TẾ</span>
          </div>

          {/* Tiêu đề chính */}
          <h1 id="gioi-thieu" className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-[1.18]">
            Trung tâm đào tạo &amp; luyện thi <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Toán – Văn – Anh các cấp
            </span>
          </h1>

          {/* Mô tả ngắn */}
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg sm:leading-relaxed">
            Đồng hành cùng học sinh từ Tiền tiểu học đến THPT với quy mô lớp nhỏ 7–12 học sinh, giáo viên theo sát từng buổi học và phụ huynh dễ dàng theo dõi chuyên cần, điểm số trực tuyến.
          </p>

          {/* Nút hành động */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
            <ButtonLink href="/dang-ky-hoc-thu" size="md" variant="primary" className="btn-shimmer shadow-md active:scale-95">
              <span>Đăng ký học thử miễn phí</span>
              <span aria-hidden="true">→</span>
            </ButtonLink>
            <ButtonLink href="/khoa-hoc" size="md" variant="secondary" className="active:scale-95">
              Xem danh mục khóa học
            </ButtonLink>
          </div>

          {/* Cam kết nhanh */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Học thử miễn phí 100%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Kiểm tra &amp; xếp lớp chuẩn trình độ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Báo cáo chuyên cần từng buổi
            </span>
          </div>
        </div>

        {/* Khung trưng bày Banner chính thức với hiệu ứng viền sáng và huy hiệu nổi */}
        <div className="mt-10 sm:mt-12">
          <div className="banner-glow-frame relative mx-auto max-w-5xl overflow-hidden rounded-2xl sm:rounded-3xl border border-line bg-surface shadow-xl group">
            {/* Ảnh banner chính thức của Core Link Academy */}
            <Image
              src="/brand/banner.png"
              alt="Core Link Academy - Trung tâm đào tạo và luyện thi Toán Văn Anh các cấp chuẩn quốc tế"
              width={1200}
              height={480}
              priority
              className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.01]"
            />

            {/* Huy hiệu nổi 1: 10+ năm kinh nghiệm */}
            <div className="animate-float absolute bottom-4 left-4 hidden sm:flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
                10+
              </span>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-ink">Năm Kinh Nghiệm</p>
                <p className="text-[11px] text-muted">Giảng dạy &amp; luyện thi</p>
              </div>
            </div>

            {/* Huy hiệu nổi 2: Tối đa 7-12 học sinh */}
            <div className="animate-float-delayed absolute top-4 right-4 hidden sm:flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-xs font-bold">
                7–12
              </span>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-ink">Học sinh / lớp</p>
                <p className="text-[11px] text-muted">Theo sát từng em</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TỨ TRỤ CHẤT LƯỢNG (GIÁ TRỊ TỪ BANNER) */}
      <section aria-labelledby="gia-tri-cot-loi" className="space-y-6">
        <div className="text-center">
          <h2 id="gia-tri-cot-loi" className="text-2xl sm:text-3xl font-bold text-ink">
            Vì sao phụ huynh tin chọn Core Link Academy?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-xl mx-auto">
            Môi trường học tập kỷ luật, chuyên nghiệp và truyền cảm hứng giúp học sinh phát triển toàn diện cả tư duy và điểm số.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.tag}
                className="card-interactive group relative flex flex-col justify-between rounded-block border border-line bg-surface p-5 sm:p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-brand-tint text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Icon className="size-6" />
                    </span>
                    <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-accent">
                      {p.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    {p.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 text-xs font-medium text-primary flex items-center gap-1">
                  <span>Tiêu chuẩn chất lượng</span>
                  <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CÁC MÔN ĐANG GIẢNG DẠY */}
      {subjects.length > 0 && (
        <section aria-labelledby="mon-hoc" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="mon-hoc" className="text-2xl sm:text-3xl font-bold text-ink">
                Các môn đang giảng dạy
              </h2>
              <p className="mt-1 text-sm text-muted">
                Chương trình bám sát sách giáo khoa kết hợp mở rộng nâng cao theo chuẩn quốc tế.
              </p>
            </div>
            <Link href="/khoa-hoc" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              <span>Xem tất cả môn</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/khoa-hoc?mon=${s.slug}`}
                  className="card-interactive group flex h-full flex-col justify-between rounded-block border border-line bg-surface p-5 no-underline transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <SubjectIcon slug={s.slug} className="size-6" />
                      </span>
                      <span className="rounded-[6px] bg-brand-tint px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {s._count.courses} khóa học
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-ink group-hover:text-primary transition-colors">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                      {s.description || `Chương trình đào tạo ${s.name} liên cấp từ cơ bản đến nâng cao.`}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary pt-3 border-t border-line/60">
                    <span>Xem lộ trình môn học</span>
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. KHÓA HỌC NỔI BẬT */}
      {featured.length > 0 && (
        <section aria-labelledby="khoa-noi-bat" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                TUYỂN SINH MỚI
              </div>
              <h2 id="khoa-noi-bat" className="mt-2 text-2xl sm:text-3xl font-bold text-ink">
                Khóa học nổi bật
              </h2>
            </div>
            <ButtonLink href="/khoa-hoc" variant="secondary" size="sm">
              Tất cả khóa học ({featured.length}+)
            </ButtonLink>
          </div>
          <ul className="grid gap-5 md:grid-cols-3">
            {featured.map((c) => (
              <li key={c.id}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. CỔNG HỌC TẬP & PHỤ HUYNH CHUYÊN DỤNG */}
      <section aria-labelledby="cong-thong-tin" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">HỆ SINH THÁI SỐ TOÀN DIỆN</p>
          <h2 id="cong-thong-tin" className="mt-2 text-2xl sm:text-3xl font-bold text-ink">
            Đồng hành cùng phụ huynh và học sinh mỗi ngày
          </h2>
          <p className="mt-2 text-sm text-muted">
            Không còn nỗi lo con đi học thế nào hay bài tập ra sao — toàn bộ quá trình được số hóa minh bạch.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="card-interactive rounded-block border border-line bg-surface p-6 flex flex-col justify-between">
            <div>
              <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-lg font-bold">
                📱
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">Cổng Phụ Huynh Tiện Lợi</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Xem lịch học tuần của con, tỷ lệ chuyên cần sau từng buổi, điểm số và nhận xét bài tập của thầy cô ngay trên điện thoại.
              </p>
            </div>
            <p className="mt-4 pt-3 border-t border-line/60 text-xs font-semibold text-emerald-700">
              Minh bạch • Cập nhật tức thì
            </p>
          </div>

          <div className="card-interactive rounded-block border border-line bg-surface p-6 flex flex-col justify-between">
            <div>
              <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-accent text-lg font-bold">
                ✍️
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">Luyện Bài Tập Trực Tuyến</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Học sinh làm bài trắc nghiệm và tự luận với hệ thống chấm điểm khách quan, xem lại đáp án và lời giải chi tiết sau khi công bố.
              </p>
            </div>
            <p className="mt-4 pt-3 border-t border-line/60 text-xs font-semibold text-accent">
              3 dạng câu hỏi • Chấm tự động
            </p>
          </div>

          <div className="card-interactive rounded-block border border-line bg-surface p-6 flex flex-col justify-between">
            <div>
              <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-primary text-lg font-bold">
                ⏱️
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">Điểm Danh &amp; Cảnh Báo Sớm</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Giáo viên điểm danh trong 30 giây. Hệ thống tự động cảnh báo khi học sinh vắng 2 buổi liên tiếp để giáo vụ kịp thời hỗ trợ.
              </p>
            </div>
            <p className="mt-4 pt-3 border-t border-line/60 text-xs font-semibold text-primary">
              Theo sát 100% học sinh
            </p>
          </div>
        </div>
      </section>

      {/* 6. LỘ TRÌNH 3 BƯỚC BẮT ĐẦU */}
      <section aria-labelledby="quy-trinh" className="rounded-block border border-line bg-surface p-6 sm:p-10 shadow-xs">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">QUY TRÌNH TINH GỌN</p>
          <h2 id="quy-trinh" className="mt-1 text-2xl sm:text-3xl font-bold text-ink">
            Bắt đầu trải nghiệm học tập cùng Core Link
          </h2>
          <p className="mt-2 text-sm text-muted">
            Chỉ với 3 bước đơn giản để con được đánh giá đúng năng lực và tham gia buổi học thử tại học viện.
          </p>
        </div>

        <ol className="mt-8 grid gap-6 md:grid-cols-3 relative">
          {steps.map((s) => (
            <li key={s.step} className="card-interactive relative rounded-block border border-line/80 bg-paper/60 p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-white shadow-xs">
                  {s.step}
                </span>
                <span className="text-xs font-semibold text-primary uppercase">Bước {parseInt(s.step, 10)}</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{s.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-4 pt-4 border-t border-line/80">
          <ButtonLink href="/dang-ky-hoc-thu" size="md" variant="primary" className="btn-shimmer active:scale-95">
            Đăng ký học thử miễn phí ngay
          </ButtonLink>
          <span className="text-xs text-muted">
            Hoặc liên hệ giáo vụ để được giải đáp thắc mắc trực tiếp.
          </span>
        </div>
      </section>

      {/* 7. CTA BANNER CUỐI TRANG VỚI HỌA TIẾT VÒM CẦU */}
      <section
        aria-labelledby="cta-cuoi-trang"
        className="on-brand relative overflow-hidden rounded-block bg-gradient-to-r from-primary via-primary-strong to-[#0e1952] px-6 py-12 sm:px-12 sm:py-16 text-center shadow-xl"
      >
        <BridgeArc className="pointer-events-none absolute -bottom-10 left-1/2 w-[720px] -translate-x-1/2 text-white/10" />
        <div className="relative mx-auto max-w-2xl space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-brand-muted">
            KHỞI ĐẦU HÀNH TRÌNH TỰ TIN
          </p>
          <h2 id="cta-cuoi-trang" className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            Sẵn sàng để con bứt phá điểm số cùng Core Link Academy?
          </h2>
          <p className="text-sm sm:text-base text-on-brand-muted leading-relaxed">
            Đăng ký buổi học thử hoàn toàn miễn phí để con trải nghiệm mô hình lớp 7–12 học sinh, giáo viên tận tâm và phương pháp học tập chuẩn quốc tế.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/dang-ky-hoc-thu" size="md" variant="inverse" className="shadow-md active:scale-95">
              Đăng ký học thử ngay
            </ButtonLink>
            <ButtonLink href="/khoa-hoc" size="md" variant="outline-inverse" className="active:scale-95">
              Khám phá khóa học
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
