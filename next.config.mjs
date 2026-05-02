/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      new URL('https://picsum.photos/**'),
      new URL('https://*.public.blob.vercel-storage.com/**'),
    ],
  },
};

export default nextConfig;
