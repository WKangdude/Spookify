export interface NeckAnchor {
  x: number;
  y: number;
}

export interface CharacterTemplate {
  id: string;
  name: string;
  bodyImagePath: string;
  neckAnchor: NeckAnchor;
  defaultScale: number;
  defaultAngle: number;
  // Extra Halloween flavor
  category?: 'Classic Slasher' | 'Undead' | 'Supernatural' | 'Monster';
  accentColor?: string;
  tagline?: string;
  badge?: string;
}

export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    id: 'chucky',
    name: 'Creepy Chucky',
    bodyImagePath: '/templates/chucky.png',
    neckAnchor: { x: 250, y: 195 },
    defaultScale: 1.25,
    defaultAngle: -3,
    category: 'Classic Slasher',
    accentColor: '#ef4444',
    tagline: 'Wanna play? A vintage toy with a killer personality!',
    badge: '🔪 Good Guy'
  },
  {
    id: 'mummy',
    name: 'Pharaoh Mummy',
    bodyImagePath: '/templates/mummy.png',
    neckAnchor: { x: 250, y: 185 },
    defaultScale: 1.2,
    defaultAngle: 3,
    category: 'Undead',
    accentColor: '#f59e0b',
    tagline: 'Freshly unsealed from the ancient tomb after 3,000 years.',
    badge: '🏺 Ancient'
  },
  {
    id: 'zombie',
    name: 'Decayed Zombie',
    bodyImagePath: '/templates/zombie.png',
    neckAnchor: { x: 250, y: 190 },
    defaultScale: 1.22,
    defaultAngle: -5,
    category: 'Undead',
    accentColor: '#84cc16',
    tagline: 'Looking for brains, snacks, and late-night monster parties.',
    badge: '🧟 Braaains'
  },
  {
    id: 'vampire',
    name: 'Count Dracula',
    bodyImagePath: '/templates/vampire.png',
    neckAnchor: { x: 250, y: 180 },
    defaultScale: 1.18,
    defaultAngle: 0,
    category: 'Supernatural',
    accentColor: '#dc2626',
    tagline: 'Aristocratic bloodsucker dressed in velvet and batwings.',
    badge: '🦇 Nocturnal'
  },
  {
    id: 'witch',
    name: 'Wicked Witch',
    bodyImagePath: '/templates/witch.png',
    neckAnchor: { x: 250, y: 195 },
    defaultScale: 1.15,
    defaultAngle: 4,
    category: 'Supernatural',
    accentColor: '#9333ea',
    tagline: 'Stirring cauldron mischief and riding brooms under the full moon.',
    badge: '🧹 Potion Master'
  },
  {
    id: 'frankenstein',
    name: 'Franken-Monster',
    bodyImagePath: '/templates/frankenstein.png',
    neckAnchor: { x: 250, y: 180 },
    defaultScale: 1.28,
    defaultAngle: -2,
    category: 'Monster',
    accentColor: '#10b981',
    tagline: 'Pieced together in a stormy laboratory with pure voltage.',
    badge: '⚡ High Voltage'
  },
  {
    id: 'ghost',
    name: 'Spooky Specter',
    bodyImagePath: '/templates/ghost.png',
    neckAnchor: { x: 250, y: 185 },
    defaultScale: 1.15,
    defaultAngle: 3,
    category: 'Supernatural',
    accentColor: '#38bdf8',
    tagline: 'Floating translucent phantom gathering sweet trick-or-treat loot.',
    badge: '👻 Boo!'
  },
  {
    id: 'werewolf',
    name: 'Savage Werewolf',
    bodyImagePath: '/templates/werewolf.png',
    neckAnchor: { x: 250, y: 190 },
    defaultScale: 1.25,
    defaultAngle: -3,
    category: 'Monster',
    accentColor: '#ea580c',
    tagline: 'Howling at the midnight harvest moon in shredded flannel.',
    badge: '🐺 Full Moon'
  }
];

export function getTemplateById(id: string): CharacterTemplate | undefined {
  return CHARACTER_TEMPLATES.find((t) => t.id === id);
}

export function getRandomTemplate(excludeId?: string): CharacterTemplate {
  const filtered = excludeId
    ? CHARACTER_TEMPLATES.filter((t) => t.id !== excludeId)
    : CHARACTER_TEMPLATES;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex] || CHARACTER_TEMPLATES[0];
}
