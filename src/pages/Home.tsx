import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { FileUp, Link as LinkIcon, Mic, Music, Sparkles } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  const handleStart = () => {
    if (inputValue.trim()) {
      navigate('/create', { state: { initialInput: inputValue } });
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
          VibeKnow
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-12 text-center">
          一键把文档 / URL 变成<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">讲得清楚的视频</span>
        </h1>

        <div className="w-full bg-white rounded-2xl shadow-xl shadow-purple-900/5 border border-purple-100 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex items-center gap-6 px-6 py-4 border-b border-gray-50">
            <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <FileUp className="w-4 h-4" />
              上传文件
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <LinkIcon className="w-4 h-4" />
              添加链接
            </button>
          </div>

          {/* Text Area */}
          <div className="p-6">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入或粘贴文本内容..."
              className="w-full h-40 resize-none outline-none text-gray-700 placeholder:text-gray-300 text-lg"
            />
          </div>

          {/* Bottom Controls */}
          <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-50">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-[10px] text-white">
                  芝
                </div>
                芝舒
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <Music className="w-4 h-4 text-gray-400" />
                背景音乐
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {inputValue.length}/5000
              </span>
              <button
                onClick={handleStart}
                disabled={!inputValue.trim()}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/20"
              >
                生成视频
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
