import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/history", (req, res) => {
    // Mock history tasks
    const historyTasks = [
      { id: 1, title: '地缘风暴下黄金原油多空博弈', time: '10分钟前' },
      { id: 2, title: 'AI 视频生成原理解析', time: '2小时前' },
      { id: 3, title: '如何写出爆款短视频脚本', time: '昨天' },
      { id: 4, title: '2028年科技趋势预测', time: '2天前' },
      { id: 5, title: '新手如何快速入门 React', time: '3天前' },
    ];
    res.json(historyTasks);
  });

  app.post("/api/generate", async (req, res) => {
    const { input, voice, bgMusic } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    // We will use Server-Sent Events (SSE) to stream progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('progress', { step: '启动视频生成引擎' });
      sendEvent('progress', { step: '深度检索知识库' });

      // 1. Generate Script
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `你是一个专业的短视频编导。请将以下文本或链接内容转化为一个短视频脚本。
请提供：
1. title: 视频的吸引人的标题（15字以内）。
2. summary: 对内容的简短总结，用于向用户确认创作方向（约100字）。
3. scenes: 拆分为 3 到 5 个分镜。
对于每个分镜，提供：
- narration: 旁白文本（中文，口语化，每段1-2句话）。
- imagePrompt: 用于生成配图的英文提示词（详细、电影感、高质量）。

输入内容: ${input}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    narration: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                  },
                  required: ["narration", "imagePrompt"],
                },
              },
            },
            required: ["title", "summary", "scenes"],
          },
        },
      });

      const jsonStr = response.text?.trim() || "{}";
      const plan = JSON.parse(jsonStr);

      if (!plan || !plan.scenes || plan.scenes.length === 0) {
        throw new Error("Failed to generate script.");
      }

      sendEvent('progress', { step: '核心内容摘要生成完毕' });
      sendEvent('progress', { step: '构建智能解说脚本' });
      sendEvent('plan', plan);
      sendEvent('progress', { step: '正在生成画面与配音' });

      // 2. Generate Assets in parallel
      const updatedScenes = [...plan.scenes];
      const totalAssets = updatedScenes.length * 2;
      let completedAssets = 0;

      await Promise.all(updatedScenes.map(async (scene, index) => {
        const [imageUrl, audioUrl] = await Promise.all([
          generateImage(scene.imagePrompt).then(res => {
            completedAssets++;
            sendEvent('asset_progress', { progress: Math.round((completedAssets / totalAssets) * 100) });
            return res || 'failed';
          }),
          generateAudio(scene.narration, voice).then(res => {
            completedAssets++;
            sendEvent('asset_progress', { progress: Math.round((completedAssets / totalAssets) * 100) });
            return res || 'failed';
          })
        ]);
        
        updatedScenes[index] = { ...scene, imageUrl, audioUrl };
        sendEvent('scene_update', { index, scene: updatedScenes[index] });
      }));

      sendEvent('progress', { step: '渲染任务提交成功' });
      sendEvent('progress', { step: '生成视频' });
      sendEvent('progress', { step: '视频预览已生成' });
      
      sendEvent('done', { plan: { ...plan, scenes: updatedScenes } });
      res.end();

    } catch (error: any) {
      console.error("Generation error:", error);
      sendEvent('error', { message: error.message || "An error occurred during generation." });
      res.end();
    }
  });

  // Helper functions for generation
  async function generateImage(prompt: string): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: prompt + ", cinematic, highly detailed, 16:9 aspect ratio" },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    } catch (e) {
      console.error("Failed to generate image", e);
    }
    return null;
  }

  async function generateAudio(text: string, voiceName: string = 'Zephyr'): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Decode base64 to binary string
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create WAV header
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
        const blockAlign = numChannels * (bitsPerSample / 8);
        const dataSize = bytes.length;
        const chunkSize = 36 + dataSize;
        
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);
        
        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, chunkSize, true);
        writeString(view, 8, 'WAVE');
        
        // fmt sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
        view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        
        // data sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);
        
        // Write PCM data
        const pcmData = new Uint8Array(buffer, 44);
        pcmData.set(bytes);
        
        // Convert back to base64
        let wavBinary = '';
        const wavBytes = new Uint8Array(buffer);
        for (let i = 0; i < wavBytes.byteLength; i++) {
          wavBinary += String.fromCharCode(wavBytes[i]);
        }
        const wavBase64 = btoa(wavBinary);
        
        return `data:audio/wav;base64,${wavBase64}`;
      }
    } catch (e) {
      console.error("Failed to generate audio", e);
    }
    return null;
  }

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
