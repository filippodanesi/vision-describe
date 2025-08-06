
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CorsProxyContent } from './CorsProxyContent';

interface CorsProxyDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  proxyUrl: string;
  setProxyUrl: (url: string) => void;
  proxyStatus: 'unknown' | 'working' | 'error';
  currentProxyUrl: string;
  handleSave: () => void;
  handleTestProxy: () => void;
  children?: React.ReactNode;
}

export const CorsProxyDialog: React.FC<CorsProxyDialogProps> = ({
  isOpen,
  setIsOpen,
  proxyUrl,
  setProxyUrl,
  proxyStatus,
  currentProxyUrl,
  handleSave,
  handleTestProxy,
  children
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CORS Proxy Configuration</DialogTitle>
          <DialogDescription>
            Configure a CORS proxy to enable API requests from your browser
          </DialogDescription>
        </DialogHeader>
        
        <CorsProxyContent 
          proxyUrl={proxyUrl}
          setProxyUrl={setProxyUrl}
          proxyStatus={proxyStatus}
          currentProxyUrl={currentProxyUrl}
          handleSave={handleSave}
          handleTestProxy={handleTestProxy}
        />
      </DialogContent>
    </Dialog>
  );
};
