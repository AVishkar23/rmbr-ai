// Chat Manager Component
class ChatManager {
    constructor(questionManager) {
        this.questionManager = questionManager;
        this.messages = [];
        this.isTyping = false;
        this.typingSpeed = 50; // ms per character for typewriter effect
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.autoResizeTextarea();
    }
    
    setupEventListeners() {
        const textarea = document.getElementById('user-input');
        if (textarea) {
            textarea.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        }
    }
    
    autoResizeTextarea() {
        const textarea = document.getElementById('user-input');
        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
        }
    }
    
    addMessage(sender, content, options = {}) {
        const message = {
            id: Date.now() + Math.random(),
            sender,
            content,
            timestamp: new Date(),
            ...options
        };
        
        this.messages.push(message);
        this.displayMessage(message);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        return message;
    }
    
    displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
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
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // Add animation
        messageDiv.style.animation = 'messageSlide 0.5s ease';
    }
    
    typewriterEffect(element, text) {
        let index = 0;
        element.textContent = '';
        
        const type = () => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(type, this.typingSpeed);
            }
        };
        
        type();
    }
    
    addTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator';
        typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        
        this.currentTypingIndicator = typingDiv;
    }
    
    removeTypingIndicator() {
        if (this.currentTypingIndicator && this.currentTypingIndicator.parentNode) {
            this.currentTypingIndicator.parentNode.removeChild(this.currentTypingIndicator);
            this.currentTypingIndicator = null;
        }
        this.isTyping = false;
    }
    
    sendMessage() {
        const input = document.getElementById('user-input');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage('user', message);
            
            // Clear input
            input.value = '';
            input.style.height = 'auto';
            
            // Trigger message sent event
            this.onMessageSent(message);
        }
    }
    
    handleInputKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    clearMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        this.messages = [];
    }
    
    getMessages() {
        return this.messages;
    }
    
    getLastMessage() {
        return this.messages[this.messages.length - 1];
    }
    
    // Event callbacks
    onMessageSent(message) {
        // Override this in the main onboarding manager
        if (this.messageSentCallback) {
            this.messageSentCallback(message);
        }
    }
    
    setMessageSentCallback(callback) {
        this.messageSentCallback = callback;
    }
    
    // Utility methods
    addComfortingQuote() {
        const quote = this.questionManager.getRandomQuote();
        this.addMessage('assistant', `"${quote}"`, { 
            type: 'quote',
            delay: 500 
        });
    }
    
    addQuestion(question, options = {}) {
        this.addMessage('assistant', question, {
            type: 'question',
            typewriter: true,
            ...options
        });
    }
    
    addTransitionMessage(message, options = {}) {
        this.addMessage('assistant', message, {
            type: 'transition',
            ...options
        });
    }
    
    // Animation helpers
    animateMessageIn(messageElement) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            messageElement.style.transition = 'all 0.5s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Export messages for processing
    exportMessages() {
        return this.messages.map(msg => ({
            sender: msg.sender,
            content: msg.content,
            timestamp: msg.timestamp,
            type: msg.type || 'message'
        }));
    }
    
    // Import messages (for loading saved conversations)
    importMessages(messages) {
        this.clearMessages();
        messages.forEach(msg => {
            this.addMessage(msg.sender, msg.content, {
                type: msg.type,
                timestamp: new Date(msg.timestamp)
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
} else {
    window.ChatManager = ChatManager;
} 