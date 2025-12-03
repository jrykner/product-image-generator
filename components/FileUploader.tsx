"use client";

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onDataLoaded: (products: Product[]) => void;
}

export function FileUploader({ onDataLoaded }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const processData = (data: any[]) => {
        if (!data || data.length === 0) {
            setError("File appears to be empty.");
            return;
        }

        // Attempt to find a "Product Name" or "Name" or "Title" column, or just use the first column
        const headers = Object.keys(data[0]);
        const nameColumn = headers.find(h => /name|title|product/i.test(h)) || headers[0];

        if (!nameColumn) {
            setError("Could not identify a product name column.");
            return;
        }

        const products: Product[] = data.map((row, index) => ({
            id: `prod-${Date.now()}-${index}`,
            originalData: row,
            name: String(row[nameColumn] || ''),
            generatedPrompt: '',
            status: 'idle' as const,
        })).filter(p => p.name.trim() !== '');

        onDataLoaded(products);
    };

    const handleFile = async (file: File) => {
        setIsLoading(true);
        setError(null);

        try {
            if (file.name.endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        processData(results.data);
                        setIsLoading(false);
                    },
                    error: (err) => {
                        setError(`CSV Error: ${err.message}`);
                        setIsLoading(false);
                    }
                });
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet);
                processData(data);
                setIsLoading(false);
            } else {
                setError("Unsupported file type. Please upload .csv or .xlsx");
                setIsLoading(false);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to parse file.");
            setIsLoading(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, []);

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    return (
        <div className="w-full">
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50",
                    isLoading && "opacity-50 pointer-events-none"
                )}
            >
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-full bg-blue-100 p-3 text-blue-600">
                        <FileSpreadsheet className="h-8 w-8" />
                    </div>
                    <p className="mb-2 text-lg font-medium text-gray-900">
                        Drag & drop your product list here
                    </p>
                    <p className="mb-4 text-sm text-gray-500">
                        Supports .csv and .xlsx files
                    </p>
                    <label className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        <span>Browse Files</span>
                        <input
                            type="file"
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                            }}
                        />
                    </label>
                </div>
            </div>

            {error && (
                <div className="mt-4 flex items-center rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    );
}
