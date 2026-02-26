'use client';

import React, { useCallback, useEffect } from 'react';
import { marked } from 'marked';

// Auto-detects Markdown and converts to HTML so legacy posts render correctly
function parseToHtml(content: string): string {
    if (!content) return '';
    // If it looks like it already contains HTML tags, return as-is
    if (/<[a-z][\s\S]*>/i.test(content)) return content;
    // Otherwise parse as Markdown
    return marked.parse(content) as string;
}
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Placeholder } from '@tiptap/extension-placeholder';
import { createLowlight } from 'lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import python from 'highlight.js/lib/languages/python';
import { uploadFile } from '../lib/remoteStorage';
import { Loader } from 'lucide-react';
import MediaPickerModal from './MediaPickerModal';

const lowlight = createLowlight();
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('js', js);
lowlight.register('ts', ts);
lowlight.register('python', python);

interface TiptapEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

// ─── Toolbar Button ────────────────────────────────────────────────────────────
const ToolbarButton = ({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`px-2 py-1 rounded text-sm font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed
      ${active
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
    >
        {children}
    </button>
);

const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

// ─── Toolbar ───────────────────────────────────────────────────────────────────
const Toolbar = ({
    editor,
    onOpenMediaModal
}: {
    editor: Editor;
    onOpenMediaModal: (tab: 'storage' | 'url') => void;
}) => {
    if (!editor) return null;

    const setLink = useCallback(() => {
        const url = window.prompt('Enter URL:');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }, [editor]);

    const insertTable = useCallback(() => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    return (
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            {/* Heading */}
            <select
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'paragraph') editor.chain().focus().setParagraph().run();
                    else editor.chain().focus().toggleHeading({ level: parseInt(val) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                }}
                value={
                    editor.isActive('heading', { level: 1 }) ? '1' :
                        editor.isActive('heading', { level: 2 }) ? '2' :
                            editor.isActive('heading', { level: 3 }) ? '3' :
                                editor.isActive('heading', { level: 4 }) ? '4' :
                                    editor.isActive('heading', { level: 5 }) ? '5' :
                                        editor.isActive('heading', { level: 6 }) ? '6' : 'paragraph'
                }
            >
                <option value="paragraph">Paragraph</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
                <option value="4">Heading 4</option>
                <option value="5">Heading 5</option>
                <option value="6">Heading 6</option>
            </select>

            <Divider />

            {/* Basic formatting */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)"><b>B</b></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)"><em>I</em></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)"><span className="underline">U</span></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
                <span className="bg-yellow-200 px-0.5">H</span>
            </ToolbarButton>

            <Divider />

            {/* Text Color */}
            <label title="Text Color" className="flex items-center cursor-pointer">
                <span className="text-sm font-medium px-1">A</span>
                <input
                    type="color"
                    className="w-5 h-5 border-0 cursor-pointer"
                    onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                />
            </label>

            <Divider />

            {/* Alignment */}
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">⬅</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">☰</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">➡</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">≡</ToolbarButton>

            <Divider />

            {/* Lists */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">• List</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">1. List</ToolbarButton>

            <Divider />

            {/* Blockquote / Code */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">❝</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">{`<>`}</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">{`{ }`}</ToolbarButton>

            <Divider />

            {/* Link / Image / Table */}
            <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Insert Link">🔗</ToolbarButton>
            <div className="flex items-center gap-1 shadow-sm border border-gray-200 rounded-md bg-white p-0.5">
                <ToolbarButton onClick={() => onOpenMediaModal('storage')} title="Browse Remote Storage">☁️</ToolbarButton>
                <ToolbarButton onClick={() => onOpenMediaModal('url')} title="Insert Image Link">🔗 Image</ToolbarButton>
            </div>
            <ToolbarButton onClick={insertTable} title="Insert Table">⊞ Table</ToolbarButton>

            {editor.isActive('table') && (
                <>
                    <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">+Col</ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">+Row</ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">✕ Table</ToolbarButton>
                </>
            )}

            <Divider />

            {/* Undo / Redo */}
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">↩</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">↪</ToolbarButton>

            <Divider />

            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">— HR</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">✕ Format</ToolbarButton>
        </div>
    );
};

// ─── Main Editor Component ─────────────────────────────────────────────────────
const TiptapEditor: React.FC<TiptapEditorProps> = ({ value, onChange, placeholder = 'Write your masterpiece...' }) => {
    const [isMediaModalOpen, setIsMediaModalOpen] = React.useState(false);
    const [mediaModalTab, setMediaModalTab] = React.useState<'storage' | 'url'>('storage');

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            Underline,
            Link.configure({ openOnClick: false }),
            Image,
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            CodeBlockLowlight.configure({ lowlight }),
            CharacterCount,
            Placeholder.configure({ placeholder }),
        ],
        content: parseToHtml(value),
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'min-h-[400px] p-4 focus:outline-none',
            },
        },
    });

    const handleMediaSelect = useCallback((url: string) => {
        if (!editor) return;
        setIsMediaModalOpen(false);
        console.log('Inserting image into editor (delayed):', url);
        // Small delay to ensure modal closure doesn't steal focus during insertion
        setTimeout(() => {
            editor.chain().focus().setImage({ src: url }).run();
        }, 100);
    }, [editor]);

    const openMediaModal = (tab: 'storage' | 'url' = 'storage') => {
        setMediaModalTab(tab);
        setIsMediaModalOpen(true);
    };

    // Sync content when value changes from outside (e.g. AI generation)
    useEffect(() => {
        if (!editor) return;
        const html = parseToHtml(value);
        const current = editor.getHTML();
        if (html !== current) {
            editor.commands.setContent(html, { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) return null;

    const words = editor.storage.characterCount?.words?.() ?? 0;
    const chars = editor.storage.characterCount?.characters?.() ?? 0;

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
            <Toolbar
                editor={editor}
                onOpenMediaModal={openMediaModal}
            />
            <EditorContent editor={editor} />
            <div className="flex justify-end gap-4 text-xs text-gray-400 px-4 py-2 border-t border-gray-100 bg-gray-50">
                <span>{words} words</span>
                <span>{chars} characters</span>
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

export default TiptapEditor;
