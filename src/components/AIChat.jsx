import { useState, useRef, useCallback, useEffect } from 'react';
import { sendChatMessage } from '../services/api.js';
import { useSpeech, useVoiceInput } from '../hooks/useAccessibility.js';

/** Icons as inline SVG components for zero-dependency icons */
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const MicIcon = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const SpeakerIcon = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    {active && <><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>}
    {!active && <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
  </svg>
);

/** Quick question suggestions */
const QUICK_QUESTIONS = [
  'What schemes are available for farmers?',
  'How do I apply for PM Awas Yojana?',
  'What is Ayushman Bharat card?',
  'How to get a caste certificate?',
];

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: '🙏 Namaste! I am **NagarikSathi**, your AI-powered civic companion.\n\nI can help you discover government schemes, understand eligibility, navigate public services, and answer questions about Indian governance — in your preferred language.\n\nHow can I assist you today?',
    timestamp: Date.now(),
  },
];

/**
 * AIChat component - Conversational AI companion for civic queries.
 *
 * Features:
 *  - Multi-turn conversation with Gemini
 *  - Voice input (Web Speech API)
 *  - Text-to-speech output
 *  - Language selector
 *  - Quick question shortcuts
 *  - Keyboard accessible
 *
 * @param {{ ttsEnabled: boolean }} props
 */
export default function AIChat({ ttsEnabled = false }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { speak, stop, isSpeaking } = useSpeech();

  const { start: startVoice, isListening, isSupported: voiceSupported } = useVoiceInput((transcript) => {
    setInput(transcript);
    inputRef.current?.focus();
  });

  /** Scroll to bottom of message list when new messages arrive */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Sends a message to the AI and appends the response.
   * @param {string} text - Message text to send.
   */
  const handleSend = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build conversation history for context
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

    try {
      const { reply } = await sendChatMessage(trimmed, history, language);
      const aiMsg = { id: Date.now() + 1, role: 'assistant', text: reply, timestamp: Date.now() };
      setMessages((prev) => [...prev, aiMsg]);

      // Auto-read reply if TTS is enabled
      if (ttsEnabled) {
        speak(reply);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: `⚠️ Sorry, I encountered an error: ${err.message}. Please try again.`,
          timestamp: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, ttsEnabled, speak, language]);

  /** Handle Enter key to send (Shift+Enter for new line) */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatText = (text) => {
    // Simple markdown: **bold**, *italic*, newlines
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="chat-container" role="region" aria-label="AI Chat Companion">
      {/* Language + controls */}
      <div className="flex-between">
        <div className="flex-row">
          <label htmlFor="lang-select" className="sr-only">Select Language</label>
          <select
            id="lang-select"
            className="form-select"
            style={{ width: 'auto', padding: '6px 32px 6px 12px' }}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Select response language"
          >
            <option value="en">🇬🇧 English</option>
            <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
            <option value="te">Telugu</option>
            <option value="ta">Tamil</option>
            <option value="mr">Marathi</option>
            <option value="bn">Bengali</option>
            <option value="gu">Gujarati</option>
          </select>
        </div>

        {isSpeaking && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={stop}
            aria-label="Stop text-to-speech"
          >
            <SpeakerIcon active />
            Stop Reading
          </button>
        )}
      </div>

      {/* Message list */}
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
        aria-atomic="false"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.role}`}
            aria-label={`${msg.role === 'user' ? 'You' : 'NagarikSathi'} said`}
          >
            {msg.role === 'assistant' && (
              <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-secondary)', fontWeight: 600 }}>
                  🤖 NagarikSathi
                </span>
                {ttsEnabled && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 6px' }}
                    onClick={() => speak(msg.text)}
                    aria-label={`Read message aloud: ${msg.text.substring(0, 40)}...`}
                    title="Read aloud"
                  >
                    <SpeakerIcon />
                  </button>
                )}
              </div>
            )}
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
            />
          </div>
        ))}

        {isLoading && (
          <div className="chat-bubble assistant loading" aria-label="NagarikSathi is thinking" aria-live="polite">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      <div
        className="flex-row"
        style={{ flexWrap: 'wrap', gap: 8 }}
        aria-label="Quick question suggestions"
      >
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            className="btn btn-ghost btn-sm"
            onClick={() => handleSend(q)}
            disabled={isLoading}
            aria-label={`Ask: ${q}`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="chat-input-row">
        <div className="chat-input-wrap">
          <label htmlFor="chat-input" className="sr-only">Type your message</label>
          <textarea
            id="chat-input"
            ref={inputRef}
            className="form-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about government schemes, documents, services..."
            rows={2}
            disabled={isLoading}
            aria-label="Message input"
            aria-describedby="chat-hint"
          />
          <p id="chat-hint" className="sr-only">Press Enter to send, Shift+Enter for new line</p>
        </div>

        {voiceSupported && (
          <button
            className={`btn btn-ghost btn-icon ${isListening ? 'btn-danger' : ''}`}
            onClick={startVoice}
            disabled={isListening}
            aria-label={isListening ? 'Listening for voice input...' : 'Start voice input'}
            aria-pressed={isListening}
            title="Voice input"
          >
            <MicIcon active={isListening} />
          </button>
        )}

        <button
          className="btn btn-primary"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          <SendIcon />
          Send
        </button>
      </div>
    </div>
  );
}
