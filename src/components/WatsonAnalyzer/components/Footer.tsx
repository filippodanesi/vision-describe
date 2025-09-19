
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          AI Product Description Optimizer
        </div>
        <div className="text-xs text-muted-foreground">
          Built with React, hosted on Vercel
        </div>
      </div>
    </footer>
  );
};

export default Footer;
