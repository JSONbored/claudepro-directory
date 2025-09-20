#!/usr/bin/env node

import fs from 'fs';

// Get file paths from command line arguments
const files = process.argv.slice(2);

if (files.length === 0) {
  process.exit(0);
}

let hasErrors = false;

// All content types now use slug-based schema
const requiredFields = ['slug', 'description', 'category', 'author', 'dateAdded'];

// Valid categories
const validCategories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];

// Validate date format (YYYY-MM-DD)
function isValidDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !Number.isNaN(date);
}

// Validate each file
files.forEach((filePath) => {
  try {
    // Read and parse JSON file
    const content = fs.readFileSync(filePath, 'utf8');
    let data;

    try {
      data = JSON.parse(content);
    } catch (e) {
      console.error(`ERROR: Invalid JSON in ${filePath}`);
      console.error(e.message);
      hasErrors = true;
      return;
    }

    // Check required fields (all content types now use slug-based schema)
    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`ERROR: Missing required field '${field}' in ${filePath}`);
        hasErrors = true;
      }
    }

    // Validate date format
    if (data.dateAdded && !isValidDate(data.dateAdded)) {
      console.error(`ERROR: Invalid date format in ${filePath} (should be YYYY-MM-DD)`);
      hasErrors = true;
    }

    // Validate category
    if (data.category && !validCategories.includes(data.category)) {
      console.error(`ERROR: Invalid category '${data.category}' in ${filePath}`);
      console.error(`Valid categories are: ${validCategories.join(', ')}`);
      hasErrors = true;
    }

    // Validate tags is an array
    if (data.tags && !Array.isArray(data.tags)) {
      console.error(`ERROR: 'tags' field must be an array in ${filePath}`);
      hasErrors = true;
    }

    // Category-specific validation
    switch (data.category) {
      case 'mcp':
        if (!data.protocol && !data.github) {
          console.warn(`WARNING: MCP server in ${filePath} has no protocol or github URL`);
        }
        break;
      case 'commands':
        if (!data.syntax) {
          console.warn(`WARNING: Command in ${filePath} has no syntax field`);
        }
        break;
      case 'hooks':
        if (!data.event) {
          console.warn(`WARNING: Hook in ${filePath} has no event field`);
        }
        break;
    }

    if (!hasErrors) {
    }
  } catch (error) {
    console.error(`ERROR: Failed to process ${filePath}`);
    console.error(error.message);
    hasErrors = true;
  }
});

// Exit with error code if validation failed
if (hasErrors) {
  console.error('\n❌ Content validation failed');
  process.exit(1);
} else {
  process.exit(0);
}
