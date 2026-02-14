'use client';

import React, { useState, useEffect } from 'react';
import { BlogPost, NicheSchedule, TrainingModule, ViewState, TrainingData, ScheduledSlot, GeneratedTopic } from '@/types';
import Dashboard from '@/components/Dashboard';
import PostEditor from '@/components/PostEditor';
import Sidebar from '@/components/Sidebar';
import Settings from '@/components/Settings';
import PostReader from '@/components/PostReader';
import TrainingHub from '@/components/TrainingHub';
import TopicGenerator from '@/components/TopicGenerator';
import { Menu } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null); // For Reader
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null); // For Editor
  const [generatedTopic, setGeneratedTopic] = useState<{ topic: string, tone: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Training Data State
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [favoriteModules, setFavoriteModules] = useState<TrainingModule[]>([]);

  // Schedule State
  const [nicheSchedules, setNicheSchedules] = useState<NicheSchedule[]>([]);
  const [scheduledSlots, setScheduledSlots] = useState<ScheduledSlot[]>([]);

  // --- Initial Data Fetching ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, schedulesRes, trainingRes, slotsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/schedules'),
        fetch('/api/training_data'),
        fetch('/api/scheduled_slots')
      ]);

      if (postsRes.ok) setPosts(await postsRes.json());
      if (schedulesRes.ok) setNicheSchedules(await schedulesRes.json());
      if (trainingRes.ok) {
        const data = await trainingRes.json();
        // Separate training data from favorite modules if stored together, or just use one endpoint
        // For now assuming the endpoint returns raw training items
        setTrainingData(data);
      }
      if (slotsRes.ok) setScheduledSlots(await slotsRes.json());

      // Load favorites from local storage for now as they might be user-specific preference
      const savedFavorites = localStorage.getItem('favoriteModules');
      if (savedFavorites) {
        setFavoriteModules(JSON.parse(savedFavorites));
      }

    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  // --- Persistence Helpers ---
  const savePost = async (post: BlogPost) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      if (res.ok) {
        const savedPost = await res.json();
        setPosts(prev => {
          const exists = prev.find(p => p.id === savedPost.id);
          if (exists) return prev.map(p => p.id === savedPost.id ? savedPost : p);
          return [savedPost, ...prev];
        });
        setView('dashboard');
        setEditingPost(null);
        setGeneratedTopic(null);
      }
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== id));
      if (view === 'reader' && currentPost?.id === id) setView('dashboard');
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const updateSchedules = async (schedules: NicheSchedule[]) => {
    // We'll replace all schedules for simplicity or handle indiv updates
    // For this migration, let's assume we send the whole list or just the new one.
    // The server expects individual POSTs or a bulk endpoint.
    // Let's iterate for now to match strict REST if needed, or better:
    // The previous app stored this in local storage or a simple JSON file.
    // Our new API accepts POST to create/update.
    // Strategy: Update local state immediately, then sync.
    setNicheSchedules(schedules);
    try {
      // Sync logic would go here. For now, we'll implement a basic save for the *newest* or changed one if possible,
      // but given the array prop, we might need a bulk update endpoint or just loop.
      // Simplest for migration: Save individual items.
      // In a real app, we'd optimize this.
      for (const schedule of schedules) {
        await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedule)
        });
      }
    } catch (e) {
      console.error("Error syncing schedules", e);
    }
  };

  const updateScheduledSlots = async (slots: ScheduledSlot[]) => {
    setScheduledSlots(slots);
    try {
      for (const slot of slots) {
        await fetch('/api/scheduled_slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slot)
        });
      }
    } catch (e) {
      console.error("Error syncing slots", e);
    }
  };

  const updateTrainingData = async (data: TrainingData[]) => {
    setTrainingData(data);
    try {
      // Similar sync logic
      for (const item of data) {
        await fetch('/api/training_data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
    } catch (e) {
      console.error("Error syncing training data", e);
    }
  };

  const toggleFavoriteModule = (module: TrainingModule) => {
    setFavoriteModules(prev => {
      const exists = prev.find(m => m.id === module.id);
      const newFavorites = exists
        ? prev.filter(m => m.id !== module.id)
        : [...prev, module];
      localStorage.setItem('favoriteModules', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // --- View Handlers ---
  const handleCreateNew = () => {
    setGeneratedTopic(null);
    setEditingPost(null);
    setView('generator');
  };

  const handleTopicSelected = (topic: string, tone: string) => {
    setGeneratedTopic({ topic, tone });
    setView('editor');
  };

  const handleViewPost = (post: BlogPost) => {
    setCurrentPost(post);
    setView('reader');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setGeneratedTopic({ topic: post.title, tone: 'Neutral' }); // Tone might not be saved, default to Neutral
    setView('editor');
  };

  // Handler for editing a generated topic from Settings/Calendar
  const handleEditGeneratedTopic = (slotId: string, topic: GeneratedTopic) => {
    // Create a partial post draft from the topic
    const draftPost: Partial<BlogPost> = {
      title: topic.topic,
      content: topic.content,
      excerpt: topic.excerpt,
      keywords: topic.keywords,
      category: topic.category,
      readTime: topic.readTime,
      geoTargeting: topic.geoTargeting,
      aeoQuestions: topic.aeoQuestions,
      seoScore: topic.seoScore,
      coverImage: topic.coverImage
    };

    // We can use a special "draft" ID or just pass it as initialPost with no ID
    setEditingPost(draftPost as BlogPost);
    setGeneratedTopic({ topic: topic.topic, tone: 'Professional' });
    setView('editor');
  };

  // Compile context from training modules
  const getTrainingContext = () => {
    return trainingData.map(d => `[${d.type.toUpperCase()}] ${d.title}: ${d.content}`).join('\n\n');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        activeView={view}
        onNavigate={setView}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 relative w-full">
        {/* Mobile Header for Sidebar Toggle */}
        <div className="md:hidden p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <h1 className="font-bold text-lg text-indigo-600">AutoBlog AI</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 rounded-lg hover:bg-gray-100">
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {view === 'dashboard' && (
            <Dashboard
              posts={posts}
              onCreateNew={handleCreateNew}
              onViewPost={handleViewPost}
              onEditPost={handleEditPost}
              onDeletePost={deletePost}
            />
          )}

          {view === 'generator' && (
            <TopicGenerator
              onTopicSelect={handleTopicSelected}
              onCancel={() => setView('dashboard')}
              trainingContext={getTrainingContext()}
            />
          )}

          {view === 'editor' && (
            <PostEditor
              topic={generatedTopic?.topic || ''}
              tone={generatedTopic?.tone || ''}
              initialPost={editingPost}
              onPublish={savePost}
              onCancel={() => setView('dashboard')}
              trainingContext={getTrainingContext()}
            />
          )}

          {view === 'reader' && currentPost && (
            <PostReader
              post={currentPost}
              onBack={() => setView('dashboard')}
              onEdit={() => handleEditPost(currentPost)}
            />
          )}

          {view === 'training' && (
            <TrainingHub
              favoriteModules={favoriteModules}
              onToggleFavorite={toggleFavoriteModule}
              onTrainingDataChange={updateTrainingData}
              trainingData={trainingData}
            />
          )}

          {view === 'settings' && (
            <Settings
              nicheSchedules={nicheSchedules}
              onNicheSchedulesChange={updateSchedules}
              onBack={() => setView('dashboard')}
              scheduledSlots={scheduledSlots}
              onScheduledSlotsChange={updateScheduledSlots}
              onViewPost={(post: Partial<BlogPost>) => {
                // Cast partial to full if needed for reader, or handle partials in Reader
                // For now, let's just log or alert if it's incomplete, or use a "preview" mode
                // Actually, Settings calls this with a GeneratedTopic basically. 
                // Let's map it to a temporary post object for the reader.
                const tempPost = {
                  ...post,
                  id: 'preview',
                  dateCreated: new Date().toLocaleDateString(),
                  status: 'draft'
                } as BlogPost;
                handleViewPost(tempPost);
              }}
              onEditGeneratedPost={handleEditGeneratedTopic}
            />
          )}
        </div>
      </main>
    </div>
  );
}
