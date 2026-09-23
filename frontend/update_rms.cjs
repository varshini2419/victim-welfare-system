const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGeminiLive.js', 'utf8');

const target = `const pcmBlob = createPcmBlob(message.data);
                    try {
                      if (sessionRef.current && sessionRef.current.readyState === 1) {
                        sessionRef.current.send(JSON.stringify({
                          realtimeInput: {
                            mediaChunks: [pcmBlob]
                          }
                        }));
                        window._lastMicChunkSent = performance.now();
                        window._firstAudioReceived = false;
                        resetSilenceTimer();
                        resetFillerTimer();
  
                      }`;

const replacement = `const pcmBlob = createPcmBlob(message.data);
                    try {
                      if (sessionRef.current && sessionRef.current.readyState === 1) {
                        sessionRef.current.send(JSON.stringify({
                          realtimeInput: {
                            mediaChunks: [pcmBlob]
                          }
                        }));
                        window._lastMicChunkSent = performance.now();
                        window._firstAudioReceived = false;
                        
                        let sum = 0;
                        for (let i = 0; i < message.data.length; i++) {
                          sum += message.data[i] * message.data[i];
                        }
                        const rms = Math.sqrt(sum / message.data.length);
                        if (rms > 0.01) {
                          resetSilenceTimer();
                        }
                        resetFillerTimer();
                      }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/hooks/useGeminiLive.js', code);
console.log('Done');
