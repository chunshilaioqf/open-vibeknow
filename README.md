# open-vibeknow

open-vibeknow is an open-source alternative to Vibeknow, designed to generate long, analytical videos from text or URLs with a single click.

## Features

- **One-Click Video Generation:** Paste text or a URL, and the AI will automatically generate a complete video script, including title, summary, and scene-by-scene narration.
- **AI-Powered Assets:** Uses Google's Gemini models to generate high-quality, cinematic 16:9 images for each scene and realistic text-to-speech narration.
- **Real-Time Preview:** Watch the video generation progress in real-time and preview the final result directly in your browser.
- **Multiple Voices:** Choose from a variety of AI voices for your video narration.
- **Export:** Export your generated video as a standalone HTML file that can be played anywhere.
- **Full-Stack Architecture:** Built with React, Vite, and Express, providing a robust backend for handling AI API calls and generation logic.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Framer Motion, Lucide React
- **Backend:** Node.js, Express
- **AI Models:** 
  - `gemini-3.1-pro-preview` (Script Generation)
  - `gemini-2.5-flash-image` (Image Generation)
  - `gemini-2.5-flash-preview-tts` (Audio Generation)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API Key

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/open-vibeknow.git
   cd open-vibeknow
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   Create a \`.env\` file in the root directory and add your Gemini API key:
   \`\`\`env
   GEMINI_API_KEY=your_api_key_here
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open your browser and navigate to \`http://localhost:3000\`.

## License

This project is open-source and available under the MIT License.
