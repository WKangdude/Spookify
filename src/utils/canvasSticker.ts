import { CharacterTemplate, CHARACTER_TEMPLATES } from './characterTemplates';
import { loadImage } from './imageProcessing';

export interface ComposeCharacterOptions {
  // Real-time adjustments per character
  dx?: number;              // head position offset X relative to neckAnchor
  dy?: number;              // head position offset Y relative to neckAnchor
  scaleMultiplier?: number; // scale multiplier on top of template defaultScale (default: 1.0)
  rotationAngle?: number;   // rotation angle in degrees on top of template defaultAngle (default: 0)
  flipHeadX?: boolean;      // flip head horizontally

  // Compatibility with StickerTransform
  headOffsetX?: number;
  headOffsetY?: number;
  headScale?: number;
  headAngle?: number;

  // Die-cut sticker effect
  whiteBorder?: boolean;    // default true
  borderWidth?: number;     // thickness of die-cut border in pixels (default: 12)
  dropShadow?: boolean;     // subtle drop shadow under sticker (default: true)
  shadowBlur?: number;      // default: 18
  shadowColor?: string;     // default: 'rgba(0,0,0,0.45)'
  shadowOffsetY?: number;   // default: 10

  // Accessories & Captions
  accessory?: 'none' | 'witch-hat' | 'fangs' | 'bolts' | 'knife' | 'horns' | 'slime';
  caption?: string;
  captionStyle?: 'speech-bubble' | 'bloody-text' | 'banner';

  // Canvas size options
  canvasWidth?: number;     // default: 500
  canvasHeight?: number;    // default: 600
  wobbleOffsetAngle?: number; // for bobblehead animation
}

export interface StickerTransform extends ComposeCharacterOptions {
  headOffsetX: number;
  headOffsetY: number;
  headScale: number;
  headAngle: number;
  flipHeadX: boolean;
  whiteBorder: boolean;
  borderWidth: number;
  dropShadow: boolean;
  accessory?: 'none' | 'witch-hat' | 'fangs' | 'bolts' | 'knife' | 'horns' | 'slime';
  caption?: string;
  captionStyle?: 'speech-bubble' | 'bloody-text' | 'banner';
}

export const DEFAULT_TRANSFORM: StickerTransform = {
  headOffsetX: 0,
  headOffsetY: 0,
  headScale: 1.25,
  headAngle: 0,
  flipHeadX: false,
  whiteBorder: true,
  borderWidth: 12,
  dropShadow: true,
  accessory: 'none',
  caption: '',
  captionStyle: 'speech-bubble'
};

/**
 * 1. Implement composeCharacter(template, croppedHeadImage, options)
 * - Draw the character body PNG.
 * - Position, scale, and rotate the cropped head onto the template's neckAnchor point.
 * - Add a thick white border around the composite figure to create the die-cut sticker effect.
 * - Add a subtle drop shadow under the sticker.
 */
export async function composeCharacter(
  template: CharacterTemplate,
  croppedHeadImage: HTMLImageElement | HTMLCanvasElement,
  options: ComposeCharacterOptions = {}
): Promise<HTMLCanvasElement> {
  const width = options.canvasWidth || 500;
  const height = options.canvasHeight || 600;

  // Real-time adjustments per character
  const dx = options.dx ?? options.headOffsetX ?? 0;
  const dy = options.dy ?? options.headOffsetY ?? 0;
  const scaleMult = options.scaleMultiplier ?? options.headScale ?? 1.0;
  const rotAngle = options.rotationAngle ?? options.headAngle ?? 0;
  const wobble = options.wobbleOffsetAngle ?? 0;
  const flip = options.flipHeadX ?? false;

  // Die-cut border & shadow settings
  const hasWhiteBorder = options.whiteBorder !== false;
  const borderWidth = options.borderWidth ?? 12;
  const hasDropShadow = options.dropShadow !== false;
  const shadowBlur = options.shadowBlur ?? 18;
  const shadowColor = options.shadowColor ?? 'rgba(0, 0, 0, 0.45)';
  const shadowOffsetY = options.shadowOffsetY ?? 10;

  // 1. Render character body and head onto an intermediate clean content canvas
  const contentCanvas = document.createElement('canvas');
  contentCanvas.width = width;
  contentCanvas.height = height;
  const ctx = contentCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get 2d context for sticker composition');

  ctx.clearRect(0, 0, width, height);

  // Draw character body PNG
  const bodyImg = await loadImage(template.bodyImagePath);
  ctx.drawImage(bodyImg, 0, 0, width, height);

  // Position, scale, and rotate the cropped head onto the neckAnchor point
  const anchorX = template.neckAnchor.x + dx;
  const anchorY = template.neckAnchor.y + dy;
  const headW = croppedHeadImage.width;
  const headH = croppedHeadImage.height;

  const effectiveScale = (template.defaultScale || 1.2) * scaleMult;
  const effectiveAngle = (template.defaultAngle || 0) + rotAngle + wobble;

  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.rotate((effectiveAngle * Math.PI) / 180);
  if (flip) {
    ctx.scale(-1, 1);
  }

  // Draw head with chin resting near anchor (bottom center of head)
  const drawW = headW * effectiveScale;
  const drawH = headH * effectiveScale;
  const drawX = -drawW / 2;
  const drawY = -drawH * 0.85;

  ctx.drawImage(croppedHeadImage, drawX, drawY, drawW, drawH);

  // Optional accessories
  if (options.accessory && options.accessory !== 'none') {
    drawAccessory(ctx, options.accessory, drawX, drawY, drawW, drawH);
  }

  ctx.restore();

  // Optional caption
  if (options.caption && options.caption.trim()) {
    drawCaption(ctx, options.caption.trim(), options.captionStyle || 'speech-bubble', width, height);
  }

  // 2. Add die-cut sticker effect (thick white border + subtle drop shadow)
  if (hasWhiteBorder) {
    return applyDieCutStickerBorder(
      contentCanvas,
      borderWidth,
      hasDropShadow,
      shadowBlur,
      shadowColor,
      shadowOffsetY
    );
  }

  if (hasDropShadow) {
    return applyDropShadowOnly(contentCanvas, shadowBlur, shadowColor, shadowOffsetY);
  }

  return contentCanvas;
}

/**
 * Backwards compatibility wrapper for CanvasEditor.tsx
 */
export async function renderBobbleheadCanvas(
  template: CharacterTemplate,
  headImgOrCanvas: HTMLImageElement | HTMLCanvasElement,
  transform: StickerTransform,
  options?: {
    canvasWidth?: number;
    canvasHeight?: number;
    wobbleOffsetAngle?: number;
  }
): Promise<HTMLCanvasElement> {
  return composeCharacter(template, headImgOrCanvas, {
    ...transform,
    ...options
  });
}

/**
 * Creates high quality die-cut sticker effect:
 * Renders an outline silhouette expanded with white stroke, then renders image over it with subtle drop shadow
 */
function applyDieCutStickerBorder(
  sourceCanvas: HTMLCanvasElement,
  borderWidth: number = 12,
  dropShadow: boolean = true,
  shadowBlur: number = 18,
  shadowColor: string = 'rgba(0, 0, 0, 0.45)',
  shadowOffsetY: number = 10
): HTMLCanvasElement {
  const padding = borderWidth + (dropShadow ? 24 : 12);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = sourceCanvas.width + padding * 2;
  outCanvas.height = sourceCanvas.height + padding * 2;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return sourceCanvas;

  // Create temporary silhouette canvas for the expanded white outline
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = outCanvas.width;
  maskCanvas.height = outCanvas.height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return sourceCanvas;

  const r = Math.max(3, borderWidth);
  // Multi-radius radial dilation for clean, smooth, gap-free solid sticker contour
  const radii = [r, r * 0.75, r * 0.5, r * 0.25];
  for (const radius of radii) {
    const numSteps = Math.max(12, Math.floor(radius * 2.8));
    for (let i = 0; i < numSteps; i++) {
      const angle = (i / numSteps) * 2 * Math.PI;
      const ox = Math.round(Math.cos(angle) * radius);
      const oy = Math.round(Math.sin(angle) * radius);
      maskCtx.drawImage(sourceCanvas, padding + ox, padding + oy);
    }
  }
  // Center stamp
  maskCtx.drawImage(sourceCanvas, padding, padding);

  // Turn all non-transparent pixels in the silhouette mask into solid white
  maskCtx.globalCompositeOperation = 'source-in';
  maskCtx.fillStyle = '#ffffff';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  // Render to output canvas with subtle drop shadow
  if (dropShadow) {
    outCtx.shadowColor = shadowColor;
    outCtx.shadowBlur = shadowBlur;
    outCtx.shadowOffsetY = shadowOffsetY;
  }

  // Draw the expanded white sticker outline
  outCtx.drawImage(maskCanvas, 0, 0);

  // Reset shadow before stamping the crisp original artwork on top
  outCtx.shadowColor = 'transparent';
  outCtx.shadowBlur = 0;
  outCtx.shadowOffsetY = 0;

  outCtx.drawImage(sourceCanvas, padding, padding);

  return outCanvas;
}

function applyDropShadowOnly(
  sourceCanvas: HTMLCanvasElement,
  shadowBlur: number = 18,
  shadowColor: string = 'rgba(0, 0, 0, 0.45)',
  shadowOffsetY: number = 10
): HTMLCanvasElement {
  const padding = 20;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = sourceCanvas.width + padding * 2;
  outCanvas.height = sourceCanvas.height + padding * 2;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return sourceCanvas;

  outCtx.shadowColor = shadowColor;
  outCtx.shadowBlur = shadowBlur;
  outCtx.shadowOffsetY = shadowOffsetY;
  outCtx.drawImage(sourceCanvas, padding, padding);

  return outCanvas;
}

/**
 * Halloween sticker accessories drawn onto head
 */
function drawAccessory(
  ctx: CanvasRenderingContext2D,
  acc: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  if (acc === 'witch-hat') {
    const hatBaseY = y + h * 0.15;
    const hatPeakX = x + w * 0.55;
    const hatPeakY = y - h * 0.45;

    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, hatBaseY, w * 0.65, h * 0.18, -0.05, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1035';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0a0314';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, hatBaseY);
    ctx.quadraticCurveTo(x + w * 0.25, y - h * 0.15, hatPeakX, hatPeakY);
    ctx.quadraticCurveTo(x + w * 0.65, y - h * 0.15, x + w * 0.8, hatBaseY);
    ctx.closePath();
    ctx.fillStyle = '#2e1065';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(x + w * 0.26, hatBaseY - 18, w * 0.48, 16);
    ctx.fillStyle = '#ea580c';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + w * 0.45, hatBaseY - 22, 22, 24);
  } else if (acc === 'fangs') {
    const mouthY = y + h * 0.76;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#110522';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x + w * 0.4, mouthY);
    ctx.lineTo(x + w * 0.43, mouthY + 16);
    ctx.lineTo(x + w * 0.46, mouthY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w * 0.54, mouthY);
    ctx.lineTo(x + w * 0.57, mouthY + 16);
    ctx.lineTo(x + w * 0.6, mouthY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (acc === 'bolts') {
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#110522';
    ctx.lineWidth = 3;

    ctx.fillRect(x - 20, y + h * 0.6, 25, 14);
    ctx.strokeRect(x - 20, y + h * 0.6, 25, 14);
    ctx.fillRect(x + w - 5, y + h * 0.6, 25, 14);
    ctx.strokeRect(x + w - 5, y + h * 0.6, 25, 14);
  } else if (acc === 'horns') {
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#110522';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + h * 0.15);
    ctx.quadraticCurveTo(x + w * 0.1, y - h * 0.1, x + w * 0.05, y - h * 0.2);
    ctx.quadraticCurveTo(x + w * 0.22, y - h * 0.05, x + w * 0.35, y + h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w * 0.75, y + h * 0.15);
    ctx.quadraticCurveTo(x + w * 0.9, y - h * 0.1, x + w * 0.95, y - h * 0.2);
    ctx.quadraticCurveTo(x + w * 0.78, y - h * 0.05, x + w * 0.65, y + h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (acc === 'slime') {
    ctx.fillStyle = '#84cc16';
    ctx.strokeStyle = '#110522';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.05);
    ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.25, x + w * 0.32, y + h * 0.08);
    ctx.quadraticCurveTo(x + w * 0.45, y + h * 0.3, x + w * 0.5, y + h * 0.05);
    ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.28, x + w * 0.7, y + h * 0.08);
    ctx.lineTo(x + w * 0.8, y + h * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Comic speech bubble or Halloween banner
 */
function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: string,
  canvasW: number,
  canvasH: number
) {
  ctx.save();
  const textUpper = text.toUpperCase();

  if (style === 'speech-bubble') {
    ctx.font = 'bold 22px "Creepster", cursive, sans-serif';
    const metrics = ctx.measureText(textUpper);
    const bubbleW = Math.min(canvasW - 40, Math.max(140, metrics.width + 36));
    const bubbleH = 46;
    const bubbleX = (canvasW - bubbleW) / 2;
    const bubbleY = 35;

    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#110522';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvasW / 2 - 12, bubbleY + bubbleH);
    ctx.lineTo(canvasW / 2, bubbleY + bubbleH + 15);
    ctx.lineTo(canvasW / 2 + 12, bubbleY + bubbleH);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#110522';
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(canvasW / 2 - 11, bubbleY + bubbleH - 3, 22, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#110522';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textUpper, canvasW / 2, bubbleY + bubbleH / 2 + 2);
  } else {
    const bannerH = 50;
    const bannerY = canvasH - bannerH - 20;

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(30, bannerY, canvasW - 60, bannerH, 12);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#110522';
    ctx.stroke();

    ctx.font = 'bold 24px "Creepster", cursive, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textUpper, canvasW / 2, bannerY + bannerH / 2);
  }

  ctx.restore();
}

/**
 * 3. Export utility to download individual stickers as transparent PNGs
 */
export function downloadSticker(canvas: HTMLCanvasElement, filename: string = 'spookify-sticker.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const downloadCanvasAsPng = downloadSticker;

/**
 * Export a single character sticker directly
 */
export async function exportCharacterSticker(
  template: CharacterTemplate,
  croppedHeadImage: HTMLImageElement | HTMLCanvasElement,
  options: ComposeCharacterOptions = {},
  filename?: string
): Promise<HTMLCanvasElement> {
  const finalCanvas = await composeCharacter(template, croppedHeadImage, {
    ...options,
    canvasWidth: options.canvasWidth || 600,
    canvasHeight: options.canvasHeight || 720,
    wobbleOffsetAngle: 0
  });

  const outName = filename || `spookify-${template.id}-sticker.png`;
  downloadSticker(finalCanvas, outName);
  return finalCanvas;
}

export interface BackdropCharacterItem {
  template: CharacterTemplate;
  croppedHeadImage: HTMLImageElement | HTMLCanvasElement;
  options?: ComposeCharacterOptions;
  customLabel?: string;
}

export interface HalloweenBackdropOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  columns?: number;
}

/**
 * 3. Export utility: All stickers arranged on a single festive Halloween backdrop
 * Renders a full spooky scene with harvest moon, bats, haunted trees, jack-o-lanterns, and stickers!
 */
export async function generateFestiveHalloweenBackdrop(
  items: BackdropCharacterItem[],
  options: HalloweenBackdropOptions = {}
): Promise<HTMLCanvasElement> {
  const width = options.width || 1600;
  const height = options.height || 1100;
  const title = options.title || 'SPOOKIFY HALLOWEEN SQUAD';
  const subtitle = options.subtitle || '🎃 100% Client-Side Bobblehead Monster Collection 🎃';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for backdrop');

  // 1. Spooky Midnight Gradient Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#06010f');
  skyGrad.addColorStop(0.3, '#170629');
  skyGrad.addColorStop(0.7, '#260840');
  skyGrad.addColorStop(1, '#0c0216');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Glowing Harvest Full Moon
  const moonX = width * 0.82;
  const moonY = height * 0.22;
  const moonR = 110;

  // Moon outer glow
  const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 2.2);
  moonGlow.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
  moonGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
  moonGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Moon body
  const moonBody = ctx.createRadialGradient(moonX - 25, moonY - 25, 10, moonX, moonY, moonR);
  moonBody.addColorStop(0, '#fffbeb');
  moonBody.addColorStop(0.8, '#fef08a');
  moonBody.addColorStop(1, '#facc15');
  ctx.fillStyle = moonBody;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();

  // Moon craters
  ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
  const craters = [
    { x: moonX - 35, y: moonY - 20, r: 18 },
    { x: moonX + 25, y: moonY + 25, r: 24 },
    { x: moonX - 15, y: moonY + 35, r: 14 },
    { x: moonX + 30, y: moonY - 35, r: 12 }
  ];
  for (const c of craters) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Spooky Clouds & Mist
  ctx.fillStyle = 'rgba(147, 51, 234, 0.12)';
  ctx.beginPath();
  ctx.ellipse(width * 0.35, height * 0.3, width * 0.45, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Night Sky Stars
  ctx.fillStyle = '#fef08a';
  const starSeeds = [
    [0.08, 0.12, 2], [0.15, 0.22, 2.5], [0.25, 0.08, 1.8], [0.38, 0.15, 2.2],
    [0.48, 0.06, 2], [0.58, 0.18, 1.5], [0.65, 0.09, 2.5], [0.94, 0.14, 2],
    [0.05, 0.35, 1.5], [0.92, 0.45, 2]
  ];
  for (const [sx, sy, sr] of starSeeds) {
    ctx.beginPath();
    ctx.arc(width * sx, height * sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Flying Bats Silhouette
  drawBat(ctx, moonX - 140, moonY - 30, 0.6);
  drawBat(ctx, moonX - 60, moonY - 80, 0.45);
  drawBat(ctx, moonX + 70, moonY + 80, 0.5);
  drawBat(ctx, width * 0.25, height * 0.18, 0.55);

  // 6. Haunted Ground / Graveyard Hill Silhouette
  ctx.fillStyle = '#06010d';
  ctx.beginPath();
  ctx.moveTo(0, height - 120);
  ctx.bezierCurveTo(width * 0.25, height - 170, width * 0.6, height - 90, width, height - 140);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 7. Carved Glowing Pumpkins at corners
  drawPumpkin(ctx, 90, height - 95, 48);
  drawPumpkin(ctx, width - 110, height - 85, 52);

  // 8. Spooky Title Banner
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title Glow
  ctx.shadowColor = 'rgba(249, 115, 22, 0.7)';
  ctx.shadowBlur = 25;
  ctx.font = 'bold 54px "Creepster", cursive, sans-serif';
  ctx.fillStyle = '#ff7800';
  ctx.fillText(title.toUpperCase(), width / 2, 70);

  // Title crisp stroke & fill
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#120422';
  ctx.strokeText(title.toUpperCase(), width / 2, 70);
  ctx.fillStyle = '#fed7aa';
  ctx.fillText(title.toUpperCase(), width / 2, 70);

  // Subtitle
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
  ctx.font = '600 16px "Outfit", sans-serif';
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText(subtitle, width / 2, 115);
  ctx.restore();

  // 9. Render & Arrange All Characters in a Festive Grid
  const total = items.length;
  const cols = options.columns || (total <= 4 ? total : Math.ceil(total / 2));
  const rows = Math.ceil(total / cols);

  const startY = 145;
  const availableH = height - startY - 90;
  const cellW = width / cols;
  const cellH = availableH / rows;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Compose the individual sticker with die-cut outline and drop shadow
    const stickerCanvas = await composeCharacter(item.template, item.croppedHeadImage, {
      ...item.options,
      whiteBorder: item.options?.whiteBorder ?? true,
      borderWidth: item.options?.borderWidth ?? 12,
      dropShadow: item.options?.dropShadow ?? true,
      wobbleOffsetAngle: 0,
      canvasWidth: 400,
      canvasHeight: 480
    });

    // Calculate position inside grid cell
    const targetScale = Math.min((cellW * 0.88) / stickerCanvas.width, (cellH * 0.85) / stickerCanvas.height);
    const drawW = stickerCanvas.width * targetScale;
    const drawH = stickerCanvas.height * targetScale;
    const cellCenterX = col * cellW + cellW / 2;
    const cellCenterY = startY + row * cellH + cellH / 2 - 10;
    const posX = cellCenterX - drawW / 2;
    const posY = cellCenterY - drawH / 2;

    // Draw sticker
    ctx.drawImage(stickerCanvas, posX, posY, drawW, drawH);

    // Character Name Tag beneath sticker
    ctx.save();
    ctx.textAlign = 'center';
    const tagText = item.customLabel || item.template.name;
    const tagY = posY + drawH + 14;

    ctx.font = 'bold 18px "Creepster", cursive, sans-serif';
    const tagMetrics = ctx.measureText(tagText.toUpperCase());
    const pillW = Math.max(90, tagMetrics.width + 24);
    const pillH = 26;

    // Pill background
    ctx.fillStyle = 'rgba(18, 5, 34, 0.85)';
    ctx.strokeStyle = item.template.accentColor || '#ff6a00';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(cellCenterX - pillW / 2, tagY - pillH / 2, pillW, pillH, 13);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#fed7aa';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText.toUpperCase(), cellCenterX, tagY + 1);
    ctx.restore();
  }

  return canvas;
}

/**
 * 3. Export all 8 classic characters arranged on a single festive Halloween backdrop
 */
export async function exportAllStickersBackdrop(
  croppedHeadImage: HTMLImageElement | HTMLCanvasElement,
  templates: CharacterTemplate[] = CHARACTER_TEMPLATES,
  options: ComposeCharacterOptions = {},
  filename: string = 'spookify-halloween-squad.png'
): Promise<HTMLCanvasElement> {
  const items: BackdropCharacterItem[] = templates.map((tmpl) => ({
    template: tmpl,
    croppedHeadImage,
    options: {
      ...options,
      whiteBorder: true,
      borderWidth: 12,
      dropShadow: true
    }
  }));

  const backdrop = await generateFestiveHalloweenBackdrop(items, {
    title: 'SPOOKIFY HALLOWEEN SQUAD',
    subtitle: '🎃 Spooky Bobblehead Sticker Squad 🎃',
    width: 1600,
    height: 1100,
    columns: 4
  });

  downloadSticker(backdrop, filename);
  return backdrop;
}

/**
 * Silhouette Bat drawing helper
 */
function drawBat(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#06010c';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(15, -25, 45, -20);
  ctx.quadraticCurveTo(30, 0, 35, 15);
  ctx.quadraticCurveTo(15, 10, 0, 22);
  ctx.quadraticCurveTo(-15, 10, -35, 15);
  ctx.quadraticCurveTo(-30, 0, -45, -20);
  ctx.quadraticCurveTo(-15, -25, 0, 0);
  ctx.fill();

  // Head ears
  ctx.beginPath();
  ctx.moveTo(-5, -3);
  ctx.lineTo(-7, -10);
  ctx.lineTo(-2, -5);
  ctx.lineTo(2, -5);
  ctx.lineTo(7, -10);
  ctx.lineTo(5, -3);
  ctx.fill();
  ctx.restore();
}

/**
 * Glowing carved Jack-o'-lantern helper
 */
function drawPumpkin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);

  // Stem
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.roundRect(-4, -r - 12, 8, 14, 3);
  ctx.fill();

  // Pumpkin Body
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#0e0318';
  ctx.stroke();

  // Inner ridges
  ctx.fillStyle = '#c2410c';
  ctx.beginPath();
  ctx.ellipse(-r * 0.45, 0, r * 0.38, r * 0.78, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.45, 0, r * 0.38, r * 0.78, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Glowing eyes & mouth
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 12;

  // Left Eye
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.15);
  ctx.lineTo(-r * 0.2, -r * 0.35);
  ctx.lineTo(-r * 0.15, -r * 0.05);
  ctx.closePath();
  ctx.fill();

  // Right Eye
  ctx.beginPath();
  ctx.moveTo(r * 0.45, -r * 0.15);
  ctx.lineTo(r * 0.2, -r * 0.35);
  ctx.lineTo(r * 0.15, -r * 0.05);
  ctx.closePath();
  ctx.fill();

  // Nose
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.1);
  ctx.lineTo(-r * 0.08, 0.05);
  ctx.lineTo(r * 0.08, 0.05);
  ctx.closePath();
  ctx.fill();

  // Spooky jagged grin
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, r * 0.15);
  ctx.lineTo(-r * 0.35, r * 0.38);
  ctx.lineTo(-r * 0.2, r * 0.22);
  ctx.lineTo(0, r * 0.42);
  ctx.lineTo(r * 0.2, r * 0.22);
  ctx.lineTo(r * 0.35, r * 0.38);
  ctx.lineTo(r * 0.55, r * 0.15);
  ctx.lineTo(r * 0.35, r * 0.26);
  ctx.lineTo(0, r * 0.28);
  ctx.lineTo(-r * 0.35, r * 0.26);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Copies canvas image to clipboard if supported by browser
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    return false;
  }
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return resolve(false);
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        resolve(true);
      } catch {
        resolve(false);
      }
    }, 'image/png');
  });
}
