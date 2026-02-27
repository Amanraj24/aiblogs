import React, { useEffect, useState, useRef } from 'react';
import { generateFullPost, generateCoverImage, generateAndStoreCoverImage } from '@/app/actions/gemini';
import { BlogPost } from '../types';
import Button from './Button';
import { Check, Copy, RefreshCw, ArrowLeft, Tag, Clock, Calendar, Sparkles, Wand2, Image as ImageIcon, CalendarClock, Globe, HelpCircle, TrendingUp, BookOpen } from 'lucide-react';
import TiptapEditor from './TiptapEditor';
import MediaPickerModal from './MediaPickerModal';
import { getCombinedSchemaHtml } from '../lib/schemaGenerator';

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
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalTab, setMediaModalTab] = useState<'storage' | 'url'>('storage');

  // Editing state for new fields
  const [geoTargeting, setGeoTargeting] = useState(initialPost?.geoTargeting || 'Global');
  const [seoScore, setSeoScore] = useState(initialPost?.seoScore || 85);
  const [slug, setSlug] = useState(initialPost?.slug || '');

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Load from local draft if available
  useEffect(() => {
    if (initialPost) {
      setPostData(initialPost);
      setCoverImage(initialPost.coverImage || null);
      setGeoTargeting(initialPost.geoTargeting || 'Global');
      setSeoScore(initialPost.seoScore || 85);
      setSlug(initialPost.slug || slugify(initialPost.title));
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
          setSlug(draft.slug || slugify(draft.postData.title || ''));
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
        setSlug(slugify(data.title || ''));
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
        slug,
        timestamp: Date.now()
      };
      localStorage.setItem('currentDraft', JSON.stringify(draft));
    }
  }, [postData, coverImage, geoTargeting, seoScore, topic, initialPost]);

  const handleGenerateImage = async () => {
    if (!topic && !postData?.title) return;
    setIsGeneratingImage(true);
    try {
      // Use the new server action that generates AND stores the image in one secure step
      const filename = slug ? (slug.endsWith('.jpg') ? slug : `${slug}.jpg`) : undefined;
      const result = await generateAndStoreCoverImage(topic || postData?.title || "", false, filename);

      if (result.success && result.url) {
        setCoverImage(result.url);
      } else {
        throw new Error(result.error || "Failed to generate or save image");
      }
    } catch (err: any) {
      console.error("Image generation/upload error:", err);
      alert(err.message || "Failed to generate AI image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const openMediaModal = (tab: 'storage' | 'url' = 'storage') => {
    setMediaModalTab(tab);
    setIsMediaModalOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    setCoverImage(url);
    setIsMediaModalOpen(false);
  };

  const handleSavePost = () => {
    if (!postData) return;
    const isScheduled = !!scheduleDate;

    if (isScheduled && new Date(scheduleDate) <= new Date()) {
      alert("Scheduled time must be in the future.");
      return;
    }

    // Inject Schema JSON-LD into content for external systems/SEO
    // Note: getCombinedSchemaHtml is not defined in the provided context,
    // assuming it's an external utility function.
    const schemaHtml = getCombinedSchemaHtml({
      ...postData,
      title: postData.title,
      id: initialPost?.id,
      slug: slug || slugify(postData.title || ''),
      category: postData.category,
      dateCreated: initialPost?.dateCreated || new Date().toLocaleString(),
      coverImage: coverImage,
      geoTargeting: geoTargeting,
      aeoQuestions: postData.aeoQuestions || [],
      seoScore: seoScore,
      commercialIntent: postData.commercialIntent,
      isHowTo: postData.isHowTo,
      steps: postData.steps,
    } as BlogPost); // Cast to BlogPost for type safety if getCombinedSchemaHtml expects it

    const finalContent = `${postData.content || ''}\n\n${schemaHtml}`;

    const newPost: BlogPost = {
      id: initialPost?.id || Date.now().toString(),
      title: postData.title || "Untitled",
      content: finalContent,
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
      slug: slug || slugify(postData.title || 'untitled'),
      commercialIntent: postData.commercialIntent,
      isHowTo: postData.isHowTo,
      steps: postData.steps,
    };

    // Clear draft on successful publish
    if (!initialPost) {
      localStorage.removeItem('currentDraft');
    }

    onPublish(newPost);
  };

  const handleCancelAndClear = () => {
    onCancel();
  };

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
    setPostData(prev => {
      if (!prev) return null;
      // Also update slug if it was empty or matched the old title
      if (!slug || slug === slugify(prev.title || '')) {
        setSlug(slugify(title));
      }
      return { ...prev, title };
    });
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
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => openMediaModal('storage')} icon={<BookOpen size={18} />} className="bg-white/90 hover:bg-white text-gray-800">Storage</Button>
                  <Button variant="secondary" onClick={() => openMediaModal('url')} icon={<Globe size={18} />} className="bg-white/90 hover:bg-white text-gray-800">Link</Button>
                </div>
                <Button variant="primary" onClick={handleGenerateImage} isLoading={isGeneratingImage} icon={<Wand2 size={18} />} className="shadow-lg">{coverImage ? 'Regenerate AI' : 'Generate AI'}</Button>
              </div>
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

              {/* Editable Slug */}
              <div className="flex items-center gap-2 mb-6 px-1">
                <span className="text-gray-400 text-sm font-medium">URL:</span>
                <span className="text-gray-400 text-sm">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="flex-1 text-sm bg-gray-50 border-b border-dashed border-gray-300 focus:border-indigo-500 focus:outline-none py-0.5 text-indigo-600 font-medium"
                  placeholder="post-url-slug"
                />
              </div>

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
                  <div className="mt-12 pt-8 border-t border-gray-100" itemScope itemType="https://schema.org/FAQPage">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                    <div className="space-y-6">
                      {postData.aeoQuestions.map((qa, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-6" itemProp="mainEntity" itemScope itemType="https://schema.org/Question">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2" itemProp="name">{qa.question}</h4>
                          <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                            <p className="text-gray-700 leading-relaxed" itemProp="text">{qa.answer}</p>
                          </div>
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

          {/* AEO Questions Editor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center"><HelpCircle className="w-5 h-5 text-indigo-600 mr-2" />FAQs (AEO)</span>
              <button
                onClick={() => {
                  const newQuestions = [...(postData?.aeoQuestions || []), { question: '', answer: '' }];
                  setPostData(prev => prev ? { ...prev, aeoQuestions: newQuestions } : null);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Add
              </button>
            </h3>
            <div className="space-y-4">
              {postData?.aeoQuestions?.map((qa, idx) => (
                <div key={idx} className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 relative group">
                  <button
                    onClick={() => {
                      const newQuestions = postData.aeoQuestions?.filter((_, i) => i !== idx);
                      setPostData(prev => prev ? { ...prev, aeoQuestions: newQuestions } : null);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <input
                    type="text"
                    value={qa.question}
                    onChange={(e) => {
                      const newQuestions = [...(postData.aeoQuestions || [])];
                      newQuestions[idx].question = e.target.value;
                      setPostData(prev => prev ? { ...prev, aeoQuestions: newQuestions } : null);
                    }}
                    placeholder="Question"
                    className="w-full text-xs font-semibold bg-transparent border-b border-indigo-200 focus:border-indigo-500 focus:outline-none mb-2 py-1 placeholder-indigo-300"
                  />
                  <textarea
                    value={qa.answer}
                    onChange={(e) => {
                      const newQuestions = [...(postData.aeoQuestions || [])];
                      newQuestions[idx].answer = e.target.value;
                      setPostData(prev => prev ? { ...prev, aeoQuestions: newQuestions } : null);
                    }}
                    placeholder="Answer"
                    rows={2}
                    className="w-full text-xs bg-transparent focus:outline-none text-indigo-700 placeholder-indigo-300 resize-none"
                  />
                </div>
              ))}
              {(!postData?.aeoQuestions || postData.aeoQuestions.length === 0) && (
                <p className="text-xs text-gray-400 text-center italic py-2">No FAQs added. Add some for better Answer Engine Optimization.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Sparkles className="w-5 h-5 text-indigo-600 mr-2" />Meta Data</h3>
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tags</h4>
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
      <MediaPickerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
        initialTab={mediaModalTab}
      />
    </div>
  );
};

export default PostEditor;