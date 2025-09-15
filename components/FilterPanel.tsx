/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import PresetPanel from './PresetPanel';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading }) => {
  const presets = [
    { name: 'Synthwave', prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.' },
    { name: 'Anime', prompt: 'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.' },
    { name: 'Lomo', prompt: 'Apply a Lomography-style cross-processing film effect with high-contrast, oversaturated colors, and dark vignetting.' },
    { name: 'Glitch', prompt: 'Transform the image into a futuristic holographic projection with digital glitch effects and chromatic aberration.' },
  ];
  
  return (
    <PresetPanel
        title="Apply a Filter"
        presets={presets}
        customPlaceholder="Or describe a custom filter (e.g., '80s synthwave glow')"
        onApply={onApplyFilter}
        isLoading={isLoading}
        actionButtonText="Apply Filter"
    />
  );
};

export default FilterPanel;