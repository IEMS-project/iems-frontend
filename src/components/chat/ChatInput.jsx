import React, { useState } from 'react';
import { Loader2, Mic, Paperclip, Send } from 'lucide-react';

const DEFAULT_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-o1-mini', name: 'o1 mini' },
];

const ChatInput = ({
  onSendMessage,
  isLoading = false,
  disabled = false,
  models = DEFAULT_MODELS,
}) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0]?.id ?? '');

  const isTyping = isLoading || disabled;
  const isSubmitDisabled = !message.trim() || isTyping;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isTyping) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 backdrop-blur">
      <div className="p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hỏi tôi bất cứ điều gì về dự án, công việc hoặc tài liệu..."
            className="w-full resize-none bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
            rows={3}
            disabled={isTyping}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={isTyping}
              >
                <Paperclip className="h-4 w-4" />
                Attachment
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={isTyping}
              >
                <Mic className="h-4 w-4" />
                Voice
              </button>

              <div className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium">
                <span className="text-gray-500 dark:text-gray-400">Model</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
                  disabled={isTyping}
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang phản hồi...
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                Gửi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
