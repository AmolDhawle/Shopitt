import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

type RichTextEditorProps = {
  value: string;
  onChange: (content: string) => void;
};

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ list: 'ordered' }, { list: 'bullet' }], // Corrected here: list includes both 'ordered' and 'bullet'
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  };

  const formats = [
    'font',
    'header',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'list',
    'indent',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image',
    'video',
  ];

  return (
    <div className="relative bg-gray-900 border border-gray-700 rounded-md">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Write a detailed product description here..."
        className="text-white"
        style={{ minHeight: '250px' }}
      />
      <style>{`
        .ql-toolbar {
          background: #111827;
          border-color: #374151;
        }
        .ql-container {
          background: #1f2937;
          border-color: #374151;
          color: white;
        }
        .ql-editor {
          min-height: 250px;
        }
        .ql-editor.ql-blank::before {
          color: #9ca3af;
        }
        .ql-picker {
          color: white;
        }
        .ql-picker-options {
          background: #374151;
        }
        .ql-stroke, .ql-fill {
          stroke: white;
          fill: white;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
