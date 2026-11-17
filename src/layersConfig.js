// Dani Gambino - ΤΣΙΓΑΡΑ ΣΤΑ ΒΑΛΚΑΝΙΑ Stratified Layers
import bgBuildingUrl from '../anime-wallpaper/005.png'; // [Z = 0.0] Brutalist Concrete Building Facade
import groundUrl from '../anime-wallpaper/004.png';     // [Z = 10.0] Gravel & Ground Foundation
import easelUrl from '../anime-wallpaper/006.png';      // [Z = 18.0] Left Framed Painting
import signUrl from '../anime-wallpaper/003.png';       // [Z = 24.0] Blue EU Sign on Fence
import heroUrl from '../anime-wallpaper/002.png';       // [Z = 32.0] ★ Dani Gambino on Chair (Hero Subject)
import titleUrl from '../anime-wallpaper/001.png';      // [Z = 40.0] Yellow Album Title "ΤΣΙΓΑΡΑ ΣΤΑ ΒΑΛΚΑΝΙΑ"
import overlayUrl from '../anime-wallpaper/000.png';    // [Z = 50.0] Forefront Signatures (1312, Parental Advisory, Blood)

export const PARALLAX_LAYERS = [
  {
    url: bgBuildingUrl,
    file: '005.png',
    materialRole: 'RIGID_STATIC',
    z: 0.0,
    factor: 0.005,
    wiggle: 0.0,
  },
  {
    url: groundUrl,
    file: '004.png',
    materialRole: 'RIGID_STATIC',
    z: 10.0,
    factor: 0.015,
    wiggle: 0.0,
  },
  {
    url: easelUrl,
    file: '006.png',
    materialRole: 'RIGID_STATIC',
    z: 18.0,
    factor: 0.025,
    wiggle: 0.0,
  },
  {
    url: signUrl,
    file: '003.png',
    materialRole: 'RIGID_STATIC',
    z: 24.0,
    factor: 0.032,
    wiggle: 0.0,
  },
  {
    url: heroUrl,
    file: '002.png',
    materialRole: 'RIGID_STATIC',
    z: 32.0, // Primary Focal Point (Dani Gambino)
    factor: 0.045,
    wiggle: 0.0,
  },
  {
    url: titleUrl,
    file: '001.png',
    materialRole: 'RIGID_STATIC',
    z: 40.0,
    factor: 0.055,
    wiggle: 0.0,
  },
  {
    url: overlayUrl,
    file: '000.png',
    materialRole: 'ORGANIC_COMPLIANT',
    z: 50.0,
    factor: 0.070,
    wiggle: 0.25, // Subtle dynamic sway on foreground signatures
  },
];

