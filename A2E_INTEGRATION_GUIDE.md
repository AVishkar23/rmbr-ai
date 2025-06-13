# A2E.ai Integration Guide for Rmbr AI

## Overview

A2E.ai has been successfully integrated into your Rmbr AI project, providing advanced avatar generation, voice cloning, and text-to-speech capabilities. This integration works alongside the existing ElevenLabs and OpenAI integrations.

## 🚀 Features Added

- **Voice Cloning**: Clone voices using A2E.ai's advanced models
- **Avatar Generation**: Create realistic talking avatars from text
- **Text-to-Speech**: Generate high-quality speech with cloned voices
- **Avatar Management**: List and manage available avatars
- **Voice Management**: List and manage cloned voices

## 🔧 Setup Instructions

### 1. Get A2E.ai API Credentials

1. Go to [A2E.ai](https://video.a2e.ai/)
2. Sign up for an account
3. Navigate to your account settings
4. Copy your **API ID** and **API Key**

### 2. Configure Environment Variables

Update your `.env` file with A2E.ai credentials:

```env
# A2E.ai Configuration
A2E_API_ID=your_a2e_api_id_here
A2E_API_KEY=your_a2e_api_key_here
A2E_BASE_URL=https://video.a2e.ai
```

### 3. Restart the Server

```bash
npm start
```

You should see the confirmation message: `✅ A2E.ai API configured successfully.`

## 📚 API Endpoints

### Voice Cloning

**POST** `/api/a2e/clone-voice`

Clone a voice using A2E.ai from an audio or video file.

```bash
curl -X POST http://localhost:3000/api/a2e/clone-voice \
  -F "audio=@path/to/video.mp4"
```

**Response:**
```json
{
  "success": true,
  "voice_id": "a2e_voice_12345",
  "provider": "a2e",
  "message": "Voice cloned successfully with A2E.ai"
}
```

### Text-to-Speech

**POST** `/api/a2e/tts`

Generate speech from text using A2E.ai.

```bash
curl -X POST http://localhost:3000/api/a2e/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test message",
    "voiceId": "your_voice_id"
  }'
```

**Response:**
```json
{
  "success": true,
  "audio_url": "data:audio/mpeg;base64,UklGRiQAAABXQ...",
  "provider": "a2e",
  "message": "Text-to-speech generated successfully with A2E.ai"
}
```

### Avatar Generation

**POST** `/api/a2e/generate-avatar`

Generate a talking avatar video from text.

```bash
curl -X POST http://localhost:3000/api/a2e/generate-avatar \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test message for avatar generation",
    "avatarId": "your_avatar_id"
  }'
```

**Response:**
```json
{
  "success": true,
  "task_id": "task_12345",
  "provider": "a2e",
  "message": "Avatar generation started. Use /api/a2e/avatar-status to check progress."
}
```

### Check Avatar Status

**GET** `/api/a2e/avatar-status/:taskId`

Check the status of avatar generation.

```bash
curl http://localhost:3000/api/a2e/avatar-status/task_12345
```

**Response:**
```json
{
  "success": true,
  "task_id": "task_12345",
  "status": "done",
  "video_url": "https://a2e.ai/generated/video.mp4",
  "provider": "a2e",
  "ready": true
}
```

### List Available Voices

**GET** `/api/a2e/voices`

Get all available A2E.ai voices.

```bash
curl http://localhost:3000/api/a2e/voices
```

### List Available Avatars

**GET** `/api/a2e/avatars`

Get all available A2E.ai avatars.

```bash
curl http://localhost:3000/api/a2e/avatars
```

## 🔄 Workflow Examples

### Complete Voice Cloning & Avatar Generation

1. **Clone Voice from Video:**
   ```bash
   curl -X POST http://localhost:3000/api/a2e/clone-voice \
     -F "audio=@memorial_video.mp4"
   ```

2. **Generate Avatar Video:**
   ```bash
   curl -X POST http://localhost:3000/api/a2e/generate-avatar \
     -H "Content-Type: application/json" \
     -d '{
       "text": "Hello, I miss you so much. I hope you are doing well.",
       "avatarId": "default"
     }'
   ```

3. **Check Avatar Status:**
   ```bash
   curl http://localhost:3000/api/a2e/avatar-status/task_12345
   ```

### Text-to-Speech with Custom Voice

1. **Generate Speech:**
   ```bash
   curl -X POST http://localhost:3000/api/a2e/tts \
     -H "Content-Type: application/json" \
     -d '{
       "text": "This is a memory from our time together.",
       "voiceId": "your_cloned_voice_id"
     }'
   ```

## 🎛️ Integration with Existing Features

### Enhanced Chat API

The existing `/api/chat` endpoint can be extended to use A2E.ai for avatar generation:

```javascript
// After getting AI response, generate avatar
const avatarResponse = await fetch('/api/a2e/generate-avatar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: aiResponse,
    avatarId: 'memorial_avatar'
  })
});
```

### Dual Provider Support

Your application now supports both ElevenLabs and A2E.ai:

- **ElevenLabs**: Best for quick voice synthesis
- **A2E.ai**: Best for avatar generation and advanced video features

## 💰 Cost Considerations

### A2E.ai Pricing

- **Free Tier**: Limited avatar generations and voice cloning
- **Paid Plans**: Check [A2E.ai pricing](https://video.a2e.ai/pricing) for current rates
- **Usage Tracking**: Monitor usage through your A2E.ai dashboard

### Optimization Tips

1. **Cache Results**: Store generated avatars and voices to avoid regeneration
2. **Batch Processing**: Group similar requests when possible
3. **Error Handling**: Implement fallback to ElevenLabs if A2E.ai is unavailable

## 🛠️ Troubleshooting

### Common Issues

1. **API Credentials Not Found**
   - Verify `.env` file contains correct A2E.ai credentials
   - Restart server after updating credentials

2. **Avatar Generation Timeout**
   - Avatar generation can take 1-5 minutes
   - Use status endpoint to check progress
   - Implement polling mechanism in frontend

3. **Voice Cloning Fails**
   - Ensure audio/video file is in supported format
   - Check file size limits (typically 10MB)
   - Verify audio quality is sufficient

### Error Responses

```json
{
  "error": "A2E.ai API credentials not configured",
  "details": "Please check your .env file"
}
```

## 🚀 Next Steps

1. **Frontend Integration**: Update your frontend to use the new A2E.ai endpoints
2. **UI Enhancements**: Add avatar selection and generation progress indicators
3. **Caching**: Implement caching for generated avatars and voices
4. **Monitoring**: Add logging and monitoring for A2E.ai API usage

## 📞 Support

- **A2E.ai Documentation**: [https://api.a2e.ai/](https://api.a2e.ai/)
- **A2E.ai Discord**: [https://discord.gg/batesPBQUE](https://discord.gg/batesPBQUE)
- **A2E.ai Support**: contact@a2e.ai

---

Your Rmbr AI project now has powerful avatar generation capabilities through A2E.ai integration! 🎉