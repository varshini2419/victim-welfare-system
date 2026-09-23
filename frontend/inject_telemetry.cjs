const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGeminiLive.js', 'utf8');

// 1. Add diagRef
code = code.replace(/const activeTurnIdRef = useRef\(0\);/, 'const activeTurnIdRef = useRef(0);\n  const diagRef = useRef({ turn: 1, speechStart: null, speechEnd: null, firstAudioReceived: null, firstAudioScheduled: null, isActiveTurn: false });');

// 2. Remove broken _firstAudioReceived logic and add diagRef updates in mic chunk
const micRegex = /window\._lastMicChunkSent = performance\.now\(\);\s*window\._firstAudioReceived = false;\s*let sum = 0;/;
const micReplacement = `let sum = 0;`;
code = code.replace(micRegex, micReplacement);

const rmsRegex = /if \(rms > 0\.01\) \{\s*resetSilenceTimer\(\);\s*\}/;
const rmsReplacement = `if (rms > 0.01) {
                          resetSilenceTimer();
                          const now = performance.now();
                          if (!diagRef.current.speechStart) diagRef.current.speechStart = now;
                          diagRef.current.speechEnd = now;
                          diagRef.current.isActiveTurn = true;
                        }`;
code = code.replace(rmsRegex, rmsReplacement);

// 3. Update interrupted handler to reset diag
const intRegex = /if \(message\.serverContent\.interrupted\) \{\s*activeTurnIdRef\.current \+= 1;/;
const intReplacement = `if (message.serverContent.interrupted) {
                diagRef.current = { turn: diagRef.current.turn + 1, speechStart: null, speechEnd: null, firstAudioReceived: null, firstAudioScheduled: null, isActiveTurn: false };
                activeTurnIdRef.current += 1;`;
code = code.replace(intRegex, intReplacement);

// 4. Update audio receive logic
const audioRecvRegex = /if \(\!window\._firstAudioReceived\) \{[\s\S]*?window\._firstAudioReceived = true;\s*\}/;
const audioRecvReplacement = `if (diagRef.current.isActiveTurn && !diagRef.current.firstAudioReceived) {
                          diagRef.current.firstAudioReceived = performance.now();
                        }`;
code = code.replace(audioRecvRegex, audioRecvReplacement);

// 5. Update playPCMChunk for schedule tracking
const playStartRegex = /source\.start\(nextPlayTimeRef\.current\);/;
const playStartReplacement = `source.start(nextPlayTimeRef.current);
        
        if (diagRef.current.isActiveTurn && diagRef.current.firstAudioReceived && !diagRef.current.firstAudioScheduled) {
          diagRef.current.firstAudioScheduled = performance.now();
          const d = diagRef.current;
          const speechDur = d.speechEnd - d.speechStart;
          const ue_to_fa = d.firstAudioReceived - d.speechEnd;
          const fa_to_sch = d.firstAudioScheduled - d.firstAudioReceived;
          const total = d.firstAudioScheduled - d.speechEnd;
          
          console.log(\`\\n[VOICE_LATENCY] turn=\${d.turn}\`);
          console.log(\`user_speech_start=\${d.speechStart.toFixed(0)}\`);
          console.log(\`user_speech_end=\${d.speechEnd.toFixed(0)}\`);
          console.log(\`first_audio_received=\${d.firstAudioReceived.toFixed(0)}\`);
          console.log(\`first_audio_scheduled=\${d.firstAudioScheduled.toFixed(0)}\`);
          console.log(\`--\`);
          console.log(\`speech_duration=\${speechDur.toFixed(0)} ms\`);
          console.log(\`user_end_to_first_audio=\${ue_to_fa.toFixed(0)} ms\`);
          console.log(\`audio_receive_to_schedule=\${fa_to_sch.toFixed(0)} ms\`);
          console.log(\`user_end_to_schedule=\${total.toFixed(0)} ms\`);
          console.log(\`playback_prebuffer=\${(PLAYBACK_PREBUFFER_S * 1000).toFixed(0)} ms\\n\`);
          
          diagRef.current.isActiveTurn = false;
          diagRef.current.turn += 1;
          diagRef.current.speechStart = null;
          diagRef.current.speechEnd = null;
          diagRef.current.firstAudioReceived = null;
          diagRef.current.firstAudioScheduled = null;
        }`;
code = code.replace(playStartRegex, playStartReplacement);

fs.writeFileSync('src/hooks/useGeminiLive.js', code);
console.log('Telemetry injected.');
