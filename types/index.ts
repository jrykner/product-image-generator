export interface Product {
    id: string;
    originalData: Record<string, any>; // Keeps all original columns
    name: string; // The main identifier (e.g. Product Name)
    generatedPrompt: string;
    status: 'idle' | 'generating_prompt' | 'ready_for_image' | 'generating_image' | 'completed' | 'error';
    imageUrl?: string;
    error?: string;
}
