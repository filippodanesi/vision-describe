import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, Sparkles, BarChart3, FolderOpen, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '../Logo';
import { ThemeProvider } from '../OptimizeMode/ThemeProvider';
import Header from '../OptimizeMode/components/Header';
import { OptimizeMode } from '../OptimizeMode';
import { GenerateMode } from '../GenerateMode';
import { Dashboard } from '../Dashboard';
import { Projects } from '../Projects';
import { Settings as SettingsPage } from '../Settings';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { id: 'generate', label: 'Generate', icon: ImageIcon },
  { id: 'optimize', label: 'Optimize', icon: Sparkles },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = (typeof NAV_ITEMS)[number]['id'];

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('generate');
  const { user, signOut } = useAuth();

  const activeLabel = NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? '';

  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon" side="left">
          <SidebarHeader className="p-4">
            <Logo
              size="sm"
              showName={true}
              className="gap-2 overflow-hidden [&>span]:whitespace-nowrap group-data-[collapsible=icon]:[&>span]:hidden"
            />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeTab === item.id}
                      tooltip={item.label}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 space-y-3">
            {user && (
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate group-data-[collapsible=icon]:hidden">Sign out</span>
              </button>
            )}
            <div className="flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
              <span className="font-mono">v3.0.0</span>
              <Link
                to="/changelog"
                className="hover:text-foreground transition-colors whitespace-nowrap group-data-[collapsible=icon]:hidden"
              >
                Changelog
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <Header sectionTitle={activeLabel} />

          <main className="flex-1 px-8 py-10">
            {activeTab === 'generate' && <GenerateMode />}
            {activeTab === 'optimize' && <OptimizeMode />}
            {activeTab === 'projects' && <Projects />}
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'settings' && <SettingsPage />}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default AppShell;
