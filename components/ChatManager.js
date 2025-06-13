// Chat Manager Component with Enhanced Error Handling
class ChatManager {
    constructor(questionManager) {
        this.questionManager = questionManager;
        this.messages = [];
        this.isTyping = false;
        this.typingSpeed = 50; // ms per character for typewriter effect
        this.maxRetries = 3;
        this.isProcessing = false;
        
        this.init();
    }
    
    init() {
        try {
            this.setupEventListeners();
            this.autoResizeTextarea();
            this.validateRequiredElements();
            console.log('ChatManager initialized successfully');
        } catch (error) {
            console.error('Error initializing ChatManager:', error);
            this.showError('Failed to initialize chat system');
        }
    }
    
    validateRequiredElements() {
        const requiredElements = ['user-input', 'chat-messages'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
        }
    }
    
    setupEventListeners() {
        try {
            const textarea = document.getElementById('user-input');
            if (textarea) {
                textarea.addEventListener('keydown', (e) => {
                    try {
                        this.handleInputKeydown(e);
                    } catch (error) {
                        console.error('Error in keydown handler:', error);
                        this.showError('Input error occurred');
                    }
                });
                
                // Add paste event listener for validation
                textarea.addEventListener('paste', (e) => {
                    setTimeout(() => {
                        try {
                            this.validateTextareaContent();
                        } catch (error) {
                            console.warn('Paste validation warning:', error);
                        }
                    }, 0);
                });
            }
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            throw error;
        }
    }
    
    validateTextareaContent() {
        const textarea = document.getElementById('user-input');
        if (!textarea) return;
        
        const maxLength = 1000;
        if (textarea.value.length > maxLength) {
            textarea.value = textarea.value.substring(0, maxLength);
            this.showWarning(`Message truncated to ${maxLength} characters`);
        }
    }
    
    autoResizeTextarea() {
        try {
            const textarea = document.getElementById('user-input');
            if (textarea) {
                const resizeHandler = function() {
                    try {
                        this.style.height = 'auto';
                        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
                    } catch (error) {
                        console.warn('Error resizing textarea:', error);
                    }
                };
                
                textarea.addEventListener('input', resizeHandler);
                
                // Initial resize
                resizeHandler.call(textarea);
            }
        } catch (error) {
            console.error('Error setting up textarea auto-resize:', error);
        }
    }
    
    validateMessage(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Message content is required');
        }
        
        const trimmed = content.trim();
        if (trimmed.length === 0) {
            throw new Error('Message cannot be empty');
        }
        
        if (trimmed.length > 1000) {
            throw new Error('Message is too long (maximum 1000 characters)');
        }
        
        return trimmed;
    }
    
    addMessage(sender, content, options = {}) {
        try {
            // Validate inputs
            if (!sender || !['user', 'assistant', 'system'].includes(sender)) {
                throw new Error('Invalid sender type');
            }
            
            const validatedContent = this.validateMessage(content);
            
            const message = {
                id: Date.now() + Math.random(),
                sender,
                content: validatedContent,
                timestamp: new Date(),
                ...options
            };
            
            this.messages.push(message);
            this.displayMessage(message);
            
            // Scroll to bottom
            this.scrollToBottom();
            
            return message;
        } catch (error) {
            console.error('Error adding message:', error);
            if (error.message.includes('required') || error.message.includes('empty') || error.message.includes('long')) {
                this.showError(error.message);
            } else {
                this.showError('Failed to add message');
            }
            return null;
        }
    }
    
    displayMessage(message) {
        try {
            if (!message || !message.content) {
                throw new Error('Invalid message object');
            }
            
            const messagesContainer = document.getElementById('chat-messages');
            if (!messagesContainer) {
                throw new Error('Chat messages container not found');
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sender}`;
            messageDiv.dataset.messageId = message.id;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            
            if (message.sender === 'assistant' && message.typewriter) {
                this.typewriterEffect(messageContent, message.content);
            } else {
                messageContent.textContent = message.content;
            }
            
            // Add timestamp if needed
            if (message.showTimestamp) {
                const timestamp = document.createElement('div');
                timestamp.className = 'message-timestamp';
                timestamp.textContent = message.timestamp.toLocaleTimeString();
                messageDiv.appendChild(timestamp);
            }
            
            messageDiv.appendChild(messageContent);
            messagesContainer.appendChild(messageDiv);
            
            // Add animation
            messageDiv.style.animation = 'messageSlide 0.5s ease';
        } catch (error) {
            console.error('Error displaying message:', error);
            // Don't show user error for display issues to avoid confusion
        }
    }
    
    typewriterEffect(element, text) {
        try {
            if (!element || !text) {
                throw new Error('Invalid typewriter parameters');
            }
            
            let index = 0;
            element.textContent = '';
            
            const type = () => {
                try {
                    if (index < text.length) {
                        element.textContent += text.charAt(index);
                        index++;
                        setTimeout(type, this.typingSpeed);
                    }
                } catch (error) {
                    console.error('Error in typewriter effect:', error);
                    // Fallback: display full text
                    element.textContent = text;
                }
            };
            
            type();
        } catch (error) {
            console.error('Error starting typewriter effect:', error);
            // Fallback: display text immediately
            element.textContent = text;
        }
    }
    
    addTypingIndicator() {
        try {
            if (this.isTyping) {
                console.log('Typing indicator already shown');
                return;
            }
            
            this.isTyping = true;
            const messagesContainer = document.getElementById('chat-messages');
            if (!messagesContainer) {
                throw new Error('Messages container not found');
            }
            
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message assistant typing-indicator';
            typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
            
            messagesContainer.appendChild(typingDiv);
            this.scrollToBottom();
            
            this.currentTypingIndicator = typingDiv;
        } catch (error) {
            console.error('Error adding typing indicator:', error);
            this.isTyping = false;
        }
    }
    
    removeTypingIndicator() {
        try {
            if (this.currentTypingIndicator && this.currentTypingIndicator.parentNode) {
                this.currentTypingIndicator.parentNode.removeChild(this.currentTypingIndicator);
                this.currentTypingIndicator = null;
            }
            this.isTyping = false;
        } catch (error) {
            console.error('Error removing typing indicator:', error);
            this.isTyping = false;
        }
    }
    
    sendMessage() {
        if (this.isProcessing) {
            console.log('Message already being processed');
            return;
        }
        
        try {
            const input = document.getElementById('user-input');
            if (!input) {
                throw new Error('Input element not found');
            }
            
            const message = this.validateMessage(input.value);
            
            this.isProcessing = true;
            this.addMessage('user', message);
            
            // Clear input
            input.value = '';
            input.style.height = 'auto';
            
            // Trigger message sent event
            this.onMessageSent(message);
            
        } catch (error) {
            console.error('Error sending message:', error);
            if (error.message.includes('required') || error.message.includes('empty') || error.message.includes('long')) {
                this.showError(error.message);
            } else {
                this.showError('Failed to send message');
            }
        } finally {
            this.isProcessing = false;
        }
    }
    
    handleInputKeydown(event) {
        try {
            if (!event) {
                throw new Error('Event object is required');
            }
            
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        } catch (error) {
            console.error('Error handling keydown:', error);
        }
    }
    
    scrollToBottom() {
        try {
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } catch (error) {
            console.error('Error scrolling to bottom:', error);
        }
    }
    
    clearMessages() {
        try {
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            this.messages = [];
            this.isTyping = false;
            this.currentTypingIndicator = null;
            this.isProcessing = false;
        } catch (error) {
            console.error('Error clearing messages:', error);
        }
    }
    
    getMessages() {
        return [...this.messages]; // Return a copy to prevent external modifications
    }
    
    getLastMessage() {
        return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
    }
    
    // Event callbacks
    onMessageSent(message) {
        try {
            // Override this in the main onboarding manager
            if (this.messageSentCallback && typeof this.messageSentCallback === 'function') {
                this.messageSentCallback(message);
            }
        } catch (error) {
            console.error('Error in message sent callback:', error);
        }
    }
    
    setMessageSentCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.messageSentCallback = callback;
    }
    
    // Utility methods with error handling
    addComfortingQuote() {
        try {
            if (!this.questionManager || typeof this.questionManager.getRandomQuote !== 'function') {
                throw new Error('Question manager not available or invalid');
            }
            
            const quote = this.questionManager.getRandomQuote();
            if (quote) {
                this.addMessage('assistant', `"${quote}"`, { 
                    type: 'quote',
                    delay: 500 
                });
            }
        } catch (error) {
            console.error('Error adding comforting quote:', error);
            // Fallback quote
            this.addMessage('assistant', '"Take one day at a time."', { 
                type: 'quote',
                delay: 500 
            });
        }
    }
    
    addQuestion(question, options = {}) {
        try {
            if (!question || typeof question !== 'string') {
                throw new Error('Valid question is required');
            }
            
            this.addMessage('assistant', question, {
                type: 'question',
                typewriter: true,
                ...options
            });
        } catch (error) {
            console.error('Error adding question:', error);
            this.showError('Failed to add question');
        }
    }
    
    addTransitionMessage(message, options = {}) {
        try {
            if (!message || typeof message !== 'string') {
                throw new Error('Valid message is required');
            }
            
            this.addMessage('assistant', message, {
                type: 'transition',
                ...options
            });
        } catch (error) {
            console.error('Error adding transition message:', error);
            this.showError('Failed to add transition message');
        }
    }
    
    // Animation helpers
    animateMessageIn(messageElement) {
        try {
            if (!messageElement) {
                throw new Error('Message element is required');
            }
            
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                messageElement.style.transition = 'all 0.5s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 100);
        } catch (error) {
            console.error('Error animating message:', error);
        }
    }
    
    // Export messages for processing
    exportMessages() {
        try {
            return this.messages.map(msg => ({
                sender: msg.sender,
                content: msg.content,
                timestamp: msg.timestamp,
                type: msg.type || 'message'
            }));
        } catch (error) {
            console.error('Error exporting messages:', error);
            return [];
        }
    }
    
    // Import messages (for loading saved conversations)
    importMessages(messages) {
        try {
            if (!Array.isArray(messages)) {
                throw new Error('Messages must be an array');
            }
            
            this.clearMessages();
            
            messages.forEach((msg, index) => {
                try {
                    if (!msg.sender || !msg.content) {
                        console.warn(`Skipping invalid message at index ${index}`);
                        return;
                    }
                    
                    this.addMessage(msg.sender, msg.content, {
                        type: msg.type,
                        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
                    });
                } catch (msgError) {
                    console.warn(`Error importing message at index ${index}:`, msgError);
                }
            });
        } catch (error) {
            console.error('Error importing messages:', error);
            this.showError('Failed to load conversation history');
        }
    }
    
    // Error handling methods
    showError(message) {
        console.error('[ChatManager Error]', message);
        this.displayStatusMessage(message, 'error');
    }
    
    showWarning(message) {
        console.warn('[ChatManager Warning]', message);
        this.displayStatusMessage(message, 'warning');
    }
    
    showSuccess(message) {
        console.log('[ChatManager Success]', message);
        this.displayStatusMessage(message, 'success');
    }
    
    displayStatusMessage(message, type) {
        try {
            // Try to use global ErrorHandler if available
            if (typeof ErrorHandler !== 'undefined' && ErrorHandler.displayUserMessage) {
                ErrorHandler.displayUserMessage(message, type);
                return;
            }
            
            // Fallback: create simple status message
            let statusElement = document.getElementById('chat-status-message');
            if (!statusElement) {
                statusElement = document.createElement('div');
                statusElement.id = 'chat-status-message';
                statusElement.className = 'chat-status-message';
                
                const chatContainer = document.getElementById('chat-messages');
                if (chatContainer && chatContainer.parentNode) {
                    chatContainer.parentNode.insertBefore(statusElement, chatContainer);
                }
            }
            
            statusElement.className = `chat-status-message ${type}`;
            statusElement.textContent = message;
            statusElement.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (statusElement) {
                    statusElement.style.display = 'none';
                }
            }, 5000);
            
        } catch (error) {
            console.error('Error displaying status message:', error);
        }
    }
    
    // Health check method
    isHealthy() {
        try {
            const requiredElements = ['user-input', 'chat-messages'];
            const missingElements = requiredElements.filter(id => !document.getElementById(id));
            
            if (missingElements.length > 0) {
                console.warn('ChatManager health check failed: missing elements', missingElements);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking ChatManager health:', error);
            return false;
        }
    }
    
    // Cleanup method
    destroy() {
        try {
            this.clearMessages();
            
            // Remove event listeners
            const textarea = document.getElementById('user-input');
            if (textarea) {
                textarea.removeEventListener('keydown', this.handleInputKeydown);
                textarea.removeEventListener('paste', this.validateTextareaContent);
                textarea.removeEventListener('input', this.autoResizeTextarea);
            }
            
            // Clear callback
            this.messageSentCallback = null;
            
            console.log('ChatManager destroyed successfully');
        } catch (error) {
            console.error('Error destroying ChatManager:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
} else {
    window.ChatManager = ChatManager;
} 