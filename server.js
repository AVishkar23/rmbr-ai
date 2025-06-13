require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

// Enhanced error handling and validation utilities
class ErrorHandler extends Error {
    constructor(message, statusCode = 500, type = 'GENERAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends ErrorHandler {
    constructor(message, field = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}

class APIError extends ErrorHandler {
    constructor(message, statusCode = 500, provider = null) {
        super(message, statusCode, 'API_ERROR');
        this.provider = provider;
    }
}

// Request validation helpers
const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        throw new ValidationError(`${fieldName} is required`, fieldName);
    }
};

const validateMinLength = (value, minLength, fieldName) => {
    if (value && value.length < minLength) {
        throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName);
    }
};

const validateMaxLength = (value, maxLength, fieldName) => {
    if (value && value.length > maxLength) {
        throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, fieldName);
    }
};

const validateFileSize = (file, maxSizeBytes) => {
    if (file && file.size > maxSizeBytes) {
        throw new ValidationError(`File size must not exceed ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
    }
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!rateLimitStore.has(clientId)) {
            rateLimitStore.set(clientId, []);
        }
        
        const requests = rateLimitStore.get(clientId);
        const recentRequests = requests.filter(timestamp => timestamp > windowStart);
        
        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: `Too many requests. Maximum ${maxRequests} requests per ${Math.round(windowMs / 60000)} minutes.`,
                retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
            });
        }
        
        recentRequests.push(now);
        rateLimitStore.set(clientId, recentRequests);
        next();
    };
};

// Timeout wrapper for external API calls
const withTimeout = (promise, timeoutMs = 30000, operation = 'Operation') => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new APIError(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
};

// Enhanced axios instance with interceptors
const createAPIClient = (baseURL, defaultHeaders = {}) => {
    const client = axios.create({
        baseURL,
        timeout: 30000,
        headers: defaultHeaders
    });

    client.interceptors.response.use(
        response => response,
        error => {
            if (error.code === 'ECONNABORTED') {
                throw new APIError('Request timeout', 408, baseURL);
            }
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.response.data?.error || error.message;
                throw new APIError(message, status, baseURL);
            }
            throw new APIError(error.message, 500, baseURL);
        }
    );

    return client;
};

// Debug: Check environment variables
console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'FOUND' : 'NOT FOUND');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'FOUND' : 'NOT FOUND');
console.log('Current working directory:', process.cwd());
console.log('Files in current directory:', require('fs').readdirSync('.'));
console.log('===================================');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.')); // Serve static files

// Global rate limiting
app.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Configure multer for file uploads with enhanced validation
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        try {
            const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/x-wav'];
            const allowedExtensions = ['.mp3', '.wav', '.m4a'];
            
            if (!allowedTypes.includes(file.mimetype)) {
                return cb(new ValidationError('Invalid file type. Only MP3, WAV, and M4A files are allowed.'));
            }
            
            const fileExtension = path.extname(file.originalname).toLowerCase();
            if (!allowedExtensions.includes(fileExtension)) {
                return cb(new ValidationError('Invalid file extension. Only .mp3, .wav, and .m4a files are allowed.'));
            }
            
            cb(null, true);
        } catch (error) {
            cb(error);
        }
    }
});

// Store voice IDs in memory (in production, use a database)
const voiceStore = new Map();

// Store personality data in memory (in production, use a database)
const personalityStore = new Map();

// Store memory data and conversation history (in production, use a database)
const memoryStore = new Map();
const conversationHistory = new Map();

// ElevenLabs API Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

// Enhanced API clients
const elevenLabsClient = ELEVENLABS_API_KEY ? createAPIClient(ELEVENLABS_BASE_URL, {
    'xi-api-key': ELEVENLABS_API_KEY
}) : null;

const openAIClient = OPENAI_API_KEY ? createAPIClient(OPENAI_BASE_URL, {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
}) : null;

// Routes

// Health check with enhanced diagnostics
app.get('/api/health', (req, res) => {
    const health = {
        status: 'OK',
        message: 'Rmbr AI Backend is running',
        timestamp: new Date().toISOString(),
        services: {
            elevenlabs: !!ELEVENLABS_API_KEY,
            openai: !!OPENAI_API_KEY
        },
        memory: {
            voices: voiceStore.size,
            personalities: personalityStore.size,
            conversations: conversationHistory.size,
            memories: Array.from(memoryStore.values()).reduce((total, memories) => total + memories.length, 0)
        }
    };
    
    res.json(health);
});

// Clone voice using ElevenLabs with enhanced error handling
app.post('/api/clone-voice', upload.single('audio'), async (req, res) => {
    try {
        // Validate API availability
        if (!ELEVENLABS_API_KEY) {
            throw new APIError('ElevenLabs API key not configured', 503, 'ElevenLabs');
        }

        // Validate file upload
        if (!req.file) {
            throw new ValidationError('No audio file provided');
        }

        validateFileSize(req.file, 10 * 1024 * 1024); // 10MB

        // Validate file content
        if (!req.file.buffer || req.file.buffer.length === 0) {
            throw new ValidationError('Uploaded file is empty');
        }

        console.log(`Processing voice clone: ${req.file.originalname} (${req.file.size} bytes)`);

        // Create form data for ElevenLabs
        const formData = new FormData();
        formData.append('files', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        formData.append('name', 'Memory Companion Voice');
        formData.append('description', 'Voice clone for Rmbr AI memory companion');

        // Call ElevenLabs API to clone voice with timeout
        const response = await withTimeout(
            elevenLabsClient.post('/voices/add', formData, {
                headers: formData.getHeaders()
            }),
            45000, // 45 second timeout for voice cloning
            'Voice cloning'
        );

        const voiceId = response.data.voice_id;
        
        if (!voiceId) {
            throw new APIError('Failed to receive voice ID from ElevenLabs', 500, 'ElevenLabs');
        }
        
        // Store voice ID (in production, save to database)
        voiceStore.set(voiceId, {
            name: 'Memory Companion Voice',
            originalFilename: req.file.originalname,
            fileSize: req.file.size,
            created_at: new Date().toISOString()
        });

        console.log(`Voice cloned successfully: ${voiceId}`);

        res.json({
            success: true,
            voice_id: voiceId,
            message: 'Voice cloned successfully'
        });

    } catch (error) {
        console.error('Voice cloning error:', error);
        
        if (error instanceof ErrorHandler) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                type: error.type,
                ...(error.field && { field: error.field }),
                ...(error.provider && { provider: error.provider })
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to clone voice',
            type: 'VOICE_CLONE_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Generate AI response using OpenAI with enhanced error handling
app.post('/api/chat', async (req, res) => {
    try {
        const { message, voiceId, personalityContext, sessionId } = req.body;

        // Input validation
        validateRequired(message, 'message');
        validateMinLength(message, 1, 'message');
        validateMaxLength(message, 1000, 'message');

        if (personalityContext) {
            validateMaxLength(personalityContext, 5000, 'personalityContext');
        }

        if (!OPENAI_API_KEY) {
            throw new APIError('OpenAI API key not configured', 503, 'OpenAI');
        }

        // Get conversation history and relevant memories
        const sessionKey = sessionId || 'default';
        const history = conversationHistory.get(sessionKey) || [];
        const memories = memoryStore.get(sessionKey) || [];
        
        // Find relevant memories based on the current message
        const relevantMemories = findRelevantMemories(message, memories);
        
        // Build conversation context with memories
        const memoryContext = relevantMemories.length > 0 
            ? `\n\nRELEVANT MEMORIES AND CONTEXT:\n${relevantMemories.map(m => `- ${m.description}: ${m.details}`).join('\n')}`
            : '';
        
        // Build conversation history context
        const historyContext = history.length > 0 
            ? `\n\nRECENT CONVERSATION HISTORY:\n${history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')}`
            : '';

        // Create personality context - REMOVED FILTERS for authentic replication
        const systemPrompt = `You are a memory companion created to help someone reconnect with a loved one. 
        ${personalityContext || 'Be authentic to how the person would actually communicate.'}
        
        CRITICAL GUIDELINES FOR AUTHENTIC REPLICATION:
        - Replicate the person's EXACT emotional essence and authentic communication style
        - Use their genuine emotional patterns and how they express different feelings
        - Match their exact tone, mood, and emotional state based on the context
        - Incorporate their true personality quirks, habits, and unique characteristics
        - Show how they handle different emotions (anger, joy, sadness, frustration, love, etc.)
        - Use their authentic way of showing care, concern, or any other emotion
        - Reflect any emotional complexity, contradictions, or depth in their personality
        - Use their actual common phrases and expressions, including any profanity or casual language
        - Maintain their unique way of expressing emotions, even if unconventional
        - If they were harsh but loving, maintain that exact emotional balance
        - If they used humor, sarcasm, or directness, preserve those emotional traits
        - Speak as if you are the person they remember, with all their emotional authenticity
        - Do NOT sanitize or filter their emotional expression - be their truest self
        - Capture the exact emotional nuance they would have in this situation
        - Replicate their emotional depth and complexity authentically
        
        MEMORY AND CONTEXT GUIDELINES:
        - Use the provided memories and context to respond authentically
        - Reference specific events, people, or situations mentioned in the memories
        - If asked about past events, draw from the relevant memories provided
        - Maintain consistency with the relationship context and history
        - If you don't have specific memory of something, be honest about it while staying in character
        - Use memories to add personal touches and authentic details to responses${memoryContext}${historyContext}`;

        // Call OpenAI API with timeout
        const openaiResponse = await withTimeout(
            openAIClient.post('/chat/completions', {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 200,
                temperature: 0.8  // Increased for more authentic variation
            }),
            30000,
            'OpenAI chat completion'
        );

        const aiResponse = openaiResponse.data.choices?.[0]?.message?.content;
        
        if (!aiResponse) {
            throw new APIError('No response received from OpenAI', 500, 'OpenAI');
        }

        // Store conversation history
        history.push({ role: 'user', content: message, timestamp: new Date() });
        history.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
        
        // Keep only last 20 messages to manage memory
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
        
        conversationHistory.set(sessionKey, history);

        // If voice ID is provided, convert to speech
        let audioUrl = null;
        if (voiceId && ELEVENLABS_API_KEY) {
            try {
                console.log(`Generating speech for voice ID: ${voiceId}`);
                
                const speechResponse = await withTimeout(
                    elevenLabsClient.post(`/text-to-speech/${voiceId}`, {
                        text: aiResponse,
                        model_id: 'eleven_monolingual_v1',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    }, {
                        responseType: 'arraybuffer'
                    }),
                    30000,
                    'Speech synthesis'
                );

                // Convert audio buffer to base64
                const audioBuffer = Buffer.from(speechResponse.data);
                audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
                console.log(`Speech generated successfully (${audioBuffer.length} bytes)`);
            } catch (speechError) {
                console.error('Speech synthesis error:', speechError);
                // Continue without audio if speech fails - don't fail the entire request
            }
        }

        res.json({
            success: true,
            response: aiResponse,
            audio_url: audioUrl,
            voice_id: voiceId,
            relevant_memories: relevantMemories.length,
            session_id: sessionKey
        });

    } catch (error) {
        console.error('Chat error:', error);
        
        if (error instanceof ErrorHandler) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                type: error.type,
                ...(error.field && { field: error.field }),
                ...(error.provider && { provider: error.provider })
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to generate response',
            type: 'CHAT_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get available voices with enhanced error handling
app.get('/api/voices', async (req, res) => {
    try {
        if (!ELEVENLABS_API_KEY) {
            throw new APIError('ElevenLabs API key not configured', 503, 'ElevenLabs');
        }

        const response = await withTimeout(
            elevenLabsClient.get('/voices'),
            15000,
            'Get voices'
        );

        if (!response.data?.voices) {
            throw new APIError('Invalid response from ElevenLabs', 500, 'ElevenLabs');
        }

        res.json({
            success: true,
            voices: response.data.voices,
            count: response.data.voices.length
        });

    } catch (error) {
        console.error('Get voices error:', error);
        
        if (error instanceof ErrorHandler) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                type: error.type,
                ...(error.provider && { provider: error.provider })
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to get voices',
            type: 'VOICES_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Analyze personality from written communications with enhanced validation
app.post('/api/analyze-personality', async (req, res) => {
    try {
        const { type, content } = req.body;

        // Input validation
        validateRequired(content, 'content');
        validateMinLength(content?.trim(), 50, 'content');
        validateMaxLength(content, 10000, 'content');

        if (type && !['text', 'email', 'letter', 'other'].includes(type)) {
            throw new ValidationError('Invalid content type. Must be one of: text, email, letter, other', 'type');
        }

        if (!OPENAI_API_KEY) {
            throw new APIError('OpenAI API key not configured', 503, 'OpenAI');
        }

        // Create analysis prompt based on content type
        const analysisPrompt = createAnalysisPrompt(type, content);

        // Call OpenAI API for personality analysis
        const openaiResponse = await withTimeout(
            openAIClient.post('/chat/completions', {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert at analyzing personality traits and communication styles from written text. 
                        Analyze the provided content and extract the TRUEST form of the person's personality, emotions, and communication style.
                        
                        CRITICAL: Capture their EXACT emotional essence and authentic self, including:
                        - Their genuine emotional patterns and how they express feelings
                        - The exact tone, mood, and emotional state they convey
                        - Their true personality quirks, habits, and unique characteristics
                        - How they handle different emotions (anger, joy, sadness, frustration, love, etc.)
                        - Their authentic way of showing care, concern, or any other emotion
                        - Any emotional complexity, contradictions, or depth in their personality
                        - Their real communication style, including any harshness, sarcasm, or tough love
                        - Direct or blunt communication patterns
                        - Colorful language, profanity, or casual expressions
                        - Unique ways they express emotions (even if unconventional)
                        - Their actual personality, not a sanitized or idealized version
                        
                        Respond with a JSON object containing the following fields:
                        - writingStyle: A detailed description of their authentic writing style and emotional expression
                        - commonPhrases: An array of 5-7 phrases or expressions they commonly use (including any profanity, emotional expressions, or unique language)
                        - personalityTraits: An array of 5-7 personality traits that capture their true essence (including any complex or contradictory traits)
                        - emotionalPatterns: An array of 3-5 emotional patterns or ways they express different feelings
                        - personalityContext: A comprehensive description of their authentic personality, emotional depth, and communication style for AI conversation
                        
                        Be extremely specific and insightful. Focus on capturing the EXACT emotional essence and authentic personality that would help an AI replicate the truest form of this person, including all their emotional complexities, quirks, and unique characteristics.`
                    },
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.3
            }),
            45000,
            'Personality analysis'
        );

        const analysisText = openaiResponse.data.choices?.[0]?.message?.content;
        
        if (!analysisText) {
            throw new APIError('No analysis received from OpenAI', 500, 'OpenAI');
        }
        
        // Parse the JSON response with fallback
        let insights;
        try {
            insights = JSON.parse(analysisText);
            
            // Validate the parsed insights structure
            if (!insights.writingStyle || !insights.commonPhrases || !insights.personalityTraits) {
                throw new Error('Invalid analysis format');
            }
        } catch (parseError) {
            console.warn('Failed to parse OpenAI analysis response, using fallback');
            // If JSON parsing fails, create a basic analysis
            insights = {
                writingStyle: 'Warm and personal communication style',
                commonPhrases: ['"I hope you\'re doing well"', '"Take care"', '"Looking forward to hearing from you"'],
                personalityTraits: ['Caring', 'Supportive', 'Encouraging'],
                emotionalPatterns: ['Expresses concern through questions', 'Shows care through encouragement'],
                personalityContext: 'A caring and supportive person who communicates with warmth and empathy.'
            };
        }

        // Create personality context for conversation
        const personalityContext = `You are communicating as someone with the following authentic characteristics:
        - Writing Style: ${insights.writingStyle}
        - Common Phrases: ${insights.commonPhrases.join(', ')}
        - Personality Traits: ${insights.personalityTraits.join(', ')}
        ${insights.emotionalPatterns ? `- Emotional Patterns: ${insights.emotionalPatterns.join(', ')}` : ''}
        
        Emotional Essence: ${insights.personalityContext}
        
        CRITICAL: When responding, you must:
        - Replicate their EXACT emotional essence and authentic communication style
        - Use their genuine emotional patterns and how they express different feelings
        - Match their exact tone, mood, and emotional state based on the context
        - Incorporate their true personality quirks, habits, and unique characteristics
        - Show how they handle different emotions authentically
        - Use their authentic way of showing care, concern, or any other emotion
        - Reflect any emotional complexity, contradictions, or depth in their personality
        - Use their actual common phrases and expressions naturally
        - Maintain their unique way of expressing emotions, even if unconventional
        - Capture the exact emotional nuance they would have in this situation
        - Be their truest self with all emotional authenticity`;

        // Store personality data (in production, save to database)
        const personalityId = Date.now().toString();
        personalityStore.set(personalityId, {
            type: type || 'other',
            content: content,
            insights: insights,
            personalityContext: personalityContext,
            created_at: new Date().toISOString()
        });

        res.json({
            success: true,
            personality_id: personalityId,
            insights: insights,
            personalityContext: personalityContext,
            message: 'Personality analysis completed successfully'
        });

    } catch (error) {
        console.error('Personality analysis error:', error);
        
        if (error instanceof ErrorHandler) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                type: error.type,
                ...(error.field && { field: error.field }),
                ...(error.provider && { provider: error.provider })
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to analyze personality',
            type: 'PERSONALITY_ANALYSIS_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

function createAnalysisPrompt(type, content) {
    const typeDescriptions = {
        text: 'text messages or chat conversations',
        email: 'email communications',
        letter: 'personal letters or written correspondence',
        other: 'other written communications'
    };

    return `Please analyze the following ${typeDescriptions[type] || 'written content'} to understand the person's personality and communication style:

Content:
${content}

Please provide a detailed analysis of their personality traits, writing style, and common expressions.`;
}

// Store memories and context with enhanced validation
app.post('/api/store-memory', async (req, res) => {
    try {
        const { sessionId, description, details, type, importance, date } = req.body;

        // Input validation
        validateRequired(description, 'description');
        validateRequired(details, 'details');
        validateMinLength(description.trim(), 3, 'description');
        validateMinLength(details.trim(), 10, 'details');
        validateMaxLength(description, 200, 'description');
        validateMaxLength(details, 2000, 'details');

        if (type && !['general', 'special', 'support', 'humor', 'achievement'].includes(type)) {
            throw new ValidationError('Invalid memory type', 'type');
        }

        if (importance && !['low', 'medium', 'high'].includes(importance)) {
            throw new ValidationError('Invalid importance level', 'importance');
        }

        const sessionKey = sessionId || 'default';
        const memories = memoryStore.get(sessionKey) || [];

        // Check for duplicate memories
        const isDuplicate = memories.some(memory => 
            memory.description.toLowerCase() === description.toLowerCase() ||
            memory.details.toLowerCase() === details.toLowerCase()
        );

        if (isDuplicate) {
            throw new ValidationError('A similar memory already exists');
        }

        const memory = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            description: description.trim(),
            details: details.trim(),
            type: type || 'general',
            importance: importance || 'medium',
            date: date || new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        memories.push(memory);
        memoryStore.set(sessionKey, memories);

        console.log(`Memory stored for session ${sessionKey}: ${memory.description}`);

        res.json({
            success: true,
            memory_id: memory.id,
            memory: memory,
            message: 'Memory stored successfully'
        });

    } catch (error) {
        console.error('Memory storage error:', error);
        
        if (error instanceof ErrorHandler) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                type: error.type,
                ...(error.field && { field: error.field })
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to store memory',
            type: 'MEMORY_STORAGE_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get memories for a session with pagination
app.get('/api/memories/:sessionId', (req, res) => {
    try {
        const sessionId = req.params.sessionId || 'default';
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 memories per page
        
        const memories = memoryStore.get(sessionId) || [];
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMemories = memories.slice(startIndex, endIndex);

        res.json({
            success: true,
            memories: paginatedMemories,
            pagination: {
                current_page: page,
                per_page: limit,
                total: memories.length,
                total_pages: Math.ceil(memories.length / limit)
            }
        });

    } catch (error) {
        console.error('Memory retrieval error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve memories',
            type: 'MEMORY_RETRIEVAL_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Process onboarding responses and create personality context with enhanced validation
app.post('/api/process-onboarding', async (req, res) => {
    try {
        const { sessionId, responses } = req.body;

        // Input validation
        validateRequired(responses, 'responses');
        
        if (typeof responses !== 'object' || Array.isArray(responses)) {
            throw new ValidationError('Responses must be an object');
        }

        if (Object.keys(responses).length === 0) {
            throw new ValidationError('No responses provided');
        }

        // Validate individual response fields
        for (const [key, value] of Object.entries(responses)) {
            if (typeof value === 'string') {
                validateMaxLength(value, 2000, key);
            }
        }

        console.log(`Processing onboarding for session ${sessionId || 'default'}`);

        // Analyze responses to create comprehensive personality profile
        const personalityData = analyzeOnboardingResponses(responses);
        
        // Create detailed personality context
        const personalityContext = createPersonalityContext(personalityData);
        
        // Extract and store specific memories
        const memories = extractMemoriesFromResponses(responses);
        
        // Store personality context
        const personalityId = Date.now().toString();
        personalityStore.set(personalityId, {
            type: 'onboarding',
            responses: responses,
            insights: personalityData,
            personalityContext: personalityContext,
            created_at: new Date().toISOString()
        });

        // Store memories
        const sessionKey = sessionId || 'default';
        const existingMemories = memoryStore.get(sessionKey) || [];
        memories.forEach(memory => {
            memory.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            existingMemories.push(memory);
        });
        memoryStore.set(sessionKey, existingMemories);

        console.log(`Onboarding processed successfully: ${memories.length} memories stored`);

        res.json({
            success: true,
            personality_id: personalityId,
            session_id: sessionKey,
            memories_count: memories.length,
            personality_context: personalityContext,
            message: 'Onboarding completed successfully'
        });

    } catch (error) {
        console.error('Onboarding processing error:', error);
        
        if (error instanceof ErrorHandler) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                type: error.type,
                ...(error.field && { field: error.field })
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process onboarding',
            type: 'ONBOARDING_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Helper function to find relevant memories with error handling
function findRelevantMemories(message, memories) {
    try {
        if (!memories || memories.length === 0) return [];
        if (!message || typeof message !== 'string') return [];

        const messageLower = message.toLowerCase();
        const relevantMemories = [];

        for (const memory of memories) {
            try {
                if (!memory.description || !memory.details) continue;
                
                const descriptionLower = memory.description.toLowerCase();
                const detailsLower = memory.details.toLowerCase();
                
                // Check if message contains keywords from memory
                const descriptionWords = descriptionLower.split(/\s+/);
                const detailsWords = detailsLower.split(/\s+/);
                
                let relevanceScore = 0;
                
                // Check for exact matches in description
                if (descriptionWords.some(word => word.length > 2 && messageLower.includes(word))) {
                    relevanceScore += 2;
                }
                
                // Check for exact matches in details
                if (detailsWords.some(word => word.length > 2 && messageLower.includes(word))) {
                    relevanceScore += 1;
                }
                
                // Check for time-related keywords
                const timeKeywords = ['remember', 'when', 'time', 'ago', 'years', 'months', 'days', 'yesterday', 'today', 'last', 'first'];
                if (timeKeywords.some(keyword => messageLower.includes(keyword))) {
                    relevanceScore += 1;
                }
                
                // Check for relationship keywords
                const relationshipKeywords = ['friend', 'best friend', 'family', 'mom', 'dad', 'sister', 'brother', 'grandma', 'grandpa'];
                if (relationshipKeywords.some(keyword => messageLower.includes(keyword))) {
                    relevanceScore += 1;
                }
                
                if (relevanceScore > 0) {
                    relevantMemories.push({
                        ...memory,
                        relevanceScore: relevanceScore
                    });
                }
            } catch (memoryError) {
                console.warn('Error processing memory:', memoryError);
                continue; // Skip this memory and continue with others
            }
        }
        
        // Sort by relevance score and return top 3 most relevant
        return relevantMemories
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 3);
    } catch (error) {
        console.error('Error finding relevant memories:', error);
        return []; // Return empty array on error to avoid breaking the main flow
    }
}

// Helper function to analyze onboarding responses with error handling
function analyzeOnboardingResponses(responses) {
    try {
        const analysis = {
            writingStyle: '',
            commonPhrases: [],
            personalityTraits: [],
            emotionalPatterns: [],
            personalityContext: ''
        };
        
        // Extract personality traits
        if (responses.personality_keywords && typeof responses.personality_keywords === 'string') {
            analysis.personalityTraits = responses.personality_keywords
                .split(',')
                .map(trait => trait.trim())
                .filter(trait => trait.length > 0)
                .slice(0, 10); // Limit to 10 traits
        }
        
        // Extract communication style
        if (responses.communication_style && typeof responses.communication_style === 'string') {
            analysis.writingStyle = responses.communication_style.substring(0, 500); // Limit length
        }
        
        // Extract common phrases
        if (responses.common_phrases && typeof responses.common_phrases === 'string') {
            analysis.commonPhrases = responses.common_phrases
                .split(',')
                .map(phrase => phrase.trim())
                .filter(phrase => phrase.length > 0)
                .slice(0, 10); // Limit to 10 phrases
        }
        
        // Extract emotional patterns
        if (responses.emotional_expression && typeof responses.emotional_expression === 'string') {
            analysis.emotionalPatterns.push(responses.emotional_expression.substring(0, 200));
        }
        
        // Create comprehensive personality context
        let context = '';
        
        const contextFields = [
            'relationship_strength',
            'miss_most',
            'comfort_style',
            'encouragement_style',
            'love_expression',
            'unique_habits',
            'conversation_topics'
        ];
        
        contextFields.forEach(field => {
            if (responses[field] && typeof responses[field] === 'string') {
                const value = responses[field].substring(0, 300); // Limit each field length
                context += `${field.replace('_', ' ')}: ${value}. `;
            }
        });
        
        analysis.personalityContext = context.substring(0, 2000); // Limit total context length
        
        return analysis;
    } catch (error) {
        console.error('Error analyzing onboarding responses:', error);
        // Return default analysis on error
        return {
            writingStyle: 'Caring and supportive communication style',
            commonPhrases: ['Take care', 'I understand', 'You matter'],
            personalityTraits: ['Supportive', 'Understanding', 'Kind'],
            emotionalPatterns: ['Shows empathy through listening'],
            personalityContext: 'A supportive and understanding person who cares deeply about others.'
        };
    }
}

// Helper function to create personality context from onboarding data with error handling
function createPersonalityContext(analysis) {
    try {
        if (!analysis || typeof analysis !== 'object') {
            throw new Error('Invalid analysis object');
        }

        const writingStyle = analysis.writingStyle || 'Authentic and genuine communication';
        const commonPhrases = Array.isArray(analysis.commonPhrases) ? analysis.commonPhrases.join(', ') : 'Natural expressions';
        const personalityTraits = Array.isArray(analysis.personalityTraits) ? analysis.personalityTraits.join(', ') : 'Caring and authentic';
        const emotionalPatterns = Array.isArray(analysis.emotionalPatterns) ? analysis.emotionalPatterns.join(', ') : 'Genuine emotional expression';
        const personalityContext = analysis.personalityContext || 'An authentic and caring individual';

        return `You are communicating as someone with the following authentic characteristics:
        - Writing Style: ${writingStyle}
        - Common Phrases: ${commonPhrases}
        - Personality Traits: ${personalityTraits}
        - Emotional Patterns: ${emotionalPatterns}
        
        Personality Context: ${personalityContext}
        
        CRITICAL: When responding, you must:
        - Replicate their EXACT emotional essence and authentic communication style
        - Use their genuine emotional patterns and how they express different feelings
        - Match their exact tone, mood, and emotional state based on the context
        - Incorporate their true personality quirks, habits, and unique characteristics
        - Show how they handle different emotions authentically
        - Use their authentic way of showing care, concern, or any other emotion
        - Reflect any emotional complexity, contradictions, or depth in their personality
        - Use their actual common phrases and expressions naturally
        - Maintain their unique way of expressing emotions, even if unconventional
        - Capture the exact emotional nuance they would have in this situation
        - Be their truest self with all emotional authenticity`;
    } catch (error) {
        console.error('Error creating personality context:', error);
        // Return default context on error
        return `You are communicating as an authentic and caring individual who expresses genuine emotions and maintains their unique personality traits while being supportive and understanding.`;
    }
}

// Helper function to extract memories from responses with error handling
function extractMemoriesFromResponses(responses) {
    try {
        const memories = [];
        
        // Extract specific memories from responses
        const memoryFields = ['favorite_memory', 'challenging_time', 'funny_moment', 'proud_moment'];
        
        memoryFields.forEach(field => {
            try {
                if (responses[field] && typeof responses[field] === 'string' && responses[field].trim().length > 0) {
                    const description = getMemoryDescription(field);
                    const details = responses[field].substring(0, 1000); // Limit memory details length
                    
                    memories.push({
                        description: description,
                        details: details,
                        type: getMemoryType(field),
                        importance: 'high',
                        date: 'ongoing'
                    });
                }
            } catch (fieldError) {
                console.warn(`Error processing memory field ${field}:`, fieldError);
                // Continue with other fields
            }
        });
        
        return memories;
    } catch (error) {
        console.error('Error extracting memories from responses:', error);
        return []; // Return empty array on error
    }
}

// Helper functions with error handling
function getMemoryDescription(field) {
    try {
        const descriptions = {
            'favorite_memory': 'Favorite memory together',
            'challenging_time': 'Time they helped through difficulty',
            'funny_moment': 'Funny moment or story',
            'proud_moment': 'Time they were proud'
        };
        return descriptions[field] || 'Special memory';
    } catch (error) {
        console.error('Error getting memory description:', error);
        return 'Special memory';
    }
}

function getMemoryType(field) {
    try {
        const types = {
            'favorite_memory': 'special',
            'challenging_time': 'support',
            'funny_moment': 'humor',
            'proud_moment': 'achievement'
        };
        return types[field] || 'general';
    } catch (error) {
        console.error('Error getting memory type:', error);
        return 'general';
    }
}

// Enhanced error handling middleware
app.use((error, req, res, next) => {
    // Log the error
    console.error('Server error middleware caught:', {
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Handle specific error types
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false,
                error: 'File too large. Maximum size is 10MB.',
                type: 'FILE_SIZE_ERROR'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                success: false,
                error: 'Too many files. Only one file allowed.',
                type: 'FILE_COUNT_ERROR'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                success: false,
                error: 'Unexpected file field.',
                type: 'UNEXPECTED_FILE_ERROR'
            });
        }
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.message,
            type: error.type,
            ...(error.field && { field: error.field })
        });
    }

    // Handle API errors
    if (error instanceof APIError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.message,
            type: error.type,
            ...(error.provider && { provider: error.provider })
        });
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON format',
            type: 'JSON_PARSE_ERROR'
        });
    }

    // Handle other known errors
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized access',
            type: 'UNAUTHORIZED_ERROR'
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        type: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        type: 'NOT_FOUND_ERROR',
        path: req.originalUrl
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start server with enhanced error handling
const server = app.listen(PORT, () => {
    console.log(`🚀 Rmbr AI Backend running on http://localhost:${PORT}`);
    console.log(`📝 API Documentation: http://localhost:${PORT}/api/health`);
    
    if (!ELEVENLABS_API_KEY) {
        console.warn('⚠️  ElevenLabs API key not found. Voice cloning will not work.');
    }
    
    if (!OPENAI_API_KEY) {
        console.warn('⚠️  OpenAI API key not found. AI conversations will not work.');
    }

    console.log('✅ Server started successfully with enhanced error handling');
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
        process.exit(1);
    }
}); 