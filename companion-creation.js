// Companion Creation Flow with Enhanced Error Handling

let companionType = null;
let interfaceType = null;
let isLoading = false;

// Error handling utilities
const ErrorHandler = {
    showError(message, type = 'error') {
        console.error(`[${type.toUpperCase()}]`, message);
        this.displayUserMessage(message, type);
    },

    showSuccess(message) {
        console.log('[SUCCESS]', message);
        this.displayUserMessage(message, 'success');
    },

    showWarning(message) {
        console.warn('[WARNING]', message);
        this.displayUserMessage(message, 'warning');
    },

    displayUserMessage(message, type) {
        // Create or update status message element
        let statusElement = document.getElementById('status-message');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'status-message';
            statusElement.className = 'status-message';
            
            // Try to insert before chat messages or at the top of the current screen
            const chatContainer = document.getElementById('chat-messages');
            const activeScreen = document.querySelector('.screen.active');
            
            if (chatContainer && chatContainer.parentNode) {
                chatContainer.parentNode.insertBefore(statusElement, chatContainer);
            } else if (activeScreen) {
                activeScreen.insertBefore(statusElement, activeScreen.firstChild);
            } else {
                document.body.appendChild(statusElement);
            }
        }

        statusElement.className = `status-message ${type}`;
        statusElement.textContent = message;
        statusElement.style.display = 'block';

        // Auto-hide after 5 seconds for success/warning messages
        if (type !== 'error') {
            setTimeout(() => {
                if (statusElement && statusElement.parentNode) {
                    statusElement.style.display = 'none';
                }
            }, 5000);
        }
    },

    hideMessage() {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    },

    handleNetworkError(error, operation = 'operation') {
        console.error(`Network error during ${operation}:`, error);
        
        if (!navigator.onLine) {
            this.showError('You appear to be offline. Please check your internet connection and try again.');
            return;
        }

        if (error.name === 'AbortError') {
            this.showError(`${operation} was cancelled. Please try again.`);
            return;
        }

        if (error.code === 'NETWORK_ERROR' || error.message.includes('fetch')) {
            this.showError(`Network error during ${operation}. Please check your connection and try again.`);
            return;
        }

        this.showError(`An error occurred during ${operation}. Please try again.`);
    },

    handleAPIError(response, operation = 'operation') {
        if (!response || !response.error) {
            this.showError(`Unknown error during ${operation}. Please try again.`);
            return;
        }

        const errorMessage = response.error;
        const errorType = response.type || 'UNKNOWN_ERROR';

        switch (errorType) {
            case 'VALIDATION_ERROR':
                this.showError(`Input validation error: ${errorMessage}`);
                break;
            case 'RATE_LIMIT_ERROR':
                this.showError(`Too many requests. Please wait a moment and try again.`);
                break;
            case 'API_ERROR':
                this.showError(`Service error: ${errorMessage}`);
                break;
            default:
                this.showError(`Error: ${errorMessage}`);
        }
    }
};

// Loading state management
const LoadingManager = {
    show(message = 'Loading...') {
        isLoading = true;
        let loadingElement = document.getElementById('loading-overlay');
        
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loading-overlay';
            loadingElement.className = 'loading-overlay';
            loadingElement.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-message">${message}</div>
                </div>
            `;
            document.body.appendChild(loadingElement);
        } else {
            const messageElement = loadingElement.querySelector('.loading-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }

        loadingElement.style.display = 'flex';
        
        // Disable user inputs
        this.disableInputs(true);
    },

    hide() {
        isLoading = false;
        const loadingElement = document.getElementById('loading-overlay');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Re-enable user inputs
        this.disableInputs(false);
        ErrorHandler.hideMessage(); // Hide any error messages when loading completes
    },

    disableInputs(disabled) {
        const inputs = document.querySelectorAll('input, button, textarea, select');
        inputs.forEach(input => {
            if (disabled) {
                input.setAttribute('data-was-disabled', input.disabled);
                input.disabled = true;
            } else {
                const wasDisabled = input.getAttribute('data-was-disabled') === 'true';
                input.disabled = wasDisabled;
                input.removeAttribute('data-was-disabled');
            }
        });
    }
};

// Enhanced fetch with timeout and retry
async function safeFetch(url, options = {}, timeout = 30000, retries = 2) {
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (attempt === retries) {
                throw error;
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

// Input validation utilities
const Validator = {
    validateMessage(message) {
        if (!message || typeof message !== 'string') {
            throw new Error('Message is required');
        }
        
        const trimmed = message.trim();
        if (trimmed.length === 0) {
            throw new Error('Message cannot be empty');
        }
        
        if (trimmed.length > 1000) {
            throw new Error('Message is too long (maximum 1000 characters)');
        }
        
        return trimmed;
    },

    validateSession(sessionId) {
        if (sessionId && (typeof sessionId !== 'string' || sessionId.length > 100)) {
            throw new Error('Invalid session ID');
        }
        return sessionId;
    }
};

// Detect companion type from URL or session with error handling
function getCompanionType() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const typeFromUrl = urlParams.get('type');
        const typeFromSession = sessionStorage.getItem('companionType');
        
        const validTypes = ['future-self', 'loved-one', 'inner-child', 'mentor'];
        const type = typeFromUrl || typeFromSession || 'future-self';
        
        if (!validTypes.includes(type)) {
            console.warn(`Invalid companion type: ${type}, defaulting to future-self`);
            return 'future-self';
        }
        
        return type;
    } catch (error) {
        console.error('Error getting companion type:', error);
        return 'future-self';
    }
}

function setCompanionTypeUI(type) {
    try {
        const icon = document.getElementById('type-icon');
        const title = document.getElementById('type-title');
        const desc = document.getElementById('type-description');
        
        if (!icon || !title || !desc) {
            console.warn('Companion type UI elements not found');
            return;
        }

        switch(type) {
            case 'future-self':
                icon.innerHTML = '<i class="fas fa-rocket"></i>';
                title.textContent = 'Talk to Your Future Self';
                desc.textContent = 'Set your goals, dreams, and aspirations. Meet the person you want to become.';
                break;
            case 'loved-one':
                icon.innerHTML = '<i class="fas fa-heart"></i>';
                title.textContent = 'Remember Loved Ones';
                desc.textContent = 'Reconnect with someone special who has passed away.';
                break;
            case 'inner-child':
                icon.innerHTML = '<i class="fas fa-child"></i>';
                title.textContent = 'Heal with Your Inner Child';
                desc.textContent = 'Have a healing conversation with your younger self.';
                break;
            case 'mentor':
                icon.innerHTML = '<i class="fas fa-star"></i>';
                title.textContent = 'Talk to Mentors & Idols';
                desc.textContent = 'Learn from historical figures and role models.';
                break;
            default:
                icon.innerHTML = '<i class="fas fa-user-circle"></i>';
                title.textContent = 'Create Your Companion';
                desc.textContent = 'Let\'s start building your AI companion.';
        }
    } catch (error) {
        console.error('Error setting companion type UI:', error);
        ErrorHandler.showWarning('There was an issue updating the interface');
    }
}

function showScreen(screenId) {
    try {
        if (!screenId || typeof screenId !== 'string') {
            throw new Error('Invalid screen ID');
        }

        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(screenId);
        
        if (!targetScreen) {
            throw new Error(`Screen '${screenId}' not found`);
        }
        
        targetScreen.classList.add('active');
        
        // Clear any previous error messages when changing screens
        ErrorHandler.hideMessage();
    } catch (error) {
        console.error('Error showing screen:', error);
        ErrorHandler.showError('Unable to navigate to the requested screen');
    }
}

// Interface selection with error handling
window.selectInterface = function(type) {
    try {
        if (!type || !['text', 'voice', 'avatar'].includes(type)) {
            throw new Error('Invalid interface type');
        }

        interfaceType = type;
        
        if (type === 'text') {
            showScreen('chat-interface');
            startFutureSelfChat();
        } else if (type === 'voice') {
            showScreen('chat-interface');
            startFutureSelfChat(true);
        } else if (type === 'avatar') {
            // Placeholder: just show chat for now
            showScreen('chat-interface');
            startFutureSelfChat();
        }
    } catch (error) {
        console.error('Error selecting interface:', error);
        ErrorHandler.showError('Unable to start the selected interface');
    }
};

// --- Future Self Chat Logic with Enhanced Error Handling ---
let chatStarted = false;
let chatStep = 0;
let futureSelfProfile = {};

function startFutureSelfChat(isVoice = false) {
    try {
        if (chatStarted) {
            console.log('Chat already started');
            return;
        }
        
        chatStarted = true;
        chatStep = 0;
        futureSelfProfile = {};
        
        clearChat();
        addMessage('assistant', "Hi! I'm your future self. Let's set the stage for our conversation. I'll ask a few questions to get started.");
        
        setTimeout(() => {
            try {
                askNextFutureSelfQuestion(isVoice);
            } catch (error) {
                console.error('Error asking next question:', error);
                ErrorHandler.showError('Unable to continue the conversation');
            }
        }, 1200);
        
    } catch (error) {
        console.error('Error starting future self chat:', error);
        ErrorHandler.showError('Unable to start the chat. Please try refreshing the page.');
    }
}

function askNextFutureSelfQuestion(isVoice = false) {
    try {
        const questions = [
            "What year (or age) do you want to talk to your future self in?",
            "What are your biggest goals or dreams for that time?",
            "What is one challenge you hope to overcome by then?",
            "How do you want to feel about yourself in the future?",
            "Is there a message you want your future self to remember?"
        ];
        
        if (chatStep < questions.length) {
            addMessage('assistant', questions[chatStep]);
        } else {
            addMessage('assistant', "Thank you! I'm ready to talk as your future self. Ask me anything, or share your thoughts.");
            // Now, switch to open chat mode
            chatStep = 'open';
        }
    } catch (error) {
        console.error('Error asking next question:', error);
        ErrorHandler.showError('Unable to continue with questions');
    }
}

window.sendMessage = function() {
    if (isLoading) {
        console.log('Already processing a message');
        return;
    }

    try {
        const input = document.getElementById('user-input');
        if (!input) {
            throw new Error('Input element not found');
        }

        const msg = Validator.validateMessage(input.value);
        
        addMessage('user', msg);
        input.value = '';
        input.style.height = 'auto';

        if (chatStep !== 'open') {
            // Save answer
            const keys = ['year', 'goals', 'challenge', 'feeling', 'message'];
            if (keys[chatStep]) {
                futureSelfProfile[keys[chatStep]] = msg;
            }
            chatStep++;
            
            setTimeout(() => {
                try {
                    askNextFutureSelfQuestion(interfaceType === 'voice');
                } catch (error) {
                    console.error('Error in delayed question:', error);
                    ErrorHandler.showError('Unable to continue the conversation');
                }
            }, 800);
        } else {
            // Open chat: send to backend for AI response
            getFutureSelfResponse(msg, futureSelfProfile, interfaceType === 'voice');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        if (error.message.includes('validation') || error.message.includes('required') || error.message.includes('empty') || error.message.includes('long')) {
            ErrorHandler.showError(error.message);
        } else {
            ErrorHandler.showError('Unable to send message. Please try again.');
        }
    }
};

function addMessage(sender, text) {
    try {
        if (!sender || !text) {
            throw new Error('Invalid message parameters');
        }

        const messages = document.getElementById('chat-messages');
        if (!messages) {
            throw new Error('Chat messages container not found');
        }

        const div = document.createElement('div');
        div.className = 'message ' + sender;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;
        
        div.appendChild(content);
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    } catch (error) {
        console.error('Error adding message:', error);
        // Don't show user error for this as it would be confusing
    }
}

function clearChat() {
    try {
        const messages = document.getElementById('chat-messages');
        if (messages) {
            messages.innerHTML = '';
        }
    } catch (error) {
        console.error('Error clearing chat:', error);
    }
}

// --- AI Backend Integration with Enhanced Error Handling ---
async function getFutureSelfResponse(userMsg, profile, isVoice = false) {
    if (isLoading) {
        console.log('Already processing a request');
        return;
    }

    try {
        // Validate inputs
        const validatedMsg = Validator.validateMessage(userMsg);
        
        LoadingManager.show('Thinking...');
        
        // Add temporary thinking message
        addMessage('assistant', 'Thinking...');
        
        // Compose a system prompt for future self
        const year = profile.year || 'the future';
        const goals = profile.goals || '';
        const challenge = profile.challenge || '';
        const feeling = profile.feeling || '';
        const message = profile.message || '';
        
        const systemPrompt = `You are the user's future self. Respond as if you are them in the year ${year}. Their goals: ${goals}. Challenge: ${challenge}. Desired feeling: ${feeling}. Message: ${message}. Be supportive, wise, and a little playful.`;
        
        const sessionId = `future-self-${year.replace(/\s+/g, '-')}`;
        
        const response = await safeFetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: validatedMsg,
                personalityContext: systemPrompt,
                sessionId: Validator.validateSession(sessionId)
            })
        }, 30000, 2);

        const data = await response.json();
        
        // Remove 'Thinking...' message
        const messages = document.getElementById('chat-messages');
        if (messages && messages.lastChild && messages.lastChild.classList.contains('assistant')) {
            messages.removeChild(messages.lastChild);
        }

        if (data.success && data.response) {
            addMessage('assistant', data.response);
            
            // If voice is enabled and we have audio, play it
            if (isVoice && data.audio_url) {
                try {
                    await playVoice(data.audio_url);
                } catch (audioError) {
                    console.warn('Audio playback failed:', audioError);
                    // Don't show error to user for audio failure
                }
            } else if (isVoice && data.response) {
                // Fallback to browser TTS
                try {
                    await playVoiceFallback(data.response);
                } catch (ttsError) {
                    console.warn('TTS fallback failed:', ttsError);
                }
            }
        } else {
            throw new Error(data.error || 'No response received');
        }

    } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Remove 'Thinking...' message if it exists
        const messages = document.getElementById('chat-messages');
        if (messages && messages.lastChild && messages.lastChild.classList.contains('assistant')) {
            const lastMessage = messages.lastChild.querySelector('.message-content');
            if (lastMessage && lastMessage.textContent === 'Thinking...') {
                messages.removeChild(messages.lastChild);
            }
        }
        
        if (error.name === 'AbortError') {
            ErrorHandler.showError('Request was cancelled. Please try again.');
        } else if (error.message.includes('HTTP')) {
            const response = await error.response?.json().catch(() => ({}));
            ErrorHandler.handleAPIError(response, 'chat');
        } else {
            ErrorHandler.handleNetworkError(error, 'chat');
        }
        
        // Add error message to chat
        addMessage('assistant', 'Sorry, I encountered an error. Please try asking again.');
        
    } finally {
        LoadingManager.hide();
    }
}

// --- Enhanced Voice Handling ---
async function playVoice(audioUrl) {
    try {
        if (!audioUrl || typeof audioUrl !== 'string') {
            throw new Error('Invalid audio URL');
        }

        // Create audio element and play
        const audio = new Audio(audioUrl);
        
        return new Promise((resolve, reject) => {
            audio.onload = () => resolve();
            audio.onerror = (error) => reject(new Error('Audio failed to load'));
            audio.onended = () => resolve();
            
            audio.play().catch(reject);
        });
        
    } catch (error) {
        console.error('Error playing voice:', error);
        throw error;
    }
}

async function playVoiceFallback(text) {
    try {
        if (!('speechSynthesis' in window)) {
            throw new Error('Speech synthesis not supported');
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.02;
        utterance.pitch = 1.1;
        utterance.lang = 'en-US';
        
        return new Promise((resolve, reject) => {
            utterance.onend = () => resolve();
            utterance.onerror = (error) => reject(error);
            
            window.speechSynthesis.speak(utterance);
        });
        
    } catch (error) {
        console.error('Error with TTS fallback:', error);
        throw error;
    }
}

// --- Enhanced Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check for required elements
        const requiredElements = ['welcome-screen'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            ErrorHandler.showError('Some interface elements are missing. Please refresh the page.');
            return;
        }

        companionType = getCompanionType();
        setCompanionTypeUI(companionType);
        showScreen('welcome-screen');
        
        // Add keyboard event listeners with error handling
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.addEventListener('keydown', (e) => {
                try {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                } catch (error) {
                    console.error('Error in keydown handler:', error);
                }
            });
        }

        // Add online/offline detection
        window.addEventListener('online', () => {
            ErrorHandler.showSuccess('Connection restored');
        });

        window.addEventListener('offline', () => {
            ErrorHandler.showWarning('You are currently offline. Some features may not work.');
        });

        console.log('Companion creation initialized successfully');
        
    } catch (error) {
        console.error('Error during initialization:', error);
        ErrorHandler.showError('Failed to initialize the application. Please refresh the page.');
    }
});

// Add CSS for error handling UI
const style = document.createElement('style');
style.textContent = `
    .status-message {
        padding: 12px 16px;
        margin: 10px 0;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        display: none;
        animation: slideIn 0.3s ease-out;
    }
    
    .status-message.error {
        background-color: #fee;
        color: #c53030;
        border: 1px solid #fed7d7;
    }
    
    .status-message.success {
        background-color: #f0fff4;
        color: #38a169;
        border: 1px solid #c6f6d5;
    }
    
    .status-message.warning {
        background-color: #fffbeb;
        color: #d69e2e;
        border: 1px solid #faf089;
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    
    .loading-content {
        background: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top: 4px solid #4299e1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
    }
    
    .loading-message {
        color: #4a5568;
        font-size: 16px;
        font-weight: 500;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

document.head.appendChild(style); 