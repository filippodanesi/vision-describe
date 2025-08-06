
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Info } from "lucide-react";
import { CorsProxyStatus } from './CorsProxyStatus';
import { ProxyServices } from './ProxyServices';
import { ProxyInfoBoxes } from './ProxyInfoBoxes';

interface CorsProxyContentProps {
  proxyUrl: string;
  setProxyUrl: (url: string) => void;
  proxyStatus: 'unknown' | 'working' | 'error';
  currentProxyUrl: string;
  handleSave: () => void;
  handleTestProxy: () => void;
}

export const CorsProxyContent: React.FC<CorsProxyContentProps> = ({
  proxyUrl,
  setProxyUrl,
  proxyStatus,
  currentProxyUrl,
  handleSave,
  handleTestProxy
}) => {
  return (
    <div className="space-y-4 py-4">
      <div className="text-sm text-muted-foreground">
        {/* Removed duplicate description since it's now in DialogDescription */}
        <ProxyInfoBoxes currentProxyUrl={currentProxyUrl} />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="proxy-url">CORS Proxy URL</Label>
        <Input
          id="proxy-url"
          placeholder="https://corsproxy.io/?"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Enter the URL of a CORS proxy service. Leave empty to use the default CORS.sh proxy.
        </p>
      </div>
      
      <CorsProxyStatus />
      
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          Save Settings
        </Button>
        <Button onClick={handleTestProxy} variant="outline" className="flex-1">
          Test Proxy
        </Button>
      </div>
      
      <ProxyServices />
    </div>
  );
};
