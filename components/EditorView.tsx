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
import TextPanel, { TextElement } from './TextPanel';
import StickerPanel, { StickerElement } from './StickerPanel';
import { UndoIcon, RedoIcon, MagicWandIcon, PaletteIcon, SunIcon, CropIcon, SparkleIcon, TextIcon, EmojiHappyIcon } from './icons';


type Tool = 'retouch' | 'crop' | 'adjust' | 'filters' | 'ai-enhance' | 'text' | 'stickers';

const tools: { id: Tool; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'retouch', name: 'Retouch', icon: MagicWandIcon },
    { id: 'crop', name: 'Crop', icon: CropIcon },
    { id: 'adjust', name: 'Adjust', icon: SunIcon },
    { id: 'filters', name: 'Filters', icon: PaletteIcon },
    { id: 'ai-enhance', name: 'AI Enhance', icon: SparkleIcon },
    { id: 'text', name: 'Text', icon: TextIcon },
    { id: 'stickers', name: 'Stickers', icon: EmojiHappyIcon },
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
    onApplyCompositedImage: (compositedImageUrl: string, clearState: () => void) => void;
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
    onApplyCompositedImage,
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
  
  // Crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const imgCropRef = useRef<HTMLImageElement>(null);

  // Manual Adjustments state
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);

  // Text and Sticker Overlay states
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [stickerElements, setStickerElements] = useState<StickerElement[]>([]);
  const [activeElement, setActiveElement] = useState<{type: 'text' | 'sticker', id: number} | null>(null);
  const [dragging, setDragging] = useState<{type: 'text' | 'sticker', id: number, offsetX: number, offsetY: number} | null>(null);

  // Refs and Image state
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const currentImage = history[historyIndex];
  const originalImage = history[0];
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const clearTransientState = useCallback(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setTextElements([]);
    setStickerElements([]);
    setActiveElement(null);
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
    if (!currentImageUrl) return;
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

  const handleApplyOverlays = useCallback(() => {
    if (textElements.length === 0 && stickerElements.length === 0) return;
    if (!currentImageUrl) return;
  
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      // Draw base image
      ctx.drawImage(image, 0, 0);
  
      // Load all sticker images
      const stickerImages = await Promise.all(stickerElements.map(sticker => 
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = sticker.src;
        })
      ));

      const baseImgRef = imageRef.current;
      if (!baseImgRef) return;
      const scale = canvas.width / baseImgRef.clientWidth;

      // Draw stickers
      stickerElements.forEach((sticker, index) => {
        const stickerImg = stickerImages[index];
        const x = (sticker.x / 100) * canvas.width;
        const y = (sticker.y / 100) * canvas.height;
        const width = sticker.width * scale;
        const height = width * (stickerImg.naturalHeight / stickerImg.naturalWidth);
        ctx.drawImage(stickerImg, x, y, width, height);
      });
  
      // Draw text
      textElements.forEach(text => {
        const x = (text.x / 100) * canvas.width;
        const y = (text.y / 100) * canvas.height;
        const fontSize = text.fontSize * scale;
        ctx.font = `${text.italic ? 'italic' : ''} ${text.bold ? 'bold' : 'normal'} ${fontSize}px ${text.fontFamily}`;
        ctx.fillStyle = text.color;
        ctx.textBaseline = 'top';
        ctx.fillText(text.text, x, y);
      });
  
      onApplyCompositedImage(canvas.toDataURL('image/png'), clearTransientState);
    };
    image.src = currentImageUrl;
  }, [currentImageUrl, textElements, stickerElements, onApplyCompositedImage, clearTransientState]);

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
  
  // Drag and Drop handlers for overlays
  const handleDragStart = (e: React.MouseEvent, type: 'text' | 'sticker', id: number) => {
    e.preventDefault();
    setActiveElement({ type, id });
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = canvasContainerRef.current?.getBoundingClientRect();
    if (!parentRect) return;
    setDragging({
      type,
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const parentRect = canvasContainerRef.current?.getBoundingClientRect();
    if (!parentRect) return;

    const x = e.clientX - parentRect.left - dragging.offsetX;
    const y = e.clientY - parentRect.top - dragging.offsetY;
    const xPercent = (x / parentRect.width) * 100;
    const yPercent = (y / parentRect.height) * 100;

    if (dragging.type === 'text') {
      setTextElements(prev => prev.map(el => el.id === dragging.id ? { ...el, x: xPercent, y: yPercent } : el));
    } else {
      setStickerElements(prev => prev.map(el => el.id === dragging.id ? { ...el, x: xPercent, y: yPercent } : el));
    }
  };

  const handleDragEnd = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(null);
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
            return <AIAdjustPanel onApplyAdjustment={(p) => onApplyAdjustment(p, clearTransientState)} isLoading={isLoading} />;
        case 'filters':
            return <FilterPanel onApplyFilter={(p) => onApplyFilter(p, clearTransientState)} isLoading={isLoading} />;
        case 'text':
            return <TextPanel
                        textElements={textElements}
                        setTextElements={setTextElements}
                        activeTextId={activeElement?.type === 'text' ? activeElement.id : null}
                        setActiveTextId={(id) => setActiveElement(id === null ? null : {type: 'text', id})}
                        onApply={handleApplyOverlays}
                        isLoading={isLoading}
                    />;
        case 'stickers':
            return <StickerPanel
                        stickerElements={stickerElements}
                        setStickerElements={setStickerElements}
                        onApply={handleApplyOverlays}
                        isLoading={isLoading}
                        activeStickerId={activeElement?.type === 'sticker' ? activeElement.id : null}
                        setActiveStickerId={(id) => setActiveElement(id === null ? null : {type: 'sticker', id})}
                    />;
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
            <div 
              className="flex-grow flex items-center justify-center bg-gray-200/50 rounded-lg overflow-hidden h-full"
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                            <Spinner />
                            <p className="text-gray-600 font-medium">AI is working its magic...</p>
                        </div>
                    )}
                    
                    <div ref={canvasContainerRef} className="relative max-w-full max-h-full w-full h-full flex items-center justify-center" onClick={() => setActiveElement(null)}>
                        {activeTool === 'retouch' ? (
                            currentImageUrl && <img ref={imageRef} src={currentImageUrl} alt="Current" onClick={handleImageClick} style={{...imageFilterStyle, objectFit: 'contain' }} className={`max-w-full max-h-[75vh] object-contain block cursor-crosshair`} />
                        ) : activeTool === 'crop' ? (
                            currentImageUrl && (
                                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect}>
                                    <img ref={imgCropRef} src={currentImageUrl} alt="Crop this" className="max-w-full max-h-[75vh] object-contain block" />
                                </ReactCrop>
                            )
                        ) : (
                            originalImageUrl && currentImageUrl && (
                                <ReactCompareSlider
                                    itemOne={<ReactCompareSliderImage ref={imageRef} src={originalImageUrl} alt="Original" style={{ filter: 'none', objectFit: 'contain' }}/>}
                                    itemTwo={<ReactCompareSliderImage src={currentImageUrl} alt="Current" style={{...imageFilterStyle, objectFit: 'contain' }} />}
                                    className="max-w-full max-h-[75vh] object-contain block"
                                />
                            )
                        )}
                        
                        {displayHotspot && !isLoading && activeTool === 'retouch' && (
                            <div className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg" style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}>
                                <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-blue-400"></div>
                            </div>
                        )}

                        {/* Overlays */}
                        {stickerElements.map(sticker => (
                          <div
                            key={sticker.id}
                            className={`absolute cursor-grab active:cursor-grabbing transition-all duration-75 ${activeElement?.type === 'sticker' && activeElement.id === sticker.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                            style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, width: `${sticker.width}px` }}
                            onMouseDown={e => {e.stopPropagation(); handleDragStart(e, 'sticker', sticker.id)}}
                          >
                            <img src={sticker.src} alt="sticker" className="w-full h-auto pointer-events-none" />
                          </div>
                        ))}

                        {textElements.map(text => (
                          <div
                            key={text.id}
                            className={`absolute cursor-grab active:cursor-grabbing whitespace-nowrap p-1 transition-all duration-75 ${activeElement?.type === 'text' && activeElement.id === text.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                            style={{
                              left: `${text.x}%`,
                              top: `${text.y}%`,
                              fontFamily: text.fontFamily,
                              fontSize: `${text.fontSize}px`,
                              color: text.color,
                              fontWeight: text.bold ? 'bold' : 'normal',
                              fontStyle: text.italic ? 'italic' : 'normal'
                            }}
                            onMouseDown={e => {e.stopPropagation(); handleDragStart(e, 'text', text.id)}}
                          >
                            {text.text}
                          </div>
                        ))}
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
            <button onClick={onUndo} disabled={!canUndo || isLoading} className="flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Undo last action"><UndoIcon className="w-5 h-5 mr-2" />Undo</button>
            <button onClick={onRedo} disabled={!canRedo || isLoading} className="flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Redo last action"><RedoIcon className="w-5 h-5 mr-2" />Redo</button>
            <button onClick={onReset} disabled={!canUndo || isLoading} className="flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed">Reset</button>
            <div className="flex-grow"></div>
            <button onClick={onDownload} disabled={isLoading} className="bg-green-600 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed">Download Image</button>
        </div>
      </div>
  );
};

export default EditorView;
