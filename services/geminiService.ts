import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { BlogPost, GeneratedTopic, TrainingModule } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry helper function with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for 503 Service Unavailable, 429 Too Many Requests, or specific error messages
    const status = error?.status || error?.response?.status || error?.code;
    const isTransient = status === 503 || status === 429 || error?.message?.includes('overloaded');

    if (retries === 0 || !isTransient) {
      throw error;
    }

    console.log(`API Busy/Overloaded. Retrying in ${delay}ms... (Attempts left: ${retries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

// Helper to generate topics based on a niche
export const generateTopics = async (niche: string, trainingContext?: string, count: number = 3): Promise<GeneratedTopic[]> => {
  const modelId = "gemini-2.0-flash";

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: "A catchy, SEO-friendly blog post title" },
        relevance: { type: Type.STRING, description: "Brief explanation of why this is trending or relevant" },
        content: { type: Type.STRING, description: "Full blog post in Markdown" },
        excerpt: { type: Type.STRING, description: "Short summary under 160 characters" },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5-7 keywords" },
        category: { type: Type.STRING },
        readTime: { type: Type.STRING },
        geoTargeting: { type: Type.STRING },
        aeoQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ["question", "answer"]
          },
          minItems: 4 as any,
          maxItems: 6 as any
        },
        seoScore: { type: Type.NUMBER },
        coverImage: { type: Type.STRING, description: "A descriptive prompt for generating a relevant cover image for this topic." }
      },
      required: ["topic", "relevance", "content", "excerpt", "keywords", "category", "readTime", "geoTargeting", "aeoQuestions", "seoScore", "coverImage"]
    }
  };

  const contextPrompt = trainingContext ? `\n\n[USER TRAINING/STYLE GUIDE]:\n${trainingContext}\n\nApply the above style/context to the topic suggestions.` : "";

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: `Generate ${count} varied, high-impact, and click-worthy complete blog posts for the niche: "${niche}". ${contextPrompt}
      For each post, provide the full content, title, excerpt, and SEO/AEO metadata.
      Ensure a mix of content types.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    }));

    const text = response.text;
    if (!text) return [];
    const topics = JSON.parse(text) as GeneratedTopic[];

    // Add actual cover images to each topic
    return topics.map(topic => ({
      ...topic,
      // Use Picsum with a random seed based on topic length + random number to get variety but some stability
      coverImage: `https://picsum.photos/seed/${encodeURIComponent(topic.topic).substring(0, 10)}${Math.floor(Math.random() * 1000)}/800/400`
    }));
  } catch (error) {
    console.error("Error generating topics:", error);
    throw new Error("Failed to generate topics. Please check your API key or try again later.");
  }
};

// Helper to generate the full blog post
export const generateFullPost = async (topic: string, tone: string, trainingContext?: string): Promise<Partial<BlogPost>> => {
  const modelId = "gemini-2.0-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      content: { type: Type.STRING, description: "The full blog article in Markdown format. Use headers, bullet points, and clear paragraphs." },
      excerpt: { type: Type.STRING, description: "A short, engaging summary (meta description) under 160 characters." },
      keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5-7 relevant tags/keywords for the post." },
      category: { type: Type.STRING, description: "A general category for this post." },
      readTime: { type: Type.STRING, description: "Estimated read time, e.g., '5 min read'" },

      // New Fields for Geo/SEO/AEO
      geoTargeting: { type: Type.STRING, description: "The primary geographic target (e.g., 'Global', 'USA')." },
      aeoQuestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ["question", "answer"],
        },
        minItems: 4 as any,
        maxItems: 6 as any,
        description: "Strictly generate between 4 to 6 'People Also Ask' style Q&A pairs. EVERY question MUST have a detailed 'answer'. Do NOT include these in the main content body."
      },
      seoScore: { type: Type.NUMBER, description: "SEO score (0-100)." }
    },
    required: ["title", "content", "excerpt", "keywords", "category", "readTime", "geoTargeting", "aeoQuestions", "seoScore"]
  };

  const contextPrompt = trainingContext ? `\n\n[USER TRAINING/STYLE GUIDE]:\n${trainingContext}\n\nSTRICTLY ADHERE to the above style guide, facts, and rules in the content generation.` : "";

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: `You are an expert content writer. Write a complete, high-quality blog post about "${topic}". ${contextPrompt}
      
      Requirements:
      1. **Content**: Comprehensive, engaging, and well-structured. **DO NOT include an H1 title**. Use H2 and H3 for headings. **DO NOT include the FAQ or "People Also Ask" section in this marked-down content**; providing it in the JSON aeoQuestions is sufficient.
      2. **Tags**: Generate 5-7 relevant keywords/tags.
      3. **People Also Ask**: Generate 4-6 conversational Q&A pairs for the "People Also Ask" section. **MUST include both "question" and "answer" keys for EVERY item.** DO NOT leave the answer empty.
      4. **Geo**: Target ${tone.includes('UK') ? 'UK' : 'Global/US'} audience unless specified otherwise.
      5. **Tone**: ${tone}.
      
      Ensure the JSON output is valid and complete.
      
      Example of expected FAQ structure:
      "aeoQuestions": [
        { "question": "What is X?", "answer": "X is Y." },
        { "question": "How does Z work?", "answer": "Z works by..." }
      ]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
      },
    }));

    const text = response.text;
    if (!text) throw new Error("No content generated");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating post:", error);
    throw new Error("Failed to generate blog post. The AI model is currently overloaded. Please try again in a few moments.");
  }
};

// Helper to generate a cover image
export const generateCoverImage = async (topic: string): Promise<string> => {
  // Fallback to high-quality Unsplash image for stability since flash model doesn't support image generation
  // Use Picsum for reliability
  const randomSeed = Math.floor(Math.random() * 100000);
  return `https://picsum.photos/seed/${randomSeed}/800/400`;
};

// New helper to orchestrate the entire auto-posting flow
export const generateAndPublishAutoPost = async (niche: string): Promise<BlogPost> => {
  // 1. Identify Topics
  const topics = await generateTopics(niche);
  if (!topics || topics.length === 0) {
    throw new Error("Failed to auto-generate topics");
  }

  // Pick a random topic from the suggestions
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  // 2. Generate Content
  const content = await generateFullPost(randomTopic.topic, "Professional & Engaging");

  // 3. Generate Image
  let coverImage;
  try {
    coverImage = await generateCoverImage(randomTopic.topic);
  } catch (e) {
    console.warn("Auto-post image generation failed, using placeholder");
    coverImage = `https://picsum.photos/800/400?random=${Date.now()}`;
  }

  // 4. Return complete post
  return {
    id: Date.now().toString(),
    title: content.title || randomTopic.topic,
    content: content.content || "",
    excerpt: content.excerpt || "",
    keywords: content.keywords || [],
    category: content.category || "Auto-Generated",
    readTime: content.readTime || "3 min read",
    // CHANGED: Include time in the date string
    dateCreated: new Date().toLocaleString(),
    status: 'published',
    geoTargeting: content.geoTargeting || "Global",
    aeoQuestions: content.aeoQuestions || [],
    seoScore: content.seoScore || 85,
    coverImage
  };
};

// New helper for Managerial Training Hub
export const generateTrainingModule = async (topic: string): Promise<Partial<TrainingModule>> => {
  const modelId = "gemini-2.0-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 bullet points on what the manager will learn." },
      keyConcepts: { type: Type.STRING, description: "A few paragraphs explaining the core ideas and principles." },
      caseStudy: { type: Type.STRING, description: "A short, practical scenario demonstrating the topic, including a problem and a successful resolution." },
      actionableTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 concrete, actionable steps the manager can implement immediately." },
    },
    required: ["topic", "learningObjectives", "keyConcepts", "caseStudy", "actionableTakeaways"]
  };

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: `Generate a concise, high-impact training module for managers on the topic of "${topic}". The tone should be professional, clear, and highly practical.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.6,
      },
    }));

    const text = response.text;
    if (!text) throw new Error("No content generated for training module");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating training module:", error);
    throw new Error("Failed to generate training module. The AI model might be busy. Please try again.");
  }
};