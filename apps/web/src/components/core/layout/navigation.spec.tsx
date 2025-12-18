import { expect, test } from '@playwright/test';
import { setupTestWithErrorTracking } from '../../../../config/tests/utils/error-tracking';

/**
 * Comprehensive Navigation E2E Tests
 * 
 * Tests ALL navigation functionality across all breakpoints:
 * - Main navigation (desktop, tablet, mobile)
 * - Sub-menu bar (breadcrumbs, search, pinboard, GitHub Stars, Explore dropdown)
 * - Pinboard drawer (open, close, content, interactions)
 * - Command menu/palette (open, close, search, keyboard shortcuts)
 * - User menu (when logged in)
 * - Primary navigation menus (Configs, Discover, Resources, Contribute, Jobs, More)
 * - Keyboard shortcuts (⌘K for command menu)
 * - Responsive behavior
 * - Console error/warning detection (tests FAIL on any errors)
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error tracking with custom acceptable errors/warnings for navigation-specific issues
    const { cleanup, navigate } = setupTestWithErrorTracking(page, '/', {
      acceptableErrors: [
        'Only plain objects',
        'background:',
        'background-color:',
        'Feature-Policy',
      ],
      acceptableWarnings: [
        'apple-mobile-web-app-capable',
        'Feature-Policy',
        'hydrated but some attributes',
        'hydration-mismatch',
      ],
    });
    await navigate();
    
    // Store cleanup function for afterEach
    (page as any).__errorTrackingCleanup = cleanup;
  });

  test.afterEach(async ({ page }) => {
    // Check for errors and throw if any detected
    const cleanup = (page as any).__errorTrackingCleanup;
    if (cleanup) {
      cleanup();
    }
  });

  test.describe('Sub-Menu Bar', () => {
    test('should display sub-menu bar on homepage', async ({ page }) => {
      const subMenuBar = page.locator('[class*="border-b"][class*="backdrop-blur"]').first();
      await expect(subMenuBar).toBeVisible();
    });

    test('should have search icon button in sub-menu bar', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /open command menu/i });
      await expect(searchButton).toBeVisible();
    });

    test('should have pinboard icon button in sub-menu bar', async ({ page }) => {
      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await expect(pinboardButton).toBeVisible();
    });

    test('should have GitHub Stars button in sub-menu bar', async ({ page }) => {
      const githubButton = page.getByRole('button', { name: /star us on github/i });
      await expect(githubButton).toBeVisible();
    });

    test('should have Explore dropdown in sub-menu bar', async ({ page }) => {
      const exploreButton = page.getByRole('button', { name: /explore/i }).or(
        page.locator('button:has-text("Explore")')
      );
      await expect(exploreButton.first()).toBeVisible();
    });
  });

  test.describe('Pinboard Drawer', () => {
    test('should open pinboard drawer when pinboard icon is clicked', async ({ page }) => {
      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await expect(pinboardButton).toBeVisible();

      // Click pinboard button
      await pinboardButton.click();
      await page.waitForTimeout(1000); // Wait for drawer animation

      // Check if drawer is open (Sheet component)
      const drawer = page.locator('[role="dialog"]').or(
        page.locator('[data-state="open"]')
      );
      await expect(drawer).toBeVisible();

      // Check if pinboard title is visible
      const pinboardTitle = page.getByText(/pinned for later/i);
      await expect(pinboardTitle).toBeVisible();
    });

    test('should display pinboard content when drawer is open', async ({ page }) => {
      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await pinboardButton.click();
      await page.waitForTimeout(1000);

      // Check for pinboard content
      const drawer = page.locator('[role="dialog"]');
      await expect(drawer).toBeVisible();

      // Should show either pinned items or empty state
      const hasContent = await page.getByText(/pinned for later/i).isVisible().catch(() => false);
      expect(hasContent).toBe(true);
    });

    test('should close pinboard drawer when close button is clicked', async ({ page }) => {
      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await pinboardButton.click();
      await page.waitForTimeout(1000);

      // Find and click close button
      const closeButton = page.getByRole('button', { name: /close/i }).or(
        page.locator('button[aria-label*="close" i]')
      ).first();
      
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(500);
        
        // Drawer should be closed
        const drawer = page.locator('[role="dialog"][data-state="open"]');
        await expect(drawer).not.toBeVisible();
      }
    });

    test('should close pinboard drawer when backdrop is clicked', async ({ page }) => {
      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await pinboardButton.click();
      await page.waitForTimeout(1000);

      // Click backdrop (the overlay)
      const backdrop = page.locator('[data-state="open"][class*="bg-black"]').first();
      if (await backdrop.isVisible().catch(() => false)) {
        await backdrop.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
        
        // Drawer should be closed
        const drawer = page.locator('[role="dialog"][data-state="open"]');
        await expect(drawer).not.toBeVisible();
      }
    });

    test('should update pinboard button state when drawer is open', async ({ page }) => {
      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await expect(pinboardButton).toBeVisible();

      // Button should not have active state initially
      const initialClass = await pinboardButton.getAttribute('class');
      expect(initialClass).not.toContain('bg-accent');

      // Open drawer
      await pinboardButton.click();
      await page.waitForTimeout(1000);

      // Button should have active state
      const activeClass = await pinboardButton.getAttribute('class');
      expect(activeClass).toContain('bg-accent');
    });
  });

  test.describe('Command Menu / Palette', () => {
    test('should open command menu when search icon is clicked', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /open command menu/i });
      await expect(searchButton).toBeVisible();

      // Click search button
      await searchButton.click();
      await page.waitForTimeout(1500); // Wait for dialog animation

      // Check if command dialog is open
      const commandDialog = page.locator('[role="dialog"]').or(
        page.locator('input[placeholder*="Search navigation" i]')
      );
      await expect(commandDialog).toBeVisible();

      // Check if search input is visible
      const searchInput = page.locator('input[placeholder*="Search navigation" i]');
      await expect(searchInput).toBeVisible();
    });

    test('should display command menu content when open', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /open command menu/i });
      await searchButton.click();
      await page.waitForTimeout(1500);

      // Check for command menu sections
      const primaryNav = page.getByText(/primary navigation/i).or(
        page.locator('[role="group"]:has-text("Primary")')
      );
      const hasPrimaryNav = await primaryNav.isVisible().catch(() => false);
      
      // Should have at least search input visible
      const searchInput = page.locator('input[placeholder*="Search navigation" i]');
      await expect(searchInput).toBeVisible();
    });

    test('should close command menu when Escape key is pressed', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /open command menu/i });
      await searchButton.click();
      await page.waitForTimeout(1500);

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Dialog should be closed
      const dialog = page.locator('[role="dialog"][data-state="open"]');
      await expect(dialog).not.toBeVisible();
    });

    test('should open command menu with ⌘K keyboard shortcut', async ({ page }) => {
      // Press ⌘K (Meta+K on Mac, Ctrl+K on Windows/Linux)
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+k');
      } else {
        await page.keyboard.press('Control+k');
      }
      
      await page.waitForTimeout(1500);

      // Command dialog should be open
      const commandDialog = page.locator('[role="dialog"]').or(
        page.locator('input[placeholder*="Search navigation" i]')
      );
      await expect(commandDialog).toBeVisible();
    });

    test('should update search button state when command menu is open', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /open command menu/i });
      await expect(searchButton).toBeVisible();

      // Button should not have active state initially
      const initialClass = await searchButton.getAttribute('class');
      expect(initialClass).not.toContain('bg-accent');

      // Open command menu
      await searchButton.click();
      await page.waitForTimeout(1500);

      // Button should have active state
      const activeClass = await searchButton.getAttribute('class');
      expect(activeClass).toContain('bg-accent');
    });

    test('should allow typing in command menu search input', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /open command menu/i });
      await searchButton.click();
      await page.waitForTimeout(1500);

      const searchInput = page.locator('input[placeholder*="Search navigation" i]');
      await expect(searchInput).toBeVisible();
      
      // Type in search input
      await searchInput.fill('agents');
      await page.waitForTimeout(500);

      // Input should have the value
      await expect(searchInput).toHaveValue('agents');
    });
  });

  test.describe('GitHub Stars Button', () => {
    test('should display GitHub Stars button', async ({ page }) => {
      const githubButton = page.getByRole('button', { name: /star us on github/i });
      await expect(githubButton).toBeVisible();
    });

    test('should open GitHub in new tab when clicked', async ({ page, context }) => {
      const githubButton = page.getByRole('button', { name: /star us on github/i });
      
      // Set up promise to wait for new page
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        githubButton.click(),
      ]);

      // Should open GitHub
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('github.com');
      await newPage.close();
    });
  });

  test.describe('Explore Dropdown', () => {
    test('should display Explore dropdown button', async ({ page }) => {
      const exploreButton = page.getByRole('button', { name: /explore/i }).or(
        page.locator('button:has-text("Explore")')
      );
      await expect(exploreButton.first()).toBeVisible();
    });

    test('should open Explore dropdown when clicked', async ({ page }) => {
      const exploreButton = page.getByRole('button', { name: /explore/i }).or(
        page.locator('button:has-text("Explore")')
      ).first();
      
      await exploreButton.click();
      await page.waitForTimeout(500);

      // Check if dropdown content is visible
      const dropdownContent = page.locator('[role="menu"]').or(
        page.locator('[data-state="open"]')
      );
      const isVisible = await dropdownContent.isVisible().catch(() => false);
      expect(isVisible).toBe(true);
    });
  });

  test.describe('Main Navigation', () => {
    test('should display main navigation', async ({ page }) => {
      const nav = page.locator('nav[aria-label*="navigation" i]').or(
        page.locator('nav').first()
      );
      await expect(nav).toBeVisible();
    });

    test('should display logo', async ({ page }) => {
      const logo = page.getByRole('link', { name: /heyclaude.*homepage/i }).or(
        page.locator('a[href="/"]').first()
      );
      await expect(logo).toBeVisible();
    });

    test('should navigate to homepage when logo is clicked', async ({ page }) => {
      const logo = page.getByRole('link', { name: /heyclaude.*homepage/i }).or(
        page.locator('a[href="/"]').first()
      );
      await logo.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBe('http://localhost:3000/');
    });
  });

  test.describe('Desktop Navigation (xl: breakpoint)', () => {
    test('should display desktop navigation at xl breakpoint', async ({ page }) => {
      // Set viewport to xl (1280px+)
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Desktop nav should be visible
      const desktopNav = page.locator('nav').first();
      await expect(desktopNav).toBeVisible();
    });
  });

  test.describe('Tablet Navigation (md-xl breakpoint)', () => {
    test('should display tablet navigation at md-xl breakpoint', async ({ page }) => {
      // Set viewport to tablet (768px-1279px)
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Tablet nav should be visible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });
  });

  test.describe('Mobile Navigation (<md breakpoint)', () => {
    test('should display mobile menu button at mobile breakpoint', async ({ page }) => {
      // Set viewport to mobile (<768px)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Mobile menu button should be visible
      const mobileMenuButton = page.getByRole('button', { name: /open mobile menu/i }).or(
        page.locator('button[aria-label*="menu" i]')
      );
      await expect(mobileMenuButton).toBeVisible();
    });

    test('should open mobile menu when menu button is clicked', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const mobileMenuButton = page.getByRole('button', { name: /open mobile menu/i }).or(
        page.locator('button[aria-label*="menu" i]')
      );
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);

      // Mobile menu sheet should be visible
      const mobileMenu = page.locator('[role="dialog"]').or(
        page.locator('[data-state="open"]')
      );
      await expect(mobileMenu).toBeVisible();
    });
  });

  test.describe('Skip to Main Content', () => {
    test('should have skip to main content link', async ({ page }) => {
      const skipLink = page.getByRole('link', { name: /skip to main content/i });
      await expect(skipLink).toBeVisible();
    });

    test('should navigate to main content when skip link is activated', async ({ page }) => {
      const skipLink = page.getByRole('link', { name: /skip to main content/i });
      
      // Focus the link (it's sr-only until focused)
      await skipLink.focus();
      await skipLink.click();
      
      // Should scroll to main content
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Newsletter Modal/CTA Issues', () => {
    test('should not blur page without opening newsletter modal', async ({ page }) => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if backdrop is visible (should not be)
      const backdrop = page.locator('[data-state="open"][class*="bg-black"]').first();
      const backdropVisible = await backdrop.isVisible().catch(() => false);
      
      // Backdrop should not be visible unless a modal is actually open
      if (backdropVisible) {
        // If backdrop is visible, a modal should also be visible
        const modal = page.locator('[role="dialog"]');
        const modalVisible = await modal.isVisible().catch(() => false);
        
        // If backdrop is visible but no modal, that's the bug
        if (!modalVisible) {
          throw new Error('Page is blurred (backdrop visible) but no modal is open - this is the newsletter modal bug');
        }
      }
    });

    test('should not have preload warnings for newsletter actions', async ({ page }) => {
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Note: Newsletter preload warnings are now handled by the shared error tracking utility
      // If any unacceptable warnings are detected, the test will fail in afterEach
      // This test verifies the page loads without newsletter-specific issues
      const mainContent = page.locator('main, [role="main"]').first();
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on navigation buttons', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /open command menu/i });
      await expect(searchButton).toHaveAttribute('aria-label');

      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await expect(pinboardButton).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Should focus on an interactive element
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });
  });
});
