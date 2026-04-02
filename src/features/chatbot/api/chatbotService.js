// Chatbot service for communicating with the AI backend through API Gateway
import { CHATBOT_BASE_URL, chatbotRequest, fetchWithAuthRefresh, getStoredTokens } from "@/lib/api";

class ChatbotService {
  buildUserHeaders() {
    const tokens = getStoredTokens();
    if (tokens?.userInfo?.userId) {
      return { "X-User-Id": tokens.userInfo.userId };
    }
    return {};
  }

  async sendMessage(question, conversationId = null, projectId = null) {
    try {
      const body = { question };
      if (conversationId) body.conversationId = conversationId;
      if (projectId) body.projectId = projectId;
      return await chatbotRequest("/api/ai/chat", {
        method: "POST",
        headers: this.buildUserHeaders(),
        body,
      });
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const response = await chatbotRequest("/api/ai/health");
      return {
        chatbot_ready: response?.status === "UP",
        status: response?.status,
      };
    } catch (error) {
      console.error("Error getting chatbot status:", error);
      throw error;
    }
  }

  async getHealth() {
    try {
      return await chatbotRequest("/api/ai/health");
    } catch (error) {
      console.error("Error getting chatbot health:", error);
      throw error;
    }
  }

  async sendMessageStream(question, onChunk, onEnd, onError, conversationId = null, projectId = null) {
    try {
      const tokens = getStoredTokens();
      const headers = { "Content-Type": "application/json" };
      if (tokens?.accessToken) {
        headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      if (tokens?.userInfo?.userId) {
        headers["X-User-Id"] = tokens.userInfo.userId;
      }

      const body = { question };
      if (conversationId) body.conversationId = conversationId;
      if (projectId) body.projectId = projectId;

      const response = await fetchWithAuthRefresh(`${CHATBOT_BASE_URL}/api/ai/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Streaming not supported in this environment");
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "chunk") {
              onChunk(data.content);
            } else if (data.type === "end") {
              onEnd();
              return;
            } else if (data.type === "error") {
              onError(data.error);
              return;
            }
          } catch (parseError) {
            console.error("Error parsing SSE data:", parseError);
          }
        }
      }
      onEnd();
    } catch (error) {
      console.error("Error in streaming:", error);
      onError(error.message);
    }
  }

  async getUserInfo() {
    const tokens = getStoredTokens();
    return {
      userId: tokens?.userInfo?.userId || null,
      fullName: tokens?.userInfo?.fullName || tokens?.userInfo?.name || "",
      email: tokens?.userInfo?.email || "",
    };
  }

  async getConversations() {
    try {
      const res = await chatbotRequest("/api/ai/conversations");
      return {
        conversations: res?.conversations || [],
        current_conversation: res?.conversations?.[0] || null
      };
    } catch (error) {
      console.error("Error getting conversations:", error);
      throw error;
    }
  }

  async getConversationMessages(conversationId) {
    try {
      const res = await chatbotRequest(`/api/ai/conversations/${conversationId}/messages`);
      return {
        success: true,
        messages: res?.messages || []
      };
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      throw error;
    }
  }

  async getMemory() {
    return {
      totalItems: 0,
      size: 0,
      conversations: 0,
      topics: [],
    };
  }

  async renameConversation(conversationId, newName) {
    try {
      return await chatbotRequest(`/api/ai/conversations/${conversationId}/rename?new_name=${encodeURIComponent(newName)}`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Error renaming conversation:", error);
      throw error;
    }
  }

  async switchConversation(conversationId) {
    return { success: true, conversationId };
  }

  async deleteConversation(conversationId) {
    try {
      return await chatbotRequest(`/api/ai/conversations/${conversationId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }

  async clearMemory() {
    try {
      return await chatbotRequest("/api/ai/memory/clear", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error clearing memory:", error);
      throw error;
    }
  }
}

export default new ChatbotService();
