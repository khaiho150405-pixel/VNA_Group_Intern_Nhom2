/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {},
  webpack: (config) => {
    config.output.hashFunction = 'xxhash64';
    return config;
  }
};

export default nextConfig;
