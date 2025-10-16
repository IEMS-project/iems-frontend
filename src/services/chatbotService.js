// Chatbot service for communicating with the AI backend through API Gateway
import { api } from '../lib/api.js';

class ChatbotService {
  async sendMessage(question, conversationId = null) {
    try {
      return await api.sendChatMessage(question, conversationId);
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      return await api.getChatbotStatus();
    } catch (error) {
      console.error('Error getting chatbot status:', error);
      throw error;
    }
  }

  async getHealth() {
    try {
      return await api.getChatbotHealth();
    } catch (error) {
      console.error('Error getting chatbot health:', error);
      throw error;
    }
  }

  async sendMessageStream(question, onChunk, onEnd, onError, conversationId = null) {
    try {
      return await api.sendChatMessageStream(question, onChunk, onEnd, onError, conversationId);
    } catch (error) {
      console.error('Error in streaming:', error);
      onError(error.message);
    }
  }

  // Additional chatbot methods
  async getUserInfo() {
    try {
      return await api.getUserInfo();
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  async getConversations() {
    try {
      return await api.getConversations();
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId) {
    try {
      return await api.getConversationMessages(conversationId);
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  async getMemory() {
    try {
      return await api.getMemory();
    } catch (error) {
      console.error('Error getting memory:', error);
      throw error;
    }
  }

  async renameConversation(conversationId, newName) {
    try {
      return await api.renameConversation(conversationId, newName);
    } catch (error) {
      console.error('Error renaming conversation:', error);
      throw error;
    }
  }

  async switchConversation(conversationId) {
    try {
      return await api.switchConversation(conversationId);
    } catch (error) {
      console.error('Error switching conversation:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId) {
    try {
      return await api.deleteConversation(conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  async clearMemory() {
    try {
      return await api.clearMemory();
    } catch (error) {
      console.error('Error clearing memory:', error);
      throw error;
    }
  }
}

export default new ChatbotService();
