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

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
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

    if (!imgFolder) return;

    // Helper function to convert data URL to Blob
    const dataURLtoBlob = (dataURL: string): Blob => {
      const arr = dataURL.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    };

    // Helper function to fetch blob from URL with CORS handling
    const fetchImageBlob = async (url: string): Promise<Blob | null> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.blob();
      } catch (e) {
        console.error('Fetch failed, trying no-cors fallback:', e);
        // For CORS issues, we can't really fetch the blob directly
        // But we can try creating an image element and using canvas
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/png');
            } else {
              resolve(null);
            }
          };
          img.onerror = () => {
            console.error('Image load failed for URL:', url);
            resolve(null);
          };
          img.src = url;
        });
      }
    };

    const promises = completedProducts.map(async (product) => {
      if (!product.imageUrl) return;

      try {
        let blob: Blob | null = null;
        const filename = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.png';

        // Check if it's a data URL
        if (product.imageUrl.startsWith('data:')) {
          blob = dataURLtoBlob(product.imageUrl);
        } else {
          // It's a regular URL, fetch it
          blob = await fetchImageBlob(product.imageUrl);
        }

        if (blob && blob.size > 0) {
          imgFolder.file(filename, blob);
        } else {
          console.error(`Empty or null blob for ${product.name}`);
        }
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
                  onDeleteProduct={deleteProduct}
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
