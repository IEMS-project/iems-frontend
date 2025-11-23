import React from 'react';
import { useToast } from '../../context/ToastContext';
import Toast from './Toast';

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast, index) => {
                return (
                    <div 
                        key={toast.id} 
                        className="pointer-events-auto"
                        style={{
                            animation: 'slideInRight 0.3s ease-out',
                        }}
                    >
                        <Toast
                            id={toast.id}
                            title={toast.title}
                            message={toast.message}
                            description={toast.description}
                            action={toast.action}
                            onClose={removeToast}
                        />
                    </div>
                );
            })}
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

