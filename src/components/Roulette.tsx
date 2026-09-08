import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CharacterTemplate,
  CHARACTER_TEMPLATES
} from '../utils/characterTemplates';
import { ProcessedHead, CropOval } from '../utils/imageProcessing';
import {
  Dices,
  Sparkles,
  Users,
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface FriendAvatar {
  id: string;
  name: string;
  segmentedHead: ProcessedHead;
  rawImage: HTMLImageElement;
  fullSegmentedImage?: HTMLImageElement;
  cropOval?: CropOval;
  assignedTemplate?: CharacterTemplate;
}

export interface PairedAssignment {
  friend: FriendAvatar;
  template: CharacterTemplate;
}

interface RouletteProps {
  friends?: FriendAvatar[];
  onCompleteAssignment?: (assignments: PairedAssignment[]) => void;
  // Backward-compatibility props for single template mode
  currentTemplate?: CharacterTemplate | null;
  onTemplateSelected?: (template: CharacterTemplate) => void;
  onOpenCharacterLibrary?: () => void;
  isSpinning?: boolean;
}

// Visual theme configurations for the 8 wheel wedges
const WEDGE_COLORS = [
  { bg: '#991b1b', text: '#fee2e2', emoji: '🔪' }, // Chucky
  { bg: '#b45309', text: '#fef3c7', emoji: '🏺' }, // Mummy
  { bg: '#3f6212', text: '#ecfccb', emoji: '🧟' }, // Zombie
  { bg: '#581c87', text: '#f3e8ff', emoji: '🦇' }, // Vampire
  { bg: '#6b21a8', text: '#f5d0fe', emoji: '🧙‍♀️' }, // Witch
  { bg: '#065f46', text: '#d1fae5', emoji: '⚡' }, // Frankenstein
  { bg: '#0369a1', text: '#e0f2fe', emoji: '👻' }, // Ghost
  { bg: '#78350f', text: '#ffedd5', emoji: '🐺' }  // Werewolf
];

export const Roulette: React.FC<RouletteProps> = ({
  friends = [],
  onCompleteAssignment,
  currentTemplate,
  onTemplateSelected,
  onOpenCharacterLibrary
}) => {
  // If friends prop is empty, provide a fallback virtual friend using currentTemplate
  const effectiveFriends: FriendAvatar[] = friends.length > 0
    ? friends
    : [
        {
          id: 'single-user',
          name: 'My Monster',
          segmentedHead: {} as ProcessedHead,
          rawImage: {} as HTMLImageElement
        }
      ];

  // State
  const [currentFriendIdx, setCurrentFriendIdx] = useState<number>(0);
  const [assignedPairs, setAssignedPairs] = useState<PairedAssignment[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Wheel animation refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTickWedgeRef = useRef<number>(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTickSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + Math.random() * 50, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio autoplay policy catch
    }
  }, [getAudioContext]);

  const playFanfareSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4, E4, G4, C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    } catch {
      // Audio autoplay catch
    }
  }, [getAudioContext]);

  // Trigger celebration confetti
  const triggerCelebration = useCallback(() => {
    playFanfareSound();

    // Center burst
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ff6a00', '#a855f7', '#22c55e', '#facc15', '#ef4444', '#ffffff']
    });

    // Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.65 },
        colors: ['#ff6a00', '#22c55e', '#ffffff']
      });
    }, 150);

    // Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.65 },
        colors: ['#a855f7', '#facc15', '#ffffff']
      });
    }, 300);
  }, [playFanfareSound]);

  // Draw the HTML5 Canvas Roulette Wheel
  const drawWheel = useCallback((rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const R = width * 0.43;
    const totalWedges = CHARACTER_TEMPLATES.length;
    const arc = (2 * Math.PI) / totalWedges;

    ctx.clearRect(0, 0, width, height);

    // 1. Wheel Rim Outer Glow & Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(255, 106, 0, 0.35)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 14, 0, Math.PI * 2);
    ctx.fillStyle = '#140625';
    ctx.fill();
    ctx.restore();

    // 2. Draw Wedges
    for (let i = 0; i < totalWedges; i++) {
      const char = CHARACTER_TEMPLATES[i];
      const theme = WEDGE_COLORS[i % WEDGE_COLORS.length];
      const startAngle = rotationAngle + i * arc;
      const endAngle = startAngle + arc;

      // Wedge background
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = theme.bg;
      ctx.fill();

      // Divider spokes
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#facc15';
      ctx.stroke();

      // Wedge text and emoji radiating outward
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Character name
      ctx.font = 'bold 15px "Creepster", cursive, sans-serif';
      ctx.fillStyle = theme.text;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(char.name.toUpperCase(), R - 24, 0);

      // Icon / Emoji
      ctx.font = '19px sans-serif';
      ctx.fillText(theme.emoji, R - 130, 0);

      ctx.restore();
    }

    // 3. Outer Rim with Illuminating Rivets
    ctx.save();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#270e44';
    ctx.beginPath();
    ctx.arc(cx, cy, R + 7, 0, Math.PI * 2);
    ctx.stroke();

    // Gold borders on rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    // Rivet bulbs around perimeter
    const numBulbs = 24;
    const bulbArc = (2 * Math.PI) / numBulbs;
    for (let b = 0; b < numBulbs; b++) {
      const bAngle = b * bulbArc + (rotationAngle * 0.5);
      const bx = cx + Math.cos(bAngle) * (R + 7);
      const by = cy + Math.sin(bAngle) * (R + 7);

      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = b % 2 === 0 ? '#facc15' : '#ff7800';
      ctx.fill();
    }
    ctx.restore();

    // 4. Center Hub
    ctx.save();
    const hubR = 46;
    const hubGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, hubR);
    hubGrad.addColorStop(0, '#3b0764');
    hubGrad.addColorStop(0.8, '#18072b');
    hubGrad.addColorStop(1, '#0b0214');

    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    // Center icon
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '26px sans-serif';
    ctx.fillText('🎃', cx, cy);
    ctx.restore();

    // 5. Top Pointer Indicator at 12 o'clock (pointing down into winning wedge)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.moveTo(cx, 44);       // tip pointing down
    ctx.lineTo(cx - 14, 12);  // top left
    ctx.lineTo(cx + 14, 12);  // top right
    ctx.closePath();
    ctx.fillStyle = '#ff6a00';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();

    // Check which wedge is currently passing under the pointer (at 12 o'clock, angle -PI/2)
    const pointerAngle = 1.5 * Math.PI; // 270 deg
    const normalizedAngle = ((pointerAngle - rotationAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const activeWedge = Math.floor(normalizedAngle / arc) % totalWedges;

    if (activeWedge !== lastTickWedgeRef.current) {
      lastTickWedgeRef.current = activeWedge;
      if (isSpinning) {
        playTickSound();
      }
    }
  }, [isSpinning, playTickSound]);

  // Initial draw & alignment with currentTemplate
  useEffect(() => {
    if (currentTemplate) {
      const idx = CHARACTER_TEMPLATES.findIndex((t) => t.id === currentTemplate.id);
      if (idx !== -1) {
        const arc = (2 * Math.PI) / CHARACTER_TEMPLATES.length;
        const desiredAngle = (((1.5 * Math.PI - (idx + 0.5) * arc) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        rotationRef.current = desiredAngle;
        drawWheel(desiredAngle);
        return;
      }
    }
    drawWheel(rotationRef.current);
  }, [currentTemplate, drawWheel]);

  // Handle single-spin animation promise
  const spinToCharacter = useCallback(
    (targetTemplate: CharacterTemplate): Promise<void> => {
      return new Promise((resolve) => {
        const totalWedges = CHARACTER_TEMPLATES.length;
        const arc = (2 * Math.PI) / totalWedges;
        const targetIdx = CHARACTER_TEMPLATES.findIndex((t) => t.id === targetTemplate.id);
        const safeIdx = targetIdx !== -1 ? targetIdx : 0;

        // Pointer is at 12 o'clock (1.5 * Math.PI).
        // Wedge center: rotation + (safeIdx + 0.5) * arc = 1.5 * Math.PI
        const desiredRotationNorm =
          (((1.5 * Math.PI - (safeIdx + 0.5) * arc) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        const currentRot = rotationRef.current;
        const currentNorm = ((currentRot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const diff = (desiredRotationNorm - currentNorm + 2 * Math.PI) % (2 * Math.PI);

        // 4 full revolutions + difference
        const extraTurns = 4 + Math.floor(Math.random() * 2);
        const totalDelta = extraTurns * (2 * Math.PI) + diff;
        const targetRotation = currentRot + totalDelta;

        const duration = 2800; // ms
        const startTime = performance.now();

        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);

          // Cubic ease-out deceleration curve
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const currentAngle = currentRot + totalDelta * easeOut;
          rotationRef.current = currentAngle;
          drawWheel(currentAngle);

          if (progress < 1) {
            animFrameRef.current = requestAnimationFrame(animate);
          } else {
            rotationRef.current = targetRotation;
            drawWheel(targetRotation);
            resolve();
          }
        };

        animFrameRef.current = requestAnimationFrame(animate);
      });
    },
    [drawWheel]
  );

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // 2. Sortear Personajes handler:
  // Runs the spin animation to assign each friend's head to a distinct Halloween character body without duplicates
  const handleSortearPersonajes = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsComplete(false);
    setCountdownSeconds(null);
    setAssignedPairs([]);

    // 1. Generate non-duplicate assignments for all friends
    const shuffled = [...CHARACTER_TEMPLATES].sort(() => Math.random() - 0.5);
    const plannedAssignments: PairedAssignment[] = effectiveFriends.map((friend, idx) => ({
      friend,
      // Pick unique character without duplicates when N <= 8, or cycle if N > 8
      template: shuffled[idx % shuffled.length]
    }));

    const accumulatedPairs: PairedAssignment[] = [];

    // 2. Spin sequentially for each friend
    for (let i = 0; i < plannedAssignments.length; i++) {
      setCurrentFriendIdx(i);
      const assignment = plannedAssignments[i];

      // Run wheel spin animation to target
      await spinToCharacter(assignment.template);

      // Record completed pair
      accumulatedPairs.push(assignment);
      setAssignedPairs([...accumulatedPairs]);

      if (onTemplateSelected) {
        onTemplateSelected(assignment.template);
      }

      // Small pause between multiple friends
      if (i < plannedAssignments.length - 1) {
        await new Promise((r) => setTimeout(r, 650));
      }
    }

    setIsSpinning(false);
    setIsComplete(true);

    // 3. Celebratory sounds & canvas-confetti!
    triggerCelebration();

    // 4. Automatically forward to Canvas Editor after celebration countdown
    let count = 3;
    setCountdownSeconds(count);

    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        setCountdownSeconds(null);
        if (onCompleteAssignment) {
          onCompleteAssignment(accumulatedPairs);
        }
      } else {
        setCountdownSeconds(count);
      }
    }, 1000);
  };

  const handleManualForward = () => {
    if (onCompleteAssignment && assignedPairs.length > 0) {
      onCompleteAssignment(assignedPairs);
    }
  };

  const activeFriend = effectiveFriends[currentFriendIdx] || effectiveFriends[0];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-[#140827]/95 border-2 border-purple-700/60 p-5 sm:p-7 shadow-2xl glow-purple relative overflow-hidden text-slate-100">
      {/* Spooky Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-purple-900/50 relative z-10 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
            <Dices className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-['Creepster'] text-2xl sm:text-3xl text-orange-400 tracking-wider text-shadow-spooky leading-none">
              Monster Roulette Wheel
            </h3>
            <p className="text-xs text-purple-300/80 font-medium mt-0.5">
              Distinct Halloween body assignment without duplicates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-900/80 border border-purple-700/50 text-purple-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            {effectiveFriends.length} {effectiveFriends.length === 1 ? 'Friend' : 'Friends'}
          </span>

          {onOpenCharacterLibrary && (
            <button
              onClick={onOpenCharacterLibrary}
              disabled={isSpinning}
              className="px-3 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-800 text-purple-200 border border-purple-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Library
            </button>
          )}
        </div>
      </div>

      {/* Main Wheel & Friends Grid */}
      <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* LEFT: Interactive HTML5 Canvas Animated Roulette Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Canvas Wheel Element */}
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              className="max-w-[320px] sm:max-w-[380px] aspect-square rounded-full select-none cursor-pointer filter drop-shadow-2xl transition-transform"
              onClick={!isSpinning ? handleSortearPersonajes : undefined}
            />

            {/* Pulsing indicator when spinning */}
            {isSpinning && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500 text-black text-xs font-black uppercase tracking-wider animate-bounce shadow-lg shadow-orange-500/50 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Spinning...
              </div>
            )}
          </div>

          {/* Current Target Announcement */}
          <div className="mt-4 text-center">
            <span className="text-xs text-purple-300 font-semibold block">
              {isSpinning
                ? `Spinning for: ${activeFriend.name}...`
                : isComplete
                ? '🎉 All Monsters Assigned!'
                : `Ready to assign monster bodies for ${effectiveFriends.length} ${effectiveFriends.length === 1 ? 'friend' : 'friends'}`}
            </span>
          </div>
        </div>

        {/* RIGHT: Friends Roster & Live Paired Assignments */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-orange-400 pb-1 border-b border-purple-900/40">
            <span>Assignment Roster</span>
            <span>
              {assignedPairs.length}/{effectiveFriends.length} Assigned
            </span>
          </div>

          {/* List of Friends with their assigned bodies */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {effectiveFriends.map((friend, idx) => {
              const pair = assignedPairs.find((p) => p.friend.id === friend.id);
              const isCurrent = isSpinning && currentFriendIdx === idx;

              return (
                <div
                  key={friend.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    isCurrent
                      ? 'bg-orange-500/15 border-orange-500 glow-orange scale-102'
                      : pair
                      ? 'bg-purple-950/60 border-green-500/50'
                      : 'bg-purple-950/30 border-purple-900/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {/* Face Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-black/40 border border-purple-500/50 flex-shrink-0 flex items-center justify-center">
                      {friend.segmentedHead?.dataUrl ? (
                        <img
                          src={friend.segmentedHead.dataUrl}
                          alt={friend.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-sm">👤</span>
                      )}
                    </div>

                    <div className="truncate">
                      <h5 className="text-xs font-bold text-slate-200 truncate">{friend.name}</h5>
                      <span className="text-[11px] font-medium text-purple-300 truncate block">
                        {pair ? (
                          <span className="text-green-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {pair.template.name}
                          </span>
                        ) : isCurrent ? (
                          <span className="text-orange-400 animate-pulse font-semibold">
                            Spinning fate...
                          </span>
                        ) : (
                          'Awaiting Monster...'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Body preview if assigned */}
                  {pair ? (
                    <div className="w-9 h-9 rounded-lg bg-black/40 border border-purple-700/50 flex-shrink-0 flex items-center justify-center p-0.5">
                      <img
                        src={pair.template.bodyImagePath}
                        alt={pair.template.name}
                        className="max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-base opacity-40">❓</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Primary Action Button: "Sortear Personajes" */}
          <div className="pt-3 space-y-2">
            <button
              onClick={handleSortearPersonajes}
              disabled={isSpinning}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/30 glow-orange transition-all hover:scale-102 disabled:opacity-50 cursor-pointer"
            >
              <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning
                ? 'Asignando Personajes...'
                : assignedPairs.length > 0
                ? 'Sortear de Nuevo 🎲'
                : 'Sortear Personajes 🎲'}
            </button>

            {/* Auto-forward countdown or manual launch button */}
            {isComplete && (
              <div className="p-3 rounded-xl bg-green-950/50 border border-green-500/50 flex items-center justify-between animate-in fade-in duration-300">
                <span className="text-xs text-green-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  {countdownSeconds !== null
                    ? `Forwarding in ${countdownSeconds}s...`
                    : 'Pairs ready for editor!'}
                </span>

                <button
                  onClick={handleManualForward}
                  className="px-3.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-black font-extrabold text-xs flex items-center gap-1 shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  Go to Editor <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
