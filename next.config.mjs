/**
 * Static export for GitHub Pages. NEXT_PUBLIC_BASE_PATH is set in CI to "/<repo>";
 * locally it is empty so the site runs at http://localhost:3000.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};
export default nextConfig;
