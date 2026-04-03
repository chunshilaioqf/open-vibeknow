import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Scene, VideoPlan } from '../types';
import { exportVideo } from '../lib/exportVideo';
import { Loader2, Play, Pause, RotateCcw, Image as ImageIcon, Volume2, FileText, CheckCircle2, Download, Video, Sparkles } from 'lucide-react';

export default function Create() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [input, setInput] = useState('');
  const [voice, setVoice] = useState('Zephyr');
  const [bgMusic, setBgMusic] = useState(true);
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [plan, setPlan] = useState<VideoPlan | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addStep = (step: string) => {
    setProgressSteps(prev => {
      if (!prev.includes(step)) return [...prev, step];
      return prev;
    });
  };

  useEffect(() => {
    if (!id) return;

    // Reset state when ID changes
    setStatus('idle');
    setPlan(null);
    setScenes([]);
    setProgressSteps([]);
    setError('');

    let eventSource: EventSource | null = null;

    const connectStream = () => {
      eventSource = new EventSource(`/api/tasks/${id}/stream`);

      eventSource.addEventListener('init', (e) => {
        const data = JSON.parse(e.data);
        setInput(data.input);
        setVoice(data.voice);
        setBgMusic(data.bgMusic);
        setStatus(data.status);
        if (data.plan) {
          setPlan(data.plan);
          setScenes(data.plan.scenes || []);
        }
        if (data.currentStep) addStep(data.currentStep);
        if (data.error) setError(data.error);
      });

      eventSource.addEventListener('state_update', (e) => {
        const data = JSON.parse(e.data);
        setStatus(data.status);
        if (data.plan) {
          setPlan(data.plan);
          setScenes(data.plan.scenes || []);
        }
        if (data.currentStep) addStep(data.currentStep);
        if (data.error) setError(data.error);
        
        if (data.status === 'done' || data.status === 'error') {
          eventSource?.close();
        }
      });

      eventSource.onerror = () => {
        console.error('SSE connection error');
        eventSource?.close();
      };
    };

    connectStream();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [id]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FC] p-6 overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
        
        {/* Left Column: Progress & Chat */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              视频创作进度
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* User Input Bubble */}
            <div className="flex flex-col items-end gap-1">
              <div className="bg-purple-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-sm">
                {input || "开始生成视频..."}
              </div>
            </div>

            {/* Progress Steps */}
            {progressSteps.length > 0 && (
              <div className="flex flex-col items-start gap-1">
                <div className="bg-gray-50 border border-gray-100 text-gray-800 px-5 py-4 rounded-2xl rounded-tl-sm w-full text-sm shadow-sm">
                  <div className="flex items-center gap-2 mb-3 font-medium text-purple-600">
                    <Video className="w-4 h-4" />
                    Open-VibeKnow AI
                  </div>
                  <div className="space-y-3">
                    {progressSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{step}</span>
                      </div>
                    ))}
                    {status === 'generating' && (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-purple-500 animate-spin flex-shrink-0" />
                        <span className="text-gray-400">正在处理中...</span>
                      </div>
                    )}
                  </div>

                  {plan && status === 'done' && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">摘要：</h4>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {plan.summary}
                      </p>
                      <button 
                        onClick={() => navigate('/')}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm"
                      >
                        创作新视频
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-start gap-1">
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Player & Script */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
          
          {/* Top: Video Player */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 truncate pr-4">
                {plan?.title || "视频预览"}
              </h2>
              <button 
                onClick={() => exportVideo(scenes)}
                disabled={status !== 'done' || scenes.length === 0}
                className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            </div>
            
            <div className="bg-black aspect-video relative flex items-center justify-center">
              {status === 'done' && scenes.length > 0 ? (
                <VideoPlayer scenes={scenes} bgMusic={bgMusic} />
              ) : (
                <div className="text-gray-500 flex flex-col items-center gap-4">
                  {status === 'idle' ? (
                    <>
                      <Play className="w-12 h-12 opacity-20" />
                      <p>等待生成...</p>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin opacity-50" />
                      <p className="animate-pulse">正在渲染视频画面...</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Script */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-0">
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-6 bg-gray-50/50">
              <button className="text-sm font-medium text-purple-600 border-b-2 border-purple-600 pb-3 -mb-3">
                脚本
              </button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-900 pb-3 -mb-3">
                分镜
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {scenes.length > 0 ? (
                <div className="space-y-6">
                  {scenes.map((scene, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:border-purple-200 transition-colors">
                        <p className="text-gray-800 leading-relaxed">{scene.narration}</p>
                        <div className="mt-3 flex gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {scene.imageUrl === 'failed' ? <span className="text-red-500">图片失败</span> : scene.imageUrl ? <span className="text-green-600">图片就绪</span> : '生成中...'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Volume2 className="w-3.5 h-3.5" />
                            {scene.audioUrl === 'failed' ? <span className="text-red-500">音频失败</span> : scene.audioUrl ? <span className="text-green-600">音频就绪</span> : '生成中...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  暂无脚本内容
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ scenes, bgMusic }: { scenes: Scene[], bgMusic: boolean }) {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement>(null);

  const currentScene = scenes[currentSceneIdx];
  
  const handleAudioEnded = () => {
    if (currentSceneIdx < scenes.length - 1) {
      setCurrentSceneIdx(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentSceneIdx(0);
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isPlaying) {
      if (bgMusic && bgMusicRef.current && bgMusicRef.current.paused) {
        bgMusicRef.current.volume = 0.1;
        bgMusicRef.current.play().catch(e => console.error("BG Music play failed", e));
      }

      if (currentScene?.audioUrl && currentScene.audioUrl !== 'failed' && audioRef.current) {
        audioRef.current.play().catch(e => {
          console.error("Audio play failed", e);
          // Fallback if play fails
          timeoutId = setTimeout(handleAudioEnded, 3000);
        });
      } else {
        // Fallback if no audio
        timeoutId = setTimeout(handleAudioEnded, 3000);
      }
    } else {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentSceneIdx, isPlaying, currentScene, bgMusic]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      bgMusicRef.current?.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioRef.current?.play().catch(e => console.error("Audio play failed", e));
      if (bgMusic && bgMusicRef.current) {
        bgMusicRef.current.play().catch(e => console.error("BG Music play failed", e));
      }
    }
  };

  return (
    <div className="w-full h-full relative group">
      <AnimatePresence mode="wait">
        {currentScene?.imageUrl && currentScene.imageUrl !== 'failed' ? (
          <motion.img
            key={currentSceneIdx}
            src={currentScene.imageUrl}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <motion.div
            key={currentSceneIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-gray-900 absolute inset-0 flex items-center justify-center text-gray-500"
          >
            <ImageIcon className="w-12 h-12 opacity-20" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtitles */}
      <div className="absolute bottom-12 inset-x-0 px-8 text-center z-10">
        <p className="text-white text-lg md:text-xl font-medium drop-shadow-lg bg-black/50 inline-block px-4 py-2 rounded-lg backdrop-blur-sm">
          {currentScene?.narration}
        </p>
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end">
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
          <button 
            onClick={togglePlay}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <div className="flex gap-1">
            {scenes.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all ${idx === currentSceneIdx ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
              />
            ))}
          </div>
          
          <button 
            onClick={() => {
              setCurrentSceneIdx(0);
              setIsPlaying(true);
            }}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {currentScene?.audioUrl && currentScene.audioUrl !== 'failed' && (
        <audio
          ref={audioRef}
          src={currentScene.audioUrl}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}
      {bgMusic && (
        <audio
          ref={bgMusicRef}
          src="https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-piano-amp-strings-10711.mp3"
          loop
          className="hidden"
        />
      )}
    </div>
  );
}
