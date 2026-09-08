/**
 * 100% Client-Side Image Processing, Background Removal & Face Segmentation
 * - Powered by @imgly/background-removal (WebAssembly/WebGPU)
 * - Powered by @mediapipe/tasks-vision (BlazeFace Detector)
 * - Runs strictly in the browser with zero cloud or backend compute costs.
 */

import { removeBackground, Config as ImglyConfig } from '@imgly/background-removal';
import { FilesetResolver, FaceDetector, FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

export type { NormalizedLandmark };

export interface CropOval {
  centerX: number; // 0..1 ratio of source image
  centerY: number; // 0..1 ratio of source image
  radiusX: number; // 0..1 ratio
  radiusY: number; // 0..1 ratio
  rotation: number; // degrees
  feather: number; // pixels
}

export interface ImageFilterOptions {
  brightness?: number; // 0.5 .. 1.5
  contrast?: number;   // 0.5 .. 1.5
  saturation?: number; // 0 .. 2
  tint?: 'none' | 'zombie-green' | 'vampire-pale' | 'ghost-blue' | 'vintage-sepia';
  posterize?: boolean;
}

export interface ProcessedHead {
  dataUrl: string;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
}

export interface FaceKeypoints {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  chin: { x: number; y: number };
  rightEar?: { x: number; y: number };
  leftEar?: { x: number; y: number };
}

export interface DetectedFace {
  boundingBox: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  keypoints: FaceKeypoints;
  score?: number;
}

export type PipelineStage =
  | 'queued'
  | 'loading'
  | 'removing_background'
  | 'detecting_face'
  | 'cropping_head'
  | 'complete'
  | 'error';

export interface PipelineProgress {
  currentStage: PipelineStage;
  stageLabel: string;
  stageProgress: number; // 0..100 for current active step
  overallProgress: number; // 0..100 across whole batch
  itemIndex: number;
  totalItems: number;
  itemName: string;
}

export interface SegmentationPipelineResult {
  id: string;
  name: string;
  success: boolean;
  rawImage?: HTMLImageElement;
  segmentedHead?: ProcessedHead;
  fullSegmentedImage?: HTMLImageElement;
  detectedFace?: DetectedFace;
  cropOval?: CropOval;
  error?: 'NO_FACE_DETECTED' | 'BG_REMOVAL_FAILED' | 'LOAD_FAILED' | string;
  errorMessage?: string;
}

// Shared vision fileset resolver
let visionFilesetPromise: Promise<any> | null = null;

async function getVisionFileset() {
  if (!visionFilesetPromise) {
    visionFilesetPromise = FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
  }
  return visionFilesetPromise;
}

// MediaPipe detector singleton instance
let faceDetectorInstance: FaceDetector | null = null;
let isInitializingDetector = false;

/**
 * Initializes or returns the cached MediaPipe FaceDetector
 */
export async function getFaceDetector(): Promise<FaceDetector> {
  if (faceDetectorInstance) return faceDetectorInstance;

  while (isInitializingDetector) {
    await new Promise((r) => setTimeout(r, 60));
    if (faceDetectorInstance) return faceDetectorInstance;
  }

  isInitializingDetector = true;
  try {
    const vision = await getVisionFileset();

    try {
      // Prefer GPU delegate for hardware acceleration
      faceDetectorInstance = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU'
        },
        runningMode: 'IMAGE'
      });
    } catch {
      // Fallback to CPU delegate if WebGL/GPU is not supported
      faceDetectorInstance = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'CPU'
        },
        runningMode: 'IMAGE'
      });
    }

    return faceDetectorInstance;
  } finally {
    isInitializingDetector = false;
  }
}

// MediaPipe landmarker singleton instance
let faceLandmarkerInstance: FaceLandmarker | null = null;
let isInitializingLandmarker = false;

/**
 * Initializes or returns the cached MediaPipe FaceLandmarker
 */
export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;

  while (isInitializingLandmarker) {
    await new Promise((r) => setTimeout(r, 60));
    if (faceLandmarkerInstance) return faceLandmarkerInstance;
  }

  isInitializingLandmarker = true;
  try {
    const vision = await getVisionFileset();

    try {
      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'IMAGE',
        numFaces: 1
      });
    } catch (gpuErr) {
      console.warn('FaceLandmarker GPU delegate failed, falling back to CPU:', gpuErr);
      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU'
        },
        runningMode: 'IMAGE',
        numFaces: 1
      });
    }

    return faceLandmarkerInstance;
  } finally {
    isInitializingLandmarker = false;
  }
}

/**
 * Detects 468+ facial mesh landmarks via MediaPipe FaceLandmarker.
 * Returns the normalized landmarks of the primary detected face, or null.
 */
export async function detectLandmarksWithMediaPipe(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<NormalizedLandmark[] | null> {
  try {
    const landmarker = await getFaceLandmarker();
    const result = landmarker.detect(image);

    if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
      return result.faceLandmarks[0];
    }
    return null;
  } catch (err) {
    console.warn('MediaPipe FaceLandmarker detection failed or unavailable:', err);
    return null;
  }
}

/**
 * Loads an image from File, Blob, or URL client-side
 */
export async function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Removes photo background client-side using @imgly/background-removal (WebAssembly/WebGPU)
 */
export async function runBackgroundRemoval(
  imageSource: File | Blob | HTMLImageElement | string,
  onProgress?: (percent: number, message: string) => void
): Promise<HTMLImageElement> {
  let sourceForImgly: Blob | string = typeof imageSource === 'string' ? imageSource : (imageSource as any);

  if (imageSource instanceof HTMLImageElement) {
    const c = document.createElement('canvas');
    c.width = imageSource.naturalWidth || imageSource.width;
    c.height = imageSource.naturalHeight || imageSource.height;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.drawImage(imageSource, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/png'));
      if (blob) sourceForImgly = blob;
    }
  }

  const config: ImglyConfig = {
    model: 'isnet_fp16', // Fast half-precision model for client-side WebGPU/WASM inference
    output: {
      format: 'image/png',
      quality: 0.95
    },
    progress: (key: string, current: number, total: number) => {
      if (onProgress) {
        let percent = total > 0 ? Math.round((current / total) * 100) : 0;
        let label = 'Removing background...';
        if (key.includes('fetch')) {
          label = 'Fetching client AI models...';
          percent = Math.min(50, Math.round(percent * 0.5));
        } else if (key.includes('compute')) {
          label = 'Segmenting subject on WebGPU/WASM...';
          percent = Math.min(100, 50 + Math.round(percent * 0.5));
        }
        onProgress(Math.max(5, Math.min(99, percent)), label);
      }
    }
  };

  try {
    const transparentBlob = await removeBackground(sourceForImgly, config);
    return await loadImage(transparentBlob);
  } catch (err) {
    console.warn('AI Background Removal error, falling back to original image:', err);
    throw err;
  }
}

/**
 * Detects face bounding box and keypoints (eyes, nose, chin) via @mediapipe/tasks-vision
 */
export async function detectFaceWithMediaPipe(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<DetectedFace | null> {
  const detector = await getFaceDetector();
  const naturalW = 'naturalWidth' in image ? image.naturalWidth || image.width : image.width;
  const naturalH = 'naturalHeight' in image ? image.naturalHeight || image.height : image.height;

  // Run MediaPipe face detector
  const result = detector.detect(image);

  if (!result || !result.detections || result.detections.length === 0) {
    return null;
  }

  // Sort by score or bounding box size to pick the primary dominant face
  const dominant = [...result.detections].sort((a, b) => {
    const scoreA = a.categories?.[0]?.score || 0;
    const scoreB = b.categories?.[0]?.score || 0;
    const areaA = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
    const areaB = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
    return scoreB * areaB - scoreA * areaA;
  })[0];

  const box = dominant.boundingBox || {
    originX: naturalW * 0.25,
    originY: naturalH * 0.2,
    width: naturalW * 0.5,
    height: naturalH * 0.5,
    angle: 0
  };

  const kps = dominant.keypoints || [];
  // Keypoint order in BlazeFace:
  // 0: right eye
  // 1: left eye
  // 2: nose tip
  // 3: mouth center
  // 4: right ear tragion
  // 5: left ear tragion
  const rightEye = kps[0]
    ? { x: kps[0].x * naturalW, y: kps[0].y * naturalH }
    : { x: box.originX + box.width * 0.3, y: box.originY + box.height * 0.35 };

  const leftEye = kps[1]
    ? { x: kps[1].x * naturalW, y: kps[1].y * naturalH }
    : { x: box.originX + box.width * 0.7, y: box.originY + box.height * 0.35 };

  const nose = kps[2]
    ? { x: kps[2].x * naturalW, y: kps[2].y * naturalH }
    : { x: box.originX + box.width * 0.5, y: box.originY + box.height * 0.55 };

  const mouthCenter = kps[3]
    ? { x: kps[3].x * naturalW, y: kps[3].y * naturalH }
    : { x: box.originX + box.width * 0.5, y: box.originY + box.height * 0.75 };

  // Calculate precise chin position from mouth, nose, and bottom of bounding box
  const noseToMouthDist = Math.max(10, mouthCenter.y - nose.y);
  const calculatedChinY = Math.max(
    box.originY + box.height,
    mouthCenter.y + noseToMouthDist * 1.15
  );

  const chin = {
    x: mouthCenter.x,
    y: Math.min(naturalH - 1, calculatedChinY)
  };

  const rightEar = kps[4] ? { x: kps[4].x * naturalW, y: kps[4].y * naturalH } : undefined;
  const leftEar = kps[5] ? { x: kps[5].x * naturalW, y: kps[5].y * naturalH } : undefined;

  return {
    boundingBox: {
      originX: box.originX,
      originY: box.originY,
      width: box.width,
      height: box.height
    },
    keypoints: {
      leftEye,
      rightEye,
      nose,
      mouthCenter,
      chin,
      rightEar,
      leftEar
    },
    score: dominant.categories?.[0]?.score
  };
}

/**
 * MediaPipe Face Mesh indices for the lower jawline contour:
 * Curves from right ear/jaw down across the chin (index 152) and up to left ear/jaw.
 */
export const JAWLINE_LANDMARK_INDICES = [
  234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454
];

export interface ExtractNaturalHeadOptions {
  filter?: ImageFilterOptions;
  neckMarginRatio?: number; // margin below chin as fraction of head height (default: 0.08, ~8%)
  featherPx?: number; // feather height in pixels (default: computed based on head height)
}

/**
 * Extracts the natural head silhouette from the background-removed matte.
 * 
 * Preserves the true alpha matte of hair (including curls, afro, volume, hats, ears)
 * without any elliptical/circular clipping.
 * Decouples the neck intelligently using MediaPipe FaceLandmarker (chin landmark 152 & jawline),
 * slicing horizontally slightly below the chin with a soft bottom feather/gradient.
 * Falls back to 1.3x face bounding box height if landmarks are not available.
 */
export function extractNaturalHead(
  segmentedImg: HTMLImageElement,
  landmarks: NormalizedLandmark[] | null,
  fallbackFace?: DetectedFace | null,
  options?: ExtractNaturalHeadOptions
): ProcessedHead {
  const W = segmentedImg.naturalWidth || segmentedImg.width;
  const H = segmentedImg.naturalHeight || segmentedImg.height;

  // Render segmented image to canvas to inspect/modify pixel data
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = W;
  srcCanvas.height = H;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) throw new Error('Could not get 2d context for natural head extraction');

  srcCtx.drawImage(segmentedImg, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, W, H);
  const pixels = srcData.data;

  // Determine neck cutoff Y and feather start Y
  let cutoffY: number;
  let featherHeight: number;

  const marginRatio = options?.neckMarginRatio ?? 0.08; // Configurable 5-10% margin, default 8%

  if (landmarks && landmarks.length > 152) {
    // 1. Intelligent Neck Decoupling with MediaPipe FaceLandmarker
    // Landmark 152 is the lowest chin tip center
    const chin = landmarks[152];
    const chinY = chin.y * H;

    // Landmark 10 is top of forehead / hairline
    const forehead = landmarks[10] || landmarks[151] || landmarks[9];
    const foreheadY = forehead ? forehead.y * H : chinY - H * 0.35;
    const headHeight = Math.max(40, Math.abs(chinY - foreheadY));

    // Also inspect jawline curve to ensure we cover the entire jaw contour if tilted
    let maxJawY = chinY;
    for (const idx of JAWLINE_LANDMARK_INDICES) {
      if (landmarks[idx]) {
        const jy = landmarks[idx].y * H;
        if (jy > maxJawY) maxJawY = jy;
      }
    }

    const lowestJawY = Math.max(chinY, maxJawY);
    cutoffY = Math.min(H - 1, Math.round(lowestJawY + headHeight * marginRatio));
    featherHeight = options?.featherPx ?? Math.max(10, Math.min(26, Math.round(headHeight * 0.08)));
  } else if (fallbackFace) {
    // 2. Fallback Mechanism: Slice top-down to 1.3x face bounding box height
    const box = fallbackFace.boundingBox;
    const faceTop = box.originY;
    const faceH = box.height;
    cutoffY = Math.min(H - 1, Math.round(faceTop + faceH * 1.3));
    featherHeight = options?.featherPx ?? Math.max(10, Math.min(26, Math.round(faceH * 0.1)));
  } else {
    // 3. Ultimate Fallback: Scan non-transparent alpha bounds
    let firstAlphaY = H;
    let lastAlphaY = 0;
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 8) {
        if (pixels[(y * W + x) * 4 + 3] > 20) {
          if (y < firstAlphaY) firstAlphaY = y;
          if (y > lastAlphaY) lastAlphaY = y;
        }
      }
    }
    const detectedSubjectH = Math.max(60, lastAlphaY - firstAlphaY);
    cutoffY = Math.min(H - 1, Math.round(firstAlphaY + detectedSubjectH * 0.45));
    featherHeight = options?.featherPx ?? 16;
  }

  const featherStartY = Math.max(0, cutoffY - featherHeight);

  // Apply horizontal neck slice with soft gradient feathering
  // Everything above featherStartY has its original alpha completely intact!
  // Everything below cutoffY is erased to 0.
  // The feather zone smoothly fades out to blend onto the cartoon collar.
  const featherRange = Math.max(1, cutoffY - featherStartY);

  for (let y = featherStartY; y < H; y++) {
    if (y > cutoffY) {
      // Below cutoff: zero out alpha completely
      const rowOffset = y * W * 4;
      for (let x = 0; x < W; x++) {
        pixels[rowOffset + x * 4 + 3] = 0;
      }
    } else {
      // Feather transition zone: smooth quadratic decay to 0
      const t = (cutoffY - y) / featherRange; // 1.0 at featherStartY, 0.0 at cutoffY
      const alphaFactor = Math.pow(t, 1.2);
      const rowOffset = y * W * 4;
      for (let x = 0; x < W; x++) {
        const aIdx = rowOffset + x * 4 + 3;
        pixels[aIdx] = Math.round(pixels[aIdx] * alphaFactor);
      }
    }
  }

  // Write modified pixels back to srcCanvas
  srcCtx.putImageData(srcData, 0, 0);

  // Compute tight bounding box of visible head silhouette (alpha > 12)
  let minX = W;
  let minY = H;
  let maxX = 0;
  let maxY = 0;
  let foundPixel = false;

  for (let y = 0; y <= cutoffY; y++) {
    const rowOffset = y * W * 4;
    for (let x = 0; x < W; x++) {
      const a = pixels[rowOffset + x * 4 + 3];
      if (a > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        foundPixel = true;
      }
    }
  }

  if (!foundPixel) {
    minX = 0;
    minY = 0;
    maxX = W - 1;
    maxY = Math.min(H - 1, cutoffY);
  }

  // Add 3px safety margin clamped to image boundaries
  const pad = 3;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.max(30, Math.min(W - cropX, maxX - cropX + 1 + pad));
  const cropH = Math.max(30, Math.min(H - cropY, maxY - cropY + 1 + pad));

  // Destination canvas cropped to natural head bounds
  const destCanvas = document.createElement('canvas');
  destCanvas.width = cropW;
  destCanvas.height = cropH;
  const destCtx = destCanvas.getContext('2d', { willReadFrequently: true });
  if (!destCtx) throw new Error('Could not get dest 2d context');

  destCtx.drawImage(
    srcCanvas,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );

  // Apply filters if requested
  if (options?.filter) {
    applyFiltersToCanvas(destCtx, cropW, cropH, options.filter);
  }

  return {
    canvas: destCanvas,
    dataUrl: destCanvas.toDataURL('image/png'),
    width: cropW,
    height: cropH
  };
}

/**
 * Backwards-compatibility wrapper for cropHeadAndHair:
 * Delegates directly to extractNaturalHead without oval clipping.
 */
export function cropHeadAndHair(
  segmentedImg: HTMLImageElement,
  face: DetectedFace,
  options?: { filter?: ImageFilterOptions }
): ProcessedHead {
  return extractNaturalHead(segmentedImg, null, face, options);
}

/**
 * Applies color/spooky filters to an already segmented ProcessedHead
 * without losing its natural alpha matte and silhouette.
 */
export function applyFilterToProcessedHead(
  sourceHead: ProcessedHead,
  filter: ImageFilterOptions
): ProcessedHead {
  const canvas = document.createElement('canvas');
  canvas.width = sourceHead.width;
  canvas.height = sourceHead.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceHead;

  ctx.drawImage(sourceHead.canvas, 0, 0);
  applyFiltersToCanvas(ctx, canvas.width, canvas.height, filter);

  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * Sequential processing pipeline for single or multiple photos with progress callback
 * Does not freeze UI by yielding between compute steps.
 */
export async function processPhotoPipeline(
  item: { id: string; name: string; source: File | string },
  itemIndex: number,
  totalItems: number,
  onProgress?: (progress: PipelineProgress) => void
): Promise<SegmentationPipelineResult> {
  const notify = (stage: PipelineStage, label: string, stageProgress: number) => {
    if (!onProgress) return;
    const baseItemProgress = (itemIndex / totalItems) * 100;
    const itemWeight = (1 / totalItems) * 100;
    const overallProgress = Math.round(baseItemProgress + (stageProgress / 100) * itemWeight);

    onProgress({
      currentStage: stage,
      stageLabel: label,
      stageProgress: Math.round(stageProgress),
      overallProgress: Math.min(100, Math.max(0, overallProgress)),
      itemIndex,
      totalItems,
      itemName: item.name
    });
  };

  try {
    // 1. Loading Image
    notify('loading', `Loading ${item.name}...`, 10);
    await new Promise((r) => setTimeout(r, 20)); // Yield to paint UI
    const rawImage = await loadImage(item.source);

    // 2. Client-Side AI Background Removal (@imgly/background-removal)
    notify('removing_background', `Removing background with WebAssembly AI...`, 20);
    await new Promise((r) => setTimeout(r, 20)); // Yield

    let segmentedImg: HTMLImageElement;
    try {
      segmentedImg = await runBackgroundRemoval(rawImage, (pct, label) => {
        // Map 0..100 background removal to 20..70% stage progress
        notify('removing_background', label, 20 + pct * 0.5);
      });
    } catch (bgErr) {
      console.warn('Background removal failed, proceeding with raw image for face detection:', bgErr);
      segmentedImg = rawImage;
    }

    // 3. Face & Keypoint / Landmark Detection (@mediapipe/tasks-vision)
    notify('detecting_face', `Detecting face keypoints & jawline contour...`, 75);
    await new Promise((r) => setTimeout(r, 20)); // Yield

    // Run Face Detector and Face Landmarker in parallel for maximum reliability
    const [detectedFace, landmarks] = await Promise.all([
      detectFaceWithMediaPipe(rawImage).catch(() => null),
      detectLandmarksWithMediaPipe(rawImage).catch(() => null)
    ]);

    // Error handling: If no face is detected by either detector or landmarker
    if (!detectedFace && (!landmarks || landmarks.length === 0)) {
      notify('error', `No face detected in ${item.name}`, 100);
      return {
        id: item.id,
        name: item.name,
        success: false,
        rawImage,
        fullSegmentedImage: segmentedImg,
        error: 'NO_FACE_DETECTED',
        errorMessage: `No face detected in "${item.name}". Please adjust the cutout manually or choose another photo with a clear face.`
      };
    }

    // 4. Intelligent Head Extraction (Alpha Matte + Intelligent Neck Decoupling)
    notify('cropping_head', `Decoupling neck and preserving natural hair silhouette...`, 90);
    await new Promise((r) => setTimeout(r, 20)); // Yield

    const segmentedHead = extractNaturalHead(segmentedImg, landmarks, detectedFace);

    // Calculate fallback CropOval & DetectedFace coordinates
    const naturalW = rawImage.naturalWidth || rawImage.width;
    const naturalH = rawImage.naturalHeight || rawImage.height;

    let finalFace = detectedFace;
    if (!finalFace && landmarks && landmarks.length > 152) {
      const chin = landmarks[152];
      const nose = landmarks[1] || landmarks[4];
      const leftEye = landmarks[33] || landmarks[133];
      const rightEye = landmarks[263] || landmarks[362];
      const forehead = landmarks[10];

      const minX = Math.min(chin.x, nose.x, leftEye.x, rightEye.x, forehead?.x ?? chin.x) * naturalW;
      const maxX = Math.max(chin.x, nose.x, leftEye.x, rightEye.x, forehead?.x ?? chin.x) * naturalW;
      const minY = Math.min(chin.y, nose.y, leftEye.y, rightEye.y, forehead?.y ?? chin.y) * naturalH;
      const maxY = Math.max(chin.y, nose.y, leftEye.y, rightEye.y, forehead?.y ?? chin.y) * naturalH;

      finalFace = {
        boundingBox: {
          originX: Math.max(0, minX - 20),
          originY: Math.max(0, minY - 20),
          width: Math.min(naturalW, maxX - minX + 40),
          height: Math.min(naturalH, maxY - minY + 40)
        },
        keypoints: {
          leftEye: { x: leftEye.x * naturalW, y: leftEye.y * naturalH },
          rightEye: { x: rightEye.x * naturalW, y: rightEye.y * naturalH },
          nose: { x: nose.x * naturalW, y: nose.y * naturalH },
          mouthCenter: {
            x: (landmarks[13]?.x ?? nose.x) * naturalW,
            y: (landmarks[13]?.y ?? chin.y * 0.9) * naturalH
          },
          chin: { x: chin.x * naturalW, y: chin.y * naturalH }
        },
        score: 0.95
      };
    }

    let cropOval: CropOval;
    if (finalFace) {
      const box = finalFace.boundingBox;
      cropOval = {
        centerX: (box.originX + box.width / 2) / naturalW,
        centerY: (finalFace.keypoints.chin.y + finalFace.keypoints.leftEye.y) / 2 / naturalH,
        radiusX: (box.width * 0.65) / naturalW,
        radiusY: (box.height * 0.75) / naturalH,
        rotation: 0,
        feather: 8
      };
    } else {
      cropOval = {
        centerX: 0.5,
        centerY: 0.38,
        radiusX: 0.28,
        radiusY: 0.34,
        rotation: 0,
        feather: 8
      };
    }

    notify('complete', `Ready!`, 100);

    return {
      id: item.id,
      name: item.name,
      success: true,
      rawImage,
      segmentedHead,
      fullSegmentedImage: segmentedImg,
      detectedFace: finalFace || undefined,
      cropOval
    };
  } catch (err: any) {
    console.error('Pipeline processing error:', err);
    notify('error', `Error processing ${item.name}`, 100);
    return {
      id: item.id,
      name: item.name,
      success: false,
      error: 'PROCESSING_FAILED',
      errorMessage: err?.message || 'Failed to process image.'
    };
  }
}

/**
 * Process multiple photos sequentially in an async pipeline without freezing browser UI
 */
export async function processBatchPhotos(
  items: { id: string; name: string; source: File | string }[],
  onProgress?: (progress: PipelineProgress) => void
): Promise<SegmentationPipelineResult[]> {
  const results: SegmentationPipelineResult[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const result = await processPhotoPipeline(item, i, items.length, onProgress);
    results.push(result);
    // Yield between items so garbage collection & UI repainting can happen cleanly
    await new Promise((r) => setTimeout(r, 40));
  }

  return results;
}

/**
 * Fallback Manual Oval Cutout
 */
export function cutHeadWithOval(
  img: HTMLImageElement,
  crop: CropOval,
  filter?: ImageFilterOptions
): ProcessedHead {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  const cx = crop.centerX * naturalW;
  const cy = crop.centerY * naturalH;
  const rx = crop.radiusX * naturalW;
  const ry = crop.radiusY * naturalH;

  const padding = crop.feather * 2;
  const boxW = Math.ceil(rx * 2 + padding * 2);
  const boxH = Math.ceil(ry * 2 + padding * 2);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(100, boxW);
  canvas.height = Math.max(100, boxH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const destCx = canvas.width / 2;
  const destCy = canvas.height / 2;

  ctx.save();
  ctx.translate(destCx, destCy);
  ctx.rotate((crop.rotation * Math.PI) / 180);

  ctx.beginPath();
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const taper = sin > 0 ? 1 - 0.12 * sin : 1 + 0.05 * Math.abs(sin);
    const px = cos * rx * taper;
    const py = sin * ry;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    img,
    cx - rx - padding,
    cy - ry - padding,
    boxW,
    boxH,
    -rx - padding,
    -ry - padding,
    boxW,
    boxH
  );
  ctx.restore();

  if (crop.feather > 2) {
    softenEdges(ctx, canvas.width, canvas.height, crop.feather);
  }

  if (filter) {
    applyFiltersToCanvas(ctx, canvas.width, canvas.height, filter);
  }

  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  };
}

export async function estimateHeadBounds(img: HTMLImageElement): Promise<CropOval> {
  try {
    const face = await detectFaceWithMediaPipe(img);
    if (face) {
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const box = face.boundingBox;
      return {
        centerX: Math.max(0.1, Math.min(0.9, (box.originX + box.width / 2) / naturalW)),
        centerY: Math.max(0.1, Math.min(0.9, (face.keypoints.chin.y + face.keypoints.leftEye.y) / 2 / naturalH)),
        radiusX: Math.max(0.1, Math.min(0.5, (box.width * 0.65) / naturalW)),
        radiusY: Math.max(0.15, Math.min(0.55, (box.height * 0.75) / naturalH)),
        rotation: 0,
        feather: 8
      };
    }
  } catch {
    // fallback
  }

  return {
    centerX: 0.5,
    centerY: 0.38,
    radiusX: 0.28,
    radiusY: 0.34,
    rotation: 0,
    feather: 8
  };
}

function softenEdges(ctx: CanvasRenderingContext2D, w: number, h: number, radius: number) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const alphaCopy = new Uint8Array(w * h);

  for (let i = 0; i < data.length; i += 4) {
    alphaCopy[i / 4] = data[i + 3];
  }

  const r = Math.min(8, Math.max(2, Math.floor(radius / 2)));
  for (let y = r; y < h - r; y++) {
    for (let x = r; x < w - r; x++) {
      const idx = y * w + x;
      const currentAlpha = alphaCopy[idx];

      if (currentAlpha > 0 && currentAlpha < 255) {
        let sum = 0;
        let count = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            sum += alphaCopy[(y + dy) * w + (x + dx)];
            count++;
          }
        }
        data[idx * 4 + 3] = Math.round(sum / count);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function applyFiltersToCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  filter: ImageFilterOptions
) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const brightness = filter.brightness ?? 1.0;
  const contrast = filter.contrast ?? 1.0;
  const saturation = filter.saturation ?? 1.0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = ((r / 255 - 0.5) * contrast + 0.5) * brightness * 255;
    g = ((g / 255 - 0.5) * contrast + 0.5) * brightness * 255;
    b = ((b / 255 - 0.5) * contrast + 0.5) * brightness * 255;

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    if (filter.tint === 'zombie-green') {
      r *= 0.75;
      g = Math.min(255, g * 1.25);
      b *= 0.65;
    } else if (filter.tint === 'vampire-pale') {
      r = Math.min(255, r * 1.1 + 20);
      g = Math.min(255, g * 1.1 + 20);
      b = Math.min(255, b * 1.25 + 35);
      const avg = (r + g + b) / 3;
      r = r * 0.4 + avg * 0.6;
      g = g * 0.4 + avg * 0.6;
      b = b * 0.4 + avg * 0.6;
    } else if (filter.tint === 'ghost-blue') {
      r *= 0.6;
      g *= 0.85;
      b = Math.min(255, b * 1.35 + 25);
    } else if (filter.tint === 'vintage-sepia') {
      const tr = 0.393 * r + 0.769 * g + 0.189 * b;
      const tg = 0.349 * r + 0.686 * g + 0.168 * b;
      const tb = 0.272 * r + 0.534 * g + 0.131 * b;
      r = tr;
      g = tg;
      b = tb;
    }

    if (filter.posterize) {
      const steps = 6;
      r = Math.floor((r / 255) * steps) * (255 / steps);
      g = Math.floor((g / 255) * steps) * (255 / steps);
      b = Math.floor((b / 255) * steps) * (255 / steps);
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
}
