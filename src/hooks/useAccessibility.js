import { useState, useCallback } from 'react';

/**
 * Custom hook for managing Text-to-Speech via the Web Speech API.
 *
 * Provides speak and stop functions, and tracks whether TTS is active.
 * Gracefully degrades if the browser does not support speech synthesis.
 *
 * @returns {{ speak: (text: string) => void, stop: () => void, isSpeaking: boolean, isSupported: boolean }}
 */
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = 'speechSynthesis' in window;

  const speak = useCallback((text) => {
    if (!isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN'; // Indian English voice
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}

/**
 * Custom hook for voice-to-text input using the Web Speech API.
 *
 * @param {(transcript: string) => void} onResult - Callback with the recognized transcript.
 * @returns {{ start: () => void, stop: () => void, isListening: boolean, isSupported: boolean }}
 */
export function useVoiceInput(onResult) {
  const [isListening, setIsListening] = useState(false);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = Boolean(SpeechRecognition);

  const start = useCallback(() => {
    if (!isSupported) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [isSupported, onResult]);

  const stop = useCallback(() => {
    setIsListening(false);
  }, []);

  return { start, stop, isListening, isSupported };
}

/**
 * Custom hook for managing accessibility preferences (font size, high contrast, TTS).
 * Persists settings to localStorage for returning users.
 *
 * @returns {{ settings: object, setFontSize: Function, toggleHighContrast: Function, toggleTts: Function }}
 */
export function useAccessibility() {
  const stored = JSON.parse(localStorage.getItem('a11y-prefs') || '{}');

  const [settings, setSettings] = useState({
    fontSize: stored.fontSize || 'normal', // 'normal' | 'large' | 'xlarge'
    highContrast: stored.highContrast || false,
    ttsEnabled: stored.ttsEnabled || false,
  });

  const save = (updated) => {
    setSettings(updated);
    localStorage.setItem('a11y-prefs', JSON.stringify(updated));
  };

  const setFontSize = (size) => save({ ...settings, fontSize: size });
  const toggleHighContrast = () => save({ ...settings, highContrast: !settings.highContrast });
  const toggleTts = () => save({ ...settings, ttsEnabled: !settings.ttsEnabled });

  return { settings, setFontSize, toggleHighContrast, toggleTts };
}
