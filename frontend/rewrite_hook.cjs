const fs = require('fs');

try {
  let code = fs.readFileSync('src/hooks/useGeminiLive.js', 'utf8');

  // 1. Remove import
  code = code.replace(/import \{ GoogleGenAI \} from '@google\/genai';\n/, '');

  // 2. Change signature
  code = code.replace(/export default function useGeminiLive\(apiKey, customInstruction = ""\) \{/, 'export default function useGeminiLive(language) {');

  // 3. Replace dependencies in array
  code = code.replace(/\[apiKey, customInstruction, disconnect\]/, '[language, disconnect]');

  // 4. Replace connect implementation inside the try block
  const startIdx = code.indexOf('const ai = new GoogleGenAI');
  const endIdx = code.indexOf('// If a new connection started while this one was setting up');

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Could not find connect block to replace');
  }

  const replacement = `const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = \`\${protocol}//\${window.location.host}/api/v1/voice/realtime?token=\${token}&language=\${encodeURIComponent(language || 'en-IN')}\`;

      const session = new WebSocket(wsUrl);

      session.onopen = () => {
        // Wait for provider_ready
      };

      session.onmessage = (event) => {
        if (connectionIdRef.current !== myConnectionId) return;
        try {
          const message = JSON.parse(event.data);
          if (message.event === 'provider_ready') {
            console.log("Gemini Live connection established via backend");
            setIsConnected(true);
            if (!callStartTimeRef.current) {
              callStartTimeRef.current = Date.now();
            }
            if (!isReconnect) {
              reportedConditionsRef.current = [];
              if (token) {
                fetch('/api/v1/chatbot/voice-start', {
                  method: 'POST',
                  headers: { 'Authorization': \`Bearer \${token}\` }
                }).catch(e => console.error("Failed to start voice:", e));
              }
            }
            if (playbackContextRef.current && playbackContextRef.current.state === 'suspended') {
              playbackContextRef.current.resume().catch(() => {});
            }
            setTimeout(() => {
              if (connectionIdRef.current === myConnectionId) {
                reconnectAttemptsRef.current = 0;
              }
            }, 15000);

            if (audioContextRef.current && mediaStreamRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
              workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'pcm-processor');
              workletNodeRef.current.port.onmessage = (e) => {
                // Gate 4C will send audio here
              };
              source.connect(workletNodeRef.current);
              workletNodeRef.current.connect(audioContextRef.current.destination);
            }
          } else if (message.event === 'provider_error') {
            console.error("Provider error:", message.message);
            setError(message.message || "Provider error");
          } else if (message.serverContent) {
            // Forwarded from Gemini backend
            if (message.serverContent.interrupted) {
              activeAudioNodesRef.current.forEach(node => {
                try { node.stop(); } catch (e) {}
              });
              activeAudioNodesRef.current = [];
              setIsSpeaking(false);
              if (playbackContextRef.current) {
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
              }
            }
            if (message.serverContent.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                  const pcmData = part.inlineData.data;
                  if (pcmData) {
                    playPCMChunk(pcmData);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn("Invalid message from server:", err);
        }
      };

      session.onclose = (event) => {
        if (connectionIdRef.current !== myConnectionId) return;
        console.log("Gemini Live Session Closed", event?.code, event?.reason);
        setIsConnected(false);
        setIsSpeaking(false);
        teardownConnection();
        scheduleReconnect(myConnectionId, event?.code);
      };

      session.onerror = (err) => {
        if (connectionIdRef.current !== myConnectionId) return;
        console.error("Gemini Live Session Error", err);
      };

      `;

  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);

  // Remove sendClientContent block
  code = code.replace(/try \{\s*session\.sendClientContent\([\s\S]*?\}\s*catch \(err\) \{\s*console\.warn\(\"Could not send initial trigger:\", err\);\s*\}/, '// No SDK initial trigger');

  fs.writeFileSync('src/hooks/useGeminiLive.js', code);
  console.log('Successfully modified useGeminiLive.js');
} catch (e) {
  console.error(e);
}
