import React, { useState, useEffect, useRef } from 'react';
import { Layout, BookOpen, Settings as SettingsIcon, LogOut, PenTool, Zap, Loader, GraduationCap } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TopicGenerator from './components/TopicGenerator';
import PostEditor from './components/PostEditor';
import PostReader from './components/PostReader';
import Settings from './components/Settings';
import TrainingHub from './components/TrainingHub';
import { BlogPost, ViewState, NicheSchedule, TrainingModule } from './types';
import { generateAndPublishAutoPost } from './services/geminiService';

const initialPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI in Content Creation',
    excerpt: 'Artificial intelligence is revolutionizing how we create, consume, and distribute digital content. Here is what you need to know.',
    content: '## Introduction\nAI is changing everything...',
    keywords: ['AI', 'Content Marketing', 'Future Tech'],
    category: 'Technology',
    readTime: '5 min read',
    dateCreated: new Date().toLocaleString(),
    status: 'published',
    coverImage: 'https://picsum.photos/800/400?random=1'
  }
];

const AUTO_POST_NICHES = ['Artificial Intelligence', 'Sustainable Living', 'Digital Marketing', 'Personal Finance', 'Mental Health', 'Travel Trends', 'Future Technology'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ topic: string, tone: string } | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);
  const [nicheSchedules, setNicheSchedules] = useState<NicheSchedule[]>([]);
  const [favoriteModules, setFavoriteModules] = useState<TrainingModule[]>([]);
  const [trainingData, setTrainingData] = useState<import('./types').TrainingData[]>([]);
  const [scheduledSlots, setScheduledSlots] = useState<import('./types').ScheduledSlot[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const executedTasksRef = useRef<Set<string>>(new Set());

  // Fetch initial data from API and localStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, schedulesRes, trainingRes, slotsRes] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/schedules'),
          fetch('/api/training_data'),
          fetch('/api/scheduled_slots')
        ]);

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          console.log('📥 Loaded posts from database:', postsData.length, 'posts');
          console.log('📝 First post sample:', postsData[0]);
          setPosts(postsData.length > 0 ? postsData : initialPosts);
        } else {
          console.warn('⚠️ Failed to load posts from database, using initial posts');
          setPosts(initialPosts);
        }

        if (schedulesRes.ok) {
          const schedulesData = await schedulesRes.json();
          setNicheSchedules(schedulesData);
        } else {
          setNicheSchedules([]);
        }

        if (trainingRes.ok) {
          const trainingDataRes = await trainingRes.json();
          setTrainingData(trainingDataRes);
        } else {
          setTrainingData([]);
        }

        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();

          // Load suggestions from localStorage and merge with database slots
          const storedSuggestions = localStorage.getItem('scheduledSlotSuggestions');
          const suggestionsMap = storedSuggestions ? JSON.parse(storedSuggestions) : {};

          const mergedSlots = slotsData.map((slot: any) => ({
            ...slot,
            suggestedTopics: suggestionsMap[slot.id] || slot.suggestedTopics || []
          }));

          setScheduledSlots(mergedSlots);
        } else {
          setScheduledSlots([]);
        }

        // Restore UI state from localStorage
        const savedView = localStorage.getItem('currentView') as ViewState;
        if (savedView) setView(savedView);

        const savedSelectedTopic = localStorage.getItem('selectedTopic');
        if (savedSelectedTopic) setSelectedTopic(JSON.parse(savedSelectedTopic));

        const savedEditingPost = localStorage.getItem('editingPost');
        if (savedEditingPost) setEditingPost(JSON.parse(savedEditingPost));

        const savedViewingPost = localStorage.getItem('viewingPost');
        if (savedViewingPost) setViewingPost(JSON.parse(savedViewingPost));

      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to initial posts if database fails
        setPosts(initialPosts);
        setNicheSchedules([]);
        setTrainingData([]);
        setScheduledSlots([]);
      }
    };

    fetchData();
  }, []);

  // Persist navigation state (UI only)
  useEffect(() => {
    localStorage.setItem('currentView', view);
    if (selectedTopic) localStorage.setItem('selectedTopic', JSON.stringify(selectedTopic));
    else localStorage.removeItem('selectedTopic');

    if (editingPost) localStorage.setItem('editingPost', JSON.stringify(editingPost));
    else localStorage.removeItem('editingPost');

    if (viewingPost) localStorage.setItem('viewingPost', JSON.stringify(viewingPost));
    else localStorage.removeItem('viewingPost');
  }, [view, selectedTopic, editingPost, viewingPost]);

  // Safety redirect removed to prevent race conditions during state hydration
  // Instead, we handle missing state in the render logic below

  // Sync state helpers
  const syncPost = async (post: BlogPost) => {
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
    } catch (e) { console.error("Sync post failed", e); }
  };

  const deletePost = async (id: string) => {
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    } catch (e) { console.error("Delete post failed", e); }
  };

  const syncSchedule = async (schedule: NicheSchedule) => {
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });
    } catch (e) { console.error("Sync schedule failed", e); }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    } catch (e) { console.error("Delete schedule failed", e); }
  };

  const syncTrainingData = async (data: import('./types').TrainingData) => {
    try {
      await fetch('/api/training_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) { console.error("Sync training data failed", e); }
  };

  const deleteTrainingData = async (id: string) => {
    try {
      await fetch(`/api/training_data/${id}`, { method: 'DELETE' });
    } catch (e) { console.error("Delete training data failed", e); }
  };

  // Wrapper to sync scheduled slots to database and localStorage
  const handleScheduledSlotsChange = async (slots: import('./types').ScheduledSlot[]) => {
    setScheduledSlots(slots);

    // Save suggestions to localStorage (temporary data)
    const suggestionsMap: Record<string, any[]> = {};
    slots.forEach(slot => {
      if (slot.suggestedTopics && slot.suggestedTopics.length > 0) {
        suggestionsMap[slot.id] = slot.suggestedTopics;
      }
    });
    localStorage.setItem('scheduledSlotSuggestions', JSON.stringify(suggestionsMap));

    // Sync each slot to database
    try {
      await Promise.all(slots.map(slot =>
        fetch('/api/scheduled_slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...slot,
            suggestedTopics: JSON.stringify(slot.suggestedTopics || []),
            selectedTopic: slot.selectedTopic ? JSON.stringify(slot.selectedTopic) : null
          })
        })
      ));

      // If a slot has a selected topic that's ready, save it as a post
      for (const slot of slots) {
        if (slot.status === 'ready' && slot.selectedTopic) {
          const postData: BlogPost = {
            id: `scheduled-${slot.id}`,
            title: slot.selectedTopic.topic,
            content: slot.selectedTopic.content || '',
            excerpt: slot.selectedTopic.excerpt || '',
            keywords: slot.selectedTopic.keywords || [],
            category: slot.selectedTopic.category || 'Scheduled',
            readTime: slot.selectedTopic.readTime || '5 min read',
            dateCreated: new Date().toISOString(),
            status: 'scheduled',
            scheduledDate: `${slot.date}T${slot.time}`,
            coverImage: slot.selectedTopic.coverImage,
            geoTargeting: slot.selectedTopic.geoTargeting,
            aeoQuestions: slot.selectedTopic.aeoQuestions,
            seoScore: slot.selectedTopic.seoScore
          };
          await syncPost(postData);
        }
      }
    } catch (error) {
      console.error('Error syncing scheduled slots:', error);
    }
  };

  const syncSlot = async (slot: import('./types').ScheduledSlot) => {
    try {
      await fetch('/api/scheduled_slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slot)
      });
    } catch (e) { console.error("Sync slot failed", e); }
  };

  useEffect(() => {
    const schedulerInterval = setInterval(() => {
      const now = new Date();

      // --- Niche schedule checker ---
      for (const schedule of nicheSchedules) {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at midnight, local time

        // BUGFIX: Parse date strings as local time, not UTC.
        // `new Date('YYYY-MM-DD')` parses as UTC midnight.
        // Appending T00:00:00 makes it parse as local midnight, ensuring timezone consistency.
        const startDate = new Date(`${schedule.startDate}T00:00:00`);
        const endDate = new Date(`${schedule.endDate}T00:00:00`);

        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        // Using toDateString for the key is correct, it ensures it runs once per day per schedule.
        const runKey = `${now.toDateString()}-${schedule.id}`;

        if (today >= startDate && today <= endDate && currentTime === schedule.launchTime && !executedTasksRef.current.has(runKey)) {
          executedTasksRef.current.add(runKey);
          triggerAutoPost(schedule.niche);
          break; // Only trigger one post per minute
        }
      }

      // --- User-scheduled post checker ---
      let needsStateUpdate = false;
      const updatedPosts = posts.map(post => {
        if (post.status === 'scheduled' && post.scheduledDate && new Date(post.scheduledDate) <= now) {
          needsStateUpdate = true;
          return { ...post, status: 'published', dateCreated: now.toLocaleString(), scheduledDate: undefined } as BlogPost;
        }
        return post;
      });

      if (needsStateUpdate) {
        setPosts(updatedPosts.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()));
      }
    }, 1000);

    return () => clearInterval(schedulerInterval);
  }, [posts, isAutoGenerating, nicheSchedules]);

  // Background Topic Generation & Auto-Publishing
  useEffect(() => {
    const backgroundInterval = setInterval(async () => {
      const now = new Date();

      // 1. Topic Generation for pending slots
      // Find a slot that needs topics and doesn't have them yet
      const slotNeedingTopics = scheduledSlots.find(s => s.status === 'pending_selection' && s.suggestedTopics.length === 0);

      if (slotNeedingTopics && !isAutoGenerating) {
        console.log(`Generating topics for slot: ${slotNeedingTopics.niche} on ${slotNeedingTopics.date}`);
        // We use a "local" lock here to avoid parallel generations if possible, 
        // though isAutoGenerating mostly guards the publishing.
        // We'll just trigger it and update state.
        try {
          const count = slotNeedingTopics.suggestionCount || 5;
          const topics = await import('./services/geminiService').then(m => m.generateTopics(slotNeedingTopics.niche, trainingData.map(d => `[${d.type.toUpperCase()}] ${d.title}: ${d.content}`).join('\n\n'), count));

          setScheduledSlots(prev => {
            const newSlots = prev.map(s =>
              s.id === slotNeedingTopics.id
                ? { ...s, suggestedTopics: topics }
                : s
            ) as import('./types').ScheduledSlot[];
            const updatedSlot = newSlots.find(s => s.id === slotNeedingTopics.id);
            if (updatedSlot) syncSlot(updatedSlot);
            return newSlots;
          });
        } catch (e) {
          console.error("Background topic generation failed", e);
        }
      }

      // 2. Check for Due Slots to Publish
      const dueSlot = scheduledSlots.find(s => {
        if (s.status === 'published') return false;
        // Combine date and time to check if it's due
        const slotTime = new Date(`${s.date}T${s.time}:00`);
        return slotTime <= now;
      });

      if (dueSlot && !isAutoGenerating) {
        console.log(`Processing due slot: ${dueSlot.id} - ${dueSlot.niche}`);
        setIsAutoGenerating(true);
        try {
          // Determine topic
          let topicToUse = dueSlot.selectedTopic;
          if (!topicToUse && dueSlot.suggestedTopics.length > 0) {
            topicToUse = dueSlot.suggestedTopics[0]; // Auto-select first
          }

          // Fallback if no topics generated yet
          const topicString = topicToUse ? topicToUse.topic : dueSlot.niche;

          console.log(`Auto-publishing with topic: ${topicString}`);

          // Generate Post
          // We need to import generateFullPost dynamically or ensure it's imported
          const service = await import('./services/geminiService');

          // Reuse generateAndPublish logic effectively
          // But we need more control, so we'll call create post directly

          // 1. Generate Content
          const trainingContext = trainingData.map(d => `[${d.type.toUpperCase()}] ${d.title}: ${d.content}`).join('\n\n');
          const content = await service.generateFullPost(topicString, "Professional & Engaging", trainingContext);
          const coverImage = await service.generateCoverImage(topicString);

          const newPost: BlogPost = {
            id: Date.now().toString(),
            title: content.title || topicString,
            content: content.content || "",
            excerpt: content.excerpt || "",
            keywords: content.keywords || [],
            category: content.category || "Auto-Generated",
            readTime: content.readTime || "3 min read",
            dateCreated: new Date().toLocaleString(),
            status: 'published',
            geoTargeting: content.geoTargeting || "Global",
            aeoQuestions: content.aeoQuestions || [],
            seoScore: content.seoScore || 85,
            coverImage
          };

          const publishedPost = { ...newPost };
          setPosts(prev => [publishedPost, ...prev].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()));
          syncPost(publishedPost);

          // Mark slot as published
          setScheduledSlots(prev => {
            const newSlots = prev.map(s => s.id === dueSlot.id ? { ...s, status: 'published' as const } : s);
            const updatedSlot = newSlots.find(s => s.id === dueSlot.id);
            if (updatedSlot) syncSlot(updatedSlot);
            return newSlots;
          });

        } catch (error) {
          console.error("Failed to process due slot", error);
        } finally {
          setIsAutoGenerating(false);
        }
      }

    }, 5000); // Check every 5 seconds

    return () => clearInterval(backgroundInterval);
  }, [scheduledSlots, isAutoGenerating, trainingData]);

  const triggerAutoPost = async (niche: string) => {
    if (isAutoGenerating) return;
    setIsAutoGenerating(true);
    try {
      console.log(`Triggering Auto-Post for niche: "${niche}"`);

      // If no niche is provided (e.g. from a fallback), pick one.
      const nicheToGenerate = niche || AUTO_POST_NICHES[Math.floor(Math.random() * AUTO_POST_NICHES.length)];

      const newPost = await generateAndPublishAutoPost(nicheToGenerate);
      const postWithStatus = newPost as BlogPost;
      setPosts(prev => [postWithStatus, ...prev].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()));
      syncPost(postWithStatus);
    } catch (error) {
      console.error("Auto-post failed:", error);
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleNicheSchedulesChange = (newSchedules: NicheSchedule[]) => {
    // Sync all schedules
    newSchedules.forEach(s => syncSchedule(s));

    // Check for deletions
    const deletedIds = nicheSchedules.filter(s => !newSchedules.some(ns => ns.id === s.id)).map(s => s.id);
    deletedIds.forEach(id => deleteSchedule(id));

    setNicheSchedules(newSchedules);
    localStorage.setItem('nicheSchedules', JSON.stringify(newSchedules));
    const existingScheduleIds = new Set(scheduledSlots.map(s => s.scheduleId));
    const newSlots: import('./types').ScheduledSlot[] = [];

    newSchedules.forEach(schedule => {
      syncSchedule(schedule);
      if (!existingScheduleIds.has(schedule.id)) {
        // Generate slots for up to 7 days
        const start = new Date(schedule.startDate);
        const end = new Date(schedule.endDate);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 7);

        // Loop through dates
        for (let d = new Date(start); d <= end && d <= maxDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          // Check if a slot already exists for this schedule and date (prevent duplicates if editing)
          if (!scheduledSlots.some(s => s.scheduleId === schedule.id && s.date === dateStr)) {
            const newSlot: import('./types').ScheduledSlot = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              scheduleId: schedule.id,
              niche: schedule.niche,
              date: dateStr,
              time: schedule.launchTime,
              status: 'pending_selection',
              suggestedTopics: [],
              suggestionCount: schedule.suggestionCount
            };
            newSlots.push(newSlot);
            syncSlot(newSlot);
          }
        }
      }
    });

    if (newSlots.length > 0) {
      setScheduledSlots(prev => [...prev, ...newSlots]);
    }
  };

  const [returnView, setReturnView] = useState<ViewState>('dashboard');

  const handleToggleFavoriteModule = (module: TrainingModule) => {
    setFavoriteModules(prev => {
      const isFavorited = prev.some(fav => fav.id === module.id);
      const newFavorites = isFavorited
        ? prev.filter(fav => fav.id !== module.id)
        : [...prev, module];
      localStorage.setItem('favoriteModules', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const handleTopicSelect = (topic: string, tone: string) => {
    setSelectedTopic({ topic, tone });
    setReturnView('topic-selection');
    setView('editor');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setSelectedTopic({ topic: post.title, tone: 'Professional' });
    setReturnView('dashboard');
    setView('editor');
  };

  const handlePublish = (postData: BlogPost) => {
    if (editingSlotId) {
      // This was an edit of a scheduled slot
      setScheduledSlots(prev => {
        const newSlots = prev.map(s => s.id === editingSlotId ? { ...s, selectedTopic: { ...s.selectedTopic, ...postData } as any, status: 'ready' as const } : s);
        const updatedSlot = newSlots.find(s => s.id === editingSlotId);
        if (updatedSlot) syncSlot(updatedSlot);
        return newSlots;
      });
      setEditingSlotId(null);
      setView('settings');
    } else {
      setPosts(prev => {
        const existingIndex = prev.findIndex(p => p.id === postData.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = postData;
          syncPost(postData);
          return updated.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        }
        syncPost(postData);
        return [postData, ...prev].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
      });
      if (returnView === 'dashboard') {
        setView('dashboard');
      } else if (returnView === 'settings') {
        setView('settings');
      } else {
        setView('dashboard');
      }
    }
    setSelectedTopic(null);
    setEditingPost(null);
  };

  const handleEditGeneratedPost = (slotId: string, post: any) => {
    setEditingSlotId(slotId);
    setEditingPost({
      id: Date.now().toString(),
      title: post.topic,
      content: post.content || "",
      excerpt: post.excerpt || "",
      keywords: post.keywords || [],
      category: post.category || "Auto-Generated",
      readTime: post.readTime || "3 min read",
      dateCreated: new Date().toLocaleString(),
      status: 'scheduled',
      geoTargeting: post.geoTargeting || "Global",
      aeoQuestions: post.aeoQuestions || [],
      seoScore: post.seoScore || 85
    } as BlogPost);
    setSelectedTopic({ topic: post.topic, tone: 'Professional' });
    setReturnView('settings');
    setView('editor');
  };

  const handleViewPostSuggestion = (post: any) => {
    setViewingPost({
      id: 'preview',
      title: post.topic,
      content: post.content || "",
      excerpt: post.excerpt || "",
      keywords: post.keywords || [],
      category: post.category || "Preview",
      readTime: post.readTime || "3 min read",
      dateCreated: new Date().toLocaleString(),
      status: 'draft',
      geoTargeting: post.geoTargeting || "Global",
      aeoQuestions: post.aeoQuestions || [],
      seoScore: post.seoScore || 85
    } as BlogPost);
    setReturnView('settings');
    setView('read');
  };

  const handleCancel = () => {
    if (editingSlotId) {
      setEditingSlotId(null);
      setView('settings');
    } else {
      setView(returnView);
    }
    setSelectedTopic(null);
    setViewingPost(null);
    setEditingPost(null);
  };

  const handleViewPost = (post: BlogPost) => {
    setViewingPost(post);
    setReturnView('dashboard');
    setView('read');
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(id);
        setPosts(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error("Failed to delete post:", error);
        alert("Failed to delete post.");
      }
    }
  };

  // Combine posts and scheduled slots for the dashboard
  const allPosts = [
    ...posts,
    ...scheduledSlots
      .filter(slot => slot.status === 'pending_selection')
      .map(slot => ({
        id: `slot-${slot.id}`,
        title: slot.selectedTopic?.topic || `Scheduled: ${slot.niche}`,
        excerpt: slot.selectedTopic?.excerpt || "Upcoming auto-pilot post.",
        content: slot.selectedTopic?.content || "",
        keywords: slot.selectedTopic?.keywords || [],
        category: slot.selectedTopic?.category || "Scheduled",
        readTime: slot.selectedTopic?.readTime || "TBD",
        dateCreated: new Date().toISOString(),
        status: 'scheduled' as const,
        scheduledDate: `${slot.date}T${slot.time}`,
        coverImage: slot.selectedTopic?.coverImage,
        geoTargeting: slot.selectedTopic?.geoTargeting,
        aeoQuestions: slot.selectedTopic?.aeoQuestions,
        seoScore: slot.selectedTopic?.seoScore
      }))
  ].sort((a, b) => {
    const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : new Date(a.dateCreated).getTime();
    const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : new Date(b.dateCreated).getTime();
    return dateB - dateA;
  });

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100"><div className="flex items-center space-x-2 text-indigo-600"><PenTool className="h-8 w-8" /><span className="text-xl font-bold tracking-tight">AutoBlog AI</span></div></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setView('dashboard'); setViewingPost(null); }} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><Layout size={20} /><span>Dashboard</span></button>
          <button onClick={() => setView('topic-selection')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'topic-selection' || view === 'editor' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><BookOpen size={20} /><span>Generator</span></button>
          <button onClick={() => setView('training-hub')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'training-hub' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><GraduationCap size={20} /><span>Training Hub</span></button>
          <button onClick={() => setView('settings')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><SettingsIcon size={20} /><span>Settings</span></button>
          <div className="pt-4 mt-4 border-t border-gray-100"><div className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-amber-600 bg-amber-50"><Zap size={20} /><div className="flex flex-col"><span>Auto-Pilot On</span><span className="text-[10px] text-amber-500">{nicheSchedules.length} Schedules Active</span></div></div></div>
        </nav>
        <div className="p-4 border-t border-gray-100"><button className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"><LogOut size={20} /><span>Sign Out</span></button></div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        {isAutoGenerating && (<div className="absolute top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse"><Loader className="animate-spin" size={16} /><span className="text-sm font-medium">Auto-publishing incoming...</span></div>)}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {view === 'dashboard' && <Dashboard posts={allPosts} onCreateNew={() => setView('topic-selection')} onViewPost={handleViewPost} onEditPost={handleEditPost} onDeletePost={handleDeletePost} />}
          {view === 'read' && viewingPost && <PostReader post={viewingPost} onBack={handleCancel} onEdit={() => handleEditPost(viewingPost)} />}
          {view === 'settings' && <Settings nicheSchedules={nicheSchedules} onNicheSchedulesChange={handleNicheSchedulesChange} onBack={handleCancel} scheduledSlots={scheduledSlots} onScheduledSlotsChange={handleScheduledSlotsChange} onViewPost={handleViewPostSuggestion} onEditGeneratedPost={handleEditGeneratedPost} />}
          {view === 'topic-selection' && <TopicGenerator onTopicSelect={handleTopicSelect} onCancel={handleCancel} trainingContext={trainingData.map(d => `[${d.type.toUpperCase()}] ${d.title}: ${d.content}`).join('\n\n')} />}
          {view === 'editor' && selectedTopic && <PostEditor topic={selectedTopic.topic} tone={selectedTopic.tone} initialPost={editingPost} onPublish={handlePublish} onCancel={handleCancel} trainingContext={trainingData.map(d => `[${d.type.toUpperCase()}] ${d.title}: ${d.content}`).join('\n\n')} />}
          {view === 'training-hub' && <TrainingHub favoriteModules={favoriteModules} onToggleFavorite={handleToggleFavoriteModule} trainingData={trainingData} onTrainingDataChange={(newData) => {
            const added = newData.filter(d => !trainingData.some(od => od.id === d.id));
            const removed = trainingData.filter(d => !newData.some(nd => nd.id === d.id));
            added.forEach(syncTrainingData);
            removed.forEach(d => deleteTrainingData(d.id));
            setTrainingData(newData);
          }} />}
        </div>
      </main>
    </div>
  );
};

export default App;