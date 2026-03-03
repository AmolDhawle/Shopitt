import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useState } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string, text: string) => void;
  maxWords?: number;
};

const RichTextEditor = ({
  value,
  onChange,
  maxWords = 1000,
}: RichTextEditorProps) => {
  const [wordCount, setWordCount] = useState(0);

  const handleChange = (
    content: string,
    delta: any,
    source: any,
    editor: any,
  ) => {
    const text = editor.getText().trim();
    const words = text.split(/\s+/).filter(Boolean).length;

    // 🔒 Hard stop if exceeds maxWords
    if (words > maxWords) {
      editor.deleteText(editor.getLength() - 2, 1);
      return;
    }

    setWordCount(words);
    onChange(content, text);
  };

  return (
    <div className="relative bg-gray-900 border border-gray-700 rounded-md">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        placeholder="Write a detailed product description here..."
        className="custom-quill"
      />

      {/* Word Counter */}
      <div className="flex justify-between text-xs px-3 py-2 border-t border-gray-700">
        <span className={wordCount < 100 ? 'text-red-400' : 'text-green-400'}>
          {wordCount} words
        </span>
        <span className="text-gray-400">Min: 100 | Max: {maxWords}</span>
      </div>

      <style>{`
    .custom-quill .ql-toolbar {
      background: #111827;
      border-color: #374151;
    }

    .custom-quill .ql-container {
      background: #1f2937;
      border-color: #374151;
      color: white;
    }

    /* Increase actual typing area */
    .custom-quill .ql-editor {
      min-height: 350px;   /* 🔥 increase usable height */
      padding: 16px;
      color: white;
    }

    /* Fix placeholder color */
    .custom-quill .ql-editor.ql-blank::before {
      color: #d1d5db !important;
      opacity: 1;
    }
  `}</style>
    </div>
  );
};

export default RichTextEditor;
