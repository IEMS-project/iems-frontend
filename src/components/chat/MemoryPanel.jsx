import React, { useState, useEffect } from 'react';
import { FaBrain, FaTrash, FaEye, FaEyeSlash, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import chatbotService from '../../services/chatbotService';

const MemoryPanel = ({ className = "" }) => {
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadMemory();
  }, []);

  const loadMemory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatbotService.getMemory();
      setMemory(data);
    } catch (error) {
      console.error('Error loading memory:', error);
      setError('Không thể tải thông tin memory');
    } finally {
      setLoading(false);
    }
  };

  const handleClearMemory = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ memory? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setClearing(true);
      await chatbotService.clearMemory();
      setMemory(null);
      alert('Memory đã được xóa thành công');
    } catch (error) {
      console.error('Error clearing memory:', error);
      alert('Không thể xóa memory');
    } finally {
      setClearing(false);
    }
  };

  const formatMemorySize = (size) => {
    if (!size) return '0 KB';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch (error) {
      return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <FaBrain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Memory AI</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <FaSpinner className="w-4 h-4 animate-spin" />
            <span>Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FaBrain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Memory AI</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title={showDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết'}
        >
          {showDetails ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
        </button>
      </div>

      {error ? (
        <div className="text-center py-4">
          <FaExclamationTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 mb-3">{error}</p>
          <button
            onClick={loadMemory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : memory ? (
        <div className="space-y-4">
          {/* Memory Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Tổng số items</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {memory.totalItems || 0}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Kích thước</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatMemorySize(memory.size)}
              </div>
            </div>
          </div>

          {/* Memory Details */}
          {showDetails && (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cập nhật lần cuối</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(memory.lastUpdated)}
                </div>
              </div>

              {memory.conversations && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Cuộc trò chuyện</div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {memory.conversations} cuộc trò chuyện được lưu
                  </div>
                </div>
              )}

              {memory.topics && memory.topics.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Chủ đề chính</div>
                  <div className="flex flex-wrap gap-1">
                    {memory.topics.slice(0, 5).map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                    {memory.topics.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                        +{memory.topics.length - 5} khác
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClearMemory}
              disabled={clearing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {clearing ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaTrash className="w-4 h-4" />
              )}
              {clearing ? 'Đang xóa...' : 'Xóa Memory'}
            </button>
            <button
              onClick={loadMemory}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Làm mới
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FaBrain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Chưa có memory nào</p>
          <button
            onClick={loadMemory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tải lại
          </button>
        </div>
      )}
    </div>
  );
};

export default MemoryPanel;

