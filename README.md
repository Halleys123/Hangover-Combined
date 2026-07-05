# ⚡ Hangover — Autonomous Hardware Prototyping & Circuit Design Copilot

<div align="center">

![SvelteKit](https://img.shields.io/badge/SvelteKit-5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Cognee Cloud](https://img.shields.io/badge/Cognee_Cloud-Knowledge_Graph-8A2BE2?style=for-the-badge)
![React Flow](https://img.shields.io/badge/React_Flow-xyflow-FF0072?style=for-the-badge)

**Built with ❤️ for The Hangover Part AI Hackathon • Powered by Cognee Cloud**

[Overview](#-overview) • [Key Features](#-key-features) • [Why Cognee + MongoDB?](#-why-cognee--mongodb) • [System Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [The Cognee AI Lifecycle](#-the-cognee-ai-lifecycle) • [API Reference](#-api-endpoints-reference)

</div>

---

## 🌟 Overview

Hardware prototyping is historically stuck in the manual, static era. When engineers or hobbyists build electronics projects—such as interfacing an Arduino Uno with a high-power Peltier thermoelectric cooler or a DHT temperature sensor—they are forced to manually scour 60-page semiconductor PDF datasheets to answer fundamental electrical questions:
* *What is the maximum current draw on Pin D2?*
* *Is this logic level 3.3V or 5V tolerant?*
* *If I connect this heating element directly to my microcontroller GPIO, will I fry my board?*

**Hangover** is an autonomous, AI-powered hardware prototyping copilot and circuit design workspace. It ingests complex raw PDF datasheets, performs **Multi-Stage Sectional Synthesis** using **Cognee Cloud** to extract electrical boundaries and pinout tables, applies **Deterministic Schema Healing** to prevent LLM truncation, and renders interactive components on a live Svelte 5 / React Flow canvas. 

When you prompt the AI to wire a circuit, Hangover does not rely on hallucination-prone vector search alone. It queries **Cognee's relational knowledge graphs** to check exact electrical constraints—catching voltage mismatches or excessive current draw—and automatically draws safe, animated schematic wiring between compatible pins!

---

## ✨ Key Features

* 📄 **Multi-Stage PDF Synthesis**: Chunks massive 60-page datasheets into targeted sections (DC limits vs. pinout tables) to eliminate LLM attention degradation ("lost in the middle" phenomenon).
* 🛡️ **Deterministic Schema Healing**: Automatically heals probabilistic LLM flaws, injecting exhaustive pin profiles (e.g., Arduino Uno Rev3's 14 digital & 6 analog pins) and enforcing strict 2-wire rules for power devices like Peltier coolers.
* ⚖️ **Symmetrical Pin Balancing**: Dynamically redistributes left/right IC headers so high-pin-count microcontrollers render cleanly without lopsided vertical ribbons.
* 🧠 **Relational Graph Memory (Cognee Cloud)**: Integrates directly with Cognee Cloud APIs (`/api/v1/add`, `/api/v1/cognify`, `/api/v1/search`, `/api/v1/improve`) to store and traverse electrical constraints and entity relationships.
* ⚡ **Agentic Auto-Wiring**: Evaluates electrical compatibility across all active canvas nodes and emits animated React Flow wire connections while warning about electrical hazards (e.g., advising MOSFET drivers for high-current loads).
* 💬 **Iterative Natural Language Refinement**: Refine component parameters on the fly via chat (e.g., *"Change nominal voltage to 12V and max current to 4.5A"*), immediately updating graph memory and live canvas nodes.
* 🎨 **Premium UI/UX**: Built with SvelteKit, Svelte 5, Tailwind CSS, and `@xyflow/svelte` featuring sleek dark modes, glassmorphism, and responsive micro-animations.

---

## 🏗️ System Architecture

Hangover is structured as a decoupled full-stack monorepo divided into three core architectural layers:

### 1️⃣ Architecture Layers Overview

| Layer | Technology Stack | Core Components | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend Client**<br>*(Port 5173 / 5176)* | SvelteKit, Svelte 5, TypeScript, Tailwind CSS | Workspace UI, Chat Sidebar, `@xyflow/svelte` Canvas | Renders interactive hardware ICs (`HardwareNode.svelte`), handles drag-and-drop component state, and manages user chat prompts. |
| **Backend Server**<br>*(Port 3001)* | Node.js, Express, TypeScript, Multer, Mongoose | REST API Router, PDF Ingestion, `cognee.ts`, `derivePins.ts` | Receives PDF uploads, chunks documents into sectional prompts, executes deterministic schema healing, and balances pin header layouts. |
| **Cognitive Engine**<br>*(Cloud & Local)* | Cognee Cloud API, OpenAI SDK, Mongoose | Knowledge Graph, Vector Embeddings, LLM Inference Engine | Executes cognitive memory operations (`remember`, `cognify`, `recall`, `improve`) and relational constraint checks for safe auto-wiring. |

### 2️⃣ End-to-End Data Flow Workflow

1. **Datasheet Upload & Ingestion**:
   * The engineer uploads a semiconductor PDF via the Frontend Client (`POST /api/datasheets`).
   * The Backend Server stores the file buffer using Multer and extracts raw text via `pdf-parse`.
2. **Multi-Stage Sectional Synthesis**:
   * For large documents (>25,000 characters), `services/cognee.ts` chunks text into targeted sections to prevent LLM attention degradation ("lost in the middle" phenomenon).
   * **Section 1 Pass**: Analyzes the first 30,000 characters to extract DC operating limits and physical dimensions.
   * **Section 2 Pass**: Analyzes characters 15,000 through 65,000 to enumerate exhaustive pinout tables and side orientations.
3. **Deterministic Schema Healing & Pin Balancing**:
   * Raw extractions pass through `normalizeExtractedSpecs()` to heal probabilistic LLM flaws (injecting complete 14-pin digital and 6-pin analog profiles for microcontrollers and enforcing 2-wire rules for power devices).
   * `utils/derivePins.ts` balances left/right headers symmetrically so ICs render cleanly on the canvas without lopsided vertical ribbons.
4. **Cognitive Graph Construction (Cognee Cloud)**:
   * The Backend calls `cognee.remember()` and `POST /api/v1/cognify` to store raw specifications, embed semantic chunks, and construct relational knowledge graph entities in Cognee Cloud.
5. **Agentic Circuit Generation & Auto-Wiring**:
   * When the user prompts: *"Create a circuit connecting my Arduino Uno to the Peltier cooler"*, the Backend calls `cognee.recall()` and `POST /api/v1/search`.
   * Cognee's relational graph verifies electrical compatibility (e.g., catching that a 57W Peltier drawing 6400mA exceeds an Arduino Uno's 20mA GPIO limit).
   * The AI warns the user about electrical hazards (advising a MOSFET driver) and emits deterministic JSON wire edges to animate connections on the canvas.

---

## 💡 Why Cognee + MongoDB? (Division of Memory vs. Persistence)

A core innovation in Hangover is the strict separation of concerns between **Application Persistence** and **Agentic Engineering Memory**:

| Layer | Technology | Primary Role & Stored Data | Why It Cannot Do The Other's Job |
| :--- | :--- | :--- | :--- |
| **Persistence Store** | **MongoDB** | **UI & Workspace State:** Stores user accounts, project names, canvas visual layout (`nodes` & `edges` x/y coordinates), and file status records (`Datasheet` model). | MongoDB stores static, flat documents. It cannot execute semantic graph traversals or relational constraint checks across 60-page PDF specifications during an AI conversation. |
| **Cognitive Engine** | **Cognee Cloud** | **AI Knowledge Graph & Vector Memory:** Stores extracted entity nodes (`Pin D2`, `5V Rail`), deterministic relationships (`OPERATES_AT`, `HAS_PIN`), and high-dimensional semantic vectors of engineering prose. | Cognee is specialized for cognitive reasoning (`remember` / `cognify` / `recall`). It is not designed to serve fast REST UI state hydration for visual drag-and-drop canvas layout. |

---

## 📁 Repository Structure

```text
Hangover/
├── client/                 # SvelteKit / Svelte 5 Frontend UI
│   ├── src/
│   │   ├── lib/components/ # HardwareNode, Canvas, Datasheet Modals, Navigation
│   │   ├── routes/         # Workspace pages, Auth routes, Dashboard
│   │   └── stores/         # Reactive Svelte stores for canvas state
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js / Express TypeScript Backend API
│   ├── src/
│   │   ├── controllers/    # Project, Datasheet, and Component controllers
│   │   ├── models/         # Mongoose schemas (Project, Datasheet, ComponentGraphNode)
│   │   ├── routes/         # REST API route definitions
│   │   ├── services/       # Cognee Cloud client (cogneeClient.ts), OpenAI/LLM service
│   │   └── utils/          # Pin balancing (derivePins.ts) and schema healing
│   ├── package.json
│   └── tsconfig.json
├── INFO.md                 # Exhaustive 234-line Technical Reference Manual
└── README.md               # Root documentation (this file)
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v22 or higher recommended)
* **npm** (v10 or higher)
* **MongoDB** (Running locally or a MongoDB Atlas connection string)
* **Cognee Cloud API Key** (or local Cognee instance)
* **OpenAI API Key** (or OpenRouter / NVIDIA NIM / Local Ollama)

---

### 1️⃣ Backend Server Setup

1. Navigate to the server directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp example.env .env
   ```
   Open `server/.env` and configure:
   ```env
   # Server & Database
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/hangover
   JWT_SECRET=super_secret_jwt_key_here
   CLIENT_ORIGIN=http://localhost:5173

   # Cognee Cloud Integration
   COGNEE_BASE_URL=https://api.cognee.ai
   COGNEE_API_KEY=your_cognee_api_key_here

   # LLM Provider (OpenAI, OpenRouter, NVIDIA, or Ollama)
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your_openai_api_key
   ```

3. Seed the initial hardware component catalog and sample projects:
   ```bash
   npm run seed
   ```

4. Start the backend development server (with hot-reloading):
   ```bash
   npm run dev
   ```
   *The backend server will run on `http://localhost:3001`.*

---

### 2️⃣ Frontend Client Setup

1. Open a new terminal, navigate to the client directory, and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Start the SvelteKit Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend workspace will be live at `http://localhost:5173` (or `http://localhost:5176`).*

---

## 🔄 The Cognee AI Lifecycle (How It Works)

Our automated circuit design pipeline operates in five distinct phases powered by **Cognee Cloud**:

1. **Phase 1: PDF Ingestion & Multi-Stage Sectional Synthesis**
   * Uploading a datasheet triggers text extraction via `pdf-parse`. For large documents (>25k chars), Hangover chunks the document into Section 1 (DC limits & dimensions) and Section 2 (exhaustive pinout tables).
   * Calls `cognee.remember()` and `POST /api/v1/cognify` to store raw specs and build the relational knowledge graph in Cognee Cloud.
2. **Phase 2: Deterministic Schema Healing & Normalization**
   * Raw LLM outputs pass through `normalizeExtractedSpecs()` to heal missing or truncated arrays. Microcontrollers (Arduino Uno, ESP32) receive full 14-pin digital and 6-pin analog profiles, while power devices (Peltier coolers, fans) are enforced to exactly two power leads (`VCC/RED` and `GND/BLACK`).
3. **Phase 3: Visual Schematic Pin Layout & Balancing**
   * `derivePins.ts` balances left and right IC headers symmetrically. Power (`VCC`, `GND`) and Analog pins default to the left header, while Digital I/O defaults to the right header, preventing lopsided vertical ribbons on the canvas.
4. **Phase 4: Agentic Circuit Generation & Auto-Wiring**
   * When prompted to wire a circuit, the AI calls `cognee.recall()` and `POST /api/v1/search` to check relational constraints.
   * **Example**: If connecting an Arduino Uno GPIO pin (20mA limit) to a 57W Peltier cooler (6400mA draw), Cognee's relational graph catches the incompatibility immediately! The AI advises using a MOSFET driver and emits deterministic React Flow wire edges.
5. **Phase 5: Iterative Refinement & Graph Updating**
   * Chat prompts like *"Update Peltier cooler to 12V and 4.5A"* trigger `refineDatasheetSpecs()`. The AI outputs a targeted delta change, committing the updated schema back to Cognee via `POST /api/v1/add` and `POST /api/v1/cognify`, instantly updating canvas nodes.

---

## 🔌 API Endpoints Reference

All backend REST endpoints are prefixed with `/api`:

| HTTP Method | Endpoint Path | Description |
| :--- | :--- | :--- |
| **POST** | `/api/datasheets` | Upload single or batch PDF datasheets (triggers multi-stage extraction & Cognee ingestion). |
| **GET** | `/api/datasheets` | Retrieve list of uploaded datasheets and normalized specification objects. |
| **POST** | `/api/projects/:id/datasheets` | Attach a datasheet to a project workspace and reset conversation history for focused context. |
| **POST** | `/api/chat/message` | Conversational assistant endpoint. Queries Cognee graph memory to answer engineering questions. |
| **POST** | `/api/circuit/generate` | Agentic circuit generation endpoint. Evaluates compatibility via Cognee and outputs auto-wired nodes/edges. |
| **POST** | `/api/auth/register` / `/login` | User authentication and JWT token generation. |
| **GET / PUT** | `/api/projects/:id/canvas` | Retrieve or save React Flow canvas visual layout (`nodes` & `edges` x/y coordinates). |

---

## 📖 Additional Documentation

For an exhaustive, deep-dive technical manual covering code-level implementations, data schemas, and detailed sequence diagrams, see:
👉 **[INFO.md](file:///e:/Projects/Complete/Hangover/server/INFO.md)**

---

## 🏆 Hackathon Submission Details

* **Track**: Best Use of Cognee Cloud (Track 2) / Best Use of Cognee Open Source (Track 1)
* **Team**: Solo / Team Hangover
* **Core Technologies**: Cognee Cloud API, SvelteKit, Svelte 5, React Flow, Node.js, Express, MongoDB, OpenAI, TypeScript.

---
<div align="center">
  <b>Built with passion for the future of Autonomous Hardware Engineering ⚡</b>
</div>
