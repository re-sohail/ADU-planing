const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [{ source: "/", destination: "/adus", permanent: false }];
  },
};

module.exports = nextConfig;
