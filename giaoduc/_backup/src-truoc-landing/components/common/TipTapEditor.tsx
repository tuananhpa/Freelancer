import React, { useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { uploadFile } from '../../services/api';
import { Indent } from './tiptap/IndentExtension';
import './TipTapEditor.css';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Nhập nội dung...',
  minHeight = '150px'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Indent,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadFile(file);
      editor.chain().focus().setImage({ src: res.fileUrl }).run();
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="border-2 border-gray-200 dark:border-night-border rounded-xl overflow-hidden focus-within:border-cam/50 focus-within:ring-2 focus-within:ring-cam/20 transition-all bg-white dark:bg-night-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-night-elevated border-b border-gray-200 dark:border-night-border">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive('underline') ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Underline"
        >
          <u>U</u>
        </button>
        
        <div className="w-px h-5 bg-gray-300 dark:bg-night-border mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Justify"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-night-border mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().outdent().run()}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors text-vutruNhat dark:text-night-muted"
          title="Giảm thụt lề (Shift+Tab)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5L6 10l5 5m-5-5h14" /></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().indent().run()}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors text-vutruNhat dark:text-night-muted"
          title="Thụt lề dòng đầu (Tab)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l5 5-5 5m5-5H4" /></svg>
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-night-border mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-night-border text-camDam' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-night-border mx-1"></div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-night-border transition-colors flex items-center gap-1 ${uploading ? 'opacity-50 cursor-not-allowed text-vutruNhat' : 'text-vutruNhat dark:text-night-muted'}`}
          title="Thêm hình ảnh"
        >
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          )}
        </button>
      </div>

      {/* Editor Content */}
      <div 
        className="p-3 prose prose-sm max-w-none text-vutru outline-none"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </>
  );
};

export default TipTapEditor;
