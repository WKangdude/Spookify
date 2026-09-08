import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Scissors,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Users,
  Check,
  Zap,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import {
  CropOval,
  ProcessedHead,
  PipelineProgress,
  SegmentationPipelineResult,
  cutHeadWithOval,
  estimateHeadBounds,
  processBatchPhotos
} from '../utils/imageProcessing';
import { SAMPLE_PHOTOS } from '../utils/sampleImages';
import { Modal } from './Modal';

interface UploaderProps {
  onHeadSegmented: (
    processed: ProcessedHead,
    rawImage: HTMLImageElement,
    allFriends?: SegmentationPipelineResult[]
  ) => void;
}

export const Uploader: React.FC<UploaderProps> = ({ onHeadSegmented }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);

  // Batch results & active selection
  const [batchResults, setBatchResults] = useState<SegmentationPipelineResult[]>([]);
  const [failedItem, setFailedItem] = useState<SegmentationPipelineResult | null>(null);

  // Manual Crop Refiner state
  const [rawImageForManualCrop, setRawImageForManualCrop] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropOval>({
    centerX: 0.5,
    centerY: 0.38,
    radiusX: 0.28,
    radiusY: 0.34,
    rotation: 0,
    feather: 8
  });
  const [manualPreviewHead, setManualPreviewHead] = useState<ProcessedHead | null>(null);
  const [isManualCropOpen, setIsManualCropOpen] = useState(false);

  // Webcam state
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pipeline processing function for files or data URLs
  const startPipeline = useCallback(
    async (items: { id: string; name: string; source: File | string }[]) => {
      try {
        setFailedItem(null);
        setBatchResults([]);

        const results = await processBatchPhotos(items, (progress) => {
          setPipelineProgress(progress);
        });

        setPipelineProgress(null);
        setBatchResults(results);

        const successful = results.filter((r) => r.success && r.segmentedHead && r.rawImage);
        const failedWithNoFace = results.find((r) => !r.success && r.error === 'NO_FACE_DETECTED');

        if (successful.length === 1 && !failedWithNoFace) {
          // Single photo uploaded and succeeded: proceed directly
          onHeadSegmented(successful[0].segmentedHead!, successful[0].rawImage!, successful);
        } else if (successful.length > 1 && !failedWithNoFace) {
          // Multiple photos succeeded: auto-select first one, pass all friends
          onHeadSegmented(successful[0].segmentedHead!, successful[0].rawImage!, successful);
        } else if (failedWithNoFace) {
          // Face detection failed on an item: prompt user with error alert
          setFailedItem(failedWithNoFace);
        }
      } catch (err) {
        console.error('Pipeline error:', err);
        setPipelineProgress(null);
      }
    },
    [onHeadSegmented]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const items = Array.from(files).map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: file.name,
      source: file
    }));

    // Reset input value so same files can be re-selected if needed
    e.target.value = '';
    await startPipeline(items);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const items = Array.from(files).map((file, idx) => ({
      id: `drop-${Date.now()}-${idx}`,
      name: file.name,
      source: file
    }));

    await startPipeline(items);
  };

  const handleSampleSelect = async (sample: { name: string; dataUrl: string }) => {
    await startPipeline([
      {
        id: `sample-${Date.now()}`,
        name: sample.name,
        source: sample.dataUrl
      }
    ]);
  };

  // Open manual crop refiner for a given image (used for fallback or manual adjustment)
  const openManualCropForImage = useCallback(async (img: HTMLImageElement) => {
    setRawImageForManualCrop(img);
    const initialBounds = await estimateHeadBounds(img);
    setCrop(initialBounds);
    const head = cutHeadWithOval(img, initialBounds);
    setManualPreviewHead(head);
    setIsManualCropOpen(true);
  }, []);

  const updateManualCrop = (updates: Partial<CropOval>) => {
    if (!rawImageForManualCrop) return;
    const newCrop = { ...crop, ...updates };
    setCrop(newCrop);
    const head = cutHeadWithOval(rawImageForManualCrop, newCrop);
    setManualPreviewHead(head);
  };

  const handleConfirmManualCrop = () => {
    if (manualPreviewHead && rawImageForManualCrop) {
      setIsManualCropOpen(false);
      setFailedItem(null);
      onHeadSegmented(manualPreviewHead, rawImageForManualCrop);
    }
  };

  // Webcam Handlers
  const startWebcam = async () => {
    setIsWebcamOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setIsWebcamOpen(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsWebcamOpen(false);
    setCameraCountdown(null);
  };

  const captureWebcamPhoto = () => {
    if (!videoRef.current) return;
    setCameraCountdown(3);
    const timer = setInterval(() => {
      setCameraCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takeSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopWebcam();
    const dataUrl = canvas.toDataURL('image/png');
    await startPipeline([
      {
        id: `webcam-${Date.now()}`,
        name: 'Webcam Selfie',
        source: dataUrl
      }
    ]);
  };

  const isProcessing = pipelineProgress !== null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isProcessing) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing) fileInputRef.current?.click();
        }}
        className={`relative group rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
          isProcessing ? 'cursor-wait border-orange-500/50 bg-[#140827]' : 'cursor-pointer'
        } ${
          isDragging
            ? 'border-orange-500 bg-orange-500/10 scale-[1.01] glow-orange'
            : 'border-purple-600/50 bg-[#140827]/80 hover:border-orange-500/80 hover:bg-[#1a0a33] hover:glow-purple'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {/* Ambient Glows */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/30 transition-all" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-600/25 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/40 transition-all" />

        {/* ACTIVE PIPELINE PROGRESS BAR */}
        {isProcessing && pipelineProgress ? (
          <div className="relative z-10 flex flex-col items-center justify-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-800 to-orange-600 border border-orange-400 flex items-center justify-center text-white shadow-xl glow-orange animate-pulse">
              <Zap className="w-8 h-8 text-orange-300 animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Photo {pipelineProgress.itemIndex + 1} of {pipelineProgress.totalItems}: {pipelineProgress.itemName}
              </span>
              <h3 className="font-['Creepster'] text-2xl text-slate-100 tracking-wide">
                {pipelineProgress.stageLabel}
              </h3>
            </div>

            {/* Glowing Progress Track */}
            <div className="w-full max-w-md space-y-2">
              <div className="w-full h-3.5 rounded-full bg-purple-950/80 border border-purple-700/60 p-0.5 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-green-400 transition-all duration-300 shadow-md"
                  style={{ width: `${Math.max(5, pipelineProgress.overallProgress)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-purple-300/80 px-1">
                <span>Client WASM AI Processing</span>
                <span className="text-orange-400 font-mono font-bold text-sm">
                  {pipelineProgress.overallProgress}%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-purple-300/70 max-w-xs text-center italic">
              Running 100% locally on your browser GPU/WASM. Zero cloud servers used!
            </p>
          </div>
        ) : (
          /* IDLE DROPZONE CONTENT */
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-900/60 to-orange-600/40 border-2 border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-110 group-hover:border-orange-400 transition-transform shadow-lg shadow-purple-950/50">
              <Upload className="w-10 h-10 group-hover:-translate-y-1 transition-transform" />
            </div>

            <div>
              <h3 className="font-['Creepster'] text-3xl tracking-wider text-orange-400 text-shadow-spooky">
                Drop Photos of Friends & Family
              </h3>
              <p className="text-sm text-purple-200/90 mt-1 max-w-md mx-auto">
                Select one or multiple photos. Heads and hair are auto-segmented client-side using{' '}
                <span className="text-green-400 font-semibold">WebAssembly AI</span> with{' '}
                <span className="text-orange-400 font-semibold">zero cloud fees</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" /> Browse Photos (Multi-select)
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startWebcam();
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600/50 hover:border-purple-400 font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-purple-300" /> Take Selfie
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Multiple Processed Friends Selection Tray (if batch had multiple results) */}
      {batchResults.length > 1 && (
        <div className="p-4 rounded-xl bg-[#140827] border-2 border-orange-500/50 glow-orange space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Processed Friends ({batchResults.filter((r) => r.success).length}/{batchResults.length})
            </span>
            <span className="text-[11px] text-purple-300 font-medium">Click to use as bobblehead:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {batchResults.map((result) => {
              if (!result.success || !result.segmentedHead || !result.rawImage) {
                return (
                  <div
                    key={result.id}
                    className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 flex flex-col items-center text-center opacity-80"
                  >
                    <AlertTriangle className="w-6 h-6 text-red-400 mb-1" />
                    <span className="text-[11px] font-bold text-red-200 truncate w-full">
                      {result.name}
                    </span>
                    <button
                      onClick={() => {
                        if (result.rawImage) openManualCropForImage(result.rawImage);
                      }}
                      className="text-[10px] text-orange-400 underline mt-1 hover:text-white cursor-pointer"
                    >
                      Cutout Manually
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={result.id}
                  onClick={() => onHeadSegmented(result.segmentedHead!, result.rawImage!, batchResults)}
                  className="group relative p-2 rounded-xl bg-purple-950/60 border border-purple-700/60 hover:border-orange-400 hover:bg-purple-900/60 transition-all flex flex-col items-center text-center cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1f1035] border-2 border-purple-500/60 group-hover:border-orange-400 flex items-center justify-center p-1">
                    <img
                      src={result.segmentedHead.dataUrl}
                      alt={result.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-orange-300 mt-1 truncate w-full">
                    {result.name}
                  </span>
                  <span className="text-[10px] text-green-400 flex items-center gap-0.5 mt-0.5">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Test Sample Presets */}
      <div className="p-4 rounded-xl bg-[#130722]/70 border border-purple-900/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Instant Test Friends (No Upload Needed):
          </span>
          <span className="text-[11px] text-purple-400 font-medium">1-Click Demo</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SAMPLE_PHOTOS.map((sample) => (
            <button
              key={sample.id}
              disabled={isProcessing}
              onClick={() => handleSampleSelect(sample)}
              className="group flex flex-col items-center p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 hover:border-orange-500/60 hover:bg-purple-900/30 disabled:opacity-50 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border border-purple-500/50 group-hover:border-orange-400 mb-2">
                <img
                  src={sample.dataUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-orange-400 truncate w-full text-center">
                {sample.name}
              </span>
              <span className="text-[10px] text-purple-300/80">{sample.role}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ERROR ALERT MODAL: NO FACE DETECTED */}
      <Modal
        isOpen={failedItem !== null}
        onClose={() => setFailedItem(null)}
        title="No Face Detected! ⚠️"
        subtitle="Our client-side vision model couldn't find a clear face in this photo."
        maxWidth="md"
      >
        <div className="space-y-4">
          {failedItem?.rawImage && (
            <div className="w-full h-44 rounded-xl overflow-hidden bg-black/60 border border-purple-800/60 flex items-center justify-center p-2">
              <img
                src={failedItem.rawImage.src}
                alt={failedItem.name}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-500/40 text-xs text-orange-200 leading-relaxed">
            <p className="font-semibold mb-1">
              Could not find face landmarks in <span className="text-white font-bold">"{failedItem?.name}"</span>.
            </p>
            <p className="text-orange-300/80">
              This can happen if the face is obscured, tilted away, or in heavy shadow. You can manually position the cutout oval right now, or upload a different photo!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={() => {
                if (failedItem?.rawImage) {
                  const img = failedItem.rawImage;
                  setFailedItem(null);
                  openManualCropForImage(img);
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" /> Adjust Cutout Manually ✂️
            </button>

            <button
              onClick={() => {
                setFailedItem(null);
                fileInputRef.current?.click();
              }}
              className="py-2.5 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Another Photo
            </button>
          </div>
        </div>
      </Modal>

      {/* MANUAL CROP REFINER MODAL */}
      <Modal
        isOpen={isManualCropOpen}
        onClose={() => setIsManualCropOpen(false)}
        title="Manual Head Framing ✂️"
        subtitle="Frame your head and hair using the controls below"
        maxWidth="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Checkered Preview */}
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-orange-500/50 shadow-xl bg-[linear-gradient(45deg,#1f1338_25%,transparent_25%),linear-gradient(-45deg,#1f1338_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f1338_75%),linear-gradient(-45deg,transparent_75%,#1f1338_75%)] bg-[size:20px_20px] bg-[#120824] flex items-center justify-center p-2">
              {manualPreviewHead && (
                <img
                  src={manualPreviewHead.dataUrl}
                  alt="Head Preview"
                  className="max-h-full max-w-full object-contain filter drop-shadow-lg"
                />
              )}
            </div>
            <span className="text-xs text-green-400 font-semibold mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Feathered Head Cutout
            </span>
          </div>

          {/* Adjustment Sliders */}
          <div className="space-y-3.5 bg-purple-950/30 p-4 rounded-xl border border-purple-900/50 text-xs">
            <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider pb-1 border-b border-purple-800/40">
              <Sliders className="w-4 h-4 text-orange-400" /> Frame Head Mask
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Center X</span>
                <span className="text-orange-400 font-mono">{(crop.centerX * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.01"
                value={crop.centerX}
                onChange={(e) => updateManualCrop({ centerX: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Center Y</span>
                <span className="text-orange-400 font-mono">{(crop.centerY * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.01"
                value={crop.centerY}
                onChange={(e) => updateManualCrop({ centerY: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Head & Hair Width</span>
                <span className="text-orange-400 font-mono">{(crop.radiusX * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.01"
                value={crop.radiusX}
                onChange={(e) => updateManualCrop({ radiusX: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Head Height</span>
                <span className="text-orange-400 font-mono">{(crop.radiusY * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.55"
                step="0.01"
                value={crop.radiusY}
                onChange={(e) => updateManualCrop({ radiusY: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Tilt Angle</span>
                <span className="text-orange-400 font-mono">{crop.rotation}°</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={crop.rotation}
                onChange={(e) => updateManualCrop({ rotation: parseInt(e.target.value, 10) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-purple-900/50">
          <button
            onClick={() => setIsManualCropOpen(false)}
            className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmManualCrop}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/25 cursor-pointer"
          >
            Continue with Cutout <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </Modal>

      {/* WEBCAM MODAL */}
      <Modal
        isOpen={isWebcamOpen}
        onClose={stopWebcam}
        title="Capture Spooky Selfie 📸"
        subtitle="Look directly at the camera to snap a headshot!"
        maxWidth="lg"
      >
        <div className="relative flex flex-col items-center space-y-4">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border-2 border-purple-600/60">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 border-2 border-dashed border-orange-400/80 rounded-[50%/60%_60%_40%_40%] animate-pulse-glow" />
            </div>

            {cameraCountdown !== null && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                <span className="font-['Creepster'] text-8xl text-orange-400 text-shadow-spooky animate-bounce">
                  {cameraCountdown}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={captureWebcamPhoto}
              disabled={cameraCountdown !== null}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Snap Photo
            </button>
            <button
              onClick={stopWebcam}
              className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-sm font-semibold border border-purple-700/50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
