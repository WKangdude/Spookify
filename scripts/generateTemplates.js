import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/templates');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 500 x 600 canvas for each template
// Center is x=250. Neck anchor is typically around y=180-200.
// Bold sticker outlines (#1f1235 or #110522), vibrant Halloween colors.

const templates = [
  {
    id: 'chucky',
    name: 'Creepy Chucky',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
      <defs>
        <filter id="sticker-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
        <linearGradient id="overalls" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
        <pattern id="stripes" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
          <rect width="10" height="40" fill="#ef4444"/>
          <rect x="10" width="10" height="40" fill="#3b82f6"/>
          <rect x="20" width="10" height="40" fill="#10b981"/>
          <rect x="30" width="10" height="40" fill="#f59e0b"/>
        </pattern>
      </defs>

      <g filter="url(#sticker-shadow)">
        <!-- Arms with striped shirt -->
        <!-- Left arm -->
        <path d="M190 220 L120 290 Q105 305 115 325 Q130 340 145 320 L205 250 Z" fill="url(#stripes)" stroke="#110522" stroke-width="6" stroke-linejoin="round"/>
        <!-- Left hand (plastic toy dagger) -->
        <circle cx="115" cy="330" r="22" fill="#fbcfe8" stroke="#110522" stroke-width="5"/>
        <path d="M100 320 L60 270 L80 260 L115 310 Z" fill="#94a3b8" stroke="#110522" stroke-width="5"/>
        <path d="M95 315 L125 330" stroke="#b91c1c" stroke-width="6" stroke-linecap="round"/>

        <!-- Right arm -->
        <path d="M310 220 L380 290 Q395 305 385 325 Q370 340 355 320 L295 250 Z" fill="url(#stripes)" stroke="#110522" stroke-width="6" stroke-linejoin="round"/>
        <!-- Right hand -->
        <circle cx="385" cy="330" r="22" fill="#fbcfe8" stroke="#110522" stroke-width="5"/>

        <!-- Torso: Striped long sleeve under overalls -->
        <path d="M185 200 Q250 230 315 200 L330 360 L170 360 Z" fill="url(#stripes)" stroke="#110522" stroke-width="6"/>

        <!-- Overalls bib -->
        <path d="M180 260 L320 260 L335 430 L165 430 Z" fill="url(#overalls)" stroke="#110522" stroke-width="6" stroke-linejoin="round"/>
        <!-- Overall Straps -->
        <path d="M190 205 L215 265 L185 265 L165 205 Z" fill="#1d4ed8" stroke="#110522" stroke-width="5"/>
        <circle cx="200" cy="275" r="10" fill="#dc2626" stroke="#110522" stroke-width="4"/>
        <circle cx="200" cy="275" r="3" fill="#ffffff"/>

        <path d="M310 205 L285 265 L315 265 L335 205 Z" fill="#1d4ed8" stroke="#110522" stroke-width="5"/>
        <circle cx="300" cy="275" r="10" fill="#dc2626" stroke="#110522" stroke-width="4"/>
        <circle cx="300" cy="275" r="3" fill="#ffffff"/>

        <!-- "Good Guys" emblem pocket -->
        <rect x="220" y="295" width="60" height="48" rx="8" fill="#1e40af" stroke="#110522" stroke-width="4"/>
        <path d="M230 315 H270" stroke="#facc15" stroke-width="5" stroke-linecap="round"/>
        <path d="M235 325 H265" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>

        <!-- Legs & Cuffs -->
        <!-- Left Leg -->
        <path d="M165 430 L240 430 L235 520 L160 520 Z" fill="url(#overalls)" stroke="#110522" stroke-width="6"/>
        <rect x="155" y="505" width="85" height="20" rx="4" fill="url(#stripes)" stroke="#110522" stroke-width="4"/>

        <!-- Right Leg -->
        <path d="M260 430 L335 430 L340 520 L265 520 Z" fill="url(#overalls)" stroke="#110522" stroke-width="6"/>
        <rect x="260" y="505" width="85" height="20" rx="4" fill="url(#stripes)" stroke="#110522" stroke-width="4"/>

        <!-- Red High-top Shoes -->
        <path d="M140 540 Q150 520 195 520 Q240 520 245 540 L245 565 Q220 575 145 575 Q135 560 140 540 Z" fill="#dc2626" stroke="#110522" stroke-width="6"/>
        <path d="M145 570 Q195 580 245 570" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>

        <path d="M360 540 Q350 520 305 520 Q260 520 255 540 L255 565 Q280 575 355 575 Q365 560 360 540 Z" fill="#dc2626" stroke="#110522" stroke-width="6"/>
        <path d="M255 570 Q305 580 355 570" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>

        <!-- Collar cutout for neck attachment -->
        <path d="M195 195 C220 215 280 215 305 195 C285 225 215 225 195 195 Z" fill="#b91c1c" stroke="#110522" stroke-width="5"/>
      </g>
    </svg>`
  },
  {
    id: 'mummy',
    name: 'Pharaoh Mummy',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
      <defs>
        <filter id="mummy-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
        <linearGradient id="bandage" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#e2d9b6"/>
        </linearGradient>
      </defs>
      <g filter="url(#mummy-shadow)">
        <!-- Loose hanging bandages background -->
        <path d="M140 270 Q110 340 100 410 Q115 415 125 390 Q145 320 155 280 Z" fill="#d6cba6" stroke="#110522" stroke-width="4"/>
        <path d="M350 280 Q380 350 395 420 Q380 425 370 400 Q350 330 340 290 Z" fill="#d6cba6" stroke="#110522" stroke-width="4"/>

        <!-- Outstretched Zombie-walking arms -->
        <!-- Left arm -->
        <path d="M185 220 L100 240 Q75 250 85 275 Q100 290 120 280 L185 260 Z" fill="url(#bandage)" stroke="#110522" stroke-width="6"/>
        <!-- Left wrap lines -->
        <line x1="120" y1="235" x2="130" y2="280" stroke="#a39872" stroke-width="4"/>
        <line x1="150" y1="228" x2="158" y2="270" stroke="#a39872" stroke-width="4"/>
        <!-- Hand wrapped -->
        <ellipse cx="85" cy="265" rx="18" ry="16" fill="#fef3c7" stroke="#110522" stroke-width="5"/>
        <path d="M70 260 Q85 270 95 260" stroke="#a39872" stroke-width="3"/>

        <!-- Right arm -->
        <path d="M315 220 L400 240 Q425 250 415 275 Q400 290 380 280 L315 260 Z" fill="url(#bandage)" stroke="#110522" stroke-width="6"/>
        <line x1="380" y1="235" x2="370" y2="280" stroke="#a39872" stroke-width="4"/>
        <line x1="350" y1="228" x2="342" y2="270" stroke="#a39872" stroke-width="4"/>
        <ellipse cx="415" cy="265" rx="18" ry="16" fill="#fef3c7" stroke="#110522" stroke-width="5"/>
        <path d="M400 260 Q415 270 425 260" stroke="#a39872" stroke-width="3"/>

        <!-- Torso with criss-cross bandages -->
        <path d="M180 190 Q250 220 320 190 L330 390 L170 390 Z" fill="#fef3c7" stroke="#110522" stroke-width="6"/>
        <!-- Cross wrap strips -->
        <path d="M175 220 L325 260 L320 285 L173 245 Z" fill="#e8dfbd" stroke="#110522" stroke-width="3"/>
        <path d="M322 280 L172 320 L170 345 L325 305 Z" fill="#d9ce9e" stroke="#110522" stroke-width="3"/>
        <path d="M170 340 L330 375 L328 395 L170 365 Z" fill="#e8dfbd" stroke="#110522" stroke-width="3"/>

        <!-- Gold Scarab Collar / Medallion -->
        <path d="M220 220 C235 245 265 245 280 220 Z" fill="#f59e0b" stroke="#110522" stroke-width="4"/>
        <circle cx="250" cy="245" r="14" fill="#06b6d4" stroke="#110522" stroke-width="3"/>
        <polygon points="250,237 257,249 243,249" fill="#fef08a"/>

        <!-- Mummy wrapped legs -->
        <!-- Left Leg -->
        <path d="M180 390 L240 390 L230 530 L170 530 Z" fill="#fef3c7" stroke="#110522" stroke-width="6"/>
        <line x1="178" y1="420" x2="238" y2="430" stroke="#a39872" stroke-width="4"/>
        <line x1="175" y1="460" x2="235" y2="470" stroke="#a39872" stroke-width="4"/>
        <line x1="172" y1="500" x2="232" y2="510" stroke="#a39872" stroke-width="4"/>
        <!-- Left Foot wrapped -->
        <path d="M150 550 Q170 530 230 530 L235 560 L145 560 Z" fill="#e2d9b6" stroke="#110522" stroke-width="6"/>

        <!-- Right Leg -->
        <path d="M260 390 L320 390 L330 530 L270 530 Z" fill="#fef3c7" stroke="#110522" stroke-width="6"/>
        <line x1="262" y1="430" x2="322" y2="420" stroke="#a39872" stroke-width="4"/>
        <line x1="265" y1="470" x2="325" y2="460" stroke="#a39872" stroke-width="4"/>
        <line x1="268" y1="510" x2="328" y2="500" stroke="#a39872" stroke-width="4"/>
        <!-- Right Foot wrapped -->
        <path d="M350 550 Q330 530 270 530 L265 560 L355 560 Z" fill="#e2d9b6" stroke="#110522" stroke-width="6"/>

        <!-- Neck opening scoop -->
        <ellipse cx="250" cy="185" rx="55" ry="22" fill="#d6cba6" stroke="#110522" stroke-width="5"/>
      </g>
    </svg>`
  },
  {
    id: 'zombie',
    name: 'Decayed Zombie',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
      <defs>
        <filter id="zombie-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
        <linearGradient id="suit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <g filter="url(#zombie-shadow)">
        <!-- Green zombie arms -->
        <path d="M180 230 L110 270 Q90 280 95 305 Q110 320 130 310 L195 260 Z" fill="#84cc16" stroke="#110522" stroke-width="6"/>
        <!-- Zombie claws -->
        <path d="M90 300 L70 315 M85 310 L70 330 M95 315 L85 340" stroke="#110522" stroke-width="5" stroke-linecap="round"/>

        <path d="M320 230 L390 270 Q410 280 405 305 Q390 320 370 310 L305 260 Z" fill="#84cc16" stroke="#110522" stroke-width="6"/>
        <path d="M410 300 L430 315 M415 310 L430 330 M405 315 L415 340" stroke="#110522" stroke-width="5" stroke-linecap="round"/>

        <!-- Torn Suit Jacket -->
        <path d="M175 195 Q250 230 325 195 L340 380 L310 400 L285 375 L250 400 L215 375 L190 400 L160 380 Z" fill="url(#suit)" stroke="#110522" stroke-width="6"/>

        <!-- Torn Shirt & Exposed Ribs -->
        <path d="M210 210 L250 320 L290 210 Z" fill="#f8fafc" stroke="#110522" stroke-width="4"/>
        <!-- Green decayed skin & ribs exposed -->
        <path d="M235 270 Q250 260 265 270 L260 310 L240 310 Z" fill="#4d7c0f" stroke="#110522" stroke-width="4"/>
        <!-- Rib bones -->
        <line x1="242" y1="280" x2="258" y2="280" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        <line x1="244" y1="292" x2="256" y2="292" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>

        <!-- Slime green dripping tie -->
        <path d="M245 220 L255 220 L265 310 L250 340 L238 310 Z" fill="#22c55e" stroke="#110522" stroke-width="4"/>

        <!-- Slime spots -->
        <circle cx="190" cy="320" r="10" fill="#a3e635" stroke="#110522" stroke-width="3"/>
        <circle cx="310" cy="340" r="12" fill="#a3e635" stroke="#110522" stroke-width="3"/>

        <!-- Tattered Pants -->
        <!-- Left Leg -->
        <path d="M185 390 L240 390 L235 500 L215 480 L195 505 L175 480 Z" fill="#475569" stroke="#110522" stroke-width="6"/>
        <!-- Green lower leg & bare zombie foot -->
        <path d="M190 490 L225 490 L220 545 L150 545 Q150 525 180 525 Z" fill="#84cc16" stroke="#110522" stroke-width="5"/>
        <circle cx="155" cy="545" r="7" fill="#65a30d"/>
        <circle cx="170" cy="545" r="6" fill="#65a30d"/>

        <!-- Right Leg with torn knee -->
        <path d="M260 390 L315 390 L325 500 L305 480 L285 505 L265 480 Z" fill="#475569" stroke="#110522" stroke-width="6"/>
        <circle cx="290" cy="445" r="12" fill="#84cc16" stroke="#110522" stroke-width="3"/>
        <path d="M275 490 L310 490 L315 545 L350 545 Q350 525 320 525 Z" fill="#84cc16" stroke="#110522" stroke-width="5"/>
        <circle cx="345" cy="545" r="7" fill="#65a30d"/>

        <!-- Neck Opening -->
        <ellipse cx="250" cy="190" rx="55" ry="22" fill="#65a30d" stroke="#110522" stroke-width="5"/>
      </g>
    </svg>`
  },
  {
    id: 'vampire',
    name: 'Count Dracula',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
      <defs>
        <filter id="vamp-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
        <linearGradient id="cape-red" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
      </defs>
      <g filter="url(#vamp-shadow)">
        <!-- High Dracula Cape Standing Collar -->
        <path d="M165 210 L120 120 Q180 155 240 185 Z" fill="url(#cape-red)" stroke="#110522" stroke-width="6"/>
        <path d="M335 210 L380 120 Q320 155 260 185 Z" fill="url(#cape-red)" stroke="#110522" stroke-width="6"/>

        <!-- Cape Outer Wings -->
        <path d="M130 145 L80 340 Q130 460 170 480 L160 220 Z" fill="#0f172a" stroke="#110522" stroke-width="6"/>
        <path d="M370 145 L420 340 Q370 460 330 480 L340 220 Z" fill="#0f172a" stroke="#110522" stroke-width="6"/>

        <!-- Tuxedo Jacket -->
        <path d="M170 200 L330 200 L340 400 L250 430 L160 400 Z" fill="#1e1b4b" stroke="#110522" stroke-width="6"/>

        <!-- Crimson Silk Vest -->
        <path d="M205 215 L295 215 L305 380 L250 410 L195 380 Z" fill="url(#cape-red)" stroke="#110522" stroke-width="5"/>
        <!-- Vest Buttons -->
        <circle cx="250" cy="275" r="5" fill="#facc15" stroke="#110522" stroke-width="2"/>
        <circle cx="250" cy="310" r="5" fill="#facc15" stroke="#110522" stroke-width="2"/>
        <circle cx="250" cy="345" r="5" fill="#facc15" stroke="#110522" stroke-width="2"/>

        <!-- Crisp White Shirt Triangle -->
        <polygon points="220,210 280,210 250,265" fill="#f8fafc" stroke="#110522" stroke-width="4"/>

        <!-- Bat Bowtie -->
        <path d="M230 215 Q240 225 250 215 Q260 225 270 215 Q265 235 275 240 Q250 230 250 238 Q250 230 225 240 Q235 235 230 215 Z" fill="#110522"/>
        <circle cx="250" cy="226" r="6" fill="#ef4444"/>

        <!-- White Gloved Hands -->
        <ellipse cx="140" cy="350" rx="18" ry="16" fill="#f8fafc" stroke="#110522" stroke-width="5"/>
        <ellipse cx="360" cy="350" rx="18" ry="16" fill="#f8fafc" stroke="#110522" stroke-width="5"/>

        <!-- Sleek Dress Pants -->
        <path d="M185 400 L240 400 L235 530 L175 530 Z" fill="#0f172a" stroke="#110522" stroke-width="6"/>
        <path d="M260 400 L315 400 L325 530 L265 530 Z" fill="#0f172a" stroke="#110522" stroke-width="6"/>

        <!-- Shiny Vampire Boots -->
        <path d="M150 550 Q170 525 235 525 L235 565 L145 565 Z" fill="#020617" stroke="#110522" stroke-width="6"/>
        <path d="M350 550 Q330 525 265 525 L265 565 L355 565 Z" fill="#020617" stroke="#110522" stroke-width="6"/>

        <!-- Neck Opening -->
        <ellipse cx="250" cy="180" rx="50" ry="20" fill="#450a0a" stroke="#110522" stroke-width="5"/>
      </g>
    </svg>`
  },
  {
    id: 'witch',
    name: 'Wicked Witch',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
      <defs>
        <filter id="witch-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
        <linearGradient id="witch-robe" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#4c1d95"/>
          <stop offset="100%" stop-color="#2e1065"/>
        </linearGradient>
        <pattern id="witch-stripes" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="10" fill="#ff7800"/>
          <rect y="10" width="20" height="10" fill="#110522"/>
        </pattern>
      </defs>
      <g filter="url(#witch-shadow)">
        <!-- Broomstick slanted in background -->
        <line x1="70" y1="480" x2="430" y2="240" stroke="#854d0e" stroke-width="14" stroke-linecap="round"/>
        <!-- Broom bristles -->
        <path d="M50 490 L95 440 L120 500 L60 530 Z" fill="#eab308" stroke="#110522" stroke-width="5"/>
        <line x1="75" y1="475" x2="90" y2="515" stroke="#ca8a04" stroke-width="3"/>

        <!-- Potion vial in left hand -->
        <path d="M125 290 L115 330 Q110 350 135 350 Q160 350 155 330 L145 290 Z" fill="#22c55e" stroke="#110522" stroke-width="4"/>
        <rect x="127" y="282" width="16" height="8" rx="2" fill="#d97706" stroke="#110522" stroke-width="3"/>
        <circle cx="135" cy="330" r="5" fill="#a3e635"/>

        <!-- Green Witch Hands -->
        <circle cx="140" cy="320" r="16" fill="#84cc16" stroke="#110522" stroke-width="4"/>
        <circle cx="360" cy="285" r="16" fill="#84cc16" stroke="#110522" stroke-width="4"/>

        <!-- Witch Dress / Robe -->
        <path d="M185 205 L315 205 L370 440 L130 440 Z" fill="url(#witch-robe)" stroke="#110522" stroke-width="6"/>

        <!-- Orange Corset & Belt -->
        <path d="M210 240 L290 240 L280 330 L220 330 Z" fill="#ea580c" stroke="#110522" stroke-width="5"/>
        <!-- Criss cross lace -->
        <line x1="225" y1="260" x2="275" y2="290" stroke="#fef08a" stroke-width="3"/>
        <line x1="275" y1="260" x2="225" y2="290" stroke="#fef08a" stroke-width="3"/>
        <line x1="225" y1="290" x2="275" y2="320" stroke="#fef08a" stroke-width="3"/>
        <line x1="275" y1="290" x2="225" y2="320" stroke="#fef08a" stroke-width="3"/>

        <!-- Gold Star Embellishment -->
        <polygon points="250,370 256,385 272,385 259,395 264,410 250,400 236,410 241,395 228,385 244,385" fill="#facc15"/>

        <!-- Striped Stockings -->
        <rect x="195" y="440" width="35" height="85" fill="url(#witch-stripes)" stroke="#110522" stroke-width="5"/>
        <rect x="270" y="440" width="35" height="85" fill="url(#witch-stripes)" stroke="#110522" stroke-width="5"/>

        <!-- Pointed Curly Witch Shoes with Gold Buckles -->
        <path d="M150 545 Q160 515 230 515 L230 555 L160 555 Q130 555 140 535 Q145 520 135 515 Z" fill="#110522" stroke="#110522" stroke-width="6"/>
        <rect x="190" y="520" width="22" height="18" fill="#facc15" stroke="#110522" stroke-width="3"/>

        <path d="M350 545 Q340 515 270 515 L270 555 L340 555 Q370 555 360 535 Q355 520 365 515 Z" fill="#110522" stroke="#110522" stroke-width="6"/>
        <rect x="288" y="520" width="22" height="18" fill="#facc15" stroke="#110522" stroke-width="3"/>

        <!-- Neck Opening -->
        <ellipse cx="250" cy="195" rx="55" ry="22" fill="#3b0764" stroke="#110522" stroke-width="5"/>
      </g>
    </svg>`
  },
  {
    id: 'frankenstein',
    name: 'Franken-Monster',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
      <defs>
        <filter id="frank-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
        <linearGradient id="frank-jacket" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3f3f46"/>
          <stop offset="100%" stop-color="#27272a"/>
        </linearGradient>
      </defs>
      <g filter="url(#frank-shadow)">
        <!-- Massive bolts on collarbone -->
        <rect x="155" y="180" width="22" height="30" fill="#94a3b8" stroke="#110522" stroke-width="4"/>
        <rect x="145" y="186" width="10" height="18" fill="#cbd5e1" stroke="#110522" stroke-width="3"/>
        <rect x="323" y="180" width="22" height="30" fill="#94a3b8" stroke="#110522" stroke-width="4"/>
        <rect x="345" y="186" width="10" height="18" fill="#cbd5e1" stroke="#110522" stroke-width="3"/>

        <!-- Massive Boxy Arms & Big Hands -->
        <path d="M165 210 L105 260 L125 380 L175 360 L165 250 Z" fill="url(#frank-jacket)" stroke="#110522" stroke-width="6"/>
        <!-- Green stitched hand -->
        <circle cx="140" cy="405" r="26" fill="#86efac" stroke="#110522" stroke-width="5"/>
        <line x1="125" y1="400" x2="155" y2="400" stroke="#110522" stroke-width="4"/>
        <line x1="135" y1="392" x2="135" y2="408" stroke="#110522" stroke-width="3"/>
        <line x1="145" y1="392" x2="145" y2="408" stroke="#110522" stroke-width="3"/>

        <path d="M335 210 L395 260 L375 380 L325 360 L335 250 Z" fill="url(#frank-jacket)" stroke="#110522" stroke-width="6"/>
        <circle cx="360" cy="405" r="26" fill="#86efac" stroke="#110522" stroke-width="5"/>
        <line x1="345" y1="400" x2="375" y2="400" stroke="#110522" stroke-width="4"/>
        <line x1="355" y1="392" x2="355" y2="408" stroke="#110522" stroke-width="3"/>
        <line x1="365" y1="392" x2="365" y2="408" stroke="#110522" stroke-width="3"/>

        <!-- Oversized Boxy Torso -->
        <path d="M150 190 L350 190 L340 400 L160 400 Z" fill="url(#frank-jacket)" stroke="#110522" stroke-width="6"/>

        <!-- Black undershirt -->
        <polygon points="210,190 290,190 270,300 230,300" fill="#18181b" stroke="#110522" stroke-width="4"/>

        <!-- Stitches on Jacket -->
        <line x1="200" y1="320" x2="230" y2="340" stroke="#facc15" stroke-width="4"/>
        <line x1="210" y1="325" x2="205" y2="335" stroke="#110522" stroke-width="3"/>
        <line x1="220" y1="330" x2="215" y2="340" stroke="#110522" stroke-width="3"/>

        <!-- Pants -->
        <path d="M170 400 L240 400 L235 510 L165 510 Z" fill="#52525b" stroke="#110522" stroke-width="6"/>
        <path d="M260 400 L330 400 L335 510 L265 510 Z" fill="#52525b" stroke="#110522" stroke-width="6"/>

        <!-- Giant Platform Boots -->
        <rect x="145" y="510" width="95" height="55" rx="10" fill="#09090b" stroke="#110522" stroke-width="6"/>
        <line x1="145" y1="545" x2="240" y2="545" stroke="#71717a" stroke-width="6"/>

        <rect x="260" y="510" width="95" height="55" rx="10" fill="#09090b" stroke="#110522" stroke-width="6"/>
        <line x1="260" y1="545" x2="355" y2="545" stroke="#71717a" stroke-width="6"/>

        <!-- Neck Opening -->
        <ellipse cx="250" cy="180" rx="60" ry="24" fill="#22c55e" stroke="#110522" stroke-width="5"/>
      </g>
    </svg>`
  },
  {
    id: 'ghost',
    name: 'Spooky Specter',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
      <defs>
        <filter id="ghost-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#22c55e" flood-opacity="0.35"/>
        </filter>
        <linearGradient id="ghost-sheet" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="70%" stop-color="#e0f2fe"/>
          <stop offset="100%" stop-color="#bae6fd"/>
        </linearGradient>
      </defs>
      <g filter="url(#ghost-shadow)">
        <!-- Ghostly floating wavy sheet -->
        <path d="M190 190 Q120 250 110 370 Q105 440 140 500 Q170 550 200 490 Q230 550 260 490 Q290 550 320 490 Q350 550 380 490 Q400 430 390 370 Q380 250 310 190 Z" fill="url(#ghost-sheet)" stroke="#110522" stroke-width="6" stroke-linejoin="round"/>

        <!-- Cute Floating arms -->
        <path d="M140 280 Q100 270 90 290 Q85 310 110 320 Q135 320 150 310" fill="#f0f9ff" stroke="#110522" stroke-width="5"/>
        <path d="M360 280 Q400 270 410 290 Q415 310 390 320 Q365 320 350 310" fill="#f0f9ff" stroke="#110522" stroke-width="5"/>

        <!-- Pumpkin Trick-or-Treat Bucket held in front -->
        <ellipse cx="250" cy="380" rx="65" ry="50" fill="#ea580c" stroke="#110522" stroke-width="5"/>
        <!-- Pumpkin ridges -->
        <path d="M250 330 Q225 380 250 430" stroke="#c2410c" stroke-width="5" fill="none"/>
        <path d="M250 330 Q275 380 250 430" stroke="#c2410c" stroke-width="5" fill="none"/>
        <!-- Jack-o-lantern face on bucket -->
        <polygon points="230,365 240,378 220,378" fill="#110522"/>
        <polygon points="270,365 280,378 260,378" fill="#110522"/>
        <polygon points="250,382 255,390 245,390" fill="#110522"/>
        <path d="M230 400 Q250 418 270 400" stroke="#110522" stroke-width="5" stroke-linecap="round" fill="none"/>
        <!-- Bucket handle -->
        <path d="M195 365 Q250 300 305 365" stroke="#110522" stroke-width="5" fill="none"/>

        <!-- Sparkles / Candy spilled -->
        <circle cx="205" cy="420" r="7" fill="#a855f7" stroke="#110522" stroke-width="2"/>
        <circle cx="295" cy="425" r="6" fill="#facc15" stroke="#110522" stroke-width="2"/>

        <!-- Neck Opening -->
        <ellipse cx="250" cy="185" rx="55" ry="22" fill="#bae6fd" stroke="#110522" stroke-width="5"/>
      </g>
    </svg>`
  },
  {
    id: 'werewolf',
    name: 'Savage Werewolf',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
      <defs>
        <filter id="wolf-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
        <pattern id="plaid" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#dc2626"/>
          <rect width="15" height="30" fill="#991b1b" opacity="0.6"/>
          <rect width="30" height="15" fill="#110522" opacity="0.4"/>
        </pattern>
      </defs>
      <g filter="url(#wolf-shadow)">
        <!-- Muscular Furry Werewolf Arms -->
        <path d="M175 220 L95 270 Q80 290 90 320 Q110 335 130 315 L190 260 Z" fill="#78350f" stroke="#110522" stroke-width="6"/>
        <!-- Claws Left -->
        <polygon points="75,315 60,335 80,330" fill="#fef08a" stroke="#110522" stroke-width="3"/>
        <polygon points="85,325 75,350 95,340" fill="#fef08a" stroke="#110522" stroke-width="3"/>
        <polygon points="100,330 95,355 110,345" fill="#fef08a" stroke="#110522" stroke-width="3"/>

        <path d="M325 220 L405 270 Q420 290 410 320 Q390 335 370 315 L310 260 Z" fill="#78350f" stroke="#110522" stroke-width="6"/>
        <!-- Claws Right -->
        <polygon points="425,315 440,335 420,330" fill="#fef08a" stroke="#110522" stroke-width="3"/>
        <polygon points="415,325 425,350 405,340" fill="#fef08a" stroke="#110522" stroke-width="3"/>
        <polygon points="400,330 405,355 390,345" fill="#fef08a" stroke="#110522" stroke-width="3"/>

        <!-- Torn Red Plaid Flannel Shirt -->
        <path d="M165 195 Q250 230 335 195 L345 390 L320 405 L295 385 L265 405 L235 385 L205 405 L155 390 Z" fill="url(#plaid)" stroke="#110522" stroke-width="6"/>

        <!-- Shredded chest revealing brown fur -->
        <polygon points="220,205 280,205 250,300" fill="#542307" stroke="#110522" stroke-width="4"/>
        <path d="M235 240 L250 270 L265 240" stroke="#78350f" stroke-width="5" fill="none"/>

        <!-- Torn Denim Jeans -->
        <path d="M175 395 L240 395 L235 500 L210 480 L185 505 L170 485 Z" fill="#1e3a5f" stroke="#110522" stroke-width="6"/>
        <!-- Furry legs and paws -->
        <path d="M185 490 L220 490 L225 545 L150 545 Q150 520 180 520 Z" fill="#78350f" stroke="#110522" stroke-width="5"/>
        <polygon points="145,540 135,550 150,555" fill="#fef08a" stroke="#110522" stroke-width="2"/>
        <polygon points="160,545 152,555 168,555" fill="#fef08a" stroke="#110522" stroke-width="2"/>

        <path d="M260 395 L325 395 L330 485 L315 505 L290 480 L265 500 Z" fill="#1e3a5f" stroke="#110522" stroke-width="6"/>
        <path d="M280 490 L315 490 L350 545 L275 545 Q320 520 280 490 Z" fill="#78350f" stroke="#110522" stroke-width="5"/>
        <polygon points="355,540 365,550 350,555" fill="#fef08a" stroke="#110522" stroke-width="2"/>

        <!-- Neck Opening -->
        <ellipse cx="250" cy="190" rx="55" ry="22" fill="#542307" stroke="#110522" stroke-width="5"/>
      </g>
    </svg>`
  }
];

async function run() {
  for (const t of templates) {
    const pngBuffer = await sharp(Buffer.from(t.svg))
      .png()
      .toBuffer();

    const pngPath = path.join(outDir, `${t.id}.png`);
    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`Generated ${pngPath} (${pngBuffer.length} bytes)`);

    // Also write svg for reference
    fs.writeFileSync(path.join(outDir, `${t.id}.svg`), t.svg);
  }
  console.log('All templates generated successfully!');
}

run().catch(console.error);
