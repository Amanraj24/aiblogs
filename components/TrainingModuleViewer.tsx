import React from 'react';
import { TrainingModule } from '../types';
import Button from './Button';
import { ArrowLeft, Star, Target, BrainCircuit, CaseUpper, CheckCircle } from 'lucide-react';

interface TrainingModuleViewerProps {
  module: TrainingModule;
  isFavorited: boolean;
  onToggleFavorite: (module: TrainingModule) => void;
  onBack: () => void;
}

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      {icon}
      {title}
    </h3>
    <div className="prose prose-sm max-w-none text-gray-600">
      {children}
    </div>
  </div>
);

const TrainingModuleViewer: React.FC<TrainingModuleViewerProps> = ({ module, isFavorited, onToggleFavorite, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          Back to Hub
        </Button>
        <Button 
            variant={isFavorited ? "secondary" : "ghost"}
            onClick={() => onToggleFavorite(module)}
            icon={<Star size={18} className={isFavorited ? 'text-amber-500 fill-current' : 'text-gray-500'} />}
        >
          {isFavorited ? 'Favorited' : 'Add to Favorites'}
        </Button>
      </div>
      
      <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">{module.topic}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SectionCard icon={<Target size={20} className="text-green-500 mr-3" />} title="Learning Objectives">
          <ul className="list-disc pl-5 space-y-2">
            {module.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
          </ul>
        </SectionCard>

        <SectionCard icon={<BrainCircuit size={20} className="text-indigo-500 mr-3" />} title="Key Concepts">
          <p>{module.keyConcepts}</p>
        </SectionCard>
        
        <SectionCard icon={<CaseUpper size={20} className="text-sky-500 mr-3" />} title="Case Study">
          <p className="whitespace-pre-wrap">{module.caseStudy}</p>
        </SectionCard>
        
        <SectionCard icon={<CheckCircle size={20} className="text-purple-500 mr-3" />} title="Actionable Takeaways">
           <ul className="list-disc pl-5 space-y-2">
            {module.actionableTakeaways.map((takeaway, i) => <li key={i}>{takeaway}</li>)}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
};

export default TrainingModuleViewer;