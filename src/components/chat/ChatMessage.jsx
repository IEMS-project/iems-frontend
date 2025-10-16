import React, { useState } from 'react';
import { FaUser, FaRobot, FaCopy, FaCheck } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-md text-xs flex items-center gap-1"
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

const ChatMessage = ({ message, isUser = false, timestamp }) => {
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'max-w-[85%] sm:max-w-[80%] order-first' : 'w-full'}`}>
        <div className={`${
          isUser 
            ? 'rounded-lg px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
            : 'text-gray-900 dark:text-gray-100'
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message}</p>
          ) : (
            <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 pl-4 list-disc space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 pl-4 list-decimal space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    
                    // Check if this is a code block (not inline code)
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
                    // Check if it's a code block with language
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
  );
};

export default ChatMessage;
