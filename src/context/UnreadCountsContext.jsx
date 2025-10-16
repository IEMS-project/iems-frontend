import React, { createContext, useContext, useState, useCallback } from 'react';

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

    // Set all unread counts at once (useful for initial load)
    const setAll = useCallback((counts) => {
        setUnreadCounts(counts || {});
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

    // Get unread count for a specific conversation
    const getCount = useCallback((conversationId) => {
        return unreadCounts[conversationId] || 0;
    }, [unreadCounts]);

    // Get total unread count across all conversations
    const getTotal = useCallback(() => {
        return Object.values(unreadCounts).reduce((sum, count) => sum + (count || 0), 0);
    }, [unreadCounts]);

    const value = {
        unreadCounts,
        setAll,
        setCount,
        increment,
        reset,
        getCount,
        getTotal
    };

    return (
        <UnreadCountsContext.Provider value={value}>
            {children}
        </UnreadCountsContext.Provider>
    );
};