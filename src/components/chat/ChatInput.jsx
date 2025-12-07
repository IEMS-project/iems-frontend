import React, { useState } from 'react';
import { Loader2, Mic, Paperclip, Send } from 'lucide-react';
import { borderColors, bgColors, textColors, inputColors } from '../../theme/colors';

const DEFAULT_MODELS = [
  { id: 'Qwen2.5', name: 'Qwen 2.5' },
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
    <div className=" border-border bg-background backdrop-blur">
      <div className="p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hỏi tôi bất cứ điều gì về dự án, công việc hoặc tài liệu..."
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={3}
            disabled={isTyping}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                disabled={isTyping}
              >
                <Paperclip className="h-4 w-4" />
                Attachment
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                disabled={isTyping}
              >
                <Mic className="h-4 w-4" />
                Voice
              </button>

              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium">
                <span className="text-muted-foreground">Model</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-foreground focus:outline-none"
                  disabled={isTyping}
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id} className="bg-background text-foreground">
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
