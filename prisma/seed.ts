/**
 * Prisma Seed Script
 * Seeds RunPod endpoints and base models for development/production
 *
 * IMPORTANT: RunPod endpoint IDs are internal and never exposed to consumers.
 * Consumers only interact with TarsModel slugs. The engine maps internally.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ============================================
  // RUNPOD ENDPOINTS (Real IDs - DO NOT EXPOSE)
  // ============================================

  console.log('📡 Creating RunPod endpoints...');

  // SDXL Image Generation
  const sdxlEndpoint = await prisma.runpodEndpoint.upsert({
    where: { runpodEndpointId: 'qr7wla851k3zrz' },
    update: { isActive: true },
    create: {
      runpodEndpointId: 'qr7wla851k3zrz',
      name: 'Stable Diffusion XL',
      source: 'HUB',
      dockerImage: 'runpod/stable-diffusion:sdxl',
      gpuType: 'A40',
      isActive: true,
    },
  });

  // Chatterbox TTS (Text to Speech)
  const chatterboxEndpoint = await prisma.runpodEndpoint.upsert({
    where: { runpodEndpointId: '9ib1e8vvtjxrwh' },
    update: { isActive: true },
    create: {
      runpodEndpointId: '9ib1e8vvtjxrwh',
      name: 'Chatterbox TTS',
      source: 'HUB',
      dockerImage: 'runpod/chatterbox-tts:latest',
      gpuType: 'T4',
      isActive: true,
    },
  });

  // Faster Whisper (Speech to Text)
  const whisperEndpoint = await prisma.runpodEndpoint.upsert({
    where: { runpodEndpointId: '352hhvj1y6v8f6' },
    update: { isActive: true },
    create: {
      runpodEndpointId: '352hhvj1y6v8f6',
      name: 'Faster Whisper',
      source: 'HUB',
      dockerImage: 'runpod/faster-whisper:large-v3',
      gpuType: 'T4',
      isActive: true,
    },
  });

  console.log(`  ✓ Created 3 active RunPod endpoints`);

  // ============================================
  // BASE MODELS
  // ============================================

  console.log('🧠 Creating base models...');

  // SDXL Text-to-Image
  await prisma.baseModel.upsert({
    where: { slug: 'sdxl-text-to-image' },
    update: {},
    create: {
      endpointId: sdxlEndpoint.id,
      slug: 'sdxl-text-to-image',
      name: 'SDXL Text to Image',
      description:
        'Generate high-quality 1024x1024 images from text prompts using Stable Diffusion XL.',
      category: 'IMAGE',
      inputSchema: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            title: 'Prompt',
            description: 'Text description of the image to generate',
            minLength: 1,
            maxLength: 2000,
          },
          negative_prompt: {
            type: 'string',
            title: 'Negative Prompt',
            description: 'What to avoid in the generated image',
            maxLength: 1000,
          },
          width: {
            type: 'integer',
            title: 'Width',
            description: 'Image width in pixels',
            default: 1024,
            enum: [512, 768, 1024],
          },
          height: {
            type: 'integer',
            title: 'Height',
            description: 'Image height in pixels',
            default: 1024,
            enum: [512, 768, 1024],
          },
          num_inference_steps: {
            type: 'integer',
            title: 'Steps',
            description: 'Number of denoising steps',
            default: 30,
            minimum: 10,
            maximum: 50,
          },
          guidance_scale: {
            type: 'number',
            title: 'Guidance Scale',
            description: 'How closely to follow the prompt',
            default: 7.5,
            minimum: 1,
            maximum: 20,
          },
          seed: {
            type: 'integer',
            title: 'Seed',
            description: 'Random seed for reproducibility (-1 for random)',
            default: -1,
          },
        },
      },
      outputType: 'IMAGE',
      outputFormat: 'png',
      estimatedSeconds: 15,
      isActive: true,
    },
  });

  // SDXL Image-to-Image
  await prisma.baseModel.upsert({
    where: { slug: 'sdxl-image-to-image' },
    update: {},
    create: {
      endpointId: sdxlEndpoint.id,
      slug: 'sdxl-image-to-image',
      name: 'SDXL Image to Image',
      description:
        'Transform existing images using text prompts with Stable Diffusion XL.',
      category: 'IMAGE',
      inputSchema: {
        type: 'object',
        required: ['prompt', 'image'],
        properties: {
          prompt: {
            type: 'string',
            title: 'Prompt',
            description: 'Text description of the transformation',
            minLength: 1,
            maxLength: 2000,
          },
          image: {
            type: 'string',
            format: 'uri',
            title: 'Input Image',
            description: 'URL or base64 of the source image',
          },
          strength: {
            type: 'number',
            title: 'Strength',
            description: 'How much to transform the image (0-1)',
            default: 0.75,
            minimum: 0.1,
            maximum: 1,
          },
          negative_prompt: {
            type: 'string',
            title: 'Negative Prompt',
            description: 'What to avoid in the output',
            maxLength: 1000,
          },
          num_inference_steps: {
            type: 'integer',
            title: 'Steps',
            default: 30,
            minimum: 10,
            maximum: 50,
          },
          guidance_scale: {
            type: 'number',
            title: 'Guidance Scale',
            default: 7.5,
            minimum: 1,
            maximum: 20,
          },
        },
      },
      outputType: 'IMAGE',
      outputFormat: 'png',
      estimatedSeconds: 18,
      isActive: true,
    },
  });

  // Whisper Transcription (Speech to Text)
  await prisma.baseModel.upsert({
    where: { slug: 'whisper-transcribe' },
    update: {},
    create: {
      endpointId: whisperEndpoint.id,
      slug: 'whisper-transcribe',
      name: 'Faster Whisper Transcription',
      description:
        'Transcribe audio files to text using Faster Whisper Large V3. Supports 100+ languages.',
      category: 'AUDIO',
      inputSchema: {
        type: 'object',
        required: ['audio'],
        properties: {
          audio: {
            type: 'string',
            format: 'uri',
            title: 'Audio File',
            description: 'URL to the audio file (mp3, wav, m4a, flac)',
          },
          language: {
            type: 'string',
            title: 'Language',
            description: 'Language code (auto-detect if not specified)',
            enum: [
              'auto',
              'en',
              'es',
              'fr',
              'de',
              'it',
              'pt',
              'zh',
              'ja',
              'ko',
            ],
            default: 'auto',
          },
          task: {
            type: 'string',
            title: 'Task',
            description: 'Transcribe or translate to English',
            enum: ['transcribe', 'translate'],
            default: 'transcribe',
          },
          word_timestamps: {
            type: 'boolean',
            title: 'Word Timestamps',
            description: 'Include word-level timestamps',
            default: false,
          },
        },
      },
      outputType: 'JSON',
      outputFormat: 'json',
      estimatedSeconds: 30,
      isActive: true,
    },
  });

  // Chatterbox Text to Speech
  await prisma.baseModel.upsert({
    where: { slug: 'chatterbox-tts' },
    update: {},
    create: {
      endpointId: chatterboxEndpoint.id,
      slug: 'chatterbox-tts',
      name: 'Chatterbox Text to Speech',
      description:
        'Convert text to natural-sounding speech with Chatterbox TTS. High-quality voice synthesis.',
      category: 'AUDIO',
      inputSchema: {
        type: 'object',
        required: ['text'],
        properties: {
          text: {
            type: 'string',
            title: 'Text',
            description: 'The text to convert to speech',
            minLength: 1,
            maxLength: 5000,
          },
          voice: {
            type: 'string',
            title: 'Voice',
            description: 'Voice style to use',
            enum: ['default', 'male', 'female', 'neutral'],
            default: 'default',
          },
          speed: {
            type: 'number',
            title: 'Speed',
            description: 'Speech speed multiplier (0.5-2.0)',
            default: 1.0,
            minimum: 0.5,
            maximum: 2.0,
          },
        },
      },
      outputType: 'AUDIO',
      outputFormat: 'mp3',
      estimatedSeconds: 10,
      isActive: true,
    },
  });

  console.log(`  ✓ Created 4 base models`);

  // ============================================
  // SUMMARY
  // ============================================

  const endpointCount = await prisma.runpodEndpoint.count({
    where: { isActive: true },
  });
  const baseModelCount = await prisma.baseModel.count({
    where: { isActive: true },
  });

  console.log('\n✅ Seed completed!');
  console.log(`   📡 Active RunPod Endpoints: ${endpointCount}`);
  console.log(`   🧠 Active Base Models: ${baseModelCount}`);
  console.log(
    '\n⚠️  REMINDER: RunPod endpoint IDs are internal. Never expose to frontend.'
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
