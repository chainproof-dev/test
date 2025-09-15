/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { XCircleIcon } from './icons';

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md p-4 rounded-lg bg-red-50 border border-red-300 text-red-900 shadow-lg z-50 animate-toast-in"
      role="alert"
    >
      <div className="flex items-start gap-4">
        <XCircleIcon className="w-6 h-6 flex-shrink-0 text-red-500 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold">An Error Occurred</p>
          <p className="text-sm text-red-800">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 -m-1 rounded-full hover:bg-red-100 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ErrorToast;