/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ResetIcon } from './icons';

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  grayscale: number;
}

export const defaultAdjustments: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  sepia: 0,
  grayscale: 0,
};

interface SliderProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  disabled: boolean;
}

const AdjustmentSlider: React.FC<SliderProps> = ({ label, value, onChange, min, max, disabled }) => (
    <div>
        <label className="flex justify-between items-center text-sm font-medium text-gray-600">
            <span>{label}</span>
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{value}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

interface AdjustmentPanelProps {
  onApplyManualAdjustments: () => void;
  adjustments: Adjustments;
  onAdjustmentChange: (newAdjustments: Adjustments) => void;
  onResetAdjustments: () => void;
  isLoading: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  onApplyManualAdjustments,
  adjustments,
  onAdjustmentChange,
  onResetAdjustments,
  isLoading
}) => {
  
  const handleSliderChange = (key: keyof Adjustments) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onAdjustmentChange({ ...adjustments, [key]: parseInt(e.target.value, 10) });
  };
  
  const hasChanges = JSON.stringify(adjustments) !== JSON.stringify(defaultAdjustments);

  return (
    <div className="w-full bg-white rounded-lg flex flex-col gap-4 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">Manual Adjustments</h3>
        <button 
            onClick={onResetAdjustments} 
            disabled={isLoading || !hasChanges}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reset adjustments"
        >
            <ResetIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
          <AdjustmentSlider label="Brightness" value={adjustments.brightness} onChange={handleSliderChange('brightness')} min={0} max={200} disabled={isLoading} />
          <AdjustmentSlider label="Contrast" value={adjustments.contrast} onChange={handleSliderChange('contrast')} min={0} max={200} disabled={isLoading} />
          <AdjustmentSlider label="Saturation" value={adjustments.saturate} onChange={handleSliderChange('saturate')} min={0} max={200} disabled={isLoading} />
          <AdjustmentSlider label="Sepia" value={adjustments.sepia} onChange={handleSliderChange('sepia')} min={0} max={100} disabled={isLoading} />
          <AdjustmentSlider label="Grayscale" value={adjustments.grayscale} onChange={handleSliderChange('grayscale')} min={0} max={100} disabled={isLoading} />
      </div>

      <div className="pt-2">
        <button
            onClick={onApplyManualAdjustments}
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !hasChanges}
        >
            Apply Adjustments
        </button>
      </div>
    </div>
  );
};

export default AdjustmentPanel;
