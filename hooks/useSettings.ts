"use client";

import { useState, useEffect } from 'react';

export interface Settings {
  openaiApiKey: string;
  geminiApiKey: string;
  selectedModel: 'openai' | 'gemini';
}

const DEFAULT_SETTINGS: Settings = {
  openaiApiKey: '',
  geminiApiKey: '',
  selectedModel: 'gemini',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem('product-image-gen-settings');
    if (storedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('product-image-gen-settings', JSON.stringify(updated));
  };

  return { settings, updateSettings, isLoaded };
}
