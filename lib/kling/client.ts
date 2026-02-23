/**
 * Kling AI API Client
 * 
 * Documentation: https://app.klingai.com/global/dev/document-api
 * 
 * This client handles:
 * - JWT authentication
 * - Image-to-video generation
 * - Task status polling
 */

import crypto from 'crypto';

// API Configuration
const API_BASE_URL = 'https://api.klingai.com';
const API_VERSION = 'v1';

// Get credentials from environment
function getCredentials() {
    const accessKeyId = process.env.KLING_ACCESS_KEY_ID;
    const accessKeySecret = process.env.KLING_ACCESS_KEY_SECRET;

    if (!accessKeyId || !accessKeySecret) {
        throw new Error(
            'Kling AI credentials not configured. ' +
            'Please set KLING_ACCESS_KEY_ID and KLING_ACCESS_KEY_SECRET in your .env.local file. ' +
            'Get these from: https://app.klingai.com/global/dev/document-api'
        );
    }

    return { accessKeyId, accessKeySecret };
}

/**
 * Generate JWT token for Kling AI API authentication
 */
function generateJWT(): string {
    const { accessKeyId, accessKeySecret } = getCredentials();

    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: accessKeyId,
        exp: now + 1800, // Token expires in 30 minutes
        nbf: now - 5      // Not valid before 5 seconds ago (clock skew)
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signatureInput = `${base64Header}.${base64Payload}`;
    const signature = crypto
        .createHmac('sha256', accessKeySecret)
        .update(signatureInput)
        .digest('base64url');

    return `${signatureInput}.${signature}`;
}

/**
 * Make authenticated API request
 */
async function apiRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: object
): Promise<any> {
    const token = generateJWT();
    const url = `${API_BASE_URL}/${API_VERSION}${endpoint}`;

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    console.log(`Kling API request: ${method} ${url}`);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        console.error('Kling API error:', data);
        throw new Error(`Kling API error: ${data.message || response.statusText}`);
    }

    return data;
}

export interface ImageToVideoOptions {
    /** Base64 encoded image or URL */
    image: string;
    /** Type of image input */
    imageType?: 'base64' | 'url';
    /** Motion prompt describing desired video effect */
    prompt?: string;
    /** Video duration in seconds (5 or 10) */
    duration?: 5 | 10;
    /** Quality mode */
    mode?: 'std' | 'pro';
    /** Aspect ratio */
    aspectRatio?: '16:9' | '9:16' | '1:1';
    /** Model version */
    model?: 'kling-v1-6' | 'kling-v2-1' | 'kling-v2-5-turbo';
    /** Negative prompt - what to avoid */
    negativePrompt?: string;
    /** CFG scale (1-10) */
    cfgScale?: number;
}

export interface TaskStatus {
    taskId: string;
    status: 'submitted' | 'processing' | 'succeed' | 'failed';
    progress?: number;
    videoUrl?: string;
    message?: string;
}

/**
 * Submit an image-to-video generation task
 */
export async function createImageToVideoTask(
    options: ImageToVideoOptions
): Promise<string> {
    const {
        image,
        imageType = 'base64',
        prompt = 'Smooth product showcase with subtle motion',
        duration = 5,
        mode = 'std',
        aspectRatio = '9:16',
        model = 'kling-v2-5-turbo',
        negativePrompt = 'blurry, low quality, distorted',
        cfgScale = 0.5
    } = options;

    const body: any = {
        model_name: model,
        mode,
        duration: String(duration),
        aspect_ratio: aspectRatio,
        prompt,
        negative_prompt: negativePrompt,
        cfg_scale: cfgScale
    };

    // Add image based on type
    if (imageType === 'url') {
        body.image_url = image;
    } else {
        body.image = image; // Base64 data
    }

    const response = await apiRequest('/videos/image2video', 'POST', body);

    if (!response.data?.task_id) {
        throw new Error('Failed to create video task: No task ID returned');
    }

    console.log('Kling video task created:', response.data.task_id);
    return response.data.task_id;
}

/**
 * Get the status of a video generation task
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await apiRequest(`/videos/image2video/${taskId}`);

    const data = response.data;

    const result: TaskStatus = {
        taskId,
        status: data.task_status || 'processing'
    };

    if (data.task_status_msg) {
        result.message = data.task_status_msg;
    }

    // Check for completed video
    if (data.task_status === 'succeed' && data.task_result?.videos?.[0]) {
        result.videoUrl = data.task_result.videos[0].url;
    }

    return result;
}

/**
 * Wait for a video generation task to complete
 * Polls the API until the task succeeds or fails
 */
export async function waitForTaskCompletion(
    taskId: string,
    options: {
        pollIntervalMs?: number;
        maxWaitMs?: number;
        onProgress?: (status: TaskStatus) => void;
    } = {}
): Promise<TaskStatus> {
    const {
        pollIntervalMs = 5000,
        maxWaitMs = 300000, // 5 minutes max
        onProgress
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        const status = await getTaskStatus(taskId);

        if (onProgress) {
            onProgress(status);
        }

        console.log(`Task ${taskId} status: ${status.status}`);

        if (status.status === 'succeed') {
            return status;
        }

        if (status.status === 'failed') {
            throw new Error(`Video generation failed: ${status.message || 'Unknown error'}`);
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Video generation timed out after ${maxWaitMs / 1000} seconds`);
}

/**
 * Generate a video from an image (convenience function)
 * Submits the task and waits for completion
 */
export async function generateVideoFromImage(
    options: ImageToVideoOptions
): Promise<string> {
    // Submit the task
    const taskId = await createImageToVideoTask(options);

    // Wait for completion
    const result = await waitForTaskCompletion(taskId, {
        onProgress: (status) => {
            console.log(`Video generation progress: ${status.status}`);
        }
    });

    if (!result.videoUrl) {
        throw new Error('Video generation completed but no video URL returned');
    }

    return result.videoUrl;
}

/**
 * Download a video from URL to a local file
 */
export async function downloadVideo(
    videoUrl: string,
    outputPath: string
): Promise<void> {
    const fs = await import('fs/promises');

    console.log(`Downloading video from: ${videoUrl}`);

    const response = await fetch(videoUrl);

    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);

    console.log(`Video saved to: ${outputPath}`);
}

/**
 * Check if Kling AI is configured
 */
export function isConfigured(): boolean {
    return !!(
        process.env.KLING_ACCESS_KEY_ID &&
        process.env.KLING_ACCESS_KEY_SECRET
    );
}
