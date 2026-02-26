import React from 'react';
import { LayoutDashboard, PenTool, BookOpen, Settings, GraduationCap, Sparkles } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
    isOpen: boolean;
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
    onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeView, onNavigate, onToggle }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'generator', label: 'Topic Generator', icon: Sparkles },
        { id: 'training', label: 'Training Hub', icon: GraduationCap },
        { id: 'storage', label: 'Storage', icon: BookOpen },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div
            className={`${isOpen ? 'w-64' : 'w-0 md:w-20'
                } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-full absolute md:relative z-20 shadow-xl md:shadow-none overflow-hidden`}
        >
            <div className="p-6 flex items-center justify-between">
                <div className={`flex items-center space-x-3 ${!isOpen && 'md:justify-center'}`}>
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <PenTool className="text-white h-6 w-6" />
                    </div>
                    {isOpen && <span className="font-bold text-xl text-gray-900">AutoBlog AI</span>}
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id || (item.id === 'dashboard' && (activeView === 'editor' || activeView === 'reader'));

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id as ViewState);
                                if (window.innerWidth < 768) onToggle(); // Close on mobile selection
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }
                ${!isOpen && 'md:justify-center'}
              `}
                            title={!isOpen ? item.label : ''}
                        >
                            <Icon size={20} className={`${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            {isOpen && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className={`flex items-center space-x-3 ${!isOpen && 'md:justify-center'}`}>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        JD
                    </div>
                    {isOpen && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
                            <p className="text-xs text-gray-500 truncate">Pro Plan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
