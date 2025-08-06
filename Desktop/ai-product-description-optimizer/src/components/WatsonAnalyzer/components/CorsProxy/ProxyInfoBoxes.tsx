import React from 'react';
import { Info, AlertTriangle, CheckCircle } from "lucide-react";

interface ProxyInfoBoxesProps {
  currentProxyUrl: string;
}

export const ProxyInfoBoxes: React.FC<ProxyInfoBoxesProps> = ({ currentProxyUrl }) => {
  return (
    <>
      <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
        <p className="text-green-800 dark:text-green-300 text-xs flex items-start">
          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Production-optimized CORS handling:</strong> Multiple proxy services optimized for Vercel:
            <ol className="list-decimal pl-5 mt-1">
              <li>Attempts direct browser access via Anthropic SDK first</li>
              <li>Falls back to production-friendly proxy services</li>
              <li>Uses 6 different backup proxy services automatically</li>
              <li>Handles different response formats (allorigins, direct, etc.)</li>
            </ol>
          </span>
        </p>
      </div>
      
      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-blue-800 dark:text-blue-300 text-xs flex items-start">
          <Info className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Production proxy services (auto-fallback order):</strong>
            <ul className="list-disc pl-5 mt-1">
              <li><code>api.allorigins.win</code> - Primary (excellent Vercel compatibility)</li>
              <li><code>proxy-cors.isomorphic-git.org</code> - GitHub-hosted, reliable</li>
              <li><code>cors-proxy.htmldriven.com</code> - Production-friendly</li>
              <li><code>api.codetabs.com</code> - High uptime</li>
              <li><code>corsproxy.io</code> - Backup service</li>
              <li><code>proxy.cors.sh</code> - Last resort (requires API key)</li>
            </ul>
            These are specifically chosen for production environments.
          </span>
        </p>
      </div>
      
      <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
        <p className="text-amber-800 dark:text-amber-300 text-xs flex items-start">
          <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Production troubleshooting:</strong> If issues persist:
            <ul className="list-disc pl-5 mt-1">
              <li>Check console for detailed proxy fallback attempts</li>
              <li>Verify your Claude API key format (starts with <code>sk-ant-</code>)</li>
              <li>Try OpenAI models as alternative (GPT-4o)</li>
              <li>Note: Some proxies may be slower in production vs local</li>
            </ul>
          </span>
        </p>
      </div>
      
      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-blue-800 dark:text-blue-300 text-xs flex items-center">
          <Info className="h-4 w-4 mr-1" />
          <strong>Current active proxy:</strong> {currentProxyUrl || "api.allorigins.win (production default)"}
        </p>
      </div>
    </>
  );
};
