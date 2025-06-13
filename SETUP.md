# Rmbr AI Setup Guide

This guide will help you set up Rmbr AI with real voice cloning and AI conversation capabilities.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Get API Keys

#### ElevenLabs API Key
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for a free account
3. Go to your profile settings
4. Copy your API key
5. Free tier includes 10,000 characters per month

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Start the Backend Server
```bash
npm start
```

### 5. Open the Application
Open `index.html` in your browser or navigate to `http://localhost:3000`

## 📁 Project Structure

```
Rmbr AI/
├── index.html              # Main landing page
├── companion.html          # Companion creation page
├── styles.css              # Main styles
├── companion-styles.css    # Companion page styles
├── script.js               # Main page JavaScript
├── companion.js            # Companion page JavaScript
├── server.js               # Backend server
├── package.json            # Dependencies
├── .env                    # Environment variables (create this)
└── README.md               # Project documentation
```

## 🔧 API Endpoints

### Backend API Routes

- `GET /api/health` - Health check
- `POST /api/clone-voice` - Clone voice using ElevenLabs
- `POST /api/chat` - Generate AI response with voice synthesis
- `GET /api/voices` - Get available voices

### Example API Usage

#### Clone Voice
```javascript
const formData = new FormData();
formData.append('audio', audioFile);

const response = await fetch('http://localhost:3000/api/clone-voice', {
    method: 'POST',
    body: formData
});

const data = await response.json();
// Returns: { success: true, voice_id: "voice_12345" }
```

#### Chat with AI
```javascript
const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        message: "Hello, how are you?",
        voiceId: "voice_12345",
        personalityContext: "You are a caring mother figure"
    })
});

const data = await response.json();
// Returns: { success: true, response: "I'm doing well, thank you!", audio_url: "data:audio/mpeg;base64,..." }
```

## 💰 Cost Estimation

### ElevenLabs
- **Free Tier**: 10,000 characters/month
- **Paid Plans**: Starting at $5/month for 30,000 characters
- **Voice Cloning**: Free (included in character limit)

### OpenAI
- **GPT-4**: ~$0.03 per 1K input tokens, $0.06 per 1K output tokens
- **Typical conversation**: ~$0.01-0.05 per exchange

### Monthly Estimate
- **Light usage** (100 conversations): $5-15
- **Moderate usage** (500 conversations): $15-50
- **Heavy usage** (1000+ conversations): $30-100

## 🛠️ Development

### Running in Development Mode
```bash
npm run dev
```

### Testing the APIs
You can test the APIs using curl or Postman:

#### Test Health Check
```bash
curl http://localhost:3000/api/health
```

#### Test Voice Cloning
```bash
curl -X POST http://localhost:3000/api/clone-voice \
  -F "audio=@path/to/your/audio/file.mp3"
```

#### Test Chat
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "voiceId": "voice_12345"}'
```

## 🔒 Security Considerations

### Environment Variables
- Never commit API keys to version control
- Use `.env` file for local development
- Use environment variables in production

### File Upload Security
- File size limit: 10MB
- Allowed file types: MP3, WAV, M4A
- Files are processed in memory (not stored)

### API Rate Limiting
Consider implementing rate limiting for production:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🚀 Production Deployment

### Environment Setup
1. Set up a production server (AWS, Heroku, DigitalOcean, etc.)
2. Configure environment variables
3. Set up a reverse proxy (nginx) if needed
4. Configure SSL certificates

### Database Integration
For production, replace the in-memory voice store with a database:
```javascript
// Example with MongoDB
const Voice = require('./models/Voice');

// Store voice
const voice = new Voice({
    voiceId: response.data.voice_id,
    userId: req.user.id,
    name: 'Memory Companion Voice'
});
await voice.save();
```

### Monitoring
- Set up logging (Winston, Morgan)
- Monitor API usage and costs
- Set up error tracking (Sentry)

## 🐛 Troubleshooting

### Common Issues

#### "Backend server not running"
- Make sure you ran `npm start`
- Check if port 3000 is available
- Verify all dependencies are installed

#### "API key not configured"
- Check your `.env` file exists
- Verify API keys are correct
- Restart the server after adding keys

#### "Failed to clone voice"
- Check ElevenLabs API key
- Verify audio file format (MP3, WAV, M4A)
- Check file size (max 10MB)
- Ensure audio quality is good

#### "Failed to get response"
- Check OpenAI API key
- Verify you have credits in your OpenAI account
- Check network connectivity

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=*
```

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify API keys are correct
3. Test APIs individually using curl
4. Check network connectivity
5. Review the troubleshooting section above

## 🔄 Updates

To update the application:
1. Pull the latest changes
2. Run `npm install` to update dependencies
3. Restart the server with `npm start`
4. Test the functionality

---

**Happy coding! 🚀** 