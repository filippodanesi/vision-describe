import React from 'react';
import { ExternalLink } from "lucide-react";

export const ProxyServices: React.FC = () => {
  return (
    <div className="text-xs text-muted-foreground mt-4">
      <p>
        Recommended CORS proxy services (in priority order):
      </p>
      <ul className="list-disc list-inside mt-1 space-y-1">
        <li>
          <a 
            href="https://corsproxy.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:underline font-medium"
          >
            corsproxy.io (Primary - Most Reliable)
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </li>
        <li>
          <a 
            href="https://github.com/codetabs/cors-proxy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:underline"
          >
            api.codetabs.com (Backup #1)
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </li>
        <li>
          <a 
            href="https://github.com/Freeboard/thingproxy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:underline"
          >
            thingproxy.freeboard.io (Backup #2)
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </li>
        <li>
          <a 
            href="https://cors.sh/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:underline"
          >
            cors.sh (Backup #3 - Requires API key)
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </li>
        <li>
          <a 
            href="https://github.com/Rob--W/cors-anywhere" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:underline"
          >
            Run your own proxy
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </li>
      </ul>
      <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300">
        <strong>✅ Automatic Fallback:</strong> The application tries each proxy automatically until one works. No manual configuration needed!
      </div>
    </div>
  );
};
