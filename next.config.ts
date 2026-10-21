import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Có package-lock.json ở thư mục cha trên máy dev; chốt gốc dự án để Next không đoán sai.
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["@node-rs/argon2"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Logo/banner tĩnh: cho trình duyệt/CDN giữ 1 ngày, dùng bản cũ tới 7 ngày trong lúc tải lại.
      // (Trang động và trang nội bộ vẫn `no-store` mặc định của Next.)
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
    ];
  },
};

export default nextConfig;
