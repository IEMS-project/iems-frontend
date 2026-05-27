import React, { useEffect, useState } from "react";
import { File, Copy, Check, Code } from "lucide-react";
import Button from "@/components/ui/button";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";

const codeViewerStyles = `
    /* Light mode */
    .code-viewer-container.light-mode pre[class*="language-"] {
        margin: 0;
        padding: 1rem;
        font-size: 11px;
        line-height: 1.5;
        background: #f6f8fa;
        color: #24292f;
    }
    
    .code-viewer-container.light-mode .line-numbers-rows {
        border-right: 1px solid #d0d7de;
        padding-right: 0.8em;
    }
    
    .code-viewer-container.light-mode .line-numbers .line-numbers-rows > span:before {
        color: #57606a;
        font-size: 11px;
    }

    .code-viewer-container.light-mode code[class*="language-"] {
        color: #24292f;
        font-size: 11px;
        text-shadow: none;
    }

    /* Dark mode */
    .code-viewer-container.dark-mode pre[class*="language-"] {
        margin: 0;
        padding: 1rem;
        font-size: 11px;
        line-height: 1.5;
        background: #0d1117;
        color: #e6edf3;
    }
    
    .code-viewer-container.dark-mode .line-numbers-rows {
        border-right: 1px solid #30363d;
        padding-right: 0.8em;
    }
    
    .code-viewer-container.dark-mode .line-numbers .line-numbers-rows > span:before {
        color: #6e7681;
        font-size: 11px;
    }

    .code-viewer-container.dark-mode code[class*="language-"] {
        color: #e6edf3;
        font-size: 11px;
        text-shadow: none;
    }
    
    /* Common styles */
    .code-viewer-container pre[class*="language-"].line-numbers {
        padding-left: 3.8em;
    }
`;

export default function CodeViewer({ selectedFile, fileContent, loading }) {
    const [copied, setCopied] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // Inject custom styles
    useEffect(() => {
        const styleElement = document.createElement("style");
        styleElement.textContent = codeViewerStyles;
        document.head.appendChild(styleElement);
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    // Highlight code when content changes
    useEffect(() => {
        if (fileContent && selectedFile) {
            Prism.highlightAll();
        }
    }, [fileContent, selectedFile]);

    const getLanguageClass = (filename) => {
        const ext = filename.split(".").pop().toLowerCase();
        const langMap = {
            js: "javascript",
            jsx: "jsx",
            ts: "typescript",
            tsx: "tsx",
            java: "java",
            py: "python",
            json: "json",
            yml: "yaml",
            yaml: "yaml",
            md: "markdown",
            sql: "sql",
            css: "css",
            scss: "css",
            sh: "bash",
            xml: "markup",
            html: "markup",
        };
        return `language-${langMap[ext] || "markup"}`;
    };

    const handleCopyCode = async () => {
        if (!fileContent) return;
        try {
            await navigator.clipboard.writeText(fileContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* File Header with Copy Button */}
            <div className="px-4 py-2 border-b border-border bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                    {selectedFile ? (
                        <>
                            <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-mono text-sm truncate">{selectedFile.path}</span>
                        </>
                    ) : (
                        <span className="text-muted-foreground">No file selected</span>
                    )}
                </div>
                {selectedFile && fileContent && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 ml-2 flex-shrink-0"
                        title="Copy code"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span className="text-xs">Copy</span>
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Code Content */}
            <div className={`flex-1 overflow-auto code-viewer-container ${isDarkMode ? 'dark-mode bg-[#0d1117]' : 'light-mode bg-[#f6f8fa]'}`}>
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Loading file...
                    </div>
                ) : selectedFile ? (
                    <div className="relative h-full">
                        <pre className="line-numbers m-0 h-full" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                            <code className={getLanguageClass(selectedFile.name)}>
                                {fileContent}
                            </code>
                        </pre>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-background">
                        <div className="text-center">
                            <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Select a file to view its content</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
