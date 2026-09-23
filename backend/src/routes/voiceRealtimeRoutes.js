const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const User = require('../models/User');
const { GeminiRealtimeSession } = require('../services/aiRealtimeService');

function setupVoiceRealtime(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    try {
      const parsedUrl = url.parse(request.url, true);
      const pathname = parsedUrl.pathname;

      if (pathname === '/api/v1/voice/realtime') {
        const token = parsedUrl.query.token;

        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        const user = await User.findById(decoded.userId || decoded._id).select('-passwordHash');
        if (!user || user.status === 'suspended') {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request, user);
        });
      }
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request, user) => {
    const parsedUrl = url.parse(request.url, true);
    const language = parsedUrl.query.language || 'en-IN';
    const instruction = parsedUrl.query.instruction;
    const isReconnect = parsedUrl.query.isReconnect === 'true';

    const apiKey = process.env.GEMINI_API_KEY;
    const aiSession = new GeminiRealtimeSession(apiKey, language, instruction, isReconnect);

    aiSession.onMessage = (payload) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    };

    aiSession.onClose = (code, reason, isFatal) => {
      if (ws.readyState === ws.OPEN) {
        if (isFatal) {
          console.error(`Gemini fatal close (code ${code}): ${reason}. Reconnect should not be attempted.`);
          ws.send(JSON.stringify({
            event: 'provider_error',
            message: 'Gemini API key or endpoint configuration is invalid. Reconnect aborted.',
            fatal: true
          }));
        }
        // Only pass valid websocket close codes (1000, 1007-1011, 3000-4999). 1005 means no status received.
        let outCode = 1011; 
        if (code === 1000 || (code >= 3000 && code <= 4999) || code === 1008 || code === 1007) {
           outCode = code;
        }
        ws.close(outCode, reason || '');
      }
    };

    aiSession.connect(
      () => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ event: 'provider_ready' }));
        }
      },
      (error) => {
        console.error('Gemini connection error:', error);
        if (ws.readyState === ws.OPEN) {
          const isFatal = error?.isFatal === true;
          ws.send(JSON.stringify({ 
            event: 'provider_error', 
            message: isFatal 
              ? 'Gemini API key or endpoint configuration is invalid. Reconnect aborted.'
              : 'Realtime voice service is temporarily unavailable.',
            fatal: isFatal
          }));
          if (isFatal) {
            ws.close(1008, 'Fatal provider configuration error');
          }
        }
      }
    );

    ws.on('message', (message) => {
      try {
        const t1 = performance.now();
        const payload = message.toString();
        // Allow ping/pong or other control messages if needed
        const parsed = JSON.parse(payload);
        // Exclude UI-only events or route exactly what is needed
        aiSession.send(payload);
        const t2 = performance.now();
        if (payload.includes('"realtimeInput"')) {
          console.log(`[VOICE_LATENCY] backend_forwarding: ${(t2 - t1).toFixed(2)} ms`);
        }
      } catch (err) {
        console.warn('Invalid message from client:', err);
      }
    });

    ws.on('close', () => {
      aiSession.close();
    });

    ws.on('error', (err) => {
      console.error('Browser WebSocket error:', err);
      aiSession.close();
    });
  });

  return wss;
}

module.exports = { setupVoiceRealtime };
