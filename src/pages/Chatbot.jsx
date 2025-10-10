import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import chatbotService from '../services/chatbotService';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentBotMessageId, setCurrentBotMessageId] = useState(null);
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      message: `# Xin chào! 👋

Tôi là **AI Assistant** của công ty, được hỗ trợ bởi **Qwen2.5** và công nghệ **RAG** (Retrieval-Augmented Generation).

## Tôi có thể giúp bạn:

- 📋 **Tìm hiểu quy định** nội bộ công ty
- 🔄 **Hướng dẫn quy trình** làm việc
- 📊 **Thông tin** về các chính sách
- ❓ **Trả lời câu hỏi** dựa trên tài liệu nội bộ

Bạn có câu hỏi gì không? Hãy thử hỏi tôi về:
- Quản lý nhân sự
- Quy định an ninh
- Môi trường làm việc
- Hoặc bất kỳ chủ đề nào khác!`,
      isUser: false,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (question) => {
    if (!question.trim()) return;

    const userMessage = {
      id: Date.now(),
      message: question,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Không tạo bot message placeholder ngay, chỉ set loading state
    const botMessageId = Date.now() + 1;
    setCurrentBotMessageId(botMessageId);
    setHasStartedStreaming(false);

    try {
      await chatbotService.sendMessageStream(
        question,
        // onChunk
        (chunk) => {
          setMessages(prev => {
            // Kiểm tra xem đã có bot message chưa
            const existingBotMessage = prev.find(msg => msg.id === botMessageId);
            
            if (existingBotMessage) {
              // Cập nhật message hiện có
              return prev.map(msg => 
                msg.id === botMessageId 
                  ? { ...msg, message: msg.message + chunk }
                  : msg
              );
            } else {
              // Tạo bot message mới với chunk đầu tiên
              const botMessage = {
                id: botMessageId,
                message: chunk,
                isUser: false,
                timestamp: new Date().toISOString()
              };
              return [...prev, botMessage];
            }
          });
          
          // Đánh dấu đã bắt đầu streaming và ẩn loading indicator
          if (!hasStartedStreaming) {
            setHasStartedStreaming(true);
            setCurrentBotMessageId(null);
          }
        },
        // onEnd
        () => {
          setIsLoading(false);
          setCurrentBotMessageId(null);
          setHasStartedStreaming(false);
        },
        // onError
        (error) => {
          console.error('Error in streaming:', error);
          // Tạo error message nếu chưa có bot message
          if (currentBotMessageId) {
            const errorMessage = {
              id: botMessageId,
              message: `Xin lỗi, có lỗi xảy ra: ${error}. Vui lòng thử lại sau.`,
              isUser: false,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
          } else {
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, message: `Xin lỗi, có lỗi xảy ra: ${error}. Vui lòng thử lại sau.` }
                : msg
            ));
          }
          setError(error);
          setIsLoading(false);
          setCurrentBotMessageId(null);
          setHasStartedStreaming(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Tạo error message nếu chưa có bot message
      if (currentBotMessageId) {
        const errorMessage = {
          id: botMessageId,
          message: `Xin lỗi, có lỗi xảy ra: ${error.message}. Vui lòng thử lại sau.`,
          isUser: false,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, message: `Xin lỗi, có lỗi xảy ra: ${error.message}. Vui lòng thử lại sau.` }
            : msg
        ));
      }
      setError(error.message);
      setIsLoading(false);
      setCurrentBotMessageId(null);
      setHasStartedStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={[{ label: "AI Assistant", to: "/chatbot" }]} />

      <Card>
        <CardHeader>
          <CardTitle>Chat với AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-full flex flex-col">


            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg.message}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                  />
                ))}

                {isLoading && currentBotMessageId && !hasStartedStreaming && (
                  <div className="flex gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          AI đang suy nghĩ...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error Display */}
              {error && (
                <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Lỗi: {error}
                  </p>
                </div>
              )}

              {/* Chat Input */}
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chatbot;
