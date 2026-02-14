import React, { useState } from 'react';
import { Clock, Plus, Trash2, ArrowLeft, Target, Calendar, CheckCircle, Loader, Lock, Book, Edit } from 'lucide-react';
import Button from './Button';
import { NicheSchedule, ScheduledSlot, GeneratedTopic } from '../types';

interface SettingsProps {
  nicheSchedules: NicheSchedule[];
  onNicheSchedulesChange: (schedules: NicheSchedule[]) => void;
  onBack: () => void;
  scheduledSlots: ScheduledSlot[];
  onScheduledSlotsChange: (slots: ScheduledSlot[]) => void;
  onViewPost: (post: Partial<import('../types').BlogPost>) => void;
  onEditGeneratedPost: (slotId: string, post: GeneratedTopic) => void;
}

const Settings: React.FC<SettingsProps> = ({
  nicheSchedules, onNicheSchedulesChange, onBack, scheduledSlots, onScheduledSlotsChange, onViewPost, onEditGeneratedPost
}) => {
  const [newNiche, setNewNiche] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [launchTime, setLaunchTime] = useState('');
  const [suggestionCount, setSuggestionCount] = useState(5);

  const handleAddNicheSchedule = () => {
    if (!newNiche || !startDate || !endDate || !launchTime || new Date(startDate) > new Date(endDate)) {
      alert("Please enter a valid niche, date range, and launch time.");
      return;
    }
    const newSchedule: NicheSchedule = { id: Date.now().toString(), niche: newNiche, startDate, endDate, launchTime, suggestionCount };
    onNicheSchedulesChange([...nicheSchedules, newSchedule]);
    setNewNiche('');
    setEndDate('');
    setLaunchTime('');
    setSuggestionCount(5);
  };

  const handleRemoveNicheSchedule = (id: string) => {
    onNicheSchedulesChange(nicheSchedules.filter(s => s.id !== id));
    // Optional: Remove associated future slots? For now, we keep them or let App handle cleanup if we wanted to be strict.
  };

  const handleSelectTopic = (slotId: string, topic: GeneratedTopic) => {
    onScheduledSlotsChange(scheduledSlots.map(s =>
      s.id === slotId ? { ...s, selectedTopic: topic, status: 'ready' } : s
    ));
  };

  const handleUnlockSlot = (slotId: string) => {
    onScheduledSlotsChange(scheduledSlots.map(s =>
      s.id === slotId ? { ...s, status: 'pending_selection', selectedTopic: undefined } : s
    ));
  };

  const setDatePreset = (preset: 'week' | 'month' | 'quarter') => {
    const start = new Date();
    const end = new Date();
    if (preset === 'week') end.setDate(start.getDate() + 7);
    if (preset === 'month') end.setMonth(start.getMonth() + 1);
    if (preset === 'quarter') end.setMonth(start.getMonth() + 3);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });

  // Filter slots to show only future/pending ones
  const upcomingSlots = scheduledSlots.filter(s => s.status !== 'published').sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your AutoBlog AI preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Content Strategy & Schedule</h2>
        <p className="text-sm text-gray-500 mb-6">Schedule niches for the Auto-Pilot to write about. Each entry defines a topic, a date range, and a specific time of day for publishing.</p>
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <input type="text" placeholder="Enter Niche (e.g., Personal Finance)" value={newNiche} onChange={e => setNewNiche(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          <div className="flex flex-col sm:flex-row gap-4">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" aria-label="Start date" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="w-full px-3 py-2 border border-gray-300 rounded-lg" aria-label="End date" />
            <input type="time" value={launchTime} onChange={e => setLaunchTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" aria-label="Launch time" />
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Suggestions per post:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={suggestionCount}
              onChange={e => setSuggestionCount(parseInt(e.target.value) || 5)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-sm"><Button variant="ghost" onClick={() => setDatePreset('week')}>This Week</Button><Button variant="ghost" onClick={() => setDatePreset('month')}>Next Month</Button><Button variant="ghost" onClick={() => setDatePreset('quarter')}>Next Quarter</Button></div>
          <Button onClick={handleAddNicheSchedule} icon={<Plus size={18} />} className="w-full">Add to Schedule</Button>
        </div>
        <div className="space-y-3 mt-6">
          {nicheSchedules.length > 0 ? nicheSchedules.map(s => (
            <div key={s.id} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center font-medium text-gray-700">
                <Target size={16} className="mr-3 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{s.niche}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-3 text-gray-400 flex-shrink-0" />
                <span>{formatDate(s.startDate)} - {formatDate(s.endDate)}</span>
              </div>
              <div className="text-sm text-gray-600">
                @{s.launchTime} • {s.suggestionCount || 5} Ideas
              </div>
              <div className="flex justify-end">
                <button onClick={() => handleRemoveNicheSchedule(s.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full transition-colors" aria-label={`Remove schedule for ${s.niche}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )) : <div className="text-center py-6 text-gray-500">No content scheduled.</div>}
        </div>
      </div>

      {/* Content Calendar Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Calendar className="text-indigo-600 mr-2" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Content Calendar & Approvals</h2>
            <p className="text-sm text-gray-500">Review and approve topics for upcoming scheduled posts. If no topic is selected, one will be chosen automatically.</p>
          </div>
        </div>

        <div className="space-y-6">
          {upcomingSlots.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No upcoming slots scheduled.</p>
            </div>
          ) : (
            upcomingSlots.map(slot => (
              <div key={slot.id} className={`border rounded-xl overflow-hidden ${slot.status === 'ready' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-900">{formatDate(slot.date)}</span>
                    <span className="text-sm text-gray-500">@ {slot.time}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">{slot.niche}</span>
                  </div>
                  <div className="flex items-center">
                    {slot.status === 'ready' ? (
                      <span className="flex items-center text-green-700 text-sm font-medium">
                        <CheckCircle size={16} className="mr-1" /> Ready to Publish
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-600 text-sm font-medium">
                        <Clock size={16} className="mr-1" /> Pending Approval
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  {slot.status === 'ready' && slot.selectedTopic ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{slot.selectedTopic.topic}</h4>
                        <p className="text-gray-600 text-sm">{slot.selectedTopic.relevance}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onViewPost(slot.selectedTopic as any)} icon={<Book size={16} />}>View</Button>
                        <Button variant="ghost" onClick={() => onEditGeneratedPost(slot.id, slot.selectedTopic!)} icon={<Edit size={16} />}>Edit</Button>
                        <Button variant="ghost" onClick={() => handleUnlockSlot(slot.id)} icon={<Lock size={16} />}>Change</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Suggested Topics (Select one to lock)</h4>
                      {slot.suggestedTopics.length === 0 ? (
                        <div className="flex items-center text-gray-500 text-sm py-4">
                          <Loader className="animate-spin mr-2" size={16} />
                          AI is brainstorming topics...
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {slot.suggestedTopics.map((topic, idx) => (
                            <div key={idx} className="flex items-center gap-3 group">
                              {topic.coverImage && (
                                <img
                                  src={topic.coverImage}
                                  alt={topic.topic}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                />
                              )}
                              <button
                                onClick={() => handleSelectTopic(slot.id, topic)}
                                className="flex-1 text-left p-3 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg transition-all"
                              >
                                <div className="font-medium text-gray-900 group-hover:text-indigo-700">{topic.topic}</div>
                                <div className="text-xs text-gray-500 mt-1">{topic.relevance}</div>
                              </button>
                              <Button variant="ghost" onClick={() => onViewPost(topic as any)} icon={<Book size={16} />}>View Post</Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const customTopic = window.prompt("Enter your custom topic:");
                            if (customTopic && customTopic.trim()) {
                              handleSelectTopic(slot.id, {
                                topic: customTopic,
                                relevance: "User Custom Topic",
                                content: "",
                                excerpt: "",
                                keywords: [],
                                category: "Custom",
                                readTime: "3 min read",
                                geoTargeting: "Global",
                                aeoQuestions: [],
                                seoScore: 80
                              });
                            }
                          }}
                          icon={<Plus size={14} />}
                        >
                          Add Custom Topic
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 text-center"><Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>Back to Dashboard</Button></div>
    </div>
  );
};

export default Settings;