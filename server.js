require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');


// Debug: Check environment variables
console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'FOUND' : 'NOT FOUND');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'FOUND' : 'NOT FOUND');
console.log('A2E_API_ID:', process.env.A2E_API_ID ? 'FOUND' : 'NOT FOUND');
console.log('A2E_API_KEY:', process.env.A2E_API_KEY ? 'FOUND' : 'NOT FOUND');
console.log('Current working directory:', process.cwd());
console.log('Files in current directory:', require('fs').readdirSync('.'));
console.log('===================================');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP3, WAV, and M4A files are allowed.'));
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

// A2E.ai API Configuration
const A2E_API_ID = process.env.A2E_API_ID;
const A2E_API_KEY = process.env.A2E_API_KEY;
const A2E_BASE_URL = process.env.A2E_BASE_URL || 'https://video.a2e.ai';

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Rmbr AI Backend is running' });
});

// Clone voice using ElevenLabs
app.post('/api/clone-voice', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ error: 'ElevenLabs API key not configured' });
        }

        // Create form data for ElevenLabs
        const formData = new FormData();
        formData.append('files', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        formData.append('name', 'Memory Companion Voice');
        formData.append('description', 'Voice clone for Rmbr AI memory companion');

        // Call ElevenLabs API to clone voice
        const response = await axios.post(`${ELEVENLABS_BASE_URL}/voices/add`, formData, {
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                ...formData.getHeaders()
            }
        });

        const voiceId = response.data.voice_id;
        
        // Store voice ID (in production, save to database)
        voiceStore.set(voiceId, {
            name: 'Memory Companion Voice',
            created_at: new Date().toISOString()
        });

        res.json({
            success: true,
            voice_id: voiceId,
            message: 'Voice cloned successfully'
        });

    } catch (error) {
        console.error('Voice cloning error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to clone voice',
            details: error.response?.data?.message || error.message
        });
    }
});

// Generate AI response using OpenAI
app.post('/api/chat', async (req, res) => {
    try {
        const { message, voiceId, personalityContext, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
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

        // Call OpenAI API
        const openaiResponse = await axios.post(`${OPENAI_BASE_URL}/chat/completions`, {
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
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const aiResponse = openaiResponse.data.choices[0].message.content;

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
                const speechResponse = await axios.post(
                    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
                    {
                        text: aiResponse,
                        model_id: 'eleven_monolingual_v1',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    },
                    {
                        headers: {
                            'xi-api-key': ELEVENLABS_API_KEY,
                            'Content-Type': 'application/json'
                        },
                        responseType: 'arraybuffer'
                    }
                );

                // Convert audio buffer to base64
                const audioBuffer = Buffer.from(speechResponse.data);
                audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
            } catch (speechError) {
                console.error('Speech synthesis error:', speechError.message);
                // Continue without audio if speech fails
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
        // Enhanced error logging and response
        let details = error.message;
        if (error.response && error.response.data) {
            details = JSON.stringify(error.response.data, null, 2);
        } else if (error.stack) {
            details = error.stack;
        }
        console.error('Chat error:', details);
        res.status(500).json({
            error: 'Failed to generate response',
            details: details
        });
    }
});

// Get available voices
app.get('/api/voices', async (req, res) => {
    try {
        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ error: 'ElevenLabs API key not configured' });
        }

        const response = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY
            }
        });

        res.json({
            success: true,
            voices: response.data.voices
        });

    } catch (error) {
        console.error('Get voices error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to get voices',
            details: error.response?.data?.message || error.message
        });
    }
});

// Analyze personality from written communications
app.post('/api/analyze-personality', async (req, res) => {
    try {
        const { type, content } = req.body;

        if (!content || content.trim().length < 50) {
            return res.status(400).json({ 
                error: 'Please provide at least 50 characters of content to analyze' 
            });
        }

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        // Create analysis prompt based on content type
        const analysisPrompt = createAnalysisPrompt(type, content);

        // Call OpenAI API for personality analysis
        const openaiResponse = await axios.post(`${OPENAI_BASE_URL}/chat/completions`, {
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
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const analysisText = openaiResponse.data.choices[0].message.content;
        
        // Parse the JSON response
        let insights;
        try {
            insights = JSON.parse(analysisText);
        } catch (parseError) {
            // If JSON parsing fails, create a basic analysis
            insights = {
                writingStyle: 'Warm and personal',
                commonPhrases: ['"I hope you\'re doing well"', '"Take care"', '"Looking forward to hearing from you"'],
                personalityTraits: ['Caring', 'Supportive', 'Encouraging'],
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
            type: type,
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
        console.error('Personality analysis error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to analyze personality',
            details: error.response?.data?.message || error.message
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

// Store memories and context
app.post('/api/store-memory', async (req, res) => {
    try {
        const { sessionId, description, details, type, importance, date } = req.body;

        if (!description || !details) {
            return res.status(400).json({ error: 'Description and details are required' });
        }

        const sessionKey = sessionId || 'default';
        const memories = memoryStore.get(sessionKey) || [];

        const memory = {
            id: Date.now().toString(),
            description: description,
            details: details,
            type: type || 'general',
            importance: importance || 'medium',
            date: date || new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        memories.push(memory);
        memoryStore.set(sessionKey, memories);

        res.json({
            success: true,
            memory_id: memory.id,
            message: 'Memory stored successfully'
        });

    } catch (error) {
        console.error('Memory storage error:', error);
        res.status(500).json({
            error: 'Failed to store memory',
            details: error.message
        });
    }
});

// Get memories for a session
app.get('/api/memories/:sessionId', (req, res) => {
    try {
        const sessionId = req.params.sessionId || 'default';
        const memories = memoryStore.get(sessionId) || [];

        res.json({
            success: true,
            memories: memories,
            count: memories.length
        });

    } catch (error) {
        console.error('Memory retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve memories',
            details: error.message
        });
    }
});

// =================== A2E.ai API ENDPOINTS ===================

// A2E.ai Voice Cloning using video
app.post('/api/a2e/clone-voice', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        if (!A2E_API_ID || !A2E_API_KEY) {
            return res.status(500).json({ error: 'A2E.ai API credentials not configured' });
        }

        // Create form data for A2E.ai voice cloning
        const formData = new FormData();
        formData.append('files', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // Call A2E.ai API to clone voice from video
        const response = await axios.post(`${A2E_BASE_URL}/api/v1/voice/clone`, formData, {
            headers: {
                'Authorization': `Bearer ${A2E_API_KEY}`,
                'Content-Type': 'multipart/form-data',
                ...formData.getHeaders()
            },
            data: {
                token: A2E_API_ID
            }
        });

        const voiceId = response.data.voice_id;
        
        // Store voice ID
        voiceStore.set(voiceId, {
            name: 'A2E Memory Companion Voice',
            provider: 'a2e',
            created_at: new Date().toISOString()
        });

        res.json({
            success: true,
            voice_id: voiceId,
            provider: 'a2e',
            message: 'Voice cloned successfully with A2E.ai'
        });

    } catch (error) {
        console.error('A2E Voice cloning error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to clone voice with A2E.ai',
            details: error.response?.data?.message || error.message
        });
    }
});

// A2E.ai Text-to-Speech
app.post('/api/a2e/tts', async (req, res) => {
    try {
        const { text, voiceId } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!A2E_API_ID || !A2E_API_KEY) {
            return res.status(500).json({ error: 'A2E.ai API credentials not configured' });
        }

        // Call A2E.ai TTS API
        const response = await axios.post(`${A2E_BASE_URL}/api/v1/tts`, {
            text: text,
            voice_id: voiceId,
            token: A2E_API_ID
        }, {
            headers: {
                'Authorization': `Bearer ${A2E_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });

        // Convert audio buffer to base64
        const audioBuffer = Buffer.from(response.data);
        const audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

        res.json({
            success: true,
            audio_url: audioUrl,
            provider: 'a2e',
            message: 'Text-to-speech generated successfully with A2E.ai'
        });

    } catch (error) {
        console.error('A2E TTS error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate speech with A2E.ai',
            details: error.response?.data?.message || error.message
        });
    }
});

// A2E.ai Avatar Generation
app.post('/api/a2e/generate-avatar', async (req, res) => {
    try {
        const { text, avatarId } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!A2E_API_ID || !A2E_API_KEY) {
            return res.status(500).json({ error: 'A2E.ai API credentials not configured' });
        }

        // Call A2E.ai Avatar API
        const response = await axios.post(`${A2E_BASE_URL}/api/v1/lipsyncs/`, {
            text: text,
            creator_id: avatarId || 'default',
            aspect_ratio: '16:9',
            token: A2E_API_ID
        }, {
            headers: {
                'Authorization': `Bearer ${A2E_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const taskId = response.data.id;

        res.json({
            success: true,
            task_id: taskId,
            provider: 'a2e',
            message: 'Avatar generation started. Use /api/a2e/avatar-status to check progress.'
        });

    } catch (error) {
        console.error('A2E Avatar generation error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate avatar with A2E.ai',
            details: error.response?.data?.message || error.message
        });
    }
});

// A2E.ai Avatar Status Check
app.get('/api/a2e/avatar-status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!A2E_API_ID || !A2E_API_KEY) {
            return res.status(500).json({ error: 'A2E.ai API credentials not configured' });
        }

        // Check A2E.ai task status
        const response = await axios.get(`${A2E_BASE_URL}/api/v1/lipsyncs/${taskId}/`, {
            headers: {
                'Authorization': `Bearer ${A2E_API_KEY}`,
                'Content-Type': 'application/json'
            },
            params: {
                token: A2E_API_ID
            }
        });

        const status = response.data.status;
        const videoUrl = response.data.output;

        res.json({
            success: true,
            task_id: taskId,
            status: status,
            video_url: videoUrl,
            provider: 'a2e',
            ready: status === 'done'
        });

    } catch (error) {
        console.error('A2E Avatar status error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to check avatar status',
            details: error.response?.data?.message || error.message
        });
    }
});

// A2E.ai Available Voices
app.get('/api/a2e/voices', async (req, res) => {
    try {
        if (!A2E_API_ID || !A2E_API_KEY) {
            return res.status(500).json({ error: 'A2E.ai API credentials not configured' });
        }

        // Get A2E.ai voices
        const response = await axios.get(`${A2E_BASE_URL}/api/v1/voices/`, {
            headers: {
                'Authorization': `Bearer ${A2E_API_KEY}`,
                'Content-Type': 'application/json'
            },
            params: {
                token: A2E_API_ID
            }
        });

        res.json({
            success: true,
            voices: response.data.voices || response.data,
            provider: 'a2e'
        });

    } catch (error) {
        console.error('A2E Get voices error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to get A2E.ai voices',
            details: error.response?.data?.message || error.message
        });
    }
});

// A2E.ai Avatar List
app.get('/api/a2e/avatars', async (req, res) => {
    try {
        if (!A2E_API_ID || !A2E_API_KEY) {
            return res.status(500).json({ error: 'A2E.ai API credentials not configured' });
        }

        // Get A2E.ai avatars
        const response = await axios.post(`${A2E_BASE_URL}/api/v1/avatars/`, {
            token: A2E_API_ID
        }, {
            headers: {
                'Authorization': `Bearer ${A2E_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({
            success: true,
            avatars: response.data.avatars || response.data,
            provider: 'a2e'
        });

    } catch (error) {
        console.error('A2E Get avatars error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to get A2E.ai avatars',
            details: error.response?.data?.message || error.message
        });
    }
});

// =================== END A2E.ai ENDPOINTS ===================

// Helper function to find relevant memories
function findRelevantMemories(message, memories) {
    if (!memories || memories.length === 0) return [];

    const messageLower = message.toLowerCase();
    const relevantMemories = [];

    for (const memory of memories) {
        const descriptionLower = memory.description.toLowerCase();
        const detailsLower = memory.details.toLowerCase();
        
        // Check if message contains keywords from memory
        const descriptionWords = descriptionLower.split(/\s+/);
        const detailsWords = detailsLower.split(/\s+/);
        
        let relevanceScore = 0;
        
        // Check for exact matches in description
        if (descriptionWords.some(word => messageLower.includes(word))) {
            relevanceScore += 2;
        }
        
        // Check for exact matches in details
        if (detailsWords.some(word => messageLower.includes(word))) {
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
    }
    
    // Sort by relevance score and return top 3 most relevant
    return relevantMemories
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3);
}

// Process onboarding responses and create personality context
app.post('/api/process-onboarding', async (req, res) => {
    try {
        const { sessionId, responses } = req.body;

        if (!responses || Object.keys(responses).length === 0) {
            return res.status(400).json({ error: 'No responses provided' });
        }

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
        res.status(500).json({
            error: 'Failed to process onboarding',
            details: error.message
        });
    }
});

// Helper function to analyze onboarding responses
function analyzeOnboardingResponses(responses) {
    const analysis = {
        writingStyle: '',
        commonPhrases: [],
        personalityTraits: [],
        emotionalPatterns: [],
        personalityContext: ''
    };
    
    // Extract personality traits
    if (responses.personality_keywords) {
        analysis.personalityTraits = responses.personality_keywords.split(',').map(trait => trait.trim());
    }
    
    // Extract communication style
    if (responses.communication_style) {
        analysis.writingStyle = responses.communication_style;
    }
    
    // Extract common phrases
    if (responses.common_phrases) {
        analysis.commonPhrases = responses.common_phrases.split(',').map(phrase => phrase.trim());
    }
    
    // Extract emotional patterns
    if (responses.emotional_expression) {
        analysis.emotionalPatterns.push(responses.emotional_expression);
    }
    
    // Create comprehensive personality context
    let context = '';
    
    if (responses.relationship_strength) {
        context += `Relationship: ${responses.relationship_strength}. `;
    }
    
    if (responses.miss_most) {
        context += `They are missed for: ${responses.miss_most}. `;
    }
    
    if (responses.comfort_style) {
        context += `They comforted others by: ${responses.comfort_style}. `;
    }
    
    if (responses.encouragement_style) {
        context += `They encouraged others by: ${responses.encouragement_style}. `;
    }
    
    if (responses.love_expression) {
        context += `They expressed love through: ${responses.love_expression}. `;
    }
    
    if (responses.unique_habits) {
        context += `Unique characteristics: ${responses.unique_habits}. `;
    }
    
    if (responses.conversation_topics) {
        context += `They loved talking about: ${responses.conversation_topics}. `;
    }
    
    analysis.personalityContext = context;
    
    return analysis;
}

// Helper function to create personality context from onboarding data
function createPersonalityContext(analysis) {
    return `You are communicating as someone with the following authentic characteristics:
    - Writing Style: ${analysis.writingStyle}
    - Common Phrases: ${analysis.commonPhrases.join(', ')}
    - Personality Traits: ${analysis.personalityTraits.join(', ')}
    - Emotional Patterns: ${analysis.emotionalPatterns.join(', ')}
    
    Personality Context: ${analysis.personalityContext}
    
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
}

// Helper function to extract memories from responses
function extractMemoriesFromResponses(responses) {
    const memories = [];
    
    // Extract specific memories from responses
    const memoryFields = ['favorite_memory', 'challenging_time', 'funny_moment', 'proud_moment'];
    
    memoryFields.forEach(field => {
        if (responses[field]) {
            memories.push({
                description: getMemoryDescription(field),
                details: responses[field],
                type: getMemoryType(field),
                importance: 'high',
                date: 'ongoing'
            });
        }
    });
    
    return memories;
}

// Helper functions
function getMemoryDescription(field) {
    const descriptions = {
        'favorite_memory': 'Favorite memory together',
        'challenging_time': 'Time they helped through difficulty',
        'funny_moment': 'Funny moment or story',
        'proud_moment': 'Time they were proud'
    };
    return descriptions[field] || 'Special memory';
}

function getMemoryType(field) {
    const types = {
        'favorite_memory': 'special',
        'challenging_time': 'support',
        'funny_moment': 'humor',
        'proud_moment': 'achievement'
    };
    return types[field] || 'general';
}

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Rmbr AI Backend running on http://localhost:${PORT}`);
    console.log(`📝 API Documentation: http://localhost:${PORT}/api/health`);
    
    if (!ELEVENLABS_API_KEY) {
        console.warn('⚠️  ElevenLabs API key not found. Voice cloning will not work.');
    }
    
    if (!OPENAI_API_KEY) {
        console.warn('⚠️  OpenAI API key not found. AI conversations will not work.');
    }
    
    if (!A2E_API_ID || !A2E_API_KEY) {
        console.warn('⚠️  A2E.ai API credentials not found. A2E.ai features will not work.');
    } else {
        console.log('✅ A2E.ai API configured successfully.');
    }
}); 