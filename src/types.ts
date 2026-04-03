export interface Scene {
  narration: string;
  imagePrompt: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface VideoPlan {
  title: string;
  summary: string;
  scenes: Scene[];
}
