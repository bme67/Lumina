import React, { useState, useEffect, useMemo } from 'react';
import { VideoGrid } from './components/VideoGrid';
import { Player } from './components/Player';
import { AdminPanel } from './components/AdminPanel';
import { SearchIcon, LockIcon } from './components/Icons';
import { getAllVideos, getVideoById, deleteVideo } from './services/db';
import { VideoMetadata, VideoData, ViewState, VideoCategory } from './types';

function App() {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Admin State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load Videos
  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const data = await getAllVideos();
      setVideos(data);
    } catch (e) {
      console.error("Failed to load videos", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Categorize Videos
  const categorizedVideos = useMemo(() => {
    const grouped: Record<string, VideoMetadata[]> = {
      'Botany': [],
      'Zoology': [],
      'NCERT line by line': [],
      'Other': []
    };

    videos.forEach(video => {
      // Handle legacy videos or those with missing categories
      const cat = video.category && ['Botany', 'Zoology', 'NCERT line by line'].includes(video.category) 
        ? video.category 
        : 'Other';
      
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(video);
    });

    return grouped;
  }, [videos]);

  const categoriesOrder: VideoCategory[] = ['Botany', 'Zoology', 'NCERT line by line', 'Other'];

  // Filter Videos for Search
  const filteredVideos = useMemo(() => {
    if (!searchQuery) return null; // Return null to indicate we should show categories
    const lower = searchQuery.toLowerCase();
    return videos.filter(v => v.title.toLowerCase().includes(lower));
  }, [videos, searchQuery]);

  // Handlers
  const handleVideoSelect = async (id: string) => {
    try {
      const videoData = await getVideoById(id);
      if (videoData) {
        setSelectedVideo(videoData);
        setViewState(ViewState.PLAYER);
      }
    } catch (e) {
      console.error("Error loading video details", e);
    }
  };

  const handleBackToHome = () => {
    setViewState(ViewState.HOME);
    setSelectedVideo(null);
  };

  const handleAdminAccess = () => {
    if (isAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check for demo purposes
    if (passwordInput === 'admin') {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      setIsAdminOpen(true);
      setPasswordInput('');
    } else {
      alert('Incorrect password. Try "admin"');
    }
  };

  const handleUploadSuccess = () => {
    loadVideos();
  };

  const handleDeleteVideo = async (id: string) => {
    await deleteVideo(id);
    loadVideos();
  };

  // Render
  if (viewState === ViewState.PLAYER && selectedVideo) {
    return <Player video={selectedVideo} onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-3 h-3 bg-black rounded-full"></div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">Holass</h1>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={16} className="text-gray-400 group-focus-within:text-gray-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-1.5 border-none bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 rounded-md text-sm transition-colors focus:bg-gray-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleAdminAccess}
            className={`p-2 transition-colors ${isAuthenticated ? 'text-gray-900' : 'text-gray-400 hover:text-black'}`}
            title={isAuthenticated ? "Admin Dashboard" : "Admin Login"}
          >
            <LockIcon size={16} className={isAuthenticated ? "fill-current" : ""} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mobile Search */}
        <div className="sm:hidden mb-8 relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-gray-100 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <VideoGrid videos={[]} onVideoSelect={() => {}} isLoading={true} />
        )}

        {/* Search Results */}
        {!isLoading && filteredVideos && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-6">Search Results</h2>
            <VideoGrid 
              videos={filteredVideos} 
              onVideoSelect={handleVideoSelect} 
              onDeleteVideo={isAuthenticated ? handleDeleteVideo : undefined}
            />
          </div>
        )}

        {/* Categorized View (Only if not searching) */}
        {!isLoading && !filteredVideos && (
           <div className="space-y-16">
             {categoriesOrder.map(category => {
               const categoryVideos = categorizedVideos[category];
               if (categoryVideos.length === 0) return null;

               return (
                 <section key={category}>
                   <div className="flex items-center gap-4 mb-6">
                     <h2 className="text-xl font-light tracking-tight text-gray-900">{category}</h2>
                     <div className="h-px flex-1 bg-gray-100"></div>
                   </div>
                   <VideoGrid 
                     videos={categoryVideos} 
                     onVideoSelect={handleVideoSelect} 
                     onDeleteVideo={isAuthenticated ? handleDeleteVideo : undefined}
                   />
                 </section>
               );
             })}
             
             {/* Show a message if absolutely no videos exist */}
             {videos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <p className="text-lg font-light">No videos uploaded yet.</p>
                  <p className="text-sm mt-2">Log in as admin to upload content.</p>
                </div>
             )}
           </div>
        )}
      </main>

      {/* Password Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Admin Access</h3>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:ring-black focus:border-black outline-none"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Panel Overlay */}
      {isAdminOpen && (
        <AdminPanel 
          onClose={() => setIsAdminOpen(false)} 
          onUploadSuccess={handleUploadSuccess}
          existingVideos={videos}
          onDeleteVideo={handleDeleteVideo}
        />
      )}
    </div>
  );
}

export default App;