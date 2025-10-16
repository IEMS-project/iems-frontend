import React, { useState, useEffect } from 'react';
import { FaCog, FaSave, FaSpinner, FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import chatbotService from '../../services/chatbotService';

const ChatbotSettings = ({ className = "" }) => {
  const [settings, setSettings] = useState({
    model: 'qwen2.5',
    temperature: 0.7,
    maxTokens: 2048,
    enableMemory: true,
    enableStreaming: true,
    language: 'vi',
    responseStyle: 'friendly'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
    checkStatus();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // TODO: Implement get settings API
      // const data = await chatbotService.getSettings();
      // setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const data = await chatbotService.getStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
      setError('Không thể kiểm tra trạng thái chatbot');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      // TODO: Implement save settings API
      // await chatbotService.saveSettings(settings);
      
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Cài đặt đã được lưu thành công');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = () => {
    if (!status) return 'text-gray-500';
    if (status.chatbot_ready) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (!status) return 'Đang kiểm tra...';
    if (status.chatbot_ready) return 'Hoạt động bình thường';
    return 'Có lỗi xảy ra';
  };

  if (loading) {
    return (
      <div className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <FaCog className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cài đặt Chatbot</h3>
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
      <div className="flex items-center gap-2 mb-4">
        <FaCog className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cài đặt Chatbot</h3>
      </div>

      {/* Status */}
      <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${status?.chatbot_ready ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        {status?.model && (
          <div className="text-xs text-gray-500">
            Model: {status.model} | Version: {status.version || 'N/A'}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <FaExclamationTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Model Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Cấu hình Model</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model
              </label>
              <select
                value={settings.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="qwen2.5">Qwen2.5</option>
                <option value="qwen2.5-7b">Qwen2.5-7B</option>
                <option value="qwen2.5-14b">Qwen2.5-14B</option>
                <option value="qwen2.5-32b">Qwen2.5-32B</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temperature: {settings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative (0)</span>
                <span>Balanced (1)</span>
                <span>Creative (2)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Tokens: {settings.maxTokens}
              </label>
              <input
                type="range"
                min="512"
                max="4096"
                step="256"
                value={settings.maxTokens}
                onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Short (512)</span>
                <span>Medium (2048)</span>
                <span>Long (4096)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Hành vi</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Bật Memory</div>
                <div className="text-xs text-gray-500">Lưu trữ lịch sử trò chuyện</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableMemory}
                  onChange={(e) => handleInputChange('enableMemory', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Streaming Response</div>
                <div className="text-xs text-gray-500">Hiển thị phản hồi theo thời gian thực</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableStreaming}
                  onChange={(e) => handleInputChange('enableStreaming', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Ngôn ngữ</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ngôn ngữ phản hồi
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="auto">Tự động</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phong cách phản hồi
              </label>
              <select
                value={settings.responseStyle}
                onChange={(e) => handleInputChange('responseStyle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="friendly">Thân thiện</option>
                <option value="professional">Chuyên nghiệp</option>
                <option value="casual">Thân mật</option>
                <option value="formal">Trang trọng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaSave className="w-4 h-4" />
            )}
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSettings;

