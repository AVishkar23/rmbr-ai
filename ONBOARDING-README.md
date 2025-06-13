# Rmbr AI - Modern Onboarding System

A beautiful, calming, and emotionally engaging onboarding experience for creating AI memory companions. Built with a modular, scalable architecture.

## 🌟 Features

### Emotional Design
- **Soft, pastel color palette** with light blues, warm neutrals, and lavender
- **Ambient backgrounds** with flowing clouds and blurred nature scenes
- **Friendly fonts** (Inter and Nunito) for a warm, approachable feel
- **Subtle animations** and smooth transitions throughout

### Conversational Experience
- **Chat-style interface** that feels like talking to a caring friend
- **Emotionally engaging questions** like "What were they like when you were sad?"
- **Journal-style prompts** that encourage deep reflection
- **Comforting quotes** that appear naturally throughout the conversation

### Modular Architecture
- **Component-based design** for easy maintenance and scaling
- **Separate concerns** with dedicated managers for different features
- **Reusable components** that can be used across different parts of the app

## 📁 File Structure

```
├── onboarding-modern-updated.html    # Main HTML file
├── onboarding-modern.css             # Complete styling
├── onboarding-app.js                 # Main application orchestrator
├── components/
│   ├── QuestionManager.js           # Handles questions and conversation flow
│   ├── MediaManager.js              # Manages file uploads and media
│   └── ChatManager.js               # Handles chat interface and messages
└── ONBOARDING-README.md             # This documentation
```

## 🧩 Components

### QuestionManager
Manages the emotional questions and conversation flow.

**Key Features:**
- Organized questions by stage (Memory, Voice, Essence)
- Categorized questions (emotional, personality, memories, etc.)
- Comforting quotes system
- Stage transition management

**Usage:**
```javascript
const questionManager = new QuestionManager();
const question = questionManager.getQuestion('memory', 0);
const quote = questionManager.getRandomQuote();
```

### MediaManager
Handles file uploads, validation, and media processing.

**Key Features:**
- Drag & drop file uploads
- File type validation
- Size limits and error handling
- Preview generation
- Callback system for upload events

**Usage:**
```javascript
const mediaManager = new MediaManager();
mediaManager.openFileUpload('photo');
mediaManager.setUploadCallback('photo', (file) => {
    console.log('Photo uploaded:', file);
});
```

### ChatManager
Manages the conversational interface and message display.

**Key Features:**
- Message display with animations
- Typewriter effect for assistant messages
- Typing indicators
- Auto-scroll and message history
- Export/import functionality

**Usage:**
```javascript
const chatManager = new ChatManager(questionManager);
chatManager.addMessage('assistant', 'Hello!');
chatManager.addQuestion('What is their name?');
```

### OnboardingApp
Main orchestrator that coordinates all components.

**Key Features:**
- Stage management (Memory → Voice → Essence)
- Progress tracking
- Data collection and processing
- Server communication
- State management

## 🎨 Design System

### Color Palette
- **Primary Gradient:** `#667eea` to `#764ba2` (soft purple)
- **Secondary Gradient:** `#ff9a9e` to `#fecfef` (warm pink)
- **Success Gradient:** `#51cf66` to `#40c057` (soft green)
- **Background:** `#e8f4fd` to `#f0f8ff` to `#f5f0ff` (soft blue to lavender)

### Typography
- **Primary Font:** Inter (clean, modern)
- **Display Font:** Nunito (friendly, warm)
- **Weights:** 300, 400, 500, 600, 700

### Animations
- **Message Slide:** Messages slide in from bottom
- **Pulse:** Icons pulse gently for attention
- **Float:** Clouds drift across the background
- **Celebration:** Completion screen has celebratory animations

## 🚀 Getting Started

1. **Include the files:**
```html
<link rel="stylesheet" href="onboarding-modern.css">
<script src="components/QuestionManager.js"></script>
<script src="components/MediaManager.js"></script>
<script src="components/ChatManager.js"></script>
<script src="onboarding-app.js"></script>
```

2. **Use the HTML structure:**
```html
<div class="memory-walk-container">
    <div id="welcome-screen" class="screen active">
        <!-- Welcome content -->
    </div>
    <div id="chat-interface" class="screen">
        <!-- Chat interface -->
    </div>
    <div id="media-modal" class="modal">
        <!-- Media upload modal -->
    </div>
    <div id="completion-screen" class="screen">
        <!-- Completion screen -->
    </div>
</div>
```

3. **Initialize the app:**
```javascript
// The app initializes automatically when the page loads
// Access the global instance:
window.onboardingApp
```

## 📊 Data Flow

1. **User starts** → Welcome screen
2. **Conversation begins** → Chat interface with questions
3. **Questions progress** → Memory → Voice → Essence stages
4. **Media upload** → Optional photo/voice/video upload
5. **Completion** → Data processing and companion creation

## 🔧 Customization

### Adding New Questions
```javascript
// In QuestionManager.js
this.questions.memory.push({
    id: 'new_question',
    text: "Your new question here?",
    type: 'text',
    category: 'emotional'
});
```

### Customizing Colors
```css
/* In onboarding-modern.css */
:root {
    --primary-gradient: linear-gradient(135deg, #your-color 0%, #your-color 100%);
    --secondary-gradient: linear-gradient(135deg, #your-color 0%, #your-color 100%);
}
```

### Adding New Media Types
```javascript
// In MediaManager.js
this.supportedTypes.newType = ['application/pdf', 'text/plain'];
```

## 📱 Responsive Design

The interface is fully responsive with:
- **Mobile-first approach**
- **Flexible layouts** that adapt to screen size
- **Touch-friendly interactions**
- **Optimized spacing** for different devices

## 🔒 Privacy & Security

- **Local storage** for session data
- **File validation** before upload
- **No data sent** until user completes onboarding
- **Optional media uploads** - not required

## 🎯 User Experience Goals

1. **Comforting:** Feels like talking to a caring friend
2. **Emotional:** Encourages deep reflection and memory sharing
3. **Guided:** Clear progression through meaningful stages
4. **Optional:** Media uploads are enhancements, not requirements
5. **Memorial:** Framed as a tribute rather than data collection

## 🚀 Future Enhancements

- **Voice recording** directly in the browser
- **AI-powered question suggestions** based on responses
- **Progress saving** for returning users
- **Multiple companion profiles** management
- **Social sharing** of completed companions
- **Advanced media processing** (voice cloning, image enhancement)

## 🤝 Contributing

When adding new features:
1. **Follow the modular pattern** - create new components for new functionality
2. **Maintain the emotional tone** - all text should feel warm and caring
3. **Test responsiveness** - ensure it works on all device sizes
4. **Add documentation** - update this README with new features

## 📞 Support

For questions or issues with the onboarding system, please refer to the main Rmbr AI documentation or contact the development team. 