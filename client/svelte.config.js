import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: false,
    }),
    prerender: {
      // Don't crawl — this is a full SPA with a backend; no routes should be prerendered.
      crawl: false,
      entries: [],
    },
  },
};
