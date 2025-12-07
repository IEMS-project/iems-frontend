import React, { useState } from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";

export default function FileTree({ items, onFileClick, fetchFolder, selectedFile, level = 0 }) {
    const [expanded, setExpanded] = useState({});
    const [children, setChildren] = useState({});

    const toggleFolder = async (item) => {
        const key = item.path;

        if (expanded[key]) {
            // Collapse
            setExpanded(prev => ({ ...prev, [key]: false }));
        } else {
            // Expand and load children if not loaded
            setExpanded(prev => ({ ...prev, [key]: true }));
            if (!children[key]) {
                try {
                    const items = await fetchFolder(item.path);
                    setChildren(prev => ({ ...prev, [key]: items }));
                } catch (error) {
                    console.error("Error loading folder:", error);
                }
            }
        }
    };

    return (
        <div className={level > 0 ? "ml-3" : ""}>
            {items.map((item) => (
                <div key={item.path}>
                    <div
                        className={`
                            flex items-center gap-1.5 py-1 px-1.5 rounded text-sm cursor-pointer
                            transition-colors
                            ${selectedFile?.path === item.path
                                ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
                                : "hover:bg-muted/50 text-foreground"
                            }
                        `}
                        onClick={() => {
                            if (item.type === "dir") {
                                toggleFolder(item);
                            } else {
                                onFileClick(item);
                            }
                        }}
                    >
                        {item.type === "dir" ? (
                            <>
                                {expanded[item.path] ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                )}
                                <Folder className={`w-4 h-4 flex-shrink-0 ${expanded[item.path] ? "text-blue-500" : "text-blue-400"
                                    }`} />
                            </>
                        ) : (
                            <>
                                <div className="w-3.5" /> {/* Spacer for alignment */}
                                <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </>
                        )}
                        <span className="truncate flex-1">{item.name}</span>
                    </div>

                    {item.type === "dir" && expanded[item.path] && children[item.path] && (
                        <FileTree
                            items={children[item.path]}
                            onFileClick={onFileClick}
                            fetchFolder={fetchFolder}
                            selectedFile={selectedFile}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
