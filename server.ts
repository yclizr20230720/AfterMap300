import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '20mb' }));

const port = Number(process.env.PORT) || 3000;
const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Check system status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    veoModel: 'veo-3.1-fast-generate-preview',
    directorModel: 'gemini-3.8-flash',
  });
});

// Enhance text prompt with Gemini 3.8 Flash for aerial cinematics
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { basePrompt, location, flightStyle, altitude, lighting, speed } = req.body;
    
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
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
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });
      enhanced = response.text?.trim() || '';
    } catch (genError: any) {
      console.warn('Gemini 3.8 Flash prompt enhancement temporary spike, applying director optics:', genError.message);
      // High-grade fallback cinematic prompt
      enhanced = `Epic ${flightStyle || 'FPV cinematic flythrough'} across ${location || 'terrain'}. ${basePrompt || 'Dramatic aerial camera glide'}, captured with 24mm anamorphic lens, ${lighting || 'golden hour rim light'}, atmospheric depth with mist and cloud layers, ultra-fluid 60fps motion vector, photorealistic 1080p aerial cinematography.`;
    }

    res.json({ enhancedPrompt: enhanced || basePrompt });
  } catch (error: any) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ error: error.message || 'Failed to enhance prompt' });
  }
});

// Step 1: Start Veo 3 video generation (POST /api/generate-video)
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, aspectRatio, resolution } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets.',
      });
    }

    // Required aspect ratio constraint: 16:9 (landscape) or 9:16 (portrait)
    const validAspectRatio: '16:9' | '9:16' = aspectRatio === '9:16' ? '9:16' : '16:9';
    const validResolution: '720p' | '1080p' = resolution === '720p' ? '720p' : '1080p';

    console.log(`[Veo 3] Triggering video generation with model 'veo-3.1-fast-generate-preview'...`);
    console.log(`[Veo 3] Aspect: ${validAspectRatio}, Res: ${validResolution}`);

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: validResolution,
        aspectRatio: validAspectRatio,
      },
    });

    console.log(`[Veo 3] Operation created: ${operation.name}`);
    res.json({
      operationName: operation.name,
      aspectRatio: validAspectRatio,
      resolution: validResolution,
    });
  } catch (error: any) {
    console.error('[Veo 3] Generation start error:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate video generation' });
  }
});

// Step 2: Poll operation status (POST /api/video-status)
app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    if (updated.error) {
      return res.status(400).json({
        done: true,
        error: updated.error.message || 'Video generation failed in backend.',
      });
    }

    res.json({
      done: Boolean(updated.done),
      metadata: updated.metadata || null,
    });
  } catch (error: any) {
    console.error('[Veo 3] Status poll error:', error);
    res.status(500).json({ error: error.message || 'Failed to poll video status' });
  }
});

// Step 3: Fetch generated video stream/buffer (POST /api/video-download)
app.post('/api/video-download', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    if (!updated.done) {
      return res.status(400).json({ error: 'Video is still processing. Please poll until done.' });
    }

    if (updated.error) {
      return res.status(400).json({ error: updated.error.message || 'Operation failed' });
    }

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'No video download URI found on completed operation.' });
    }

    console.log(`[Veo 3] Fetching video from URI for ${operationName}...`);
    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': apiKey!,
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
    console.error('[Veo 3] Download error:', error);
    res.status(500).json({ error: error.message || 'Failed to download generated video' });
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
