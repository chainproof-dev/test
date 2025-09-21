/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

export interface StickerElement {
  id: number;
  src: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // pixels
}

interface StickerPanelProps {
  stickerElements: StickerElement[];
  setStickerElements: React.Dispatch<React.SetStateAction<StickerElement[]>>;
  onApply: () => void;
  isLoading: boolean;
  activeStickerId: number | null;
  setActiveStickerId: (id: number | null) => void;
}

const defaultStickers = [
  'https://www.gstatic.com/gemini/demos/pixlab/sunglasses-sticker.png',
  'https://www.gstatic.com/gemini/demos/pixlab/party-hat-sticker.png',
  'https://www.gstatic.com/gemini/demos/pixlab/heart-sticker.png',
  'https://www.gstatic.com/gemini/demos/pixlab/star-sticker.png',
  'https://www.gstatic.com/gemini/demos/pixlab/crown-sticker.png',
  'https://www.gstatic.com/gemini/demos/pixlab/mustache-sticker.png',
];


const StickerPanel: React.FC<StickerPanelProps> = ({ 
  stickerElements, 
  setStickerElements, 
  onApply, 
  isLoading,
  activeStickerId,
  setActiveStickerId
}) => {

  const addSticker = (src: string) => {
    const newSticker: StickerElement = {
      id: Date.now(),
      src,
      x: 40,
      y: 40,
      width: 100,
    };
    setStickerElements(prev => [...prev, newSticker]);
    setActiveStickerId(newSticker.id);
  };
  
  const removeActiveSticker = () => {
    if (!activeStickerId) return;
    setStickerElements(prev => prev.filter(s => s.id !== activeStickerId));
    setActiveStickerId(null);
  };

  const hasChanges = stickerElements.length > 0;

  return (
    <div className="w-full bg-white rounded-lg flex flex-col gap-4 animate-fade-in p-6">
      <h3 className="text-lg font-semibold text-gray-700">Stickers</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {defaultStickers.map(src => (
          <button
            key={src}
            onClick={() => addSticker(src)}
            disabled={isLoading}
            className="bg-gray-100 rounded-md p-2 flex items-center justify-center aspect-square hover:bg-gray-200 transition-colors active:scale-95 disabled:opacity-50"
          >
            <img src={src} alt="sticker" className="w-full h-full object-contain" />
          </button>
        ))}
      </div>

      {activeStickerId && (
          <button onClick={removeActiveSticker} className="text-center text-red-600 text-sm font-semibold hover:bg-red-50 p-2 rounded-md transition-colors">
            Delete Selected Sticker
          </button>
      )}

      <div className="pt-2">
        <button
            onClick={onApply}
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !hasChanges}
        >
            Apply Stickers
        </button>
      </div>
    </div>
  );
};

export default StickerPanel;
