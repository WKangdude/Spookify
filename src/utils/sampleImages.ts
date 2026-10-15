/**
 * Instant client-side sample portrait portraits rendered via SVG data URLs
 * Enables 100% offline, zero-network testing immediately!
 */

export interface SamplePhoto {
  id: string;
  name: string;
  role: string;
  dataUrl: string;
}

function createSampleSvg(headColor: string, hairColor: string, shirtColor: string, accessories: string = ''): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="400" height="480">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <radialGradient id="faceGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stop-color="${headColor}"/>
        <stop offset="100%" stop-color="#d97706"/>
      </radialGradient>
    </defs>
    <rect width="400" height="480" fill="url(#bg)"/>
    
    <!-- Torso / Shoulders -->
    <path d="M110 390 Q200 360 290 390 L340 480 L60 480 Z" fill="${shirtColor}"/>
    <path d="M165 375 Q200 400 235 375 L235 410 Q200 430 165 410 Z" fill="#b45309"/>

    <!-- Neck -->
    <rect x="175" y="270" width="50" height="70" rx="10" fill="${headColor}"/>

    <!-- Head / Face -->
    <ellipse cx="200" cy="200" rx="72" ry="92" fill="url(#faceGrad)"/>

    <!-- Ears -->
    <circle cx="126" cy="205" r="16" fill="${headColor}"/>
    <circle cx="274" cy="205" r="16" fill="${headColor}"/>

    <!-- Hair -->
    <path d="M125 180 Q130 100 200 100 Q270 100 275 180 Q250 120 200 125 Q150 120 125 180 Z" fill="${hairColor}"/>

    <!-- Eyes -->
    <ellipse cx="172" cy="190" rx="9" ry="12" fill="#ffffff"/>
    <circle cx="174" cy="190" r="5" fill="#1e293b"/>
    <circle cx="176" cy="188" r="1.5" fill="#ffffff"/>

    <ellipse cx="228" cy="190" rx="9" ry="12" fill="#ffffff"/>
    <circle cx="226" cy="190" r="5" fill="#1e293b"/>
    <circle cx="228" cy="188" r="1.5" fill="#ffffff"/>

    <!-- Eyebrows -->
    <path d="M160 172 Q174 165 186 172" stroke="${hairColor}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M214 172 Q226 165 240 172" stroke="${hairColor}" stroke-width="4" stroke-linecap="round" fill="none"/>

    <!-- Nose -->
    <path d="M198 195 L194 218 L206 218" stroke="#b45309" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <!-- Smile -->
    <path d="M174 238 Q200 265 226 238" stroke="#78350f" stroke-width="4" stroke-linecap="round" fill="#ffffff"/>
    <path d="M174 238 Q200 252 226 238" stroke="#78350f" stroke-width="2" fill="#ef4444"/>

    <!-- Cheeks -->
    <ellipse cx="152" cy="220" rx="10" ry="7" fill="#f87171" opacity="0.35"/>
    <ellipse cx="248" cy="220" rx="10" ry="7" fill="#f87171" opacity="0.35"/>

    ${accessories}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'sample-alex',
    name: 'Alex (Friend)',
    role: 'Smiling Buddy',
    dataUrl: createSampleSvg('#fcd34d', '#451a03', '#3b82f6')
  },
  {
    id: 'sample-sarah',
    name: 'Sarah (Sister)',
    role: 'Big Smile',
    dataUrl: createSampleSvg(
      '#fed7aa',
      '#991b1b',
      '#ec4899',
      '<circle cx="172" cy="190" r="18" fill="none" stroke="#dc2626" stroke-width="3"/><circle cx="228" cy="190" r="18" fill="none" stroke="#dc2626" stroke-width="3"/><line x1="190" y1="190" x2="210" y2="190" stroke="#dc2626" stroke-width="3"/>'
    )
  },
  {
    id: 'sample-marcus',
    name: 'Marcus (Bro)',
    role: 'Cool Guy',
    dataUrl: createSampleSvg(
      '#e0a96d',
      '#18181b',
      '#10b981',
      '<path d="M175 250 Q200 260 225 250" stroke="#18181b" stroke-width="5" stroke-linecap="round" fill="none"/>'
    )
  }
];
