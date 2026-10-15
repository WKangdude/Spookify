# Spookify 🎃

> Zero-Cost Halloween Caricature & Bobblehead Sticker Generator

Spookify is a modern, 100% client-side web application built with **React**, **Vite**, **Tailwind CSS**, and **Lucide Icons**. It transforms photos of friends and family into cartoon bobblehead stickers mounted on Halloween character bodies (Chucky, Mummy, Zombie, Vampire, Witch, Frankenstein, Ghost, Werewolf).

## 🚀 Key Features

- **100% Client-Side AI Processing**: No servers, no APIs, zero compute or cloud hosting costs. Everything processes directly in the user's browser.
- **Client-Side Background Removal**: Powered by `@imgly/background-removal` running on WebAssembly & WebGPU.
- **Face & Keypoint Detection**: Powered by Google's `@mediapipe/tasks-vision` (detects eyes, nose, mouth, chin, ears, and bounding box).
- **Hair-Preserving Head Cropping**: Preserves full hair volume and bounds while cutting off cleanly right below the chin/neck with a soft feathered dock.
- **Sequential Async Pipeline & Progress Bar**: Processes multiple photos sequentially without freezing the browser UI, displaying real-time stage descriptions and progress percentages.
- **Error Handling & Manual Framing**: If no face is detected, alerts the user with options to manually frame the head or re-upload.
- **Multi-Friend Switcher**: Upload multiple photos at once and switch between friends on the bobblehead with a single click.

## 📂 Project Structure

```
/
├── public/
│   ├── templates/                  # Transparent PNG character bodies without heads
│   │   ├── chucky.png
│   │   ├── mummy.png
│   │   ├── zombie.png
│   │   ├── vampire.png
│   │   ├── witch.png
│   │   ├── frankenstein.png
│   │   ├── ghost.png
│   │   └── werewolf.png
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Uploader.tsx            # Drag & drop, webcam selfie, samples & crop refiner
│   │   ├── Roulette.tsx            # Random monster body selector with audio synth ticks
│   │   ├── CanvasEditor.tsx        # Bobblehead physics, neck controls, filters & export
│   │   ├── CharacterCard.tsx       # Monster template card with badges & preview
│   │   └── Modal.tsx               # Spooky dialog wrapper
│   ├── utils/
│   │   ├── characterTemplates.ts   # Metadata: id, name, bodyImagePath, neckAnchor, scale, angle
│   │   ├── imageProcessing.ts      # Client-side head segmentation & filters
│   │   ├── canvasSticker.ts        # Sticker die-cut outline & composite rendering
│   │   └── sampleImages.ts         # Zero-network sample portrait generators
│   ├── App.tsx                     # Main dark Halloween layout & workflow
│   ├── main.tsx
│   └── index.css                   # Tailwind v4 spooky theme variables & keyframe animations
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build
```
