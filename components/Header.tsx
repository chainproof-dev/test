/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SparkleIcon } from './icons';

interface HeaderProps {
  onUploadNew: () => void;
  showActions: boolean;
}

const Header: React.FC<HeaderProps> = ({ onUploadNew, showActions }) => {
  return (
    <header className="w-full py-3 px-4 md:px-8 border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <SparkleIcon className="w-7 h-7 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight text-gray-800">
              Pixshop
            </h1>
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
               <button 
                onClick={onUploadNew}
                className="text-center bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm"
               >
                Upload New
              </button>
            </div>
          )}
      </div>
    </header>
  );
};

export default Header;