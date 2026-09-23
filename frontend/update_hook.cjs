const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGeminiLive.js', 'utf8');

if (!code.includes('activeTurnIdRef')) {
  code = code.replace(
    'const playbackContextRef = useRef(null);',
    'const playbackContextRef = useRef(null);\n  const activeTurnIdRef = useRef(0);\n  const expectedTurnIdRef = useRef(0);'
  );
}

// Just match the whole message.serverContent block
const serverContentStart = code.indexOf("if (message.serverContent) {");
const serverContentEnd = code.indexOf("        } catch (err) {", serverContentStart);

if (serverContentStart !== -1 && serverContentEnd !== -1) {
  const newBlock = `if (message.serverContent) {
            // Forwarded from Gemini backend
            if (message.serverContent.interrupted) {
              activeTurnIdRef.current += 1;
              expectedTurnIdRef.current = activeTurnIdRef.current;
              
              activeAudioNodesRef.current.forEach(node => {
                try { node.stop(); } catch (e) {}
              });
              activeAudioNodesRef.current = [];
              setIsSpeaking(false);
              if (playbackContextRef.current) {
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
              }
            }
            if (message.serverContent.turnComplete) {
               activeTurnIdRef.current += 1;
               expectedTurnIdRef.current = activeTurnIdRef.current;
            }
            
            if (message.serverContent.modelTurn?.parts) {
              const currentAudioTurn = expectedTurnIdRef.current;
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                  const pcmData = part.inlineData.data;
                  if (pcmData) {
                    if (currentAudioTurn === activeTurnIdRef.current) {
                      if (!window._firstAudioReceived) {
                        const now = performance.now();
                        const ttfa = now - window._lastMicChunkSent;
                        console.log(\`[VOICE_LATENCY] browser_response_received. TTFA: \${ttfa.toFixed(2)} ms\`);
                        window._firstAudioReceived = true;
                      }
                      playPCMChunk(pcmData);
                    }
                  }
                }
              }
            }
          }
`;
  code = code.substring(0, serverContentStart) + newBlock + code.substring(serverContentEnd);
  fs.writeFileSync('src/hooks/useGeminiLive.js', code);
  console.log('Successfully updated useGeminiLive.js');
} else {
  console.error("Could not find serverContent block");
}
