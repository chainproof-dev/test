/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent shadow-md"></div>
    </div>
  );
};

export default Spinner;