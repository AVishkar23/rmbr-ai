// Companion Creation Flow

let companionType = null;
let interfaceType = null;

// Detect companion type from URL or session
function getCompanionType() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('type') || sessionStorage.getItem('companionType') || 'future-self';
}

function setCompanionTypeUI(type) {
  const icon = document.getElementById('type-icon');
  const title = document.getElementById('type-title');
  const desc = document.getElementById('type-description');
  if (!icon || !title || !desc) return;
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
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(screenId);
  if (el) el.classList.add('active');
}

// Interface selection
window.selectInterface = function(type) {
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
};

// --- Future Self Chat Logic ---
let chatStarted = false;
let chatStep = 0;
let futureSelfProfile = {};

function startFutureSelfChat(isVoice) {
  if (chatStarted) return;
  chatStarted = true;
  chatStep = 0;
  futureSelfProfile = {};
  clearChat();
  addMessage('assistant', "Hi! I'm your future self. Let's set the stage for our conversation. I'll ask a few questions to get started.");
  setTimeout(() => askNextFutureSelfQuestion(isVoice), 1200);
}

function askNextFutureSelfQuestion(isVoice) {
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
}

window.sendMessage = function() {
  const input = document.getElementById('user-input');
  const msg = input.value.trim();
  if (!msg) return;
  addMessage('user', msg);
  input.value = '';
  input.style.height = 'auto';

  if (chatStep !== 'open') {
    // Save answer
    const keys = ['year', 'goals', 'challenge', 'feeling', 'message'];
    futureSelfProfile[keys[chatStep]] = msg;
    chatStep++;
    setTimeout(() => askNextFutureSelfQuestion(interfaceType === 'voice'), 800);
  } else {
    // Open chat: send to backend for AI response
    getFutureSelfResponse(msg, futureSelfProfile, interfaceType === 'voice');
  }
};

function addMessage(sender, text) {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message ' + sender;
  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = text;
  div.appendChild(content);
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function clearChat() {
  const messages = document.getElementById('chat-messages');
  messages.innerHTML = '';
}

// --- AI Backend Integration ---
async function getFutureSelfResponse(userMsg, profile, isVoice) {
  addMessage('assistant', 'Thinking...');
  // Compose a system prompt for future self
  const systemPrompt = `You are the user's future self. Respond as if you are them in the year ${profile.year || 'the future'}. Their goals: ${profile.goals || ''}. Challenge: ${profile.challenge || ''}. Desired feeling: ${profile.feeling || ''}. Message: ${profile.message || ''}. Be supportive, wise, and a little playful.`;
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMsg,
        personalityContext: systemPrompt,
        sessionId: 'future-self-' + (profile.year || 'open')
      })
    });
    const data = await res.json();
    // Remove 'Thinking...' message
    const messages = document.getElementById('chat-messages');
    if (messages.lastChild && messages.lastChild.classList.contains('assistant')) {
      messages.removeChild(messages.lastChild);
    }
    if (res.ok) {
      addMessage('assistant', data.choices ? data.choices[0].message.content : data.response || data.result || data.message || '...');
      // If voice, use ElevenLabs TTS
      if (isVoice && data.choices && data.choices[0].message.content) {
        playVoice(data.choices[0].message.content);
      }
    } else {
      addMessage('assistant', `Sorry, something went wrong.\n${data.error ? 'Error: ' + data.error : ''}${data.details ? '\nDetails: ' + data.details : ''}`);
    }
  } catch (e) {
    addMessage('assistant', 'Sorry, something went wrong.');
  }
}

// --- ElevenLabs Voice (TTS) ---
async function playVoice(text) {
  // Placeholder: You would call your backend TTS endpoint here
  // For now, just use browser speechSynthesis as a fallback
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.02;
    utter.pitch = 1.1;
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  companionType = getCompanionType();
  setCompanionTypeUI(companionType);
  showScreen('welcome-screen');
}); 