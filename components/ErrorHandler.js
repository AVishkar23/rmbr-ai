// Enhanced Error Handling Utilities for Frontend Components
class GlobalErrorHandler {
    constructor() {
        this.errors = [];
        this.retryQueue = [];
        this.isOnline = navigator.onLine;
        this.maxErrors = 50; // Keep last 50 errors for debugging
        
        this.init();
    }

    init() {
        // Set up global error handlers
        this.setupGlobalErrorHandling();
        this.setupNetworkMonitoring();
        this.setupUnhandledPromiseRejection();
        
        console.log('Global Error Handler initialized');
    }

    setupGlobalErrorHandling() {
        // Catch JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'JAVASCRIPT_ERROR',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Catch resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.logError({
                    type: 'RESOURCE_ERROR',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);
    }

    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showSuccess('Connection restored');
            this.processRetryQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showWarning('You are currently offline. Some features may not work.');
        });
    }

    setupUnhandledPromiseRejection() {
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'UNHANDLED_PROMISE_REJECTION',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });

            // Prevent the default behavior (logging to console)
            event.preventDefault();
        });
    }

    logError(errorData) {
        this.errors.push(errorData);
        
        // Keep only the last maxErrors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Log to console in development
        if (process?.env?.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
            console.error('Global Error:', errorData);
        }

        // Show user-friendly error message for critical errors
        if (errorData.type === 'JAVASCRIPT_ERROR' && !errorData.message.includes('Script error')) {
            this.showError('An unexpected error occurred. Please refresh the page if problems persist.');
        }
    }

    // Enhanced fetch wrapper with retry and error handling
    async safeFetch(url, options = {}, config = {}) {
        const {
            timeout = 30000,
            retries = 2,
            retryDelay = 1000,
            showErrors = true
        } = config;

        if (!this.isOnline) {
            const error = new Error('No internet connection');
            error.type = 'NETWORK_ERROR';
            throw error;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions = {
            ...options,
            signal: controller.signal
        };

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await this.parseErrorResponse(response);
                    const error = new Error(errorData.message || `HTTP ${response.status}`);
                    error.status = response.status;
                    error.type = 'HTTP_ERROR';
                    error.data = errorData;
                    throw error;
                }

                return response;

            } catch (error) {
                clearTimeout(timeoutId);

                // Log the error
                this.logError({
                    type: 'FETCH_ERROR',
                    message: error.message,
                    url: url,
                    attempt: attempt + 1,
                    timestamp: new Date().toISOString()
                });

                if (attempt === retries) {
                    if (showErrors) {
                        this.handleFetchError(error, url);
                    }
                    throw error;
                }

                // Wait before retry with exponential backoff
                await this.delay(retryDelay * Math.pow(2, attempt));
            }
        }
    }

    async parseErrorResponse(response) {
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return { message: await response.text() };
            }
        } catch (error) {
            return { message: `HTTP ${response.status}: ${response.statusText}` };
        }
    }

    handleFetchError(error, url) {
        if (error.name === 'AbortError') {
            this.showError('Request timed out. Please try again.');
        } else if (error.type === 'NETWORK_ERROR' || !this.isOnline) {
            this.showError('Network error. Please check your connection and try again.');
        } else if (error.status === 429) {
            this.showError('Too many requests. Please wait a moment and try again.');
        } else if (error.status >= 500) {
            this.showError('Server error. Please try again later.');
        } else if (error.status === 401) {
            this.showError('Authentication required. Please refresh the page.');
        } else if (error.status === 403) {
            this.showError('Access denied.');
        } else {
            const message = error.data?.error || error.message || 'An error occurred';
            this.showError(message);
        }
    }

    // Validation utilities
    validateRequired(value, fieldName) {
        if (value === null || value === undefined || 
            (typeof value === 'string' && value.trim().length === 0)) {
            throw new ValidationError(`${fieldName} is required`, fieldName);
        }
        return value;
    }

    validateMinLength(value, minLength, fieldName) {
        if (value && value.length < minLength) {
            throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName);
        }
        return value;
    }

    validateMaxLength(value, maxLength, fieldName) {
        if (value && value.length > maxLength) {
            throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, fieldName);
        }
        return value;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError('Please enter a valid email address', 'email');
        }
        return email;
    }

    // User feedback methods
    showError(message, duration = 0) {
        this.showMessage(message, 'error', duration);
    }

    showWarning(message, duration = 5000) {
        this.showMessage(message, 'warning', duration);
    }

    showSuccess(message, duration = 5000) {
        this.showMessage(message, 'success', duration);
    }

    showInfo(message, duration = 5000) {
        this.showMessage(message, 'info', duration);
    }

    showMessage(message, type = 'info', duration = 5000) {
        try {
            let container = document.getElementById('global-message-container');
            if (!container) {
                container = this.createMessageContainer();
            }

            const messageElement = this.createMessageElement(message, type);
            container.appendChild(messageElement);

            // Animate in
            setTimeout(() => {
                messageElement.classList.add('show');
            }, 10);

            // Auto-remove if duration is set
            if (duration > 0) {
                setTimeout(() => {
                    this.removeMessage(messageElement);
                }, duration);
            }

            // Remove on click
            messageElement.addEventListener('click', () => {
                this.removeMessage(messageElement);
            });

        } catch (error) {
            console.error('Error showing message:', error);
            // Fallback to alert for critical errors
            if (type === 'error') {
                alert(message);
            }
        }
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'global-message-container';
        container.className = 'global-message-container';
        document.body.appendChild(container);
        return container;
    }

    createMessageElement(message, type) {
        const element = document.createElement('div');
        element.className = `global-message ${type}`;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'message-close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close message');
        
        element.appendChild(content);
        element.appendChild(closeButton);
        
        return element;
    }

    removeMessage(messageElement) {
        try {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        } catch (error) {
            console.warn('Error removing message:', error);
        }
    }

    // Loading state management
    showLoading(message = 'Loading...') {
        this.hideLoading(); // Remove any existing loading
        
        const overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.className = 'global-loading-overlay';
        
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Disable page interactions
        document.body.style.overflow = 'hidden';
    }

    hideLoading() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
        document.body.style.overflow = '';
    }

    updateLoadingMessage(message) {
        const messageElement = document.querySelector('#global-loading-overlay .loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    // Retry queue management
    addToRetryQueue(operation) {
        this.retryQueue.push(operation);
    }

    async processRetryQueue() {
        if (!this.isOnline || this.retryQueue.length === 0) {
            return;
        }

        this.showInfo(`Retrying ${this.retryQueue.length} failed operations...`);

        const operations = [...this.retryQueue];
        this.retryQueue = [];

        for (const operation of operations) {
            try {
                await operation();
            } catch (error) {
                console.warn('Retry operation failed:', error);
                // Don't re-add to queue to avoid infinite loops
            }
        }
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get error reports for debugging
    getErrorReport() {
        return {
            errors: this.errors,
            isOnline: this.isOnline,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
    }

    // Clear error history
    clearErrors() {
        this.errors = [];
    }
}

// Custom error classes
class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}

// Initialize global error handler
const globalErrorHandler = new GlobalErrorHandler();

// Add CSS for error handling UI
const style = document.createElement('style');
style.textContent = `
    .global-message-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        width: 100%;
    }
    
    .global-message {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        word-wrap: break-word;
    }
    
    .global-message.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .global-message.error {
        background-color: #fed7d7;
        color: #c53030;
        border-left: 4px solid #e53e3e;
    }
    
    .global-message.warning {
        background-color: #faf089;
        color: #975a16;
        border-left: 4px solid #d69e2e;
    }
    
    .global-message.success {
        background-color: #c6f6d5;
        color: #22543d;
        border-left: 4px solid #38a169;
    }
    
    .global-message.info {
        background-color: #bee3f8;
        color: #2a4365;
        border-left: 4px solid #3182ce;
    }
    
    .message-content {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
    }
    
    .message-close {
        background: none;
        border: none;
        font-size: 18px;
        font-weight: bold;
        color: currentColor;
        cursor: pointer;
        margin-left: 12px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .message-close:hover {
        opacity: 1;
    }
    
    .global-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
    }
    
    .loading-content {
        background: white;
        padding: 40px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 90%;
    }
    
    .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #4299e1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    .loading-message {
        color: #4a5568;
        font-size: 16px;
        font-weight: 600;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
        .global-message-container {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }
        
        .loading-content {
            padding: 30px 20px;
            margin: 20px;
        }
    }
`;

document.head.appendChild(style);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlobalErrorHandler, ValidationError, NetworkError, globalErrorHandler };
} else {
    window.GlobalErrorHandler = GlobalErrorHandler;
    window.ValidationError = ValidationError;
    window.NetworkError = NetworkError;
    window.ErrorHandler = globalErrorHandler; // For backward compatibility
}