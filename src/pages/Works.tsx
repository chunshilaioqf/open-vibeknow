import { FolderOpen } from 'lucide-react';

export default function Works() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F8F9FC]">
      <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-purple-300" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">暂无作品</h2>
      <p className="text-gray-500 text-center max-w-md">
        您还没有生成过任何视频。回到首页，输入一段文本或链接，开始您的第一次创作吧！
      </p>
    </div>
  );
}
