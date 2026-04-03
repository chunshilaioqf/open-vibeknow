import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { FileUp, Link as LinkIcon, Mic, Music, Sparkles, ChevronDown, Type } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<'text' | 'file' | 'link'>('text');
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleStart = async () => {
    if ((inputType === 'text' && !inputValue.trim()) || 
        (inputType === 'link' && !inputValue.trim()) || 
        (inputType === 'file' && !selectedFile)) {
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('voice', voice);
      formData.append('bgMusic', String(bgMusic));
      formData.append('type', inputType);

      if (inputType === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('input', inputValue);
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
          {/* Tabs */}
          <div className="flex items-center gap-6 px-6 py-4 border-b border-gray-50">
            <button 
              onClick={() => setInputType('text')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${inputType === 'text' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Type className="w-4 h-4" />
              输入文本
            </button>
            <button 
              onClick={() => setInputType('file')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${inputType === 'file' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <FileUp className="w-4 h-4" />
              上传文件
            </button>
            <button 
              onClick={() => setInputType('link')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${inputType === 'link' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <LinkIcon className="w-4 h-4" />
              添加链接
            </button>
          </div>

          {/* Input Area */}
          <div className="p-6">
            {inputType === 'text' && (
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="输入或粘贴文本内容..."
                className="w-full h-40 resize-none outline-none text-gray-700 placeholder:text-gray-300 text-lg"
              />
            )}
            
            {inputType === 'file' && (
              <div 
                className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".txt,.md,.pdf,.doc,.docx"
                />
                <FileUp className="w-8 h-8 text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">
                  {selectedFile ? selectedFile.name : '点击或拖拽文件到此处上传'}
                </p>
                <p className="text-gray-400 text-sm mt-1">支持 TXT, MD, PDF, DOC 等格式</p>
              </div>
            )}

            {inputType === 'link' && (
              <div className="w-full h-40 flex flex-col justify-center">
                <input
                  type="url"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-lg"
                />
                <p className="text-gray-400 text-sm mt-3 ml-1">输入文章、新闻或网页的链接，AI将自动提取内容</p>
              </div>
            )}
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

            <div className="flex items-center gap-4">
              {inputType === 'text' && (
                <span className="text-sm text-gray-400">
                  {inputValue.length}/5000
                </span>
              )}
              <button
                onClick={handleStart}
                disabled={((inputType === 'text' || inputType === 'link') && !inputValue.trim()) || (inputType === 'file' && !selectedFile) || isSubmitting}
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
