import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((options, duration = 4000) => {
        const id = Date.now() + Math.random();
        
        // Hỗ trợ cả object và string (backward compatibility)
        let toastData;
        if (typeof options === 'string') {
            toastData = { id, message: options, duration };
        } else {
            toastData = { 
                id, 
                title: options.title,
                message: options.message,
                description: options.description,
                action: options.action,
                duration: options.duration || duration 
            };
        }
        
        setToasts(prev => [...prev, toastData]);

        // Auto remove after duration
        if (toastData.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, toastData.duration);
        }

        return id;
    }, [removeToast]);

    const toast = {
        success: (messageOrOptions, duration) => {
            if (typeof messageOrOptions === 'string') {
                return showToast({ message: messageOrOptions }, duration);
            }
            return showToast(messageOrOptions, duration);
        },
        error: (messageOrOptions, duration) => {
            if (typeof messageOrOptions === 'string') {
                return showToast({ message: messageOrOptions }, duration);
            }
            return showToast(messageOrOptions, duration);
        },
        warning: (messageOrOptions, duration) => {
            if (typeof messageOrOptions === 'string') {
                return showToast({ message: messageOrOptions }, duration);
            }
            return showToast(messageOrOptions, duration);
        },
        info: (messageOrOptions, duration) => {
            if (typeof messageOrOptions === 'string') {
                return showToast({ message: messageOrOptions }, duration);
            }
            return showToast(messageOrOptions, duration);
        },
        // Helper method để hiển thị toast với title và description
        show: (options, duration) => showToast(options, duration),
    };

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast, toast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

