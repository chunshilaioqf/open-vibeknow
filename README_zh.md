# Open-VibeKnow

Open-VibeKnow 是 Vibeknow 的开源替代方案，旨在通过一键操作，将文本、文件或 URL 转化为长篇分析类视频。

## 核心功能

- **一键生成视频：** 只需粘贴文本、上传文件（支持 TXT, MD, PDF, DOC 等）或输入链接，AI 即可自动生成完整的视频脚本，包括标题、摘要以及逐分镜的旁白。
- **AI 资产生成：** 使用 Google 的 Gemini 模型为每个分镜生成高质量、电影感的 16:9 配图，以及逼真的 TTS 语音旁白。
- **实时预览：** 在浏览器中实时查看视频生成进度，并直接预览最终效果。
- **历史记录与持久化：** 使用 SQLite 数据库保存历史生成任务，随时可以回顾和查看以前的作品。
- **结构化文件管理：** 所有上传的文件、生成的视频、中间资产（图片/音频）及日志都会被整齐地分类存放在 `output` 目录中。
- **多音色选择：** 提供多种 AI 音色供视频旁白使用。
- **便捷导出：** 将生成的视频导出为独立的 HTML 文件，随时随地播放。
- **全栈架构：** 基于 React、Vite 和 Express 构建，提供强大的后端支持，安全处理 AI API 调用和生成逻辑。

## 技术栈

- **前端：** React, Tailwind CSS, Framer Motion, Lucide React
- **后端：** Node.js, Express, SQLite, Multer
- **AI 模型：** 
  - `gemini-3.1-pro-preview` (脚本生成)
  - `gemini-2.5-flash-image` (图像生成)
  - `gemini-2.5-flash-preview-tts` (语音生成)

## 目录结构

所有生成的文件都会存储在 `output` 目录中：
- `output/upload/`: 用户上传的源文件。
- `output/video/`: 最终生成的视频文件（导出）。
- `output/assets/`: AI 生成的中间资产（图片、音频）。
- `output/logs/`: 每次生成过程的详细日志。
- `output/database.sqlite`: 存储任务历史的 SQLite 数据库。

## 快速开始

### 前置要求

- Node.js (v18 或更高版本)
- Google Gemini API Key

### 安装步骤

1. 克隆仓库：
   \`\`\`bash
   git clone https://github.com/yourusername/open-vibeknow.git
   cd open-vibeknow
   \`\`\`

2. 安装依赖：
   \`\`\`bash
   npm install
   \`\`\`

3. 配置环境变量：
   在根目录创建一个 \`.env\` 文件，并添加你的 Gemini API Key：
   \`\`\`env
   GEMINI_API_KEY=你的_api_key
   \`\`\`

4. 启动开发服务器：
   \`\`\`bash
   npm run dev
   \`\`\`

5. 打开浏览器并访问 \`http://localhost:3000\`。

## 开源协议

本项目基于 MIT 协议开源。
