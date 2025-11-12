import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, List, ListOrdered, Undo, Redo } from 'lucide-react';

// --- Thanh Công Cụ (Toolbar) ---
const Toolbar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-t-md p-2 flex flex-wrap gap-1">
      <Button type="button" size="sm" variant={editor.isActive('bold') ? 'default' : 'ghost'} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="w-4 h-4" />
      </Button>
      <Button type="button" size="sm" variant={editor.isActive('italic') ? 'default' : 'ghost'} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="w-4 h-4" />
      </Button>
      <Button type="button" size="sm" variant={editor.isActive('strike') ? 'default' : 'ghost'} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="w-4 h-4" />
      </Button>
      <Button type="button" size="sm" variant={editor.isActive('bulletList') ? 'default' : 'ghost'} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="w-4 h-4" />
      </Button>
      <Button type="button" size="sm" variant={editor.isActive('orderedList') ? 'default' : 'ghost'} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="w-4 h-4" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo className="w-4 h-4" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
};

// --- Component Editor Chính ---
const TiptapEditor = ({ content, onChange, error }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Tắt các chức năng không cần thiết nếu muốn
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: content, // Nội dung ban đầu
    editorProps: {
      attributes: {
        // Class CSS cho vùng nhập liệu
        class: `prose max-w-none w-full min-h-[250px] p-4 border border-t-0 border-gray-300 rounded-b-md focus:outline-none ${error ? 'border-red-500' : 'border-gray-300'}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML()); // Cập nhật state (React Hook Form) bằng HTML
    },
  });

  return (
    <div className="flex flex-col">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;