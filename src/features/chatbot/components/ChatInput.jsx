import React, { useRef, useState } from 'react';
import { AtSign, FileText, Image, Loader2, Paperclip, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ChatInput = ({
  onSendMessage,
  onSelectOption,
  isLoading = false,
  disabled = false,
  quickOptions = [],
  onUploadAttachment,
  attachments = [],
  onRemoveAttachment,
  isUploadingAttachment = false,
  availableAttachments = [],
  onSelectAttachment,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const fileInputRef = useRef(null);

  const isTyping = isLoading || disabled;
  const isSubmitDisabled = !message.trim() || isTyping;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim() || isTyping) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <div className="border-border bg-background backdrop-blur">
      <div className="p-4">
        {quickOptions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {quickOptions.map((option) => (
              <button
                key={option.id || option.label}
                type="button"
                onClick={() => {
                  const prompt = option.prompt || option.label;
                  if (!prompt || isTyping) return;
                  if (onSelectOption) {
                    onSelectOption(prompt);
                  } else {
                    onSendMessage(prompt);
                  }
                }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                disabled={isTyping}
                title={option.prompt || option.label}
              >
                {option.label || option.prompt}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          {attachments.length > 0 && (
            <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto border-b border-border pb-3">
              {attachments.map((attachment) => {
                const name = attachment.name || attachment.fileName || String(attachment);
                const isImage = /\.(png|jpe?g|webp)$/i.test(name);
                const Icon = isImage ? Image : FileText;

                return (
                  <span
                    key={attachment.id || name}
                    className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground"
                    title={name}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span className="max-w-48 truncate">{name}</span>
                    {onRemoveAttachment && (
                      <button
                        type="button"
                        onClick={() => onRemoveAttachment(attachment.id)}
                        className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    disabled={isTyping}
                    aria-label={t('chatbot.input.removeAttachment', { name })}
                  >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          <div className="relative">
            <textarea
              value={message}
              onChange={(event) => {
                const nextValue = event.target.value;
                setMessage(nextValue);
                if (nextValue.endsWith('@') && availableAttachments.length > 0) {
                  setShowAttachmentPicker(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('chatbot.input.placeholder')}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              rows={3}
              disabled={isTyping}
            />

            {showAttachmentPicker && availableAttachments.length > 0 && (
              <div className="absolute bottom-full left-0 z-20 mb-2 max-h-64 w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-popover p-1.5 shadow-lg">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t('chatbot.input.embeddedDocuments')}
                </div>
                {availableAttachments.map((attachment) => {
                  const name = attachment.name || attachment.fileName || attachment.id;
                  const selected = attachments.some(item => item.id === attachment.id);
                  return (
                    <button
                      key={attachment.id}
                      type="button"
                      onClick={() => {
                        if (onSelectAttachment) {
                          onSelectAttachment(attachment.id);
                        }
                        setShowAttachmentPicker(false);
                        setMessage(value => value.endsWith('@') ? value.slice(0, -1) : value);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                        selected ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'hover:bg-muted'
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                      {selected && <span className="text-xs">{t('chatbot.input.selected')}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.md,.markdown,.json,.xml,.pdf,.docx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*,image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file && onUploadAttachment) {
                    onUploadAttachment(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted disabled:opacity-50"
                disabled={isTyping || !onUploadAttachment}
                title={t('chatbot.input.attachFile')}
              >
                {isUploadingAttachment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAttachmentPicker(prev => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted disabled:opacity-50"
                disabled={isTyping || availableAttachments.length === 0}
                title={t('chatbot.input.chooseEmbeddedDocument')}
              >
                <AtSign className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isUploadingAttachment ? t('chatbot.input.readingFile') : t('chatbot.input.responding')}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                <Send className="h-4 w-4" />
                {t('chatbot.input.send')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
