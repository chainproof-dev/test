/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import PresetPanel from './PresetPanel';

interface AIAdjustPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
}

const AIAdjustPanel: React.FC<AIAdjustPanelProps> = ({ onApplyAdjustment, isLoading }) => {
  const presets = [
    { name: 'Blur Background', prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.' },
    { name: 'Enhance Details', prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.' },
    { name: 'Warmer Lighting', prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.' },
    { name: 'Studio Light', prompt: 'Add dramatic, professional studio lighting to the main subject.' },
  ];

  return (
    <PresetPanel
        title="Apply an AI Adjustment"
        presets={presets}
        customPlaceholder="Or describe an adjustment (e.g., 'change background to a forest')"
        onApply={onApplyAdjustment}
        isLoading={isLoading}
        actionButtonText="Apply AI Adjustment"
    />
  );
};

export default AIAdjustPanel;
