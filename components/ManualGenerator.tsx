"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Actually need Textarea probably, but Input is fine for now or I'll use native textarea
import { Loader2, Wand2, Image as ImageIcon } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { optimizePrompt, generateImage } from '@/lib/ai-service';

export function ManualGenerator() {
    const { settings } = useSettings();
    const [prompt, setPrompt] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleOptimize = async () => {
        if (!prompt) return;
        setIsOptimizing(true);
        setError(null);
        try {
            const optimized = await optimizePrompt(prompt, settings);
            setPrompt(optimized);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const url = await generateImage(prompt, settings);
            setGeneratedImage(url);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">Manual Generation</h2>
                <p className="text-sm text-gray-500">Create images from your own prompts.</p>
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Prompt</label>
                <div className="flex gap-2">
                    <textarea
                        className="min-h-[100px] w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Describe the image you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                <div className="flex justify-between">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleOptimize}
                        disabled={!prompt || isOptimizing || isGenerating}
                    >
                        {isOptimizing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wand2 className="mr-2 h-3 w-3" />}
                        Optimize Prompt
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={!prompt || isOptimizing || isGenerating}
                    >
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Image"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {generatedImage && (
                <div className="mt-4">
                    <h3 className="mb-2 text-sm font-medium text-gray-700">Result</h3>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <img src={generatedImage} alt="Generated" className="w-full object-cover" />
                    </div>
                    <div className="mt-2 text-right">
                        <a
                            href={generatedImage}
                            download={`generated-${Date.now()}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Download Image
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
