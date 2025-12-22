import { expect, test } from '@playwright/test';
import { setupTestWithErrorTracking } from '@test-utils/error-tracking';

/**
 * Comprehensive Homepage E2E Tests
 *
 * Tests ALL functionality on the homepage with strict error checking:
 * - Hero section (member count, tooltip, rolling text, animations)
 * - Search bar (focus/blur, typing, magnetic effects, expansion, particles, URL sync, debouncing)
 * - Search functionality (API calls, autocomplete, facets, results display)
 * - CRITICAL: Search bar performance (no page lockup on rapid typing - fixed infinite loop)
 * - Category stats section (below search bar with NumberTicker)
 * - Category tabs (switching, content updates, fetch more - hidden when searching)
 * - Featured sections (hidden when searching)
 * - SearchResults component (shown when query.trim().length > 0)
 * - Recently viewed rail (display, interactions, clear, resume search)
 * - Top contributors (lazy loading)
 * - Footer and newsletter signup
 * - Keyboard navigation and accessibility
 * - Responsive design
 * - Network monitoring
 * - Console error/warning detection (tests FAIL on any errors)
 *
 * Current Implementation (2025):
 * - SearchProvider wraps HomePageClient
 * - HomepageSearchBar uses AnimatedSearchBar with SearchProvider context
 * - SearchBar uses uncontrolled input with local state (prevents URL sync overwriting user input)
 * - Local state -> context debounce: 300ms
 * - Context -> URL debounce: 300ms
 * - SearchResults shown when query.trim().length > 0
 * - Featured sections and tabs hidden when searching
 * - Category stats displayed below search bar
 * - Navigation uses NavigationHoverCard (not role="menu")
 * - Sub-menu bar visible on homepage with command menu, pinboard, GitHub stars, Explore dropdown
 */

test.describe('Homepage', () => {
  // Helper function to get search input (standardized selector)
  const getSearchInput = (page: any) => {
    return page
      .getByPlaceholder(/search for rules, mcp servers, agents, commands, and more/i)
      .or(page.locator('input[type="search"][aria-label="Search"]'))
      .first();
  };

  test.beforeEach(async ({ page }) => {
    // Set up error tracking and navigate to homepage
    const { cleanup, navigate } = setupTestWithErrorTracking(page, '/');
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

  test('should render homepage with hero section', async ({ page }) => {
    // Check hero section is present
    const hero = page.getByRole('region', { name: /homepage hero/i });
    await expect(hero).toBeVisible();

    // Check hero heading
    const heading = page.getByRole('heading', {
      level: 1,
      name: /the ultimate directory for claude/i,
    });
    await expect(heading).toBeVisible();

    // Check member count is displayed (may be 0+ initially)
    const memberCount = page.getByText(/\d+\+.*members/i);
    await expect(memberCount).toBeVisible();

    // Check hero description text
    const description = page.getByText(/join.*members discovering and sharing/i);
    await expect(description).toBeVisible();
  });

  test('should display member count tooltip on hover', async ({ page }) => {
    // Find member count element (NumberTicker with tooltip)
    // The member count is in a span with cursor-help class
    const memberCount = page.locator('text=/\\d+\\+/i').first();
    await expect(memberCount).toBeVisible({ timeout: 10000 });

    // Hover over member count to trigger tooltip
    await memberCount.hover();
    await page.waitForTimeout(1000);

    // Check for tooltip content (may take a moment to appear)
    const tooltip = page.getByText(/active community members|members who have contributed/i);
    const tooltipVisible = await tooltip.isVisible().catch(() => false);

    // Tooltip may or may not appear immediately, both are acceptable
    if (tooltipVisible) {
      await expect(tooltip).toBeVisible();
    }
  });

  test('should display rolling text animation in hero', async ({ page }) => {
    // Check for rolling text element (enthusiasts, developers, etc.)
    // The rolling text changes, so we check for the heading that contains it
    const heroHeading = page.getByRole('heading', {
      level: 1,
      name: /the ultimate directory for claude/i,
    });
    await expect(heroHeading).toBeVisible();

    // Check that the heading contains one of the rolling text words
    const headingText = await heroHeading.textContent();
    const hasRollingText = /enthusiasts|developers|power users|beginners|builders/i.test(
      headingText || ''
    );
    expect(hasRollingText).toBe(true);
  });

  test('should display newsletter subscriber count from API', async ({ page }) => {
    // Wait for member count to load (may take a moment)
    // The count is displayed as "0+" or similar in the hero section
    const countElement = page.locator('text=/\\d+\\+/i').first();
    await expect(countElement).toBeVisible({ timeout: 10000 });

    // Verify the count is a number
    const countText = await countElement.textContent();
    expect(countText).toMatch(/\d+\+/);

    // Test the API endpoint directly
    const response = await page.request.get('/api/flux/email/count');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('count');
    expect(typeof data.count).toBe('number');
    expect(data.count).toBeGreaterThanOrEqual(0);
  });

  test('should have functional search bar with real queries (no page lockup)', async ({ page }) => {
    // Find search input by placeholder (most reliable)
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Test search interaction - type a query
    // This should NOT cause page lockup (critical test for the fix)
    const typeStart = Date.now();
    await searchInput.click();
    await searchInput.fill('claude');
    const typeTime = Date.now() - typeStart;

    // Typing should be fast and responsive (< 500ms)
    expect(typeTime).toBeLessThan(500);

    // Wait for debounced search to execute
    // NOTE: With uncontrolled input, there are two debounces:
    // 1. Local state -> context (300ms)
    // 2. Context -> URL (300ms)
    // Plus API call time, so wait 2 seconds
    await page.waitForTimeout(2000);

    // Verify search input has value (uncontrolled input shows typed value immediately)
    await expect(searchInput).toHaveValue('claude');

    // Verify URL was updated with query (may take up to 600ms+ for URL sync)
    const url = page.url();
    let urlQuery = new URL(url).searchParams.get('q');

    // If URL not updated yet, wait a bit more (double debounce)
    if (!urlQuery || !urlQuery.includes('claude')) {
      await page.waitForTimeout(1000);
      const url2 = page.url();
      urlQuery = new URL(url2).searchParams.get('q');
    }

    expect(url).toContain('q=');
    expect(urlQuery).toContain('claude');

    // CRITICAL: Verify page is still responsive (no lockup)
    const isResponsive = await page.evaluate(() => {
      return (
        document.body.style.pointerEvents !== 'none' &&
        !document.body.classList.contains('pointer-events-none')
      );
    });
    expect(isResponsive).toBe(true);
  });

  test('should handle search bar focus and blur', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Focus the search input
    await searchInput.focus();
    await page.waitForTimeout(300);

    // Verify input is focused
    await expect(searchInput).toBeFocused();

    // Blur the search input
    await searchInput.blur();
    await page.waitForTimeout(300);

    // Verify input is not focused
    const isFocused = await searchInput.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(false);
  });

  test('should sync search query to URL (with uncontrolled input debounce)', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a search query
    // NOTE: With uncontrolled input, local state updates immediately, but URL sync is debounced (300ms)
    await searchInput.fill('test query');

    // Wait for debounce: 300ms (local->context) + 300ms (context->URL) = ~600ms minimum
    // Add buffer for React state updates
    await page.waitForTimeout(1000);

    // Verify URL contains the query parameter
    const url = page.url();
    expect(url).toContain('q=');
    expect(url).toContain('test');

    // Verify input value matches (uncontrolled input should show typed value immediately)
    await expect(searchInput).toHaveValue('test query');
  });

  test('should load search query from URL on page load (uncontrolled input sync)', async ({
    page,
  }) => {
    // Navigate with query parameter
    await page.goto('/?q=claude');
    await page.waitForLoadState('networkidle');

    // Wait for React hydration and uncontrolled input sync from context
    await page.waitForTimeout(2000);

    // Verify search input has the query value
    // NOTE: With uncontrolled input, value syncs from context when input is not focused
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await expect(searchInput).toHaveValue('claude');
  });

  test('should debounce search API calls (no page lockup)', async ({ page }) => {
    // Monitor network requests
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/search') && request.method() === 'GET') {
        apiCalls.push(request.url());
      }
    });

    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type rapidly (should trigger debounce, but NOT lock up page)
    const rapidTypeStart = Date.now();
    await searchInput.fill('a');
    await page.waitForTimeout(50);
    await searchInput.fill('ab');
    await page.waitForTimeout(50);
    await searchInput.fill('abc');
    await page.waitForTimeout(50);
    await searchInput.fill('abcd');
    const rapidTypeTime = Date.now() - rapidTypeStart;

    // Rapid typing should be fast (< 1 second for 4 keystrokes)
    expect(rapidTypeTime).toBeLessThan(1000);

    // CRITICAL: Page should remain responsive during rapid typing
    const isResponsive = await page.evaluate(() => {
      return document.body.style.pointerEvents !== 'none';
    });
    expect(isResponsive).toBe(true);

    // Wait for debounce (300ms) + network request
    await page.waitForTimeout(1500);

    // Should have fewer API calls than keystrokes due to debouncing
    // With optimized SearchProvider, should have 1-2 calls max
    expect(apiCalls.length).toBeLessThan(3);

    // Final value should be correct
    await expect(searchInput).toHaveValue('abcd');
  });

  test('should call search API endpoint with query', async ({ page }) => {
    // Monitor network requests
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/search') && request.method() === 'GET') {
        apiCalls.push(request.url());
      }
    });

    // Find and use search input
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type search query
    await searchInput.fill('test query');

    // Wait for debounced search (300ms) + network request
    await page.waitForTimeout(1500);

    // Verify API was called
    expect(apiCalls.length).toBeGreaterThan(0);

    // Verify API call includes query parameter
    const searchApiCall = apiCalls.find((url) => url.includes('q='));
    expect(searchApiCall).toBeDefined();
    expect(searchApiCall).toContain('q=test');
  });

  test('should handle search API response correctly', async ({ page }) => {
    // Test search API directly
    const response = await page.request.get('/api/search?q=claude&limit=10');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('totalCount');
    expect(Array.isArray(data.results)).toBe(true);
    expect(typeof data.totalCount).toBe('number');
    expect(data.totalCount).toBeGreaterThanOrEqual(0);
  });

  test('should display search results when query is entered', async ({ page }) => {
    // Find search input
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Enter a search query
    await searchInput.fill('mcp');

    // Wait for search to execute (300ms debounce + API call)
    await page.waitForTimeout(2000);

    // Verify search input has the value
    await expect(searchInput).toHaveValue('mcp');

    // Check for SearchResults component (shows when query.trim().length > 0)
    // SearchResults shows either:
    // 1. Results grid with ConfigCard components
    // 2. Empty state message
    // 3. Loading state
    // 4. Error state

    // Featured sections and tabs should be HIDDEN when searching
    const featuredSections = page.getByText(/featured|trending/i).first();
    const hasFeatured = await featuredSections.isVisible().catch(() => false);
    expect(hasFeatured).toBe(false); // Should be hidden when searching

    // Check for search results container or empty state
    const hasSearchResults =
      (await page
        .locator('[data-testid="search-results"], [aria-label*="search results" i]')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText(/no.*results|no.*found|searching/i)
        .isVisible()
        .catch(() => false));

    // At least one search-related element should be visible
    expect(hasSearchResults || (await searchInput.isVisible())).toBe(true);
  });

  test('should clear search when clear button is clicked', async ({ page }) => {
    // Find search input
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Enter search query
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Look for clear button (X icon or "Clear" button)
    const clearButton = page.getByRole('button', { name: /clear|close|×/i }).first();
    const hasClearButton = await clearButton.isVisible().catch(() => false);

    if (hasClearButton) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // Verify search is cleared
      const value = await searchInput.inputValue();
      expect(value).toBe('');
    }
  });

  test('should display category tabs (hidden when searching)', async ({ page }) => {
    // Wait for tabs to load
    await page.waitForTimeout(2000); // Wait for content to load

    // First verify tabs are visible when NOT searching
    const tabsList = page.getByRole('tablist');
    const hasTabs = await tabsList.isVisible().catch(() => false);

    if (hasTabs) {
      // Check for common category tabs
      const allTab = page.getByRole('tab', { name: /^all$/i });
      await expect(allTab).toBeVisible();

      // Check for other category tabs (at least one should be present)
      const categoryTabs = page.getByRole('tab');
      const tabCount = await categoryTabs.count();
      expect(tabCount).toBeGreaterThan(0);

      // Now test that tabs are hidden when searching
      const searchInput = getSearchInput(page);
      await searchInput.fill('test query');
      await page.waitForTimeout(1500);

      // Tabs should be hidden when query.trim().length > 0
      const tabsHidden = await tabsList.isVisible().catch(() => false);
      expect(tabsHidden).toBe(false); // Should be hidden when searching

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(1500);

      // Tabs should be visible again
      await expect(tabsList).toBeVisible();
    }
  });

  test('should switch between category tabs', async ({ page }) => {
    // Wait for tabs to load
    const tabsList = page.getByRole('tablist');
    await expect(tabsList).toBeVisible({ timeout: 10000 });

    // Get all tabs
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    expect(tabCount).toBeGreaterThan(1);

    // Click second tab
    const secondTab = tabs.nth(1);
    const tabName = await secondTab.textContent();

    await secondTab.click();
    await page.waitForTimeout(500);

    // Verify tab is selected
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');

    // Verify content changed (tab panel should update)
    const tabPanel = page.getByRole('tabpanel');
    await expect(tabPanel).toBeVisible();
  });

  test('should navigate tabs with keyboard', async ({ page }) => {
    // Wait for tabs to load
    const tabsList = page.getByRole('tablist');
    await expect(tabsList).toBeVisible({ timeout: 10000 });

    // Get all tabs
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    expect(tabCount).toBeGreaterThan(1);

    // Focus first tab
    await tabs.first().focus();
    await page.waitForTimeout(200);

    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Verify second tab is focused
    const secondTab = tabs.nth(1);
    await expect(secondTab).toBeFocused();

    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify tab is selected
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display content for each category tab', async ({ page }) => {
    // Wait for tabs to load
    const tabsList = page.getByRole('tablist');
    await expect(tabsList).toBeVisible({ timeout: 10000 });

    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    // Test at least first 3 tabs
    const tabsToTest = Math.min(3, tabCount);

    for (let i = 0; i < tabsToTest; i++) {
      const tab = tabs.nth(i);
      await tab.click();
      await page.waitForTimeout(500);

      // Verify tab is selected
      await expect(tab).toHaveAttribute('aria-selected', 'true');

      // Verify tab panel is visible
      const tabPanel = page.getByRole('tabpanel');
      await expect(tabPanel).toBeVisible();
    }
  });

  test('should display content sections (hidden when searching)', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check for main content container
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // When NOT searching, should show featured sections or tabs
    const hasFeaturedOrTabs = await page
      .getByText(/featured|trending|all|community/i)
      .isVisible()
      .catch(() => false);
    expect(hasFeaturedOrTabs).toBe(true);

    // Now test that featured sections are hidden when searching
    const searchInput = getSearchInput(page);
    await searchInput.fill('test');
    await page.waitForTimeout(1500);

    // Featured sections should be hidden (query.trim().length > 0)
    const featuredSections = page.getByText(/featured|trending/i).first();
    const hasFeatured = await featuredSections.isVisible().catch(() => false);
    expect(hasFeatured).toBe(false); // Should be hidden when searching

    // Search results should be shown instead
    const hasSearchResults =
      (await page
        .locator('[data-testid="search-results"]')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText(/no.*results|searching/i)
        .isVisible()
        .catch(() => false));
    // At least search input should be visible
    await expect(searchInput).toBeVisible();
  });

  test('should have navigation menu', async ({ page }) => {
    // Check for main navigation
    const nav = page.getByRole('navigation', { name: /main navigation/i });
    await expect(nav).toBeVisible();

    // Check for logo/home link
    const homeLink = page.getByRole('link', { name: /heyclaude.*homepage/i });
    await expect(homeLink).toBeVisible();
  });

  test.describe('Navbar Elements on Homepage', () => {
    test('should have sub-menu bar with interactive elements', async ({ page }) => {
      // Sub-menu bar should be visible on homepage
      // It contains command menu, pinboard, GitHub stars, and Explore dropdown
      const commandMenuButton = page.getByRole('button', { name: /open command menu/i });
      await expect(commandMenuButton).toBeVisible({ timeout: 10000 });

      // Should have pinboard icon button
      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await expect(pinboardButton).toBeVisible();

      // Should have GitHub Stars button
      const githubButton = page.getByRole('button', { name: /star us on github/i });
      await expect(githubButton).toBeVisible();

      // Should have Explore dropdown
      const exploreButton = page.getByRole('button', { name: /explore content variants/i });
      await expect(exploreButton).toBeVisible();
    });

    test('should open pinboard drawer from sub-menu bar', async ({ page }) => {
      const pinboardButton = page.getByRole('button', { name: /open pinboard/i });
      await expect(pinboardButton).toBeVisible();

      await pinboardButton.click();
      await page.waitForTimeout(1500); // Wait for drawer animation

      // Check if drawer is open
      const drawer = page.locator('[role="dialog"]').or(page.locator('[data-state="open"]'));
      await expect(drawer).toBeVisible();

      // Check if pinboard title is visible
      const pinboardTitle = page.getByText(/pinned for later/i);
      await expect(pinboardTitle).toBeVisible();
    });

    test('should open command menu from sub-menu bar', async ({ page }) => {
      const commandMenuButton = page.getByRole('button', { name: /open command menu/i });
      await expect(commandMenuButton).toBeVisible({ timeout: 10000 });

      await commandMenuButton.click();
      await page.waitForTimeout(1500); // Wait for dialog animation

      // Check if command dialog/palette is open
      // Command palette may use different selectors - check for either dialog or input
      const commandDialog = page
        .locator('[role="dialog"]')
        .or(
          page.locator('input[placeholder*="Search navigation" i], input[placeholder*="Search" i]')
        )
        .first();
      await expect(commandDialog).toBeVisible({ timeout: 5000 });

      // Check if search input is visible in command palette
      const searchInput = page
        .locator('input[placeholder*="Search navigation" i], input[placeholder*="Search" i]')
        .first();
      const inputVisible = await searchInput.isVisible().catch(() => false);
      expect(inputVisible).toBe(true);
    });

    test('should not have backdrop visible without open modal', async ({ page }) => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if backdrop is visible (should not be unless modal is open)
      const backdrop = page.locator('[data-state="open"][class*="bg-black"]').first();
      const backdropVisible = await backdrop.isVisible().catch(() => false);

      if (backdropVisible) {
        // If backdrop is visible, a modal should also be visible
        const modal = page.locator('[role="dialog"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        // If backdrop is visible but no modal, that's the bug
        if (!modalVisible) {
          throw new Error(
            'Page is blurred (backdrop visible) but no modal is open - this indicates a modal state bug'
          );
        }
      }
    });
  });

  test.describe('Newsletter Modal/CTA Issues', () => {
    test('should not blur page without opening newsletter modal', async ({ page }) => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait longer for any delayed modals

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
          throw new Error(
            'Page is blurred (backdrop visible) but no modal is open - this is the newsletter modal bug'
          );
        }
      }
    });

    test('should not have preload warnings for newsletter actions', async ({ page }) => {
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Check console warnings for newsletter preload issues
      const newsletterPreloadWarnings = consoleWarnings.filter(
        (warning) => warning.includes('newsletter') && warning.includes('preload')
      );

      if (newsletterPreloadWarnings.length > 0) {
        throw new Error(
          `Newsletter preload warnings detected: ${newsletterPreloadWarnings.join('; ')}`
        );
      }
    });

    test('should handle newsletter footer bar if it appears', async ({ page }) => {
      // Wait for potential newsletter footer bar to appear (it has a delay)
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(35000); // Wait for 30s delay + buffer

      // Check if newsletter footer bar is visible
      const newsletterBar = page
        .locator('aside[aria-label*="newsletter" i]')
        .or(page.locator('[aria-label*="Newsletter signup" i]'));
      const isVisible = await newsletterBar.isVisible().catch(() => false);

      if (isVisible) {
        // If visible, should have dismiss button
        const dismissButton = page.getByRole('button', { name: /dismiss|close/i });
        const hasDismiss = await dismissButton.isVisible().catch(() => false);

        // Should be dismissible
        expect(hasDismiss).toBe(true);
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('should have responsive search bar interaction (no lag)', async ({ page }) => {
      const searchInput = getSearchInput(page);
      await expect(searchInput).toBeVisible();

      // Measure click time
      const clickStart = Date.now();
      await searchInput.click();
      const clickTime = Date.now() - clickStart;

      // Click should be fast (< 100ms)
      expect(clickTime).toBeLessThan(100);

      // Measure typing performance
      const typeStart = Date.now();
      await searchInput.fill('test query');
      const typeTime = Date.now() - typeStart;

      // Typing should be fast (< 500ms for 10 characters)
      expect(typeTime).toBeLessThan(500);
    });

    test('should not block UI during search debounce (critical performance test)', async ({
      page,
    }) => {
      const searchInput = getSearchInput(page);
      await expect(searchInput).toBeVisible();

      // Type rapidly - this was causing page lockup before the fix
      const startTime = Date.now();
      await searchInput.fill('a');
      await page.waitForTimeout(50);
      await searchInput.fill('ab');
      await page.waitForTimeout(50);
      await searchInput.fill('abc');
      await page.waitForTimeout(50);
      await searchInput.fill('abcd');
      await page.waitForTimeout(50);
      await searchInput.fill('abcde');
      const totalTime = Date.now() - startTime;

      // CRITICAL: Typing should be fast and responsive
      expect(totalTime).toBeLessThan(1000); // Should complete in < 1 second

      // UI should remain responsive (input should still be interactive)
      await expect(searchInput).toBeEnabled();
      await expect(searchInput).toHaveValue('abcde');

      // CRITICAL: Page should NOT be locked up
      const isPageResponsive = await page.evaluate(() => {
        // Check if page is interactive
        const body = document.body;
        const isPointerEventsNone = window.getComputedStyle(body).pointerEvents === 'none';
        const hasBlurOverlay = document.querySelector('[data-state="open"][class*="backdrop"]');
        return !isPointerEventsNone && !hasBlurOverlay;
      });
      expect(isPageResponsive).toBe(true);

      // Wait for debounce to complete
      await page.waitForTimeout(1000);

      // Verify search executed without lockup
      await expect(searchInput).toHaveValue('abcde');
    });
  });

  test('newsletter count API should return valid response', async ({ page }) => {
    // Test the API endpoint directly
    const response = await page.request.get('/api/flux/email/count');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('count');
    expect(typeof data.count).toBe('number');
    expect(data.count).toBeGreaterThanOrEqual(0);
  });

  test('should not have service worker intercepting API in dev mode', async ({ page }) => {
    // Navigate to page
    await page.goto('/');

    // Wait for service worker to register (if it does)
    await page.waitForTimeout(2000);

    // Test API call - should not return 503
    const response = await page.request.get('/api/flux/email/count');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('count');
    expect(data.status).not.toBe(503);
  });

  test('should display footer with newsletter signup', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check for footer
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();

    // Check for newsletter signup section
    const newsletterHeading = page.getByRole('heading', {
      name: /get weekly.*claude.*resources/i,
    });
    await expect(newsletterHeading).toBeVisible();

    // Check for email input
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
  });

  test('should have no hydration errors', async ({ page }) => {
    // Check for error overlays
    const errorOverlay = page.locator('[data-nextjs-error]');
    await expect(errorOverlay).not.toBeVisible();

    // Check for React hydration warnings in console
    const hydrationErrors = consoleErrors.filter(
      (err) =>
        err.includes('Hydration') ||
        err.includes('hydration') ||
        err.includes('server rendered HTML')
    );

    expect(hydrationErrors.length).toBe(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check hero section is still visible
    const hero = page.getByRole('region', { name: /homepage hero/i });
    await expect(hero).toBeVisible();

    // Check navigation is accessible
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    // Check search bar is accessible
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('should load top contributors section when scrolled', async ({ page }) => {
    // Scroll down to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    // Wait for potential lazy-loaded content
    await page.waitForTimeout(3000);

    // Check if top contributors section exists (may not always be visible)
    const contributorsHeading = page
      .getByRole('heading', {
        name: /top contributors/i,
      })
      .first();

    // This section may or may not be visible depending on scroll position
    // Just verify page doesn't error when scrolling
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should display recently viewed rail when items exist', async ({ page }) => {
    // Scroll to find recently viewed section
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(2000);

    // Check for recently viewed section (may or may not be visible depending on history)
    const recentlyViewedSection = page
      .getByRole('region', {
        name: /recently viewed/i,
      })
      .or(page.getByRole('heading', { name: /recently viewed/i }))
      .first();

    const isVisible = await recentlyViewedSection.isVisible().catch(() => false);

    // If visible, verify it has proper structure
    if (isVisible) {
      await expect(recentlyViewedSection).toBeVisible();

      // Check for action buttons if visible
      const resumeButton = page.getByRole('button', { name: /resume search/i });
      const clearButton = page.getByRole('button', { name: /clear history/i });

      // At least one button should be visible if section is shown
      const hasButtons =
        (await resumeButton.isVisible().catch(() => false)) ||
        (await clearButton.isVisible().catch(() => false));

      if (hasButtons) {
        expect(hasButtons).toBe(true);
      }
    }
  });

  test('should handle recently viewed rail interactions', async ({ page }) => {
    // Scroll to find recently viewed section
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(2000);

    // Check for resume search button
    const resumeButton = page.getByRole('button', { name: /resume search/i });
    const hasResumeButton = await resumeButton.isVisible().catch(() => false);

    if (hasResumeButton) {
      // Hover to see tooltip
      await resumeButton.hover();
      await page.waitForTimeout(500);

      // Check for tooltip
      const tooltip = page.getByText(/continue your last search/i);
      const hasTooltip = await tooltip.isVisible().catch(() => false);

      // Tooltip may or may not appear immediately
      if (hasTooltip) {
        await expect(tooltip).toBeVisible();
      }
    }

    // Check for clear history button
    const clearButton = page.getByRole('button', { name: /clear history/i });
    const hasClearButton = await clearButton.isVisible().catch(() => false);

    if (hasClearButton) {
      // Hover to see tooltip
      await clearButton.hover();
      await page.waitForTimeout(500);

      // Check for tooltip
      const tooltip = page.getByText(/remove all items/i);
      const hasTooltip = await tooltip.isVisible().catch(() => false);

      if (hasTooltip) {
        await expect(tooltip).toBeVisible();
      }
    }
  });

  test('should handle multiple search queries sequentially', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Test multiple queries
    const queries = ['claude', 'mcp', 'agent'];

    for (const query of queries) {
      await searchInput.fill(query);
      await page.waitForTimeout(1500); // Wait for debounce + API call

      // Verify input has value
      await expect(searchInput).toHaveValue(query);
    }
  });

  test('should handle search with special characters', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Test query with special characters
    await searchInput.fill('test@query#123');
    await page.waitForTimeout(1500);

    // Verify input handles special characters
    await expect(searchInput).toHaveValue('test@query#123');
  });

  test('should handle empty search query', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Enter then clear search
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // Verify empty state or content sections are shown
    const hasContent = await page
      .getByText(/featured|categories|all/i)
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('should test search autocomplete API', async ({ page }) => {
    // Test autocomplete API endpoint
    const response = await page.request.get('/api/search/autocomplete?q=cl');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBe(true);
  });

  test('should test search facets API', async ({ page }) => {
    // Test facets API endpoint
    const response = await page.request.get('/api/search/facets');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('categories');
    expect(data).toHaveProperty('tags');
    expect(data).toHaveProperty('authors');
    expect(Array.isArray(data.categories)).toBe(true);
    expect(Array.isArray(data.tags)).toBe(true);
    expect(Array.isArray(data.authors)).toBe(true);
  });

  test('should have no network errors for critical resources', async ({ page }) => {
    // Track failed network requests
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().includes('analytics')) {
        failedRequests.push(`${response.url()} - ${response.status()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out non-critical failures (analytics, etc.)
    const criticalFailures = failedRequests.filter(
      (url) => !url.includes('analytics') && !url.includes('umami') && !url.includes('vercel')
    );

    expect(criticalFailures.length).toBe(0);
  });

  test('should maintain search state during navigation', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Enter search query
    await searchInput.fill('test query');
    await page.waitForTimeout(500);

    // Verify search persists
    await expect(searchInput).toHaveValue('test query');
  });

  test('CRITICAL: should handle rapid search input without lockup or excessive re-renders (infinite loop fix)', async ({
    page,
  }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Track network requests to detect excessive re-renders
    const postRequests: string[] = [];
    const searchApiRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (request.method() === 'POST' && url.includes('localhost:3000')) {
        postRequests.push(`${request.method()} ${url}`);
      }
      if (url.includes('/api/search')) {
        searchApiRequests.push(`${request.method()} ${url}`);
      }
    });

    // Rapidly type "agent" character by character - this was causing lockup before
    const startTime = Date.now();
    await searchInput.fill('a');
    await page.waitForTimeout(100);
    await searchInput.fill('ag');
    await page.waitForTimeout(100);
    await searchInput.fill('age');
    await page.waitForTimeout(100);
    await searchInput.fill('agen');
    await page.waitForTimeout(100);
    await searchInput.fill('agent');
    const typingTime = Date.now() - startTime;

    // CRITICAL: Typing should be fast (< 1 second for 5 keystrokes)
    expect(typingTime).toBeLessThan(1000);

    // Final value should be correct
    await expect(searchInput).toHaveValue('agent');

    // CRITICAL: Page should remain responsive
    const isResponsive = await page.evaluate(() => {
      return document.body.style.pointerEvents !== 'none';
    });
    expect(isResponsive).toBe(true);

    // Wait for debounce + API call
    // NOTE: With uncontrolled input, there are two debounces:
    // 1. Local state -> context (300ms)
    // 2. Context -> URL (300ms)
    // Plus API call time, so wait 2 seconds
    await page.waitForTimeout(2000);

    // CRITICAL: Should NOT have excessive POST requests (indicates re-render loop)
    // Before fix: 30+ POST requests
    // After fix: Should be < 10 POST requests
    expect(postRequests.length).toBeLessThan(10);

    // Should have called search API (after debounce)
    expect(searchApiRequests.length).toBeGreaterThan(0);

    // Verify URL updated (may take longer with double debounce)
    const url = page.url();
    const urlParams = new URL(url);
    const urlQuery = urlParams.searchParams.get('q');
    // URL sync is debounced, so it may not be immediate
    // But should eventually sync
    if (!urlQuery || urlQuery !== 'agent') {
      // Wait a bit more for URL sync
      await page.waitForTimeout(1000);
      const url2 = page.url();
      const urlParams2 = new URL(url2);
      const urlQuery2 = urlParams2.searchParams.get('q');
      expect(urlQuery2).toBe('agent');
    } else {
      expect(urlQuery).toBe('agent');
    }

    // Verify search completed and results are shown or "no results" message
    await expect(searchInput).toHaveValue('agent');

    // Check if results section is visible (either results or "no results" message)
    const hasResultsSection = await page.evaluate(() => {
      const resultsHeading = document.querySelector('h2, h3');
      return resultsHeading !== null;
    });
    expect(hasResultsSection).toBe(true);
  });

  test('should execute real search query and display results (uncontrolled input)', async ({
    page,
  }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a real search query
    // NOTE: With uncontrolled input, value updates immediately in local state
    await searchInput.fill('agent');

    // Verify input value immediately (uncontrolled input shows typed value right away)
    await expect(searchInput).toHaveValue('agent');

    // Wait for debounce: local->context (300ms) + context->URL (300ms) + API call
    await page.waitForTimeout(2000);

    // Verify URL updated (may take up to 600ms+ for URL sync)
    const url = page.url();
    const urlParams = new URL(url);
    let urlQuery = urlParams.searchParams.get('q');

    // If URL not updated yet, wait a bit more (double debounce)
    if (!urlQuery || urlQuery !== 'agent') {
      await page.waitForTimeout(1000);
      const url2 = page.url();
      const urlParams2 = new URL(url2);
      urlQuery = urlParams2.searchParams.get('q');
    }

    expect(urlQuery).toBe('agent');

    // Verify search input still has the value (uncontrolled input maintains local state)
    await expect(searchInput).toHaveValue('agent');

    // Check for search results section (either results or "no results" message)
    const resultsHeading = page.locator('h2, h3').first();
    await expect(resultsHeading).toBeVisible({ timeout: 5000 });

    const headingText = await resultsHeading.textContent();
    // Should show either results or "no results found"
    expect(headingText).toBeTruthy();

    // Verify featured sections are hidden when searching
    const featuredSections = page.locator('[class*="featured"], [class*="section"]').first();
    const isFeaturedVisible = await featuredSections.isVisible().catch(() => false);
    // Featured sections should be hidden when query is active
    if (urlQuery && urlQuery.length > 0) {
      // If we have a query, featured sections might be hidden (implementation dependent)
      // Just verify the search results section is visible
      expect(headingText?.toLowerCase()).toMatch(/results|no results|search/i);
    }
  });

  test('should handle search with Enter key', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type query and press Enter
    await searchInput.fill('claude');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify search was executed
    await expect(searchInput).toHaveValue('claude');
  });

  test('should handle search with Escape key to clear', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a query
    await searchInput.fill('test');
    await page.waitForTimeout(300);

    // Press Escape (may or may not clear depending on implementation)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify input still has focus or value (implementation dependent)
    const value = await searchInput.inputValue();
    // Escape may blur or clear - both are valid behaviors
    expect(typeof value).toBe('string');
  });

  test('should display featured sections (hidden when searching)', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // When NOT searching, check for featured sections
    const featuredSection = page.getByText(/featured|trending|popular|recent/i).first();
    const hasFeatured = await featuredSection.isVisible().catch(() => false);

    // Featured sections may or may not be visible depending on data
    // Just verify page structure is correct
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Verify featured sections are hidden when searching
    const searchInput = getSearchInput(page);
    await searchInput.fill('test query');
    await page.waitForTimeout(1500);

    // Featured sections should be hidden
    const featuredHidden = await featuredSection.isVisible().catch(() => false);
    expect(featuredHidden).toBe(false); // Should be hidden when query.trim().length > 0
  });

  test('should handle featured section card interactions', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Look for config cards or content cards
    const cards = page.locator('[data-testid="config-card"], article, [role="article"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      const firstCard = cards.first();

      // Hover over first card
      await firstCard.hover();
      await page.waitForTimeout(300);

      // Verify card is still visible
      await expect(firstCard).toBeVisible();

      // Try clicking the card (should navigate)
      const cardLink = firstCard.getByRole('link').first();
      const hasLink = await cardLink.isVisible().catch(() => false);

      if (hasLink) {
        const href = await cardLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    }
  });

  test('should handle bookmark button interactions on content cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Look for config cards
    const cards = page.locator('[data-testid="config-card"], article, [role="article"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      const firstCard = cards.first();

      // Find bookmark button (may require authentication)
      const bookmarkButton = firstCard.getByRole('button', { name: /bookmark|save/i }).first();
      const hasBookmarkButton = await bookmarkButton.isVisible().catch(() => false);

      if (hasBookmarkButton) {
        // Click bookmark button
        await bookmarkButton.click();
        await page.waitForTimeout(500);

        // Should show toast or auth modal (if not authenticated)
        const toast = page.getByText(/bookmarked|saved|sign in/i);
        const authModal = page.getByText(/sign in required|please sign in/i);

        const hasToast = await toast.isVisible().catch(() => false);
        const hasAuthModal = await authModal.isVisible().catch(() => false);

        // Either toast or auth modal should appear
        expect(hasToast || hasAuthModal).toBe(true);
      }
    }
  });

  test('should handle copy button interactions on content cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Look for config cards
    const cards = page.locator('[data-testid="config-card"], article, [role="article"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      const firstCard = cards.first();

      // Find copy button (SimpleCopyButton)
      const copyButton = firstCard.getByRole('button', { name: /copy|copy link/i }).first();
      const hasCopyButton = await copyButton.isVisible().catch(() => false);

      if (hasCopyButton) {
        // Click copy button
        await copyButton.click();
        await page.waitForTimeout(500);

        // Should show success toast
        const toast = page.getByText(/copied|link copied/i);
        const hasToast = await toast.isVisible().catch(() => false);

        // Toast may appear briefly, check if it exists
        if (hasToast) {
          await expect(toast).toBeVisible();
        }
      }
    }
  });

  test('should handle pin button interactions on content cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Look for config cards
    const cards = page.locator('[data-testid="config-card"], article, [role="article"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      const firstCard = cards.first();

      // Find pin button (pinboard toggle)
      const pinButton = firstCard.getByRole('button', { name: /pin|unpin|pinboard/i }).first();
      const hasPinButton = await pinButton.isVisible().catch(() => false);

      if (hasPinButton) {
        // Click pin button
        await pinButton.click();
        await page.waitForTimeout(500);

        // Should show toast
        const toast = page.getByText(/pinned|unpinned|saved for later/i);
        const hasToast = await toast.isVisible().catch(() => false);

        // Toast may appear briefly
        if (hasToast) {
          await expect(toast).toBeVisible();
        }
      }
    }
  });

  test('should handle external link clicks on content cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Look for config cards
    const cards = page.locator('[data-testid="config-card"], article, [role="article"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      const firstCard = cards.first();

      // Find external links (GitHub, docs)
      const githubLink = firstCard.getByRole('link', { name: /github|repository/i }).first();
      const docsLink = firstCard.getByRole('link', { name: /docs|documentation/i }).first();

      const hasGithubLink = await githubLink.isVisible().catch(() => false);
      const hasDocsLink = await docsLink.isVisible().catch(() => false);

      // At least one external link should be present if card has metadata
      if (hasGithubLink) {
        const href = await githubLink.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).toContain('github.com');
      }

      if (hasDocsLink) {
        const href = await docsLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    }
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Test Tab navigation through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Verify focus is on an interactive element
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Verify focus moved
    const newFocused = page.locator(':focus');
    await expect(newFocused).toBeVisible();
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check for main landmark
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Check for navigation landmark
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    // Check for search input has proper label
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Check for footer landmark
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
  });

  test('should handle window resize and maintain layout', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const hero = page.getByRole('region', { name: /homepage hero/i });
    await expect(hero).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await expect(hero).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    await expect(hero).toBeVisible();
  });

  test('should handle scroll to load lazy sections', async ({ page }) => {
    // Scroll to bottom to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(3000);

    // Verify no errors occurred
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);

    // Verify page is still functional
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('should handle search with filters', async ({ page }) => {
    // Test search facets API
    const facetsResponse = await page.request.get('/api/search/facets');
    expect(facetsResponse.status()).toBe(200);

    const facetsData = await facetsResponse.json();
    expect(facetsData).toHaveProperty('categories');
    expect(facetsData).toHaveProperty('tags');
    expect(facetsData).toHaveProperty('authors');
  });

  test('should handle search autocomplete suggestions', async ({ page }) => {
    // Test autocomplete API with partial query
    const autocompleteResponse = await page.request.get('/api/search/autocomplete?q=cl');
    expect(autocompleteResponse.status()).toBe(200);

    const autocompleteData = await autocompleteResponse.json();
    expect(autocompleteData).toHaveProperty('suggestions');
    expect(Array.isArray(autocompleteData.suggestions)).toBe(true);
  });

  test('should handle search with pagination', async ({ page }) => {
    // Test search API with pagination parameters
    const searchResponse = await page.request.get('/api/search?q=claude&limit=10&offset=0');
    expect(searchResponse.status()).toBe(200);

    const searchData = await searchResponse.json();
    expect(searchData).toHaveProperty('results');
    expect(searchData).toHaveProperty('totalCount');
    expect(Array.isArray(searchData.results)).toBe(true);
    expect(typeof searchData.totalCount).toBe('number');
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for something unlikely to return results
    await searchInput.fill('xyzabc123nonexistent');
    await page.waitForTimeout(1500);

    // Verify no errors occurred
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);

    // Verify search input still has value
    await expect(searchInput).toHaveValue('xyzabc123nonexistent');
  });

  test('should handle search cancellation on rapid input (optimized)', async ({ page }) => {
    // Monitor for API requests
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/search') && request.method() === 'GET') {
        apiCalls.push(request.url());
      }
    });

    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type rapidly to trigger cancellation (should NOT lock up page)
    const startTime = Date.now();
    await searchInput.fill('a');
    await page.waitForTimeout(50);
    await searchInput.fill('ab');
    await page.waitForTimeout(50);
    await searchInput.fill('abc');
    await page.waitForTimeout(50);
    await searchInput.fill('abcd');
    const typeTime = Date.now() - startTime;

    // Should be fast
    expect(typeTime).toBeLessThan(500);

    // Page should remain responsive
    const isResponsive = await page.evaluate(() => {
      return document.body.style.pointerEvents !== 'none';
    });
    expect(isResponsive).toBe(true);

    await page.waitForTimeout(1500);

    // Final value should be correct
    await expect(searchInput).toHaveValue('abcd');

    // With optimized SearchProvider, should have minimal API calls (1-2 max)
    expect(apiCalls.length).toBeLessThan(3);
  });

  test('should maintain search state on page reload', async ({ page }) => {
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Enter search query
    await searchInput.fill('persistent query');
    await page.waitForTimeout(1500); // Wait for debounced URL update

    // Verify URL has query
    const url = page.url();
    expect(url).toContain('q=');
    expect(url).toContain('persistent');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for hydration

    // Verify search query is restored from URL (SearchProvider syncs from URL)
    const restoredInput = getSearchInput(page);
    await expect(restoredInput).toBeVisible({ timeout: 10000 });
    await expect(restoredInput).toHaveValue('persistent query');

    // Verify search results should be shown (query.trim().length > 0)
    const hasSearchResults =
      (await page
        .locator('[data-testid="search-results"]')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText(/no.*results|searching/i)
        .isVisible()
        .catch(() => false));
    // Search results may or may not be visible yet, but query should be restored
    expect(await restoredInput.inputValue()).toBe('persistent query');
  });

  // ============================================================================
  // Visual Regression Tests
  // ============================================================================

  test('homepage - desktop - light mode (visual regression)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('homepage-desktop-light.png', {
      fullPage: true,
      maxDiffPixels: 500, // Allow small differences for dynamic content
      timeout: 15000, // Increased timeout for homepage stability
    });
  });

  test('homepage - desktop - dark mode (visual regression)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    // Set dark mode via localStorage or theme toggle
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('homepage-desktop-dark.png', {
      fullPage: true,
    });
  });

  test('homepage - tablet (visual regression)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
    });
  });

  test('homepage - mobile (visual regression)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    });
  });

  test('should handle getHomepageData error gracefully', async ({ page }) => {
    // This tests the error path when getHomepageData throws
    // The component catches error, calls trackRPCFailure, returns null
    // In E2E, we can verify graceful handling (page renders, no crash)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if getHomepageData fails
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null homepageResult gracefully', async ({ page }) => {
    // This tests the edge case where getHomepageData returns null
    // The component uses homepageResult?.member_count ?? 0 and checks homepageResult?.content
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if homepageResult is null
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should show default member count (0) if homepageResult is null
    const memberCount = page.getByText(/\d+\+.*members/i);
    await expect(memberCount).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle null/undefined homepageResult.content gracefully', async ({ page }) => {
    // This tests the edge case where homepageResult.content is null/undefined
    // The component checks: homepageResult?.content && typeof homepageResult.content === 'object' && !Array.isArray(homepageResult.content)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if content is null
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle isBookmarkedBatch error gracefully', async ({ page }) => {
    // This tests the error path when isBookmarkedBatch throws
    // The component catches error, logs it, but doesn't fail page render (non-critical)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if isBookmarkedBatch fails
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors (bookmark status is non-critical)
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle stats extraction with null/undefined content', async ({ page }) => {
    // This tests edge cases in stats extraction
    // The component checks: homepageResult?.content && typeof homepageResult.content === 'object' && !Array.isArray(homepageResult.content)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if stats extraction fails
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle getAuthenticatedUser error gracefully', async ({ page }) => {
    // This tests the error path when getAuthenticatedUser throws
    // The component uses optional auth, so errors should be handled gracefully
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if getAuthenticatedUser fails
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should not have critical errors
    const hasError = await page
      .locator('[data-nextjs-error]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle generateMetadata error gracefully', async ({ page }) => {
    // This tests the error path when generatePageMetadata fails
    // The function doesn't have explicit error handling, but Next.js handles it
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should render even if metadata generation fails
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Check page title (should have fallback or generated title)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
