/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useEffect } from 'react';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage } from './services/geminiService';
import Header from './components/Header';
import StartScreen from './components/StartScreen';
import EditorView from './components/EditorView';
import ErrorToast from './components/ErrorToast';
import SettingsModal from './components/SettingsModal';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load API key from localStorage on initial render
  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('gemini-api-key', newKey);
  };

  const currentImage = history[historyIndex] ?? null;

  // Clear error message after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const addImageToHistory = useCallback((newImageFile: File, clearActionState: () => void) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    clearActionState(); // Reset state for the action that was just performed
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
  }, []);

  const handleAction = useCallback(async (
    action: (apiKey: string, image: File, prompt: string) => Promise<string>,
    image: File,
    prompt: string,
    clearActionState: () => void
  ) => {
    if (!apiKey) {
      setError("API Key not set. Please add your Gemini API Key in the settings.");
      setIsSettingsOpen(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resultUrl = await action(apiKey, image, prompt);
      const newImageFile = dataURLtoFile(resultUrl, `result-${Date.now()}.png`);
      addImageToHistory(newImageFile, clearActionState);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [addImageToHistory, apiKey]);

  const handleGenerate = useCallback(async (prompt: string, hotspot: {x: number, y: number}, clearActionState: () => void) => {
      if (!currentImage) return;
      if (!apiKey) {
        setError("API Key not set. Please add your Gemini API Key in the settings.");
        setIsSettingsOpen(true);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
          const editedImageUrl = await generateEditedImage(apiKey, currentImage, prompt, hotspot);
          const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
          addImageToHistory(newImageFile, clearActionState);
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(`Failed to generate the image. ${errorMessage}`);
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  }, [currentImage, addImageToHistory, apiKey]);

  const handleApplyFilter = useCallback((prompt: string, clearActionState: () => void) => {
    if (!currentImage) return;
    handleAction(generateFilteredImage, currentImage, prompt, clearActionState);
  }, [currentImage, handleAction]);
  
  const handleApplyAdjustment = useCallback((prompt: string, clearActionState: () => void) => {
    if (!currentImage) return;
    handleAction(generateAdjustedImage, currentImage, prompt, clearActionState);
  }, [currentImage, handleAction]);
  
  const handleApplyCrop = useCallback((croppedImageUrl: string, clearActionState: () => void) => {
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile, clearActionState);
  }, [addImageToHistory]);

  const handleApplyManualAdjustments = useCallback((adjustedImageUrl: string, clearActionState: () => void) => {
    const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
    addImageToHistory(newImageFile, clearActionState);
  }, [addImageToHistory]);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history.length]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
  }, []);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  return (
    <div className="min-h-screen text-gray-800 flex flex-col bg-gray-50">
      <Header 
        onUploadNew={handleUploadNew} 
        showActions={!!currentImage}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className={`flex-grow w-full max-w-screen-2xl mx-auto p-4 md:p-8 flex justify-center ${currentImage ? 'items-stretch' : 'items-center'}`}>
        {!currentImage ? (
          <StartScreen onFileSelect={(files) => files && files[0] && handleImageUpload(files[0])} />
        ) : (
          <EditorView
            history={history}
            historyIndex={historyIndex}
            isLoading={isLoading}
            onGenerate={handleGenerate}
            onApplyFilter={handleApplyFilter}
            onApplyAdjustment={handleApplyAdjustment}
            onApplyCrop={handleApplyCrop}
            onApplyManualAdjustments={handleApplyManualAdjustments}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            onDownload={handleDownload}
            onError={setError}
          />
        )}
      </main>
      <ErrorToast message={error} onDismiss={() => setError(null)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveApiKey}
        currentApiKey={apiKey}
      />
    </div>
  );
};

export default App;