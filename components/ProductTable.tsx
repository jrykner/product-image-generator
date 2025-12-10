"use client";

import { useState } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Image as ImageIcon, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface ProductTableProps {
    products: Product[];
    onUpdateProduct: (id: string, updates: Partial<Product>) => void;
    onDeleteProduct: (id: string) => void;
    onGeneratePrompts: () => void;
    onGenerateImages: () => void;
    isGeneratingPrompts: boolean;
    isGeneratingImages: boolean;
}

export function ProductTable({
    products,
    onUpdateProduct,
    onDeleteProduct,
    onGeneratePrompts,
    onGenerateImages,
    isGeneratingPrompts,
    isGeneratingImages
}: ProductTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    if (products.length === 0) return null;

    return (
        <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                    Products ({products.length})
                </h2>
                <div className="flex space-x-3">
                    <Button
                        variant="secondary"
                        onClick={onGeneratePrompts}
                        disabled={isGeneratingPrompts || isGeneratingImages}
                    >
                        {isGeneratingPrompts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Prompts
                    </Button>
                    <Button
                        onClick={onGenerateImages}
                        disabled={isGeneratingPrompts || isGeneratingImages}
                    >
                        {isGeneratingImages && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Images
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Product Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Generated Prompt
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Image
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <Input
                                            value={product.generatedPrompt}
                                            onChange={(e) => onUpdateProduct(product.id, { generatedPrompt: e.target.value })}
                                            placeholder="No prompt generated yet..."
                                            className="min-w-[300px]"
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <StatusBadge status={product.status} error={product.error} />
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {product.imageUrl ? (
                                            <div className="relative h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-300">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <button
                                            onClick={() => onDeleteProduct(product.id)}
                                            className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            title="Remove product"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, error }: { status: Product['status']; error?: string }) {
    switch (status) {
        case 'idle':
            return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Idle</span>;
        case 'generating_prompt':
            return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Prompting...</span>;
        case 'ready_for_image':
            return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Ready</span>;
        case 'generating_image':
            return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Generating...</span>;
        case 'completed':
            return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Done</span>;
        case 'error':
            return (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800" title={error}>
                    Error
                </span>
            );
        default:
            return null;
    }
}
