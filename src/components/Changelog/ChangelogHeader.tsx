
import React from 'react';
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ChangelogHeader: React.FC = () => {
  return (
    <header className="border-b border-border">
      <div className="container max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Home</span>
          </Link>
        </div>
        <h1 className="text-xl font-bold">Changelog</h1>
      </div>
    </header>
  );
};

export default ChangelogHeader;
