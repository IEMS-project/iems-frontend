import React, { useState, useEffect } from "react";
import { documentService } from "../../services/documentService";

export default function MoveModal({ isOpen, onClose, moveItem, onMoveCompleted }) {
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: "Home", parentId: null }]);
  const [loading, setLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: null, name: "Home", parentId: null }]);
      loadFolders(null);
    }
  }, [isOpen]);

  const loadFolders = async (folderId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all folders and filter by parent
      const allFolders = await documentService.getAllFolders();
      const filteredFolders = allFolders.filter(f => f.parentId === folderId && f.id !== moveItem?.data?.id);
      
      setFolders(filteredFolders);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Không thể tải danh sách thư mục');
    } finally {
      setLoading(false);
    }
  };

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
      setError('Không thể truy cập thư mục con');
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
      setError('Không thể quay lại thư mục');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveHere = async () => {
    if (!moveItem || moveLoading) return;
    
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
      setError(err.message || 'Không thể di chuyển item');
    } finally {
      setMoveLoading(false);
    }
  };

  const getCurrentFolderName = () => {
    return breadcrumbs[breadcrumbs.length - 1].name;
  };

  if (!isOpen || !moveItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Move {moveItem.data.name} to {getCurrentFolderName()}
            </h2>
            
            {/* Breadcrumb */}
            <div className="flex items-center space-x-1 mt-2">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`text-sm ${
                      index === breadcrumbs.length - 1
                        ? "text-blue-600 font-medium"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
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
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={moveLoading}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Folders grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  className="group flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105"
                  disabled={loading}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-2 group-hover:bg-yellow-500 transition-colors">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-8 h-8 text-yellow-900"
                    >
                      <path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path>
                      <path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path>
                    </svg>
                  </div>
                  <span className="text-xs text-center text-gray-700 font-medium">
                    {folder.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Empty state */}
            {!loading && folders.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-400">
                    <path d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6z"></path>
                    <path d="M2 9h22v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"></path>
                  </svg>
                </div>
                <p className="text-gray-500">Không có thư mục con nào</p>
                <p className="text-sm text-gray-400">Chọn "Move to here" để di chuyển vào thư mục này</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={moveLoading}
              >
                Hủy
              </button>
              
              <button
                onClick={handleMoveHere}
                disabled={moveLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {moveLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang di chuyển...
                  </>
                ) : (
                  "Move to here"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
