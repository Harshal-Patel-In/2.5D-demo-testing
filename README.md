# 2.5D Interactive Multiplane Parallax &bull; Dani Gambino

An interactive 2.5D multiplane WebGL diorama built with **React Three Fiber**, **Three.js**, and **PostProcessing**. Features autonomous perspective distance compensation, physical mouse tracking, dynamic camera panning, particle simulations, and a live Framefields-style Studio HUD.

## Features

- **Multiplane 2.5D Depth Stratification:** 7 stratified artwork planes configured along the Z-axis ($Z = 0.0$ to $Z = 50.0$) with physical perspective.
- **Autonomous Responsive Edge-to-Edge Cover:** Automatically calculates viewport coverage (`coverDim = Math.max(vpW, vpH) * 1.08`) with zero black bars on widescreen (16:9), ultrawide (21:9), tablet, or vertical mobile (9:16).
- **Perspective Distance Compensation:** Normalizes each plane by distance from the camera $(Z_{\text{CAM}} - Z_i) / Z_{\text{CAM}}$ so layers align with the composite artwork layout at all depths.
- **Panoramic Cursor Panning:** Smoothly pans across the vertical and horizontal margins as the mouse moves, revealing the full artwork details (top title text, bottom signatures, and lateral scenery).
- **Urban Smoke & Balkan Ash Simulation:** Custom instanced particle system simulating rising thermal cigarette smoke and drifting ash motes.
- **Parallax Studio HUD v2.0:** Glassmorphic real-time tuning overlay:
  - Display Framing toggle: **Cover (Edge-to-Edge)** vs **Fit (Square Art)**
  - Scene Zoom scale ($50\%$ to $160\%$) with mouse wheel support
  - Particle selector: Smoke & Ash, Sakura Petals, Golden Sparks, or Off
  - Focal Plane target ($Z$) and Depth-of-Field bokeh aperture
  - Dynamic Wind Sway amplitude and camera Inertial Damping ($\alpha$)
  - Spatial Pin Annotation tool with auto-sync to `.parallax/notes.json`
  - "Save & Sync with Agent" telemetry sync

## Tech Stack

- **React 18**
- **Vite 5**
- **Three.js**
- **@react-three/fiber**
- **@react-three/drei**
- **postprocessing (Pinned: 6.37.7)**
- **Runtime:** Bun / Node.js

## Getting Started

### Prerequisites

Install [Bun](https://bun.sh/) (recommended) or Node.js (v18+).

### Installation

```bash
bun install
# or
npm install
```

### Development Server

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
bun run build
# or
npm run build
```

## Layer Hierarchy

| Layer | Depth | Role | Content |
| :--- | :--- | :--- | :--- |
| `005.png` | $Z = 0.0$ | `RIGID_STATIC` | Brutalist Concrete Building Facade (Infinite Horizon) |
| `004.png` | $Z = 10.0$ | `RIGID_STATIC` | Gravel Ground & Terrain Base |
| `006.png` | $Z = 18.0$ | `RIGID_STATIC` | Left Framed Painting on Easel |
| `003.png` | $Z = 24.0$ | `RIGID_STATIC` | Blue EU Sign on Chain-link Fence |
| `002.png` | $Z = 32.0$ | `RIGID_STATIC` | **Dani Gambino** on Chair (Hero Focal Plane) |
| `001.png` | $Z = 40.0$ | `RIGID_STATIC` | Yellow Title: *ΤΣΙΓΑΡΑ ΣΤΑ ΒΑЛΚΑΝΙΑ* |
| `000.png` | $Z = 50.0$ | `ORGANIC_COMPLIANT` | Forefront Signatures (*1312*, *Dj The Boy*, *Parental Advisory*, Blood Drips) |

---
*Created with Interactive 2.5D Multiplane Parallax Skill.*
