/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
}

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, onSetAspect, isLoading, isCropping }) => {
  const [activeAspect, setActiveAspect] = useState<string>('Free');
  
  const handleAspectChange = (name: string, value: number | undefined) => {
    setActiveAspect(name);
    onSetAspect(value);
  }

  const aspects: { name: string, value: number | undefined }[] = [
    { name: 'Free', value: undefined },
    { name: '1:1', value: 1 / 1 },
    { name: '16:9', value: 16 / 9 },
    { name: '9:16', value: 9 / 16 },
    { name: '4:3', value: 4 / 3 },
    { name: '3:2', value: 3 / 2 },
  ];

  return (
    <div className="w-full bg-white rounded-lg flex flex-col items-center gap-4 animate-fade-in p-6">
      <h3 className="text-lg font-semibold text-gray-700">Crop Image</h3>
      <p className="text-sm text-gray-500 -mt-2">Click and drag on the image to select a crop area.</p>
      
      <div className="w-full">
        <span className="text-sm font-medium text-gray-600 mb-2 block text-center">Aspect Ratio:</span>
        <div className="grid grid-cols-3 gap-2">
            {aspects.map(({ name, value }) => (
            <button
                key={name}
                onClick={() => handleAspectChange(name, value)}
                disabled={isLoading}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                activeAspect === name 
                ? 'bg-blue-600 text-white shadow' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
            >
                {name}
            </button>
            ))}
        </div>
      </div>

      <button
        onClick={onApplyCrop}
        disabled={isLoading || !isCropping}
        className="w-full mt-2 bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        Apply Crop
      </button>
    </div>
  );
};

export default CropPanel;