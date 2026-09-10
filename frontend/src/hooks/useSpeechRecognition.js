import { useState, useEffect, useRef } from 'react';

/**
 * useSpeechRecognition – a simple wrapper around the Web Speech API.
 * Provides live transcript, listening state and start/stop controls.
 *
 * Returns:
 *   listening: boolean – whether recognition is active
 *   transcript: string – the accumulated speech transcript
 *   start: () => void – begins listening
 *   stop: () => void – stops listening
 */
export default function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          setTranscript((prev) => prev + result[0].transcript + ' ');
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) {
        setTranscript((prev) => prev + interim);
      }
    };

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      console.error('Speech recognition error', e);
      setListening(false);
    };

    recognitionRef.current = recognition;
    return () => { recognition.stop(); };
  }, []);

  const start = () => {
    if (recognitionRef.current && !listening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stop = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  };

  return { listening, transcript, start, stop };
}
