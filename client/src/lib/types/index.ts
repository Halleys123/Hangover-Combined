// ─────────────────────────────────────────────────────────────────────────────
// Domain Types — single source of truth for all frontend interfaces.
// Import from here instead of declaring inline in each component.
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

// ── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'in-progress' | 'completed';

export interface Project {
  _id: string;
  name: string;
  description: string;
  components: string[];
  date: string;
  status: ProjectStatus;
  datasheets?: Sheet[];
  canvas?: {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  };
}

// ── Datasheets ────────────────────────────────────────────────────────────────

export type ParseStatus = 'waiting' | 'processing' | 'completed' | 'failed';
export type VerificationStatus = 'unverified' | 'accepted' | 'rejected';

export interface Sheet {
  _id: string;
  name: string;
  size: string;
  parsed: boolean;
  status?: ParseStatus;
  error?: string;
  verificationStatus?: VerificationStatus;
  userNotes?: string;
  uploadedAt: string;
  cogneeConfig: Record<string, unknown> | null;
}

// ── Components / Library ──────────────────────────────────────────────────────

export interface Pin {
  id: string;
  label: string;
  color: string;
}

export type NodeTheme = 'orange' | 'blue';

export interface Diagram {
  theme: NodeTheme;
  pins: {
    left: Pin[];
    right: Pin[];
  };
}

export interface Comp {
  _id: string;
  id?: string;
  category: string;
  name: string;
  description: string;
  diagram: Diagram;
  datasheetId?: string | { _id: string };
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  text: string;
  timestamp: Date | string;
}

export interface Session {
  _id: string;
  title: string;
  updatedAt: string;
}

// ── Canvas ───────────────────────────────────────────────────────────────────

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// ── Canvas Drop Payload ───────────────────────────────────────────────────────

export interface ComponentDragPayload {
  type: string;
  name: string;
  description?: string;
  diagram?: Diagram;
  cogneeConfig?: Record<string, unknown>;
}
