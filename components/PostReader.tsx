import React from 'react';
import { BlogPost } from '../types';
import Button from './Button';
import { ArrowLeft, Calendar, Clock, Tag, User, Share2, Edit, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { aggregateSchemas } from '../lib/schemaGenerator';

interface PostReaderProps {
  post: BlogPost;
  onBack: () => void;
  onEdit: () => void;
}

const PostReader: React.FC<PostReaderProps> = ({ post, onBack, onEdit }) => {

  const schemas = aggregateSchemas(post);

  // FAQ Accordion State - specific to this component instance
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="mb-6 flex justify-between items-center">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          Back
        </Button>
        <Button onClick={onEdit} icon={<Edit size={18} />}>
          Edit Post
        </Button>
      </div>

      <article className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative w-full h-80 md:h-96">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 md:left-10 text-white">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-600/90 text-xs font-semibold mb-3">
                {post.category}
              </span>
            </div>
          </div>
        )}

        <div className="p-6 md:p-10">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">
            <div className="flex items-center">
              <User size={16} className="mr-2 text-indigo-500" />
              <span className="font-medium text-gray-700">AutoBlog AI</span>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-indigo-500" />
              <span>{post.dateCreated}</span>
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-2 text-indigo-500" />
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          <div className="text-xl text-gray-600 leading-relaxed font-light mb-8 italic border-l-4 border-indigo-500 pl-4 bg-gray-50 py-4 pr-4 rounded-r-lg">
            {post.excerpt}
          </div>

          {/* Content Body */}
          <div
            className="rich-preview text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: (() => {
                let clean = post.content;

                // Remove explicit H1 title from content if present, to avoid duplication with the page title
                // Handle both raw Markdown header and HTML header
                clean = clean.replace(/^#\s+.+\n*/, '');
                clean = clean.replace(/<h1[^>]*>.*?<\/h1>/i, '');

                // Strategy: Truncate content if a Schema.org block is detected
                const schemaMatch = clean.match(/(?:```json\s*)?\{\s*"@context"\s*:\s*"https?:\/\/schema\.org"/i);
                if (schemaMatch && schemaMatch.index !== undefined && schemaMatch.index > 100) {
                  clean = clean.substring(0, schemaMatch.index);
                }

                // Fallback cleans for fragments/JSON blocks
                return clean
                  .replace(/```json\s*\{[\s\S]*?\n\s*\}\s*```/g, "")
                  .replace(/\{[\s\S]*?"@context"\s*:\s*"https?:\/\/schema\.org"[\s\S]*?\}/g, "")
                  .replace(/\[\s*\{[\s\S]*?"@type"\s*:\s*"Question"[\s\S]*?\]/g, "")
                  .replace(/"@type"\s*:\s*"Question"[\s\S]*?\}/g, "");
              })()
            }}
          />

          {/* FAQ Section (Accordion Style) */}
          {post.aeoQuestions && post.aeoQuestions.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100" itemScope itemType="https://schema.org/FAQPage">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">
                  <HelpCircle size={24} />
                </span>
                People Also Ask
              </h3>
              <div className="space-y-4">
                {post.aeoQuestions.map((qa, idx) => (
                  <div key={idx} itemProp="mainEntity" itemScope itemType="https://schema.org/Question" className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-indigo-300">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center p-5 bg-gray-50 hover:bg-white transition-colors text-left focus:outline-none"
                    >
                      <h4 className="text-lg font-semibold text-gray-900 pr-8" itemProp="name">{qa.question}</h4>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="text-indigo-600 flex-shrink-0" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="p-5 bg-white border-t border-gray-100 transition-all duration-300 ease-in-out" itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                        <p className="text-gray-700 leading-relaxed animate-[fadeIn_0.3s_ease-out]" itemProp="text">
                          {qa.answer || (qa as any).text || (qa as any).acceptedAnswer?.text || "No answer generated for this question."}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Tags */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              <Tag size={16} className="mr-2" />
              Related Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((keyword, idx) => (
                <span key={idx} className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-default">
                  #{keyword.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button variant="secondary" icon={<Share2 size={16} />} onClick={() => alert('Link copied!')}>Share this Article</Button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default PostReader;
