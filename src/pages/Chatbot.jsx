import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import ConversationManager from '../components/chat/ConversationManager';
import chatbotService from '../services/chatbotService';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentBotMessageId, setCurrentBotMessageId] = useState(null);
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isCreatingNewConversation, setIsCreatingNewConversation] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [refreshConversations, setRefreshConversations] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message only when a conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      // Load conversation messages - don't add welcome message for existing conversations
      setMessages([]);
    } else if (isCreatingNewConversation) {
      // For new conversations, show empty messages
      setMessages([]);
    } else {
      // No conversation selected - show empty messages for welcome screen
      setMessages([]);
    }
  }, [activeConversationId, isCreatingNewConversation]);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        // Load conversations and set active conversation if exists
        const data = await chatbotService.getConversations();
        if (data && data.current_conversation) {
          setActiveConversationId(data.current_conversation.id);
          // Load messages for current conversation
          await handleConversationSelect(data.current_conversation.id);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
  }, []);

  const handleConversationSelect = async (conversationId) => {
    setActiveConversationId(conversationId);
    setIsCreatingNewConversation(false); // Reset flag khi chọn conversation khác
    setIsLoadingConversation(true); // Set loading state
    setMessages([]);

    try {
      // Load conversation messages from API
      const response = await chatbotService.getConversationMessages(conversationId);
      console.log('Conversation messages response:', response);

      if (response.success && response.turns && response.turns.length > 0) {
        // Handle backend response with turns structure (ưu tiên)
        const formattedMessages = [];
        response.turns.forEach((turn, index) => {
          // Add user message
          formattedMessages.push({
            id: `turn_${index}_user_${Date.now()}`,
            message: turn.question,
            isUser: true,
            timestamp: turn.timestamp || new Date().toISOString()
          });
          // Add bot message
          formattedMessages.push({
            id: `turn_${index}_bot_${Date.now()}`,
            message: turn.answer,
            isUser: false,
            timestamp: turn.timestamp || new Date().toISOString()
          });
        });
        console.log('Formatted messages from turns:', formattedMessages);
        setMessages(formattedMessages);
      } else if (response.success && response.messages && response.messages.length > 0) {
        // Convert backend messages to frontend format
        const formattedMessages = response.messages.map(msg => ({
          id: msg.id || Date.now() + Math.random(),
          message: msg.content || msg.message,
          isUser: msg.role === 'user' || msg.isUser || false,
          timestamp: msg.timestamp || msg.created_at || new Date().toISOString()
        }));
        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      // Fallback welcome message

    } finally {
      setIsLoadingConversation(false); // Always clear loading state
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setIsCreatingNewConversation(true); // Đánh dấu đang tạo conversation mới
    setMessages([]); // Clear messages, EmptyChat will be shown
  };

  const handleSendMessage = async (question) => {
    if (!question.trim()) return;

    // If no conversation is active, start creating a new one
    if (!activeConversationId && !isCreatingNewConversation) {
      setIsCreatingNewConversation(true);
    }

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

          // Refresh conversation list after first message to show new conversation
          if (isCreatingNewConversation) {
            setRefreshConversations(prev => prev + 1);
            // Keep isCreatingNewConversation = true to maintain current chat screen
            // Don't set activeConversationId or reset isCreatingNewConversation
          }
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
          setIsCreatingNewConversation(false); // Reset flag khi có lỗi
        },
        // conversationId - để null để backend tự động tạo conversation mới khi cần
        // Nếu đang tạo conversation mới hoặc không có active conversation, để null
        isCreatingNewConversation || !activeConversationId ? null : activeConversationId
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
      setIsCreatingNewConversation(false); // Reset flag khi có lỗi
    }
  };

  return (
    <div className="h-[calc(100vh-35px)] overflow-hidden flex flex-col space-y-6">
      <PageHeader breadcrumbs={[{ label: "AI Assistant", to: "/chatbot" }]} />

      <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'w-80' : 'w-16'} transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col hidden md:flex`}>
          <ConversationManager
            activeConversationId={activeConversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            showSidebar={showSidebar}
            refreshTrigger={refreshConversations}
            className="h-full"
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)}></div>
            <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <ConversationManager
                activeConversationId={activeConversationId}
                onConversationSelect={handleConversationSelect}
                onNewConversation={handleNewConversation}
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
                showSidebar={showSidebar}
                refreshTrigger={refreshConversations}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {/* Mobile menu button - Only show on mobile */}
          <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Messages Area or Empty State */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeConversationId || isCreatingNewConversation ? (
              isLoadingConversation ? (
                /* Loading State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Đang tải cuộc trò chuyện...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages Container */}
                  <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6">
                    {/* Show question for new conversation or no conversation - only when no messages */}
                    {(isCreatingNewConversation || (!activeConversationId && !isCreatingNewConversation)) && messages.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="text-center mb-8">
                          <h1 className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-8">
                            Bạn dự định làm gì hôm nay?
                          </h1>
                        </div>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg.message}
                        isUser={msg.isUser}
                        timestamp={msg.timestamp}
                      />
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && currentBotMessageId && !hasStartedStreaming && (
                      <div className="flex gap-3">
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
                    <div className="mx-4 md:mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Lỗi: {error}
                      </p>
                    </div>
                  )}

                  {/* Chat Input */}
                  <div className="p-4 md:p-6">
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                    />
                  </div>
                </>
              )
            ) : (
              /* No conversation selected - show welcome message with same logic */
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6">
                  {/* Show question for no conversation - only when no messages */}
                  {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                      <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-8">
                          Bạn dự định làm gì hôm nay?
                        </h1>
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg.message}
                      isUser={msg.isUser}
                      timestamp={msg.timestamp}
                    />
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && currentBotMessageId && !hasStartedStreaming && (
                    <div className="flex gap-3">
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
                  <div className="mx-4 md:mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Lỗi: {error}
                    </p>
                  </div>
                )}

                {/* Chat Input */}
                <div className="p-4 md:p-6">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
