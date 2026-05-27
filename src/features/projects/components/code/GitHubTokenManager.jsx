import React, { useState } from "react";
import Button from "@/components/ui/button";
import { Key } from "lucide-react";

export default function GitHubTokenManager({ token, onSaveToken, onRemoveToken }) {
    const [showDialog, setShowDialog] = useState(false);
    const [tokenInput, setTokenInput] = useState("");

    const handleSave = () => {
        if (tokenInput.trim()) {
            onSaveToken(tokenInput.trim());
            setShowDialog(false);
            setTokenInput("");
        }
    };

    return (
        <>
            {/* Token Status Display */}
            <div className="flex items-center gap-2">
                {token ? (
                    <>
                        <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-md font-medium">
                            Token Active
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRemoveToken}
                            className="text-xs h-7"
                            title="Remove token"
                        >
                            Remove Token
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDialog(true)}
                        className="text-xs h-7"
                    >
                        <Key className="w-3.5 h-3.5 mr-1" />
                        Add Token
                    </Button>
                )}
            </div>

            {/* Token Input Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            GitHub Access Token Required
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            To access repositories and avoid rate limits, please enter your GitHub Personal Access Token.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Personal Access Token
                            </label>
                            <input
                                type="password"
                                value={tokenInput}
                                onChange={(e) => setTokenInput(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSave();
                                    }
                                }}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground mb-4 space-y-1">
                            <p>• Get your token at: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com/settings/tokens</a></p>
                            <p>• Generate a token with "repo" scope</p>
                            <p>• Token will be stored locally</p>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowDialog(false);
                                    setTokenInput("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleSave}
                                disabled={!tokenInput.trim()}
                            >
                                Save Token
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
