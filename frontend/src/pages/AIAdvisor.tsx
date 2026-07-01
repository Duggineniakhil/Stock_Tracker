import React, { useState, useEffect, useRef } from 'react';
import { chatWithAI, fetchChatHistory } from '../services/api';
import './AIAdvisor.css';

const AIAdvisor = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await fetchChatHistory();
                if (data.success) {
                    setMessages(data.history);
                }
            } catch (err) {
                console.error('Failed to load chat history', err);
            }
        };
        loadHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const data = await chatWithAI(input);
            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setError(data.message || 'Failed to get response');
            }
        } catch (err) {
            setError('AI service is currently unavailable. Please check your connection.');
            console.error('Chat error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const starterPrompts = [
        "Analyze my portfolio diversification",
        "Explain current market trends in tech",
        "What are the risks in my holdings?",
        "Explain what P/E ratio means"
    ];

    return (
        <div className="advisor-page">
            <div className="advisor-header">
                <div className="advisor-title-box">
                    <h1 className="syne">AI Advisor</h1>
                    <p className="small-text">Intelligent market insights powered by Google Gemini</p>
                </div>
            </div>

            <div className="chat-container">
                <div className="messages-list">
                    {messages.length === 0 && (
                        <div className="empty-chat">
                            <div className="ai-icon-large">✨</div>
                            <h3>How can I help you today?</h3>
                            <div className="starter-grid">
                                {starterPrompts.map((prompt, idx) => (
                                    <button 
                                        key={idx} 
                                        className="starter-btn"
                                        onClick={() => setInput(prompt)}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-row ${msg.role}`}>
                            <div className="message-bubble">
                                {msg.role === 'assistant' && <div className="ai-badge">AI</div>}
                                <div className="msg-content">{msg.content}</div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="message-row assistant">
                            <div className="message-bubble loading">
                                <div className="dot-typing"></div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-alert">
                            {error}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder="Ask about your portfolio, market trends, or specific stocks..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" disabled={!input.trim() || isLoading}>
                        {isLoading ? '...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIAdvisor;
