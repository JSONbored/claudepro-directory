'use client';

/**
 * Account Sidebar Navigation - Client Component
 * Handles active route highlighting and smooth transitions
 */

import { type LucideIcon } from '@heyclaude/web-runtime/icons';
import { Button, cn } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface AccountSidebarNavProps {
  navigation: NavItem[];
}

export function AccountSidebarNav({ navigation }: AccountSidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/account') {
      return pathname === '/account';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Account navigation" className="space-y-1">
      {navigation.map((item) => {
        const active = isActive(item.href);
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-sm transition-all duration-200',
                'hover:bg-accent/10 hover:text-foreground',
                active
                  ? 'bg-accent/10 text-foreground font-medium shadow-sm'
                  : 'text-muted-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'mr-2 h-4 w-4 transition-colors',
                  active ? 'text-accent' : 'text-muted-foreground'
                )}
              />
              <span>{item.name}</span>
              {active && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
                  aria-hidden="true"
                />
              )}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}

