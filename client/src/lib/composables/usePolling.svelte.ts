// ─────────────────────────────────────────────────────────────────────────────
// usePolling.svelte.ts — Reusable polling composable for Svelte 5.
// Usage: const poll = usePolling(() => fetchDatasheets(), 3000);
//        poll.start(); / poll.stop();
// ─────────────────────────────────────────────────────────────────────────────

export function usePolling(fn: () => Promise<void>, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = $state(false);

  function start() {
    if (timer) return; // already running
    running = true;
    timer = setInterval(async () => {
      try {
        await fn();
      } catch (e) {
        console.error('[usePolling] Error in poll function:', e);
      }
    }, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    running = false;
  }

  return { start, stop, get running() { return running; } };
}
