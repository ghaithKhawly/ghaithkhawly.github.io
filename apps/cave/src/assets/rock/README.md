# Rock textures

Photo-scanned rock from [Poly Haven](https://polyhaven.com), released under
[CC0](https://polyhaven.com/license) (no attribution required; credited anyway).

| File | Source | What was done |
|---|---|---|
| `wall-diff.webp` | [Rock 08](https://polyhaven.com/a/rock_08), diffuse 1k | WebP, quality 82 |
| `wall-normal.webp` | Rock 08, normal (OpenGL) 1k | WebP, quality 80 |
| `wall-height.webp` | Rock 08, displacement 1k (16-bit) | Stretched to the full 0–255 range, 512 px, greyscale WebP, quality 85 |
| `stone-diff.webp` | [Rock Face 03](https://polyhaven.com/a/rock_face_03), diffuse 1k | WebP, quality 75 |
| `stone-normal.webp` | Rock Face 03, normal (OpenGL) 1k | 512 px, WebP, quality 85 |

Rock 08 is smooth, mottled limestone, close to the walls that were painted at
Chauvet and Lascaux; it's the painted wall and the floor. Rock Face 03 is flakier
and darker; it's the cave mouth, the column, the boulders and the hidden chamber.

The height map is read on the CPU so visitor strokes catch on the bumps
(`rockHeight` in `world/scene.ts`).
