/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

export interface TextElement {
  id: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  x: number;
  y: number;
}

interface TextPanelProps {
  textElements: TextElement[];
  setTextElements: React.Dispatch<React.SetStateAction<TextElement[]>>;
  activeTextId: number | null;
  setActiveTextId: (id: number | null) => void;
  onApply: () => void;
  isLoading: boolean;
}

const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS'];

const TextPanel: React.FC<TextPanelProps> = ({
  textElements,
  setTextElements,
  activeTextId,
  setActiveTextId,
  onApply,
  isLoading
}) => {
  const activeText = textElements.find(t => t.id === activeTextId);

  const addText = () => {
    const newText: TextElement = {
      id: Date.now(),
      text: 'Hello World',
      fontFamily: 'Arial',
      fontSize: 48,
      color: '#000000',
      bold: false,
      italic: false,
      x: 40,
      y: 40,
    };
    setTextElements(prev => [...prev, newText]);
    setActiveTextId(newText.id);
  };
  
  const removeActiveText = () => {
    if (!activeTextId) return;
    setTextElements(prev => prev.filter(t => t.id !== activeTextId));
    setActiveTextId(null);
  };

  const updateActiveText = (key: keyof TextElement, value: any) => {
    if (!activeTextId) return;
    setTextElements(prev => prev.map(t =>
      t.id === activeTextId ? { ...t, [key]: value } : t
    ));
  };

  const hasChanges = textElements.length > 0;

  return (
    <div className="w-full bg-white rounded-lg flex flex-col gap-4 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">Text Tool</h3>
        <button
          onClick={addText}
          disabled={isLoading}
          className="text-sm bg-blue-100 text-blue-700 font-semibold py-1.5 px-3 rounded-md transition-all duration-200 ease-in-out hover:bg-blue-200 active:scale-95 disabled:opacity-50"
        >
          Add Text
        </button>
      </div>
      
      {!activeText && (
        <p className="text-sm text-center text-gray-500 py-4">
          {textElements.length > 0 ? 'Click on a text element on the image to edit it.' : 'Click "Add Text" to get started.'}
        </p>
      )}

      {activeText && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <textarea
            value={activeText.text}
            onChange={(e) => updateActiveText('text', e.target.value)}
            className="w-full bg-white border border-gray-300 text-gray-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-base"
            rows={2}
          />
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600">Font</label>
              <select
                value={activeText.fontFamily}
                onChange={(e) => updateActiveText('fontFamily', e.target.value)}
                className="w-full bg-gray-100 border-transparent text-gray-800 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
              >
                {fonts.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Color</label>
              <input
                type="color"
                value={activeText.color}
                onChange={(e) => updateActiveText('color', e.target.value)}
                className="w-full h-10 p-1 bg-gray-100 rounded-md border-transparent cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="flex justify-between items-center text-xs font-medium text-gray-600">
              <span>Size</span>
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{activeText.fontSize}</span>
            </label>
            <input
              type="range"
              min="12"
              max="128"
              value={activeText.fontSize}
              onChange={(e) => updateActiveText('fontSize', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => updateActiveText('bold', !activeText.bold)} className={`py-2 rounded-md text-sm font-semibold transition-colors ${activeText.bold ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Bold</button>
            <button onClick={() => updateActiveText('italic', !activeText.italic)} className={`py-2 rounded-md text-sm font-semibold transition-colors ${activeText.italic ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Italic</button>
          </div>
          
          <button onClick={removeActiveText} className="text-center text-red-600 text-sm font-semibold hover:bg-red-50 p-2 rounded-md transition-colors">Delete Text</button>
        </div>
      )}

      <div className="pt-2">
        <button
            onClick={onApply}
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !hasChanges}
        >
            Apply Text
        </button>
      </div>
    </div>
  );
};

export default TextPanel;
