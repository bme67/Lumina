import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { UploadIcon, CloseIcon, TrashIcon } from './Icons';
import { generateCleanTitle } from '../services/gemini';
import { saveVideo } from '../services/db';
import { VideoMetadata, VideoCategory } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AdminPanelProps {
  onClose: () => void;
  onUploadSuccess: () => void;
  existingVideos: VideoMetadata[];
  onDeleteVideo: (id: string) => void;
}

const CATEGORIES: VideoCategory[] = ['Botany', 'Zoology', 'NCERT line by line', 'Other'];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onUploadSuccess, existingVideos, onDeleteVideo }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VideoCategory>('Botany');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      
      // Auto-generate title using Gemini
      setIsProcessing(true);
      try {
        const cleanTitle = await generateCleanTitle(selectedFile.name);
        setTitle(cleanTitle);
      } catch (err) {
        console.error(err);
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const generateThumbnail = (file: File): Promise<{ url: string, duration: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        URL.revokeObjectURL(video.src);
        video.remove();
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Thumbnail generation timed out"));
      }, 10000);

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2); // Seek to 1s or middle if shorter
      };

      video.onseeked = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const url = canvas.toDataURL('image/jpeg', 0.7);
                clearTimeout(timeout);
                cleanup();
                resolve({ url, duration: video.duration });
            } else {
                throw new Error("Canvas context failed");
            }
        } catch (e) {
            clearTimeout(timeout);
            cleanup();
            reject(e);
        }
      };
      
      video.onerror = (e) => {
        clearTimeout(timeout);
        cleanup();
        reject(new Error("Video load error"));
      };
    });
  };

  const handleUpload = async () => {
    if (!file || !title) return;

    setIsProcessing(true);
    setError(null);

    try {
      let thumbnailUrl = '';
      let duration = 0;

      try {
        const result = await generateThumbnail(file);
        thumbnailUrl = result.url;
        duration = result.duration;
      } catch (thumbErr) {
        console.warn("Thumbnail generation failed, proceeding with default placeholder.", thumbErr);
        // If thumbnail fails, we try to create a video element just to get duration if possible, 
        // otherwise default to 0.
      }
      
      const videoData = {
        id: uuidv4(),
        title: title.trim(),
        category,
        blob: file,
        thumbnailUrl,
        createdAt: Date.now(),
        duration
      };

      await saveVideo(videoData);
      
      // Reset form but keep category for easier bulk upload
      setFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      onUploadSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Failed to save video. It might be too large for browser storage.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
        await onDeleteVideo(id);
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-light text-gray-900 tracking-tight">Admin Dashboard</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <CloseIcon size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Upload Section */}
        <div className="mb-16">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-6">Upload New Video</h3>
          
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors hover:bg-gray-100 hover:border-gray-400">
            {!file ? (
              <div 
                className="cursor-pointer py-8" 
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 font-medium">Click to select video</p>
                <p className="text-xs text-gray-400 mt-2">MP4, MOV, AVI, MKV supported</p>
              </div>
            ) : (
              <div className="text-left w-full max-w-md mx-auto">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">{file.name}</span>
                    <button onClick={() => { setFile(null); setTitle(''); }} className="text-xs text-red-500 hover:underline">Remove</button>
                 </div>
                 
                 <label className="block text-sm font-medium text-gray-700 mb-2">Video Title</label>
                 <div className="mb-4">
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                        placeholder="Enter title"
                    />
                     <p className="text-xs text-gray-400 mt-1 italic">
                        {process.env.API_KEY ? "✨ Title suggested by AI" : "Enter a clean title"}
                     </p>
                 </div>

                 <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                 <div className="mb-4">
                     <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value as VideoCategory)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border bg-white"
                     >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                     </select>
                 </div>

                 <div className="mt-6 flex justify-end">
                    <Button onClick={handleUpload} isLoading={isProcessing} disabled={!title}>
                        Upload Video
                    </Button>
                 </div>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="video/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        {/* Management Section */}
        <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-6">Manage Videos</h3>
            <div className="divide-y divide-gray-100">
                {existingVideos.map(v => (
                    <div key={v.id} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-9 bg-gray-100 rounded overflow-hidden relative">
                                {v.thumbnailUrl ? (
                                    <img src={v.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <span className="text-[8px] text-gray-500">No Img</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-1 max-w-[200px]">{v.title}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 border border-gray-200 px-1 rounded bg-gray-50">{v.category || 'Other'}</span>
                                    <p className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(v.id)}
                            className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <TrashIcon size={18} />
                        </button>
                    </div>
                ))}
                {existingVideos.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No videos uploaded yet.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};