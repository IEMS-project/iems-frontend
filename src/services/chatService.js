import { api, GATEWAY_BASE_URL, getStoredTokens } from "../lib/api";

// REST calls align with backend static demo HTML, prefixed with chat-service behind gateway
export const chatService = {
  async getConversationsByUser(userId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/user/${encodeURIComponent(userId)}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async createConversation(payload) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type':'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async addMember(conversationId, userId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(userId)}`, { method: 'POST', headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async getMessages(conversationId, page=0, size=30) {
    const q = `conversationId=${encodeURIComponent(conversationId)}&page=${page}&size=${size}`;
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages?${q}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async sendDirectOnce({ senderId, recipientId, content }) {
    const q = `senderId=${encodeURIComponent(senderId)}&recipientId=${encodeURIComponent(recipientId)}&content=${encodeURIComponent(content)}`;
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/direct?${q}`, { method: 'POST', headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async getMessagesScroll(conversationId, before, limit, userId) {
    const q = new URLSearchParams({
      conversationId,
      limit: limit || 10,
      ...(before && { before }),
      ...(userId && { userId })
    });
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/scroll?${q}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async getConversationById(conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async getConversationMembers(conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/members`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async markRead(conversationId, userId, lastMessageId = null) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    
    const params = new URLSearchParams({
      conversationId,
      userId
    });
    if (lastMessageId) {
      params.append('lastMessageId', lastMessageId);
    }
    
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/read?${params}`, { 
      method: 'POST', 
      headers
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
      throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    }
    return res.ok;
  },
  async getUnreadCounts(userId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/unread/${encodeURIComponent(userId)}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async addReaction(messageId, userId, emoji) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/${encodeURIComponent(messageId)}/reactions`, { 
      method: 'POST', 
      headers, 
      body: JSON.stringify({ userId, emoji }) 
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
      throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    }
    return res.ok;
  },
  async removeReaction(messageId, userId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(userId)}`, { 
      method: 'DELETE', 
      headers 
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
      throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    }
    return res.ok;
  },
  async deleteForMe(messageId, userId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/${encodeURIComponent(messageId)}/delete?userId=${encodeURIComponent(userId)}`, { 
      method: 'POST', 
      headers
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
      throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    }
    return res.ok;
  },
  async recallMessage(messageId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/${encodeURIComponent(messageId)}/recall`, { 
      method: 'POST', 
      headers 
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
      throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    }
    return res.ok;
  },
  async pinMessage(conversationId, messageId) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/pin`, { 
      method: 'POST', 
      headers, 
      body: JSON.stringify({ messageId }) 
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
      throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    }
    return res.ok;
  },
  async unpinMessage(conversationId, messageId) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/unpin`, { 
      method: 'POST', 
      headers, 
      body: JSON.stringify({ messageId }) 
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
      throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    }
    return res.ok;
  },
  
  // Reply to message
  async replyToMessage(conversationId, senderId, content, replyToMessageId) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const params = new URLSearchParams({
      conversationId,
      senderId,
      content,
      replyToMessageId
    });
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/reply?${params}`, { 
      method: 'POST', 
      headers
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Get pinned messages
  async getPinnedMessages(conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/pinned?conversationId=${encodeURIComponent(conversationId)}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Get messages for user (with filtering)
  async getMessagesForUser(conversationId, userId, page = 0, size = 30) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({
      conversationId,
      userId,
      page: page.toString(),
      size: size.toString()
    });
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/for-user?${params}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Get paginated messages for conversation
  async getConversationMessages(conversationId, userId, limit = 20, before = null) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({
      userId,
      limit: limit.toString()
    });
    if (before) {
      params.append('before', before);
    }
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/conversations/${encodeURIComponent(conversationId)}/messages?${params}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Mark entire conversation as read
  async markConversationAsRead(conversationId, userId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/mark-read?userId=${encodeURIComponent(userId)}`, { 
      method: 'POST', 
      headers
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
      throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    }
    return res.ok;
  },

  // Get unread counts for all conversations
  async getUnreadCounts(userId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/unread-count?userId=${encodeURIComponent(userId)}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Get message by ID with neighbors for jump-to-message functionality
  async getMessageWithNeighbors(messageId, withNeighbors = true, neighborLimit = 10) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({
      withNeighbors: withNeighbors.toString(),
      neighborLimit: neighborLimit.toString()
    });
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/${encodeURIComponent(messageId)}?${params}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Search messages by text content
  async searchMessages(conversationId, keyword, page = 0, size = 20) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({
      conversationId,
      keyword,
      page: page.toString(),
      size: size.toString()
    });
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/search?${params}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Get messages around a specific message (for jump-to-message)
  async getMessagesAround(messageId, before = 5, after = 5) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({
      before: before.toString(),
      after: after.toString()
    });
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/around/${encodeURIComponent(messageId)}?${params}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Get messages between two message IDs (for gap filling)
  async getMessagesBetween(fromMessageId, toMessageId, conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({
      fromMessageId,
      toMessageId,
      conversationId
    });
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/between?${params}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  }
};

export const chatWs = {
  // In dev, connect directly to chat-service to ensure WebSocket upgrade works
  // Fallback to gateway path otherwise
  wsPath: (typeof window !== 'undefined' && window.location && window.location.port === '5173')
    ? 'http://localhost:8090/ws'
    : `${GATEWAY_BASE_URL.replace(/\/$/, '')}/chat-service/ws`,
  convoTopic: (id) => `/topic/conversations/${id}`,
  userTopic: (userId) => `/topic/user-updates/${userId}`,
  sendToConversation: (id) => `/app/conversations/${id}/send`,
  sendDirect: `/app/messages/send`,
  
  // New WebSocket endpoints for advanced features
  replyToMessage: (id) => `/app/conversations/${id}/reply`,
  addReaction: (id) => `/app/conversations/${id}/reaction`,
  deleteMessage: (id) => `/app/conversations/${id}/delete`,
  pinMessage: (id) => `/app/conversations/${id}/pin`,
  markAsRead: (id) => `/app/conversations/${id}/read`,
  markConversationAsRead: (id) => `/app/conversations/${id}/mark-read`,
  typingIndicator: (id) => `/app/conversations/${id}/typing`,
  replyingIndicator: (id) => `/app/conversations/${id}/replying`
};


