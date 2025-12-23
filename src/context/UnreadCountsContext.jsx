import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { chatService, chatWs } from "../services/chatService";
import { getStoredTokens } from "../lib/api";
import { useAuth } from "./AuthContext.jsx";

const UnreadCountsContext = createContext();

export const useUnreadCounts = () => {
    const context = useContext(UnreadCountsContext);
    if (!context) {
        throw new Error('useUnreadCounts must be used within an UnreadCountsProvider');
    }
    return context;
};

export const UnreadCountsProvider = ({ children }) => {
    const [unreadCounts, setUnreadCounts] = useState({});
    const [notificationStates, setNotificationStates] = useState({});
    const [loading, setLoading] = useState(false);
    const hasFetchedRef = useRef(false);
    const stompRef = useRef(null);
    const userSubRef = useRef(null);
    const conversationSubsRef = useRef({});
    const refreshPromiseRef = useRef(null);
    const conversationIdsRef = useRef(new Set());
    const isConnectedRef = useRef(false);
    const { userProfile, isAuthenticated } = useAuth();
    const storedTokens = getStoredTokens();
    const fallbackUserId = storedTokens?.userInfo?.userId;
    const userId = userProfile?.userId || fallbackUserId;

    const setNotificationStatesBulk = useCallback((states) => {
        setNotificationStates(states || {});
    }, []);

    const removeConversationFromCache = useCallback((conversationId) => {
        if (!conversationId) return;
        setUnreadCounts(prev => {
            if (!(conversationId in prev)) return prev;
            const updated = { ...prev };
            delete updated[conversationId];
            return updated;
        });
        setNotificationStates(prev => {
            if (!(conversationId in prev)) return prev;
            const updated = { ...prev };
            delete updated[conversationId];
            return updated;
        });
    }, []);

    // Set all unread counts at once (useful for initial load)
    const setAll = useCallback((counts, notifications) => {
        setUnreadCounts(counts || {});
        if (notifications) {
            setNotificationStates(notifications);
        }
    }, []);

    // Set specific conversation unread count
    const setCount = useCallback((conversationId, count) => {
        setUnreadCounts(prev => ({
            ...prev,
            [conversationId]: count
        }));
    }, []);

    // Increment unread count for a conversation
    const increment = useCallback((conversationId, amount = 1) => {
        setUnreadCounts(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || 0) + amount
        }));
    }, []);

    // Reset unread count to 0 for a conversation
    const reset = useCallback((conversationId) => {
        setUnreadCounts(prev => ({
            ...prev,
            [conversationId]: 0
        }));
    }, []);

    const setNotificationState = useCallback((conversationId, enabled) => {
        setNotificationStates(prev => ({
            ...prev,
            [conversationId]: enabled
        }));
    }, []);

    const handleConversationMessage = useCallback((message) => {
        if (!message) return;
        try {
            const payload = JSON.parse(message.body);
            if (!payload || !payload.conversationId) return;
            if (typeof payload.unreadCount === 'number') {
                setCount(payload.conversationId, payload.unreadCount);
                return;
            }
            if (payload.event === 'message') {
                const isMine = payload.senderId && payload.senderId === userId;
                if (!isMine) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [payload.conversationId]: (prev[payload.conversationId] || 0) + 1
                    }));
                }
            } else if (payload.event === 'messages_read') {
                setCount(payload.conversationId, typeof payload.unreadCount === 'number' ? payload.unreadCount : 0);
            }
        } catch (error) {
            console.error('Failed to handle conversation WS message:', error);
        }
    }, [setCount, userId]);

    const syncConversationSubscriptions = useCallback((latestIds = conversationIdsRef.current) => {
        if (!stompRef.current || !stompRef.current.connected) return;
        const subs = conversationSubsRef.current;
        Object.keys(subs).forEach(conversationId => {
            if (!latestIds.has(conversationId)) {
                try { subs[conversationId].unsubscribe(); } catch (_e) { }
                delete subs[conversationId];
            }
        });
        latestIds.forEach(conversationId => {
            if (subs[conversationId]) return;
            subs[conversationId] = stompRef.current.subscribe(
                chatWs.convoTopic(conversationId),
                handleConversationMessage
            );
        });
    }, [handleConversationMessage]);

    const refreshUnreadCounts = useCallback(async () => {
        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }
        const pending = (async () => {
        try {
            setLoading(true);
            const data = await chatService.getConversationsByUser();
            const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
            const counts = {};
            const notifications = {};

            const latestIds = new Set();
            for (const conversation of list) {
                if (!conversation?.id) continue;
                const count = typeof conversation.actualUnreadCount === 'number'
                    ? conversation.actualUnreadCount
                    : (conversation.unreadCount || 0);
                counts[conversation.id] = count;
                notifications[conversation.id] = conversation.notificationsEnabled !== false;
                latestIds.add(conversation.id);
            }

            setUnreadCounts(counts);
            setNotificationStates(notifications);
            conversationIdsRef.current = latestIds;
            if (stompRef.current?.connected) {
                syncConversationSubscriptions(latestIds);
            }
            return counts;
        } catch (error) {
            console.error('Failed to refresh unread counts:', error);
            throw error;
        } finally {
            setLoading(false);
            refreshPromiseRef.current = null;
        }
        })();
        refreshPromiseRef.current = pending;
        return pending;
    }, [syncConversationSubscriptions]);

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        refreshUnreadCounts().catch(() => {});
    }, [refreshUnreadCounts]);

    const handleUserMessage = useCallback((message) => {
        if (!message) return;
        try {
            const payload = JSON.parse(message.body);
            if (!payload) return;
            if (payload.event === 'conversation_deleted' && payload.conversationId) {
                removeConversationFromCache(payload.conversationId);
                conversationIdsRef.current.delete(payload.conversationId);
                syncConversationSubscriptions();
                return;
            }
            const conversationId = payload.conversationId;
            if (conversationId) {
                if (typeof payload.notificationsEnabled === 'boolean') {
                    setNotificationState(conversationId, payload.notificationsEnabled);
                }

                if (typeof payload.unreadCount === 'number') {
                    setCount(conversationId, payload.unreadCount);
                } else if (payload.event === 'message') {
                    const isMine = payload.senderId && payload.senderId === userId;
                    if (!isMine) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [conversationId]: (prev[conversationId] || 0) + 1
                        }));
                    }
                } else if (payload.event === 'messages_read') {
                    if (typeof payload.unreadCount === 'number') {
                        setCount(conversationId, payload.unreadCount);
                    } else {
                        setCount(conversationId, 0);
                    }
                } else {
                    refreshUnreadCounts().catch(() => {});
                }
            } else if (payload.event === 'conversation_created' || payload.event === 'conversation_meta_updated') {
                refreshUnreadCounts().catch(() => {});
            }
        } catch (error) {
            console.error('Failed to handle user WS message:', error);
        }
    }, [refreshUnreadCounts, removeConversationFromCache, setCount, setNotificationState, syncConversationSubscriptions, userId]);

    const disconnectWs = useCallback(() => {
        Object.values(conversationSubsRef.current).forEach(sub => {
            try { sub.unsubscribe(); } catch (_e) { }
        });
        conversationSubsRef.current = {};
        conversationIdsRef.current = new Set();
        if (userSubRef.current) {
            try { userSubRef.current.unsubscribe(); } catch (_e) { }
            userSubRef.current = null;
        }
        if (stompRef.current) {
            try { stompRef.current.deactivate(); } catch (_e) { }
            stompRef.current = null;
        }
        isConnectedRef.current = false;
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !userId) {
            disconnectWs();
            return undefined;
        }

        const tokens = getStoredTokens();
        const wsUrl = (chatWs.wsPath || '').replace(/^http/, 'ws');
        const client = new Client({
            brokerURL: wsUrl,
            reconnectDelay: 4000,
            debug: () => {},
            connectHeaders: tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}
        });
        client.onConnect = () => {
            isConnectedRef.current = true;
            if (userSubRef.current) {
                try { userSubRef.current.unsubscribe(); } catch (_e) { }
                userSubRef.current = null;
            }
            userSubRef.current = client.subscribe(chatWs.userTopic(userId), handleUserMessage);
            syncConversationSubscriptions();
        };
        client.onStompError = (frame) => {
            console.error('UnreadCounts WebSocket error:', frame);
        };
        client.activate();
        stompRef.current = client;

        return () => {
            disconnectWs();
        };
    }, [disconnectWs, handleUserMessage, isAuthenticated, syncConversationSubscriptions, userId]);

    // Get unread count for a specific conversation
    const getCount = useCallback((conversationId) => {
        return unreadCounts[conversationId] || 0;
    }, [unreadCounts]);

    // Get total unread count across all conversations
    const getTotal = useCallback((options = {}) => {
        const includeMuted = options.includeMuted || false;
        return Object.entries(unreadCounts).reduce((sum, [conversationId, count]) => {
            if (!includeMuted && notificationStates[conversationId] === false) {
                return sum;
            }
            return sum + (count || 0);
        }, 0);
    }, [unreadCounts, notificationStates]);

    const value = {
        unreadCounts,
        notificationStates,
        loadingUnreadCounts: loading,
        setAll,
        setCount,
        increment,
        reset,
        getCount,
        getTotal,
        refreshUnreadCounts,
        setNotificationState,
        setNotificationStates: setNotificationStatesBulk
    };

    return (
        <UnreadCountsContext.Provider value={value}>
            {children}
        </UnreadCountsContext.Provider>
    );
};