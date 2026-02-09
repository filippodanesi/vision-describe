import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/30 mt-auto">
      <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Triumph Intertrade AG</span>
          <span className="hidden sm:inline text-border">|</span>
          <Link to="/changelog" className="hidden sm:inline hover:text-foreground transition-colors">
            Changelog
          </Link>
        </div>
        <span className="text-xs text-muted-foreground font-mono">v3.0</span>
      </div>
    </footer>
  );
};

export default Footer;
