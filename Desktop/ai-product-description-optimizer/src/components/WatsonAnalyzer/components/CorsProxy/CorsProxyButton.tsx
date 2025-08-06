
import React from 'react';
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";

interface CorsProxyButtonProps {
  className?: string;
  proxyStatus: 'unknown' | 'working' | 'error';
}

export const CorsProxyButton: React.FC<CorsProxyButtonProps> = ({ className, proxyStatus }) => {
  return (
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className={className}>
        <Shield className="mr-2 h-4 w-4" />
        CORS Proxy
        {proxyStatus === 'working' && <CheckCircle className="ml-2 h-3 w-3 text-green-500" />}
        {proxyStatus === 'error' && <AlertCircle className="ml-2 h-3 w-3 text-red-500" />}
      </Button>
    </DialogTrigger>
  );
};
