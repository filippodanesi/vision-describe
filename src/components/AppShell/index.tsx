import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ImageIcon,
  Sparkles,
  BarChart3,
  FolderOpen,
  Settings,
  LogOut,
  ChevronsUpDown,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '../Logo';
import { ThemeProvider } from '../OptimizeMode/ThemeProvider';
import CorsProxy from '../OptimizeMode/components/CorsProxy';
import { OptimizeMode } from '../OptimizeMode';
import { GenerateMode } from '../GenerateMode';
import { Dashboard } from '../Dashboard';
import { Projects } from '../Projects';
import { Settings as SettingsPage } from '../Settings';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type NavGroup = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Content',
    defaultOpen: true,
    items: [
      { id: 'generate', label: 'Generate', icon: ImageIcon },
      { id: 'optimize', label: 'Optimize', icon: Sparkles },
    ],
  },
  {
    title: 'Management',
    defaultOpen: true,
    items: [
      { id: 'projects', label: 'Projects', icon: FolderOpen },
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    ],
  },
];

const FOOTER_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
];

type TabId = 'generate' | 'optimize' | 'projects' | 'dashboard' | 'settings';

const NavUser = ({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) => {
  const initials = email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{email.split('@')[0]}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{email.split('@')[0]}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/changelog">
                <HelpCircle className="mr-2 size-4" />
                <span className="font-mono text-xs mr-1">v3.0.0</span>
                Changelog
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('generate');
  const { user, signOut } = useAuth();

  const allItems = [...NAV_GROUPS.flatMap((g) => g.items), ...FOOTER_ITEMS];
  const activeLabel = allItems.find((item) => item.id === activeTab)?.label ?? '';

  // Find which group the active tab belongs to
  const activeGroup = NAV_GROUPS.find((g) =>
    g.items.some((item) => item.id === activeTab),
  );

  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon" side="left">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <Logo
                size="sm"
                showName={true}
                className="gap-2 overflow-hidden [&>span]:whitespace-nowrap group-data-[collapsible=icon]:[&>span]:hidden"
              />
              <span className="ml-auto font-display text-[10px] uppercase tracking-caps-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                v3.0.0
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {NAV_GROUPS.map((group, groupIdx) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel className="label-mono">
                  <span className="index-prefix mr-2">
                    {String(groupIdx + 1).padStart(2, '0')}
                  </span>
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={activeTab === item.id}
                            tooltip={item.label}
                            onClick={() => setActiveTab(item.id as TabId)}
                          >
                            <Icon className="size-4" />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            <SidebarGroup>
              <SidebarGroupLabel className="label-mono">
                <span className="index-prefix mr-2">
                  {String(NAV_GROUPS.length + 1).padStart(2, '0')}
                </span>
                Support
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {FOOTER_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeTab === item.id}
                          tooltip={item.label}
                          onClick={() => setActiveTab(item.id as TabId)}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            {user && (
              <NavUser
                email={user.email ?? ''}
                onSignOut={signOut}
              />
            )}
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList className="font-display uppercase tracking-caps text-[11px] font-medium gap-1.5 sm:gap-2">
                {activeGroup && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <span className="text-muted-foreground">{activeGroup.title}</span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block [&>svg]:size-2.5 text-border" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground font-medium">
                    {activeLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-3">
              <span
                className="hidden sm:inline-flex items-center gap-1.5 font-display uppercase tracking-caps-sm text-[10px] font-medium text-muted-foreground"
                aria-label="System status: ready"
              >
                <span className="status-dot" aria-hidden="true" />
                Ready
              </span>
              <CorsProxy />
            </div>
          </header>

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
