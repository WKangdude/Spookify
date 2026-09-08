import React, { useState } from 'react';
import { Uploader } from './components/Uploader';
import { Roulette, FriendAvatar, PairedAssignment } from './components/Roulette';
import { CanvasEditor } from './components/CanvasEditor';
import { CharacterCard } from './components/CharacterCard';
import { Modal } from './components/Modal';
import {
  CharacterTemplate,
  CHARACTER_TEMPLATES,
  getRandomTemplate
} from './utils/characterTemplates';
import {
  ProcessedHead,
  CropOval,
  cutHeadWithOval,
  SegmentationPipelineResult
} from './utils/imageProcessing';
import {
  Skull,
  Ghost,
  Sparkles,
  ShieldCheck,
  Zap,
  Grid,
  RotateCcw,
  Scissors,
  Users,
  Dices
} from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [processedHead, setProcessedHead] = useState<ProcessedHead | null>(null);
  const [rawImage, setRawImage] = useState<HTMLImageElement | null>(null);
  const [fullSegmentedImage, setFullSegmentedImage] = useState<HTMLImageElement | null>(null);
  const [cropOval, setCropOval] = useState<CropOval | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate>(
    CHARACTER_TEMPLATES[0]
  );

  // Modals & workflows
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isCutoutRefinerOpen, setIsCutoutRefinerOpen] = useState(false);
  const [tempCrop, setTempCrop] = useState<CropOval>({
    centerX: 0.5,
    centerY: 0.38,
    radiusX: 0.28,
    radiusY: 0.34,
    rotation: 0,
    feather: 8
  });

  const [stage, setStage] = useState<'upload' | 'roulette' | 'editor'>('upload');
  const [friendsList, setFriendsList] = useState<SegmentationPipelineResult[]>([]);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);

  // Called when user uploads/selects and confirms head cutout
  const handleHeadSegmented = (
    head: ProcessedHead,
    raw: HTMLImageElement,
    allFriends?: SegmentationPipelineResult[]
  ) => {
    setProcessedHead(head);
    setRawImage(raw);

    if (allFriends && allFriends.length > 0) {
      setFriendsList(allFriends);
      setActiveFriendId(allFriends[0].id);
      if (allFriends[0].fullSegmentedImage) {
        setFullSegmentedImage(allFriends[0].fullSegmentedImage);
      }
    } else {
      setFriendsList([
        {
          id: `friend-${Date.now()}`,
          name: 'My Friend',
          success: true,
          rawImage: raw,
          segmentedHead: head
        }
      ]);
    }

    // Default crop bounds
    const defaultOval: CropOval = {
      centerX: 0.5,
      centerY: 0.38,
      radiusX: 0.28,
      radiusY: 0.34,
      rotation: 0,
      feather: 8
    };
    setCropOval(defaultOval);
    setTempCrop(defaultOval);

    // Transition to Roulette character assignment
    setStage('roulette');
  };

  // Called when Roulette finishes "Sortear Personajes"
  const handleCompleteRoulette = (assignments: PairedAssignment[]) => {
    if (assignments.length > 0) {
      const updatedFriends: SegmentationPipelineResult[] = assignments.map((a) => ({
        id: a.friend.id,
        name: a.friend.name,
        success: true,
        rawImage: a.friend.rawImage,
        segmentedHead: a.friend.segmentedHead,
        fullSegmentedImage: a.friend.fullSegmentedImage,
        cropOval: a.friend.cropOval
      }));
      setFriendsList(updatedFriends);

      const first = assignments[0];
      setActiveFriendId(first.friend.id);
      setProcessedHead(first.friend.segmentedHead);
      setRawImage(first.friend.rawImage);
      if (first.friend.fullSegmentedImage) {
        setFullSegmentedImage(first.friend.fullSegmentedImage);
      }
      setSelectedTemplate(first.template);
      if (first.friend.cropOval) {
        setCropOval(first.friend.cropOval);
        setTempCrop(first.friend.cropOval);
      }
    }
    setStage('editor');
  };

  const handleSelectFriend = (friend: SegmentationPipelineResult) => {
    if (friend.segmentedHead && friend.rawImage) {
      setActiveFriendId(friend.id);
      setProcessedHead(friend.segmentedHead);
      setRawImage(friend.rawImage);
      if (friend.fullSegmentedImage) {
        setFullSegmentedImage(friend.fullSegmentedImage);
      }
      if (friend.cropOval) {
        setCropOval(friend.cropOval);
        setTempCrop(friend.cropOval);
      }
    }
  };

  // Re-spin random body
  const handleSpinRandom = () => {
    const nextTemplate = getRandomTemplate(selectedTemplate.id);
    setSelectedTemplate(nextTemplate);
  };

  // Reset to upload another photo
  const handleReset = () => {
    setProcessedHead(null);
    setRawImage(null);
    setFullSegmentedImage(null);
    setFriendsList([]);
    setActiveFriendId(null);
    setStage('upload');
  };

  // Construct FriendAvatar list for Roulette
  const friendAvatars: FriendAvatar[] = friendsList
    .filter((f) => f.success && f.segmentedHead && f.rawImage)
    .map((f) => ({
      id: f.id,
      name: f.name,
      segmentedHead: f.segmentedHead!,
      rawImage: f.rawImage!,
      fullSegmentedImage: f.fullSegmentedImage,
      cropOval: f.cropOval
    }));

  if (friendAvatars.length === 0 && processedHead && rawImage) {
    friendAvatars.push({
      id: activeFriendId || 'friend-1',
      name: 'My Friend',
      segmentedHead: processedHead,
      rawImage: rawImage,
      fullSegmentedImage: fullSegmentedImage || undefined,
      cropOval: cropOval || undefined
    });
  }

  // Update crop in cutout refiner modal
  const handleSaveRefinedCrop = () => {
    const srcImg = fullSegmentedImage || rawImage;
    if (!srcImg) return;
    setCropOval(tempCrop);
    const updated = cutHeadWithOval(srcImg, tempCrop);
    setProcessedHead(updated);
    setIsCutoutRefinerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0314] text-slate-100 flex flex-col relative overflow-hidden selection:bg-orange-500 selection:text-black">
      {/* Halloween Ambient Glows & Fog Elements */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="fixed bottom-0 right-1/4 w-[30rem] h-[30rem] bg-orange-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-72 h-72 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Spooky Header / Nav */}
      <header className="border-b border-purple-900/60 bg-[#10061e]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-800 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 border border-orange-400/50">
              <Skull className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Creepster'] text-2xl sm:text-3xl tracking-wider text-orange-400 text-shadow-spooky leading-none">
                  SPOOKIFY
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
                  Halloween 🎃
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80 font-medium hidden sm:block">
                Zero-Cost Client-Side Bobblehead Sticker Generator
              </p>
            </div>
          </div>

          {/* Header Action Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Character Library</span>
              <span className="sm:hidden">Bodies</span>
            </button>

            {stage === 'editor' && (
              <button
                onClick={() => setStage('roulette')}
                className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5 text-orange-400" />
                <span>Sortear</span>
              </button>
            )}

            {stage !== 'upload' && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Photo</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-green-400 font-semibold px-2.5 py-1 rounded-full bg-green-950/40 border border-green-700/40">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Client-Side (Zero Server Cost)
            </div>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center">
        {/* Step 1: No photo uploaded yet -> Show Uploader & Body Templates */}
        {stage === 'upload' && (
          <div className="w-full space-y-10">
            {/* Hero Banner */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-900/50 border border-purple-600/40 text-orange-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Ghost className="w-4 h-4 text-green-400" /> Transform Friends into Spooky Bobbleheads
              </div>
              <h2 className="font-['Creepster'] text-4xl sm:text-6xl text-slate-100 tracking-wide text-shadow-spooky leading-tight">
                Turn Anyone Into A <br />
                <span className="text-orange-400">Halloween Monster Sticker!</span>
              </h2>
              <p className="text-sm sm:text-base text-purple-200/80 max-w-lg mx-auto">
                Upload any selfie or family snapshot. Heads are cleanly segmented directly in your
                browser and mounted onto iconic cartoon monster bodies!
              </p>

              {/* Zero-Cost Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-green-400">
                  <Zap className="w-3.5 h-3.5" /> Zero Cloud / API Costs
                </span>
                <span className="flex items-center gap-1.5 text-purple-300">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Client Privacy
                </span>
                <span className="flex items-center gap-1.5 text-orange-400">
                  <Sparkles className="w-3.5 h-3.5" /> Die-Cut Sticker Outlines
                </span>
              </div>
            </div>

            {/* Photo Upload Zone */}
            <Uploader onHeadSegmented={handleHeadSegmented} />

            {/* Monster Body Roster Showcase */}
            <div className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-['Creepster'] text-2xl text-orange-400 tracking-wide">
                    Cartoon Body Templates
                  </h3>
                  <p className="text-xs text-purple-300/80 font-medium">
                    Transparent PNG bobblehead bodies with neck anchors ready to wear your face!
                  </p>
                </div>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  View All ({CHARACTER_TEMPLATES.length}) →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {CHARACTER_TEMPLATES.map((tmpl) => (
                  <CharacterCard
                    key={tmpl.id}
                    template={tmpl}
                    compact
                    isSelected={tmpl.id === selectedTemplate.id}
                    onSelect={(t) => {
                      setSelectedTemplate(t);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Roulette Assignment ("Sortear Personajes") */}
        {stage === 'roulette' && (
          <div className="w-full space-y-6">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Character Assignment Wheel
              </div>
              <h2 className="font-['Creepster'] text-4xl sm:text-5xl text-orange-400 text-shadow-spooky">
                Sortear Personajes 🎲
              </h2>
              <p className="text-sm text-purple-200/80">
                Spin the wheel to pair each friend with a distinct Halloween monster body without duplicates!
              </p>
            </div>

            <Roulette
              friends={friendAvatars}
              onCompleteAssignment={handleCompleteRoulette}
              onOpenCharacterLibrary={() => setIsLibraryOpen(true)}
            />
          </div>
        )}

        {/* Step 3: Interactive Canvas Editor */}
        {stage === 'editor' && (
          <div className="w-full space-y-6">
            {/* Multi-Friend Switcher Bar */}
            {friendsList.filter((f) => f.success && f.segmentedHead).length > 1 && (
              <div className="w-full max-w-6xl mx-auto p-3.5 rounded-2xl bg-[#140827]/90 border border-purple-800/60 flex flex-wrap items-center justify-between gap-3 shadow-lg glow-purple">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                  <Users className="w-4 h-4" />
                  <span>Choose Friend ({friendsList.filter((f) => f.success).length}):</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  {friendsList
                    .filter((f) => f.success && f.segmentedHead)
                    .map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleSelectFriend(f)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          f.id === activeFriendId
                            ? 'bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/30 scale-102 ring-2 ring-orange-500/40'
                            : 'bg-purple-950/60 text-purple-200 border-purple-800/60 hover:bg-purple-900'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-black/40 border border-black/50 flex items-center justify-center">
                          <img
                            src={f.segmentedHead!.dataUrl}
                            alt={f.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <span className="truncate max-w-[120px]">{f.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <CanvasEditor
              template={selectedTemplate}
              processedHead={processedHead!}
              rawImage={rawImage}
              cropOval={cropOval}
              onTemplateChange={setSelectedTemplate}
              onSpinRandom={handleSpinRandom}
              onOpenCutoutRefiner={() => setIsCutoutRefinerOpen(true)}
            />

            {/* Quick Roulette Re-spin Bar */}
            <div className="w-full max-w-4xl mx-auto pt-4">
              <Roulette
                friends={friendAvatars}
                currentTemplate={selectedTemplate}
                onTemplateSelected={setSelectedTemplate}
                onCompleteAssignment={handleCompleteRoulette}
                onOpenCharacterLibrary={() => setIsLibraryOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Character Library Modal */}
      <Modal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        title="Monster Costume Body Library 🎃"
        subtitle="Choose from 8 transparent cartoon templates with customized neck anchors"
        maxWidth="4xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-2">
          {CHARACTER_TEMPLATES.map((tmpl) => (
            <CharacterCard
              key={tmpl.id}
              template={tmpl}
              isSelected={tmpl.id === selectedTemplate.id}
              onSelect={(t) => {
                setSelectedTemplate(t);
                setIsLibraryOpen(false);
              }}
            />
          ))}
        </div>
      </Modal>

      {/* Head Cutout Refiner Modal (when inside CanvasEditor) */}
      <Modal
        isOpen={isCutoutRefinerOpen}
        onClose={() => setIsCutoutRefinerOpen(false)}
        title="Fine-Tune Head Cutout ✂️"
        subtitle="Adjust the egg/oval mask, angle, or feathering on your source photo"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Horizontal Center: {(tempCrop.centerX * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.01"
                value={tempCrop.centerX}
                onChange={(e) =>
                  setTempCrop((prev) => ({
                    ...prev,
                    centerX: parseFloat(e.target.value)
                  }))
                }
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Vertical Center: {(tempCrop.centerY * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.01"
                value={tempCrop.centerY}
                onChange={(e) =>
                  setTempCrop((prev) => ({
                    ...prev,
                    centerY: parseFloat(e.target.value)
                  }))
                }
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Head Width: {(tempCrop.radiusX * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.01"
                value={tempCrop.radiusX}
                onChange={(e) =>
                  setTempCrop((prev) => ({
                    ...prev,
                    radiusX: parseFloat(e.target.value)
                  }))
                }
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Head Height: {(tempCrop.radiusY * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.15"
                max="0.55"
                step="0.01"
                value={tempCrop.radiusY}
                onChange={(e) =>
                  setTempCrop((prev) => ({
                    ...prev,
                    radiusY: parseFloat(e.target.value)
                  }))
                }
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Tilt Angle: {tempCrop.rotation}°
              </label>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={tempCrop.rotation}
                onChange={(e) =>
                  setTempCrop((prev) => ({
                    ...prev,
                    rotation: parseInt(e.target.value, 10)
                  }))
                }
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Edge Feathering: {tempCrop.feather}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={tempCrop.feather}
                onChange={(e) =>
                  setTempCrop((prev) => ({
                    ...prev,
                    feather: parseInt(e.target.value, 10)
                  }))
                }
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-purple-900/50">
            <button
              onClick={() => setIsCutoutRefinerOpen(false)}
              className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRefinedCrop}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" /> Apply Cutout
            </button>
          </div>
        </div>
      </Modal>

      {/* Spooky Halloween Footer */}
      <footer className="mt-auto border-t border-purple-900/50 bg-[#0e041c] py-6 px-4 text-center text-xs text-purple-300/70">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-orange-400 font-['Creepster'] text-lg">
            <span>SPOOKIFY</span>
            <span className="text-purple-400 text-xs font-sans">
              • 100% Client-Side Halloween Caricature Generator
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Zero Cloud Costs</span>
            <span>•</span>
            <span>Runs 100% in Browser</span>
            <span>•</span>
            <span>Die-Cut PNG Stickers</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
