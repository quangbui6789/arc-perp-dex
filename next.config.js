/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ép hệ thống bỏ qua hoàn toàn mọi lỗi Type check khi build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bỏ qua kiểm tra lỗi định dạng ESLint để không bị ngắt tiến trình
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
