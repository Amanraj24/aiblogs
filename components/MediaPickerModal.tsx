// components/MediaPickerModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard as DeviceIcon, BookOpen as StorageIcon, Settings as XIcon, Sparkles as ImageIcon, PenTool as PlusIcon, GraduationCap as SearchIcon, Globe as GlobeIcon, Loader } from 'lucide-react';
import { listFiles, uploadFile, RemoteFile } from '../lib/remoteStorage';

interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    initialTab?: 'storage' | 'url';
}

const MediaPickerModal: React.FC<MediaPickerModalProps> = ({ isOpen, onClose, onSelect, initialTab = 'storage' }) => {
    const [tab, setTab] = useState<'storage' | 'url'>(initialTab);

    // Sync state when initialTab changes or modal re-opens
    useEffect(() => {
        if (isOpen) setTab(initialTab);
    }, [initialTab, isOpen]);
    const [files, setFiles] = useState<RemoteFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [urlInput, setUrlInput] = useState('');

    const fetchFiles = async () => {
        setLoading(true);
        const data = await listFiles();
        setFiles(data);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen && tab === 'storage') {
            fetchFiles();
        }
    }, [isOpen, tab]);

    if (!isOpen) return null;

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (urlInput) {
            onSelect(urlInput);
            onClose();
        }
    };

    const filteredFiles = files.filter(f =>
        f.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isVideo = (filename: string) => {
        return /\.(mp4|webm|mov)$/i.test(filename);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-900">Insert Media</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <XIcon className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <button
                        onClick={() => setTab('storage')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${tab === 'storage' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <StorageIcon size={16} />
                        Remote Storage
                    </button>
                    <button
                        onClick={() => setTab('url')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${tab === 'url' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <GlobeIcon size={16} />
                        Image Link
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
                    {tab === 'storage' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search your library..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
                                    <Loader className="animate-spin h-8 w-8 text-indigo-600" />
                                    <p className="text-sm font-medium">Accessing vault...</p>
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                                        <ImageIcon className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <h4 className="text-gray-900 font-bold">No results found</h4>
                                    <p className="text-sm text-gray-500 mt-1">Try a different search or upload a new file.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredFiles.map((file) => (
                                        <div
                                            key={file.filename}
                                            onClick={() => onSelect(file.url)}
                                            className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:border-indigo-600 hover:ring-2 hover:ring-indigo-100 transition-all shadow-sm"
                                        >
                                            <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                                                {isVideo(file.filename) ? (
                                                    <div className="text-gray-400 flex flex-col items-center gap-1">
                                                        <div className="p-3 bg-gray-100 rounded-full"><PlusIcon className="h-6 w-6" /></div>
                                                        <span className="text-[10px] uppercase font-bold tracking-tighter">Video</span>
                                                    </div>
                                                ) : (
                                                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-gray-50">
                                                <p className="text-[10px] text-gray-700 font-medium truncate">{file.filename}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'url' && (
                        <div className="max-w-xl mx-auto py-12">
                            <form onSubmit={handleUrlSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <GlobeIcon size={16} className="text-indigo-600" />
                                        External Image Link
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Paste the direct link to the image you want to insert.</p>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                                >
                                    Insert to Post
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaPickerModal;
