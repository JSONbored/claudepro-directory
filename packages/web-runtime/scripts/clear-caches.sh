#!/bin/bash
# Clear all caches for Next.js development
# This script clears:
# - .next directory (Next.js build cache)
# - .turbo directory (Turbopack cache)
# - node_modules/.cache (Node.js cache)
# - Service worker caches (via browser automation instructions)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root (assuming script is in packages/web-runtime/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WEB_APP_DIR="$PROJECT_ROOT/apps/web"

echo -e "${YELLOW}Clearing all development caches...${NC}"

# Clear .next directory
if [ -d "$WEB_APP_DIR/.next" ]; then
	echo -e "${YELLOW}Removing .next directory...${NC}"
	rm -rf "$WEB_APP_DIR/.next"
	echo -e "${GREEN}✓ Cleared .next directory${NC}"
else
	echo -e "${GREEN}✓ .next directory not found (already clean)${NC}"
fi

# Clear .turbo directory
if [ -d "$PROJECT_ROOT/.turbo" ]; then
	echo -e "${YELLOW}Removing .turbo directory...${NC}"
	rm -rf "$PROJECT_ROOT/.turbo"
	echo -e "${GREEN}✓ Cleared .turbo directory${NC}"
else
	echo -e "${GREEN}✓ .turbo directory not found (already clean)${NC}"
fi

# Clear node_modules/.cache
if [ -d "$PROJECT_ROOT/node_modules/.cache" ]; then
	echo -e "${YELLOW}Removing node_modules/.cache...${NC}"
	rm -rf "$PROJECT_ROOT/node_modules/.cache"
	echo -e "${GREEN}✓ Cleared node_modules/.cache${NC}"
else
	echo -e "${GREEN}✓ node_modules/.cache not found (already clean)${NC}"
fi

# Clear app-specific node_modules/.cache
if [ -d "$WEB_APP_DIR/node_modules/.cache" ]; then
	echo -e "${YELLOW}Removing apps/web/node_modules/.cache...${NC}"
	rm -rf "$WEB_APP_DIR/node_modules/.cache"
	echo -e "${GREEN}✓ Cleared apps/web/node_modules/.cache${NC}"
else
	echo -e "${GREEN}✓ apps/web/node_modules/.cache not found (already clean)${NC}"
fi

# Note about service worker caches
echo -e "${YELLOW}Service Worker Cache Clearing:${NC}"
echo -e "${YELLOW}Service worker caches are browser-specific and cannot be cleared via script.${NC}"
echo -e "${YELLOW}To clear service worker caches:${NC}"
echo -e "  1. Open browser DevTools (F12)"
echo -e "  2. Go to Application tab → Service Workers"
echo -e "  3. Click 'Unregister' for the service worker"
echo -e "  4. Go to Application tab → Storage → Clear site data"
echo -e "  5. Or use: navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))"
echo -e "  6. Then: caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))"

echo -e "\n${GREEN}✓ Cache clearing complete!${NC}"
echo -e "${YELLOW}Note: Service worker caches must be cleared manually in the browser.${NC}"
