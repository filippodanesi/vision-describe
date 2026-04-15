import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import CorsProxy from './CorsProxy';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/Logo';

interface HeaderProps {
  standalone?: boolean;
  sectionTitle?: string;
}

const Header: React.FC<HeaderProps> = ({ standalone = false, sectionTitle }) => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
      <div className="px-5 py-3.5 flex items-center gap-3">
        {!standalone ? (
          <>
            <SidebarTrigger className="-ml-1" />
            {sectionTitle && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <span className="text-sm font-normal text-foreground/80">{sectionTitle}</span>
              </>
            )}
          </>
        ) : (
          <Link
            to="/"
            className="hover:opacity-80 transition-opacity"
          >
            <Logo size="sm" className="gap-2" />
          </Link>
        )}

        <div className="ml-auto flex items-center gap-1">
          <CorsProxy />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
