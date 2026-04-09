import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import multer from "multer";
import OpenAI from "openai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ModelConfig {
  id: string;
  provider: 'google' | 'openai' | 'custom';
  modelName: string;
  apiKey: string;
  baseUrl?: string;
}

async function generateWithFallback(
  models: ModelConfig[],
  prompt: string,
  systemInstruction: string,
  responseFormat?: 'json_object' | 'text'
): Promise<string> {
  if (!models || models.length === 0) {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: responseFormat === 'json_object' ? "application/json" : "text/plain"
      }
    });
    return response.text || "";
  }

  let lastError: any = null;

  for (const config of models) {
    try {
      if (config.provider === 'google') {
        const client = new GoogleGenAI({ apiKey: config.apiKey || process.env.GEMINI_API_KEY });
        const response = await client.models.generateContent({
          model: config.modelName || "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: responseFormat === 'json_object' ? "application/json" : "text/plain"
          }
        });
        return response.text || "";
      } else if (config.provider === 'openai' || config.provider === 'custom') {
        const client = new OpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseUrl || undefined
        });
        const response = await client.chat.completions.create({
          model: config.modelName || "gpt-4o",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          response_format: responseFormat === 'json_object' ? { type: "json_object" } : undefined
        });
        return response.choices[0].message.content || "";
      }
    } catch (e) {
      console.error(`Model ${config.modelName} (${config.provider}) failed:`, e);
      lastError = e;
    }
  }

  throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

// Setup directories
const OUTPUT_DIR = path.join(process.cwd(), "output");
const UPLOAD_DIR = path.join(OUTPUT_DIR, "upload");
const VIDEO_DIR = path.join(OUTPUT_DIR, "video");
const ASSETS_DIR = path.join(OUTPUT_DIR, "assets");
const LOGS_DIR = path.join(OUTPUT_DIR, "logs");

async function ensureDirs() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

// Setup Multer
const upload = multer({ dest: UPLOAD_DIR });

const DEFAULT_OPTIMIZE_PROMPT = `你是一个专业的短视频文案优化专家。请优化以下用户输入的短视频提示词/文案，使其更适合生成高质量的短视频脚本。
要求：
1. 语言生动、有吸引力。
2. 结构清晰，适合转化为分镜。
3. 直接输出优化后的文本，不要包含任何解释或多余的话语。`;

const DEFAULT_GENERATE_PROMPT = `你是一个专业的短视频编导。请将以下文本或链接内容转化为一个短视频脚本。
请提供：
1. title: 视频的吸引人的标题（15字以内）。
2. summary: 对内容的简短总结，用于向用户确认创作方向（约100字）。
3. scenes: 拆分为 3 到 5 个分镜。
对于每个分镜，提供：
- narration: 旁白文本（中文，口语化，每段1-2句话）。
- imagePrompt: 用于生成配图的英文提示词（详细、电影感、高质量）。`;

// Database setup
let db: any;
async function setupDb() {
  db = await open({
    filename: path.join(OUTPUT_DIR, "database.sqlite"),
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT,
      status TEXT,
      createdAt INTEGER,
      data JSON
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Initialize default prompts
  const optPrompt = await db.get(`SELECT value FROM settings WHERE key = 'optimize_prompt'`);
  if (!optPrompt) {
    await db.run(`INSERT INTO settings (key, value) VALUES ('optimize_prompt', ?)`, [DEFAULT_OPTIMIZE_PROMPT]);
  }
  const genPrompt = await db.get(`SELECT value FROM settings WHERE key = 'generate_prompt'`);
  if (!genPrompt) {
    await db.run(`INSERT INTO settings (key, value) VALUES ('generate_prompt', ?)`, [DEFAULT_GENERATE_PROMPT]);
  }
}

interface Task {
  id: string;
  title: string;
  time: string;
  status: 'idle' | 'generating' | 'done' | 'error';
  progress: number;
  currentStep: string;
  plan: any | null;
  error: string | null;
  input: string;
  voice: string;
  bgMusic: boolean;
  createdAt: number;
}

// In-memory active tasks (for SSE)
const activeTasks = new Map<string, Task>();
const clients = new Map<string, express.Response[]>();

function broadcastToClients(taskId: string, event: string, data: any) {
  const taskClients = clients.get(taskId) || [];
  taskClients.forEach(res => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

async function saveTaskToDb(task: Task) {
  await db.run(
    `INSERT OR REPLACE INTO tasks (id, title, status, createdAt, data) VALUES (?, ?, ?, ?, ?)`,
    [task.id, task.title, task.status, task.createdAt, JSON.stringify(task)]
  );
}

async function getTaskFromDb(id: string): Promise<Task | null> {
  const row = await db.get(`SELECT data FROM tasks WHERE id = ?`, [id]);
  if (row) {
    return JSON.parse(row.data);
  }
  return null;
}

async function logToFile(taskId: string, message: string) {
  const logPath = path.join(LOGS_DIR, `${taskId}.log`);
  const timestamp = new Date().toISOString();
  await fs.appendFile(logPath, `[${timestamp}] ${message}\n`);
}

async function startServer() {
  await ensureDirs();
  await setupDb();

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Serve assets
  app.use('/assets', express.static(ASSETS_DIR));
  app.use('/video', express.static(VIDEO_DIR));

  // API Routes
  app.get("/api/settings/prompts", async (req, res) => {
    try {
      const opt = await db.get(`SELECT value FROM settings WHERE key = 'optimize_prompt'`);
      const gen = await db.get(`SELECT value FROM settings WHERE key = 'generate_prompt'`);
      res.json({ optimize_prompt: opt?.value || '', generate_prompt: gen?.value || '' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/settings/prompts", async (req, res) => {
    try {
      const { optimize_prompt, generate_prompt } = req.body;
      if (optimize_prompt) {
        await db.run(`UPDATE settings SET value = ? WHERE key = 'optimize_prompt'`, [optimize_prompt]);
      }
      if (generate_prompt) {
        await db.run(`UPDATE settings SET value = ? WHERE key = 'generate_prompt'`, [generate_prompt]);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/settings/prompts/restore", async (req, res) => {
    try {
      await db.run(`UPDATE settings SET value = ? WHERE key = 'optimize_prompt'`, [DEFAULT_OPTIMIZE_PROMPT]);
      await db.run(`UPDATE settings SET value = ? WHERE key = 'generate_prompt'`, [DEFAULT_GENERATE_PROMPT]);
      res.json({ optimize_prompt: DEFAULT_OPTIMIZE_PROMPT, generate_prompt: DEFAULT_GENERATE_PROMPT });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/history", async (req, res) => {
    const rows = await db.all(`SELECT data FROM tasks ORDER BY createdAt DESC`);
    const historyTasks = rows.map((r: any) => {
      const t = JSON.parse(r.data);
      return {
        id: t.id,
        title: t.title || '未命名视频',
        time: new Date(t.createdAt).toLocaleString(),
        status: t.status,
        input: t.input
      };
    });
    res.json(historyTasks);
  });

  app.get("/api/tasks/:id", async (req, res) => {
    const task = activeTasks.get(req.params.id) || await getTaskFromDb(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  });

  app.get("/api/tasks/:id/stream", async (req, res) => {
    const taskId = req.params.id;
    const task = activeTasks.get(taskId) || await getTaskFromDb(taskId);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!clients.has(taskId)) {
      clients.set(taskId, []);
    }
    clients.get(taskId)!.push(res);

    res.write(`event: init\ndata: ${JSON.stringify(task)}\n\n`);

    req.on('close', () => {
      const taskClients = clients.get(taskId) || [];
      clients.set(taskId, taskClients.filter(c => c !== res));
    });
  });

  app.post("/api/optimize-prompt", async (req, res) => {
    const { text, models } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    
    try {
      const optRow = await db.get(`SELECT value FROM settings WHERE key = 'optimize_prompt'`);
      const systemInstruction = optRow?.value || DEFAULT_OPTIMIZE_PROMPT;

      const optimizedText = await generateWithFallback(models || [], text, systemInstruction, 'text');
      
      res.json({ optimizedText: optimizedText.trim() });
    } catch (e: any) {
      console.error("Optimization error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/generate", upload.single('file'), async (req, res) => {
    let { input, voice, bgMusic, link, models } = req.body;
    
    let parsedModels: ModelConfig[] = [];
    try {
      if (models) {
        parsedModels = JSON.parse(models);
      }
    } catch (e) {
      console.error("Failed to parse models config", e);
    }

    let finalInput = input || '';

    // Handle file upload
    if (req.file) {
      try {
        const fileContent = await fs.readFile(req.file.path, 'utf-8');
        finalInput += `\n\n[文件内容]:\n${fileContent}`;
      } catch (e) {
        return res.status(400).json({ error: "Failed to read uploaded file" });
      }
    } 
    
    if (link) {
      try {
        const fetchRes = await fetch(link);
        const text = await fetchRes.text();
        finalInput += `\n\n[链接内容提取 (${link})]:\n${text.substring(0, 5000)}`; 
      } catch (e) {
        return res.status(400).json({ error: "Failed to fetch link" });
      }
    }

    if (!finalInput.trim()) {
      return res.status(400).json({ error: "Input is required" });
    }

    const taskId = Date.now().toString();
    const newTask: Task = {
      id: taskId,
      title: '生成中...',
      time: new Date().toLocaleString(),
      status: 'generating',
      progress: 0,
      currentStep: '启动视频生成引擎',
      plan: null,
      error: null,
      input: finalInput,
      voice: voice || 'Zephyr',
      bgMusic: bgMusic === 'true' || bgMusic === true,
      createdAt: Date.now()
    };

    activeTasks.set(taskId, newTask);
    await saveTaskToDb(newTask);
    await logToFile(taskId, `Task created with input length: ${input?.length || 0}`);
    
    res.json({ id: taskId });
    runGeneration(taskId, parsedModels);
  });

  async function runGeneration(taskId: string, modelsConfig: ModelConfig[]) {
    const task = activeTasks.get(taskId);
    if (!task) return;

    const updateTask = async (updates: Partial<Task>) => {
      Object.assign(task, updates);
      await saveTaskToDb(task);
      broadcastToClients(taskId, 'state_update', task);
      if (updates.currentStep) {
        await logToFile(taskId, `Step: ${updates.currentStep}`);
      }
    };

    try {
      await updateTask({ currentStep: '深度检索知识库' });

      const genRow = await db.get(`SELECT value FROM settings WHERE key = 'generate_prompt'`);
      const systemInstruction = genRow?.value || DEFAULT_GENERATE_PROMPT;

      const jsonStr = await generateWithFallback(
        modelsConfig,
        `输入内容: ${task.input.substring(0, 10000)}`,
        systemInstruction,
        'json_object'
      );

      const plan = JSON.parse(jsonStr);

      if (!plan || !plan.scenes || plan.scenes.length === 0) {
        throw new Error("Failed to generate script.");
      }

      await updateTask({ 
        title: plan.title,
        currentStep: '构建智能解说脚本',
        plan
      });

      await updateTask({ currentStep: '正在生成画面与配音' });
      
      const updatedScenes = [...plan.scenes];
      const totalAssets = updatedScenes.length * 2;
      let completedAssets = 0;

      await Promise.all(updatedScenes.map(async (scene, index) => {
        const [imageUrl, audioUrl] = await Promise.all([
          generateImage(scene.imagePrompt).then(async res => {
            completedAssets++;
            await updateTask({ progress: Math.round((completedAssets / totalAssets) * 100) });
            if (res) {
              // Save to assets
              const assetName = `${taskId}_scene_${index}.png`;
              const assetPath = path.join(ASSETS_DIR, assetName);
              const base64Data = res.replace(/^data:image\/png;base64,/, "");
              await fs.writeFile(assetPath, base64Data, 'base64');
              return `/assets/${assetName}`;
            }
            return 'failed';
          }),
          generateAudio(scene.narration, task.voice).then(async res => {
            completedAssets++;
            await updateTask({ progress: Math.round((completedAssets / totalAssets) * 100) });
            if (res) {
              const assetName = `${taskId}_scene_${index}.wav`;
              const assetPath = path.join(ASSETS_DIR, assetName);
              const base64Data = res.replace(/^data:audio\/wav;base64,/, "");
              await fs.writeFile(assetPath, base64Data, 'base64');
              return `/assets/${assetName}`;
            }
            return 'failed';
          })
        ]);
        
        updatedScenes[index] = { ...scene, imageUrl, audioUrl };
        const newPlan = { ...task.plan, scenes: updatedScenes };
        await updateTask({ plan: newPlan });
      }));

      await updateTask({ 
        currentStep: '视频预览已生成',
        status: 'done',
        progress: 100
      });
      await logToFile(taskId, `Generation completed successfully.`);

    } catch (error: any) {
      console.error("Generation error:", error);
      await logToFile(taskId, `Error: ${error.message}`);
      await updateTask({ 
        status: 'error',
        error: error.message || "An error occurred during generation."
      });
    } finally {
      // Clean up active task after a delay to let clients receive the final state
      setTimeout(() => {
        activeTasks.delete(taskId);
      }, 5000);
    }
  }

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
