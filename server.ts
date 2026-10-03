import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '20mb' }));

const port = Number(process.env.PORT) || 3000;

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

function getAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: getApiKey(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to parse and humanize Gemini API errors, especially 429 quota exhaustion
function parseGeminiError(error: any): { isQuota: boolean; message: string; code: number } {
  let rawMsg = '';
  let status = error?.status;
  let code = error?.code || 500;

  if (typeof error === 'string') {
    rawMsg = error;
  } else if (error?.message) {
    rawMsg = error.message;
  } else {
    try {
      rawMsg = JSON.stringify(error);
    } catch {
      rawMsg = String(error);
    }
  }

  // Check if rawMsg is JSON representation
  if (rawMsg.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.error) {
        if (parsed.error.code) code = parsed.error.code;
        if (parsed.error.status) status = parsed.error.status;
        if (parsed.error.message) rawMsg = parsed.error.message;
      }
    } catch {
      // not valid json
    }
  }

  const isQuota =
    code === 429 ||
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    rawMsg.includes('429') ||
    rawMsg.includes('quota') ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.includes('rate-limits');

  let cleanMessage = rawMsg;
  if (isQuota) {
    cleanMessage =
      'Veo 3 Quota Limit Reached (429 Resource Exhausted): Veo video synthesis requires a paid API key with Google Cloud billing enabled. You can select your paid API key or use Flight Simulation mode to preview this flight without consuming quota.';
  }

  return { isQuota, message: cleanMessage, code: isQuota ? 429 : code };
}

// In-memory registry for flight simulation operations (quota-free mode)
interface SimulatedOperation {
  id: string;
  createdAt: number;
  durationMs: number;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  terrainType: string;
  prompt: string;
}
const simulatedOperations = new Map<string, SimulatedOperation>();

// Sample showcase videos for realistic flight simulation
const SIMULATION_VIDEOS: Record<string, string> = {
  '9:16': 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-crashing-on-a-rocky-coast-42858-large.mp4',
  canyon: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-flight-over-desert-canyon-at-sunset-41712-large.mp4',
  default: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-snow-covered-mountain-peaks-32867-large.mp4',
};

// Check system status
app.get('/api/status', (req, res) => {
  const key = getApiKey();
  res.json({
    status: 'ok',
    hasApiKey: Boolean(key && key !== 'MY_GEMINI_API_KEY'),
    veoModel: 'veo-3.1-lite-generate-preview',
    directorModel: 'gemini-3.8-flash',
    supportsSimulation: true,
  });
});

// Enhance text prompt with Gemini 3.8 Flash for aerial cinematics
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { basePrompt, location, flightStyle, altitude, lighting, speed } = req.body;
    const key = getApiKey();
    
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const systemInstruction = 
      'You are AfterMap 300 cinematic flight director and cartographer. Transform aerial flight coordinates, terrain, and camera instructions into a vivid, photorealistic prompt for Google Veo 3 video generation. Focus on continuous fluid camera movement, atmospheric depth, realistic scale, elevation changes, cinematic lens choices (e.g. 24mm anamorphic, ND filter motion blur), and lighting dynamics. Output ONLY the enhanced prompt string without explanations or quotes.';

    const userMessage = `Location: ${location || 'Custom coordinates'}
User intent: ${basePrompt || 'High-altitude aerial flythrough'}
Flight trajectory: ${flightStyle || 'FPV smooth glide'}
Altitude: ${altitude || 'Medium altitude 250m'}
Lighting & Atmosphere: ${lighting || 'Cinematic golden hour'}
Speed: ${speed || 'Cruising velocity'}

Create the optimal Veo 3 cinematic video prompt:`;

    let enhanced = '';
    try {
      const response = await getAIClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });
      enhanced = response.text?.trim() || '';
    } catch (genError: any) {
      const { message, isQuota } = parseGeminiError(genError);
      console.warn(`[Gemini Director] Prompt enhancement fallback (${isQuota ? 'Quota' : 'Error'}):`, message);
      // High-grade fallback cinematic prompt
      enhanced = `Epic ${flightStyle || 'FPV cinematic flythrough'} across ${location || 'terrain'}. ${basePrompt || 'Dramatic aerial camera glide'}, captured with 24mm anamorphic lens, ${lighting || 'golden hour rim light'}, atmospheric depth with mist and cloud layers, ultra-fluid 60fps motion vector, photorealistic 1080p aerial cinematography.`;
    }

    res.json({ enhancedPrompt: enhanced || basePrompt });
  } catch (error: any) {
    const { message } = parseGeminiError(error);
    console.error('Error enhancing prompt:', message);
    res.status(500).json({ error: message || 'Failed to enhance prompt' });
  }
});

// Step 1: Start Veo 3 video generation (POST /api/generate-video)
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, aspectRatio, resolution, simulate, terrainType } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Required aspect ratio constraint: 16:9 (landscape) or 9:16 (portrait)
    const validAspectRatio: '16:9' | '9:16' = aspectRatio === '9:16' ? '9:16' : '16:9';
    const validResolution: '720p' | '1080p' = resolution === '720p' ? '720p' : '1080p';

    // If simulated generation is explicitly requested:
    if (simulate) {
      const simId = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      simulatedOperations.set(simId, {
        id: simId,
        createdAt: Date.now(),
        durationMs: 7000, // 7 seconds realistic synthesis simulation
        aspectRatio: validAspectRatio,
        resolution: validResolution,
        terrainType: terrainType || 'metropolis',
        prompt,
      });
      console.log(`[Veo 3 Simulator] Created flight simulation operation: ${simId}`);
      return res.json({
        operationName: simId,
        isSimulation: true,
        aspectRatio: validAspectRatio,
        resolution: validResolution,
        message: 'Flight Neural Simulator active (Quota-Free). Synthesizing 1080p master flight...',
      });
    }

    const key = getApiKey();
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets or run in Flight Simulator mode.',
      });
    }

    console.log(`[Veo 3] Triggering video generation with model 'veo-3.1-lite-generate-preview'...`);
    console.log(`[Veo 3] Aspect: ${validAspectRatio}, Res: ${validResolution}`);

    let operation;
    try {
      operation = await getAIClient().models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: validResolution,
          aspectRatio: validAspectRatio,
        },
      });
    } catch (modelErr: any) {
      if (modelErr?.message?.includes('not found') || modelErr?.status === 404) {
        console.log(`[Veo 3] Falling back to 'veo-3.1-generate-preview'...`);
        operation = await getAIClient().models.generateVideos({
          model: 'veo-3.1-generate-preview',
          prompt: prompt,
          config: {
            numberOfVideos: 1,
            resolution: validResolution,
            aspectRatio: validAspectRatio,
          },
        });
      } else {
        throw modelErr;
      }
    }

    console.log(`[Veo 3] Operation created: ${operation.name}`);
    res.json({
      operationName: operation.name,
      aspectRatio: validAspectRatio,
      resolution: validResolution,
    });
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.error('[Veo 3] Generation error:', parsed.message);

    if (parsed.isQuota) {
      return res.status(429).json({
        error: parsed.message,
        isQuotaExhausted: true,
        code: 429,
        allowSimulation: true,
      });
    }

    res.status(500).json({ error: parsed.message });
  }
});

// Step 2: Poll operation status (POST /api/video-status)
app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    // Handle simulated operations
    if (operationName.startsWith('sim-')) {
      const sim = simulatedOperations.get(operationName);
      if (!sim) {
        return res.status(404).json({ error: 'Simulation flight operation not found' });
      }
      const elapsed = Date.now() - sim.createdAt;
      const isDone = elapsed >= sim.durationMs;
      return res.json({
        done: isDone,
        isSimulation: true,
        metadata: {
          state: isDone ? 'SUCCEEDED' : 'PROCESSING',
        },
      });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await getAIClient().operations.getVideosOperation({ operation: op });

    if (updated.error) {
      const parsed = parseGeminiError(updated.error);
      return res.status(parsed.isQuota ? 429 : 400).json({
        done: true,
        error: parsed.message,
        isQuotaExhausted: parsed.isQuota,
        allowSimulation: parsed.isQuota,
      });
    }

    res.json({
      done: Boolean(updated.done),
      metadata: updated.metadata || null,
    });
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.error('[Veo 3] Status poll error:', parsed.message);
    res.status(parsed.isQuota ? 429 : 500).json({
      error: parsed.message,
      isQuotaExhausted: parsed.isQuota,
      allowSimulation: parsed.isQuota,
    });
  }
});

// Step 3: Fetch generated video stream/buffer (POST /api/video-download)
app.post('/api/video-download', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    // Handle simulated operations
    if (operationName.startsWith('sim-')) {
      const sim = simulatedOperations.get(operationName);
      let filename = 'aerial-alpine.mp4';
      if (sim?.aspectRatio === '9:16') {
        filename = 'aerial-coastal.mp4';
      } else if (sim?.terrainType === 'canyon' || sim?.terrainType === 'desert') {
        filename = 'aerial-canyon.mp4';
      } else if (sim?.terrainType === 'metropolis') {
        filename = 'aerial-shibuya.mp4';
      }

      const filePath = path.resolve(__dirname, 'public/samples', filename);
      console.log(`[Veo 3 Simulator] Streaming local flight simulation from ${filePath}...`);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', stat.size.toString());
        res.setHeader('Content-Disposition', 'inline; filename="aftermap300_simulated.mp4"');
        const readStream = fs.createReadStream(filePath);
        return readStream.pipe(res);
      } else {
        return res.status(404).json({ error: 'Sample flight simulation file not found on disk' });
      }
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await getAIClient().operations.getVideosOperation({ operation: op });

    if (!updated.done) {
      return res.status(400).json({ error: 'Video is still processing. Please poll until done.' });
    }

    if (updated.error) {
      const parsed = parseGeminiError(updated.error);
      return res.status(parsed.isQuota ? 429 : 400).json({ error: parsed.message });
    }

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'No video download URI found on completed operation.' });
    }

    console.log(`[Veo 3] Fetching video from URI for ${operationName}...`);
    const key = getApiKey();
    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': key,
      },
    });

    if (!videoRes.ok) {
      const errText = await videoRes.text();
      console.error(`[Veo 3] Video URI fetch failed with status ${videoRes.status}:`, errText);
      return res.status(videoRes.status).json({ error: `Failed to fetch video: ${errText}` });
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Content-Disposition', 'inline; filename="aftermap300_veo.mp4"');
    res.send(buffer);
  } catch (error: any) {
    const parsed = parseGeminiError(error);
    console.error('[Veo 3] Download error:', parsed.message);
    res.status(parsed.isQuota ? 429 : 500).json({ error: parsed.message });
  }
});

// Mount Vite or serve static dist
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AfterMap 300 Studio Server active on port ${port}`);
  });
}

startServer();
