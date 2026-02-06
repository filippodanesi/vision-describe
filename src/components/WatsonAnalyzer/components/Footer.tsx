import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 items-center">
        <div>
          <Link to="/changelog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Changelog
          </Link>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          &copy; 2025 Triumph Intertrade AG
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs text-muted-foreground">AI Copy Assistant</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">v3.0</Badge>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
