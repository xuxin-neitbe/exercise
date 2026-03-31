/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 启用 standalone 输出模式（Docker 部署必需）
  output: 'standalone',

  // 图片域名配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // 实验性功能
  experimental: {
    // 启用 serverActions（如果需要）
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
