import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  session: false,
  devToolbar: { enabled: false },
  adapter: cloudflare({ imageService: 'compile' }),
  security: { checkOrigin: true },
});
