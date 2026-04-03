import { Scene } from './gemini';

export async function exportVideo(scenes: Scene[]) {
  // This is a simplified mock of video export.
  // Real browser-based video encoding requires playing through the canvas and recording with MediaRecorder.
  // For this demo, we will create a simple HTML file that plays the video.
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Exported Video</title>
  <style>
    body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
    #container { position: relative; width: 100%; max-width: 1280px; aspect-ratio: 16/9; overflow: hidden; }
    img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; opacity: 0; transition: opacity 0.5s; }
    img.active { opacity: 1; }
    #subtitle { position: absolute; bottom: 10%; left: 0; width: 100%; text-align: center; color: white; font-size: 2vw; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); z-index: 10; padding: 0 20px; box-sizing: border-box; }
    #playBtn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px 40px; font-size: 24px; cursor: pointer; z-index: 20; }
  </style>
</head>
<body>
  <div id="container">
    <button id="playBtn">Play Video</button>
    <div id="subtitle"></div>
  </div>
  <script>
    const scenes = ${JSON.stringify(scenes)};
    const container = document.getElementById('container');
    const subtitle = document.getElementById('subtitle');
    const playBtn = document.getElementById('playBtn');
    
    let currentIdx = 0;
    let audio = new Audio();
    
    // Preload images
    const images = scenes.map(s => {
      const img = new Image();
      img.src = s.imageUrl;
      container.appendChild(img);
      return img;
    });

    playBtn.onclick = () => {
      playBtn.style.display = 'none';
      playScene(0);
    };

    function playScene(idx) {
      if (idx >= scenes.length) {
        playBtn.style.display = 'block';
        playBtn.innerText = 'Replay';
        return;
      }
      
      images.forEach(img => img.classList.remove('active'));
      images[idx].classList.add('active');
      subtitle.innerText = scenes[idx].narration;
      
      if (scenes[idx].audioUrl) {
        audio.src = scenes[idx].audioUrl;
        audio.play();
        audio.onended = () => playScene(idx + 1);
      } else {
        setTimeout(() => playScene(idx + 1), 3000);
      }
    }
  </script>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'video-export.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
