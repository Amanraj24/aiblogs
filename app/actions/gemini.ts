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
