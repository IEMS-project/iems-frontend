import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder, className = '', readOnly = false }) => {
    const editorRef = useRef(null);
    const quillRef = useRef(null);

    useEffect(() => {
        if (!editorRef.current || quillRef.current) return;

        const quill = new Quill(editorRef.current, {
            theme: 'snow',
            readOnly,
            placeholder: placeholder || '',
            modules: {
                toolbar: readOnly
                    ? false
                    : [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ color: [] }, { background: [] }],
                        ['link', 'code-block'],
                        ['clean'],
                    ],
            },
            formats: [
                'header',
                'bold',
                'italic',
                'underline',
                'strike',
                'list',
                'bullet',
                'color',
                'background',
                'link',
                'code-block',
            ],
        });

        quillRef.current = quill;

        // Set initial value
        if (value) quill.root.innerHTML = value;

        // On change
        if (!readOnly && onChange) {
            quill.on('text-change', () => {
                const html = quill.root.innerHTML;
                onChange(html === '<p><br></p>' ? '' : html);
            });
        }

    }, [])

    return (
        <div className={`rich-text-editor ${className}`}>
            <div ref={editorRef} />
            <style>{`
        .rich-text-editor :global(.ql-container) {
          font-family: inherit;
          font-size: 14px;
        }
        .rich-text-editor :global(.ql-editor) {
          min-height: 200px;
        }
        .rich-text-editor :global(.ql-editor.ql-blank::before) {
          font-style: normal;
          color: #9ca3af;
        }
        /* Dark mode styles */
        :global(.dark) .rich-text-editor :global(.ql-toolbar) {
          background-color: rgb(31 41 55);
          border-color: rgb(55 65 81);
        }
        :global(.dark) .rich-text-editor :global(.ql-container) {
          background-color: rgb(17 24 39);
          border-color: rgb(55 65 81);
          color: rgb(229 231 235);
        }
        :global(.dark) .rich-text-editor :global(.ql-editor.ql-blank::before) {
          color: rgb(107 114 128);
        }
        :global(.dark) .rich-text-editor :global(.ql-stroke) {
          stroke: rgb(156 163 175);
        }
        :global(.dark) .rich-text-editor :global(.ql-fill) {
          fill: rgb(156 163 175);
        }
        :global(.dark) .rich-text-editor :global(.ql-picker-label) {
          color: rgb(156 163 175);
        }
        :global(.dark) .rich-text-editor :global(.ql-picker-options) {
          background-color: rgb(31 41 55);
          border-color: rgb(55 65 81);
        }
        :global(.dark) .rich-text-editor :global(.ql-toolbar button:hover),
        :global(.dark) .rich-text-editor :global(.ql-toolbar button:focus),
        :global(.dark) .rich-text-editor :global(.ql-toolbar .ql-picker-label:hover),
        :global(.dark) .rich-text-editor :global(.ql-toolbar .ql-picker-item:hover) {
          color: rgb(229 231 235);
        }
        :global(.dark) .rich-text-editor :global(.ql-toolbar button:hover .ql-stroke),
        :global(.dark) .rich-text-editor :global(.ql-toolbar button:focus .ql-stroke) {
          stroke: rgb(229 231 235);
        }
        :global(.dark) .rich-text-editor :global(.ql-toolbar button:hover .ql-fill),
        :global(.dark) .rich-text-editor :global(.ql-toolbar button:focus .ql-fill) {
          fill: rgb(229 231 235);
        }
        /* Read-only mode */
        .rich-text-editor.read-only :global(.ql-editor) {
          padding: 0;
        }
      `}</style>
        </div>
    );
};

export default RichTextEditor;
