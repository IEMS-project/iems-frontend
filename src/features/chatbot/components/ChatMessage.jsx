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
import { sanitizeAgentResponse } from '@/features/chatbot/utils/sanitizeAgentResponse';

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

const parseStructuredAgentResponse = (content) => {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed?.type && parsed?.title ? parsed : null;
  } catch {
    return null;
  }
};

const badgeClass = (value = '') => {
  const normalized = String(value).toLowerCase();
  if (normalized.includes('high') || normalized.includes('cao') || normalized.includes('block')) {
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900';
  }
  if (normalized.includes('done') || normalized.includes('xong') || normalized.includes('hoàn thành')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
  }
  if (normalized.includes('progress') || normalized.includes('đang')) {
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900';
  }
  return 'bg-muted text-muted-foreground border-border';
};

const ChatMessage = ({
  message,
  isUser = false,
  timestamp,
  attachments = [],
  projectId = null,
  proposedActions = [],
  actionStatus = null,
  onAllowAction,
}) => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueLookup, setIssueLookup] = useState(null);
  const [isLoadingIssueDetail, setIsLoadingIssueDetail] = useState(false);
  const [issueModalError, setIssueModalError] = useState(null);

  const displayMessage = isUser ? message : sanitizeAgentResponse(message);
  const structuredResponse = !isUser ? parseStructuredAgentResponse(displayMessage) : null;
  const parsedIssueList = !isUser ? parseIssueListMessage(displayMessage) : null;

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

  const renderStructuredResponse = () => {
    if (!structuredResponse) return null;
    const metrics = Array.isArray(structuredResponse.metrics) ? structuredResponse.metrics : [];
    const sections = Array.isArray(structuredResponse.sections) ? structuredResponse.sections : [];
    const issues = Array.isArray(structuredResponse.issues) ? structuredResponse.issues : [];
    const actions = Array.isArray(structuredResponse.actions) ? structuredResponse.actions : [];

    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <div className="mb-1 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {structuredResponse.type}
          </div>
          <h3 className="text-base font-semibold text-foreground">{structuredResponse.title}</h3>
          {structuredResponse.summary && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{structuredResponse.summary}</p>
          )}
        </div>

        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map((metric, index) => (
              <div key={`${metric.label}-${index}`} className="rounded-md border border-border bg-background p-2.5">
                <div className="text-[11px] text-muted-foreground">{metric.label}</div>
                <div className="mt-1 text-lg font-semibold text-foreground">{String(metric.value ?? '')}</div>
              </div>
            ))}
          </div>
        )}

        {issues.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Issue</th>
                  <th className="px-3 py-2 font-medium">Tiêu đề</th>
                  <th className="px-3 py-2 font-medium">Trạng thái</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Hạn chót</th>
                  <th className="px-3 py-2 font-medium">Lý do</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, index) => (
                  <tr key={`${issue.issueKey}-${index}`} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2 font-mono font-medium">{issue.issueKey}</td>
                    <td className="min-w-48 px-3 py-2">{issue.title}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 ${badgeClass(issue.statusName)}`}>
                        {issue.statusName || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 ${badgeClass(issue.priorityName)}`}>
                        {issue.priorityName || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{issue.dueDate || 'Chưa có hạn chót'}</td>
                    <td className="min-w-56 px-3 py-2 text-muted-foreground">{issue.reason || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sections.map((section, index) => (
          <div key={`${section.title}-${index}`} className="rounded-md border border-border bg-background p-3">
            <h4 className="mb-2 text-sm font-semibold text-foreground">{section.title}</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {(section.items || []).map((item, itemIndex) => (
                <li key={itemIndex}>- {item}</li>
              ))}
            </ul>
          </div>
        ))}

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <button
                key={`${action.type || action}-${index}`}
                type="button"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                onClick={() => window.alert('Mình đã chuẩn bị xác nhận. Bước gọi API sau xác nhận sẽ được nối ở lớp action handler.')}
              >
                {action.label || action}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProposedActions = () => {
    if (isUser || !Array.isArray(proposedActions) || proposedActions.length === 0) {
      if (actionStatus === 'allowed') {
        return (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <FaCheck className="h-3 w-3" />
            Đã cho phép
          </div>
        );
      }
      return null;
    }

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {proposedActions.map((action, index) => (
          <button
            key={`${action.type || 'action'}-${action.payload?.actionId || index}`}
            type="button"
            onClick={() => onAllowAction?.(action)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!onAllowAction}
            title="Cho phép chatbot thực hiện thao tác này"
          >
            <FaCheck className="h-3 w-3" />
            Allow
          </button>
        ))}
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
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayMessage}</p>
              </div>
            ) : structuredResponse ? (
              renderStructuredResponse()
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
                  {displayMessage}
                </ReactMarkdown>
              </div>
            )}
            {renderProposedActions()}
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
