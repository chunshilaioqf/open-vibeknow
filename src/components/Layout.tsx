import { Outlet, Link, useLocation } from 'react-router';
import { Video, Plus, Folder, Star, BookOpen, Clock } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { name: '我的作品', path: '/works', icon: Folder },
    { name: '优秀作品', path: '/explore', icon: Star },
    { name: '学习教程', path: '/tutorials', icon: BookOpen },
  ];

  // Mock history tasks
  const historyTasks = [
    { id: 1, title: '地缘风暴下黄金原油多空博弈', time: '10分钟前' },
    { id: 2, title: 'AI 视频生成原理解析', time: '2小时前' },
    { id: 3, title: '如何写出爆款短视频脚本', time: '昨天' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-2">
          <div className="bg-purple-600 text-white p-1.5 rounded-lg">
            <Video className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">vibeknow</span>
        </div>

        <div className="px-4 mb-6">
          <Link
            to="/create"
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            创作
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
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
          <div className="space-y-0.5">
            {historyTasks.map((task) => (
              <button
                key={task.id}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors truncate"
              >
                {task.title}
              </button>
            ))}
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">User</p>
              <p className="text-xs text-gray-500 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
