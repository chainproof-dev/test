/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import Spinner from './Spinner';
import FilterPanel from './FilterPanel';
import AdjustmentPanel, { Adjustments, defaultAdjustments } from './AdjustmentPanel';
import AIAdjustPanel from './AIAdjustPanel';
import CropPanel from './CropPanel';
import { UndoIcon, RedoIcon, MagicWandIcon, PaletteIcon, SunIcon, CropIcon, SparkleIcon } from './icons';

type Tool = 'retouch' | 'crop' | 'adjust' | 'filters' | 'ai-enhance';

const tools: { id: Tool; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'retouch', name: 'Retouch', icon: MagicWandIcon },
    { id: 'crop', name: 'Crop', icon: CropIcon },
    { id: 'adjust', name: 'Adjust', icon: SunIcon },
    { id: 'filters', name: 'Filters', icon: PaletteIcon },
    { id: 'ai-enhance', name: 'AI Enhance', icon: SparkleIcon },
];

interface EditorViewProps {
    history: File[];
    historyIndex: number;
    isLoading: boolean;
    onGenerate: (prompt: string, hotspot: { x: number, y: number }, clearState: () => void) => void;
    onApplyFilter: (prompt: string, clearState: () => void) => void;
    onApplyAdjustment: (prompt: string, clearState: () => void) => void;
    onApplyCrop: (croppedImageUrl: string, clearState: () => void) => void;
    onApplyManualAdjustments: (adjustedImageUrl: string, clearState: () => void) => void;
    onUndo: () => void;
    onRedo: () => void;
    onReset: () => void;
    onDownload: () => void;
    onError: (message: string) => void;
}

const EditorView: React.FC<EditorViewProps> = ({
    history,
    historyIndex,
    isLoading,
    onGenerate,
    onApplyFilter,
    onApplyAdjustment,
    onApplyCrop,
    onApplyManualAdjustments,
    onUndo,
    onRedo,
    onReset,
    onDownload,
    onError
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('retouch');
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);
  const imgCropRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex];
  const originalImage = history[0];

  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');

  useEffect(() => {
    let url = '';
    if (currentImage) {
      url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
    }
    return () => URL.revokeObjectURL(url);
  }, [currentImage]);
  
  useEffect(() => {
    let url = '';
    if (originalImage) {
      url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
    }
    return () => URL.revokeObjectURL(url);
  }, [originalImage]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const clearTransientState = useCallback(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setEditHotspot(null);
    setDisplayHotspot(null);
  }, []);

  useEffect(() => {
    clearTransientState();
    setAdjustments(defaultAdjustments);
  }, [historyIndex, clearTransientState]);

  const imageFilterStyle = {
    filter: `
        brightness(${adjustments.brightness}%)
        contrast(${adjustments.contrast}%)
        saturate(${adjustments.saturate}%)
        sepia(${adjustments.sepia}%)
        grayscale(${adjustments.grayscale}%)
    `
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
        onError('Please enter a description for your edit.');
        return;
    }
    if (!editHotspot) {
        onError('Please click on the image to select an area to edit.');
        return;
    }
    onGenerate(prompt, editHotspot, () => {
        clearTransientState();
        setPrompt('');
    });
  };

  const handleApplyCrop = () => {
    if (!completedCrop || !imgCropRef.current) {
        onError('Please select an area to crop.');
        return;
    }
    const image = imgCropRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        onError('Could not process the crop.');
        return;
    }
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      completedCrop.width, completedCrop.height
    );
    onApplyCrop(canvas.toDataURL('image/png'), clearTransientState);
  };

  const handleApplyManualAdjustments = () => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            onError('Could not process adjustments.');
            return;
        }
        ctx.filter = imageFilterStyle.filter;
        ctx.drawImage(image, 0, 0);
        onApplyManualAdjustments(canvas.toDataURL('image/png'), () => {
            setAdjustments(defaultAdjustments);
        });
    }
    image.src = currentImageUrl;
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTool !== 'retouch') return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDisplayHotspot({ x: offsetX, y: offsetY });
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;
    setEditHotspot({ x: Math.round(offsetX * scaleX), y: Math.round(offsetY * scaleY) });
  };

  const renderActiveToolPanel = () => {
    switch (activeTool) {
        case 'retouch':
            return (
                <div className="w-full bg-white rounded-lg flex flex-col items-center gap-4 animate-fade-in p-6">
                    <h3 className="text-lg font-semibold text-gray-700">Retouch Image</h3>
                    <p className="text-sm text-gray-500 -mt-2 text-center">
                        {editHotspot ? 'Great! Now describe your edit below.' : 'Click an area on the image to make a precise edit.'}
                    </p>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex flex-col items-center gap-3">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={editHotspot ? "e.g., 'change shirt to blue'" : "Click the image first"}
                            className="flex-grow bg-white border border-gray-300 text-gray-800 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isLoading || !editHotspot}
                        />
                        <button 
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isLoading || !prompt.trim() || !editHotspot}
                        >
                            Generate
                        </button>
                    </form>
                </div>
            );
        case 'crop':
            return <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} />;
        case 'adjust':
            return <AdjustmentPanel 
                onApplyManualAdjustments={handleApplyManualAdjustments}
                adjustments={adjustments}
                onAdjustmentChange={setAdjustments}
                onResetAdjustments={() => setAdjustments(defaultAdjustments)}
                isLoading={isLoading} 
            />;
        case 'ai-enhance':
            // FIX: Pass a new lambda function to onApplyAdjustment that correctly calls the onApplyAdjustment prop with two arguments.
            return <AIAdjustPanel onApplyAdjustment={(p) => onApplyAdjustment(p, clearTransientState)} isLoading={isLoading} />;
        case 'filters':
            // FIX: Pass a new lambda function to onApplyFilter that correctly calls the onApplyFilter prop with two arguments.
            return <FilterPanel onApplyFilter={(p) => onApplyFilter(p, clearTransientState)} isLoading={isLoading} />;
        default:
            return null;
    }
  }

  return (
      <div className="w-full h-full flex flex-col gap-4 animate-fade-in">
        {/* Main Editor Area */}
        <div className="flex-grow flex flex-row gap-4 items-start min-h-0">
            {/* Left Toolbar */}
            <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-1 p-2 bg-white rounded-lg shadow-md border border-gray-200">
                {tools.map(tool => {
                    const Icon = tool.icon;
                    return (
                        <button
                            key={tool.id}
                            role="tab"
                            aria-selected={activeTool === tool.id}
                            aria-controls={`${tool.id}-panel`}
                            onClick={() => setActiveTool(tool.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-md transition-all duration-200 w-20 h-20 group ${
                                activeTool === tool.id 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            <Icon className="w-7 h-7 mb-1" />
                            <span className="text-xs font-semibold">{tool.name}</span>
                        </button>
                    );
                })}
            </div>
            
            {/* Center Canvas */}
            <div className="flex-grow flex items-center justify-center bg-gray-200/50 rounded-lg overflow-hidden h-full">
                <div className="relative w-full h-full flex items-center justify-center">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                            <Spinner />
                            <p className="text-gray-600 font-medium">AI is working its magic...</p>
                        </div>
                    )}
                    
                    <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center">
                        {activeTool === 'crop' ? (
                            <ReactCrop 
                                crop={crop} 
                                onChange={c => setCrop(c)} 
                                onComplete={c => setCompletedCrop(c)}
                                aspect={aspect}
                            >
                                <img ref={imgCropRef} src={currentImageUrl} alt="Crop this image" className="max-w-full max-h-[75vh] object-contain block" />
                            </ReactCrop>
                        ) : (
                            <ReactCompareSlider
                                itemOne={
                                    <ReactCompareSliderImage 
                                        src={originalImageUrl} 
                                        alt="Original"
                                        style={{ filter: 'none', objectFit: 'contain' }}
                                    />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage
                                        src={currentImageUrl}
                                        alt="Current"
                                        onClick={handleImageClick}
                                        style={{...imageFilterStyle, objectFit: 'contain' }}
                                        className={`${activeTool === 'retouch' ? 'cursor-crosshair' : ''}`}
                                    />
                                }
                                className="max-w-full max-h-[75vh] object-contain block"
                            />
                        )}
                        
                        {displayHotspot && !isLoading && activeTool === 'retouch' && (
                            <div 
                                className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg"
                                style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                            >
                                <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-blue-400"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Options Panel */}
            <div className="w-80 flex-shrink-0">
                <div id={`${activeTool}-panel`} role="tabpanel">
                    {renderActiveToolPanel()}
                </div>
            </div>
        </div>
        
        {/* Bottom Action Bar */}
        <div className="flex-shrink-0 bg-white rounded-lg shadow-md border border-gray-200 p-3 flex flex-wrap items-center justify-center gap-2">
            <button 
                onClick={onUndo}
                disabled={!canUndo || isLoading}
                className="flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Undo last action"
            >
                <UndoIcon className="w-5 h-5 mr-2" />
                Undo
            </button>
            <button 
                onClick={onRedo}
                disabled={!canRedo || isLoading}
                className="flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Redo last action"
            >
                <RedoIcon className="w-5 h-5 mr-2" />
                Redo
            </button>

            <button 
                onClick={onReset}
                disabled={!canUndo || isLoading}
                className="flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Reset
            </button>
            
            <div className="flex-grow"></div>

            <button 
                onClick={onDownload}
                disabled={isLoading}
                className="bg-green-600 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
                Download Image
            </button>
        </div>
      </div>
  );
};

export default EditorView;