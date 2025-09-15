/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface Preset {
  name: string;
  prompt: string;
}

interface PresetPanelProps {
  title: string;
  presets: Preset[];
  customPlaceholder: string;
  onApply: (prompt: string) => void;
  isLoading: boolean;
  actionButtonText: string;
}

const PresetPanel: React.FC<PresetPanelProps> = ({
  title,
  presets,
  customPlaceholder,
  onApply,
  isLoading,
  actionButtonText
}) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApply(activePrompt);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg flex flex-col gap-4 animate-fade-in p-6">
      <h3 className="text-lg font-semibold text-center text-gray-700">{title}</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-gray-100 border border-gray-200 text-gray-700 font-semibold py-3 px-2 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-200 hover:border-gray-300 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500' : ''}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder={customPlaceholder}
        className="flex-grow bg-white border border-gray-300 text-gray-800 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
        disabled={isLoading}
      />

      <div className="pt-2">
        <button
            onClick={handleApply}
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !activePrompt?.trim()}
        >
            {actionButtonText}
        </button>
      </div>
    </div>
  );
};

export default PresetPanel;