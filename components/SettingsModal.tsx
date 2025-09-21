/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
  const [localApiKey, setLocalApiKey] = useState(currentApiKey);

  useEffect(() => {
    setLocalApiKey(currentApiKey);
  }, [currentApiKey, isOpen]);

  const handleSave = () => {
    onSave(localApiKey);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 id="settings-title" className="text-xl font-bold text-gray-800">Settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Optionally provide your own Gemini API key. If left blank, a default key will be used.
          </p>
        </div>
        <div className="p-6">
          <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <input
            id="api-key-input"
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="Enter your API key here"
            className="w-full bg-gray-50 border border-gray-300 text-gray-800 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-center bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-300 active:scale-95 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px active:scale-95 text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;