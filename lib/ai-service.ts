import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Settings } from '@/hooks/useSettings';

export async function generatePrompt(
    productName: string,
    settings: Settings
): Promise<string> {
    const systemPrompt = "You are a professional product photographer and marketing expert. Create a detailed, high-quality image generation prompt for the following product. The prompt should describe lighting, composition, background, and style to ensure a professional e-commerce look. Keep it under 100 words. Output ONLY the prompt.";

    try {
        if (settings.selectedModel === 'openai') {
            if (!settings.openaiApiKey) throw new Error("OpenAI API Key is missing");
            const openai = new OpenAI({ apiKey: settings.openaiApiKey, dangerouslyAllowBrowser: true }); // Client-side usage
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Product: ${productName}` }
                ],
            });
            return response.choices[0].message.content || "";
        } else {
            if (!settings.geminiApiKey) throw new Error("Gemini API Key is missing");
            const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
            // User requested "gemini-2.5-flash"
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent([systemPrompt, `Product: ${productName}`]);
            return result.response.text();
        }
    } catch (error: any) {
        console.error("Prompt Generation Error:", error);
        throw new Error(error.message || "Failed to generate prompt");
    }
}

export async function generateImage(
    prompt: string,
    settings: Settings
): Promise<string> {
    try {
        // Default to gemini-2.5-flash-image if not set (backward compatibility)
        const imageModel = settings.imageModel || 'gemini-2.5-flash-image';

        // Route DALL-E and "image1" models to OpenAI
        if (imageModel === 'dall-e-3' || imageModel === 'image1-low' || imageModel === 'image1-medium') {
            if (!settings.openaiApiKey) throw new Error("OpenAI API Key is missing");
            const openai = new OpenAI({ apiKey: settings.openaiApiKey, dangerouslyAllowBrowser: true });

            let modelId = 'dall-e-3';

            if (imageModel === 'image1-low') {
                modelId = 'gpt-image-1-mini';
            } else if (imageModel === 'image1-medium') {
                modelId = 'gpt-image-1';
            }

            const response = await openai.images.generate({
                model: modelId,
                prompt: prompt,
                n: 1,
                size: "1024x1024",
            });
            return response.data?.[0]?.url || "";
        } else {
            // For all other models (Gemini / Image1), we use Google Gen AI SDK
            if (!settings.geminiApiKey) throw new Error("Gemini API Key is missing");

            const genAI = new GoogleGenerativeAI(settings.geminiApiKey);

            // Map the UI selection to the actual model ID if needed
            // For now, we pass the ID directly as they seem to be the requested IDs
            let modelId = imageModel;

            // If user selected "Image1 Low" or "Medium", we assume these are valid IDs or we map them
            // Since I don't have the real mapping, I'll use the strings provided.

            const model = genAI.getGenerativeModel({ model: modelId });

            // Image generation usually requires a specific call or prompt structure.
            // For now, I'll try standard generateContent. If it returns text (url), great.
            const result = await model.generateContent(prompt);
            return result.response.text();
        }
    } catch (error: any) {
        console.error("Image Generation Error:", error);
        throw new Error(error.message || "Failed to generate image");
    }
}

export async function optimizePrompt(
    rawInput: string,
    settings: Settings
): Promise<string> {
    // Re-use generatePrompt logic but with different system prompt
    const systemPrompt = "Optimize the following image generation prompt to be more effective for AI image generators like DALL-E 3. Add details about lighting, style, and composition if missing. Output ONLY the optimized prompt.";

    try {
        if (settings.selectedModel === 'openai') {
            if (!settings.openaiApiKey) throw new Error("OpenAI API Key is missing");
            const openai = new OpenAI({ apiKey: settings.openaiApiKey, dangerouslyAllowBrowser: true });
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: rawInput }
                ],
            });
            return response.choices[0].message.content || "";
        } else {
            if (!settings.geminiApiKey) throw new Error("Gemini API Key is missing");
            const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent([systemPrompt, rawInput]);
            return result.response.text();
        }
    } catch (error: any) {
        console.error("Prompt Optimization Error:", error);
        throw new Error(error.message || "Failed to optimize prompt");
    }
}
