import React from 'react';
import { FaTrash, FaEdit, FaClock, FaComments } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete, 
  onEdit 
}) => {
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: vi 
      });
    } catch (error) {
      return 'Không xác định';
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'Cuộc trò chuyện mới';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div 
      className={`
        group relative px-3 py-2 cursor-pointer transition-all duration-200
        ${isActive 
          ? 'bg-gray-100 dark:bg-gray-700' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        }
      `}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {truncateText(conversation.name || conversation.title || 'Cuộc trò chuyện mới', 40)}
          </h4>
        </div>
        
        {/* Action buttons - show on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(conversation);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Chỉnh sửa"
          >
            <FaEdit className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Xóa"
          >
            <FaTrash className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
