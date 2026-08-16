// src/components/editor/TiptapEditor.jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, useState } from 'react';
import api from '@lib/axios';
import toast from 'react-hot-toast';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minimize,
  Maximize,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/api/blog/upload-image/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const imageUrl = response.data.url;
        editor.chain().focus().setImage({ src: imageUrl }).run();
        toast.success('تصویر با موفقیت آپلود شد');
      } catch (error) {
        console.error('خطا در آپلود:', error);
        toast.error('خطا در آپلود تصویر');
      }
    };

    input.click();
  };

  const addLink = () => {
    const url = window.prompt('لینک را وارد کنید:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addCodeBlock = () => {
    editor.chain().focus().setCodeBlock().run();
  };

  return (
    <div className="tiptap-menu-bar">
      <div className="menu-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="پررنگ"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="کج"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          title="زیرخط"
        >
          <UnderlineIcon size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title="خط خورده"
        >
          <Strikethrough size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'is-active' : ''}
          title="هایلایت"
        >
          <Highlighter size={18} />
        </button>
      </div>

      <div className="menu-divider" />

      <div className="menu-group">
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? 'is-active' : ''}
          title="پاراگراف"
        >
          <span className="font-bold text-sm">P</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="عنوان ۱"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="عنوان ۲"
        >
          <Heading2 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          title="عنوان ۳"
        >
          <Heading3 size={18} />
        </button>
      </div>

      <div className="menu-divider" />

      <div className="menu-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="لیست گلوله‌ای"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="لیست شماره‌دار"
        >
          <ListOrdered size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
          title="چپ‌چین"
        >
          <AlignLeft size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
          title="وسط‌چین"
        >
          <AlignCenter size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
          title="راست‌چین"
        >
          <AlignRight size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
          title="هم‌تراز"
        >
          <AlignJustify size={18} />
        </button>
      </div>

      <div className="menu-divider" />

      <div className="menu-group">
        <button onClick={addImage} title="افزودن تصویر">
          <ImageIcon size={18} />
        </button>
        <button
          onClick={addLink}
          className={editor.isActive('link') ? 'is-active' : ''}
          title="افزودن لینک"
        >
          <LinkIcon size={18} />
        </button>
        <button
          onClick={addCodeBlock}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          title="بلوک کد"
        >
          <Code size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="نقل قول"
        >
          <Quote size={18} />
        </button>
      </div>

      <div className="menu-divider" />

      <div className="menu-group">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="بازگشت"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="جلو"
        >
          <Redo size={18} />
        </button>
      </div>
    </div>
  );
};

export default function TiptapEditor({
  content = '',
  onChange = () => {},
  readOnly = false,
  placeholder = 'محتوای مقاله را بنویسید...',
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: true,
      }),
      Image.configure({ HTMLAttributes: { class: 'tiptap-image' } }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'tiptap-link' },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      // ✅ CharacterCount با تنظیمات صحیح
      CharacterCount.configure({
        limit: 10000,
      }),
    ],
    content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        dir: 'rtl',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      
      // ✅ محاسبه دستی تعداد کاراکترها و کلمات
      const cleanText = text.replace(/\s/g, '');
      const chars = cleanText.length;
      const words = text.split(/\s+/).filter(Boolean).length;
      
      setCharacterCount(chars);
      setWordCount(words);
      
      onChange({ html, text, characterCount: chars, wordCount: words });
    },
  });

  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content);
        // ✅ بروزرسانی شمارش پس از تنظیم محتوا
        setTimeout(() => {
          const text = editor.getText();
          const cleanText = text.replace(/\s/g, '');
          setCharacterCount(cleanText.length);
          setWordCount(text.split(/\s+/).filter(Boolean).length);
        }, 100);
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  const maxCharacters = 10000;

  return (
    <div className={`tiptap-editor-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      {!readOnly && <MenuBar editor={editor} />}
      <div className="tiptap-editor-area">
        <EditorContent editor={editor} />
      </div>
      {!readOnly && (
        <div className="tiptap-footer">
          <div className="footer-info">
            <span className={characterCount > 9000 ? 'text-yellow-600' : ''}>
              {characterCount.toLocaleString('fa-IR')} / {maxCharacters.toLocaleString('fa-IR')} کاراکتر
            </span>
            <span>
              {wordCount.toLocaleString('fa-IR')} کلمه
            </span>
          </div>
          <div className="footer-actions">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}