// components/StorageView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon, Search, Share2, Loader, Plus, Settings as XIcon, BookOpen as VideoIcon } from 'lucide-react';
import { listFiles, uploadFile, deleteFile, RemoteFile } from '../lib/remoteStorage';

const StorageView: React.FC = () => {
    const [files, setFiles] = useState<RemoteFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<RemoteFile | null>(null);

    const fetchFiles = async () => {
        setLoading(true);
        const data = await listFiles();
        setFiles(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const result = await uploadFile(file);
        if (result.success) {
            await fetchFiles();
        } else {
            alert(result.error || 'Upload failed');
        }
        setUploading(false);
    };

    const handleDelete = async (filename: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        const success = await deleteFile(filename);
        if (success) {
            setFiles(files.filter(f => f.filename !== filename));
            if (selectedFile?.filename === filename) setSelectedFile(null);
        } else {
            alert('Failed to delete file');
        }
    };

    const filteredFiles = files.filter(f =>
        f.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isVideo = (filename: string) => {
        return /\.(mp4|webm|mov)$/i.test(filename);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Remote Storage</h1>
                    <p className="text-sm text-gray-500">Manage your images and videos on Hostinger</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors font-medium shadow-sm">
                        {uploading ? <Loader className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {uploading ? 'Uploading...' : 'Upload Media'}
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*,video/*" />
                    </label>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="animate-spin h-8 w-8 text-indigo-600" />
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                            <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="text-gray-400 h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No media found</h3>
                            <p className="text-gray-500 mb-6">Start by uploading your first image or video</p>
                            <label className="text-indigo-600 font-medium cursor-pointer hover:underline">
                                Upload Now
                                <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
                            </label>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.filename}
                                    onClick={() => setSelectedFile(file)}
                                    className={`group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden ${selectedFile?.filename === file.filename
                                        ? 'border-indigo-600 ring-2 ring-indigo-100'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                        {isVideo(file.filename) ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <VideoIcon className="h-10 w-10 text-gray-400" />
                                                <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">VIDEO</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={file.url}
                                                alt={file.filename}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(file.filename); }}
                                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs font-medium text-gray-700 truncate" title={file.filename}>
                                            {file.filename}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.mtime * 1000).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Detail */}
                {selectedFile && (
                    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-6 animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Details</h2>
                            <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-gray-600">
                                <XIcon size={20} />
                            </button>
                        </div>

                        <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mb-6 aspect-video flex items-center justify-center">
                            {isVideo(selectedFile.filename) ? (
                                <video src={selectedFile.url} controls className="w-full h-full" />
                            ) : (
                                <img src={selectedFile.url} className="w-full h-full object-contain" />
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">File Name</label>
                                <p className="text-sm text-gray-700 break-all font-medium mt-1">{selectedFile.filename}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Public URL</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        readOnly
                                        value={selectedFile.url}
                                        className="text-[11px] bg-gray-50 border border-gray-200 rounded p-2 flex-1"
                                    />
                                    <button
                                        onClick={() => window.open(selectedFile.url, '_blank')}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                                    >
                                        <Share2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Size</label>
                                    <p className="text-sm font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Uploaded</label>
                                    <p className="text-sm font-medium">{new Date(selectedFile.mtime * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <button
                                onClick={() => handleDelete(selectedFile.filename)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-100 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
                            >
                                <Trash2 size={18} />
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StorageView;
