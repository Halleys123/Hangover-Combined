// ─────────────────────────────────────────────────────────────────────────────
// useAutoSave.svelte.ts — Debounced auto-save composable for Svelte 5.
// Usage:
//   const save = useAutoSave(() => api.put('/canvas', { nodes, edges }), 2000);
//   save.schedule();  // call on state change
//   save.status      // 'idle' | 'saving' | 'saved'
// ─────────────────────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved';

export function useAutoSave(saveFn: () => Promise<void>, delayMs = 2000) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let status = $state<SaveStatus>('idle');
  let hasUnsavedChanges = $state(false);

  async function flush() {
    try {
      await saveFn();
      status = 'saved';
      hasUnsavedChanges = false;
      setTimeout(() => {
        if (status === 'saved') status = 'idle';
      }, 2000);
    } catch {
      status = 'idle';
    }
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    // Only mark unsaved AFTER scheduling (not on entry, to avoid false positives)
    timer = setTimeout(async () => {
      hasUnsavedChanges = true;
      status = 'saving';
      await flush();
    }, delayMs);
  }

  async function immediate() {
    if (timer) clearTimeout(timer);
    status = 'saving';
    await flush();
  }

  function destroy() {
    if (timer) clearTimeout(timer);
  }

  return {
    schedule,
    immediate,
    destroy,
    get status() { return status; },
    get hasUnsavedChanges() { return hasUnsavedChanges; },
  };
}
