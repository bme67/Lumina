import React from 'react';
import { VideoMetadata } from '../types';
import { FileVideoIcon, TrashIcon } from './Icons';

interface VideoGridProps {
  videos: VideoMetadata[];
  onVideoSelect: (id: string) => void;
  isLoading?: boolean;
  onDeleteVideo?: (id: string) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ videos, onVideoSelect, isLoading, onDeleteVideo }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-video w-full rounded-sm mb-3"></div>
            <div className="h-4 bg-gray-200 w-3/4 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 w-1/4 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-light">No videos found.</p>
      </div>
    );
  }

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(new Date(ts));
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteVideo && window.confirm('Are you sure you want to delete this video?')) {
      onDeleteVideo(id);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="group cursor-pointer block relative"
          onClick={() => onVideoSelect(video.id)}
        >
          <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-sm mb-3 transition-transform duration-300 ease-out group-hover:scale-[1.01]">
            {video.thumbnailUrl ? (
              <img 
                src={video.thumbnailUrl} 
                alt={video.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-6 text-center">
                <FileVideoIcon size={24} className="mb-2 opacity-40" />
                <span className="text-[10px] uppercase tracking-widest font-medium line-clamp-2 opacity-60 leading-relaxed">
                  {video.title}
                </span>
              </div>
            )}
            
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-medium backdrop-blur-sm">
              {formatDuration(video.duration)}
            </div>
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            
            {onDeleteVideo && (
              <button
                onClick={(e) => handleDeleteClick(e, video.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 text-white/80 hover:text-white rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-95 hover:scale-105 z-10"
                title="Delete Video"
              >
                <TrashIcon size={16} />
              </button>
            )}
          </div>
          
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-black">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 font-light tracking-wide">
            {formatDate(video.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
};