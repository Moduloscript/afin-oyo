# Àfin Ọ̀yọ́ — Nocturnal Sanctuary & Spatial Portfolio

> An interactive 3D WebGL sanctuary and creative technologist portfolio inspired by ancient **Ọ̀yọ́ palace architecture**, carved **Ìrókò Ọ̀pó pillars**, and the kinetic spirit of West African craft.

---

## 🏛️ Concept & Architectural Vision

**Àfin Ọ̀yọ́** (*Palace of Ọ̀yọ́*) is an immersive digital space merging Afro-surrealist spatial design with high-performance creative web engineering. Built on an *Atelier Noir* aesthetic, it translates the sacred forms, materiality, and cosmology of the historical Yoruba Ọ̀yọ́ Empire into a real-time 3D interactive narrative.

### The 6 Chapters

The experience unfolds across six distinct spatial chapters rooted in Yoruba philosophy and architectural hierarchy:

| Chapter | Yoruba Title | Translation | Focus |
| :--- | :--- | :--- | :--- |
| **00** | **Àbáwọlé** | *The Royal Threshold* | Grand entrance, monumental 3D "Ọ̀YỌ́" watermark, stepped courtyard, and sacred fire braziers (*Iná Àtùpà*). |
| **01** | **Ilé Ìmọ̀** | *House of Knowledge* | The architectural manifesto, engineering pillars, and performance metrics. |
| **02** | **Àkòdì** | *The Gallery of Artifacts* | Curated showcase of flagship spatial monoliths, WebGL experiments, and client systems. |
| **03** | **Ẹwà** | *The Laboratory* | Creative explorations, generative shaders, tactile micro-interactions, and motion studies. |
| **04** | **Òpómúléró** | *The Pillar of the House* | Core ethos, technical discipline, tactile UI philosophy, and craftsmanship. |
| **05** | **Àṣẹ** | *The Royal Dispatch* | Transmission portal, commissions, and contact coordinates. |

---

## ✨ Visual & 3D Features

* **Procedural Materials & Lighting:** 
  * Textured Ìrókò wood, royal terracotta crimson, and polished brass bands.
  * Real-time chiaroscuro lighting, floating golden spark embers, and layered volumetric ground mist.
* **Monumental 3D Wordmark:** 
  * Symmetrical **"Ọ̀ Y Ọ́"** letterforms anchored directly into the 3D WebGL scene coordinate space.
* **Continuous Spline Traversal:** 
  * Dynamic, friction-damped camera navigation synchronizing DOM scroll depth with 3D camera translation and rotation.
* **Micro-Interactions & Audio-Visual Feedback:** 
  * Interactive magnetic cursor, preview portals, smooth masked typography reveals, and responsive viewport adapters.

---

## 🛠️ Tech Stack

* **3D Engine:** [Three.js](https://threejs.org/) (WebGL Renderer, ACESFilmic Tone Mapping, Exponential Fog, Procedural Canvas Textures)
* **Language:** Modern Vanilla JavaScript (ES6+), Semantic HTML5, CSS3 Custom Properties
* **Typography:** `Onest` & `Cinzel` (with support for Yoruba tone-marked diacritics)
* **Zero Heavy Frameworks:** Lightweight, dependency-free runtime for fast first-paint and consistent 60 FPS performance.

---

## 🚀 Getting Started

To run the project locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/Moduloscript/afin-oyo.git
cd afin-oyo
```

### 2. Start a Local Static Server
Because the project loads WebGL textures and modules, serve it through any local HTTP server:

**Using Python:**
```bash
python -m http.server 8080
```

**Using Node / npx:**
```bash
npx serve .
```

**Using VS Code:**
Install the **Live Server** extension and click **"Go Live"**.

### 3. Open in Browser
Navigate to `http://localhost:8080` (or the port provided by your server).

---

## 📂 Project Structure

```text
afin-oyo/
├── assets/
│   ├── artifacts/       # Foreground cultural artifacts & figures
│   ├── plates/          # High-resolution project plates & previews
│   └── three.min.js     # Three.js WebGL engine bundle
├── index.html           # Main HTML5 document & chapter structure
├── main.js              # Three.js world scene, camera conductor & animations
├── style.css            # Responsive layout, typography & design system
├── .nojekyll            # GitHub Pages asset routing configuration
└── README.md            # Project documentation
```

---

## 📜 License

Created by **Werner** (Creative Technologist & Spatial Architect). All rights reserved.
