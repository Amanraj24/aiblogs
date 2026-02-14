import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles, Star, Loader, ChevronRight, Plus, Trash2, Book, FileText, Lightbulb } from 'lucide-react';
import { TrainingModule, TrainingData } from '../types';
import Button from './Button';
import { generateTrainingModule } from '@/app/actions/gemini';
import TrainingModuleViewer from './TrainingModuleViewer';

interface TrainingHubProps {
  favoriteModules: TrainingModule[];
  onToggleFavorite: (module: TrainingModule) => void;
  onTrainingDataChange: (data: TrainingData[]) => void;
  trainingData: TrainingData[];
}

const predefinedTopics = [
  "Giving Constructive Feedback",
  "Leading High-Performance Teams",
  "Effective Time Management for Managers",
  "Resolving Team Conflicts",
  "Delegating Tasks Effectively",
  "Motivating and Engaging Employees"
];

const TrainingHub: React.FC<TrainingHubProps> = ({ favoriteModules, onToggleFavorite, onTrainingDataChange, trainingData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedModule, setGeneratedModule] = useState<TrainingModule | null>(null);
  const [activeTab, setActiveTab] = useState<'modules' | 'knowledge'>('modules');

  // Knowledge Base State
  const [isAddingData, setIsAddingData] = useState(false);
  const [newDataTitle, setNewDataTitle] = useState('');
  const [newDataContent, setNewDataContent] = useState('');
  const [newDataType, setNewDataType] = useState<'style' | 'knowledge' | 'example'>('knowledge');

  const handleGenerate = async (topic: string) => {
    setIsLoading(true);
    setError(null);
    setGeneratedModule(null);
    try {
      const result = await generateTrainingModule(topic);
      const fullModule: TrainingModule = {
        id: Date.now().toString(),
        topic: result.topic || topic,
        learningObjectives: result.learningObjectives || [],
        keyConcepts: result.keyConcepts || "",
        caseStudy: result.caseStudy || "",
        actionableTakeaways: result.actionableTakeaways || [],
      };
      setGeneratedModule(fullModule);
    } catch (err) {
      setError("Failed to generate training module. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrainingData = () => {
    if (!newDataTitle.trim() || !newDataContent.trim()) return;

    const newData: TrainingData = {
      id: Date.now().toString(),
      title: newDataTitle,
      content: newDataContent,
      type: newDataType,
      dateAdded: new Date().toLocaleDateString()
    };

    onTrainingDataChange([...trainingData, newData]);
    setNewDataTitle('');
    setNewDataContent('');
    setIsAddingData(false);
  };

  const handleDeleteTrainingData = (id: string) => {
    onTrainingDataChange(trainingData.filter(d => d.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
        <h3 className="text-xl font-medium text-gray-900">Building your training module...</h3>
        <p className="text-gray-500">This can take up to 20 seconds.</p>
      </div>
    );
  }

  if (generatedModule) {
    const isFavorited = favoriteModules.some(m => m.id === generatedModule.id);
    return (
      <TrainingModuleViewer
        module={generatedModule}
        isFavorited={isFavorited}
        onToggleFavorite={onToggleFavorite}
        onBack={() => setGeneratedModule(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <GraduationCap className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Managerial Training Hub</h1>
        <p className="text-gray-500 mt-2">Generate training modules or build your AI's knowledge base.</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('modules')}
          className={`pb-4 px-4 font-medium transition-colors border-b-2 ${activeTab === 'modules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Training Modules
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`pb-4 px-4 font-medium transition-colors border-b-2 ${activeTab === 'knowledge' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          AI Knowledge Base
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-center">
          {error}
        </div>
      )}

      {activeTab === 'modules' ? (
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Sparkles size={20} className="text-indigo-500 mr-2" />
              Select a Topic to Get Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedTopics.map(topic => (
                <button key={topic} onClick={() => handleGenerate(topic)} className="text-left p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg transition-all group">
                  <h3 className="font-medium text-gray-800 group-hover:text-indigo-700">{topic}</h3>
                </button>
              ))}
            </div>
          </div>

          {favoriteModules.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Star size={20} className="text-amber-500 mr-2" />
                Your Favorited Modules
              </h2>
              {favoriteModules.map(module => (
                <div key={module.id} className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div>
                    <h3 className="font-medium text-gray-800">{module.topic}</h3>
                    <p className="text-sm text-gray-500">{module.learningObjectives.length} objectives</p>
                  </div>
                  <Button variant="ghost" onClick={() => setGeneratedModule(module)}>View <ChevronRight size={16} className="ml-1" /></Button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Knowledge Base Section */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Teach the AI</h2>
            {!isAddingData && <Button onClick={() => setIsAddingData(true)} icon={<Plus size={16} />}>Add Knowledge</Button>}
          </div>

          {isAddingData && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Add New Training Data</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newDataTitle}
                    onChange={e => setNewDataTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Brand Voice Guidelines"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <div className="flex space-x-4">
                    {(['style', 'knowledge', 'example'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setNewDataType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${newDataType === type ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newDataContent}
                    onChange={e => setNewDataContent(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter the rules, facts, or examples you want the AI to learn..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="ghost" onClick={() => setIsAddingData(false)}>Cancel</Button>
                  <Button onClick={handleAddTrainingData}>Save Knowledge</Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {trainingData.length === 0 && !isAddingData ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Book className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-gray-500 font-medium">No training data yet</h3>
                <p className="text-gray-400 text-sm">Add style guides or facts to customize your AI.</p>
              </div>
            ) : (
              trainingData.map(data => (
                <div key={data.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide
                                        ${data.type === 'style' ? 'bg-purple-50 text-purple-700' :
                          data.type === 'knowledge' ? 'bg-blue-50 text-blue-700' :
                            'bg-green-50 text-green-700'}`}
                      >
                        {data.type}
                      </span>
                      <h3 className="font-semibold text-gray-900">{data.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">{data.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTrainingData(data.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingHub;