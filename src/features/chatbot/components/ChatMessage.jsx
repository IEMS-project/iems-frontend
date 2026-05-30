import React, { useState } from 'react';
import { FaUser, FaRobot, FaCopy, FaCheck } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { bgColors, textColors, buttonColors } from '@/theme/colors';
import Modal from '@/components/ui/Modal';
import { issueService } from '@/features/projects/api/issueService';
import IssueDetailModal from '@/features/projects/components/IssueDetailModal';
import IssueCard from '@/features/projects/components/IssueCard';

// CodeBlock component with copy functionality
const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);
  const codeString = children?.toString() || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white p-2 rounded-md text-xs flex items-center gap-1"
          title="Copy code"
        >
          {copied ? (
            <>
              <FaCheck className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <FaCopy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const ISSUE_LINE_PATTERN = /^(?:\d+\.\s*)?([A-Z]+-\d+)\s*\|\s*([^|]+)\s*\|(.+)$/i;
const ISSUE_BADGE_REASON_PATTERN = /^(?:\d+\.\s*)?([A-Z]+-\d+)\s*\|\s*reason=(.+)$/i;
const ISSUE_BADGE_KEY_PATTERN = /^(?:\d+\.\s*)?([A-Z]+-\d+)$/i;

const parseIssueCardLine = (line) => {
  const match = line.match(ISSUE_LINE_PATTERN);
  if (!match) {
    return null;
  }

  const meta = {};
  String(match[3] || '')
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex <= 0) {
        return;
      }
      const key = part.slice(0, separatorIndex).trim().toLowerCase();
      const value = part.slice(separatorIndex + 1).trim();
      meta[key] = value;
    });

  if (!meta.status && !meta.priority) {
    return null;
  }

  return {
    issueKey: (match[1] || '').trim(),
    title: (match[2] || '').trim(),
    status: meta.status || '',
    priority: meta.priority || '',
    dueDate: meta.due || null,
    reason: meta.reason || null,
    issueId: meta.id || meta.issueid || null,
    projectId: meta.projectid || null,
  };
};

const parseIssueListMessage = (content) => {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const items = [];
  let mode = 'cards';
  const detailLines = [];

  if (lines.some(line => ISSUE_BADGE_REASON_PATTERN.test(line))) {
    mode = 'badges-with-reason';
  } else if (lines.some(line => ISSUE_BADGE_KEY_PATTERN.test(line)) && !lines.some(line => parseIssueCardLine(line))) {
    mode = 'badges';
  }

  for (const line of lines) {
    if (mode === 'badges-with-reason') {
      const reasonMatch = line.match(ISSUE_BADGE_REASON_PATTERN);
      if (!reasonMatch) {
        detailLines.push(line);
        continue;
      }
      items.push({
        issueKey: (reasonMatch[1] || '').trim(),
        reason: (reasonMatch[2] || '').trim(),
      });
      continue;
    }

    if (mode === 'badges') {
      const keyMatch = line.match(ISSUE_BADGE_KEY_PATTERN);
      if (!keyMatch) {
        detailLines.push(line);
        continue;
      }
      items.push({
        issueKey: (keyMatch[1] || '').trim(),
      });
      continue;
    }

    const cardItem = parseIssueCardLine(line);
    if (!cardItem) {
      detailLines.push(line);
      continue;
    }
    items.push(cardItem);
  }

  if (!items.length) {
    return null;
  }

  const summaryLine = lines.find(line => !parseIssueCardLine(line) && /tim thay|hien thi|issue|cong viec|task|ke hoach/i.test(line)) || 'Danh sach cong viec';
  const detailContent = detailLines
    .filter(line => line !== summaryLine && !/^[-]{3,}$/.test(line) && !/^task_cards:?$/i.test(line))
    .join('\n');
  return {
    summaryLine,
    items,
    mode,
    detailContent,
  };
};

const stripHtml = (value) => {
  if (!value) return '';
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const ChatMessage = ({ message, isUser = false, timestamp, attachments = [], projectId = null }) => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueLookup, setIssueLookup] = useState(null);
  const [isLoadingIssueDetail, setIsLoadingIssueDetail] = useState(false);
  const [issueModalError, setIssueModalError] = useState(null);

  const parsedIssueList = !isUser ? parseIssueListMessage(message) : null;

  const openIssueDetail = async (itemOrKey) => {
    const item = typeof itemOrKey === 'string' ? { issueKey: itemOrKey } : itemOrKey;
    const targetProjectId = item.projectId || projectId;

    if (!targetProjectId) {
      setIssueModalError('Khong xac dinh duoc du an hien tai de mo chi tiet issue.');
      setSelectedIssue(null);
      setIsIssueModalOpen(true);
      return;
    }

    setIssueModalError(null);
    setIsIssueModalOpen(true);
    setIsLoadingIssueDetail(true);

    try {
      if (item.issueId) {
        const detail = await issueService.getIssueById(targetProjectId, item.issueId);
        setSelectedIssue(detail || item);
        return;
      }

      let lookup = issueLookup;
      if (!lookup) {
        const allIssues = await issueService.getIssues(targetProjectId);
        lookup = (allIssues || []).reduce((acc, issue) => {
          if (issue?.issueKey) {
            acc[issue.issueKey.toUpperCase()] = issue;
          }
          return acc;
        }, {});
        setIssueLookup(lookup);
      }

      const basicIssue = lookup[item.issueKey.toUpperCase()];
      if (!basicIssue) {
        setSelectedIssue({
          id: item.issueId || item.issueKey,
          issueKey: item.issueKey,
          title: item.title || item.issueKey,
          priorityId: item.priority || '',
          statusId: item.status || '',
        });
        setIssueModalError(`Chua tai duoc chi tiet ${item.issueKey}; dang hien thi thong tin tom tat tu AI.`);
        return;
      }

      if (!basicIssue.id) {
        setSelectedIssue(basicIssue);
        return;
      }

      const detail = await issueService.getIssueById(targetProjectId, basicIssue.id);
      setSelectedIssue(detail || basicIssue);
    } catch (error) {
      if (item?.issueKey) {
        setSelectedIssue({
          id: item.issueId || item.issueKey,
          issueKey: item.issueKey,
          title: item.title || item.issueKey,
          priorityId: item.priority || '',
          statusId: item.status || '',
        });
        setIssueModalError(error?.message || `Chua tai duoc chi tiet ${item.issueKey}; dang hien thi thong tin tom tat tu AI.`);
      } else {
        setSelectedIssue(null);
        setIssueModalError(error?.message || 'Khong the tai chi tiet issue.');
      }
    } finally {
      setIsLoadingIssueDetail(false);
    }
  };

  const handleIssueDetailUpdated = async () => {
    if (!selectedIssue?.id || !projectId) {
      return;
    }

    try {
      const detail = await issueService.getIssueById(projectId, selectedIssue.id);
      if (detail) {
        setSelectedIssue(detail);
      }
    } catch (error) {
      console.error('Failed to refresh issue detail after update:', error);
    }
  };

  const renderIssueListCards = () => {
    if (!parsedIssueList) {
      return null;
    }

    if (parsedIssueList.mode === 'badges-with-reason') {
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{parsedIssueList.summaryLine}</p>
          <div className="space-y-2">
            {parsedIssueList.items.map((item) => (
              <div key={item.issueKey} className="rounded-lg border border-border bg-card p-2.5">
                <button
                  type="button"
                  onClick={() => openIssueDetail(item)}
                  className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-mono hover:bg-muted/70"
                >
                  {item.issueKey}
                </button>
                <p className="mt-1.5 text-xs text-muted-foreground">Lý do: {item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (parsedIssueList.mode === 'badges') {
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{parsedIssueList.summaryLine}</p>
          <div className="flex flex-wrap gap-2">
            {parsedIssueList.items.map((item) => (
              <button
                key={item.issueKey}
                type="button"
                onClick={() => openIssueDetail(item)}
                className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-mono hover:bg-muted/50"
              >
                {item.issueKey}
              </button>
            ))}
          </div>
        </div>
      );
    }

    const cardIssueTypes = [
      { id: 'TASK', name: 'TASK' },
    ];
    const cardIssuePriorities = Array.from(
      new Set(parsedIssueList.items.map(item => (item.priority || '').trim()).filter(Boolean))
    ).map((priority) => ({ id: priority, name: priority }));

    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">{parsedIssueList.summaryLine}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {parsedIssueList.items.map((item) => (
            <div key={item.issueKey} className="space-y-1.5">
              <IssueCard
                issue={{
                  id: item.issueKey,
                  issueKey: item.issueKey,
                  title: item.title || '(no-title)',
                  issueTypeId: 'TASK',
                  priorityId: item.priority || '',
                  storyPoints: null,
                }}
                issueTypes={cardIssueTypes}
                issuePriorities={cardIssuePriorities}
                members={[]}
                onClick={() => openIssueDetail(item)}
              />
              <div className="px-1 text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                {item.status && (
                  <span className="rounded-full bg-muted px-2 py-0.5">{item.status}</span>
                )}
                {item.dueDate && <span>due {item.dueDate}</span>}
              </div>
              {item.reason && (
                <div className="mx-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Ly do: </span>{item.reason}
                </div>
              )}
            </div>
          ))}
        </div>
        {parsedIssueList.detailContent && (
          <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-headings:text-foreground prose-li:text-foreground prose-strong:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {parsedIssueList.detailContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`${isUser ? 'max-w-[85%] sm:max-w-[80%] order-first' : 'w-full'}`}>
          <div className={`${isUser
            ? 'rounded-lg px-4 py-3 bg-muted text-foreground'
            : 'text-foreground'
            }`}>
            {isUser ? (
              <div>
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {attachments.map((attachment) => (
                      <span
                        key={attachment.id || attachment.name || attachment}
                        className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[11px]"
                      >
                        {attachment.name || attachment}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message}</p>
              </div>
            ) : parsedIssueList ? (
              renderIssueListCards()
            ) : (
              <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-headings:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>,
                    ul: ({ children }) => <ul className="mb-3 pl-4 list-disc space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 pl-4 list-decimal space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';

                      const isCodeBlock = !inline && (language || (node && node.tagName === 'pre'));

                      if (isCodeBlock) {
                        return (
                          <CodeBlock language={language} {...props}>
                            {children}
                          </CodeBlock>
                        );
                      }

                      return (
                        <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => {
                      const codeElement = children?.props?.children;
                      const className = children?.props?.className || '';
                      const match = /language-(\w+)/.exec(className);
                      const language = match ? match[1] : 'text';

                      if (codeElement && typeof codeElement === 'string') {
                        return (
                          <div className="mb-3">
                            <CodeBlock language={language}>
                              {codeElement}
                            </CodeBlock>
                          </div>
                        );
                      }
                      return (
                        <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded text-xs font-mono overflow-x-auto mb-3">
                          {children}
                        </pre>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-3 text-gray-600 dark:text-gray-400">
                        {children}
                      </blockquote>
                    ),
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                  }}
                >
                  {message}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedIssue && projectId ? (
        <IssueDetailModal
          open={isIssueModalOpen}
          onClose={() => {
            setIsIssueModalOpen(false);
            setIssueModalError(null);
            setSelectedIssue(null);
          }}
          issue={selectedIssue}
          onUpdate={handleIssueDetailUpdated}
          onDelete={() => {
            setIsIssueModalOpen(false);
            setSelectedIssue(null);
          }}
        />
      ) : (
        <Modal
          open={isIssueModalOpen}
          onClose={() => {
            setIsIssueModalOpen(false);
            setIssueModalError(null);
            setSelectedIssue(null);
          }}
          className="!max-w-3xl"
          title="Chi tiet issue"
        >
          {isLoadingIssueDetail ? (
            <p className="text-sm text-muted-foreground">Dang tai chi tiet issue...</p>
          ) : issueModalError ? (
            <p className="text-sm text-red-600">{issueModalError}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Khong co du lieu issue.</p>
          )}
        </Modal>
      )}
    </>
  );
};

export default ChatMessage;
