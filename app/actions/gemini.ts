'use server';

import { generateTopics as generateTopicsService, generateFullPost as generateFullPostService, generateCoverImage as generateCoverImageService, generateAndPublishAutoPost as generateAndPublishAutoPostService, generateTrainingModule as generateTrainingModuleService } from '@/lib/geminiService';
import { BlogPost, GeneratedTopic, TrainingModule } from '@/types';

export async function generateTopics(niche: string, trainingContext?: string, count: number = 3): Promise<GeneratedTopic[]> {
    try {
        return await generateTopicsService(niche, trainingContext, count);
    } catch (error) {
        console.error("Server Action Error (generateTopics):", error);
        throw new Error("Failed to generate topics.");
    }
}

export async function generateFullPost(topic: string, tone: string, trainingContext?: string): Promise<Partial<BlogPost>> {
    try {
        return await generateFullPostService(topic, tone, trainingContext);
    } catch (error) {
        console.error("Server Action Error (generateFullPost):", error);
        throw new Error("Failed to generate full post.");
    }
}

export async function generateCoverImage(topic: string): Promise<string> {
    try {
        return await generateCoverImageService(topic);
    } catch (error) {
        console.error("Server Action Error (generateCoverImage):", error);
        // Return a placeholder or empty string on error to avoid breaking UI
        return `https://picsum.photos/800/400?random=${Date.now()}`;
    }
}

/**
 * Generates an AI image and uploads it directly to remote storage from the server.
 * This bypasses CORS issues that occur when fetching AI images from the client.
 */
export async function generateAndStoreCoverImage(topic: string, isRawPrompt: boolean = false, customFilename?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const maxRetries = 2;
    let lastError = "";

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const imageUrl = await generateCoverImageService(topic, isRawPrompt);
            const apiKey = process.env.NEXT_PUBLIC_REMOTE_STORAGE_API_KEY;
            const apiUrl = process.env.NEXT_PUBLIC_REMOTE_STORAGE_API_URL;

            if (!apiKey || !apiUrl) {
                return { success: false, error: "Remote storage configuration missing" };
            }

            console.log(`[AI Image] Attempt ${i + 1}: Fetching from ${imageUrl}`);

            // 1. Fetch the image data on the server with a timeout and User-Agent
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(imageUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`AI Provider responded with ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            if (!arrayBuffer || arrayBuffer.byteLength < 1000) {
                throw new Error("Received invalid or too small image data");
            }

            const buffer = Buffer.from(arrayBuffer);

            // 2. Prepare for upload
            let filename = customFilename;
            if (!filename) {
                const slug = topic
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                    .substring(0, 50);
                const timestamp = Math.floor(Date.now() / 1000);
                filename = `${slug || 'ai-image'}-${timestamp}.jpg`;
            }

            const formData = new FormData();
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            formData.append('file', blob, filename);

            // 3. Upload to remote storage via API
            const uploadUrl = new URL(apiUrl);
            uploadUrl.searchParams.append('action', 'upload');
            uploadUrl.searchParams.append('api_key', apiKey);

            const uploadResponse = await fetch(uploadUrl.toString(), {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKey,
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Storage upload failed: ${uploadResponse.status} ${errorText}`);
            }

            const data = await uploadResponse.json();
            if (data.success) {
                return { success: true, url: data.url };
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (error: any) {
            console.error(`[AI Image] Attempt ${i + 1} failed:`, error.message);
            lastError = error.message;
            // Wait a bit before retry
            if (i < maxRetries) await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Ultimate Fallback: Use a reliable stock photo if AI truly fails
    try {
        console.log("[AI Image] Falling back to high-quality topic-based photo.");
        // Use a more dynamic fallback that's still relevant to the topic
        const keywords = topic.split(' ').slice(0, 3).join(',');
        const fallbackUrl = `https://loremflickr.com/800/400/${encodeURIComponent(keywords)}?lock=${Math.floor(Math.random() * 1000)}`;
        return {
            success: true,
            url: fallbackUrl,
            error: `AI generation failed (${lastError}), using relevant fallback.`
        };
    } catch (e) {
        return { success: false, error: lastError || "Failed to generate or store image" };
    }
}

export async function generateAndPublishAutoPost(niche: string): Promise<BlogPost> {
    try {
        return await generateAndPublishAutoPostService(niche);
    } catch (error) {
        console.error("Server Action Error (generateAndPublishAutoPost):", error);
        throw new Error("Failed to auto-publish post.");
    }
}

export async function generateTrainingModule(topic: string): Promise<Partial<TrainingModule>> {
    try {
        return await generateTrainingModuleService(topic);
    } catch (error) {
        console.error("Server Action Error (generateTrainingModule):", error);
        throw new Error("Failed to generate training module.");
    }
}
