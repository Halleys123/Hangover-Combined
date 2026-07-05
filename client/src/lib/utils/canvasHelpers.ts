// ─────────────────────────────────────────────────────────────────────────────
// canvasHelpers.ts — Domain logic for building and managing canvas nodes.
// Extracted from projects/[id]/+page.svelte so it's testable and reusable.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentDragPayload, Pin } from '$lib/types/index.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_LEFT_PINS: Pin[] = [
  { id: 'vcc', label: 'VCC', color: 'red' },
  { id: 'gnd', label: 'GND', color: 'gray' },
];

const DEFAULT_RIGHT_PINS: Pin[] = [
  { id: 'sig', label: 'SIG / DATA', color: 'blue' },
];

const COOLING_LEFT_PINS: Pin[] = [
  { id: 'vcc', label: '(+) RED / VCC', color: 'red' },
  { id: 'gnd', label: '(-) BLACK / GND', color: 'gray' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Detects 2-wire cooling/fan units by keyword-matching component metadata.
 * These components must have exactly two power leads and no signal pins.
 */
export function detectCoolingUnit(data: ComponentDragPayload): boolean {
  const name = (data.name ?? '').toLowerCase();
  const desc = (data.description ?? '').toLowerCase();
  const cls = (
    (data.cogneeConfig?.['Component Classification'] as string) ?? ''
  ).toLowerCase();

  return (
    name.includes('tec') ||
    name.includes('peltier') ||
    name.includes('fhs') ||
    name.includes('cooler') ||
    name.includes('fan') ||
    cls.includes('cooler') ||
    cls.includes('fan') ||
    desc.includes('peltier') ||
    desc.includes('thermoelectric')
  );
}

/**
 * Builds a canvas node from dropped component data.
 * Uses crypto.randomUUID() for collision-safe IDs.
 * Enforces 2-wire layout for cooling hardware.
 */
export function buildNodeFromComponent(
  data: ComponentDragPayload,
  position: { x: number; y: number }
) {
  const is2Wire = detectCoolingUnit(data);

  const leftPins: Pin[] = is2Wire
    ? COOLING_LEFT_PINS
    : Array.isArray(data.diagram?.pins?.left)
      ? data.diagram!.pins.left
      : DEFAULT_LEFT_PINS;

  const rightPins: Pin[] = is2Wire
    ? []
    : Array.isArray(data.diagram?.pins?.right)
      ? data.diagram!.pins.right
      : DEFAULT_RIGHT_PINS;

  return {
    id: crypto.randomUUID(),
    type: data.type || 'hardware',
    position,
    data: {
      label: data.name || 'Component',
      theme: data.diagram?.theme ?? 'blue',
      pins: { left: leftPins, right: rightPins },
    },
  };
}

/** Tracks placement position for click-to-place components, advancing right then down. */
let _placementX = 120;
let _placementY = 120;

export function nextPlacementPosition(): { x: number; y: number } {
  const pos = { x: _placementX, y: _placementY };
  _placementX += 300;
  if (_placementX > 950) {
    _placementX = 120;
    _placementY += 220;
  }
  return pos;
}

export function resetPlacementCursor(): void {
  _placementX = 120;
  _placementY = 120;
}
