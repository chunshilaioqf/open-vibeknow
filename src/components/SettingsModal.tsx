import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Save } from 'lucide-react';

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
  const [configs, setConfigs] = useState<ModelConfig[]>([]);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('openVibeKnowModels');
      if (saved) {
        try {
          setConfigs(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved models", e);
        }
      } else {
        // Default config
        setConfigs([{
          id: Date.now().toString(),
          provider: 'google',
          modelName: 'gemini-3.1-pro-preview',
          apiKey: '',
        }]);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('openVibeKnowModels', JSON.stringify(configs));
    onClose();
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">全局设置 (Global Settings)</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">模型配置 (Model Configuration)</h3>
              <p className="text-sm text-gray-500">配置多个模型并排序。系统将按顺序尝试，如果失败则自动回退到下一个。</p>
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

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
