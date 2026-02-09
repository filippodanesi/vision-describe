
import React from 'react';
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CorsProxyButtonProps {
  className?: string;
  proxyStatus: 'unknown' | 'working' | 'error';
}

export const CorsProxyButton: React.FC<CorsProxyButtonProps> = ({ className, proxyStatus }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className={`h-9 w-9 rounded-full relative ${className || ''}`}>
            <Shield className="h-4 w-4" />
            {proxyStatus === 'working' && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-foreground" />
            )}
            {proxyStatus === 'error' && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-muted-foreground/50" />
            )}
          </Button>
        </DialogTrigger>
      </TooltipTrigger>
      <TooltipContent>CORS Proxy</TooltipContent>
    </Tooltip>
  );
};
