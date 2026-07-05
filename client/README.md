# Hardware Prototyping Copilot UI

A modern, interactive web-based UI for designing hardware circuits and prototypes with an integrated AI assistant. Built with SvelteKit and featuring a canvas-based component editor, intelligent circuit analysis, and datasheet management.

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) with TypeScript
- **Canvas Rendering**: [@xyflow/svelte](https://www.xyflow.com/) for node-based circuit visualization
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for responsive UI design
- **Build & Deploy**: Static site generation with [@sveltejs/adapter-static](https://kit.svelte.dev/docs/adapters)
- **State Management**: Svelte stores (writable) for reactive component and canvas state

## Getting Started

### Prerequisites

- Node.js 22+ and npm

### Installation

```sh
npm install
```

### Development

```sh
npm run dev
```

The app will be available at `http://localhost:5176`

### Building for Production

```sh
npm run build
```

The production build is statically prerendered and ready to deploy to any static hosting service.

```sh
npm run preview
```

## Usage

1. **Add Components**: Drag items from the right library panel onto the canvas
2. **Connect Components**: Click and drag between pins to create connections
3. **Zoom & Pan**: Use zoom buttons or scroll to navigate the canvas
4. **AI Assistance**: Type in the left chat panel for circuit suggestions
5. **Save Design**: Designs are persisted and accessible from the workspace list
6. **Toggle Lock**: Prevent accidental modifications with the lock button
7. **Fullscreen**: Maximize canvas for detailed editing
