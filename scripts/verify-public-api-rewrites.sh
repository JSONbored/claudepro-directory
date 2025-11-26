#!/bin/bash
# Sanity-check that public-api edge function exists and rewrites are configured correctly

set -e

echo "=== Searching for public-api edge implementations ==="
if command -v fd &> /dev/null; then
  fd -t f "public-api" supabase apps/edge || true
else
  echo "fd not found, using find instead..."
  find supabase apps/edge -type f -name "*public-api*" 2>/dev/null || true
fi

echo
echo "=== Confirming rewrites to public-api in web config ==="
if command -v rg &> /dev/null; then
  rg -n "public-api" apps/web/next.config.mjs || true
else
  echo "rg not found, using grep instead..."
  grep -n "public-api" apps/web/next.config.mjs || true
fi

echo
echo "=== Verification complete ==="
echo "NOTE: These rewrites depend on the public-api Supabase edge function being deployed."
echo "If the public-api function (and its internal routes /content, /sitemap.xml, /feeds, plus category exports)"
echo "is not already deployed and wired up, these endpoints will return 404s."
echo "Ensure deployment before merging changes to the rewrites section."
