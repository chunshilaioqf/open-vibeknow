import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Save, Settings2, MessageSquare, RotateCcw } from 'lucide-react';

export interface ModelConfig {
  id: string;
  provider: 'google' | 'openai' | 'custom';
  modelName: string;
  apiKey: string;
  baseUrl?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'models' | 'prompts'>('models');
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  
  const [optimizePrompt, setOptimizePrompt] = useState('');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load models
      const saved = localStorage.getItem('openVibeKnowModels');
      if (saved) {
        try {
          setConfigs(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved models", e);
        }
      } else {
        setConfigs([{
          id: Date.now().toString(),
          provider: 'google',
          modelName: 'gemini-3.1-pro-preview',
          apiKey: '',
        }]);
      }

      // Load prompts
      fetch('/api/settings/prompts')
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP error! status: ${res.status}, body: ${text.substring(0, 100)}`);
          }
          return res.json();
        })
        .then(data => {
          setOptimizePrompt(data.optimize_prompt || '');
          setGeneratePrompt(data.generate_prompt || '');
        })
        .catch(err => console.error("Failed to fetch prompts:", err));
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save models
      localStorage.setItem('openVibeKnowModels', JSON.stringify(configs));
      
      // Save prompts
      await fetch('/api/settings/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimize_prompt: optimizePrompt,
          generate_prompt: generatePrompt
        })
      });
      
      onClose();
    } catch (e) {
      console.error("Failed to save settings", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestorePrompts = async () => {
    if (!confirm('确定要恢复默认的系统提示词吗？您当前的修改将丢失。')) return;
    
    try {
      const res = await fetch('/api/settings/prompts/restore', { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP error! status: ${res.status}, body: ${text.substring(0, 100)}`);
      }
      const data = await res.json();
      setOptimizePrompt(data.optimize_prompt);
      setGeneratePrompt(data.generate_prompt);
    } catch (e) {
      console.error("Failed to restore prompts", e);
    }
  };

  const addConfig = () => {
    setConfigs([...configs, {
      id: Date.now().toString(),
      provider: 'google',
      modelName: '',
      apiKey: '',
    }]);
  };

  const removeConfig = (id: string) => {
    setConfigs(configs.filter(c => c.id !== id));
  };

  const updateConfig = (id: string, updates: Partial<ModelConfig>) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const moveConfig = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newConfigs = [...configs];
      [newConfigs[index - 1], newConfigs[index]] = [newConfigs[index], newConfigs[index - 1]];
      setConfigs(newConfigs);
    } else if (direction === 'down' && index < configs.length - 1) {
      const newConfigs = [...configs];
      [newConfigs[index + 1], newConfigs[index]] = [newConfigs[index], newConfigs[index + 1]];
      setConfigs(newConfigs);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">全局设置 (Global Settings)</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-gray-50 border-r border-gray-100 p-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('models')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'models' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              模型配置
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'prompts' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              系统提示词
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {activeTab === 'models' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">模型配置 (Model Configuration)</h3>
                    <p className="text-sm text-gray-500 mt-1">配置多个模型并排序。系统将按顺序尝试，如果失败则自动回退到下一个。</p>
                  </div>
                  <button 
                    onClick={addConfig}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加模型
                  </button>
                </div>

                <div className="space-y-4">
                  {configs.map((config, index) => (
                    <div key={config.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex gap-4">
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                        <button 
                          onClick={() => moveConfig(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:text-gray-700 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <GripVertical className="w-5 h-5" />
                        <button 
                          onClick={() => moveConfig(index, 'down')}
                          disabled={index === configs.length - 1}
                          className="p-1 hover:text-gray-700 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">提供商 (Provider)</label>
                          <select 
                            value={config.provider}
                            onChange={(e) => updateConfig(config.id, { provider: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-400 text-sm bg-white"
                          >
                            <option value="google">Google Gemini</option>
                            <option value="openai">OpenAI</option>
                            <option value="custom">兼容 OpenAI (Custom)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">模型名称 (Model Name)</label>
                          <input 
                            type="text"
                            value={config.modelName}
                            onChange={(e) => updateConfig(config.id, { modelName: e.target.value })}
                            placeholder={config.provider === 'google' ? 'gemini-3.1-pro-preview' : 'gpt-4o'}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-400 text-sm bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                          <input 
                            type="password"
                            value={config.apiKey}
                            onChange={(e) => updateConfig(config.id, { apiKey: e.target.value })}
                            placeholder="输入 API Key"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-400 text-sm bg-white"
                          />
                        </div>
                        {config.provider === 'custom' && (
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Base URL</label>
                            <input 
                              type="url"
                              value={config.baseUrl || ''}
                              onChange={(e) => updateConfig(config.id, { baseUrl: e.target.value })}
                              placeholder="https://api.example.com/v1"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-400 text-sm bg-white"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-start">
                        <button 
                          onClick={() => removeConfig(config.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {configs.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      暂无模型配置，请点击右上角添加。
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'prompts' && (
              <div className="flex flex-col h-full">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">系统提示词 (System Prompts)</h3>
                    <p className="text-sm text-gray-500 mt-1">自定义 AI 在优化文案和生成视频脚本时使用的系统指令。</p>
                  </div>
                  <button 
                    onClick={handleRestorePrompts}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    恢复默认
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提示词优化指令 (Prompt Optimization)
                    </label>
                    <textarea 
                      value={optimizePrompt}
                      onChange={(e) => setOptimizePrompt(e.target.value)}
                      className="w-full h-40 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-purple-400 text-sm bg-gray-50 focus:bg-white transition-colors resize-none font-mono"
                      placeholder="输入用于优化提示词的系统指令..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      视频脚本生成指令 (Script Generation)
                    </label>
                    <textarea 
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      className="w-full h-64 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-purple-400 text-sm bg-gray-50 focus:bg-white transition-colors resize-none font-mono"
                      placeholder="输入用于生成视频分镜脚本的系统指令..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 z-10">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
