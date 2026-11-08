import type { NextConfig } from 'next';

// The CMS calls /v1 on its own origin and Next forwards it to the BFF, so the BFF needs no
// CORS setup and the browser never learns the BFF address.
const bffUrl = process.env.BFF_URL ?? 'http://localhost:3000';

const config: NextConfig = {
  // contracts ships TypeScript source, so Next has to compile it.
  transpilePackages: ['@libras/contracts'],
  async rewrites() {
    return [{ source: '/v1/:path*', destination: `${bffUrl}/v1/:path*` }];
  },
};

export default config;
