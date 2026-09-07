# 🌾 Organic Farm Mart — 3D Arcade Idle Tycoon

[![Live Demo](https://img.shields.io/badge/Play%20Now-Vercel%20Live-brightgreen?style=for-the-badge&logo=vercel)](https://organic-farm-mart.vercel.app/)
[![JavaScript](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> A vibrant, high-performance 3D casual arcade-idle / farm-to-table supermarket tycoon game built with **Three.js (WebGL)** and procedural low-poly aesthetics.

---

### 🚀 Play the Game Live:
👉 **[https://organic-farm-mart.vercel.app/](https://organic-farm-mart.vercel.app/)** 👈

---

## 🌟 Game Overview

Step into the boots of an ambitious farmer who transforms a single tomato patch into a thriving, multi-department organic grocery empire. 

* 🍅 **Harvest & Farm**: Grow tomatoes, wheat, and sweetcorn in outdoor soil patches.
* 🐔 **Livestock Care**: Feed the chicken coop and dairy pasture to produce fresh eggs and whole milk.
* 🥖 **Artisanal Processing**: Turn raw ingredients into strawberry jams, bakery sourdough bread, and celebration cakes.
* 👥 **Hire Helper Staff**: Employ automated harvesters, shelf stockers, artisan bakers, and cashiers.
* ⚡ **Upgrades & Outfits**: Upgrade player movement speed, backpack capacity, and unlock exclusive cosmetic hats on the global high-score leaderboard.
* ☕ **Grand Café Expansion**: Unlock all retail stands to reveal the future Grand Café terrace teaser!

---

## 🎮 How to Play & Controls

### 🖥️ Desktop (Keyboard & Mouse):
* **`W` `A` `S` `D`** or **Arrow Keys**: Move your character.
* **Left Click & Drag**: Virtual on-screen joystick.
* **`E` / `Space`**: Quick-interact / close popups.

### 📱 Mobile & Tablet:
* **Touch & Drag**: Responsive floating virtual joystick.
* **Tap UI Buttons**: Access Upgrades, Quests, Photo Mode, and Leaderboards.

---

## 🛠️ Tech Stack & Architecture

* **Graphics Engine**: [Three.js (WebGL)](https://threejs.org/) with soft shadow mapping and low-poly cartoon shading.
* **Camera Design**: 36° narrow-FOV top-down isometric view with frame-rate independent spring follow.
* **Audio Synthesis**: 100% procedural Web Audio API with a lookahead hardware clock scheduler (zero external MP3 assets, zero lag).
* **Package Size**: Ultra-lightweight **~1 MB total package** (**0.2 MB** initial payload) running at a locked **60 FPS**.
* **Cloud & Platform Integration**: Integrated with CrazyGames SDK v3 Data Module for cloud saves and master gain portal muting.

---

## 💻 Running Locally

To run the game locally on your machine:

```bash
# Clone the repository
git clone https://github.com/Mukesh-Yadav-4/MINI-SUPER-MART.git
cd MINI-SUPER-MART

# Start local server
npm start
```

Then open your browser to **[http://localhost:8080](http://localhost:8080)**.

---

## 🌐 Live Deployment

* **Production URL**: [https://organic-farm-mart.vercel.app/](https://organic-farm-mart.vercel.app/)
* **Platform**: Vercel Global Edge Network