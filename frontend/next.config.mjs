/** Configure development-only API forwarding without exposing a backend host to browsers. */
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      const apiServerUrl = process.env.API_SERVER_URL;
      return apiServerUrl ? [{ source: '/api/:path*', destination: `${apiServerUrl}/api/:path*` }] : [];
    }
    return [];
  }
};

export default nextConfig;
