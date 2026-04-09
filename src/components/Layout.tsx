import { Outlet, Link, useLocation } from 'react-router';
import { Video, Plus, Folder, Star, BookOpen, Clock, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import SettingsModal from './SettingsModal';

interface HistoryTask {
  id: number;
  title: string;
  time: string;
  input?: string;
}

export default function Layout() {
  const location = useLocation();
  const [historyTasks, setHistoryTasks] = useState<HistoryTask[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setHistoryTasks(data))
      .catch(err => console.error("Failed to fetch history:", err));
  }, [location.pathname]);

  const navItems = [
    { name: '我的作品', path: '/works', icon: Folder },
    { name: '学习教程', path: '/tutorials', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-2">
          <div className="bg-purple-600 text-white p-1.5 rounded-lg">
            <Video className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Open-VibeKnow</span>
        </div>

        <div className="px-4 mb-6">
          <Link
            to="/"
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            创作
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-8 pb-2 px-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              历史任务
            </div>
          </div>
          <div className="space-y-1">
            {historyTasks.map((task) => (
              <Link
                key={task.id}
                to={`/create/${task.id}`}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <div className="truncate font-medium">{task.title}</div>
                {task.input && (
                  <div className="truncate text-xs text-gray-400 mt-0.5">{task.input}</div>
                )}
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-4 h-4" />
            全局设置
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Outlet />
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
