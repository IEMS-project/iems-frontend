import React from "react";
import {
  FaSmile,
  FaPaperPlane,
  FaPaperclip,
  FaThumbsUp,
  FaImage,
  FaStickyNote
} from "react-icons/fa";
import ReplyInput from "../../components/messages/ReplyInput";

export default function MessageComposer({
  content,
  onContentChange,
  onSend,
  onTyping,
  replyingTo,
  onCancelReply,
  getUserName,
}) {
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
          <button className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-full transition-colors">
            <FaImage className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
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
                  onSend();
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
                  onSend();
                  // Reset height sau khi gửi
                  const textarea = document.querySelector('textarea');
                  if (textarea) {
                    textarea.style.height = "auto";
                  }
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



