// Media Manager Component
class MediaManager {
    constructor() {
        this.mediaFiles = {};
        this.supportedTypes = {
            photo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            voice: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'],
            video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
        };
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.uploadCallbacks = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const fileInput = document.getElementById('file-input');
        const uploadZone = document.getElementById('upload-zone');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        if (uploadZone) {
            uploadZone.addEventListener('click', () => fileInput?.click());
            uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
            uploadZone.style.borderColor = '#667eea';
            uploadZone.style.background = 'rgba(102, 126, 234, 0.1)';
        }
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
            uploadZone.style.borderColor = '#cbd5e0';
            uploadZone.style.background = 'transparent';
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
            uploadZone.style.borderColor = '#cbd5e0';
            uploadZone.style.background = 'transparent';
        }
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileUpload({ target: { files } });
        }
    }
    
    handleFileUpload(event) {
        const files = event.target.files;
        if (files.length === 0) return;
        
        const file = files[0];
        const type = this.currentMediaType;
        
        if (!type) {
            console.error('No media type specified');
            return;
        }
        
        // Validate file
        const validation = this.validateFile(file, type);
        if (!validation.valid) {
            this.showError(validation.message);
            return;
        }
        
        // Process and store file
        this.processFile(file, type);
    }
    
    validateFile(file, type) {
        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                message: `File is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}.`
            };
        }
        
        // Check file type
        const supportedTypes = this.supportedTypes[type];
        if (!supportedTypes.includes(file.type)) {
            return {
                valid: false,
                message: `Unsupported file type. Please upload a ${type} file.`
            };
        }
        
        return { valid: true };
    }
    
    processFile(file, type) {
        // Store file
        this.mediaFiles[type] = {
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
        };
        
        // Show success message
        this.showSuccess(file.name);
        
        // Trigger callback if registered
        if (this.uploadCallbacks[type]) {
            this.uploadCallbacks[type](this.mediaFiles[type]);
        }
        
        // Auto-hide upload area after delay
        setTimeout(() => {
            this.hideUploadArea();
        }, 2000);
    }
    
    showSuccess(fileName) {
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
            uploadZone.innerHTML = `
                <i class="fas fa-check-circle" style="color: #51cf66; font-size: 3rem;"></i>
                <p style="color: #51cf66; font-weight: 600;">${fileName} uploaded successfully!</p>
            `;
        }
    }
    
    showError(message) {
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
            uploadZone.innerHTML = `
                <i class="fas fa-exclamation-circle" style="color: #e53e3e; font-size: 3rem;"></i>
                <p style="color: #e53e3e;">${message}</p>
            `;
            
            // Reset after 3 seconds
            setTimeout(() => {
                this.resetUploadZone();
            }, 3000);
        }
    }
    
    hideUploadArea() {
        const uploadArea = document.getElementById('media-upload-area');
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }
        this.resetUploadZone();
    }
    
    resetUploadZone() {
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
            uploadZone.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drop your file here or click to browse</p>
            `;
        }
    }
    
    openFileUpload(type) {
        this.currentMediaType = type;
        const uploadArea = document.getElementById('media-upload-area');
        const fileInput = document.getElementById('file-input');
        
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }
        
        if (fileInput) {
            // Update file input accept attribute based on type
            const supportedTypes = this.supportedTypes[type];
            fileInput.accept = supportedTypes.join(',');
        }
    }
    
    setUploadCallback(type, callback) {
        this.uploadCallbacks[type] = callback;
    }
    
    getMediaFiles() {
        return this.mediaFiles;
    }
    
    getMediaFile(type) {
        return this.mediaFiles[type];
    }
    
    removeMediaFile(type) {
        delete this.mediaFiles[type];
    }
    
    clearAllFiles() {
        this.mediaFiles = {};
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Preview functionality
    createPreview(file, type) {
        return new Promise((resolve, reject) => {
            if (type === 'photo') {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            } else if (type === 'voice' || type === 'video') {
                const url = URL.createObjectURL(file);
                resolve(url);
            } else {
                reject(new Error('Unsupported file type for preview'));
            }
        });
    }
    
    // Cleanup
    cleanup() {
        // Revoke object URLs to free memory
        Object.values(this.mediaFiles).forEach(mediaFile => {
            if (mediaFile.previewUrl) {
                URL.revokeObjectURL(mediaFile.previewUrl);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaManager;
} else {
    window.MediaManager = MediaManager;
} 