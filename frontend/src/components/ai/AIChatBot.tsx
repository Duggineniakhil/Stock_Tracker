
import React, { useEffect, useRef, useState } from 'react';
import { chatWithAI, fetchChatHistory, fetchPortfolio } from '../../services/api';
import './AIChatBot.css';

interface AIChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface Holding {
    symbol: string;
}

const AIChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                try {
                    if (messages.length === 0) {
                        const historyData = await fetchChatHistory();
                        if (historyData.success && historyData.history.length > 0) {
                            setMessages(historyData.history);
                        }
                    }

                    const portData = await fetchPortfolio();
                    setHoldings(portData.data || portData || []);
                } catch (err) {
                    console.error('Failed to load chat data', err);
                }
            };
            loadData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent<HTMLFormElement> | null, customText: string | null = null) => {
        if (e) e.preventDefault();
        const textToSend = customText ?? input;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: AIChatMessage = { role: 'user', content: textToSend };
        setMessages((prev) => [...prev, userMsg]);
        if (!customText) setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const data = await chatWithAI(textToSend);
            if (data.success) {
                setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setError(data.message || 'Failed to get response');
            }
        } catch (err) {
            setError('AI service is busy. Try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        if (window.confirm('Clear all chat history?')) {
            setMessages([]);
        }
    };

    const getDynamicPrompts = (): string[] => {
        const base = ['Analyze my portfolio', 'Market trends?'];
        if (holdings.length > 0) {
            const topHolding = holdings[0].symbol;
            base.push(`Tell me about ${topHolding}`);
            if (holdings.length > 1) {
                base.push(`Compare ${holdings[0].symbol} vs ${holdings[1].symbol}`);
            }
        } else {
            base.push('Risk assessment');
        }
        return base;
    };

    const starterPrompts = getDynamicPrompts();

    return (
        <div className={`ai-bot-wrapper ${isOpen ? 'open' : ''}`}>
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <div className="ai-chat-title">
                            <span className="ldot"></span>
                            AI Advisor
                        </div>
                        <div className="ai-header-actions">
                            <button className="ai-clear-btn" title="Clear Chat" onClick={handleClear}>🗑️</button>
                            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>×</button>
                        </div>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.length === 0 && (
                            <div className="ai-empty">
                                <div className="ai-bot-icon-large">✨</div>
                                <h4>How can I help you?</h4>
                                <div className="ai-starters">
                                    {starterPrompts.map((p, i) => (
                                        <button key={i} onClick={() => handleSend(null, p)}>{p}</button>
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

                    <form className="ai-chat-input" onSubmit={(e) => handleSend(e)}>
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
