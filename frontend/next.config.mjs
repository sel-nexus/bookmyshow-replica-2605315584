/** Configure server-side API forwarding without exposing a backend host to browsers. */
const nextConfig = {
  async rewrites() {
    const apiServerUrl = process.env.API_SERVER_URL;
    return apiServerUrl ? [{ source: '/api/:path*', destination: `${apiServerUrl}/api/:path*` }] : [];
  }
};

export default nextConfig;
