/**
 * Prisma Seed Script
 * Seeds RunPod endpoints and base models for development
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ============================================
  // RUNPOD ENDPOINTS
  // ============================================

  console.log('📡 Creating RunPod endpoints...');

  const sdxlEndpoint = await prisma.runpodEndpoint.upsert({
    where: { runpodEndpointId: 'sdxl-endpoint-001' },
    update: {},
    create: {
      runpodEndpointId: 'sdxl-endpoint-001',
      name: 'Stable Diffusion XL',
      source: 'HUB',
      dockerImage: 'runpod/stable-diffusion-xl:latest',
      gpuType: 'A100',
      isActive: true,
    },
  });

  const whisperEndpoint = await prisma.runpodEndpoint.upsert({
    where: { runpodEndpointId: 'whisper-endpoint-001' },
    update: {},
    create: {
      runpodEndpointId: 'whisper-endpoint-001',
      name: 'Whisper Large V3',
      source: 'HUB',
      dockerImage: 'runpod/whisper-large-v3:latest',
      gpuType: 'T4',
      isActive: true,
    },
  });

  const llamaEndpoint = await prisma.runpodEndpoint.upsert({
    where: { runpodEndpointId: 'llama-endpoint-001' },
    update: {},
    create: {
      runpodEndpointId: 'llama-endpoint-001',
      name: 'Llama 3.1 70B',
      source: 'HUB',
      dockerImage: 'runpod/llama-3.1-70b:latest',
      gpuType: 'A100',
      isActive: true,
    },
  });

  const fluxEndpoint = await prisma.runpodEndpoint.upsert({
    where: { runpodEndpointId: 'flux-endpoint-001' },
    update: {},
    create: {
      runpodEndpointId: 'flux-endpoint-001',
      name: 'FLUX.1 Schnell',
      source: 'HUB',
      dockerImage: 'runpod/flux-schnell:latest',
      gpuType: 'L4',
      isActive: true,
    },
  });

  const musicGenEndpoint = await prisma.runpodEndpoint.upsert({
    where: { runpodEndpointId: 'musicgen-endpoint-001' },
    update: {},
    create: {
      runpodEndpointId: 'musicgen-endpoint-001',
      name: 'MusicGen Large',
      source: 'HUB',
      dockerImage: 'runpod/musicgen-large:latest',
      gpuType: 'T4',
      isActive: true,
    },
  });

  console.log(`  ✓ Created ${5} RunPod endpoints`);

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

  // FLUX Text-to-Image (fast)
  await prisma.baseModel.upsert({
    where: { slug: 'flux-schnell' },
    update: {},
    create: {
      endpointId: fluxEndpoint.id,
      slug: 'flux-schnell',
      name: 'FLUX.1 Schnell',
      description:
        'Ultra-fast image generation with FLUX. Generates images in 1-4 steps.',
      category: 'IMAGE',
      inputSchema: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            title: 'Prompt',
            description: 'Text description of the image',
            minLength: 1,
            maxLength: 2000,
          },
          width: {
            type: 'integer',
            title: 'Width',
            default: 1024,
            enum: [512, 768, 1024, 1280],
          },
          height: {
            type: 'integer',
            title: 'Height',
            default: 1024,
            enum: [512, 768, 1024, 1280],
          },
          num_inference_steps: {
            type: 'integer',
            title: 'Steps',
            description: 'FLUX recommends 1-4 steps',
            default: 4,
            minimum: 1,
            maximum: 8,
          },
          seed: {
            type: 'integer',
            title: 'Seed',
            default: -1,
          },
        },
      },
      outputType: 'IMAGE',
      outputFormat: 'png',
      estimatedSeconds: 5,
      isActive: true,
    },
  });

  // Whisper Transcription
  await prisma.baseModel.upsert({
    where: { slug: 'whisper-transcribe' },
    update: {},
    create: {
      endpointId: whisperEndpoint.id,
      slug: 'whisper-transcribe',
      name: 'Whisper Transcription',
      description:
        'Transcribe audio files to text using OpenAI Whisper Large V3.',
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

  // Llama Chat
  await prisma.baseModel.upsert({
    where: { slug: 'llama-chat' },
    update: {},
    create: {
      endpointId: llamaEndpoint.id,
      slug: 'llama-chat',
      name: 'Llama 3.1 Chat',
      description:
        'Advanced conversational AI using Meta Llama 3.1 70B Instruct.',
      category: 'TEXT',
      inputSchema: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            title: 'Prompt',
            description: 'Your message or question',
            minLength: 1,
            maxLength: 8000,
          },
          system_prompt: {
            type: 'string',
            title: 'System Prompt',
            description: 'Instructions for how the AI should behave',
            maxLength: 4000,
          },
          max_tokens: {
            type: 'integer',
            title: 'Max Tokens',
            description: 'Maximum length of response',
            default: 1024,
            minimum: 64,
            maximum: 4096,
          },
          temperature: {
            type: 'number',
            title: 'Temperature',
            description: 'Creativity level (0=focused, 1=creative)',
            default: 0.7,
            minimum: 0,
            maximum: 2,
          },
          top_p: {
            type: 'number',
            title: 'Top P',
            description: 'Nucleus sampling parameter',
            default: 0.9,
            minimum: 0,
            maximum: 1,
          },
        },
      },
      outputType: 'TEXT',
      outputFormat: 'text',
      estimatedSeconds: 20,
      isActive: true,
    },
  });

  // MusicGen
  await prisma.baseModel.upsert({
    where: { slug: 'musicgen-melody' },
    update: {},
    create: {
      endpointId: musicGenEndpoint.id,
      slug: 'musicgen-melody',
      name: 'MusicGen Melody',
      description: 'Generate music from text descriptions using Meta MusicGen.',
      category: 'AUDIO',
      inputSchema: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            title: 'Description',
            description: 'Describe the music you want to generate',
            minLength: 1,
            maxLength: 500,
          },
          melody: {
            type: 'string',
            format: 'uri',
            title: 'Melody Reference',
            description: 'Optional audio file to use as melody reference',
          },
          duration: {
            type: 'integer',
            title: 'Duration',
            description: 'Length in seconds',
            default: 8,
            minimum: 5,
            maximum: 30,
          },
          temperature: {
            type: 'number',
            title: 'Temperature',
            default: 1.0,
            minimum: 0.5,
            maximum: 1.5,
          },
          top_k: {
            type: 'integer',
            title: 'Top K',
            description: 'Sampling parameter',
            default: 250,
            minimum: 50,
            maximum: 500,
          },
        },
      },
      outputType: 'AUDIO',
      outputFormat: 'wav',
      estimatedSeconds: 45,
      isActive: true,
    },
  });

  console.log(`  ✓ Created ${6} base models`);

  // ============================================
  // SUMMARY
  // ============================================

  const endpointCount = await prisma.runpodEndpoint.count();
  const baseModelCount = await prisma.baseModel.count();

  console.log('\n✅ Seed completed!');
  console.log(`   📡 RunPod Endpoints: ${endpointCount}`);
  console.log(`   🧠 Base Models: ${baseModelCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
