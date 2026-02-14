import React from 'react';
import { BlogPost } from '../types';
import Button from './Button';
import { Plus, Search, FileText, Calendar, Eye, Clock, ArrowRight, Edit, Trash2 } from 'lucide-react';

interface DashboardProps {
  posts: BlogPost[];
  onCreateNew: () => void;
  onViewPost: (post: BlogPost) => void;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ posts, onCreateNew, onViewPost, onEditPost, onDeletePost }) => {
  const publishedPosts = posts.filter(p => p.status === 'published');
  const lastPublished = publishedPosts.length > 0 ? publishedPosts[0] : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your AI-generated blog posts</p>
        </div>
        <Button onClick={onCreateNew} icon={<Plus size={20} />}>
          Create New Post
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={24} /></div><div><p className="text-sm text-gray-500 font-medium">Total Posts</p><h3 className="text-2xl font-bold text-gray-900">{posts.length}</h3></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4"><div className="p-3 bg-green-50 text-green-600 rounded-lg"><Eye size={24} /></div><div><p className="text-sm text-gray-500 font-medium">Total Views (Simulated)</p><h3 className="text-2xl font-bold text-gray-900">{(posts.length * 1240).toLocaleString()}</h3></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={24} /></div><div><p className="text-sm text-gray-500 font-medium">Last Published</p><h3 className="text-lg font-bold text-gray-900">{lastPublished ? new Date(lastPublished.dateCreated).toLocaleDateString() : 'N/A'}</h3></div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Articles</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search posts..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4"><FileText className="h-8 w-8 text-gray-400" /></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 max-w-sm mb-6">Your blog is empty. Start generating high-quality content with AI in seconds.</p>
            <Button variant="secondary" onClick={onCreateNew}>Start Writing</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {posts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => onViewPost(post)}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 w-full">
                    {post.coverImage && <img src={post.coverImage} alt="" className="w-24 h-24 rounded-lg object-cover hidden sm:block shadow-sm" />}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{post.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1 mb-2">{post.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {post.status === 'published' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-green-100 text-green-800 capitalize">{post.status}</span>
                        ) : post.status === 'scheduled' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 capitalize">{post.status}</span>
                        ) : null}
                        <span className="text-gray-400 flex items-center"><Clock size={12} className="mr-1" /> {post.readTime}</span>
                        {post.status === 'scheduled' && post.scheduledDate ? (
                          <span className="text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">Due: {new Date(post.scheduledDate).toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">{post.dateCreated}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4 self-center flex gap-2">
                    <Button variant="secondary" className="text-sm" onClick={(e) => { e.stopPropagation(); onEditPost(post); }} icon={<Edit size={16} />}>Edit</Button>
                    <Button variant="danger" className="text-sm" onClick={(e) => { e.stopPropagation(); onDeletePost(post.id); }} icon={<Trash2 size={16} />}>Delete</Button>
                    <Button variant="ghost" className="text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); onViewPost(post); }} icon={<ArrowRight size={16} />}>Read</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;