import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Info } from "lucide-react";

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
    <div className="space-y-4 py-2">
      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        {proxyStatus === 'working' ? (
          <><CheckCircle className="h-4 w-4 text-foreground" /><span className="text-foreground">Proxy connected</span></>
        ) : proxyStatus === 'error' ? (
          <><XCircle className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Proxy unreachable</span></>
        ) : (
          <><Info className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Not tested yet</span></>
        )}
        {currentProxyUrl && (
          <span className="text-xs text-muted-foreground font-mono ml-auto truncate max-w-[200px]">
            {currentProxyUrl.replace(/https?:\/\//, '').replace(/\/$/, '')}
          </span>
        )}
      </div>

      {/* Input */}
      <div className="space-y-1.5">
        <Label htmlFor="proxy-url" className="text-xs">Custom Proxy URL</Label>
        <Input
          id="proxy-url"
          placeholder="https://corsproxy.io/?"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
          className="font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground">
          Leave empty to use the default. Auto-fallback across 6 proxy services is built-in.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm" className="flex-1">
          Save
        </Button>
        <Button onClick={handleTestProxy} variant="outline" size="sm" className="flex-1">
          Test
        </Button>
      </div>
    </div>
  );
};
