// Chatbot service for communicating with the AI backend
// Use proxy path in development, direct URL in production
const CHATBOT_BASE_URL = import.meta.env.DEV ? "http://localhost:8000" : "/api/chatbot";

class ChatbotService {
  async sendMessage(question) {
    try {
      const response = await fetch(`${CHATBOT_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const response = await fetch(`${CHATBOT_BASE_URL}/api/status`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting chatbot status:', error);
      throw error;
    }
  }

  async getHealth() {
    try {
      const response = await fetch(`${CHATBOT_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting chatbot health:', error);
      throw error;
    }
  }

  async sendMessageStream(question, onChunk, onEnd, onError) {
    try {
      const response = await fetch(`${CHATBOT_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'text/plain'
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk') {
                onChunk(data.content);
              } else if (data.type === 'end') {
                onEnd();
                return;
              } else if (data.type === 'error') {
                onError(data.error);
                return;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming:', error);
      onError(error.message);
    }
  }
}

export default new ChatbotService();
