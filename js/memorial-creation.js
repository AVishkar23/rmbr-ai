// Memorial Creation JavaScript
class MemorialCreation {
    constructor() {
        this.currentStep = 1;
        this.memorialData = this.loadMemorialData();
        this.uploadedFiles = {
            text: [],
            voice: [],
            media: [],
            documents: []
        };
        this.voiceSettings = {
            tone: 'warm',
            pace: 1.0,
            clarity: 0.7
        };
        this.currentInputMode = 'text';
        this.isRecording = false;
        this.mediaRecorder = null;
        this.voiceId = null;
        this.personalityId = null;
        this.sessionId = this.generateSessionId();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadMemorialInfo();
        this.enableContinueButton();
    }
    
    loadMemorialData() {
        const data = localStorage.getItem('memorialData');
        return data ? JSON.parse(data) : { name: 'your loved one', relationship: '', connectionType: '' };
    }
    
    loadMemorialInfo() {
        const nameDisplay = document.getElementById('loved-one-name-display');
        if (nameDisplay && this.memorialData.name) {
            nameDisplay.textContent = this.memorialData.name;
        }
    }
    
    generateSessionId() {
        return 'memorial_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    setupEventListeners() {
        // Upload area clicks
        document.querySelectorAll('.upload-area').forEach(area => {
            area.addEventListener('click', (e) => {
                this.handleUploadClick(e.target.closest('.upload-area'));
            });
        });
        
        // Voice settings
        document.querySelectorAll('.setting-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleVoiceSettingClick(e.target);
            });
        });
        
        // Sliders
        document.getElementById('pace-slider')?.addEventListener('input', (e) => {
            this.voiceSettings.pace = parseFloat(e.target.value);
        });
        
        document.getElementById('clarity-slider')?.addEventListener('input', (e) => {
            this.voiceSettings.clarity = parseFloat(e.target.value);
        });
        
        // Global functions
        window.nextStep = () => this.nextStep();
        window.previousStep = () => this.previousStep();
        window.skipStep = () => this.skipStep();
        window.playVoiceSample = () => this.playVoiceSample();
        window.setInputMode = (mode) => this.setInputMode(mode);
        window.sendMessage = () => this.sendMessage();
        window.toggleVoiceRecording = () => this.toggleVoiceRecording();
        window.toggleVoice = (button) => this.toggleVoice(button);
        window.handleKeyPress = (event) => this.handleKeyPress(event);
        window.saveProgress = () => this.saveProgress();
        window.previewMemorial = () => this.previewMemorial();
        window.completeMemorial = () => this.completeMemorial();
        window.closeUploadModal = () => this.closeUploadModal();
    }
    
    handleUploadClick(uploadArea) {
        const type = uploadArea.dataset.type;
        this.showUploadModal(type);
    }
    
    showUploadModal(type) {
        const modal = document.getElementById('upload-modal');
        const title = document.getElementById('upload-modal-title');
        const content = document.getElementById('upload-content');
        
        const typeConfig = {
            text: {
                title: 'Add Text Content',
                content: this.createTextUploadContent()
            },
            voice: {
                title: 'Add Voice Recordings',
                content: this.createVoiceUploadContent()
            },
            media: {
                title: 'Add Photos & Videos',
                content: this.createMediaUploadContent()
            },
            documents: {
                title: 'Add Documents',
                content: this.createDocumentUploadContent()
            }
        };
        
        title.textContent = typeConfig[type].title;
        content.innerHTML = typeConfig[type].content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.setupUploadModalEvents(type);
    }
    
    createTextUploadContent() {
        return `
            <div class="upload-form">
                <div class="form-group">
                    <label>Message source</label>
                    <select id="text-source">
                        <option value="messages">Text messages</option>
                        <option value="emails">Emails</option>
                        <option value="letters">Personal letters</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Content</label>
                    <textarea id="text-content" rows="8" placeholder="Paste text messages, emails, or written content here..."></textarea>
                </div>
                <div class="form-group">
                    <label>Description (optional)</label>
                    <input type="text" id="text-description" placeholder="Brief description of this content">
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="closeUploadModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveTextContent()">Add content</button>
                </div>
            </div>
        `;
    }
    
    createVoiceUploadContent() {
        return `
            <div class="upload-form">
                <div class="upload-tabs">
                    <button class="tab-btn active" data-tab="upload">Upload file</button>
                    <button class="tab-btn" data-tab="record">Record now</button>
                </div>
                
                <div class="tab-content active" data-tab="upload">
                    <div class="file-drop-zone" id="voice-drop-zone">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Drop audio files here or click to browse</p>
                        <input type="file" id="voice-file-input" accept="audio/*" multiple hidden>
                        <button class="btn btn-secondary" onclick="document.getElementById('voice-file-input').click()">Choose files</button>
                    </div>
                </div>
                
                <div class="tab-content" data-tab="record">
                    <div class="record-interface">
                        <div class="record-status">
                            <div class="record-icon">
                                <i class="fas fa-microphone"></i>
                            </div>
                            <p>Click to start recording</p>
                        </div>
                        <button class="btn btn-primary record-btn" onclick="startRecording()">
                            <i class="fas fa-microphone"></i>
                            Start recording
                        </button>
                        <div class="recording-timer" style="display: none;">
                            <span id="recording-time">00:00</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="closeUploadModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveVoiceContent()">Add recordings</button>
                </div>
            </div>
        `;
    }
    
    createMediaUploadContent() {
        return `
            <div class="upload-form">
                <div class="file-drop-zone" id="media-drop-zone">
                    <i class="fas fa-images"></i>
                    <p>Drop photos and videos here or click to browse</p>
                    <input type="file" id="media-file-input" accept="image/*,video/*" multiple hidden>
                    <button class="btn btn-secondary" onclick="document.getElementById('media-file-input').click()">Choose files</button>
                </div>
                <div class="form-group">
                    <label>Description (optional)</label>
                    <input type="text" id="media-description" placeholder="Describe these photos/videos">
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="closeUploadModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveMediaContent()">Add media</button>
                </div>
            </div>
        `;
    }
    
    createDocumentUploadContent() {
        return `
            <div class="upload-form">
                <div class="file-drop-zone" id="document-drop-zone">
                    <i class="fas fa-file-text"></i>
                    <p>Drop documents here or click to browse</p>
                    <input type="file" id="document-file-input" accept=".pdf,.doc,.docx,.txt" multiple hidden>
                    <button class="btn btn-secondary" onclick="document.getElementById('document-file-input').click()">Choose files</button>
                </div>
                <div class="form-group">
                    <label>Document type</label>
                    <select id="document-type">
                        <option value="letters">Personal letters</option>
                        <option value="journal">Journal entries</option>
                        <option value="work">Work documents</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="closeUploadModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveDocumentContent()">Add documents</button>
                </div>
            </div>
        `;
    }
    
    setupUploadModalEvents(type) {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
            });
        });
        
        // File input events
        const fileInput = document.querySelector(`#${type}-file-input`);
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files, type);
            });
        }
        
        // Drag and drop
        const dropZone = document.querySelector(`#${type}-drop-zone`);
        if (dropZone) {
            this.setupDragAndDrop(dropZone, type);
        }
        
        // Global functions for modal
        window.saveTextContent = () => this.saveTextContent();
        window.saveVoiceContent = () => this.saveVoiceContent();
        window.saveMediaContent = () => this.saveMediaContent();
        window.saveDocumentContent = () => this.saveDocumentContent();
        window.startRecording = () => this.startModalRecording();
    }
    
    setupDragAndDrop(dropZone, type) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelection(files, type);
        });
    }
    
    handleFileSelection(files, type) {
        Array.from(files).forEach(file => {
            const item = {
                id: this.generateId(),
                file: file,
                name: file.name,
                size: file.size,
                type: type,
                uploadTime: new Date()
            };
            this.uploadedFiles[type].push(item);
        });
        this.updateUploadDisplay(type);
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    saveTextContent() {
        const source = document.getElementById('text-source').value;
        const content = document.getElementById('text-content').value.trim();
        const description = document.getElementById('text-description').value.trim();
        
        if (!content) {
            alert('Please enter some text content.');
            return;
        }
        
        const item = {
            id: this.generateId(),
            content: content,
            source: source,
            description: description,
            type: 'text',
            uploadTime: new Date()
        };
        
        this.uploadedFiles.text.push(item);
        this.updateUploadDisplay('text');
        this.closeUploadModal();
        
        // Analyze personality from text content
        this.analyzePersonality(content, source);
    }
    
    async analyzePersonality(content, type) {
        try {
            const response = await fetch('/api/analyze-personality', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    content: content
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.personalityId = result.personality_id;
                console.log('Personality analysis completed:', result.insights);
            }
        } catch (error) {
            console.error('Error analyzing personality:', error);
        }
    }
    
    saveVoiceContent() {
        this.closeUploadModal();
        // Process uploaded voice files here
        this.processVoiceFiles();
    }
    
    async processVoiceFiles() {
        const voiceFiles = this.uploadedFiles.voice.filter(item => item.file);
        if (voiceFiles.length === 0) return;
        
        try {
            // For now, just use the first voice file for cloning
            const firstVoiceFile = voiceFiles[0].file;
            
            const formData = new FormData();
            formData.append('audio', firstVoiceFile);
            
            const response = await fetch('/api/clone-voice', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (result.success) {
                this.voiceId = result.voice_id;
                console.log('Voice cloned successfully:', this.voiceId);
            }
        } catch (error) {
            console.error('Error cloning voice:', error);
        }
    }
    
    saveMediaContent() {
        this.closeUploadModal();
        this.updateUploadDisplay('media');
    }
    
    saveDocumentContent() {
        this.closeUploadModal();
        this.updateUploadDisplay('documents');
    }
    
    updateUploadDisplay(type) {
        const container = document.getElementById(`${type}-items`);
        const items = this.uploadedFiles[type];
        
        container.innerHTML = items.map(item => `
            <div class="uploaded-item" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-icon">
                        <i class="fas fa-${this.getTypeIcon(type)}"></i>
                    </div>
                    <div class="item-details">
                        <h4>${item.name || item.description || 'Content'}</h4>
                        <p>${item.description || item.source || 'Uploaded content'}</p>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-action" onclick="memorial.removeUploadedItem('${type}', '${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        this.enableContinueButton();
    }
    
    getTypeIcon(type) {
        const icons = {
            text: 'comment',
            voice: 'microphone',
            media: 'image',
            documents: 'file-text'
        };
        return icons[type] || 'file';
    }
    
    removeUploadedItem(type, id) {
        this.uploadedFiles[type] = this.uploadedFiles[type].filter(item => item.id !== id);
        this.updateUploadDisplay(type);
    }
    
    enableContinueButton() {
        const hasAnyContent = Object.values(this.uploadedFiles).some(arr => arr.length > 0);
        const nextBtn = document.getElementById('next-step-1');
        if (nextBtn) {
            nextBtn.disabled = !hasAnyContent;
            nextBtn.style.opacity = hasAnyContent ? '1' : '0.5';
        }
    }
    
    closeUploadModal() {
        const modal = document.getElementById('upload-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    nextStep() {
        if (this.currentStep < 3) {
            this.showStep(this.currentStep + 1);
        }
    }
    
    previousStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }
    
    skipStep() {
        this.nextStep();
    }
    
    showStep(stepNumber) {
        // Update progress indicators
        document.querySelectorAll('.step-indicator').forEach(indicator => {
            indicator.classList.remove('active');
        });
        document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');
        
        // Update step content
        document.querySelectorAll('.creation-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector(`.creation-step[data-step="${stepNumber}"]`).classList.add('active');
        
        this.currentStep = stepNumber;
    }
    
    handleVoiceSettingClick(option) {
        const settingType = option.closest('.setting-group').querySelector('label').textContent.toLowerCase().replace(' ', '');
        const value = option.dataset.tone;
        
        // Update UI
        option.parentElement.querySelectorAll('.setting-option').forEach(opt => {
            opt.classList.remove('active');
        });
        option.classList.add('active');
        
        // Update settings
        if (settingType.includes('tone')) {
            this.voiceSettings.tone = value;
        }
    }
    
    playVoiceSample() {
        const button = document.querySelector('.voice-play');
        const waveform = document.querySelector('.voice-waveform');
        
        button.innerHTML = '<i class="fas fa-pause"></i> Playing...';
        button.disabled = true;
        
        // Animate waveform
        waveform.style.opacity = '1';
        
        // Simulate playback (in real implementation, play actual sample)
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-play"></i> Play sample';
            button.disabled = false;
            waveform.style.opacity = '0.3';
        }, 3000);
    }
    
    setInputMode(mode) {
        this.currentInputMode = mode;
        
        // Update UI
        document.querySelectorAll('.input-mode').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        document.querySelectorAll('.text-input, .voice-input').forEach(input => {
            input.classList.remove('active');
        });
        document.querySelector(`.${mode}-input`).classList.add('active');
    }
    
    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addChatMessage('user', message);
        input.value = '';
        
        try {
            // Send to API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    voiceId: this.voiceId,
                    personalityContext: this.personalityId ? `Use personality ID: ${this.personalityId}` : null,
                    sessionId: this.sessionId
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.addChatMessage('assistant', result.response, result.audio_url);
            } else {
                this.addChatMessage('assistant', "I'm sorry, I'm having trouble responding right now. Please try again.");
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.addChatMessage('assistant', "I'm sorry, I'm having trouble connecting right now. Please try again.");
        }
    }
    
    addChatMessage(sender, content, audioUrl = null) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
            </div>
            ${sender === 'assistant' ? `
                <div class="message-actions">
                    <button class="voice-toggle" onclick="memorial.toggleVoice(this)" ${audioUrl ? `data-audio="${audioUrl}"` : ''}>
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
            ` : ''}
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    toggleVoice(button) {
        const audioUrl = button.dataset.audio;
        if (!audioUrl) {
            console.log('No audio available for this message');
            return;
        }
        
        if (button.classList.contains('playing')) {
            // Stop current audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            button.classList.remove('playing');
        } else {
            // Play audio
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.play();
            button.classList.add('playing');
            
            this.currentAudio.addEventListener('ended', () => {
                button.classList.remove('playing');
            });
        }
    }
    
    toggleVoiceRecording() {
        if (!this.isRecording) {
            this.startVoiceRecording();
        } else {
            this.stopVoiceRecording();
        }
    }
    
    startVoiceRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.mediaRecorder.start();
                this.isRecording = true;
                
                const button = document.querySelector('.voice-record-btn');
                const indicator = document.querySelector('.voice-indicator');
                
                button.classList.add('recording');
                button.innerHTML = '<i class="fas fa-stop"></i><span>Stop recording</span>';
                indicator.classList.add('active');
                
                this.mediaRecorder.addEventListener('dataavailable', (e) => {
                    // Handle recorded audio data
                    console.log('Audio recorded:', e.data);
                });
                
                this.mediaRecorder.addEventListener('stop', () => {
                    stream.getTracks().forEach(track => track.stop());
                    this.isRecording = false;
                    button.classList.remove('recording');
                    button.innerHTML = '<i class="fas fa-microphone"></i><span>Hold to speak</span>';
                    indicator.classList.remove('active');
                });
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert('Unable to access microphone. Please check your permissions.');
            });
    }
    
    stopVoiceRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
        }
    }
    
    saveProgress() {
        const progressData = {
            currentStep: this.currentStep,
            uploadedFiles: this.uploadedFiles,
            voiceSettings: this.voiceSettings,
            voiceId: this.voiceId,
            personalityId: this.personalityId,
            sessionId: this.sessionId
        };
        
        localStorage.setItem('memorialProgress', JSON.stringify(progressData));
        
        // Show success notification
        this.showNotification('Progress saved successfully', 'success');
    }
    
    previewMemorial() {
        // Open a preview of the memorial in a new window/modal
        console.log('Preview memorial functionality would open here');
        this.showNotification('Preview functionality coming soon!', 'info');
    }
    
    async completeMemorial() {
        this.showProcessingModal();
        
        try {
            // Simulate processing time
            await this.simulateProcessing();
            
            // Save final memorial data
            this.saveProgress();
            
            // Show completion
            this.showCompletionModal();
        } catch (error) {
            console.error('Error completing memorial:', error);
            this.hideProcessingModal();
            this.showNotification('Error creating memorial. Please try again.', 'error');
        }
    }
    
    showProcessingModal() {
        const modal = document.getElementById('processing-modal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    hideProcessingModal() {
        const modal = document.getElementById('processing-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    async simulateProcessing() {
        const steps = [
            'Analyzing personality traits...',
            'Processing voice recordings...',
            'Training AI model...',
            'Configuring responses...',
            'Finalizing memorial...'
        ];
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        for (let i = 0; i < steps.length; i++) {
            progressText.textContent = steps[i];
            progressFill.style.width = `${((i + 1) / steps.length) * 100}%`;
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    showCompletionModal() {
        this.hideProcessingModal();
        
        // Create completion modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-body text-center">
                    <div style="font-size: 4rem; color: var(--success); margin-bottom: var(--spacing-4);">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h2>Memorial created successfully</h2>
                    <p>Your memorial for ${this.memorialData.name} is ready. You can now start having conversations and preserving precious memories.</p>
                    <div style="margin-top: var(--spacing-8);">
                        <button class="btn btn-primary btn-large" onclick="window.location.href='memorial-chat.html?id=${this.sessionId}'">
                            <i class="fas fa-comments"></i>
                            Start conversation
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            border: 1px solid var(--border);
            border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'primary'});
            border-radius: var(--radius-lg);
            padding: var(--spacing-4);
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            max-width: 350px;
            animation: slideInRight 0.5s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: var(--spacing-3);">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" 
                   style="color: var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'primary'});"></i>
                <p style="margin: 0; color: var(--text-primary);">${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Initialize memorial creation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.memorial = new MemorialCreation();
});

// Add CSS for upload forms and drag/drop
const uploadStyles = document.createElement('style');
uploadStyles.textContent = `
    .upload-form { padding: var(--spacing-4); }
    .upload-tabs { display: flex; gap: var(--spacing-2); margin-bottom: var(--spacing-6); }
    .tab-btn { padding: var(--spacing-2) var(--spacing-4); border: 1px solid var(--border); 
               background: white; border-radius: var(--radius-md); cursor: pointer; }
    .tab-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .file-drop-zone { border: 2px dashed var(--border); border-radius: var(--radius-lg); 
                      padding: var(--spacing-8); text-align: center; transition: all 0.3s; }
    .file-drop-zone.drag-over { border-color: var(--primary); background: rgba(99, 102, 241, 0.02); }
    .record-interface { text-align: center; padding: var(--spacing-6); }
    .record-icon { width: 80px; height: 80px; background: var(--primary); color: white; 
                   border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                   font-size: var(--font-size-3xl); margin: 0 auto var(--spacing-4); }
    .recording-timer { font-size: var(--font-size-xl); font-weight: 600; color: var(--error); }
`;
document.head.appendChild(uploadStyles);