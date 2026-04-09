import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { FileUp, Link as LinkIcon, Mic, Music, Sparkles, ChevronDown, Type, Wand2, X } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [linkValue, setLinkValue] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  
  const [voice, setVoice] = useState('Zephyr');
  const [bgMusic, setBgMusic] = useState(true);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  const voices = [
    { id: 'Zephyr', name: '芝舒 (女声)' },
    { id: 'Puck', name: '帕克 (男声)' },
    { id: 'Charon', name: '卡戎 (男声)' },
    { id: 'Kore', name: '科瑞 (女声)' },
    { id: 'Fenrir', name: '芬里尔 (男声)' },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptimize = async () => {
    if (!inputValue.trim() || isOptimizing) return;
    setIsOptimizing(true);
    try {
      const modelsConfig = JSON.parse(localStorage.getItem('openVibeKnowModels') || '[]');
      const res = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputValue, models: modelsConfig })
      });
      const data = await res.json();
      if (data.optimizedText) {
        setOriginalPrompt(inputValue);
        setInputValue(data.optimizedText);
      }
    } catch (e) {
      console.error("Failed to optimize prompt", e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleStart = async () => {
    if (!inputValue.trim() && !selectedFile && !linkValue.trim()) {
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('voice', voice);
      formData.append('bgMusic', String(bgMusic));
      
      const modelsConfig = localStorage.getItem('openVibeKnowModels') || '[]';
      formData.append('models', modelsConfig);
      
      if (inputValue.trim()) {
        formData.append('input', inputValue);
      }
      if (linkValue.trim()) {
        formData.append('link', linkValue);
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData // Send as FormData
      });
      
      const data = await res.json();
      if (data.id) {
        navigate(`/create/${data.id}`);
      }
    } catch (e) {
      console.error("Failed to start generation", e);
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl -z-10"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900 text-sm font-medium text-white mb-8 shadow-lg shadow-gray-900/20">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Open-VibeKnow
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-12 text-center">
          一键把文档 / URL 变成<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">讲得清楚的视频</span>
        </h1>

        <div className="w-full bg-white rounded-2xl shadow-xl shadow-purple-900/5 border border-purple-100 flex flex-col relative z-10">
          {/* Input Area */}
          <div className="p-6 flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="输入或粘贴文本内容..."
                className="w-full h-40 resize-none outline-none text-gray-700 placeholder:text-gray-300 text-lg"
              />
              {originalPrompt && (
                <button 
                  onClick={() => {
                    setInputValue(originalPrompt);
                    setOriginalPrompt('');
                  }}
                  className="absolute bottom-2 right-2 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  取消优化
                </button>
              )}
            </div>

            {/* Attachments Area */}
            <div className="flex flex-col gap-3">
              {/* If file selected, show file chip */}
              {selectedFile && (
                <div className="flex items-center justify-between bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-purple-700">{selectedFile.name}</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-purple-400 hover:text-purple-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* If link added, show link input */}
              {showLinkInput && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    placeholder="https://example.com/article"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-400 text-sm"
                  />
                  <button onClick={() => { setShowLinkInput(false); setLinkValue(''); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attachment Buttons */}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".txt,.md,.pdf,.doc,.docx"
                />
                {!selectedFile && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
                  >
                    <FileUp className="w-4 h-4" />
                    上传文件
                  </button>
                )}
                {!showLinkInput && (
                  <button 
                    onClick={() => setShowLinkInput(true)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    添加链接
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="px-6 py-4 bg-gray-50/50 rounded-b-2xl flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-[10px] text-white">
                  {voices.find(v => v.id === voice)?.name.charAt(0)}
                </div>
                {voices.find(v => v.id === voice)?.name}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showVoiceMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                  {voices.map(v => (
                    <button
                      key={v.id}
                      onClick={() => { setVoice(v.id); setShowVoiceMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${voice === v.id ? 'text-purple-600 font-medium bg-purple-50/50' : 'text-gray-700'}`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setBgMusic(!bgMusic)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors shadow-sm ${bgMusic ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                <Music className={`w-4 h-4 ${bgMusic ? 'text-purple-500' : 'text-gray-400'}`} />
                背景音乐 {bgMusic ? '开' : '关'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOptimize}
                disabled={!inputValue.trim() || isOptimizing}
                title="优化提示词"
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOptimizing ? (
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={handleStart}
                disabled={(!inputValue.trim() && !selectedFile && !linkValue.trim()) || isSubmitting}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/20 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  '生成视频'
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
