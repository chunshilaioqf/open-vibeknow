import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Scene {
  narration: string;
  imagePrompt: string;
  audioUrl?: string;
  imageUrl?: string;
}

export interface VideoPlan {
  title: string;
  summary: string;
  scenes: Scene[];
}

export async function generateScript(input: string): Promise<VideoPlan | null> {
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
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse script JSON", e);
    return null;
  }
}

export async function generateImage(prompt: string): Promise<string | null> {
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

export async function generateAudio(text: string, voiceName: string = 'Zephyr'): Promise<string | null> {
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
