// Chatbot service for communicating with the AI backend through API Gateway
import { CHATBOT_BASE_URL, chatbotRequest, fetchWithAuthRefresh, getStoredTokens } from "@/lib/api";

class ChatbotService {
  getConversationProjectId(conversation) {
    return conversation?.projectId || conversation?.project_id || null;
  }

  buildUserHeaders() {
    const tokens = getStoredTokens();
    if (tokens?.userInfo?.userId) {
      return { "X-User-Id": tokens.userInfo.userId };
    }
    return {};
  }

  async sendMessage(question, conversationId = null, projectId = null, selectedDocumentIds = []) {
    try {
      const body = { question };
      if (conversationId) body.conversationId = conversationId;
      if (projectId) body.projectId = projectId;
      if (selectedDocumentIds?.length) body.selectedDocumentIds = selectedDocumentIds;
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

  async sendMessageStream(question, onChunk, onEnd, onError, conversationId = null, projectId = null, selectedDocumentIds = []) {
    try {
      const tokens = getStoredTokens();
      const headers = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      };
      if (tokens?.accessToken) {
        headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      if (tokens?.userInfo?.userId) {
        headers["X-User-Id"] = tokens.userInfo.userId;
      }

      const body = { question };
      if (conversationId) body.conversationId = conversationId;
      if (projectId) body.projectId = projectId;
      if (selectedDocumentIds?.length) body.selectedDocumentIds = selectedDocumentIds;

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
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const normalized = buffer.replace(/\r\n/g, "\n");
        const events = normalized.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventText of events) {
          const dataLines = eventText
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart());

          if (!dataLines.length) continue;

          const payload = dataLines.join("\n");
          try {
            const data = JSON.parse(payload);
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
            console.error("Error parsing SSE event:", parseError, payload);
          }
        }
      }

      const remaining = decoder.decode();
      if (remaining) {
        buffer += remaining;
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

  async getConversations(projectId = null) {
    try {
      const res = await chatbotRequest("/api/ai/conversations");
      const allConversations = res?.conversations || [];
      const conversations = projectId
        ? allConversations.filter((conversation) => this.getConversationProjectId(conversation) === projectId)
        : allConversations;
      return {
        conversations,
        current_conversation: conversations[0] || null,
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
