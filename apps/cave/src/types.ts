import type * as THREE from 'three';

// A painting on the wall. Built from a layout entry; the rest is filled in at runtime.
export interface Painting {
  id: string;
  kind: string;
  x: number; y: number; w: number; h: number;   // paint-layer pixels
  group: string;
  seed?: number;
  project?: string;
  secret?: string;
  guide?: Guide;              // set on paintings the visitor traced
  canvas?: HTMLCanvasElement;
  glow?: HTMLCanvasElement | null;
  mesh?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  alpha?: number;             // fades while a device steps out of it
  g?: number;                 // glow, 0..1
  boostFrom?: number; boostTo?: number;
}

// A shape to trace in painting mode.
export interface Guide {
  id: string;
  section: string;
  title: string;
  x: number; y: number; w: number; h: number;
  tool: string;
  line: string;
  fillCol?: string;
  eye?: number[];
  shade?: (u: number, v: number) => number;
  stencil?: boolean;
  pts: number[][];
  details?: number[][][];
  samples?: number[][];
  covered?: Uint8Array;
  near?: number;
  inBox?: number;
  done?: boolean;
  hover?: number;
  artPath?: Path2D;
  localPath?: Path2D;
  glowPatch?: { pad: number; K: number; ctx: CanvasRenderingContext2D; tex: THREE.CanvasTexture; mesh: THREE.Mesh };
  final?: { pad: number; W: number; H: number; path: Path2D; fill: HTMLCanvasElement; line: HTMLCanvasElement };
}

export interface Secret {
  id: string;
  title: string;
  where: string;
  seen: number;
  found: boolean;
  need: number;               // how much of it has to be in view, 0..1, to count as found
  foundAt?: number;
  decal?: THREE.Mesh;
  points: () => THREE.Vector3[];
}

// Options shared by the pigment primitives; each reads the ones it needs.
export interface PigmentOpts {
  col?: string; seed?: number; alpha?: number;
  soft?: number; depth?: number; scale?: number; rim?: number; spray?: number;
  shade?: (u: number, v: number) => number;
  w?: number; px?: boolean; closed?: boolean; profile?: 'down'; grain?: number;
  width?: number;
  fade?: number; pits?: number; flakes?: number;
  reach?: number;
}

// Set by the inline script in index.html when the intro is tapped before the cave loads.
export interface EarlyStart {
  choice: 'cam' | 'mouse' | null;
  audio?: AudioContext;
  tilt?: Promise<string>;
  stream?: Promise<MediaStream | { error: unknown }>;
}
declare global {
  interface Window { __early?: EarlyStart; __caveReady?: boolean }
}
