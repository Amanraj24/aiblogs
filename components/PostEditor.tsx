import React, { useEffect, useState, useRef } from 'react';
import { generateFullPost, generateCoverImage } from '@/app/actions/gemini';
import { BlogPost } from '../types';
import Button from './Button';
import { Check, Copy, RefreshCw, ArrowLeft, Tag, Clock, Calendar, Sparkles, Upload, Wand2, Image as ImageIcon, CalendarClock, Globe, HelpCircle, TrendingUp } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import TiptapEditor from './TiptapEditor';

interface PostEditorProps {
  topic: string;
  tone: string;
  initialPost?: BlogPost | null;
  onPublish: (post: BlogPost) => void;
  onCancel: () => void;
  trainingContext?: string;
}

const PostEditor: React.FC<PostEditorProps> = ({ topic, tone, initialPost, onPublish, onCancel, trainingContext }) => {
  const [loading, setLoading] = useState(!initialPost);
  const [postData, setPostData] = useState<Partial<BlogPost> | null>(initialPost || null);
  const [error, setError] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(initialPost?.coverImage || null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state for new fields
  const [geoTargeting, setGeoTargeting] = useState(initialPost?.geoTargeting || 'Global');
  const [seoScore, setSeoScore] = useState(initialPost?.seoScore || 85);

  // Load from local draft if available
  useEffect(() => {
    if (initialPost) {
      setPostData(initialPost);
      setCoverImage(initialPost.coverImage || null);
      setGeoTargeting(initialPost.geoTargeting || 'Global');
      setSeoScore(initialPost.seoScore || 85);
      setLoading(false);
      return;
    }

    // Check for saved draft matching this topic
    const savedDraft = localStorage.getItem('currentDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Simple check to see if the draft is for the current topic
        if (draft.topic === topic) {
          console.log("Restoring draft for topic:", topic);
          setPostData(draft.postData);
          setCoverImage(draft.coverImage);
          setGeoTargeting(draft.geoTargeting);
          setSeoScore(draft.seoScore);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        setCoverImage(`https://picsum.photos/800/400?random=${Date.now()}`);
        const data = await generateFullPost(topic, tone, trainingContext);

        // Sanitize content to remove duplicate H1 and raw JSON-LD
        let cleanContent = data.content || "";
        // Remove H1 headers (# Title)
        cleanContent = cleanContent.replace(/^#\s+.+$/gm, "");

        // TRUNCATE STRATEGY for Schema
        // If we find the start of a Schema block, cut everything after it.
        const schemaMatch = cleanContent.match(/(?:```json\s*)?\{\s*"@context"\s*:\s*"https?:\/\/schema\.org"/i);
        if (schemaMatch && schemaMatch.index !== undefined && schemaMatch.index > 50) {
          cleanContent = cleanContent.substring(0, schemaMatch.index);
        }

        // Cleanup any remaining fragments
        cleanContent = cleanContent.replace(/```json\s*\{[\s\S]*?\n\s*\}\s*```/g, ""); // Generic JSON block removal
        cleanContent = cleanContent.replace(/\{[\s\S]*?"@context"\s*:\s*"https?:\/\/schema\.org"[\s\S]*?\}/g, "");
        cleanContent = cleanContent.replace(/"@type"\s*:\s*"Question"[\s\S]*?\}/g, "");
        cleanContent = cleanContent.replace(/\[\s*\{[\s\S]*?"@type"\s*:\s*"Question"[\s\S]*?\]/g, "");
        cleanContent = cleanContent.replace(/,\s*\{[\s\S]*?"@type"\s*:\s*"Question"[\s\S]*?\}/g, ""); // Comma started fragments

        setPostData({ ...data, content: cleanContent });
        setGeoTargeting(data.geoTargeting || 'Global');
        setSeoScore(data.seoScore || 85);
      } catch (err) {
        setError("Failed to generate content. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [topic, tone, initialPost]);

  // Save changes to draft
  useEffect(() => {
    if (postData && !initialPost) {
      const draft = {
        topic,
        postData,
        coverImage,
        geoTargeting,
        seoScore,
        timestamp: Date.now()
      };
      localStorage.setItem('currentDraft', JSON.stringify(draft));
    }
  }, [postData, coverImage, geoTargeting, seoScore, topic, initialPost]);

  const handleGenerateImage = async () => {
    if (!topic && !postData?.title) return;
    setIsGeneratingImage(true);
    try {
      const base64Image = await generateCoverImage(topic || postData?.title || "");
      setCoverImage(base64Image);
    } catch (err) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  const handleSavePost = () => {
    if (!postData) return;
    const isScheduled = !!scheduleDate;

    if (isScheduled && new Date(scheduleDate) <= new Date()) {
      alert("Scheduled time must be in the future.");
      return;
    }

    const newPost: BlogPost = {
      id: initialPost?.id || Date.now().toString(),
      title: postData.title || "Untitled",
      content: postData.content || "",
      excerpt: postData.excerpt || "",
      keywords: postData.keywords || [],
      category: postData.category || "General",
      readTime: postData.readTime || "3 min read",
      dateCreated: initialPost?.dateCreated || new Date().toLocaleString(),
      status: isScheduled ? 'scheduled' : 'published',
      coverImage: coverImage || undefined,
      scheduledDate: isScheduled ? new Date(scheduleDate).toISOString() : undefined,
      geoTargeting: geoTargeting,
      aeoQuestions: postData.aeoQuestions || [],
      seoScore: seoScore,
    };

    // Clear draft on successful publish
    if (!initialPost) {
      localStorage.removeItem('currentDraft');
    }

    onPublish(newPost);
  };

  const handleCancelAndClear = () => {
    // Optional: Clear draft on cancel? Or keep it?
    // User said "never delete previous functionality until not commanded"
    // safer to keep it or maybe prompt? For now, we'll keep it so they can come back.
    // But if they switch topics, the draft check handles it.
    onCancel();
  }

  const copyToClipboard = () => {
    if (postData?.content) {
      navigator.clipboard.writeText(postData.content);
      alert("Content copied to clipboard!");
    }
  };

  const handleContentChange = (content: string) => {
    setPostData(prev => prev ? { ...prev, content } : null);
  };

  const handleTitleChange = (title: string) => {
    setPostData(prev => prev ? { ...prev, title } : null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative"><div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-indigo-600 animate-pulse" /></div></div>
        <div className="text-center space-y-2"><h3 className="text-xl font-medium text-gray-900">Crafting your masterpiece...</h3><p className="text-gray-500 max-w-md">Our AI is researching, writing, and optimizing your article on "{topic}". This usually takes about 10-20 seconds.</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4"><RefreshCw size={32} /></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <div className="flex space-x-4"><Button variant="secondary" onClick={handleCancelAndClear}>Go Back</Button><Button onClick={() => window.location.reload()}>Try Again</Button></div>
      </div>
    );
  }

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Set minimum to 1 minute in the future
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 sticky top-0 bg-[#f8fafc]/80 z-10 py-4 border-b border-gray-200/50 backdrop-blur-sm">
        <Button variant="ghost" onClick={handleCancelAndClear} icon={<ArrowLeft size={18} />}>Back</Button>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={copyToClipboard} icon={<Copy size={18} />}>Copy Markdown</Button>
          <Button variant="secondary" onClick={() => setShowScheduler(!showScheduler)} icon={<CalendarClock size={18} />}>Schedule</Button>
          <Button onClick={handleSavePost} icon={<Check size={18} />}>
            {scheduleDate ? 'Schedule Update' : (initialPost ? 'Update Post' : 'Publish Now')}
          </Button>
        </div>
      </div>
      {showScheduler && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg animate-fade-in flex items-center gap-4">
          <label htmlFor="scheduleTime" className="font-medium text-indigo-800">Publish on:</label>
          <input
            id="scheduleTime"
            type="datetime-local"
            value={scheduleDate}
            onChange={e => setScheduleDate(e.target.value)}
            min={getMinDateTime()}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative group bg-gray-100 min-h-[16rem]">
              {coverImage ? <img src={coverImage} alt="Cover" className="w-full h-64 object-cover" /> : <div className="w-full h-64 flex items-center justify-center text-gray-400"><ImageIcon size={48} /></div>}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                <Button variant="secondary" onClick={triggerFileUpload} icon={<Upload size={18} />} className="bg-white/90 hover:bg-white">Upload</Button>
                <Button variant="primary" onClick={handleGenerateImage} isLoading={isGeneratingImage} icon={<Wand2 size={18} />} className="shadow-lg">{coverImage ? 'Regenerate AI' : 'Generate AI'}</Button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div className="p-8">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">{postData?.category}</span>
                <span className="flex items-center"><Clock size={14} className="mr-1" /> {postData?.readTime}</span>
                <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date().toLocaleDateString()}</span>
              </div>

              {/* Editable Title */}
              <input
                type="text"
                value={postData?.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight border-b-2 border-transparent focus:border-indigo-500 focus:outline-none bg-transparent"
                placeholder="Post Title"
              />

              {/* Editable Content */}
              <div className="mb-8">
                <TiptapEditor
                  value={postData?.content || ''}
                  onChange={handleContentChange}
                  placeholder="Write your masterpiece..."
                />
              </div>

              {/* Preview */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Preview</h3>
                <div
                  className="rich-preview text-gray-700"
                  dangerouslySetInnerHTML={{ __html: postData?.content || '' }}
                />

                {/* FAQ Section Preview */}
                {postData?.aeoQuestions && postData.aeoQuestions.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                    <div className="space-y-6">
                      {postData.aeoQuestions.map((qa, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{qa.question}</h4>
                          <p className="text-gray-700 leading-relaxed">{qa.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ Schema */}
                {postData?.aeoQuestions && postData.aeoQuestions.length > 0 && (
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": postData.aeoQuestions.map(q => ({
                          "@type": "Question",
                          "name": q.question,
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": q.answer
                          }
                        }))
                      })
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AEO / SEO Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><TrendingUp className="w-5 h-5 text-indigo-600 mr-2" />Optimization Score</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">SEO Score</span>
              <span className={`text-xl font-bold ${seoScore >= 80 ? 'text-green-600' : 'text-amber-500'}`}>{seoScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div className={`h-2.5 rounded-full ${seoScore >= 80 ? 'bg-green-600' : 'bg-amber-500'}`} style={{ width: `${seoScore}%` }}></div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Globe size={14} /> Geo-Targeting</label>
              <input
                type="text"
                value={geoTargeting}
                onChange={(e) => setGeoTargeting(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* AEO Questions */}
          {postData?.aeoQuestions && postData.aeoQuestions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><HelpCircle className="w-5 h-5 text-indigo-600 mr-2" />People Also Ask</h3>
              <div className="space-y-3">
                {postData.aeoQuestions.map((qa, idx) => (
                  <div key={idx} className="bg-indigo-50 p-3 rounded-lg">
                    <p className="font-medium text-indigo-900 text-sm mb-1">Q: {qa.question}</p>
                    <p className="text-indigo-700 text-xs">A: {qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Sparkles className="w-5 h-5 text-indigo-600 mr-2" />Meta Data</h3>
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Target Keywords</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {postData?.keywords?.map((keyword, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100 group">
                    <Tag size={10} className="mr-1" />
                    {keyword}
                    <button
                      onClick={() => {
                        const newKeywords = postData.keywords?.filter((_, i) => i !== idx);
                        setPostData(prev => prev ? { ...prev, keywords: newKeywords } : null);
                      }}
                      className="ml-1 text-green-500 hover:text-green-800 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add keyword"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !postData?.keywords?.includes(val)) {
                        setPostData(prev => prev ? { ...prev, keywords: [...(prev.keywords || []), val] } : null);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  className="text-xs px-2 py-1 h-auto"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !postData?.keywords?.includes(val)) {
                      setPostData(prev => prev ? { ...prev, keywords: [...(prev.keywords || []), val] } : null);
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Meta Description (Excerpt)</h4>
              <textarea
                value={postData?.excerpt}
                onChange={(e) => setPostData(prev => prev ? { ...prev, excerpt: e.target.value } : null)}
                className="w-full p-2 text-sm text-gray-600 leading-relaxed border border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;