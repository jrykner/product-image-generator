"use client";

import { useState } from 'react';
import { Settings, Download, RefreshCw, Plus, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/SettingsModal';
import { FileUploader } from '@/components/FileUploader';
import { ProductTable } from '@/components/ProductTable';
import { ManualGenerator } from '@/components/ManualGenerator';
import { Product } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { generatePrompt, generateImage } from '@/lib/ai-service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'batch' | 'manual'>('batch');
  const [products, setProducts] = useState<Product[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const { settings } = useSettings();

  const handleDataLoaded = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleGeneratePrompts = async () => {
    if (products.length === 0) return;
    setIsGeneratingPrompts(true);

    // Process sequentially or in small batches to avoid rate limits
    // For simplicity, we'll do one by one but could be parallelized
    for (const product of products) {
      if (product.generatedPrompt) continue; // Skip if already has prompt

      updateProduct(product.id, { status: 'generating_prompt' });
      try {
        const prompt = await generatePrompt(product.name, settings);
        updateProduct(product.id, { generatedPrompt: prompt, status: 'ready_for_image' });
      } catch (e: any) {
        updateProduct(product.id, { status: 'error', error: e.message });
      }
    }
    setIsGeneratingPrompts(false);
  };

  const handleGenerateImages = async () => {
    const productsToGenerate = products.filter(p => p.generatedPrompt && !p.imageUrl);
    if (productsToGenerate.length === 0) return;

    setIsGeneratingImages(true);

    for (const product of productsToGenerate) {
      updateProduct(product.id, { status: 'generating_image' });
      try {
        const imageUrl = await generateImage(product.generatedPrompt, settings);
        updateProduct(product.id, { imageUrl, status: 'completed' });
      } catch (e: any) {
        updateProduct(product.id, { status: 'error', error: e.message });
      }
    }
    setIsGeneratingImages(false);
  };

  const handleDownloadAll = async () => {
    const completedProducts = products.filter(p => p.imageUrl);
    if (completedProducts.length === 0) return;

    const zip = new JSZip();
    const imgFolder = zip.folder("images");

    // We need to fetch the images to blob to zip them
    // Note: This might hit CORS issues if the image URL doesn't allow it.
    // OpenAI URLs usually expire and might have CORS.
    // We'll try to fetch.

    const promises = completedProducts.map(async (product) => {
      if (!product.imageUrl || !imgFolder) return;
      try {
        const response = await fetch(product.imageUrl);
        const blob = await response.blob();
        // Clean filename
        const filename = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.png';
        imgFolder.file(filename, blob);
      } catch (e) {
        console.error(`Failed to download image for ${product.name}`, e);
      }
    });

    await Promise.all(promises);

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "product-images.zip");
  };

  const handleExportData = () => {
    if (products.length === 0) return;

    // Prepare data for export
    const exportData = products.map(p => ({
      ...p.originalData,
      'Generated Prompt': p.generatedPrompt,
      'Image Status': p.status,
      'Image URL': p.imageUrl || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "products_with_prompts.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Product Image Generator</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('batch')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${activeTab === 'batch'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Batch Generation
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Manual Mode
            </button>
          </nav>
        </div>

        {activeTab === 'batch' ? (
          <div className="space-y-8">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-gray-900">1. Upload Products</h2>
              <FileUploader onDataLoaded={handleDataLoaded} />
            </div>

            {products.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">2. Generate & Review</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleExportData}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    {products.some(p => p.imageUrl) && (
                      <Button variant="outline" onClick={handleDownloadAll}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Images
                      </Button>
                    )}
                  </div>
                </div>
                <ProductTable
                  products={products}
                  onUpdateProduct={updateProduct}
                  onGeneratePrompts={handleGeneratePrompts}
                  onGenerateImages={handleGenerateImages}
                  isGeneratingPrompts={isGeneratingPrompts}
                  isGeneratingImages={isGeneratingImages}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <ManualGenerator />
          </div>
        )}
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
