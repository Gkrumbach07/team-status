/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'issues.redhat.com',
      },
    ],
  },
};

export default nextConfig;
