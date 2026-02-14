import React, { useState } from 'react';
import { Sparkles, ArrowRight, Target } from 'lucide-react';
import { generateTopics } from '../services/geminiService';
import { GeneratedTopic } from '../types';
import Button from './Button';

interface TopicGeneratorProps {
  onTopicSelect: (topic: string, tone: string) => void;
  onCancel: () => void;
  trainingContext?: string;
}

const TopicGenerator: React.FC<TopicGeneratorProps> = ({ onTopicSelect, onCancel, trainingContext }) => {
  const [niche, setNiche] = useState('');
  const [tone, setTone] = useState('Professional & Informative');
  const [suggestionCount, setSuggestionCount] = useState(3);
  const [customTopic, setCustomTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<GeneratedTopic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const results = await generateTopics(niche, trainingContext, suggestionCount);
      setTopics(results);
    } catch (err) {
      setError("Failed to find topics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const tones = [
    "Professional & Informative",
    "Casual & Friendly",
    "Humorous & Witty",
    "Persuasive & Sales-oriented",
    "Technical & Detailed",
    "Inspirational & Uplifting"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">What do you want to write about?</h2>
        <p className="text-gray-500">Enter a niche or subject, and our AI will suggest viral-worthy topics.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niche / Industry
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Sustainable Gardening, SaaS Marketing, Keto Diet"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestions
                </label>
                <select
                  value={suggestionCount}
                  onChange={(e) => setSuggestionCount(parseInt(e.target.value))}
                  className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value={3}>3 Ideas</option>
                  <option value={5}>5 Ideas</option>
                  <option value={10}>10 Ideas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {tones.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={isLoading}
              icon={<Sparkles size={18} />}
              className="w-full md:w-auto"
            >
              Generate Ideas
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or enter your own topic
          </label>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Enter your custom topic title here..."
            />
            <Button
              variant="secondary"
              onClick={() => customTopic.trim() && onTopicSelect(customTopic, tone)}
              disabled={!customTopic.trim()}
              className="whitespace-nowrap"
            >
              Use Custom Topic
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 text-center">
          {error}
        </div>
      )}

      {topics.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Topics</h3>
          <div className="grid grid-cols-1 gap-4">
            {topics.map((item, index) => (
              <div
                key={index}
                className="group relative bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                onClick={() => onTopicSelect(item.topic, tone)}
              >
                <div className="flex-1 pr-4">
                  <h4 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                    {item.topic}
                  </h4>
                  <p className="text-sm text-gray-500">{item.relevance}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center p-2 rounded-full bg-gray-50 group-hover:bg-indigo-50 transition-colors text-gray-400 group-hover:text-indigo-600">
                    <ArrowRight size={20} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={onCancel}>Back to Dashboard</Button>
      </div>
    </div>
  );
};

export default TopicGenerator;