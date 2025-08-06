
import React from 'react';

export const CorsProxyStatus: React.FC = () => {
  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-2">
      <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm">Default CORS Proxy</h4>
      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
        We're using <code>cors.sh</code> with a permanent production API key. You can use this proxy without any additional configuration.
        For more information, visit{" "}
        <a 
          href="https://cors.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          cors.sh
        </a>.
      </p>
    </div>
  );
};
