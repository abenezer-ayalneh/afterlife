import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
const origin = process.env.PUBLIC_ORIGIN || 'http://localhost:4321';
const url = new URL(origin);
export default defineConfig({
  output: 'server', session: false, devToolbar: { enabled: false },
  adapter: node({ mode: 'standalone', bodySizeLimit: 16384 }),
  security: { checkOrigin: true, allowedDomains: [{ hostname: url.hostname, protocol: url.protocol.slice(0,-1), port: url.port }] },
});
