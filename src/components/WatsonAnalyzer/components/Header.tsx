import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from "lucide-react";
import CorsProxy from './CorsProxy';

const Header: React.FC = () => {
  return (
    <header className="bg-background border-b border-border">
      <div className="container max-w-7xl mx-auto py-3 px-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold text-sm tracking-tight">AI Copy Assistant</span>
        </Link>

        <div className="flex items-center gap-4">
          <CorsProxy />
        </div>
      </div>
    </header>
  );
};

export default Header;
