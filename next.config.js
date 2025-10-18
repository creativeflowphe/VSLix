/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cloudinary'],
  },
  bodyParser: {
    sizeLimit: '100mb', // Passa pro teu 60MB
  },
};

module.exports = nextConfig;
