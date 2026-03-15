import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block"],
  ["link"],
  ["clean"],
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Add a description...",
  readOnly = false,
  className = "",
}) {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (!wrapperRef.current) return;

    // Quill (snow theme) inserts the toolbar as a SIBLING of the container,
    // so both elements share the same parent. We use an intermediate `wrapper`
    // div so that toolbar + container are children of `wrapper`, not of
    // `wrapperRef` directly. On cleanup we remove `wrapper` to take both away.
    const wrapper = document.createElement("div");
    wrapperRef.current.appendChild(wrapper);

    const host = document.createElement("div");
    wrapper.appendChild(host);

    const quill = new Quill(host, {
      theme: "snow",
      placeholder,
      readOnly,
      modules: { toolbar: readOnly ? false : TOOLBAR },
    });

    quill.root.innerHTML = value || "";
    quillRef.current = quill;

    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      isInternalChange.current = true;
      onChange?.(html === "<p><br></p>" ? "" : html);
    });

    return () => {
      quill.off("text-change");
      quillRef.current = null;
      // Remove directly — wrapperRef.current may be null in Strict Mode cleanup
      wrapper.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value → Quill (skip when change came from Quill itself)
  useEffect(() => {
    if (!quillRef.current) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    quillRef.current.root.innerHTML = value || "";
  }, [value]);

  useEffect(() => {
    quillRef.current?.enable(!readOnly);
  }, [readOnly]);

  return (
    <>
      <div ref={wrapperRef} className={`rte-root ${className}`} />
      <style>{`
        .rte-root .ql-toolbar.ql-snow {
          border: 1px solid hsl(var(--border));
          border-radius: 6px 6px 0 0;
          background: hsl(var(--muted) / 0.5);
          padding: 5px 8px;
          font-family: inherit;
        }
        .rte-root .ql-container.ql-snow {
          border: 1px solid hsl(var(--border));
          border-top: none;
          border-radius: 0 0 6px 6px;
          font-family: inherit;
          font-size: 0.875rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .rte-root .ql-editor {
          min-height: 120px;
          padding: 10px 12px;
          line-height: 1.65;
          color: hsl(var(--foreground));
        }
        .rte-root .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: italic;
          left: 12px;
          right: 12px;
        }
        .rte-root .ql-toolbar .ql-stroke {
          stroke: hsl(var(--muted-foreground));
        }
        .rte-root .ql-toolbar .ql-fill {
          fill: hsl(var(--muted-foreground));
        }
        .rte-root .ql-toolbar button:hover .ql-stroke,
        .rte-root .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .rte-root .ql-toolbar button:hover .ql-fill,
        .rte-root .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--foreground));
        }
        .rte-root .ql-toolbar .ql-picker-label {
          color: hsl(var(--muted-foreground));
        }
        .rte-root .ql-toolbar .ql-picker-label:hover,
        .rte-root .ql-toolbar .ql-picker-label.ql-active {
          color: hsl(var(--foreground));
        }
        .rte-root .ql-editor a {
          color: hsl(221 83% 53%);
          text-decoration: underline;
        }
        .rte-root .ql-editor blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 12px;
          color: hsl(var(--muted-foreground));
          margin: 8px 0;
        }
        .rte-root .ql-editor pre.ql-syntax {
          background: hsl(var(--muted));
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 0.82em;
          color: hsl(var(--foreground));
        }
        .rte-root .ql-editor ul,
        .rte-root .ql-editor ol {
          padding-left: 1.5em;
        }
        .rte-root .ql-container.ql-snow:only-child {
          border-radius: 6px;
        }
        .rte-root .ql-editor.ql-disabled {
          cursor: default;
        }
      `}</style>
    </>
  );
}
