import React, { useState, useEffect, useRef } from 'react';
import { chatWithAI, fetchChatHistory } from '../../services/api';
import './AIChatBot.css';

const AIChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const loadHistory = async () => {
                try {
                    const data = await fetchChatHistory();
                    if (data.success && data.history.length > 0) {
                        setMessages(data.history);
                    }
                } catch (err) {
                    console.error('Failed to load chat history', err);
                }
            };
            loadHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
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
            setError('AI service is busy. Try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const starterPrompts = [
        "Analyze my portfolio",
        "Market trends?",
        "Risk assessment"
    ];

    return (
        <div className={`ai-bot-wrapper ${isOpen ? 'open' : ''}`}>
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <div className="ai-chat-title">
                            <span className="ldot"></span>
                            AI Advisor
                        </div>
                        <button className="ai-close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.length === 0 && (
                            <div className="ai-empty">
                                <div className="ai-bot-icon-large">✨</div>
                                <h4>How can I help you?</h4>
                                <div className="ai-starters">
                                    {starterPrompts.map((p, i) => (
                                        <button key={i} onClick={() => setInput(p)}>{p}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`ai-msg-row ${msg.role}`}>
                                <div className="ai-msg-bubble">
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="ai-msg-row assistant">
                                <div className="ai-msg-bubble loading">
                                    <div className="dot-typing"></div>
                                </div>
                            </div>
                        )}
                        
                        {error && <div className="ai-error">{error}</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="ai-chat-input" onSubmit={handleSend}>
                        <input 
                            type="text" 
                            placeholder="Type a message..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit" disabled={!input.trim() || isLoading}>
                            {isLoading ? '...' : '→'}
                        </button>
                    </form>
                </div>
            )}

            <button className="ai-fab" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '×' : '✨'}
            </button>
        </div>
    );
};

export default AIChatBot;
