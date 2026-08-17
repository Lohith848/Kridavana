/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.thegamesdb.net' },
      { protocol: 'https', hostname: 'legacy.thegamesdb.net' }
    ]
  }
};

export default nextConfig;
