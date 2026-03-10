import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { documentService } from "@/features/documents/api/documentService";
import Skeleton from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { colors, textColors, bgColors, borderColors, buttonColors, statusColors, cn } from "@/theme/colors";

export default function MoveModal({ isOpen, onClose, moveItem, onMoveCompleted, isBatchMode = false }) {
  const { t } = useTranslation();
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: "Home", parentId: null }]);
  const [loading, setLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFolders = useCallback(async (folderId) => {
    try {
      setLoading(true);
      setError(null);

      // Get all folders and filter by parent
      const allFolders = await documentService.getAllFolders();
      const filteredFolders = allFolders.filter(f => {
        const matchesParent = f.parentId === folderId;
        // In batch mode, don't filter out any folder
        // In single mode, filter out the item being moved
        const isNotMovingItem = isBatchMode || f.id !== moveItem?.data?.id;
        return matchesParent && isNotMovingItem;
      });

      setFolders(filteredFolders);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(err.message || t('documents.move.error') || 'Error loading folders');
    } finally {
      setLoading(false);
    }
  }, [isBatchMode, moveItem, t]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: null, name: "Home", parentId: null }]);
      loadFolders(null);
    }
  }, [isOpen, loadFolders]);

  const handleFolderClick = async (folder) => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      // Add to breadcrumb
      const newBreadcrumbs = [...breadcrumbs];
      newBreadcrumbs.push({ id: folder.id, name: folder.name, parentId: folder.parentId });
      setBreadcrumbs(newBreadcrumbs);

      // Navigate to folder
      setCurrentFolderId(folder.id);
      await loadFolders(folder.id);

    } catch (err) {
      console.error('Error navigating folder:', err);
      setError(err.message || t('documents.move.error') || 'Error navigating folder');
    } finally {
      setLoading(false);
    }
  };

  const handleBreadcrumbClick = async (index) => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const clickedCrumb = breadcrumbs[index];

      // Update breadcrumbs
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));

      // Navigate to folder
      setCurrentFolderId(clickedCrumb.id);
      await loadFolders(clickedCrumb.id);

    } catch (err) {
      console.error('Error navigating breadcrumb:', err);
      setError(err.message || t('documents.move.error') || 'Error navigating');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveHere = async () => {
    if (moveLoading) return;

    // In batch mode, just return the destination folder ID
    if (isBatchMode) {
      if (onMoveCompleted) {
        onMoveCompleted(currentFolderId);
      }
      onClose();
      return;
    }

    // Single item move
    if (!moveItem) return;

    try {
      setMoveLoading(true);
      setError(null);

      if (moveItem.type === "folder") {
        await documentService.moveFolder(moveItem.data.id, currentFolderId);
      } else {
        await documentService.moveFile(moveItem.data.id, currentFolderId);
      }

      // Call callback to refresh main view
      if (onMoveCompleted) {
        onMoveCompleted();
      }

      // Close modal
      onClose();

    } catch (err) {
      console.error('Error moving item:', err);
      setError(err.message || t('documents.move.error') || 'Error moving item');
    } finally {
      setMoveLoading(false);
    }
  };

  const getCurrentFolderName = () => {
    return breadcrumbs[breadcrumbs.length - 1].name;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className={cn("rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col", colors.card)}>
        {/* Header */}
        <div className={cn("flex items-center justify-between p-6 border-b", borderColors.default)}>
          <div>
            <h2 className={cn("text-xl font-semibold", textColors.primary)}>
              {isBatchMode
                ? t('documents.move.titleBatch') + ' ' + t('documents.move.selectDestination') + ' ' + getCurrentFolderName()
                : `${t('documents.move.movingItem').replace('<strong>{{name}}</strong>', moveItem?.data?.name || '')} ${t('documents.move.selectDestination')} ${getCurrentFolderName()}`
              }
            </h2>

            {/* Breadcrumb */}
            <div className="flex items-center space-x-1 mt-2">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className={textColors.muted}>/</span>}
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={cn(
                      "text-sm",
                      index === breadcrumbs.length - 1
                        ? "text-blue-600 dark:text-blue-400 font-medium"
                        : cn(textColors.secondary, "hover:text-blue-600 dark:hover:text-blue-400")
                    )}
                    disabled={loading}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className={cn("text-2xl", textColors.muted, "hover:text-gray-600 dark:hover:text-gray-300")}
            disabled={moveLoading}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Error message */}
          {error && (
            <div className={cn("p-4 border-l-4", statusColors.dangerBg, statusColors.dangerBorder)}>
              <p className={statusColors.dangerText}>{error}</p>
            </div>
          )}

          {/* Folders grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className={cn("rounded-lg border border-dashed p-4 text-center", borderColors.light)}>
                    <Skeleton className="mx-auto mb-2 h-12 w-12 rounded-lg" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className={cn("group flex flex-col items-center p-4 rounded-lg transition-all duration-200 hover:scale-105", bgColors.hover)}
                      disabled={loading}
                    >
                      <div className="w-12 h-12 bg-yellow-400 dark:bg-yellow-500 rounded-lg flex items-center justify-center mb-2 group-hover:bg-yellow-500 dark:group-hover:bg-yellow-600 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-8 h-8 text-yellow-900 dark:text-yellow-950"
                        >
                          <path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path>
                          <path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path>
                        </svg>
                      </div>
                      <span className={cn("text-xs text-center font-medium", textColors.primary)}>
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Empty state */}
                {folders.length === 0 && (
                  <div className="text-center py-12">
                    <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4", bgColors.muted)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-8 h-8", textColors.muted)}>
                        <path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path>
                        <path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path>
                      </svg>
                    </div>
                    <p className={textColors.secondary}>{t('documents.move.noSubfolders')}</p>
                    <p className={cn("text-sm", textColors.muted)}>{t('documents.move.noSubfoldersDesc')}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className={cn("border-t p-6", borderColors.default)}>
            <div className="flex justify-between items-center">
              <Button
                onClick={onClose}
                className={cn("px-4 py-2", textColors.secondary, "hover:text-gray-800 dark:hover:text-gray-200", buttonColors.ghost)}
                disabled={moveLoading}
              >
                {t('documents.move.cancel')}
              </Button>

              <Button
                onClick={handleMoveHere}
                disabled={moveLoading}
                className={cn("px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center", buttonColors.secondary)}
              >
                {moveLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('documents.move.moving')}
                  </>
                ) : (
                  t('documents.move.moveToHere')
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
