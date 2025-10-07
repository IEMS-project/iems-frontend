import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import { userService } from "../services/userService";
import { chatService, chatWs } from "../services/chatService";
import { UnreadCountsProvider, useUnreadCounts } from "../context/UnreadCountsContext";
import { Client } from "@stomp/stompjs";
import { getStoredTokens } from "../lib/api";
import CreateGroupModal from "../components/messages/CreateGroupModal";
import PinnedMessages from "../components/messages/PinnedMessages";
import MessageSearch from "../components/messages/MessageSearch";
import GroupMembersModal from "../components/messages/GroupMembersModal";
import EmptyChat from "../components/messages/EmptyChat";
import ConversationList from "../components/messages/ConversationList";
import ChatArea from "../components/messages/ChatArea";


// Utility function to generate unique message keys
function generateMessageKey(message, index) {
    // Priority: _id (from MongoDB) > id (from server) > localId (client-generated) > temp index
    if (message._id) return message._id;
    if (message.id && !message.id.startsWith('temp-')) return message.id;
    if (message.localId) return message.localId;
    return `temp-${index}-${Date.now()}`;
}

// Utility function to generate local ID for optimistic messages
function generateLocalId() {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function Messages() {
    const [allUsers, setAllUsers] = useState([]);
    const [currentUserId, setCurrentUserId] = useState("");
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [addMemberInput, setAddMemberInput] = useState("");
    // removed unused directTarget state
    const [pendingDirect, setPendingDirect] = useState(false);
    const [selectedPeerId, setSelectedPeerId] = useState(null);
    const [content, setContent] = useState("");
    const lastMessagesByConvRef = useRef({});
    const [openCreateGroup, setOpenCreateGroup] = useState(false);
    const [uiTick, setUiTick] = useState(0);
    const selectedConversationIdRef = useRef(null);
    // local fallback state for backwards compatibility (mostly unused now)
    const [unreadByConv, setUnreadByConv] = useState({});
    const [shouldPreserveScroll, setShouldPreserveScroll] = useState(false);
    const scrollPreserveData = useRef({ prevScrollHeight: 0, prevScrollTop: 0 });

    // New states for advanced features
    const [replyingTo, setReplyingTo] = useState(null);
    const [showPinnedMessages, setShowPinnedMessages] = useState(false);
    const [showMessageSearch, setShowMessageSearch] = useState(false);
    const [showGroupMembers, setShowGroupMembers] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const tempSendingRef = useRef({});

    // Pin message states
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const pinnedMessagesBannerRef = useRef(null);
    const pinnedMessagesModalRef = useRef(null);

    // Message deduplication - track loaded message IDs
    const loadedMessageIdsRef = useRef(new Set());

    // Pagination states
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [loadingNewerMessages, setLoadingNewerMessages] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [newerCursor, setNewerCursor] = useState(null);
    // Bi-directional lazy flags when using jump-to-message block loading
    const [hasMoreBefore, setHasMoreBefore] = useState(true);
    const [hasMoreAfter, setHasMoreAfter] = useState(true);
    // Jump-to-message mode flag
    const [isJumpMode, setIsJumpMode] = useState(false);

    // Use global unread counts context
    // We'll wrap this component in UnreadCountsProvider at export
    const { unreadCounts: unreadCountsCtx, setAll: setAllUnread, setCount: setUnreadCount, increment: incrementUnread, reset: resetUnread } = useUnreadCounts();
    const [globalUnreadCounts, setGlobalUnreadCounts] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});

    const stompRef = useRef(null);
    const convoSubRef = useRef(null);
    const userSubRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    function connectWS(onConnected) {
        if (stompRef.current && stompRef.current.connected) {
            onConnected && onConnected();
            return;
        }
        const tokens = getStoredTokens();
        const accessToken = tokens?.accessToken;
        const wsUrl = (chatWs.wsPath || '').replace(/^http/, 'ws');
        const client = new Client({
            brokerURL: wsUrl,
            reconnectDelay: 2000,
            debug: () => { },
            connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        });
        client.onConnect = () => { onConnected && onConnected(); };
        client.onStompError = () => { };
        client.activate();
        stompRef.current = client;
    }

    function subscribeConversation(conversationId) {
        console.log('🔌 Subscribing to conversation WebSocket:', conversationId);
        connectWS(() => {
            // Unsubscribe from previous conversation
            if (convoSubRef.current) {
                console.log('🔌 Unsubscribing from previous conversation');
                convoSubRef.current.unsubscribe();
                convoSubRef.current = null;
            }

            // Subscribe to new conversation
            convoSubRef.current = stompRef.current.subscribe(chatWs.convoTopic(conversationId), (message) => {
                try {
                    const payload = JSON.parse(message.body);
                    // Ensure typing events carry the current conversationId if missing
                    if (payload && payload.event === 'typing' && !payload.conversationId) {
                        payload.conversationId = conversationId;
                    }
                    console.log('📨 Received conversation message:', payload);
                    handleIncoming(payload);
                } catch (e) {
                    console.error('Error parsing conversation message:', e); console.debug(e);
                }
            });
            console.log('🔌 Successfully subscribed to conversation:', conversationId);
        });
    }

    function subscribeUser(userId) {
        connectWS(() => {
            if (userSubRef.current) { userSubRef.current.unsubscribe(); userSubRef.current = null; }
            userSubRef.current = stompRef.current.subscribe(chatWs.userTopic(userId), (message) => {
                try {
                    const payload = JSON.parse(message.body);
                    if (!payload) return;
                    if (payload.event === 'conversation_created') {
                        loadConversations(userId);
                    } else if (payload.event === 'conversation_deleted') {
                        // Handle group deletion
                        console.log('🗑️ Group conversation deleted:', payload.conversationId);
                        // Remove from conversations list
                        setConversations(prev => prev.filter(c => c.id !== payload.conversationId));
                        // If the deleted conversation is currently selected, clear selection
                        if (selectedConversationIdRef.current === payload.conversationId) {
                            setSelectedConversationId(null);
                            setMessages([]);
                        }
                        // Clear unread counts for deleted conversation
                        setUnreadCounts(prev => {
                            const updated = { ...prev };
                            delete updated[payload.conversationId];
                            return updated;
                        });
                        setGlobalUnreadCounts(prev => {
                            const updated = { ...prev };
                            delete updated[payload.conversationId];
                            return updated;
                        });
                        setUnreadByConv(prev => {
                            const updated = { ...prev };
                            delete updated[payload.conversationId];
                            return updated;
                        });
                        try { resetUnread(payload.conversationId); } catch (e) { console.debug(e); }
            } else if (payload.event === 'message') {
                        if (payload.conversationId && typeof payload.content === 'string') {
                            lastMessagesByConvRef.current[payload.conversationId] = {
                                content: payload.content,
                                senderId: payload.senderId,
                                timestamp: payload.timestamp || payload.sentAt || new Date().toISOString(),
                                type: payload.type || 'TEXT'
                            };
                            setUiTick(t => t + 1);

                            const isForOpen = payload.conversationId === selectedConversationIdRef.current;
                            const isMine = payload.senderId === currentUserId;

                            if (isForOpen) {
                                // For open conversation, rely on conversation topic handler to render.
                                // Only manage unread counters and mark-as-read.
                                try { resetUnread(payload.conversationId); } catch (e) { console.debug(e); }
                                (async () => {
                                    try { await chatService.markConversationAsRead(payload.conversationId); } catch (e) { console.debug(e); }
                                })();
                            } else if (!isMine) {
                                // If not viewing and not my message -> increment unread badge
                                try { incrementUnread(payload.conversationId, 1); } catch (e) { console.debug(e); }
                                setUnreadCounts(prev => ({ ...prev, [payload.conversationId]: (prev[payload.conversationId] || 0) + 1 }));
                                setGlobalUnreadCounts(prev => ({ ...prev, [payload.conversationId]: (prev[payload.conversationId] || 0) + 1 }));
                                setUnreadByConv(prev => ({ ...prev, [payload.conversationId]: (prev[payload.conversationId] || 0) + 1 }));
                            }
                        }
            } else if (payload.event === 'conversation_meta_updated') {
                const { conversationId, name, avatarUrl, updatedAt } = payload;
                if (conversationId) {
                    setConversations(prev => prev.map(c => c.id === conversationId ? {
                        ...c,
                        name: name !== undefined ? name : c.name,
                        avatarUrl: avatarUrl !== undefined ? avatarUrl : c.avatarUrl,
                        updatedAt: updatedAt || c.updatedAt
                    } : c));
                    setUiTick(t => t + 1);
                }
            }
                } catch (_e) { }
            });
        });
    }

    function handleIncoming(msg) {
        if (!msg) return;

        console.log('📨 Received WebSocket message:', msg);

        // Normalize message id field if backend sends messageId
        if (msg && !msg.id && msg.messageId) {
            try { msg.id = msg.messageId; } catch (_e) { }
        }

        // Handle different event types
        if (msg.event) {
            switch (msg.event) {
                case 'typing':
                    // Only handle typing for current conversation
                    if (msg.conversationId === selectedConversationIdRef.current) {
                        handleTypingEvent(msg);
                    }
                    return;
                case 'reaction_added':
                case 'reaction_removed':
                case 'message_recalled':
                    // Only handle message updates for current conversation
                    if (msg.conversationId === selectedConversationIdRef.current) {
                        handleWSMessageUpdate(msg);
                    }
                    return;
                case 'message_pinned':
                case 'message_unpinned':
                    handlePinMessageEvent(msg);
                    return;
                case 'messages_read':
                    handleReadStatusUpdate(msg);
                    return;
                case 'message':
                    handleNewMessageEvent(msg);
                    return;
                case 'conversation_updated':
                    handleConversationUpdate(msg);
                    return;
                case 'message_deleted_for_user':
                    // Only handle delete for current conversation
                    if (msg.conversationId === selectedConversationIdRef.current) {
                        handleDeleteForUserEvent(msg);
                    }
                    return;
            }
        }

        // Handle regular message updates
        if (msg.conversationId) {
            lastMessagesByConvRef.current[msg.conversationId] = {
                content: msg.content,
                senderId: msg.senderId,
                timestamp: msg.timestamp || msg.sentAt || new Date().toISOString(),
                type: msg.type || 'TEXT'
            };
            setUiTick(t => t + 1);

            const isForOpen = msg.conversationId === selectedConversationIdRef.current;
            const isMine = msg.senderId === currentUserId;

            // Update unread count for new messages using global context
            if (!isMine) {
                if (isForOpen) {
                    // If user is viewing this conversation, call mark-as-read and reset unread immediately
                    console.log('📖 Auto-marking message as read for current conversation');
                    // optimistic reset in UI
                    resetUnread(msg.conversationId);
                    setUnreadCounts(prev => ({ ...prev, [msg.conversationId]: 0 }));
                    setGlobalUnreadCounts(prev => ({ ...prev, [msg.conversationId]: 0 }));
                    setUnreadByConv(prev => ({ ...prev, [msg.conversationId]: 0 }));
                    // call backend to persist
                    (async () => {
                        try {
                            await chatService.markConversationAsRead(msg.conversationId);
                        } catch (e) {
                            console.error('Error auto-marking conversation as read:', e);
                        }
                    })();
                } else {
                    // If user is not viewing this conversation, increment unread count
                    console.log('🔢 Incrementing unread count for conversation:', msg.conversationId);
                    incrementUnread(msg.conversationId, 1);
                    setUnreadCounts(prev => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] || 0) + 1 }));
                    setGlobalUnreadCounts(prev => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] || 0) + 1 }));
                    setUnreadByConv(prev => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] || 0) + 1 }));
                }
            }
        }

        // Only process message updates for current conversation
        if (msg.conversationId !== selectedConversationIdRef.current) return;

        // Validate message before processing - skip invalid messages
        const msgId = msg.id || msg._id || msg.messageId;
        if (!msgId || msgId.startsWith('temp-') || msgId.startsWith('local-')) {
            console.log('⚠️ Skipping message without valid ID:', msgId);
            return;
        }

        // Skip messages with invalid senderId (like "U" or "unknown")
        if (!msg.senderId || msg.senderId === 'U' || msg.senderId === 'unknown' || msg.senderId.length < 3) {
            console.log('⚠️ Skipping message with invalid senderId:', msg.senderId);
            return;
        }

        // Skip messages without content or with empty content
        if (!msg.content || msg.content.trim() === '') {
            console.log('⚠️ Skipping message without content');
            return;
        }

        // Handle regular message - replace optimistic message if it exists
        console.log('💬 Processing message for current conversation:', msg.conversationId);
        setMessages(prev => {
            const isMine = msg.senderId === currentUserId;

            // If this is my message, try to replace the optimistic message
            if (isMine) {
                // Find optimistic message by localId or content match
                const optimisticIndex = prev.findIndex(m =>
                    (m.localId && m.senderId === msg.senderId && m.content === msg.content) ||
                    (m.isOptimistic && m.senderId === msg.senderId && m.content === msg.content)
                );

                if (optimisticIndex >= 0) {
                    // Replace optimistic message with real message
                    const newMessages = [...prev];
                    const normalized = {
                        ...msg,
                        id: msgId || prev[optimisticIndex].localId,
                        sentAt: msg.sentAt || msg.timestamp || new Date().toISOString(),
                        timestamp: msg.timestamp || msg.sentAt || new Date().toISOString(),
                        localId: prev[optimisticIndex].localId
                    };
                    newMessages[optimisticIndex] = normalized;

                    // Add to loaded message IDs
                    if (msgId) {
                        loadedMessageIdsRef.current.add(msgId);
                    }

                    console.log('✅ Replaced optimistic message with real message');
                    // Scroll to bottom for new messages
                    setTimeout(() => scrollToBottom(), 100);
                    return newMessages;
                }
            }

            // Check for duplicate in current messages
            const exists = prev.find(m => {
                const existingId = m.id || m._id;
                return existingId === msgId && existingId && !existingId.startsWith('temp-') && !existingId.startsWith('local-');
            });

            if (exists) {
                console.log('⚠️ Duplicate message (in current state), skipping');
                return prev;
            }

            // Add new message and scroll to bottom
            console.log('➕ Adding new message to current conversation');

            // Add to loaded message IDs
            if (msgId) {
                loadedMessageIdsRef.current.add(msgId);
            }

            const normalized = {
                ...msg,
                id: msgId,
                sentAt: msg.sentAt || msg.timestamp || new Date().toISOString(),
                timestamp: msg.timestamp || msg.sentAt || new Date().toISOString()
            };
            // Ensure chronological order after append
            const newMessages = [...prev, normalized].sort((a, b) => {
                const ta = new Date(a.sentAt || a.timestamp).getTime();
                const tb = new Date(b.sentAt || b.timestamp).getTime();
                return ta - tb;
            });
            setTimeout(() => scrollToBottom(), 100);
            return newMessages;
        });
    }

    function handleDeleteForUserEvent(msg) {
        if (msg.conversationId !== selectedConversationIdRef.current) return;

        // Update message to show it's deleted for this user
        setMessages(prev => {
            const updated = prev.map(m => {
                if ((m.id || m._id) === msg.messageId) {
                    const deletedForUsers = m.deletedForUsers || [];
                    if (!deletedForUsers.includes(msg.userId)) {
                        return {
                            ...m,
                            deletedForUsers: [...deletedForUsers, msg.userId]
                        };
                    }
                }
                return m;
            });

            // Recompute and update last message preview for this conversation excluding deleted-for-current-user
            try {
                const visible = updated.filter(mm => {
                    const dfu = mm.deletedForUsers || [];
                    return !dfu.includes(currentUserId);
                });
                const lastMsg = visible[visible.length - 1];
                lastMessagesByConvRef.current[msg.conversationId] = lastMsg
                    ? {
                        content: lastMsg.recalled ? 'Tin nhắn đã được thu hồi' : (lastMsg.content || ''),
                        senderId: lastMsg.senderId,
                        timestamp: lastMsg.sentAt || lastMsg.timestamp || new Date().toISOString(),
                        type: (lastMsg.type || 'TEXT')
                    }
                    : '';
                setUiTick(t => t + 1);
            } catch (_e) { }

            return updated;
        });
    }

    function handleTypingEvent(msg) {
        if (msg.conversationId !== selectedConversationIdRef.current) return;
        const { userId, isTyping } = msg;
        if (userId === currentUserId) return;

        setTypingUsers(prev => {
            const next = { ...prev };
            if (isTyping) {
                next[userId] = true;
                // Auto-remove after 3 seconds
                setTimeout(() => {
                    setTypingUsers(current => {
                        const updated = { ...current };
                        delete updated[userId];
                        return updated;
                    });
                }, 3000);
            } else {
                delete next[userId];
            }
            return next;
        });
    }

    function handleWSMessageUpdate(msg) {
        // Update message list if we're on this conversation
        if (msg.conversationId === selectedConversationIdRef.current) {
            setMessages(prev => {
                return prev.map(m =>
                    (m.id || m._id) === msg.messageId ? { ...m, ...msg.message } : m
                );
            });
        }

        // If a message was recalled, immediately update sidebar last message preview
        if (msg.event === 'message_recalled') {
            try {
                lastMessagesByConvRef.current[msg.conversationId] = {
                    content: 'Tin nhắn đã được thu hồi',
                    senderId: msg.senderId,
                    timestamp: msg.timestamp || msg.sentAt || new Date().toISOString(),
                    type: 'TEXT'
                };
                setUiTick(t => t + 1);
            } catch (_e) { }
        }
    }

    function handlePinMessageEvent(msg) {
        console.log('📌 Pin message event received:', msg);

        if (msg.conversationId !== selectedConversationIdRef.current) return;

        if (msg.event === 'message_pinned') {
            // Add to pinned messages list using functional update to avoid stale state.
            setPinnedMessages(prev => {
                const exists = prev.find(p => (p.id || p._id) === msg.messageId);
                if (exists) return prev;
                const next = [...prev, msg.message];
                // Notify banner and modal refs immediately with the new list for realtime feel
                try { pinnedMessagesBannerRef.current?.updatePinnedMessages(next); } catch (_) { }
                try { pinnedMessagesModalRef.current?.updatePinnedMessages(next); } catch (_) { }
                return next;
            });

            // Update message in messages list
            setMessages(prev => prev.map(m =>
                (m.id || m._id) === msg.messageId
                    ? { ...m, pinned: true, pinnedBy: msg.pinnedBy, pinnedAt: msg.pinnedAt }
                    : m
            ));
        } else if (msg.event === 'message_unpinned') {
            // Remove from pinned messages list, also notify banner via updater
            setPinnedMessages(prev => {
                const next = prev.filter(p => (p.id || p._id) !== msg.messageId);
                try { pinnedMessagesBannerRef.current?.updatePinnedMessages(next); } catch (_) { }
                try { pinnedMessagesModalRef.current?.updatePinnedMessages(next); } catch (_) { }
                return next;
            });

            // Update message in messages list
            setMessages(prev => prev.map(m =>
                (m.id || m._id) === msg.messageId
                    ? { ...m, pinned: false, pinnedBy: null, pinnedAt: null }
                    : m
            ));
        }
    }

    function handleReadStatusUpdate(msg) {
        console.log('📖 Read status update received:', msg);

        // Update unread count for the conversation
        if (msg.conversationId && typeof msg.unreadCount === 'number') {
            setUnreadCount(msg.conversationId, msg.unreadCount);
            setUnreadByConv(prev => ({ ...prev, [msg.conversationId]: msg.unreadCount }));
            setGlobalUnreadCounts(prev => ({ ...prev, [msg.conversationId]: msg.unreadCount }));
            console.log('🔢 Updated unread count from read status:', msg.conversationId, '=', msg.unreadCount);
        }
    }

    function handleNewMessageEvent(msg) {
        console.log('💬 New message event received:', msg);

        // Update unread count from the message event
        if (msg.conversationId && typeof msg.unreadCount === 'number') {
            setUnreadCount(msg.conversationId, msg.unreadCount);
            setUnreadByConv(prev => ({ ...prev, [msg.conversationId]: msg.unreadCount }));
            setGlobalUnreadCounts(prev => ({ ...prev, [msg.conversationId]: msg.unreadCount }));
            console.log('🔢 Updated unread count from message event:', msg.conversationId, '=', msg.unreadCount);
        }

        // Update last message content
        if (msg.conversationId && (msg.content || msg.event === 'message_recalled')) {
            lastMessagesByConvRef.current[msg.conversationId] = {
                content: msg.event === 'message_recalled' ? 'Tin nhắn đã được thu hồi' : msg.content,
                senderId: msg.senderId,
                timestamp: msg.timestamp || msg.sentAt || new Date().toISOString(),
                type: msg.type || 'TEXT'
            };
            console.log('📝 Updated last message from message event:', msg.conversationId);
            setUiTick(t => t + 1);
        }
    }

    function handleConversationUpdate(msg) {
        console.log('📋 Conversation update received:', msg);

        // Update conversation data when there's a new message
        if (msg.conversationId) {
            // Update last message
            if (msg.lastMessage && (msg.lastMessage.content || msg.lastMessage.recalled)) {
                lastMessagesByConvRef.current[msg.conversationId] = {
                    content: msg.lastMessage.recalled ? 'Tin nhắn đã được thu hồi' : msg.lastMessage.content,
                    senderId: msg.lastMessage.senderId,
                    timestamp: msg.lastMessage.timestamp || msg.lastMessage.sentAt || msg.updatedAt || new Date().toISOString()
                };
                console.log('📝 Updated last message for conversation:', msg.conversationId);
            }

            // Update unread count - this is the key for realtime badge updates
            if (typeof msg.unreadCount === 'number') {
                setUnreadCount(msg.conversationId, msg.unreadCount);
                setUnreadByConv(prev => ({ ...prev, [msg.conversationId]: msg.unreadCount }));
                setGlobalUnreadCounts(prev => ({ ...prev, [msg.conversationId]: msg.unreadCount }));
                console.log('🔢 Updated unread count for conversation:', msg.conversationId, '=', msg.unreadCount);
            }

            // Update conversation order based on updatedAt
            if (msg.updatedAt) {
                setConversations(prev => {
                    const updated = prev.map(conv => {
                        if (conv.id === msg.conversationId) {
                            return {
                                ...conv,
                                updatedAt: msg.updatedAt,
                                lastMessage: msg.lastMessage,
                                unreadCount: msg.unreadCount
                            };
                        }
                        return conv;
                    });
                    // Sort by updatedAt descending
                    return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                });
                console.log('🔄 Reordered conversations by updatedAt');
            }

            setUiTick(t => t + 1);
        }
    }

    async function loadConversations(userId) {
        try {
            const data = await chatService.getConversationsByUser();
            const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
            setConversations(list);

            // Initialize unread counts and last messages from the enhanced API response
            const initialUnreadCounts = {};
            for (const c of list) {
                if (c?.id) {
                    // Set unread count from API response
                    initialUnreadCounts[c.id] = c.unreadCount || 0;

                    // Set last message from API response
                    if (c.lastMessage && c.lastMessage.content) {
                        lastMessagesByConvRef.current[c.id] = {
                            content: c.lastMessage.content,
                            senderId: c.lastMessage.senderId
                        };
                    }
                }
            }

            setUnreadCounts(initialUnreadCounts);
            setUnreadByConv(initialUnreadCounts);
            setGlobalUnreadCounts(initialUnreadCounts);
            // initialize global unread context as well
            try { setAllUnread(initialUnreadCounts); } catch (e) { console.debug(e); }
            setUiTick(t => t + 1);
        } catch (_e) {
            console.error('Error loading conversations:', _e);
        }
    }

    async function loadMessages(conversationId, isInitialLoad = true) {
        try {
            if (isInitialLoad) {
                // Initial load - get latest messages
                console.log('📥 Initial load for conversation:', conversationId);

                // Ensure we're loading for the correct conversation
                if (conversationId !== selectedConversationId) {
                    console.log('⚠️ Conversation mismatch, skipping load');
                    return;
                }

                const result = await chatService.getConversationMessages(conversationId, 20);
                console.log('📥 Initial messages API result:', result);

                // Double-check conversation is still selected before updating state
                if (conversationId === selectedConversationId) {
                    const newMessages = result.messages || [];

                    // Deduplicate messages by _id
                    const uniqueMessages = newMessages.filter(msg => {
                        const msgId = msg._id || msg.id;
                        if (!msgId) return false;

                        if (loadedMessageIdsRef.current.has(msgId)) {
                            console.log('🔄 Skipping duplicate message:', msgId);
                            return false;
                        }

                        loadedMessageIdsRef.current.add(msgId);
                        return true;
                    });

                    console.log('📥 Loaded', uniqueMessages.length, 'unique messages out of', newMessages.length, 'total');

                    setMessages(uniqueMessages);
                    setHasMoreMessages(result.hasMore || false);
                    setNextCursor(result.nextCursor);

                    // Load pinned messages for this conversation
                    try {
                        const pinnedMsgs = await chatService.getPinnedMessages(conversationId);
                        setPinnedMessages(pinnedMsgs || []);
                        console.log('📌 Loaded pinned messages:', pinnedMsgs?.length || 0);
                    } catch (error) {
                        console.error('Error loading pinned messages:', error);
                        setPinnedMessages([]);
                    }
                }

                // Auto scroll to bottom after initial load
                setTimeout(() => {
                    scrollToBottom();
                }, 100);

                // Mark entire conversation as read when opening
                try {
                    console.log('📖 Marking conversation as read:', conversationId);
                    await chatService.markConversationAsRead(conversationId);
                    // Update all unread count states to 0
                    setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
                    setUnreadByConv(prev => ({ ...prev, [conversationId]: 0 }));
                    setGlobalUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
                    console.log('✅ Conversation marked as read');
                } catch (error) {
                    console.error('❌ Error marking conversation as read:', error); console.debug(error);
                }
            } else {
                // Load older messages
                console.log('📥 Load older messages check:', {
                    hasMoreMessages,
                    loadingOlderMessages,
                    nextCursor,
                    messagesCount: messages.length,
                    currentConversation: selectedConversationId
                });

                if (!hasMoreMessages || loadingOlderMessages) {
                    console.log('⏭️ Skipping load: no more messages or already loading');
                    return;
                }

                // Ensure we're loading for the correct conversation
                if (conversationId !== selectedConversationId) {
                    console.log('⚠️ Conversation mismatch for older messages, skipping');
                    return;
                }

                // For older messages, use the sentAt of oldest message as cursor
                const oldestMessage = messages.length > 0 ? messages[0] : null;
                const beforeCursor = oldestMessage ? oldestMessage.sentAt || oldestMessage.timestamp : null;

                console.log('📥 Loading older messages with cursor:', beforeCursor);

                setLoadingOlderMessages(true);
                const result = await chatService.getConversationMessages(conversationId, 20, beforeCursor);

                console.log('📥 Older messages API result:', result);

                // Double-check conversation is still selected before updating state
                if (conversationId === selectedConversationId) {
                    const olderMessages = result.messages || [];

                    // Deduplicate older messages by _id
                    const uniqueOlderMessages = olderMessages.filter(msg => {
                        const msgId = msg._id || msg.id;
                        if (!msgId) return false;

                        if (loadedMessageIdsRef.current.has(msgId)) {
                            console.log('🔄 Skipping duplicate older message:', msgId);
                            return false;
                        }

                        loadedMessageIdsRef.current.add(msgId);
                        return true;
                    });

                    console.log('📥 Loaded', uniqueOlderMessages.length, 'unique older messages out of', olderMessages.length, 'total');

                    // Prepend older messages
                    setMessages(prev => [...uniqueOlderMessages, ...prev]);
                    setHasMoreMessages(result.hasMore || false);
                    setNextCursor(result.nextCursor);
                }

                setShouldPreserveScroll(true);
                const container = messagesContainerRef.current;
                if (container) {
                    scrollPreserveData.current = {
                        prevScrollHeight: container.scrollHeight,
                        prevScrollTop: container.scrollTop
                    };
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            if (isInitialLoad) {
                setMessages([]);
            }
        } finally {
            if (!isInitialLoad) {
                console.log('✅ Finished loading older messages');
                setLoadingOlderMessages(false);
            }
        }
    }

    // Scroll to bottom function
    function scrollToBottom() {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Load unread counts for all conversations
    async function loadUnreadCounts(userId) {
        try {
            const counts = await chatService.getUnreadCounts();
            setUnreadCounts(counts || {});
            setGlobalUnreadCounts(counts || {});
            setUnreadByConv(counts || {});
            try { setAllUnread(counts || {}); } catch (e) { console.debug(e); }
        } catch (error) {
            console.error('Error loading unread counts:', error);
        }
    }

    useEffect(() => {
        const currentScrollTimeout = scrollTimeoutRef.current;
        (async () => {
            const tokens = getStoredTokens();
            const uid = tokens?.userInfo?.userId || "";
            setCurrentUserId(uid);
            try {
                const basic = await userService.getAllUserBasicInfos();
                setAllUsers(basic || []);
            } catch (e) { /* ignore */ }
            if (uid) {
                connectWS();
                await loadConversations(uid);
                // Don't call loadUnreadCounts separately as loadConversations already sets unread counts
                subscribeUser(uid);
            }
        })();
        return () => {
            try { if (convoSubRef.current) convoSubRef.current.unsubscribe(); } catch (e) { console.debug(e); }
            try { if (userSubRef.current) userSubRef.current.unsubscribe(); } catch (e) { console.debug(e); }
            try { if (stompRef.current) stompRef.current.deactivate(); } catch (e) { console.debug(e); }
            try { if (currentScrollTimeout) clearTimeout(currentScrollTimeout); } catch (e) { console.debug(e); }
        };
    }, []);

    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    // Auto-load messages when conversation changes
    useEffect(() => {
        if (selectedConversationId && currentUserId) {
            console.log('🔄 Conversation changed, auto-loading messages:', selectedConversationId);

            // Reset all message-related state IMMEDIATELY to prevent mixing
            setMessages([]);
            setHasMoreMessages(true);
            setHasMoreBefore(true);
            setHasMoreAfter(true);
            setIsJumpMode(false);
            setNextCursor(null);
            setNewerCursor(null);
            setLoadingOlderMessages(false);
            setLoadingNewerMessages(false);
            setShouldPreserveScroll(false);

            // Reset pinned messages for new conversation
            setPinnedMessages([]);

            // Clear loaded message IDs for new conversation
            loadedMessageIdsRef.current.clear();

            // Subscribe to new conversation WebSocket
            subscribeConversation(selectedConversationId);

            // Load messages for new conversation
            loadMessages(selectedConversationId, true);
        }
    }, [selectedConversationId, currentUserId]);

    // Preserve scroll position when loading older messages
    useLayoutEffect(() => {
        if (shouldPreserveScroll && messagesContainerRef.current) {
            const el = messagesContainerRef.current;
            const { prevScrollHeight, prevScrollTop } = scrollPreserveData.current;
            const newScrollHeight = el.scrollHeight;
            const newScrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;

            console.log('Preserving scroll position:', {
                prevScrollHeight,
                prevScrollTop,
                newScrollHeight,
                newScrollTop,
                scrollDifference: newScrollHeight - prevScrollHeight
            });

            // Ensure we don't scroll beyond the container bounds
            const maxScrollTop = el.scrollHeight - el.clientHeight;
            const finalScrollTop = Math.min(Math.max(newScrollTop, 0), maxScrollTop);

            el.scrollTop = finalScrollTop;
            setShouldPreserveScroll(false);
        }
    }, [shouldPreserveScroll, messages]);

    // Load older messages by oldest message id (prepend) using around API
    async function loadOlderById(conversationId, limit = 20) {
        if (loadingOlderMessages || !conversationId) return;
        if (!messages.length || !hasMoreBefore) return;
        try {
            setLoadingOlderMessages(true);
            const oldest = messages[0];
            const oldestId = oldest.id || oldest._id;
            
            // Skip if oldestId is a local/temp ID (not from server)
            if (!oldestId || oldestId.startsWith('local-') || oldestId.startsWith('temp-')) {
                console.log('📥 Skipping loadOlderById - oldest message is local/temp:', oldestId);
                setLoadingOlderMessages(false);
                return;
            }
            
            console.log('📥 Loading older-by-id before:', oldestId);
            const result = await chatService.getMessagesAround(oldestId, limit, 0);
            const older = (result?.beforeMessages || []).filter(msg => {
                const msgId = msg.id || msg._id;
                if (!msgId) return false;
                if (loadedMessageIdsRef.current.has(msgId)) return false;
                loadedMessageIdsRef.current.add(msgId);
                return true;
            });
            if (older.length > 0) {
                // preserve scroll before prepend
                setShouldPreserveScroll(true);
                const container = messagesContainerRef.current;
                if (container) {
                    scrollPreserveData.current = {
                        prevScrollHeight: container.scrollHeight,
                        prevScrollTop: container.scrollTop
                    };
                }
                setMessages(prev => [...older, ...prev]);
            }
            setHasMoreBefore((result?.beforeMessages || []).length > 0);
        } catch (e) {
            console.error('Error loadOlderById:', e);
        } finally {
            setLoadingOlderMessages(false);
        }
    }

    // Load newer messages by newest message id (append) using around API
    async function loadNewerById(conversationId, limit = 20) {
        if (loadingNewerMessages || !conversationId) return;
        if (!messages.length || !hasMoreAfter) return;
        try {
            setLoadingNewerMessages(true);
            const newest = messages[messages.length - 1];
            const newestId = newest.id || newest._id;
            
            // Skip if newestId is a local/temp ID (not from server)
            if (!newestId || newestId.startsWith('local-') || newestId.startsWith('temp-')) {
                console.log('📥 Skipping loadNewerById - newest message is local/temp:', newestId);
                setLoadingNewerMessages(false);
                return;
            }
            
            console.log('📥 Loading newer-by-id after:', newestId);
            const result = await chatService.getMessagesAround(newestId, 0, limit);
            const newer = (result?.afterMessages || []).filter(msg => {
                const msgId = msg.id || msg._id;
                if (!msgId) return false;
                if (loadedMessageIdsRef.current.has(msgId)) return false;
                loadedMessageIdsRef.current.add(msgId);
                return true;
            });
            if (newer.length > 0) {
                setMessages(prev => [...prev, ...newer]);
            }
            setHasMoreAfter((result?.afterMessages || []).length > 0);
        } catch (e) {
            console.error('Error loadNewerById:', e);
        } finally {
            setLoadingNewerMessages(false);
        }
    }

    // Handle scroll to load older/newer messages - improved detection
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const scrollBottom = scrollHeight - scrollTop - clientHeight;

            const scrollThreshold = 50; // Load when within 50px of top/bottom

            console.log('📜 Scroll event:', {
                scrollTop,
                scrollBottom,
                scrollThreshold,
                hasMoreMessages,
                loadingOlderMessages,
                loadingNewerMessages,
                selectedConversationId,
                shouldLoadOlder: scrollTop <= scrollThreshold && hasMoreMessages && !loadingOlderMessages && selectedConversationId,
                shouldLoadNewer: scrollBottom <= scrollThreshold && !loadingNewerMessages && selectedConversationId
            });

            // Load older messages when scrolling up
            if (scrollTop <= scrollThreshold && !loadingOlderMessages && selectedConversationId) {
                console.log('🔄 Triggering load older-by-id at scrollTop:', scrollTop);
                loadOlderById(selectedConversationId);
            }

            // Load newer messages when scrolling down (if we're near bottom)
            if (scrollBottom <= scrollThreshold && !loadingNewerMessages && selectedConversationId) {
                console.log('🔄 Triggering load newer-by-id at scrollBottom:', scrollBottom);
                loadNewerById(selectedConversationId);
            }
        };

        // Throttle scroll events for better performance
        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        container.addEventListener('scroll', throttledScroll, { passive: true });
        return () => container.removeEventListener('scroll', throttledScroll);
    }, [selectedConversationId, hasMoreMessages, loadingOlderMessages, loadingNewerMessages, hasMoreBefore, hasMoreAfter, messages.length]);

    const userMap = useMemo(() => {
        const map = {};
        (allUsers || []).forEach(u => {
            const key = u.userId || u.id;
            if (key) map[key] = u;
        });
        return map;
    }, [allUsers]);

    function getUserInfo(userId) {
        if (!userId) return null;
        return userMap[userId] || null;
    }
    function getUserName(userId) {
        const u = getUserInfo(userId);
        return u?.fullName || u?.email || userId || "unknown";
    }
    function getUserImage(userId) {
        const u = getUserInfo(userId);
        return u?.image || "";
    }

    const filteredConversations = useMemo(() => {
        const q = (searchQuery || '').toLowerCase();
        const filtered = (conversations || []).filter(c => {
            const dn = getConversationDisplayName(c, currentUserId).toLowerCase();
            return !q || dn.includes(q) || (c.id || '').toLowerCase().includes(q);
        });

        // Sort conversations: pinned first (by pinnedAt desc), then by last message time desc
        return filtered.sort((a, b) => {
            const aPinned = a.isPinned || false;
            const bPinned = b.isPinned || false;

            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;

            if (aPinned && bPinned) {
                // Both pinned, sort by pinnedAt desc
                const aPinnedAt = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
                const bPinnedAt = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
                return bPinnedAt - aPinnedAt;
            }

            // Both not pinned or same pinned status, sort by last message time
            const aLastMsg = a.lastMessage;
            const bLastMsg = b.lastMessage;

            if (aLastMsg && bLastMsg) {
                const aTime = new Date(aLastMsg.sentAt || aLastMsg.timestamp || 0).getTime();
                const bTime = new Date(bLastMsg.sentAt || bLastMsg.timestamp || 0).getTime();
                return bTime - aTime;
            }

            // Fallback to updatedAt
            const aUpdated = new Date(a.updatedAt || 0).getTime();
            const bUpdated = new Date(b.updatedAt || 0).getTime();
            return bUpdated - aUpdated;
        });
    }, [searchQuery, conversations, currentUserId, uiTick]);

    function isDirect(conv) {
        return ((conv?.type || '').toUpperCase() === 'DIRECT') || (((conv?.members || []).length === 2) && !conv?.name);
    }
    function getPeerId(conv) {
        const members = conv?.members || [];
        return members.find(m => m !== currentUserId) || (members[0] || 'unknown');
    }
    function getConversationDisplayName(conv, uid) {
        if (!conv) return 'Cuộc trò chuyện';
        if (((conv?.type || '').toUpperCase() === 'DIRECT') || (((conv?.members || []).length === 2) && !conv?.name)) {
            const members = conv?.members || [];
            const peer = members.find(m => m !== uid) || (members[0] || 'unknown');
            return getUserName(peer);
        }
        return conv?.name || conv?.id || 'Cuộc trò chuyện';
    }

    function onSelectConversation(conv) {
        console.log('🔄 Selecting conversation:', conv.id);

        // Optimistic update - reset unread count immediately for better UX
        setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }));
        setUnreadByConv(prev => ({ ...prev, [conv.id]: 0 }));
        setGlobalUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }));
        // Reset global unread context instantly
        try { resetUnread(conv.id); } catch (_e) { }

        // Fire-and-forget: mark conversation as read on backend as soon as user opens it
        (async () => {
            try {
                await chatService.markConversationAsRead(conv.id);
            } catch (e) {
                console.error('Error marking conversation as read on select:', e);
            }
        })();

        // Just set the selected conversation - useEffect will handle the rest
        setSelectedConversationId(conv.id);
        setPendingDirect(false);
        setSelectedPeerId(null);

        console.log('✅ Optimistically reset unread count for conversation:', conv.id);
    }

    async function onAddMember() {
        if (!selectedConversationId || !addMemberInput) return;
        try {
            await chatService.addMember(selectedConversationId, addMemberInput);
            setAddMemberInput("");
            await loadConversations(currentUserId);
        } catch (_e) { }
    }

    async function onCreateGroupSubmit({ name, members, avatarUrl }) {
        try {
            const payload = { name, members, type: 'GROUP' };
            if (avatarUrl && avatarUrl.trim()) payload.avatarUrl = avatarUrl.trim();
            const res = await chatService.createConversation(payload);
            const created = res?.data || res;
            setOpenCreateGroup(false);
            if (created?.id) {
                await loadConversations(currentUserId);
                setSelectedConversationId(created.id);
                subscribeConversation(created.id);
                await loadMessages(created.id);
            }
        } catch (_e) { }
    }

    async function onSend() {
        const text = content.trim();
        if (!text) return;

        if (!selectedConversationId && pendingDirect && selectedPeerId) {
            try {
                console.log('📤 Sending first direct message to:', selectedPeerId);
                const saved = await chatService.sendDirectOnce({ senderId: currentUserId, recipientId: selectedPeerId, content: text });
                const payload = saved?.data || saved;
                const conId = payload?.conversationId;
                if (conId) {
                    console.log('✅ Direct conversation created:', conId);
                    setSelectedConversationId(conId);
                    setPendingDirect(false);
                    // useEffect will automatically handle subscribeConversation and loadMessages
                    await loadConversations(currentUserId);
                }
                setContent("");
                setReplyingTo(null);
            } catch (error) {
                console.error('❌ Error sending direct message:', error);
            }
            return;
        }

        if (!selectedConversationId || !stompRef.current) return;

        // Create optimistic message with localId
        const localId = generateLocalId();
        const optimisticMessage = {
            localId,
            conversationId: selectedConversationId,
            senderId: currentUserId,
            content: text,
            type: 'TEXT',
            sentAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            replyToMessageId: replyingTo ? (replyingTo.id || replyingTo._id) : null,
            replyToSenderId: replyingTo ? replyingTo.senderId : null,
            replyToContent: replyingTo ? replyingTo.content : null,
            isOptimistic: true
        };

        // Add optimistic message immediately; include reply metadata for UI
        setMessages(prev => [...prev, {
            ...optimisticMessage,
            replyToMessageId: replyingTo ? (replyingTo.id || replyingTo._id) : null,
            replyToSenderId: replyingTo ? replyingTo.senderId : null,
            replyToContent: replyingTo ? replyingTo.content : null
        }]);

        // Update lastMessagesByConv for immediate UI update
        lastMessagesByConvRef.current[selectedConversationId] = {
            content: text,
            senderId: currentUserId,
            timestamp: optimisticMessage.timestamp
        };
        setUiTick(t => t + 1);

        // Add localId to loaded message IDs to prevent duplicates
        loadedMessageIdsRef.current.add(localId);

        setContent("");
        setReplyingTo(null);

        // Auto scroll to bottom after adding optimistic message
        setTimeout(() => scrollToBottom(), 100);

        try {
            if (replyingTo) {
                // Send reply message
                stompRef.current.publish({
                    destination: chatWs.replyToMessage(selectedConversationId),
                    body: JSON.stringify({
                        senderId: currentUserId,
                        content: text,
                        replyToMessageId: replyingTo.id || replyingTo._id
                    })
                });
            } else {
                // Send regular message
                stompRef.current.publish({
                    destination: chatWs.sendToConversation(selectedConversationId),
                    body: JSON.stringify({
                        conversationId: selectedConversationId,
                        senderId: currentUserId,
                        content: text,
                        type: 'TEXT'
                    })
                });
            }

            // Stop typing indicator
            if (isTyping) {
                setIsTyping(false);
                stompRef.current.publish({
                    destination: chatWs.typingIndicator(selectedConversationId),
                    body: JSON.stringify({
                        userId: currentUserId,
                        isTyping: false
                    })
                });
            }
        } catch (_e) {
            console.error('Error sending message:', _e);
        }
    }

    function handleReply(message) {
        setReplyingTo(message);
        // Focus on input (you might want to add a ref to the input)
    }

    function handleCancelReply() {
        setReplyingTo(null);
    }

    function handleTyping() {
        if (!selectedConversationId || !stompRef.current) return;

        if (!isTyping) {
            setIsTyping(true);
            stompRef.current.publish({
                destination: chatWs.typingIndicator(selectedConversationId),
                body: JSON.stringify({
                    userId: currentUserId,
                    isTyping: true
                })
            });
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                stompRef.current.publish({
                    destination: chatWs.typingIndicator(selectedConversationId),
                    body: JSON.stringify({
                        userId: currentUserId,
                        isTyping: false
                    })
                });
            }
        }, 2000);
    }

    function handleMessageUpdate(action, messageId, userId) {
        if (action === 'delete-for-me') {
            // Optimistic update - immediately hide message
            setMessages(prev => prev.map(msg => {
                if ((msg.id || msg._id) === messageId) {
                    const deletedForUsers = msg.deletedForUsers || [];
                    if (!deletedForUsers.includes(userId)) {
                        return {
                            ...msg,
                            deletedForUsers: [...deletedForUsers, userId]
                        };
                    }
                }
                return msg;
            }));
        } else if (action === 'revert-delete') {
            // Revert optimistic update on error
            setMessages(prev => {
                const updated = prev.map(msg => {
                    if ((msg.id || msg._id) === messageId) {
                        const deletedForUsers = msg.deletedForUsers || [];
                        return {
                            ...msg,
                            deletedForUsers: deletedForUsers.filter(id => id !== userId)
                        };
                    }
                    return msg;
                });

                // Recompute last message preview after revert
                try {
                    const visible = updated.filter(mm => {
                        const dfu = mm.deletedForUsers || [];
                        return !dfu.includes(currentUserId);
                    });
                    const lastMsg = visible[visible.length - 1];
                    if (selectedConversationId) {
                        lastMessagesByConvRef.current[selectedConversationId] = lastMsg
                            ? {
                                content: lastMsg.recalled ? 'Tin nhắn đã được thu hồi' : (lastMsg.content || ''),
                                senderId: lastMsg.senderId,
                                timestamp: lastMsg.sentAt || lastMsg.timestamp || new Date().toISOString(),
                                type: (lastMsg.type || 'TEXT')
                            }
                            : '';
                        setUiTick(t => t + 1);
                    }
                } catch (_e) { }

                return updated;
            });
        } else {
            // Other updates - reload messages
            if (selectedConversationId) {
                loadMessages(selectedConversationId, true);
            }
        }
    }

    // Pin/Unpin message handlers
    async function handlePinMessage(conversationId, messageId) {
        try {
            if (stompRef.current?.connected) {
                stompRef.current.publish({
                    destination: chatWs.pinMessage(conversationId),
                    body: JSON.stringify({
                        messageId,
                        userId: currentUserId,
                        action: 'pin'
                    })
                });
            } else {
                await chatService.pinMessage(conversationId, messageId);
            }
        } catch (error) {
            console.error('Error pinning message:', error);
        }
    }

    async function handleUnpinMessage(conversationId, messageId) {
        try {
            if (stompRef.current?.connected) {
                stompRef.current.publish({
                    destination: chatWs.pinMessage(conversationId),
                    body: JSON.stringify({
                        messageId,
                        userId: currentUserId,
                        action: 'unpin'
                    })
                });
            } else {
                await chatService.unpinMessage(conversationId, messageId);
            }
        } catch (error) {
            console.error('Error unpinning message:', error);
        }
    }

    // Handle scroll to specific message
    function handleScrollToMessage(message) {
        const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the message briefly
            messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900/20');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/20');
            }, 2000);
        }
    }

    // Jump to message helper function - used by reply, pin, search
    async function jumpToMessage(conversationId, messageId) {
        console.log('🎯 Jumping to message:', messageId, 'in conversation:', conversationId);
        // Enter jump mode immediately so the return button is visible right away
        setIsJumpMode(true);

        // Always load only the block around target and reset UI state
        try {
            console.log('📥 Loading message with neighbors from API');
            const result = await chatService.getMessagesAround(messageId, 20, 20);

            if (!result || !result.targetMessage) {
                console.log('❌ Message not found or deleted');
                alert('Tin nhắn gốc đã bị xóa');
                return;
            }

            const { targetMessage, beforeMessages, afterMessages } = result;

            // Check if we're in the right conversation
            if (targetMessage.conversationId !== conversationId) {
                console.log('⚠️ Message belongs to different conversation, switching...');
                // Switch to the correct conversation
                const targetConv = conversations.find(c => c.id === targetMessage.conversationId);
                if (targetConv) {
                    onSelectConversation(targetConv);
                    // Wait a bit for conversation to load, then try again
                    setTimeout(() => jumpToMessage(targetMessage.conversationId, messageId), 1000);
                    return;
                } else {
                    console.log('❌ Target conversation not found');
                    alert('Cuộc trò chuyện không tồn tại');
                    return;
                }
            }

            // Reset loaded IDs and state to ONLY the block around the target
            loadedMessageIdsRef.current.clear();
            const block = [...(beforeMessages || []), targetMessage, ...(afterMessages || [])];
            const uniqueBlock = block.filter(msg => {
                const msgId = msg.id || msg._id;
                if (!msgId) return false;
                if (loadedMessageIdsRef.current.has(msgId)) return false;
                loadedMessageIdsRef.current.add(msgId);
                return true;
            });

            // Replace entire list with the block only
            setMessages(uniqueBlock.sort((a, b) => {
                const timeA = new Date(a.sentAt || a.timestamp).getTime();
                const timeB = new Date(b.sentAt || b.timestamp).getTime();
                return timeA - timeB;
            }));

            // Update bi-directional hasMore flags based on neighbors
            setHasMoreBefore((beforeMessages || []).length > 0);
            setHasMoreAfter((afterMessages || []).length > 0);
            setIsJumpMode(true);

            // Focus target after render
            setTimeout(() => {
                handleScrollToMessage({ id: targetMessage.id || targetMessage._id });
            }, 50);

        } catch (error) {
            console.error('❌ Error loading message with neighbors:', error);
            alert('Không thể tải tin nhắn. Tin nhắn gốc có thể đã bị xóa.');
        }
    }

    // Return to latest (exit jump mode)
    async function returnToLatest() {
        try {
            setIsJumpMode(false);
            loadedMessageIdsRef.current.clear();
            setMessages([]);
            setHasMoreMessages(true);
            setHasMoreBefore(true);
            setHasMoreAfter(true);
            setNextCursor(null);
            setNewerCursor(null);
            await loadMessages(selectedConversationId, true);
        } catch (e) {
            console.error('Error returning to latest:', e);
        }
    }

    // Check for gaps in messages and fill them
    async function checkAndFillGaps(targetMessage) {
        try {
            // Find the closest messages before and after the target
            const targetTime = new Date(targetMessage.sentAt || targetMessage.timestamp).getTime();

            const beforeMessage = messages
                .filter(m => new Date(m.sentAt || m.timestamp).getTime() < targetTime)
                .sort((a, b) => new Date(b.sentAt || b.timestamp).getTime() - new Date(a.sentAt || a.timestamp).getTime())[0];

            const afterMessage = messages
                .filter(m => new Date(m.sentAt || m.timestamp).getTime() > targetTime)
                .sort((a, b) => new Date(a.sentAt || a.timestamp).getTime() - new Date(b.sentAt || b.timestamp).getTime())[0];

            // If we have both before and after messages, check for gaps
            if (beforeMessage && afterMessage) {
                const beforeTime = new Date(beforeMessage.sentAt || beforeMessage.timestamp).getTime();
                const afterTime = new Date(afterMessage.sentAt || afterMessage.timestamp).getTime();
                const timeDiff = afterTime - beforeTime;

                // If there's a significant time gap (more than 5 minutes), fill it
                if (timeDiff > 5 * 60 * 1000) {
                    console.log('🔍 Detected gap, filling messages between:', beforeMessage.id, 'and', afterMessage.id);

                    const gapMessages = await chatService.getMessagesBetween(
                        beforeMessage.id || beforeMessage._id,
                        afterMessage.id || afterMessage._id,
                        selectedConversationId
                    );

                    if (gapMessages.length > 0) {
                        console.log('📥 Filling gap with', gapMessages.length, 'messages');

                        // Add to loaded message IDs
                        gapMessages.forEach(msg => {
                            const msgId = msg.id || msg._id;
                            if (msgId) {
                                loadedMessageIdsRef.current.add(msgId);
                            }
                        });

                        // Merge gap messages into state
                        setMessages(prev => {
                            const combined = [...prev, ...gapMessages];
                            return combined.sort((a, b) => {
                                const timeA = new Date(a.sentAt || a.timestamp).getTime();
                                const timeB = new Date(b.sentAt || b.timestamp).getTime();
                                return timeA - timeB;
                            });
                        });
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error filling gaps:', error);
        }
    }

    async function startDirectWith(userId) {
        if (!userId || userId === currentUserId) return;

        console.log('🔄 Starting direct conversation with user:', userId);

        // First, reload conversations to get the latest data
        try {
            const data = await chatService.getConversationsByUser();
            const latestConversations = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

            // Check if an existing direct conversation already exists
            const existing = latestConversations.find(c => {
                const isDirectConv = ((c?.type || '').toUpperCase() === 'DIRECT') || (((c?.members || []).length === 2) && !c?.name);
                const hasBothMembers = (c.members || []).includes(userId) && (c.members || []).includes(currentUserId);
                return isDirectConv && hasBothMembers;
            });

            if (existing) {
                console.log('✅ Found existing direct conversation:', existing.id);
                // Update conversations state
                setConversations(latestConversations);
                // Open the existing conversation
                setPendingDirect(false);
                setSelectedPeerId(null);
                setSelectedConversationId(existing.id);
                // useEffect will automatically handle subscribeConversation and loadMessages
                return;
            }

            // No existing conversation found, prepare for new direct conversation
            console.log('🆕 No existing conversation found, preparing for new direct chat');
            setSelectedConversationId(null);
            setPendingDirect(true);
            setSelectedPeerId(userId);
            setMessages([]);
            setSearchQuery("");

            // Update conversations state with latest data
            setConversations(latestConversations);

        } catch (error) {
            console.error('❌ Error starting direct conversation:', error);
            // Fallback: just prepare for new conversation
            setSelectedConversationId(null);
            setPendingDirect(true);
            setSelectedPeerId(userId);
            setMessages([]);
            setSearchQuery("");
        }
    }

    const handleSendMedia = async (files) => {
        if (!selectedConversationId || !currentUserId || !files?.length) return;
        try {
            await chatService.sendMedia({ conversationId: selectedConversationId, senderId: currentUserId, files });
        } catch (e) {
            console.error('❌ Error sending media:', e);
            alert('Gửi tệp thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <>
            <div className="h-[calc(100vh-35px)] overflow-hidden flex flex-col space-y-6">
                <PageHeader breadcrumbs={[{ label: "Tin nhắn", to: "/messages" }]} />
                <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <ConversationList
                        conversations={conversations}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        allUsers={allUsers}
                        currentUserId={currentUserId}
                        unreadCounts={unreadCounts}
                        globalUnreadCounts={globalUnreadCounts}
                        unreadByConv={unreadByConv}
                        lastMessagesByConv={lastMessagesByConvRef}
                        uiTick={uiTick}
                        onSelectConversation={onSelectConversation}
                        onCreateGroupClick={() => setOpenCreateGroup(true)}
                        startDirectWith={startDirectWith}
                        getConversationDisplayName={getConversationDisplayName}
                        isDirect={isDirect}
                        getPeerId={getPeerId}
                        getUserName={getUserName}
                        getUserImage={getUserImage}
                        onConversationUpdate={() => loadConversations(currentUserId)}
                    />
                    {(selectedConversationId || pendingDirect) ? (
                        <ChatArea
                            selectedConversationId={selectedConversationId}
                            selectedConversation={conversations.find(c => c.id === selectedConversationId)}
                            messages={messages}
                            currentUserId={currentUserId}
                            getUserName={getUserName}
                            getUserImage={getUserImage}
                            onSend={onSend}
                            onReply={handleReply}
                            onCancelReply={handleCancelReply}
                            onMessageUpdate={handleMessageUpdate}
                            onJumpToMessage={jumpToMessage}
                            typingUsers={typingUsers}
                            onShowMessageSearch={() => setShowMessageSearch(true)}
                            onShowGroupMembers={() => setShowGroupMembers(true)}
                            isJumpMode={isJumpMode}
                            onReturnToLatest={returnToLatest}
                            loadingOlderMessages={loadingOlderMessages}
                            loadingNewerMessages={loadingNewerMessages}
                            messagesContainerRef={messagesContainerRef}
                            content={content}
                            onContentChange={setContent}
                            onTyping={handleTyping}
                            onSendMedia={handleSendMedia}
                            replyingTo={replyingTo}
                            pendingDirect={pendingDirect}
                            selectedPeerId={selectedPeerId}
                            pinnedMessagesBannerRef={pinnedMessagesBannerRef}
                            loadOlderById={loadOlderById}
                            loadNewerById={loadNewerById}
                            isDirect={isDirect}
                            getPeerId={getPeerId}
                            getConversationDisplayName={getConversationDisplayName}
                            onShowPinnedMessages={() => setShowPinnedMessages(true)}
                        onConversationMetaUpdated={(updated) => {
                            if (!updated?.id) return;
                            setConversations(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
                            setUiTick(t => t + 1);
                        }}
                        />
                    ) : (
                        <EmptyChat />
                    )}
                </div>
            </div>
            <CreateGroupModal
                open={openCreateGroup}
                onClose={() => setOpenCreateGroup(false)}
                allUsers={allUsers}
                currentUserId={currentUserId}
                onSubmit={onCreateGroupSubmit}
            />

            <PinnedMessages
                ref={pinnedMessagesModalRef}
                conversationId={selectedConversationId}
                isVisible={showPinnedMessages}
                onClose={() => setShowPinnedMessages(false)}
                getUserName={getUserName}
                getUserImage={getUserImage}
                onMessageClick={(message) => jumpToMessage(selectedConversationId, message.id || message._id)}
                onUnpinMessage={handleUnpinMessage}
                currentUserId={currentUserId}
            />

            <MessageSearch
                conversationId={selectedConversationId}
                isVisible={showMessageSearch}
                onClose={() => setShowMessageSearch(false)}
                getUserName={getUserName}
                getUserImage={getUserImage}
                onMessageClick={(message) => jumpToMessage(selectedConversationId, message.id || message._id)}
                currentUserId={currentUserId}
            />

            <GroupMembersModal
                open={showGroupMembers}
                onClose={() => setShowGroupMembers(false)}
                conversationId={selectedConversationId}
                allUsers={allUsers}
                currentUserId={currentUserId}
                onChanged={() => loadConversations(currentUserId)}
            />
        </>
    );
}

// Wrap Messages with UnreadCountsProvider to provide global unread state
export default function MessagesPage(props) {
    return (
        <UnreadCountsProvider>
            <Messages {...props} />
        </UnreadCountsProvider>
    );
}
