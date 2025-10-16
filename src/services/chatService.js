import { api, GATEWAY_BASE_URL, getStoredTokens } from "../lib/api";

// REST calls align with backend static demo HTML, prefixed with chat-service behind gateway
export const chatService = {
  async sendMedia({ conversationId, senderId, files }) {
    const tokens = getStoredTokens();
    const headers = {};
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const form = new FormData();
    form.append('conversationId', conversationId);
    form.append('senderId', senderId);
    for (const f of files) form.append('files', f);
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/media`, {
      method: 'POST',
      headers,
      body: form
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async getMediaAroundByType(messageId, type = 'MEDIA', before = 5, after = 5) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({ type, before: String(before), after: String(after) }).toString();
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/around/${encodeURIComponent(messageId)}/by-type?${params}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async getLatestByType(conversationId, type = 'MEDIA', limit = 8, before = null) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({ type, limit: String(limit) });
    if (before) params.append('before', before);
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/conversations/${encodeURIComponent(conversationId)}/latest-by-type?${params.toString()}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data; // { messages: [], hasMore, nextCursor, type }
  },
  async getConversationsByUser() {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/user`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  // Groups
  async createGroup({ name, members }) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/groups`, {
      method: 'POST', headers, body: JSON.stringify({ name, members })
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async getGroup(groupId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/groups/${encodeURIComponent(groupId)}`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async updateGroupName(groupId, name) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/groups/${encodeURIComponent(groupId)}/name`, {
      method: 'PUT', headers, body: JSON.stringify({ name })
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async updateGroupAvatar(groupId, imageUrl) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/groups/${encodeURIComponent(groupId)}/avatar`, {
      method: 'PUT', headers, body: JSON.stringify({ imageUrl })
    });
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
  async removeMember(conversationId, userId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE', headers });
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
  async markRead(conversationId, lastMessageId = null) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    
    const params = new URLSearchParams({
      conversationId
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
  async getUnreadCounts() {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/unread`, { headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },
  async addReaction(messageId, emoji) {
    const tokens = getStoredTokens();
    const headers = {};
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const params = new URLSearchParams({ emoji });
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/${encodeURIComponent(messageId)}/reactions?${params.toString()}`, { 
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
  async removeReaction(messageId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/${encodeURIComponent(messageId)}/reactions`, { 
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
  async deleteForMe(messageId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/messages/${encodeURIComponent(messageId)}/delete`, { 
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
  async replyToMessage(conversationId, content, replyToMessageId) {
    const tokens = getStoredTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const params = new URLSearchParams({
      conversationId,
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
  async getMessagesForUser(conversationId, page = 0, size = 30) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({
      conversationId,
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
  async getConversationMessages(conversationId, limit = 20, before = null) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const params = new URLSearchParams({
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
  async markConversationAsRead(conversationId) {
    const tokens = getStoredTokens();
    const headers = {};
    if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/mark-read`, { 
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
  async getUnreadCounts() {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/unread-count`, { headers });
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
  },

  // Pin conversation for a user
  async pinConversation(conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/pin-conversation`, { 
      method: 'POST', 
      headers
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Unpin conversation for a user
  async unpinConversation(conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/unpin-conversation`, { 
      method: 'POST', 
      headers
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Mark conversation as unread for a user
  async markConversationAsUnread(conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/mark-unread`, { 
      method: 'POST', 
      headers
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Toggle notification settings for a user
  async toggleNotificationSettings(conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}/toggle-notifications`, { 
      method: 'POST', 
      headers
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json().catch(()=>null) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    return data;
  },

  // Delete group conversation (only by creator)
  async deleteGroupConversation(conversationId) {
    const tokens = getStoredTokens();
    const headers = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
    const res = await fetch(`${GATEWAY_BASE_URL}/chat-service/api/conversations/${encodeURIComponent(conversationId)}`, { 
      method: 'DELETE', 
      headers
    });
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


