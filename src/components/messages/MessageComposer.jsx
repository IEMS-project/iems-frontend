import React from "react";
import {
  FaSmile,
  FaPaperPlane,
  FaPaperclip,
  FaThumbsUp,
  FaImage,
  FaStickyNote
} from "react-icons/fa";
import ReplyInput from "../messages/ReplyInput";

export default function MessageComposer({
  content,
  onContentChange,
  onSend,
  onTyping,
  onSendMedia,
  replyingTo,
  onCancelReply,
  getUserName,
}) {
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (replyingTo && textareaRef.current) {
      try {
        const el = textareaRef.current;
        el.focus();
        const len = (el.value || '').length;
        el.setSelectionRange(len, len);
      } catch (_) { /* noop */ }
    }
  }, [replyingTo]);
  const [selectedFiles, setSelectedFiles] = React.useState([]);

  const handlePickFiles = (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const enhanced = list.map((f) => ({ file: f, id: Math.random().toString(36).slice(2), preview: URL.createObjectURL(f) }));
    setSelectedFiles(prev => [...prev, ...enhanced]);
  };

  const handleRemoveFile = (id) => {
    setSelectedFiles(prev => prev.filter(x => x.id !== id));
  };

  const handleUnifiedSend = async () => {
    // Send files first (if any), then text
    if (selectedFiles.length > 0) {
      try { await onSendMedia?.(selectedFiles.map(x => x.file)); } catch (_) { }
      setSelectedFiles([]);
    }
    onSend?.();
  };
  return (
    <>
      <ReplyInput
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        getUserName={getUserName}
      />
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-3">
          {/* Sticker button */}
          <button className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors">
            <FaSmile className="w-5 h-5" />
          </button>

          {/* Danh thiếp button */}
          <button className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors">
            <FaStickyNote className="w-5 h-5" />
          </button>

          {/* Phương tiện button */}
          <label className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors cursor-pointer">
            <FaImage className="w-5 h-5" />
            <input type="file" accept="image/jpeg,image/png,video/mp4,video/quicktime,application/pdf,application/zip,*/*" multiple className="hidden" onChange={(e)=>{
              const files = Array.from(e.target.files || []);
              // FE validation: up to 5MB for image, 20MB for video, 20MB for others
              const valid = files.filter(f => {
                const sizeMB = f.size / (1024 * 1024);
                if (f.type.startsWith('image')) return sizeMB <= 5;
                if (f.type.startsWith('video')) return sizeMB <= 20;
                return sizeMB <= 20;
              });
              if (valid.length < files.length) {
                alert('Một số tệp vượt quá giới hạn kích thước (Ảnh ≤ 5MB, Video/Tệp ≤ 20MB).');
              }
              handlePickFiles(valid);
              e.target.value = '';
            }} />
          </label>

          <div className="flex-1 relative">
            {selectedFiles.length > 0 && (
              <div className="mb-2 flex gap-2 flex-wrap">
                {selectedFiles.map((x) => (
                  <div key={x.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {x.file.type.startsWith('image') ? (
                      <img src={x.preview} alt="preview" className="w-full h-full object-cover" />
                    ) : x.file.type.startsWith('video') ? (
                      <video className="w-full h-full object-cover">
                        <source src={x.preview} />
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] px-1 text-center text-gray-600 dark:text-gray-300 break-all">
                        {(x.file.name || 'Tệp')}
                      </div>
                    )}
                    <button onClick={() => handleRemoveFile(x.id)} className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded">x</button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder={replyingTo ? "Trả lời tin nhắn..." : "Nhập tin nhắn..."}
              value={content}
              rows={1}
              onChange={(e) => {
                onContentChange(e.target.value);
                onTyping();
                e.target.style.height = "auto";
                // Tối đa 4 dòng (4 * 1.5rem = 6rem)
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleUnifiedSend();
                  // Reset height sau khi gửi
                  e.target.style.height = "auto";
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              {/* Emoji button */}
              <button className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors">
                <FaSmile className="w-5 h-5" />
              </button>

              {/* Send button - luôn hiện */}
              <button
                onClick={() => {
                  handleUnifiedSend();
                  // Reset height sau khi gửi
                  const textarea = textareaRef.current;
                  if (textarea) textarea.style.height = "auto";
                }}
                className="p-2 mr-2 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors"
              >
                <FaPaperPlane className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



