import React from "react";
import { useNavigate } from "react-router-dom";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || <div>Something went wrong.</div>;
        }

        return this.props.children;
    }
}

// Hook-based error handler for API calls
export function useErrorHandler() {
    const navigate = useNavigate();

    const handleError = (error) => {
        console.error("API Error:", error);
        
        // Check if it's a permission error
        if (error.status === 403 || 
            error.message?.includes("PERMISSION_DENIED") ||
            error.message?.includes("permission") ||
            error.message?.includes("quyền")) {
            navigate("/permission-denied");
            return;
        }

        // For other errors, you might want to show a toast or modal
        // For now, just log them
        console.error("Unhandled error:", error);
    };

    return { handleError };
}

export default ErrorBoundary;

