import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CharacterTemplate,
  CHARACTER_TEMPLATES
} from '../utils/characterTemplates';
import {
  ProcessedHead,
  ImageFilterOptions,
  applyFilterToProcessedHead,
  type CropOval
} from '../utils/imageProcessing';
import {
  StickerTransform,
  DEFAULT_TRANSFORM,
  composeCharacter,
  renderBobbleheadCanvas,
  downloadSticker,
  exportAllStickersBackdrop,
  copyCanvasToClipboard
} from '../utils/canvasSticker';
import {
  Download,
  Copy,
  Check,
  Maximize2,
  Sparkles,
  Smile,
  MessageSquare,
  Layers,
  FlipHorizontal,
  Undo2,
  Dices,
  Scissors
} from 'lucide-react';

interface CanvasEditorProps {
  template: CharacterTemplate;
  processedHead: ProcessedHead;
  rawImage?: HTMLImageElement | null;
  cropOval?: CropOval | null;
  onTemplateChange: (template: CharacterTemplate) => void;
  onSpinRandom: () => void;
  onOpenCutoutRefiner: () => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  template,
  processedHead,
  onTemplateChange,
  onSpinRandom,
  onOpenCutoutRefiner
}) => {
  const [transform, setTransform] = useState<StickerTransform>(DEFAULT_TRANSFORM);
  const [filter, setFilter] = useState<ImageFilterOptions>({
    tint: 'none',
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    posterize: false
  });

  // Current active head (with filters applied if any)
  const [currentHeadCanvas, setCurrentHeadCanvas] = useState<HTMLCanvasElement>(
    processedHead.canvas
  );

  // Bobblehead animation wobble toggle
  const [enableBobbleAnim, setEnableBobbleAnim] = useState<boolean>(true);
  const [wobbleAngle, setWobbleAngle] = useState<number>(0);

  // Export states
  const [copied, setCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Canvas refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Update head when filter changes
  useEffect(() => {
    if (processedHead) {
      const updated = applyFilterToProcessedHead(processedHead, filter);
      setCurrentHeadCanvas(updated.canvas);
    }
  }, [filter, processedHead]);

  // Wobble physics loop for animated bobblehead
  useEffect(() => {
    if (!enableBobbleAnim) {
      setWobbleAngle(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      // Gentle spring wobble oscillation
      const angle = Math.sin(elapsed * 3.5) * 4.5;
      setWobbleAngle(angle);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [enableBobbleAnim]);

  // Render composite canvas whenever inputs change
  const renderPreview = useCallback(async () => {
    if (!currentHeadCanvas) return;
    setIsRendering(true);
    try {
      const composite = await renderBobbleheadCanvas(
        template,
        currentHeadCanvas,
        transform,
        {
          canvasWidth: 500,
          canvasHeight: 600,
          wobbleOffsetAngle: enableBobbleAnim ? wobbleAngle : 0
        }
      );

      const target = previewCanvasRef.current;
      if (target) {
        target.width = composite.width;
        target.height = composite.height;
        const ctx = target.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, target.width, target.height);
          ctx.drawImage(composite, 0, 0);
        }
      }
    } catch (err) {
      console.error('Render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [template, currentHeadCanvas, transform, enableBobbleAnim, wobbleAngle]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const [isGeneratingBackdrop, setIsGeneratingBackdrop] = useState(false);

  // Handle high-res individual PNG download
  const handleDownload = async () => {
    const finalCanvas = await composeCharacter(
      template,
      currentHeadCanvas,
      {
        ...transform,
        canvasWidth: 600,
        canvasHeight: 720,
        wobbleOffsetAngle: 0
      }
    );
    downloadSticker(finalCanvas, `spookify-${template.id}-sticker.png`);
  };

  // Handle export of all stickers on a festive Halloween backdrop
  const handleDownloadBackdrop = async () => {
    if (!currentHeadCanvas) return;
    try {
      setIsGeneratingBackdrop(true);
      await exportAllStickersBackdrop(
        currentHeadCanvas,
        CHARACTER_TEMPLATES,
        transform,
        'spookify-halloween-squad.png'
      );
    } catch (err) {
      console.error('Failed to export backdrop:', err);
    } finally {
      setIsGeneratingBackdrop(false);
    }
  };

  // Handle clipboard copy
  const handleCopy = async () => {
    const finalCanvas = await composeCharacter(
      template,
      currentHeadCanvas,
      {
        ...transform,
        canvasWidth: 600,
        canvasHeight: 720,
        wobbleOffsetAngle: 0
      }
    );
    const ok = await copyCanvasToClipboard(finalCanvas);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Nudge controls
  const nudgeHead = (dx: number, dy: number) => {
    setTransform((prev) => ({
      ...prev,
      headOffsetX: prev.headOffsetX + dx,
      headOffsetY: prev.headOffsetY + dy
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT / CENTER: Bobblehead Canvas Preview Stage */}
      <div className="lg:col-span-6 flex flex-col items-center space-y-4">
        <div className="relative w-full aspect-[5/6] max-w-[420px] rounded-3xl p-4 bg-[#140827]/90 border-2 border-purple-700/60 shadow-2xl glow-purple flex items-center justify-center overflow-hidden">
          {/* Spooky backdrop pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ff6a00_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Bobblehead Canvas */}
          <canvas
            ref={previewCanvasRef}
            className="relative max-h-full max-w-full object-contain filter drop-shadow-2xl select-none"
          />

          {/* Loading indicator */}
          {isRendering && (
            <div className="absolute top-4 right-4 bg-purple-950/80 border border-purple-600/40 rounded-full px-2.5 py-0.5 text-[10px] text-orange-400 font-bold uppercase tracking-wider animate-pulse">
              Updating...
            </div>
          )}

          {/* Active Template Badge */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/40 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            <span className="text-xs font-['Creepster'] text-orange-400 tracking-wider">
              {template.name}
            </span>
          </div>

          {/* Wobble Toggle Button */}
          <button
            onClick={() => setEnableBobbleAnim((prev) => !prev)}
            className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              enableBobbleAnim
                ? 'bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/30'
                : 'bg-purple-950/80 text-purple-300 border-purple-700/50 hover:bg-purple-900'
            }`}
            title="Toggle Bobblehead wobble physics"
          >
            <Sparkles className="w-3 h-3" />
            {enableBobbleAnim ? 'Bobble Wobble: ON' : 'Bobble Wobble: OFF'}
          </button>
        </div>

        {/* Quick Canvas Action Buttons */}
        <div className="w-full max-w-[420px] flex flex-wrap gap-2.5">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-all hover:scale-102 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" /> Download Sticker PNG
          </button>

          <button
            onClick={handleCopy}
            className="py-3 px-4 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600/50 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy
              </>
            )}
          </button>

          <button
            onClick={onSpinRandom}
            className="py-3 px-4 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all hover:scale-102 border border-emerald-500/50 cursor-pointer"
            title="Spin another random body"
          >
            <Dices className="w-4 h-4" /> Spin Body
          </button>
        </div>

        {/* All Stickers Festive Backdrop Export Button */}
        <button
          onClick={handleDownloadBackdrop}
          disabled={isGeneratingBackdrop}
          className="w-full max-w-[420px] py-3 px-4 rounded-xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 hover:from-purple-800 hover:to-indigo-800 text-orange-300 hover:text-orange-200 border-2 border-orange-500/50 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl glow-orange transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '4s' }} />
          {isGeneratingBackdrop ? 'Generating Spooky Squad Scene...' : 'Export All 8 Monsters (Festive Backdrop) 🎃'}
        </button>
      </div>

      {/* RIGHT: Spooky Customization Controls */}
      <div className="lg:col-span-6 space-y-4">
        {/* Navigation / Switch character bar */}
        <div className="p-4 rounded-2xl bg-[#140827]/90 border border-purple-800/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase font-bold text-purple-400 tracking-wider">
              Selected Costume Body
            </span>
            <div className="font-['Creepster'] text-xl text-orange-400">
              {template.name} ({template.badge || template.category})
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onOpenCutoutRefiner}
              className="px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-orange-400" /> Re-cut Head
            </button>

            <select
              value={template.id}
              onChange={(e) => {
                const found = CHARACTER_TEMPLATES.find((t) => t.id === e.target.value);
                if (found) onTemplateChange(found);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#200f38] border border-orange-500/50 text-orange-300 text-xs font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              {CHARACTER_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabbed Customization Panel */}
        <div className="p-5 rounded-2xl bg-[#140827]/90 border border-purple-800/60 space-y-5 text-xs text-slate-200">
          {/* Section 1: Head Size & Neck Alignment */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/50 mb-3">
              <div className="flex items-center gap-2 font-bold text-orange-400 text-sm">
                <Maximize2 className="w-4 h-4" /> Head Scale & Bobblehead Neck Anchor
              </div>
              <button
                onClick={() =>
                  setTransform((prev) => ({
                    ...prev,
                    headOffsetX: 0,
                    headOffsetY: 0,
                    headScale: 1.25,
                    headAngle: 0,
                    flipHeadX: false
                  }))
                }
                className="text-purple-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Undo2 className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Head Scale */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Bobblehead Size</span>
                  <span className="text-orange-400 font-mono">
                    {(transform.headScale * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="2.0"
                  step="0.05"
                  value={transform.headScale}
                  onChange={(e) =>
                    setTransform((prev) => ({
                      ...prev,
                      headScale: parseFloat(e.target.value)
                    }))
                  }
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Head Rotation Tilt */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Head Tilt Angle</span>
                  <span className="text-orange-400 font-mono">
                    {transform.headAngle}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  step="1"
                  value={transform.headAngle}
                  onChange={(e) =>
                    setTransform((prev) => ({
                      ...prev,
                      headAngle: parseInt(e.target.value, 10)
                    }))
                  }
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Neck Nudge D-Pad & Flip */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-purple-900/30">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Nudge Neck:</span>
                <div className="inline-flex rounded-lg border border-purple-800/60 p-0.5 bg-purple-950/50">
                  <button
                    onClick={() => nudgeHead(-4, 0)}
                    className="px-2 py-1 hover:bg-purple-800 rounded text-slate-200 cursor-pointer"
                    title="Move Left"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => nudgeHead(0, -4)}
                    className="px-2 py-1 hover:bg-purple-800 rounded text-slate-200 cursor-pointer"
                    title="Move Up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => nudgeHead(0, 4)}
                    className="px-2 py-1 hover:bg-purple-800 rounded text-slate-200 cursor-pointer"
                    title="Move Down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => nudgeHead(4, 0)}
                    className="px-2 py-1 hover:bg-purple-800 rounded text-slate-200 cursor-pointer"
                    title="Move Right"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Flip Horizontal */}
              <button
                onClick={() =>
                  setTransform((prev) => ({ ...prev, flipHeadX: !prev.flipHeadX }))
                }
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  transform.flipHeadX
                    ? 'bg-orange-500 text-black border-orange-400'
                    : 'bg-purple-950/60 text-purple-200 border-purple-800/60 hover:bg-purple-900'
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" /> Flip Direction
              </button>
            </div>
          </div>

          {/* Section 2: Spooky Skin / Caricature Tints */}
          <div>
            <div className="flex items-center gap-2 font-bold text-orange-400 text-sm pb-2 border-b border-purple-900/50 mb-2.5">
              <Smile className="w-4 h-4" /> Spooky Skin Tint & Caricature Filter
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'none', label: 'Natural', color: '#fcd34d' },
                { id: 'zombie-green', label: 'Zombie Green', color: '#84cc16' },
                { id: 'vampire-pale', label: 'Vampire Pale', color: '#e2e8f0' },
                { id: 'ghost-blue', label: 'Ghost Blue', color: '#38bdf8' },
                { id: 'vintage-sepia', label: 'Vintage Horror', color: '#d97706' },
                { id: 'posterize', label: 'Comic Pop', color: '#ec4899' }
              ].map((tintOption) => {
                const isSelected =
                  tintOption.id === 'posterize'
                    ? filter.posterize
                    : filter.tint === tintOption.id && !filter.posterize;

                return (
                  <button
                    key={tintOption.id}
                    onClick={() => {
                      if (tintOption.id === 'posterize') {
                        setFilter((prev) => ({
                          ...prev,
                          posterize: !prev.posterize
                        }));
                      } else {
                        setFilter((prev) => ({
                          ...prev,
                          tint: tintOption.id as any,
                          posterize: false
                        }));
                      }
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400 ring-1 ring-orange-500'
                        : 'border-purple-900/60 bg-purple-950/30 hover:border-purple-600 text-slate-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: tintOption.color }}
                    />
                    <span className="text-[10px] font-medium truncate w-full text-center">
                      {tintOption.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Halloween Accessories */}
          <div>
            <div className="flex items-center gap-2 font-bold text-orange-400 text-sm pb-2 border-b border-purple-900/50 mb-2.5">
              <Sparkles className="w-4 h-4" /> Head Accessories
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'none', label: 'None', icon: '🚫' },
                { id: 'witch-hat', label: 'Witch Hat', icon: '🧙‍♀️' },
                { id: 'fangs', label: 'Vamp Fangs', icon: '🧛' },
                { id: 'bolts', label: 'Neck Bolts', icon: '⚡' },
                { id: 'horns', label: 'Demon Horns', icon: '😈' },
                { id: 'slime', label: 'Toxic Slime', icon: '🧪' }
              ].map((acc) => (
                <button
                  key={acc.id}
                  onClick={() =>
                    setTransform((prev) => ({
                      ...prev,
                      accessory: acc.id as any
                    }))
                  }
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    transform.accessory === acc.id
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 ring-1 ring-orange-500'
                      : 'border-purple-900/60 bg-purple-950/30 hover:border-purple-600 text-slate-300'
                  }`}
                >
                  <span className="text-base">{acc.icon}</span>
                  <span className="text-[10px] font-medium truncate w-full text-center">
                    {acc.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Sticker Outline & Die-Cut Border */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/50 mb-2.5">
              <div className="flex items-center gap-2 font-bold text-orange-400 text-sm">
                <Layers className="w-4 h-4" /> Die-Cut Sticker Outline
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transform.whiteBorder}
                  onChange={(e) =>
                    setTransform((prev) => ({
                      ...prev,
                      whiteBorder: e.target.checked
                    }))
                  }
                  className="rounded border-purple-800 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-300">
                  White Border
                </span>
              </label>
            </div>

            {transform.whiteBorder && (
              <div className="flex items-center gap-4">
                <span className="text-slate-400">Outline Width:</span>
                <input
                  type="range"
                  min="4"
                  max="18"
                  step="1"
                  value={transform.borderWidth}
                  onChange={(e) =>
                    setTransform((prev) => ({
                      ...prev,
                      borderWidth: parseInt(e.target.value, 10)
                    }))
                  }
                  className="flex-1 accent-orange-500 cursor-pointer"
                />
                <span className="text-orange-400 font-mono">
                  {transform.borderWidth}px
                </span>
              </div>
            )}
          </div>

          {/* Section 5: Halloween Captions / Speech Bubbles */}
          <div>
            <div className="flex items-center gap-2 font-bold text-orange-400 text-sm pb-2 border-b border-purple-900/50 mb-2.5">
              <MessageSquare className="w-4 h-4" /> Halloween Speech Bubble / Caption
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={25}
                placeholder="e.g. BRAAAAINS!, TRICK OR TREAT, SPOOKY!"
                value={transform.caption || ''}
                onChange={(e) =>
                  setTransform((prev) => ({
                    ...prev,
                    caption: e.target.value
                  }))
                }
                className="flex-1 px-3 py-2 rounded-xl bg-[#0e041c] border border-purple-800/60 text-slate-200 placeholder-purple-400/40 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />

              <button
                onClick={() =>
                  setTransform((prev) => ({
                    ...prev,
                    caption: [
                      'BRAAAINS!',
                      'TRICK OR TREAT!',
                      'BOO!',
                      'I VANT BLOOD!',
                      'WANNA PLAY?',
                      'UNDEAD & PROUD'
                    ][Math.floor(Math.random() * 6)]
                  }))
                }
                className="px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700/50 cursor-pointer"
                title="Random Spooky Shout"
              >
                Surprise Me
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
