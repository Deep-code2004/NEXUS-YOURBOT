import { useEffect, useRef, useCallback } from 'react';
import { useAIStore } from '@/store/useAIStore';
import { useSceneStore } from '@/store/useSceneStore';

export function useVoiceInteraction() {
  const {
    isListening,
    setIsListening,
    setIsThinking,
    setIsSpeaking,
    setTranscript,
    setVoiceError,
    setIsSupported,
    addMessage,
  } = useAIStore();

  const { setCards, setActiveCardId, setAdminDeckOpen, setAdminUsers, setAdminStats } =
    useSceneStore();

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);
  const isProcessingRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsKeepAliveRef = useRef<NodeJS.Timeout | null>(null);

  // Keep isListeningRef in sync with store
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Clean TTS Keepalive
  const clearTTSKeepAlive = () => {
    if (ttsKeepAliveRef.current) {
      clearInterval(ttsKeepAliveRef.current);
      ttsKeepAliveRef.current = null;
    }
  };

  // Production-grade Speech Synthesis with Chrome keepalive & voice selection
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
      }

      try {
        clearTTSKeepAlive();
        window.speechSynthesis.cancel();

        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        currentUtteranceRef.current = utterance;

        // Choose futuristic/pleasant voice
        const updateVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(
            (v) =>
              v.name.includes('Google UK English Male') ||
              v.name.includes('Daniel') ||
              v.name.includes('Samantha') ||
              v.name.includes('Natural') ||
              (v.lang.startsWith('en') && !v.name.includes('Zira'))
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        };

        updateVoice();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = updateVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 0.95;

        const handleSpeechEnd = () => {
          clearTTSKeepAlive();
          currentUtteranceRef.current = null;
          setIsSpeaking(false);
          if (onEnd) onEnd();
        };

        utterance.onend = handleSpeechEnd;
        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('[NEXUS TTS] Utterance error:', e.error);
          }
          handleSpeechEnd();
        };

        // Chrome TTS fix: trigger pause/resume to prevent 15-second speech cutoff bug
        ttsKeepAliveRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 10000);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[NEXUS TTS] Playback failed:', err);
        setIsSpeaking(false);
        if (onEnd) onEnd();
      }
    },
    [setIsSpeaking]
  );

  // Send Command to Gemini API and execute spatial/DB actions
  const handleCommand = useCallback(
    async (command: string) => {
      if (!command || !command.trim()) return;

      isProcessingRef.current = true;
      setIsThinking(true);
      setVoiceError(null);

      // Stop recognition while processing to prevent picking up ambient sounds or AI voice
      if (recognitionRef.current && isRecognizingRef.current) {
        try {
          recognitionRef.current.abort();
          isRecognizingRef.current = false;
        } catch (_) {}
      }

      addMessage({ role: 'user', content: command });

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: command,
            history: useAIStore.getState().history,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 1. Synchronize dynamic cards with local scene
        if (data.cards && Array.isArray(data.cards)) {
          setCards(data.cards);
        }

        // 2. Handle Spatial UI / Admin Actions
        if (data.action) {
          const actionName = data.action.action;
          const params = data.action.params || {};

          if (actionName === 'create_card' || actionName === 'open_card' || actionName === 'add_card_items') {
            const targetTitle = (params.title || params.cardTitle || params.target || '').toUpperCase();
            const currentCards = data.cards || useSceneStore.getState().cards;
            const targetCard = currentCards.find(
              (c: any) =>
                c.title === targetTitle ||
                c.slug === targetTitle.toLowerCase() ||
                targetTitle.includes(c.title)
            );
            if (targetCard) {
              setActiveCardId(targetCard.id);
            }
          } else if (actionName === 'close_card') {
            setActiveCardId(null);
            setAdminDeckOpen(false);
          } else if (actionName === 'admin_show_users' || actionName === 'admin_show_stats') {
            if (data.adminData) {
              setAdminUsers(data.adminData.users || []);
              setAdminStats(data.adminData.stats || null);
              setAdminDeckOpen(true);
            }
          }
        }

        if (data.text) {
          addMessage({ role: 'model', content: data.text });

          // Speak reply and restore listening when done
          speak(data.text, () => {
            isProcessingRef.current = false;
            setTranscript('');
            if (isListeningRef.current && recognitionRef.current && !isRecognizingRef.current) {
              try {
                recognitionRef.current.start();
                isRecognizingRef.current = true;
              } catch (_) {}
            }
          });
        } else {
          isProcessingRef.current = false;
        }
      } catch (error) {
        console.error('[NEXUS AI] Error handling command:', error);
        speak('System error processing that request. Please try again.', () => {
          isProcessingRef.current = false;
          setTranscript('');
          if (isListeningRef.current && recognitionRef.current && !isRecognizingRef.current) {
            try {
              recognitionRef.current.start();
              isRecognizingRef.current = true;
            } catch (_) {}
          }
        });
      } finally {
        setIsThinking(false);
      }
    },
    [
      addMessage,
      setActiveCardId,
      setAdminDeckOpen,
      setAdminStats,
      setAdminUsers,
      setCards,
      setIsThinking,
      setTranscript,
      setVoiceError,
      speak,
    ]
  );

  // Initialize Speech Recognition once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setVoiceError('Speech recognition is not supported in this browser.');
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      retryCountRef.current = 0;
      setVoiceError(null);
    };

    recognition.onresult = (event: any) => {
      if (isProcessingRef.current) return;

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item && item[0]) {
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }
      }

      const currentText = finalTranscript || interimTranscript;
      if (currentText.trim()) {
        setTranscript(currentText.trim());
      }

      if (finalTranscript.trim()) {
        const cleanText = finalTranscript.trim();
        const lowerText = cleanText.toLowerCase();

        // Check for wake word or direct commands
        if (
          lowerText.includes('nexus') ||
          lowerText.startsWith('make') ||
          lowerText.startsWith('create') ||
          lowerText.startsWith('add') ||
          lowerText.startsWith('open') ||
          lowerText.startsWith('show') ||
          lowerText.startsWith('close') ||
          lowerText.startsWith('delete')
        ) {
          handleCommand(cleanText);
        }
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;

      // Filter non-fatal / expected events
      if (error === 'no-speech') {
        return; // Ignore normal silence
      }

      if (error === 'aborted') {
        isRecognizingRef.current = false;
        return; // Ignore intentional aborts
      }

      if (error === 'network') {
        // Network connectivity error to cloud speech service
        isRecognizingRef.current = false;
        console.warn('[NEXUS Voice] Speech service network issue. Attempting backoff reconnection...');

        if (retryCountRef.current < 3 && isListeningRef.current) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
          retryCountRef.current += 1;
          setVoiceError(`Voice network interrupted. Reconnecting in ${delay / 1000}s...`);

          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current && !isProcessingRef.current && !isRecognizingRef.current) {
              try {
                recognition.start();
                isRecognizingRef.current = true;
              } catch (_) {}
            }
          }, delay);
        } else {
          setVoiceError('Voice recognition network unavailable. Click mic or type below to interact.');
        }
        return;
      }

      if (error === 'not-allowed' || error === 'service-not-allowed') {
        isRecognizingRef.current = false;
        setIsListening(false);
        setVoiceError('Microphone permission denied. Enable microphone in browser settings.');
        return;
      }

      if (error === 'audio-capture') {
        isRecognizingRef.current = false;
        setIsListening(false);
        setVoiceError('No microphone detected. Check your audio input devices.');
        return;
      }

      console.warn('[NEXUS Voice] Unhandled recognition error:', error);
      setVoiceError(`Voice recognition error: ${error}`);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;

      // If user still wants to listen and we are not currently executing a command or speaking
      if (isListeningRef.current && !isProcessingRef.current && retryCountRef.current === 0) {
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current && !isProcessingRef.current && !isRecognizingRef.current) {
            try {
              recognition.start();
              isRecognizingRef.current = true;
            } catch (_) {}
          }
        }, 300);
      }
    };

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      clearTTSKeepAlive();
      if (recognition) {
        try {
          recognition.abort();
        } catch (_) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [handleCommand, setIsListening, setIsSupported, setTranscript, setVoiceError]);

  const startListening = useCallback(() => {
    setVoiceError(null);
    retryCountRef.current = 0;
    setIsListening(true);

    if (recognitionRef.current && !isRecognizingRef.current && !isProcessingRef.current) {
      try {
        recognitionRef.current.start();
        isRecognizingRef.current = true;
      } catch (e) {}
    }
  }, [setIsListening, setVoiceError]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (recognitionRef.current && isRecognizingRef.current) {
      try {
        recognitionRef.current.stop();
        isRecognizingRef.current = false;
      } catch (_) {}
    }
  }, [setIsListening]);

  return {
    startListening,
    stopListening,
    speak,
    sendCommand: handleCommand,
  };
}
