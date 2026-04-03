import { BookOpen, PlayCircle } from 'lucide-react';

export default function Tutorials() {
  const tutorials = [
    { title: "如何写出完美的提示词？", duration: "5:20" },
    { title: "Vibeknow 进阶使用技巧", duration: "12:05" },
    { title: "如何为视频选择合适的音色？", duration: "3:45" },
    { title: "从零开始：你的第一个 AI 视频", duration: "8:30" },
  ];

  return (
    <div className="flex-1 flex flex-col p-8 bg-[#F8F9FC] overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-500" />
          学习教程
        </h1>
        <p className="text-gray-500 mt-2">掌握 Vibeknow 的所有功能，成为视频创作大师</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {tutorials.map((tutorial, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center group cursor-pointer hover:border-purple-200 transition-colors">
            <div className="w-32 h-20 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0">
              <img 
                src={`https://picsum.photos/seed/tutorial${i}/320/200`} 
                alt="Thumbnail" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                <PlayCircle className="w-8 h-8 text-white opacity-80" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">{tutorial.title}</h3>
              <p className="text-sm text-gray-500 mt-1">时长：{tutorial.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
