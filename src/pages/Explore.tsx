import { Star } from 'lucide-react';

export default function Explore() {
  return (
    <div className="flex-1 flex flex-col p-8 bg-[#F8F9FC] overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" />
          优秀作品
        </h1>
        <p className="text-gray-500 mt-2">探索社区中其他创作者生成的精彩视频</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-100 relative">
              <img 
                src={`https://picsum.photos/seed/explore${i}/640/360`} 
                alt="Thumbnail" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">AI 视频生成原理解析 {i}</h3>
              <p className="text-sm text-gray-500">作者：Vibeknow User</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
