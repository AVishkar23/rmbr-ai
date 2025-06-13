// Question Manager Component
class QuestionManager {
    constructor() {
        this.questions = {
            memory: [
                {
                    id: 'name',
                    text: "What's their name? I'd love to know who we're creating this companion for.",
                    type: 'text',
                    category: 'basic'
                },
                {
                    id: 'memory_essence',
                    text: "What memory brings them to life for you? Think of a moment that captures their essence.",
                    type: 'text',
                    category: 'emotional'
                },
                {
                    id: 'comfort_style',
                    text: "What were they like when you were sad? How did they comfort you?",
                    type: 'text',
                    category: 'emotional'
                },
                {
                    id: 'common_phrases',
                    text: "What phrases did they say a lot? Those little expressions that were uniquely them.",
                    type: 'text',
                    category: 'personality'
                },
                {
                    id: 'laughter_triggers',
                    text: "What made them laugh? What could always bring a smile to their face?",
                    type: 'text',
                    category: 'personality'
                },
                {
                    id: 'passions',
                    text: "What was their biggest passion or interest? What made their eyes light up?",
                    type: 'text',
                    category: 'interests'
                },
                {
                    id: 'love_language',
                    text: "How did they show love? What were their little ways of caring for others?",
                    type: 'text',
                    category: 'emotional'
                },
                {
                    id: 'favorite_story',
                    text: "What's a story about them that always makes you smile?",
                    type: 'text',
                    category: 'memories'
                },
                {
                    id: 'quirks',
                    text: "What were their quirks or habits? Those endearing little things that made them special.",
                    type: 'text',
                    category: 'personality'
                },
                {
                    id: 'legacy_wish',
                    text: "What would they want you to remember about them?",
                    type: 'text',
                    category: 'emotional'
                }
            ],
            voice: [
                {
                    id: 'speaking_style',
                    text: "Now let's capture their voice. What was their speaking style like?",
                    type: 'text',
                    category: 'voice'
                },
                {
                    id: 'expressions',
                    text: "Did they have any particular expressions or sayings they used often?",
                    type: 'text',
                    category: 'voice'
                },
                {
                    id: 'voice_emotions',
                    text: "How did their voice change when they were excited or happy?",
                    type: 'text',
                    category: 'voice'
                },
                {
                    id: 'advice_tone',
                    text: "What was their tone like when they were giving advice or comfort?",
                    type: 'text',
                    category: 'voice'
                },
                {
                    id: 'speech_patterns',
                    text: "Did they have any speech patterns or ways of speaking that were unique to them?",
                    type: 'text',
                    category: 'voice'
                }
            ],
            essence: [
                {
                    id: 'personality',
                    text: "Let's capture their emotional essence. How would you describe their personality?",
                    type: 'text',
                    category: 'essence'
                },
                {
                    id: 'life_approach',
                    text: "What was their approach to life? How did they face challenges?",
                    type: 'text',
                    category: 'essence'
                },
                {
                    id: 'values',
                    text: "What values were most important to them? What did they stand for?",
                    type: 'text',
                    category: 'essence'
                },
                {
                    id: 'influence',
                    text: "How did they influence the people around them? What impact did they have?",
                    type: 'text',
                    category: 'essence'
                },
                {
                    id: 'legacy',
                    text: "What would they want their legacy to be? How would they want to be remembered?",
                    type: 'text',
                    category: 'essence'
                }
            ]
        };
        
        this.comfortingQuotes = [
            "Those we love never truly leave us. They live on in the memories we cherish.",
            "Memories are the treasures that we keep locked deep within the storehouse of our souls.",
            "The love we give away is the only love we keep.",
            "Grief is the price we pay for love.",
            "What we have once enjoyed we can never lose. All that we love deeply becomes a part of us.",
            "The heart remembers what the mind forgets.",
            "Love is how you stay alive, even after you are gone.",
            "The best and most beautiful things in the world cannot be seen or even touched. They must be felt with the heart.",
            "Death leaves a heartache no one can heal, love leaves a memory no one can steal.",
            "When someone you love becomes a memory, the memory becomes a treasure."
        ];
        
        this.stageTransitions = {
            memory: {
                nextStage: 'voice',
                message: "Thank you for sharing those beautiful memories. Now let's capture their voice and speaking style. What was their voice like?"
            },
            voice: {
                nextStage: 'essence',
                message: "Now let's capture their essence - the core of who they were. This will help create a companion that truly reflects their spirit."
            },
            essence: {
                nextStage: 'complete',
                message: "Thank you for sharing so much of your heart with me. I feel like I'm getting to know them through your memories. Would you like to add any photos, voice recordings, or videos to make your companion even more personal?"
            }
        };
    }
    
    getQuestion(stage, index) {
        return this.questions[stage]?.[index] || null;
    }
    
    getQuestionsForStage(stage) {
        return this.questions[stage] || [];
    }
    
    getStageTransition(stage) {
        return this.stageTransitions[stage] || null;
    }
    
    getRandomQuote() {
        return this.comfortingQuotes[Math.floor(Math.random() * this.comfortingQuotes.length)];
    }
    
    shouldShowQuote(questionIndex, stage) {
        // Show quotes more frequently in emotional categories
        const question = this.getQuestion(stage, questionIndex);
        if (!question) return false;
        
        const emotionalCategories = ['emotional', 'memories', 'essence'];
        const isEmotional = emotionalCategories.includes(question.category);
        
        // Higher chance for emotional questions
        const chance = isEmotional ? 0.4 : 0.2;
        return Math.random() < chance;
    }
    
    getQuestionSummary(stage) {
        const questions = this.getQuestionsForStage(stage);
        return {
            total: questions.length,
            categories: [...new Set(questions.map(q => q.category))],
            emotionalCount: questions.filter(q => q.category === 'emotional').length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionManager;
} else {
    window.QuestionManager = QuestionManager;
} 