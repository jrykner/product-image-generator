"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/useSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { settings, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);

    const handleSave = () => {
        updateSettings(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            OpenAI API Key
                        </label>
                        <Input
                            type="password"
                            placeholder="sk-..."
                            value={localSettings.openaiApiKey}
                            onChange={(e) =>
                                setLocalSettings({ ...localSettings, openaiApiKey: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Gemini API Key
                        </label>
                        <Input
                            type="password"
                            placeholder="AIza..."
                            value={localSettings.geminiApiKey}
                            onChange={(e) =>
                                setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Text Generation Model
                        </label>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="textModel"
                                    value="gemini"
                                    checked={localSettings.selectedModel === 'gemini'}
                                    onChange={() =>
                                        setLocalSettings({ ...localSettings, selectedModel: 'gemini' })
                                    }
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Gemini (2.5 Flash)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="textModel"
                                    value="openai"
                                    checked={localSettings.selectedModel === 'openai'}
                                    onChange={() =>
                                        setLocalSettings({ ...localSettings, selectedModel: 'openai' })
                                    }
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">OpenAI (GPT-4o)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Image Generation Model
                        </label>
                        <select
                            value={localSettings.imageModel || 'gemini-2.5-flash-image'}
                            onChange={(e) =>
                                setLocalSettings({ ...localSettings, imageModel: e.target.value as any })
                            }
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
                            <option value="dall-e-3">OpenAI DALL-E 3</option>
                            <option value="image1-low">Image1 Low</option>
                            <option value="image1-medium">Image1 Medium</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Settings</Button>
                </div>
            </div>
        </div>
    );
}
