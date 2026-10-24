import * as THREE from 'three';

// Config
export const MP_VER = '0.10.35';
export const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
export const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
export const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

export const SCREEN_H = 2.2;          // height of the "window" (the browser viewport) in world units
export const EYE_D = 3.5;             // default eye distance from the window
export const HEAD_GAIN = 3.2;         // world units of eye travel per unit of face movement in the camera frame
export const WALL_W = 10, WALL_H = 5, WALL_Z = -3.1;
export const FLOOR_Y = -1.35;
export const FIRE = new THREE.Vector3(0, FLOOR_Y + 0.02, -1.45);
export const ART_W = 2048, ART_H = 1024;   // paint layer, maps 1:1 onto the wall UVs
export const SH_W = 1024, SH_H = 512;      // shadow + glow layers (half resolution)
export const SHADOW_MAG = 1.25;
export const HOLD_GESTURE = 0.9, HOLD_PALM = 1.0, HOLD_DWELL = 1.1;
export const COLUMN = { x: -1.8, z: -0.9, bottom: FLOOR_Y - 0.05, height: 3.7 };
export const CRACK = { ax: 1500, ay: 420, halfW: 66, halfH: 120 };   // in paint-layer pixels

export const params = new URLSearchParams(location.search);
// Elements are looked up by id; callers know what kind each one is.
export const $ = (id: string): any => document.getElementById(id);
