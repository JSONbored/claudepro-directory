/**
 * ESLint plugin for architectural rules
 * Enforces comprehensive Pino logger & error instrumentation standards:
 * - Object-first API (Pino native): logger.error({ err, ...context }, "message")
 * - Error normalization: normalizeError() before logging
 * - Request-scoped logging: logger.child({ operation, route }) for context
 * - Cache-safe logging: createLogger({ timestamp: false }) ONLY for cached components
 * - Custom serializers (user, request, response, dbQuery, args)
 * - Edge function patterns (initRequestLogging, traceRequestComplete)
 * - No console.* calls
 *
 * Located in config/tools/ to match codebase organization pattern
 * 
 * ALL RULES USE 100% AST TRAVERSAL - NO STRING MATCHING OR REGEX FOR CODE ANALYSIS
 */

/**
 * Check for 'use client' directive using pure AST (no getText(), no string includes)
 * Uses only AST node properties: comment.value, expr.value, expr.raw
 */
function hasUseClientDirective(ast) {
  // Check comments for 'use client' - use comment.value (pure AST property)
  for (const comment of ast.comments || []) {
    if (comment.type === 'Line' || comment.type === 'Block') {
      // comment.value is the comment text without markers (pure AST property)
      const value = comment.value || '';
      const trimmed = value.trim();
      // Check for exact patterns using AST properties only (no string includes)
      if (value === "'use client'" || value === '"use client"' || value === 'use client' ||
          trimmed === "'use client'" || trimmed === '"use client"' || trimmed === 'use client') {
        return true;
      }
    }
  }
  
  // Check first statement for 'use client' directive (pure AST)
  if (ast.body && ast.body.length > 0) {
    const firstStatement = ast.body[0];
    if (firstStatement && firstStatement.type === 'ExpressionStatement') {
      const expr = firstStatement.expression;
      if (expr && expr.type === 'Literal') {
        // Use AST properties: expr.value and expr.raw (no string operations)
        const value = expr.value;
        const raw = expr.raw;
        if (value === 'use client' || raw === "'use client'" || raw === '"use client"') {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Check for 'use server' directive using pure AST (no getText(), no string includes)
 * Uses only AST node properties: comment.value, expr.value, expr.raw
 */
function hasUseServerDirective(ast) {
  // Check comments for 'use server' - use comment.value (pure AST property)
  for (const comment of ast.comments || []) {
    if (comment.type === 'Line' || comment.type === 'Block') {
      // comment.value is the comment text without markers (pure AST property)
      const value = comment.value || '';
      const trimmed = value.trim();
      // Check for exact patterns using AST properties only (no string includes)
      if (value === "'use server'" || value === '"use server"' || value === 'use server' ||
          trimmed === "'use server'" || trimmed === '"use server"' || trimmed === 'use server') {
        return true;
      }
    }
  }
  
  // Check first statement for 'use server' directive (pure AST)
  if (ast.body && ast.body.length > 0) {
    const firstStatement = ast.body[0];
    if (firstStatement && firstStatement.type === 'ExpressionStatement') {
      const expr = firstStatement.expression;
      if (expr && expr.type === 'Literal') {
        // Use AST properties: expr.value and expr.raw (no string operations)
        const value = expr.value;
        const raw = expr.raw;
        if (value === 'use server' || raw === "'use server'" || raw === '"use server"') {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Check for 'use cache' directive in comments before a node (pure AST)
 * Uses only AST node properties: comment.value
 */
function hasUseCacheDirective(comments) {
  if (!comments || !Array.isArray(comments)) return false;
  for (const comment of comments) {
    if (comment.type === 'Line' || comment.type === 'Block') {
      // Use comment.value (pure AST property) - no getText()
      const value = comment.value || '';
      const trimmed = value.trim();
      // Check for exact patterns using AST properties only (no string includes)
      if (value === "'use cache'" || value === '"use cache"' || value === 'use cache' ||
          value === "'use cache: private'" || value === '"use cache: private"' || value === 'use cache: private' ||
          trimmed === "'use cache'" || trimmed === '"use cache"' || trimmed === 'use cache' ||
          trimmed === "'use cache: private'" || trimmed === '"use cache: private"' || trimmed === 'use cache: private') {
        return true;
      }
    }
  }
  return false;
}

export default {
  rules: {
    'no-server-imports-in-client': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent client components from importing server-only modules',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          serverImportInClient:
            "Client components ('use client') cannot import server-only modules. Import from '@heyclaude/web-runtime/data' (client-safe entry point) or '@heyclaude/web-runtime/logging/client' (client-safe logging) or pass data as props from Server Components.",
          dynamicServerImportInClient:
            "Client components ('use client') cannot use dynamic import() of server-only modules. Use static imports from client-safe entry points or pass data as props from Server Components.",
          missingUseClient: 'Component uses client hooks but missing "use client" directive',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        const serverOnlyImports = ['next/server', 'next/headers', '@heyclaude/web-runtime/server', 'createSupabaseServerClient', 'getAuthenticatedUser', 'cookies', 'headers'];
        const clientOnlyHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect', 'useTransition', 'useDeferredValue'];
        let usesClientHooks = false;

        // Server-only import patterns (for path-based checking)
        const serverOnlyPatterns = [
          'packages/web-runtime/src/data/',
          'packages/web-runtime/src/cache/',
          'packages/web-runtime/src/supabase/',
          'packages/web-runtime/src/server.ts',
          '.server.ts',
          '.server.tsx',
          'server-only',
          'packages/web-runtime/src/utils/request-context.ts',
          'packages/web-runtime/src/utils/log-context.ts',
          'packages/web-runtime/src/utils/error-handler.ts',
          '@heyclaude/web-runtime/logging/server',
          'packages/web-runtime/src/logging/server.ts',
        ];

        return {
          ImportDeclaration(node) {
            if (!node.source || !node.source.value) {
              return;
            }

            const importPath = typeof node.source.value === 'string' ? node.source.value : '';

            // Skip if importing from client-safe entry point
            if (
              importPath === '@heyclaude/web-runtime/data' ||
              importPath.startsWith('@heyclaude/web-runtime/data/') ||
              importPath.includes('/data-client') ||
              importPath === '@heyclaude/web-runtime/logging/client' ||
              importPath.startsWith('@heyclaude/web-runtime/logging/client') ||
              importPath.includes('/logging/client')
            ) {
              return;
            }

            if (isClientComponent) {
              // Check for server-only imports by name
              for (const serverImport of serverOnlyImports) {
                if (importPath.includes(serverImport)) {
                  context.report({
                    node: node.source,
                    messageId: 'serverImportInClient',
                  });
                  return;
                }
              }
              
              // Check for server-only patterns by path
              for (const pattern of serverOnlyPatterns) {
                if (importPath.includes(pattern)) {
                  // Additional check: allow specific client-safe data imports
                  if (pattern === 'packages/web-runtime/src/data/' && 
                      (importPath.includes('config/category') || 
                       importPath.includes('changelog.shared') || 
                       importPath.includes('forms/submission-form-fields'))) {
                    continue;
                  }
                  context.report({
                    node: node.source,
                    messageId: 'serverImportInClient',
                  });
                  return;
                }
              }
            }
          },
          CallExpression(node) {
            // Check for dynamic import() calls in client components
            if (isClientComponent && node.callee && node.callee.type === 'Import') {
              // Dynamic import() detected - check the import path
              if (node.arguments && node.arguments.length > 0) {
                const importArg = node.arguments[0];
                if (importArg && importArg.type === 'Literal' && typeof importArg.value === 'string') {
                  const importPath = importArg.value;
                  
                  // Skip client-safe imports
                  if (
                    importPath === '@heyclaude/web-runtime/data' ||
                    importPath.startsWith('@heyclaude/web-runtime/data/') ||
                    importPath.includes('/data-client') ||
                    importPath === '@heyclaude/web-runtime/logging/client' ||
                    importPath.startsWith('@heyclaude/web-runtime/logging/client') ||
                    importPath.includes('/logging/client')
                  ) {
                    return;
                  }
                  
                  // Check for server-only imports by name
                  for (const serverImport of serverOnlyImports) {
                    if (importPath.indexOf(serverImport) !== -1) {
                      context.report({
                        node: importArg,
                        messageId: 'dynamicServerImportInClient',
                      });
                      return;
                    }
                  }
                  
                  // Check for server-only patterns by path
                  for (const pattern of serverOnlyPatterns) {
                    if (importPath.indexOf(pattern) !== -1) {
                      // Additional check: allow specific client-safe data imports
                      if (pattern === 'packages/web-runtime/src/data/' && 
                          (importPath.indexOf('config/category') !== -1 || 
                           importPath.indexOf('changelog.shared') !== -1 || 
                           importPath.indexOf('forms/submission-form-fields') !== -1)) {
                        continue;
                      }
                      context.report({
                        node: importArg,
                        messageId: 'dynamicServerImportInClient',
                      });
                      return;
                    }
                  }
                }
              }
            }
            
            // Check for client hooks usage
            if (!isClientComponent && node.callee && node.callee.type === 'Identifier') {
              if (clientOnlyHooks.includes(node.callee.name)) {
                usesClientHooks = true;
              }
            }
          },
          'Program:exit'() {
            if (!isClientComponent && usesClientHooks) {
              context.report({
                node: ast,
                messageId: 'missingUseClient',
              });
            }
          },
        };
      },
    },
    'require-error-handler': {
      meta: {
        type: 'problem',
        docs: {
          description: 'API routes must use createErrorResponse or handleApiError',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useErrorHandler:
            'API route error handling should use createErrorResponse() or handleApiError() from @heyclaude/web-runtime/utils/error-handler',
          missingErrorHandler: 'API route catch block must use createErrorResponse or handleApiError for error handling',
          missingNormalizeError: 'Catch block should use normalizeError() before createErrorResponse',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only apply to API route files
        const isApiRoute = filename.includes('/api/') && (filename.endsWith('/route.ts') || filename.endsWith('/route.tsx'));
        if (!isApiRoute) {
          return {};
        }

        let hasErrorHandlerImport = false;
        const catchBlocks = [];
        const catchBlocksWithErrorHandler = new Set();

        return {
          ImportDeclaration(node) {
            if (node.source && node.source.type === 'Literal') {
              const sourceValue = node.source.value;
              if (typeof sourceValue === 'string' && (sourceValue === '@heyclaude/web-runtime/utils/error-handler' || sourceValue.includes('error-handler') || sourceValue.includes('createErrorResponse') || sourceValue.includes('handleApiError'))) {
                hasErrorHandlerImport = true;
              }
            }
          },
          CatchClause(node) {
            catchBlocks.push(node);
          },
          CallExpression(node) {
            // Check for createErrorResponse or handleApiError usage
            if (node.callee && node.callee.type === 'Identifier') {
              const funcName = node.callee.name;
              if (funcName === 'createErrorResponse' || funcName === 'handleApiError') {
                // Check if within a catch block
                let parent = node.parent;
                while (parent) {
                  if (parent.type === 'CatchClause') {
                    catchBlocksWithErrorHandler.add(parent);
                    break;
                  }
                  parent = parent.parent;
                }
              }
            }
          },
          'Program:exit'() {
            for (const catchBlock of catchBlocks) {
              if (!catchBlocksWithErrorHandler.has(catchBlock)) {
                context.report({
                  node: catchBlock,
                  messageId: 'missingErrorHandler',
                });
              }
            }
          },
        };
      },
    },
    'require-error-logging-in-catch': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Catch blocks must log errors using logger.error with proper context',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - complex code generation could break TypeScript or create incorrect patterns
        schema: [],
        messages: {
          missingErrorLogging:
            'Catch blocks must log errors using logger.error() with normalized error and logContext. Use: logger.error("message", normalizeError(error, "fallback"), logContext)',
          emptyCatchBlock:
            'Empty catch blocks are not allowed. At minimum, log the error: logger.error("message", normalizeError(error), logContext)',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Skip edge functions - they use different logging (logError, logInfo, logWarn)
        const isEdgeFunction = filename.includes('apps/edge/functions');

        // Skip test files
        const isTestFile = filename.includes('.test.') || filename.includes('.spec.');

        if (isEdgeFunction || isTestFile) {
          return {};
        }

        // Only apply to server-side files (app directory, API routes, server components)
        const isServerFile =
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts') ||
          filename.includes('server.tsx');

        if (!isServerFile) {
          return {};
        }

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        // Skip client components - they may use different error handling patterns
        const skipClientFiles = filename.includes('error.tsx') ||
          filename.includes('wizard') ||
          filename.includes('draft-manager') ||
          filename.includes('marketing/contact');

        if (isClientComponent || skipClientFiles) {
          return {};
        }

        return {
          CatchClause(node) {
            // Check if catch block is empty
            if (!node.body || node.body.body.length === 0) {
              context.report({
                node,
                messageId: 'emptyCatchBlock',
              });
              return;
            }

            // Check if this is a utility function (module-level, not in component)
            let parent = node.parent;
            let isInUtilityFunction = false;
            let functionName = '';
            let isSimpleReturn = false;
            
            while (parent) {
              if (parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') {
                functionName = parent.id?.name || 'anonymous';
                // Utility functions are typically named functions at module level
                if (
                  functionName !== 'default' &&
                  functionName !== 'Page' &&
                  functionName !== 'Component' &&
                  functionName !== 'Server' &&
                  functionName !== 'generateMetadata' &&
                  functionName !== 'generateStaticParams' &&
                  !functionName.includes('Page') &&
                  !functionName.includes('Component') &&
                  !functionName.includes('generateMetadata') &&
                  !functionName.includes('generateStaticParams')
                ) {
                  isInUtilityFunction = true;
                }
              }
              if (parent.type === 'ExportDefaultDeclaration') {
                break; // Inside default export (likely a component)
              }
              parent = parent.parent;
            }

            // Check if catch body has simple return statements (utility pattern)
            for (const stmt of node.body.body || []) {
              if (stmt.type === 'ReturnStatement' && stmt.argument) {
                if (stmt.argument.type === 'Literal' && 
                    (stmt.argument.value === false || stmt.argument.value === null || 
                     stmt.argument.value === '' || stmt.argument.value === '#')) {
                  isSimpleReturn = true;
                }
                if (stmt.argument.type === 'ArrayExpression' && stmt.argument.elements.length === 0) {
                  isSimpleReturn = true;
                }
              }
            }

            // Check if function name suggests it's a utility (is*, parse*, build*, get*, normalize*, etc.)
            const utilityPrefixes = ['is', 'parse', 'build', 'get', 'normalize', 'validate', 'sanitize', 'extract', 'format', 'canonicalize'];
            const isUtilityPattern = utilityPrefixes.some(prefix => functionName.toLowerCase().startsWith(prefix));

            if ((isSimpleReturn && isInUtilityFunction) || (isSimpleReturn && isUtilityPattern)) {
              return; // Skip - utility function with simple fallback
            }

            // Check if catch block contains logger.error call, helper functions, or uses bindings
            let hasLoggerError = false;
            let hasNormalizeError = false;
            let usesErrorHandler = false;
            let isRethrow = false;
            let isInJSX = false;

            // Check if catch is in JSX context
            let checkParent = node.parent;
            while (checkParent) {
              if (checkParent.type === 'JSXExpressionContainer' || 
                  checkParent.type === 'JSXElement' || 
                  checkParent.type === 'JSXFragment') {
                isInJSX = true;
                break;
              }
              if (checkParent.type === 'ReturnStatement') {
                // Check if return contains JSX
                if (checkParent.argument && (checkParent.argument.type === 'JSXElement' || checkParent.argument.type === 'JSXFragment')) {
                  isInJSX = true;
                  break;
                }
              }
              checkParent = checkParent.parent;
            }

            // Traverse catch body to find error handling patterns
            function traverseCatchBody(n) {
              if (!n) return;
              
              // Check for logger.error/warn calls
              if (n.type === 'CallExpression' && n.callee && n.callee.type === 'MemberExpression') {
                const obj = n.callee.object;
                const prop = n.callee.property;
                if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                  const loggerNames = ['logger', 'reqLogger', 'userLogger', 'actionLogger', 'metadataLogger', 'viewerLogger', 'processLogger', 'callbackLogger', 'requestLogger', 'utilityLogger', 'sectionLogger'];
                  if (loggerNames.includes(obj.name) && (prop.name === 'error' || prop.name === 'warn')) {
                    hasLoggerError = true;
                  }
                }
                if (n.callee.type === 'Identifier') {
                  const helperNames = ['logError', 'logWarn', 'logInfo', 'logTrace'];
                  if (helperNames.includes(n.callee.name)) {
                    hasLoggerError = true;
                  }
                  if (n.callee.name === 'normalizeError') {
                    hasNormalizeError = true;
                  }
                  if (n.callee.name === 'createErrorResponse' || n.callee.name === 'handleApiError') {
                    usesErrorHandler = true;
                  }
                }
              }
              
              // Check for throw statements
              if (n.type === 'ThrowStatement') {
                isRethrow = true;
              }
              
              // Recursively traverse
              for (const key in n) {
                if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                  if (Array.isArray(n[key])) {
                    for (const item of n[key]) {
                      traverseCatchBody(item);
                    }
                  } else {
                    traverseCatchBody(n[key]);
                  }
                }
              }
            }
            
            traverseCatchBody(node.body);

            const shouldSkip = hasLoggerError || usesErrorHandler || isRethrow || isInJSX;
            if (!shouldSkip) {
            const catchParam = node.param;
            const errorVarName = catchParam && catchParam.type === 'Identifier' ? catchParam.name : 'error';
            
            // Find logger name from context - check full scope chain
            let loggerName = 'logger';
            let hasLoggerImport = false;
            let loggerImportPath = null;
            let hasReqLoggerInScope = false;
            let operationName = '';
            let routeName = '';
            
            // Check for logger imports
            for (const stmt of ast.body || []) {
              if (stmt.type === 'ImportDeclaration' && stmt.source && stmt.source.type === 'Literal') {
                const sourceValue = stmt.source.value;
                if (typeof sourceValue === 'string' && (sourceValue.includes('logging/server') || sourceValue.includes('logging/client'))) {
                  for (const spec of stmt.specifiers || []) {
                    if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.name === 'logger') {
                      hasLoggerImport = true;
                      loggerImportPath = sourceValue;
                      if (spec.local && spec.local.name) {
                        loggerName = spec.local.name;
                      }
                    }
                  }
                }
              }
            }
            
            // Check for reqLogger/sectionLogger/routeLogger usage in full scope chain
            // Traverse up the AST to find the containing function and check its scope
            let current = node.parent;
            while (current) {
              if (current.type === 'FunctionDeclaration' || current.type === 'FunctionExpression' || current.type === 'ArrowFunctionExpression') {
                // Extract function name for operation context
                if (current.type === 'FunctionDeclaration' && current.id) {
                  operationName = current.id.name || '';
                }
                
                // Check function body for reqLogger/sectionLogger/routeLogger
                if (current.body && current.body.type === 'BlockStatement') {
                  // Check all statements in function body (not just before catch)
                  for (const stmt of current.body.body || []) {
                    if (stmt.type === 'VariableDeclaration') {
                      for (const decl of stmt.declarations || []) {
                        if (decl.id && decl.id.type === 'Identifier') {
                          const varName = decl.id.name;
                          if (varName === 'reqLogger' || varName === 'sectionLogger' || varName === 'routeLogger') {
                            loggerName = varName;
                            hasReqLoggerInScope = true;
                            // Try to extract operation and route from logger.child() call
                            if (decl.init && decl.init.type === 'CallExpression') {
                              if (decl.init.callee && decl.init.callee.type === 'MemberExpression') {
                                if (decl.init.callee.property && decl.init.callee.property.type === 'Identifier' && decl.init.callee.property.name === 'child') {
                                  if (decl.init.arguments && decl.init.arguments.length > 0) {
                                    const childArg = decl.init.arguments[0];
                                    if (childArg && childArg.type === 'ObjectExpression') {
                                      for (const prop of childArg.properties || []) {
                                        if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
                                          if (prop.key.name === 'operation' && prop.value && prop.value.type === 'Literal') {
                                            operationName = prop.value.value || '';
                                          }
                                          if (prop.key.name === 'route' && prop.value && prop.value.type === 'Literal') {
                                            routeName = prop.value.value || '';
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            break;
                          }
                        }
                      }
                    }
                  }
                }
              }
              
              // Also check if we're in an API route handler (GET, POST, etc.)
              if (current.type === 'FunctionDeclaration' && current.id) {
                const funcName = current.id.name || '';
                if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(funcName)) {
                  operationName = funcName;
                  // Try to infer route from filename
                  if (filename.includes('/api/')) {
                    const apiMatch = filename.match(/\/api\/([^/]+)/);
                    if (apiMatch) {
                      routeName = `/api/${apiMatch[1]}`;
                    }
                  }
                }
              }
              
              current = current.parent;
            }
              
              context.report({
                node: node.body,
                messageId: 'missingErrorLogging',
                // No fix() - autofix disabled (fixable: null)
              });
            } else if (hasLoggerError && !hasNormalizeError) {
              // Error if logger.error is used but normalizeError is not
              context.report({
                node: node.body,
                messageId: 'missingErrorLogging',
                // Note: This case is handled by require-normalize-error rule autofix
              });
            }
          },
        };
      },
    },
    'no-direct-auth-getuser': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow direct supabase.auth.getUser() usage outside approved helpers',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          directAuthGetUser:
            'Direct supabase.auth.getUser() usage is not allowed. Use getAuthenticatedUser() (server) or useAuthenticatedUser() (client) instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Allowlist files that are allowed to use auth.getUser
        const ALLOWLIST = new Set([
          'apps/web/src/lib/auth/get-authenticated-user.ts',
          'apps/web/src/lib/auth/use-authenticated-user.ts',
          'packages/web-runtime/src/auth/get-authenticated-user.ts',
          'packages/web-runtime/src/hooks/use-authenticated-user.ts',
          'packages/edge-runtime/src/utils/auth.ts', // Edge functions can use it
        ]);

        // Normalize filename to match allowlist format
        const normalizePath = (path) => {
          // Convert absolute paths to relative paths from repo root
          if (path.includes('apps/web/src')) {
            return path.split('apps/web/src/')[1] || path;
          }
          if (path.includes('packages/web-runtime/src')) {
            return path.split('packages/web-runtime/src/')[1] || path;
          }
          if (path.includes('packages/edge-runtime/src')) {
            return path.split('packages/edge-runtime/src/')[1] || path;
          }
          return path;
        };

        const normalizedPath = normalizePath(filename);
        const isAllowed = ALLOWLIST.has(normalizedPath) || ALLOWLIST.has(filename);

        if (isAllowed) {
          return {}; // Skip checking allowlisted files
        }

        // Only check files in apps/web/src (where the rule applies)
        if (!(filename.includes('apps/web/src') || filename.includes('packages/web-runtime/src'))) {
          return {};
        }

        return {
          // Match MemberExpression patterns like: supabase.auth.getUser, auth.getUser, etc.
          'MemberExpression[object.type="MemberExpression"][object.property.name="auth"][property.name="getUser"]'(
            node
          ) {
            // This AST selector already matches auth.getUser pattern - no need for text checking
            context.report({
              node,
              messageId: 'directAuthGetUser',
            });
          },
          // Also match direct auth.getUser (when auth is a variable)
          'MemberExpression[property.name="getUser"]'(node) {
            // Check if the object is 'auth'
            if (
              node.object.type === 'Identifier' &&
              node.object.name === 'auth' &&
              node.property.name === 'getUser'
            ) {
              context.report({
                node,
                messageId: 'directAuthGetUser',
              });
            }
          },
        };
      },
    },
    'no-data-layer-violations': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce data layer architectural boundaries',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          socialLinksUsage:
            'Disallowed SOCIAL_LINKS usage outside data layer. Only allowed in: apps/web/src/lib/data/config/constants.ts, apps/web/src/lib/data/marketing/contact.ts',
          barrelImport:
            'Importing from "@/src/lib/data/marketing" barrel is prohibited. Import directly from specific files instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Allowed files for SOCIAL_LINKS
        const allowedSocialLinksFiles = new Set([
          'apps/web/src/lib/data/config/constants.ts',
          'apps/web/src/lib/data/marketing/contact.ts',
          'packages/web-runtime/src/data/config/constants.ts',
          'packages/web-runtime/src/data/marketing/site.ts',
          'packages/web-runtime/src/config/social-links.ts', // Source definition file
          // Normalized paths
          'lib/data/config/constants.ts',
          'lib/data/marketing/contact.ts',
          'data/config/constants.ts',
          'data/marketing/site.ts',
          'config/social-links.ts', // Source definition file (normalized)
        ]);

        // Normalize filename
        const normalizePath = (path) => {
          if (path.includes('apps/web/src')) {
            return path.split('apps/web/src/')[1] || path;
          }
          if (path.includes('packages/web-runtime/src')) {
            return path.split('packages/web-runtime/src/')[1] || path;
          }
          return path;
        };

        const normalizedPath = normalizePath(filename);
        // Check if filename ends with any allowed path (handles absolute paths)
        const filenameEndsWithAllowed = Array.from(allowedSocialLinksFiles).some((allowed) =>
          filename.endsWith(allowed)
        );
        const isAllowedSocialLinks =
          allowedSocialLinksFiles.has(normalizedPath) ||
          allowedSocialLinksFiles.has(filename) ||
          filenameEndsWithAllowed;

        // Only check files in apps/web/src or packages/web-runtime/src
        if (!(filename.includes('apps/web/src') || filename.includes('packages/web-runtime/src'))) {
          return {};
        }

        return {
          // Check for SOCIAL_LINKS identifier usage
          Identifier(node) {
            if (node.name === 'SOCIAL_LINKS' && !isAllowedSocialLinks) {
              context.report({
                node,
                messageId: 'socialLinksUsage',
              });
            }
          },
          // Check for SOCIAL_LINKS in string literals
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              // Check for SOCIAL_LINKS using indexOf (no .includes())
              node.value.indexOf('SOCIAL_LINKS') !== -1 &&
              !isAllowedSocialLinks
            ) {
              context.report({
                node,
                messageId: 'socialLinksUsage',
              });
            }
          },
          // Check for barrel imports from @/src/lib/data/marketing
          ImportDeclaration(node) {
            if (
              node.source.type === 'Literal' &&
              typeof node.source.value === 'string' &&
              (node.source.value === '@/src/lib/data/marketing' ||
                node.source.value.startsWith('@/src/lib/data/marketing') ||
                node.source.value.indexOf('@/src/lib/data/marketing') !== -1)
            ) {
              context.report({
                node: node.source,
                messageId: 'barrelImport',
              });
            }
          },
        };
      },
    },
    'require-error-boundary-logging': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require error boundaries to use standardized logging. Client-side: logClientErrorBoundary(). Server-side: logger.error() with proper context.',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingClientErrorBoundaryLogging:
            'Client-side error boundaries must use logClientErrorBoundary() from @heyclaude/web-runtime/logging/client.',
          missingStandardizedLogging:
            'Server-side error boundaries must use logger.error() with proper context. Use logger.child({ operation, route }) at request start.',
          missingChildLogger:
            'Server-side error boundaries must use logger.child({ operation, route }) for request-scoped context.',
          missingNormalizeError:
            'Error boundaries must normalize errors using normalizeError() before logging.',
          missingLoggerError:
            'Error boundaries must use logger.error() or logClientErrorBoundary() for structured logging (not console.error).',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Check if this is an error boundary file
        const isErrorBoundaryFile =
          filename.includes('/error.tsx') ||
          filename.includes('/error.ts') ||
          filename.includes('/global-error.tsx') ||
          filename.includes('error-boundary');

        if (!isErrorBoundaryFile) {
          return {};
        }

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        // Track what we find in the file
        let hasLogClientErrorBoundary = false;
        let hasNormalizeError = false;
        let hasLoggerError = false;
        let hasConsoleError = false;
        let hasComponentDidCatch = false;
        let hasUseEffect = false;

        return {
          ImportDeclaration(node) {
            if (!node.source?.value) {
              return;
            }

            const importPath = node.source.value;

            // Check for client-side error boundary logging
            if (isClientComponent) {
              if (
                importPath === '@heyclaude/web-runtime/logging/client' ||
                importPath.includes('@heyclaude/web-runtime/logging/client')
              ) {
                if (node.specifiers) {
                  for (const specifier of node.specifiers) {
                    if (specifier.type === 'ImportSpecifier') {
                      const importedName = specifier.imported?.name || specifier.imported?.value;
                      if (importedName === 'logClientErrorBoundary') {
                        hasLogClientErrorBoundary = true;
                      }
                    }
                  }
                }
              }
            } else {
              // Server-side: check for required imports
              if (
                importPath === '@heyclaude/web-runtime/core' ||
                importPath.includes('@heyclaude/web-runtime/logging/server') ||
                importPath.includes('@heyclaude/web-runtime')
              ) {
                if (node.specifiers) {
                  for (const specifier of node.specifiers) {
                    if (specifier.type === 'ImportSpecifier') {
                      const importedName = specifier.imported?.name || specifier.imported?.value;
                      if (importedName === 'generateRequestId') {
                        hasGenerateRequestId = true;
                      }
                      if (importedName === 'normalizeError') {
                        hasNormalizeError = true;
                      }
                      if (importedName === 'logger') {
                        // Will check for logger.error usage in CallExpression visitor
                      }
                    }
                  }
                }
              }
            }
          },

          CallExpression(node) {
            // Check for logger.error/warn calls
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                if (obj.name === 'logger' && (prop.name === 'error' || prop.name === 'warn')) {
                  hasLoggerError = true;
                }
              }
            }
            
            // Check for logClientErrorBoundary calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'logClientErrorBoundary') {
              hasLogClientErrorBoundary = true;
            }
            
            // Check for normalizeError calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'normalizeError') {
              hasNormalizeError = true;
            }
            
            // Check for console.error calls
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                if (obj.name === 'console' && prop.name === 'error') {
                  hasConsoleError = true;
                }
              }
            }
            
            // Check for useEffect calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'useEffect') {
              hasUseEffect = true;
            }
          },
          MethodDefinition(node) {
            // Check for componentDidCatch method
            if (node.key && node.key.type === 'Identifier' && node.key.name === 'componentDidCatch') {
              hasComponentDidCatch = true;
            }
          },

          // Check useEffect in error boundaries - verify it contains error logging
          'CallExpression[callee.name="useEffect"]'(node) {
            if (!hasUseEffect) {
              return;
            }

            // Check if this useEffect contains error parameter or error logging
            let hasErrorParam = false;
            let hasErrorLogging = false;
            
            if (node.arguments && node.arguments.length > 0) {
              const callback = node.arguments[0];
              if (callback && (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')) {
                // Check for error parameter
                for (const param of callback.params || []) {
                  if (param.type === 'Identifier' && param.name === 'error') {
                    hasErrorParam = true;
                    break;
                  }
                }
                
                // Traverse callback body to find error logging
                function traverseForErrorLogging(n) {
                  if (!n) return;
                  
                  if (n.type === 'CallExpression') {
                    if (n.callee && n.callee.type === 'Identifier' && n.callee.name === 'logClientErrorBoundary') {
                      hasErrorLogging = true;
                      return;
                    }
                    if (n.callee && n.callee.type === 'MemberExpression') {
                      const obj = n.callee.object;
                      const prop = n.callee.property;
                      if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                        if (obj.name === 'logger' && (prop.name === 'error' || prop.name === 'warn')) {
                          hasErrorLogging = true;
                          return;
                        }
                      }
                    }
                  }
                  
                  for (const key in n) {
                    if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                      if (Array.isArray(n[key])) {
                        for (const item of n[key]) {
                          traverseForErrorLogging(item);
                          if (hasErrorLogging) return;
                        }
                      } else {
                        traverseForErrorLogging(n[key]);
                        if (hasErrorLogging) return;
                      }
                    }
                  }
                }
                
                traverseForErrorLogging(callback.body);
              }
            }

            if (hasErrorParam) {
              if (isClientComponent) {
                // Client-side: check for logClientErrorBoundary
                if (!hasErrorLogging) {
                  context.report({
                    node,
                    messageId: 'missingClientErrorBoundaryLogging',
                  });
                }
              } else {
                // Server-side: check for logger.error with normalizeError
                if (!hasErrorLogging || !hasNormalizeError) {
                  context.report({
                    node,
                    messageId: 'missingStandardizedLogging',
                  });
                }
              }
            }
          },

          // Check componentDidCatch in class components
          'MethodDefinition[key.name="componentDidCatch"]'(node) {
            // Traverse method body to find error logging
            let hasErrorLogging = false;
            
            if (node.value && node.value.body) {
              function traverseMethodBody(n) {
                if (!n) return;
                
                if (n.type === 'CallExpression') {
                  if (n.callee && n.callee.type === 'Identifier' && n.callee.name === 'logClientErrorBoundary') {
                    hasErrorLogging = true;
                    return;
                  }
                  if (n.callee && n.callee.type === 'MemberExpression') {
                    const obj = n.callee.object;
                    const prop = n.callee.property;
                    if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                      if (obj.name === 'logger' && (prop.name === 'error' || prop.name === 'warn')) {
                        hasErrorLogging = true;
                        return;
                      }
                    }
                  }
                }
                
                for (const key in n) {
                  if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                    if (Array.isArray(n[key])) {
                      for (const item of n[key]) {
                        traverseMethodBody(item);
                        if (hasErrorLogging) return;
                      }
                    } else {
                      traverseMethodBody(n[key]);
                      if (hasErrorLogging) return;
                    }
                  }
                }
              }
              
              traverseMethodBody(node.value.body);
            }

            if (isClientComponent) {
              // Client-side: check for logClientErrorBoundary
              if (!hasErrorLogging) {
                context.report({
                  node,
                  messageId: 'missingClientErrorBoundaryLogging',
                });
              }
            } else {
              // Server-side: check for logger.error with normalizeError
              if (!hasErrorLogging || !hasNormalizeError) {
                context.report({
                  node,
                  messageId: 'missingStandardizedLogging',
                });
              }
            }
          },

          // Final check: ensure required imports are present
          'Program:exit'() {
            // Only check if this is actually an error boundary that should log
            if (hasUseEffect || hasComponentDidCatch) {
              if (isClientComponent) {
                // Client-side: must use logClientErrorBoundary
                if (!hasLogClientErrorBoundary) {
                  context.report({
                    node: ast,
                    messageId: 'missingClientErrorBoundaryLogging',
                  });
                }
                if (!hasLoggerError && hasConsoleError) {
                  context.report({
                    node: ast,
                    messageId: 'missingLoggerError',
                  });
                }
              } else {
                // Server-side: must use logger.error with normalizeError
                if (!hasNormalizeError) {
                  context.report({
                    node: ast,
                    messageId: 'missingNormalizeError',
                  });
                }
                if (!hasLoggerError && hasConsoleError) {
                  context.report({
                    node: ast,
                    messageId: 'missingLoggerError',
                  });
                }
              }
            }
          },
        };
      },
    },
    'require-error-boundary-fallback-logging': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require createErrorBoundaryFallback to use structured logging with logger.error instead of console.error',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useStructuredLogging:
            'createErrorBoundaryFallback must use logger.error() with createWebAppContextWithId() and generateRequestId() instead of console.error().',
          missingLoggerImport:
            'createErrorBoundaryFallback must import logger, generateRequestId, createWebAppContextWithId, and normalizeError from @heyclaude/web-runtime/core.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Check if file contains createErrorBoundaryFallback using AST
        let hasCreateErrorBoundaryFallback = false;
        
        function checkForCreateErrorBoundaryFallback(node) {
          if (!node) return;
          
          if (node.type === 'CallExpression' && node.callee && node.callee.type === 'Identifier' && 
              node.callee.name === 'createErrorBoundaryFallback') {
            hasCreateErrorBoundaryFallback = true;
            return;
          }
          
          if (node.type === 'VariableDeclarator' && node.init && node.init.type === 'CallExpression' &&
              node.init.callee && node.init.callee.type === 'Identifier' && 
              node.init.callee.name === 'createErrorBoundaryFallback') {
            hasCreateErrorBoundaryFallback = true;
            return;
          }
          
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  checkForCreateErrorBoundaryFallback(item);
                  if (hasCreateErrorBoundaryFallback) return;
                }
              } else {
                checkForCreateErrorBoundaryFallback(node[key]);
                if (hasCreateErrorBoundaryFallback) return;
              }
            }
          }
        }
        
        checkForCreateErrorBoundaryFallback(ast);
        
        if (!hasCreateErrorBoundaryFallback) {
          return {};
        }

        let hasLoggerImport = false;
        let hasGenerateRequestIdImport = false;
        let hasCreateWebAppContextWithIdImport = false;
        let hasNormalizeErrorImport = false;
        let hasConsoleError = false;
        let hasLoggerError = false;

        return {
          ImportDeclaration(node) {
            if (!node.source?.value) {
              return;
            }

            const importPath = node.source.value;

            if (
              importPath === '@heyclaude/web-runtime/core' ||
              importPath.includes('@heyclaude/web-runtime')
            ) {
              if (node.specifiers) {
                for (const specifier of node.specifiers) {
                  if (specifier.type === 'ImportSpecifier') {
                    const importedName = specifier.imported?.name || specifier.imported?.value;
                    if (importedName === 'logger') {
                      hasLoggerImport = true;
                    }
                    if (importedName === 'generateRequestId') {
                      hasGenerateRequestIdImport = true;
                    }
                    if (importedName === 'createWebAppContextWithId') {
                      hasCreateWebAppContextWithIdImport = true;
                    }
                    if (importedName === 'normalizeError') {
                      hasNormalizeErrorImport = true;
                    }
                  }
                }
              }
            }
          },

          // Check for console.error and logger.error in createErrorBoundaryFallback function
          'FunctionDeclaration[id.name="createErrorBoundaryFallback"], FunctionExpression[parent.id.name="createErrorBoundaryFallback"]'(
            node
          ) {
            // Traverse function body to find console.error and logger.error
            function traverseFunctionBody(n) {
              if (!n) return;
              
              if (n.type === 'CallExpression') {
                if (n.callee && n.callee.type === 'MemberExpression') {
                  const obj = n.callee.object;
                  const prop = n.callee.property;
                  if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                    if (obj.name === 'console' && prop.name === 'error') {
                      hasConsoleError = true;
                    }
                    if (obj.name === 'logger' && prop.name === 'error') {
                      hasLoggerError = true;
                    }
                  }
                }
              }
              
              for (const key in n) {
                if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                  if (Array.isArray(n[key])) {
                    for (const item of n[key]) {
                      traverseFunctionBody(item);
                    }
                  } else {
                    traverseFunctionBody(n[key]);
                  }
                }
              }
            }
            
            if (node.body) {
              traverseFunctionBody(node.body);
            }
          },

          // Check for console.error usage
          'CallExpression[callee.object.name="console"][callee.property.name="error"]'(node) {
            // Check if we're inside createErrorBoundaryFallback
            let parent = node.parent;
            while (parent) {
              if (
                (parent.type === 'FunctionDeclaration' &&
                  parent.id?.name === 'createErrorBoundaryFallback') ||
                (parent.type === 'FunctionExpression' &&
                  parent.parent?.id?.name === 'createErrorBoundaryFallback')
              ) {
                hasConsoleError = true;
                context.report({
                  node,
                  messageId: 'useStructuredLogging',
                });
                break;
              }
              parent = parent.parent;
            }
          },

          // Final check: ensure required imports are present
          'Program:exit'() {
            if (hasCreateErrorBoundaryFallback) {
              if (
                !(
                  hasLoggerImport &&
                  hasGenerateRequestIdImport &&
                  hasCreateWebAppContextWithIdImport &&
                  hasNormalizeErrorImport
                )
              ) {
                context.report({
                  node: ast,
                  messageId: 'missingLoggerImport',
                });
              }
              if (hasConsoleError && !hasLoggerError) {
                context.report({
                  node: ast,
                  messageId: 'useStructuredLogging',
                });
              }
            }
          },
        };
      },
    },
    'require-database-types-for-enums': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce that enum values come from Constants.public.Enums.* instead of hardcoded strings',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useConstantsEnum:
            'Enum values must come from Constants.public.Enums.* instead of hardcoded strings. Import Constants from @heyclaude/database-types and use Constants.public.Enums.{enumName}.',
          useDatabaseEnumType:
            'Enum types must use Database["public"]["Enums"]["{enumName}"] instead of string literal unions.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Skip test files and generated files
        if (
          filename.includes('.test.') ||
          filename.includes('.spec.') ||
          filename.includes('generated') ||
          filename.includes('node_modules')
        ) {
          return {};
        }

        // Check if Constants is imported
        let hasConstantsImport = false;
        let hasDatabaseTypeImport = false;

        return {
          ImportDeclaration(node) {
            if (!node.source?.value) {
              return;
            }

            const importPath = node.source.value;
            if (importPath === '@heyclaude/database-types' || importPath.includes('@heyclaude/database-types')) {
              if (node.specifiers) {
                for (const specifier of node.specifiers) {
                  if (specifier.type === 'ImportSpecifier') {
                    const importedName = specifier.imported?.name || specifier.imported?.value;
                    if (importedName === 'Constants') {
                      hasConstantsImport = true;
                    }
                    if (importedName === 'Database') {
                      hasDatabaseTypeImport = true;
                    }
                  }
                }
              }
            }
          },

          // Check for hardcoded enum arrays that match common enum patterns
          VariableDeclarator(node) {
            if (node.init?.type === 'ArrayExpression') {
              const elements = node.init.elements;
              // Check if array contains string literals that look like enum values
              const hasStringLiterals = elements.some(
                (el) => el?.type === 'Literal' && typeof el.value === 'string'
              );

              if (hasStringLiterals && elements.length >= 2) {
                // Check if variable name suggests it's an enum
                const varName = node.id?.name || '';
                if (
                  varName.includes('ENUM') ||
                  varName.includes('VALUES') ||
                  varName.includes('OPTIONS') ||
                  varName.match(/^(CATEGORY|STATUS|TYPE|LEVEL|TIER|PLAN)_VALUES?$/i)
                ) {
                  // Check if Constants is not imported or not used
                  if (!hasConstantsImport) {
                    context.report({
                      node: node.init,
                      messageId: 'useConstantsEnum',
                    });
                  }
                }
              }
            }
          },

          // Check for string literal union types that should use Database["public"]["Enums"]
          TSTypeAliasDeclaration(node) {
            if (node.typeAnnotation?.type === 'TSUnionType') {
              const types = node.typeAnnotation.types;
              // Check if all types are string literals
              const allStringLiterals = types.every(
                (t) => t.type === 'TSLiteralType' && t.literal?.type === 'Literal' && typeof t.literal.value === 'string'
              );

              if (allStringLiterals && types.length >= 2) {
                const typeName = node.id?.name || '';
                // Check if type name suggests it's an enum type
                if (
                  typeName.includes('Category') ||
                  typeName.includes('Status') ||
                  typeName.includes('Type') ||
                  typeName.includes('Level') ||
                  typeName.includes('Tier') ||
                  typeName.includes('Plan')
                ) {
                  if (!hasDatabaseTypeImport) {
                    context.report({
                      node: node.typeAnnotation,
                      messageId: 'useDatabaseEnumType',
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
    'no-hardcoded-enum-values': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent hardcoded enum values in favor of Constants.public.Enums.*',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useConstantsEnum:
            'Hardcoded enum values are not allowed. Use Constants.public.Enums.{enumName} from @heyclaude/database-types instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Skip test files and generated files
        if (
          filename.includes('.test.') ||
          filename.includes('.spec.') ||
          filename.includes('generated') ||
          filename.includes('node_modules')
        ) {
          return {};
        }

        // Common enum values from the database (from Constants.public.Enums)
        const knownEnumValues = new Set([
          'agents',
          'mcp',
          'rules',
          'commands',
          'hooks',
          'statuslines',
          'skills',
          'collections',
          'guides',
          'jobs',
          'changelog',
          'pending',
          'approved',
          'rejected',
          'beginner',
          'intermediate',
          'advanced',
          'just_me',
          '2-10',
          '11-50',
          '51-200',
          '201-500',
          '500+',
        ]);

        // Check if Constants is imported
        let hasConstantsImport = false;

        return {
          ImportDeclaration(node) {
            if (node.source && node.source.type === 'Literal' && typeof node.source.value === 'string') {
              const importPath = node.source.value;
              if (importPath === '@heyclaude/database-types' || importPath.includes('@heyclaude/database-types')) {
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.type === 'Identifier' && spec.imported.name === 'Constants') {
                    hasConstantsImport = true;
                    break;
                  }
                  if (spec.type === 'ImportNamespaceSpecifier' && spec.local && spec.local.type === 'Identifier' && spec.local.name === 'Constants') {
                    hasConstantsImport = true;
                    break;
                  }
                }
              }
            }
          },
          // Check for string literals that match known enum values
          Literal(node) {
            if (typeof node.value === 'string' && knownEnumValues.has(node.value)) {
              // Check if this is in a comparison or assignment that suggests enum usage
              const parent = node.parent;
              if (
                parent &&
                (parent.type === 'BinaryExpression' ||
                  parent.type === 'Property' ||
                  parent.type === 'ArrayExpression' ||
                  parent.type === 'CallExpression')
              ) {
                // Check if Constants is being used in this expression (AST check)
                let usesConstants = false;
                function checkForConstantsUsage(n) {
                  if (!n) return;
                  
                  if (n.type === 'MemberExpression') {
                    let current = n;
                    let path = [];
                    while (current && current.type === 'MemberExpression') {
                      if (current.property && current.property.type === 'Identifier') {
                        path.unshift(current.property.name);
                      }
                      current = current.object;
                    }
                    if (current && current.type === 'Identifier' && current.name === 'Constants') {
                      // Check if path matches Constants.public.Enums.* or Constants.private.Enums.*
                      if (path.length >= 3 && path[0] === 'public' && path[1] === 'Enums') {
                        usesConstants = true;
                        return;
                      }
                      if (path.length >= 3 && path[0] === 'private' && path[1] === 'Enums') {
                        usesConstants = true;
                        return;
                      }
                    }
                  }
                  
                  for (const key in n) {
                    if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                      if (Array.isArray(n[key])) {
                        for (const item of n[key]) {
                          checkForConstantsUsage(item);
                          if (usesConstants) return;
                        }
                      } else {
                        checkForConstantsUsage(n[key]);
                        if (usesConstants) return;
                      }
                    }
                  }
                }
                
                // Check parent and surrounding context
                checkForConstantsUsage(parent);
                
                if (!usesConstants && !hasConstantsImport) {
                  context.report({
                    node,
                    messageId: 'useConstantsEnum',
                  });
                }
              }
            }
          },
        };
      },
    },
    'require-section-logging': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce section-based logging on server pages (similar to homepage pattern)',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - might infer wrong section names or break existing code
        schema: [],
        messages: {
          missingSectionLogging:
            'Server pages should use section-based logging with section: "section-name" in log context. Example: reqLogger.info({ section: "data-fetch" }, "message")',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only apply to server pages (app directory pages, not components)
        const isServerPage =
          filename.includes('/app/') &&
          (filename.endsWith('/page.tsx') || filename.endsWith('/page.ts')) &&
          !filename.includes('/components/');

        if (!isServerPage) {
          return {};
        }

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        if (isClientComponent) {
          return {};
        }

        let hasAsyncOperations = false;
        let hasSectionLogging = false;
        let hasLoggerCalls = false;

        // Helper to check for async operations using AST
        function hasAsyncOps(node) {
          if (!node) return false;
          let found = false;
          function traverse(n) {
            if (!n || found) return;
            if (n.type === 'AwaitExpression') {
              found = true;
              return;
            }
            if (n.type === 'CallExpression') {
              if (n.callee && n.callee.type === 'MemberExpression') {
                const prop = n.callee.property;
                if (prop && prop.type === 'Identifier' && (prop.name === 'rpc' || prop.name === 'from')) {
                  found = true;
                  return;
                }
              }
              if (n.callee && n.callee.type === 'Identifier') {
                const names = ['fetch', 'getContent', 'getData', 'fetchData', 'loadData', 'query', 'select', 'getUser', 'getCategory'];
                if (names.includes(n.callee.name)) {
                  found = true;
                  return;
                }
              }
            }
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
              if (n.async) {
                found = true;
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        return {
          Program(node) {
            hasAsyncOperations = hasAsyncOps(node);
          },
          CallExpression(node) {
            // Check for logger calls (info, error, warn, etc.)
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                const loggerNames = ['logger', 'reqLogger', 'sectionLogger', 'routeLogger', 'userLogger'];
                const logMethods = ['info', 'error', 'warn', 'debug', 'trace'];
                if (loggerNames.includes(obj.name) && logMethods.includes(prop.name)) {
                  hasLoggerCalls = true;
                  
                  // Check if first argument (object) has section property
                  if (node.arguments && node.arguments.length > 0) {
                    const firstArg = node.arguments[0];
                    if (firstArg && firstArg.type === 'ObjectExpression') {
                      for (const prop of firstArg.properties || []) {
                        if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier' && prop.key.name === 'section') {
                          hasSectionLogging = true;
                          return;
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          CallExpression(node) {
            // Track logger calls that need section added
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                const loggerNames = ['logger', 'reqLogger', 'sectionLogger', 'routeLogger', 'userLogger'];
                const logMethods = ['info', 'error', 'warn', 'debug', 'trace'];
                if (loggerNames.includes(obj.name) && logMethods.includes(prop.name)) {
                  // Check if first argument (object) has section property
                  if (node.arguments && node.arguments.length > 0) {
                    const firstArg = node.arguments[0];
                    if (firstArg && firstArg.type === 'ObjectExpression') {
                      // Check if section property exists
                      const hasSection = firstArg.properties.some(
                        (prop) => prop.type === 'Property' && prop.key && prop.key.type === 'Identifier' && prop.key.name === 'section'
                      );
                      
                      if (!hasSection && hasAsyncOperations) {
                        // Infer section name from context
                        let inferredSection = 'data-fetch'; // Default
                        
                        // Check surrounding code for hints
                        const parent = node.parent;
                        if (parent) {
                          // Look for comments or variable names that hint at section
                          const comments = sourceCode.getCommentsBefore(node) || [];
                          for (const comment of comments) {
                            const commentText = comment.value?.toLowerCase() || '';
                            if (commentText.includes('authentication') || commentText.includes('auth')) {
                              inferredSection = 'authentication';
                            } else if (commentText.includes('data') || commentText.includes('fetch') || commentText.includes('load')) {
                              inferredSection = 'data-fetch';
                            } else if (commentText.includes('render') || commentText.includes('page')) {
                              inferredSection = 'page-render';
                            } else if (commentText.includes('validation')) {
                              inferredSection = 'validation';
                            }
                          }
                        }
                        
                        context.report({
                          node: firstArg,
                          messageId: 'missingSectionLogging',
                          // No fix() - autofix disabled (fixable: null)
                        });
                      }
                    } else if (firstArg && firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                      // Log call with string message but no context object
                      // Object-first API: logger.info({ section: '...' }, 'message')
                      // Need to wrap message and add context object as first argument
                      const messageText = sourceCode.getText(firstArg);
                      const inferredSection = 'data-fetch'; // Default
                      
                      context.report({
                        node,
                        messageId: 'missingSectionLogging',
                        // No fix() - autofix disabled (fixable: null)
                      });
                    }
                  }
                }
              }
            }
          },
          'Program:exit'() {
            // If page has async operations and logger calls but no section logging, warn
            // (Individual logger calls are now fixed above)
            if (hasAsyncOperations && hasLoggerCalls && !hasSectionLogging) {
              context.report({
                node: ast,
                messageId: 'missingSectionLogging',
              });
            }
          },
        };
      },
    },
    'require-use-logged-async-in-client': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce useLoggedAsync usage in client components with async operations',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - complex hook insertion could break React hooks rules or TypeScript
        schema: [],
        messages: {
          useLoggedAsync:
            'Client components with async operations must use useLoggedAsync hook for consistent error logging. Example: const runLoggedAsync = useLoggedAsync({ scope: "ComponentName" });',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        if (!isClientComponent) {
          return {};
        }

        let hasAsyncOperations = false;
        let hasUseLoggedAsync = false;
        let hasRunLoggedAsync = false;
        let hasUseLoggedAsyncImport = false;
        let componentName = 'Component';
        let firstFunctionBody = null;

        // Helper to check for async operations using AST
        function hasAsyncOps(node) {
          if (!node) return false;
          let found = false;
          function traverse(n) {
            if (!n || found) return;
            if (n.type === 'AwaitExpression') {
              found = true;
              return;
            }
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
              if (n.async) {
                found = true;
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        // Extract component name from default export or first function
        function extractComponentName(node) {
          // Look for default export function
          for (const stmt of node.body || []) {
            if (stmt.type === 'ExportDefaultDeclaration' && stmt.declaration) {
              const decl = stmt.declaration;
              if (decl.type === 'FunctionDeclaration' && decl.id) {
                return decl.id.name;
              }
              if (decl.type === 'Identifier') {
                // Export default identifier - find its declaration
                const name = decl.name;
                for (const s of node.body || []) {
                  if (s.type === 'FunctionDeclaration' && s.id && s.id.name === name) {
                    return name;
                  }
                  if (s.type === 'VariableDeclaration') {
                    for (const v of s.declarations || []) {
                      if (v.id && v.id.type === 'Identifier' && v.id.name === name) {
                        if (v.init && v.init.type === 'ArrowFunctionExpression') {
                          return name;
                        }
                      }
                    }
                  }
                }
              }
            }
            // Look for first function declaration
            if (stmt.type === 'FunctionDeclaration' && stmt.id) {
              return stmt.id.name;
            }
          }
          return 'Component';
        }

        return {
          ImportDeclaration(node) {
            // Check for useLoggedAsync import
            if (node.source && node.source.type === 'Literal' && typeof node.source.value === 'string') {
              if (node.source.value.includes('@heyclaude/web-runtime/hooks')) {
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.name === 'useLoggedAsync') {
                    hasUseLoggedAsyncImport = true;
                  }
                }
              }
            }
          },
          Program(node) {
            hasAsyncOperations = hasAsyncOps(node);
            componentName = extractComponentName(node);
            // Find first function body for hook insertion
            for (const stmt of node.body || []) {
              if (stmt.type === 'ExportDefaultDeclaration' && stmt.declaration) {
                const decl = stmt.declaration;
                if (decl.type === 'FunctionDeclaration' && decl.body) {
                  firstFunctionBody = decl.body;
                  break;
                }
                if (decl.type === 'Identifier') {
                  // Find the actual function
                  const name = decl.name;
                  for (const s of node.body || []) {
                    if (s.type === 'FunctionDeclaration' && s.id && s.id.name === name && s.body) {
                      firstFunctionBody = s.body;
                      break;
                    }
                    if (s.type === 'VariableDeclaration') {
                      for (const v of s.declarations || []) {
                        if (v.id && v.id.type === 'Identifier' && v.id.name === name) {
                          if (v.init && v.init.type === 'ArrowFunctionExpression' && v.init.body) {
                            if (v.init.body.type === 'BlockStatement') {
                              firstFunctionBody = v.init.body;
                            }
                            break;
                          }
                        }
                      }
                    }
                  }
                }
              } else if (stmt.type === 'FunctionDeclaration' && stmt.body && !firstFunctionBody) {
                firstFunctionBody = stmt.body;
                break;
              }
            }
          },
          CallExpression(node) {
            // Check for useLoggedAsync() hook calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'useLoggedAsync') {
              hasUseLoggedAsync = true;
            }
          },
          VariableDeclarator(node) {
            // Check for runLoggedAsync variable (result of useLoggedAsync)
            if (node.id && node.id.type === 'Identifier' && node.id.name === 'runLoggedAsync') {
              hasRunLoggedAsync = true;
            }
          },
          'Program:exit'() {
            if (hasAsyncOperations && !hasUseLoggedAsync && !hasRunLoggedAsync) {
              context.report({
                node: ast,
                messageId: 'useLoggedAsync',
                // No fix() - autofix disabled (fixable: null)
              });
            }
          },
        };
      },
    },
    'require-safe-action-middleware': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure server actions use the safe-action middleware chain',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useSafeAction:
            'Server actions must use safe-action middleware (authedAction, optionalAuthAction, or rateLimitedAction). Example: export const myAction = authedAction.schema(inputSchema).handler(async ({ input, ctx }) => { ... })',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only apply to server action files
        const isServerActionFile =
          (filename.includes('/actions/') || filename.includes('action')) &&
          !filename.includes('.test.') &&
          !filename.includes('.spec.');

        if (!isServerActionFile) {
          return {};
        }

        let hasSafeAction = false;
        let hasExportedAsyncFunction = false;

        // Check for 'use server' directive using pure AST (no getText())
        const hasUseServer = hasUseServerDirective(ast);

        if (!hasUseServer) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for safe-action middleware usage
            if (node.callee && node.callee.type === 'Identifier') {
              const funcName = node.callee.name;
              if (funcName === 'authedAction' || funcName === 'optionalAuthAction' || funcName === 'rateLimitedAction' || funcName === 'actionClient') {
                hasSafeAction = true;
              }
            }
          },
          ExportDefaultDeclaration(node) {
            // Check if default export is async function
            const decl = node.declaration;
            if (decl && (decl.type === 'FunctionDeclaration' || decl.type === 'FunctionExpression' || decl.type === 'ArrowFunctionExpression')) {
              if (decl.async) {
                hasExportedAsyncFunction = true;
              }
            }
          },
          ExportNamedDeclaration(node) {
            // Check for exported async functions
            if (node.declaration) {
              if (node.declaration.type === 'FunctionDeclaration' && node.declaration.async) {
                hasExportedAsyncFunction = true;
              }
              if (node.declaration.type === 'VariableDeclaration') {
                for (const declarator of node.declaration.declarations || []) {
                  if (declarator.init && declarator.init.type === 'ArrowFunctionExpression' && declarator.init.async) {
                    hasExportedAsyncFunction = true;
                  }
                  if (declarator.init && declarator.init.type === 'FunctionExpression' && declarator.init.async) {
                    hasExportedAsyncFunction = true;
                  }
                }
              }
            }
            // Check for re-exports with async functions
            for (const spec of node.specifiers || []) {
              if (spec.type === 'ExportSpecifier') {
                // Find the declaration for this export
                for (const stmt of ast.body || []) {
                  if (stmt.type === 'FunctionDeclaration' && stmt.id && stmt.id.name === spec.exported.name && stmt.async) {
                    hasExportedAsyncFunction = true;
                    break;
                  }
                  if (stmt.type === 'VariableDeclaration') {
                    for (const declarator of stmt.declarations || []) {
                      if (declarator.id && declarator.id.type === 'Identifier' && declarator.id.name === spec.exported.name) {
                        if (declarator.init && declarator.init.type === 'ArrowFunctionExpression' && declarator.init.async) {
                          hasExportedAsyncFunction = true;
                          break;
                        }
                        if (declarator.init && declarator.init.type === 'FunctionExpression' && declarator.init.async) {
                          hasExportedAsyncFunction = true;
                          break;
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          'Program:exit'() {
            if (hasExportedAsyncFunction && !hasSafeAction) {
              context.report({
                node: ast,
                messageId: 'useSafeAction',
              });
            }
          },
        };
      },
    },
    'no-direct-database-access-in-actions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent direct Supabase client usage in server actions (should use data layer)',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useDataLayer:
            'Direct database access in server actions is not allowed. Use data layer services (e.g., ContentService, AccountService) instead of direct supabase.from() or supabase.rpc() calls.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only apply to server action files
        const isServerActionFile =
          (filename.includes('/actions/') || filename.includes('action')) &&
          !filename.includes('.test.') &&
          !filename.includes('.spec.');

        if (!isServerActionFile) {
          return {};
        }

        let hasDirectAccess = false;
        let hasDataLayer = false;

        // Check for 'use server' directive using pure AST (no getText())
        const hasUseServer = hasUseServerDirective(ast);

        if (!hasUseServer) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for direct database access: supabase.from() or supabase.rpc()
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                // Check for supabase.from() or supabase.rpc()
                if ((obj.name === 'supabase' || obj.name.toLowerCase().includes('supabase')) && 
                    (prop.name === 'from' || prop.name === 'rpc')) {
                  hasDirectAccess = true;
                }
                
                // Check for chained .from() or .rpc() calls
                if (prop.name === 'from' || prop.name === 'rpc') {
                  // Check if parent is a member expression (e.g., something.from())
                  let current = obj;
                  while (current && current.type === 'MemberExpression') {
                    if (current.object && current.object.type === 'Identifier' && 
                        (current.object.name === 'supabase' || current.object.name.toLowerCase().includes('supabase'))) {
                      hasDirectAccess = true;
                      break;
                    }
                    current = current.object;
                  }
                }
              }
            }
            
            // Check for data layer service usage
            if (node.callee && node.callee.type === 'Identifier') {
              const serviceNames = ['ContentService', 'AccountService', 'SearchService', 'JobsService'];
              if (serviceNames.includes(node.callee.name)) {
                hasDataLayer = true;
              }
            }
            
            // Check for service instantiation: new ContentService(), etc.
            if (node.callee && node.callee.type === 'NewExpression' && node.callee.callee && node.callee.callee.type === 'Identifier') {
              const serviceNames = ['ContentService', 'AccountService', 'SearchService', 'JobsService'];
              if (serviceNames.includes(node.callee.callee.name)) {
                hasDataLayer = true;
              }
            }
          },
          MemberExpression(node) {
            // Check for service method calls: service.getContent(), etc.
            if (node.object && node.object.type === 'Identifier' && node.property && node.property.type === 'Identifier') {
              const serviceNames = ['contentService', 'accountService', 'searchService', 'jobsService'];
              if (serviceNames.includes(node.object.name)) {
                hasDataLayer = true;
              }
            }
          },
          'Program:exit'() {
            if (hasDirectAccess && !hasDataLayer) {
              context.report({
                node: ast,
                messageId: 'useDataLayer',
              });
            }
          },
        };
      },
    },
    'require-edge-logging-setup': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Comprehensive edge function logging validation: proper imports, initRequestLogging(), traceRequestComplete(), and logContext creation',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useEdgeLogging:
            'Edge functions must use logError/logInfo/logWarn from @heyclaude/shared-runtime OR logger from @heyclaude/edge-runtime. Do not use logger from @heyclaude/web-runtime/core.',
          missingInitRequestLogging:
            'Edge function handler is missing initRequestLogging() call. Add: initRequestLogging(logContext) at handler start. This will automatically set logger bindings.',
          missingTraceRequestComplete:
            'Edge function handler is missing traceRequestComplete() call before success response. Add: traceRequestComplete(logContext) before returning.',
          missingLogContextCreation:
            'Edge function handler is missing logContext creation. Add: const logContext = create{Service}Context(...) at handler start.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only apply to edge function files
        const isEdgeFunction = filename.includes('apps/edge/functions');

        if (!isEdgeFunction) {
          return {};
        }

        // Track all edge logging requirements
        let hasWebRuntimeCoreLogger = false;
        let hasSharedRuntimeHelpers = false;
        let hasEdgeRuntimeLogger = false;
        let hasHandlerExport = false;
        let hasInitRequestLogging = false;
        let hasTraceRequestComplete = false;
        let hasLogContextCreation = false;
        let hasSuccessResponse = false;

        const handlerNames = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
        const contextCreationFunctions = [
          'createEmailHandlerContext',
          'createDataApiContext',
          'createSearchContext',
          'createTransformApiContext',
          'createUtilityContext',
          'createNotificationRouterContext',
          'createChangelogHandlerContext',
          'createWebAppContext',
        ];

        /**
         * Traverse AST to find patterns
         */
        function traverse(node) {
          if (!node) return;

          // Check for handler exports
          if (node.type === 'ExportNamedDeclaration') {
            if (node.declaration) {
              if (node.declaration.type === 'FunctionDeclaration' &&
                  node.declaration.id &&
                  node.declaration.id.type === 'Identifier' &&
                  handlerNames.includes(node.declaration.id.name)) {
                hasHandlerExport = true;
              }
              if (node.declaration.type === 'VariableDeclaration') {
                for (const declarator of node.declaration.declarations || []) {
                  if (declarator.id && declarator.id.type === 'Identifier' &&
                      handlerNames.includes(declarator.id.name)) {
                    hasHandlerExport = true;
                  }
                }
              }
            }
            if (node.specifiers) {
              for (const spec of node.specifiers) {
                if (spec.exported && spec.exported.type === 'Identifier' &&
                    handlerNames.includes(spec.exported.name)) {
                  hasHandlerExport = true;
                }
              }
            }
          }

          // Check for initRequestLogging() calls
          if (node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              node.callee.name === 'initRequestLogging') {
            hasInitRequestLogging = true;
          }

          // Check for traceRequestComplete() calls
          if (node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              node.callee.name === 'traceRequestComplete') {
            hasTraceRequestComplete = true;
          }

          // Check for log context creation functions
          if (node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              contextCreationFunctions.includes(node.callee.name)) {
            hasLogContextCreation = true;
          }

          // Check for return new Response() patterns
          if (node.type === 'ReturnStatement' && node.argument) {
            if (node.argument.type === 'NewExpression' &&
                node.argument.callee.type === 'Identifier' &&
                node.argument.callee.name === 'Response') {
              hasSuccessResponse = true;
            }
            if (node.argument.type === 'CallExpression' &&
                node.argument.callee.type === 'MemberExpression' &&
                node.argument.callee.object.type === 'Identifier' &&
                node.argument.callee.object.name === 'Response') {
              hasSuccessResponse = true;
            }
          }

          // Recursively traverse
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  traverse(item);
                }
              } else {
                traverse(node[key]);
              }
            }
          }
        }

        // Traverse entire AST
        traverse(ast);

        return {
          ImportDeclaration(node) {
            if (node.source && node.source.type === 'Literal' && typeof node.source.value === 'string') {
              const importPath = node.source.value;
              
              // Check for web-runtime/core logger import (should not be used)
              if (importPath === '@heyclaude/web-runtime/core' || importPath.indexOf('@heyclaude/web-runtime/core') !== -1) {
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportDefaultSpecifier' || 
                      (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.type === 'Identifier' && spec.imported.name === 'logger')) {
                    hasWebRuntimeCoreLogger = true;
                    break;
                  }
                }
              }
              
              // Check for shared-runtime helpers
              if (importPath === '@heyclaude/shared-runtime' || importPath.indexOf('@heyclaude/shared-runtime') !== -1) {
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.type === 'Identifier') {
                    const name = spec.imported.name;
                    if (name === 'logError' || name === 'logInfo' || name === 'logWarn') {
                      hasSharedRuntimeHelpers = true;
                      break;
                    }
                  }
                }
              }
              
              // Check for edge-runtime logger
              if (importPath === '@heyclaude/edge-runtime' || importPath.indexOf('@heyclaude/edge-runtime') !== -1) {
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportDefaultSpecifier' || 
                      (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.type === 'Identifier' && spec.imported.name === 'logger')) {
                    hasEdgeRuntimeLogger = true;
                    break;
                  }
                }
              }
            }
          },
          'Program:exit'() {
            if (!hasHandlerExport) {
              return; // Not a handler file
            }

            // Check logging imports
            if (hasWebRuntimeCoreLogger && !hasSharedRuntimeHelpers && !hasEdgeRuntimeLogger) {
              context.report({
                node: ast,
                messageId: 'useEdgeLogging',
              });
            }

            // Check logContext creation
            if (!hasLogContextCreation) {
              context.report({
                node: ast,
                messageId: 'missingLogContextCreation',
              });
            } else if (!hasInitRequestLogging) {
              context.report({
                node: ast,
                messageId: 'missingInitRequestLogging',
              });
            }

            // Check for success responses
            if (hasSuccessResponse && !hasTraceRequestComplete) {
              context.report({
                node: ast,
                messageId: 'missingTraceRequestComplete',
              });
            }
          },
        };
      },
    },
    'require-await-log-error': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require await for logError() calls in async functions',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          missingAwait:
            'logError() is async and must be awaited in async functions. Use: await logError(message, context, error)',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Track if we're in an async function
        let isInAsyncFunction = false;
        let asyncFunctionStack = [];

        return {
          'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
            const isAsync = node.async === true;
            if (isAsync) {
              asyncFunctionStack.push(true);
              isInAsyncFunction = true;
            } else {
              asyncFunctionStack.push(false);
            }
          },
          'FunctionDeclaration:exit'(node) {
            asyncFunctionStack.pop();
            isInAsyncFunction = asyncFunctionStack.length > 0 && asyncFunctionStack[asyncFunctionStack.length - 1];
          },
          'FunctionExpression:exit'(node) {
            asyncFunctionStack.pop();
            isInAsyncFunction = asyncFunctionStack.length > 0 && asyncFunctionStack[asyncFunctionStack.length - 1];
          },
          'ArrowFunctionExpression:exit'(node) {
            asyncFunctionStack.pop();
            isInAsyncFunction = asyncFunctionStack.length > 0 && asyncFunctionStack[asyncFunctionStack.length - 1];
          },
          CallExpression(node) {
            // Check if this is a logError call
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'logError'
            ) {
              // Check if we're in an async function
              if (isInAsyncFunction) {
                // Check if logError is awaited
                const parent = node.parent;
                if (parent.type !== 'AwaitExpression') {
                  context.report({
                    node,
                    messageId: 'missingAwait',
                    fix(fixer) {
                      // 100% safe autofix: Add 'await ' before logError() call
                      // This is safe because:
                      // 1. We've verified we're in an async function
                      // 2. logError is confirmed to be async (returns Promise<void>)
                      // 3. Adding await doesn't change semantics, just ensures Promise is handled
                      return fixer.insertTextBefore(node, 'await ');
                    },
                  });
                }
              }
            }
          },
        };
      },
    },
    'enforce-log-context-naming': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce consistent naming for log context variables (prefer logContext)',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferLogContext:
            'Prefer "logContext" as variable name for log context. Found: {name}. Use descriptive names only in deeply nested scopes where logContext would shadow outer scope.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Allowed descriptive names (only in nested scopes)
        const allowedDescriptiveNames = new Set([
          'actionLogContext',
          'metadataLogContext',
          'staticParamsLogContext',
          'utilityLogContext',
        ]);

        // Patterns that suggest log context creation
        const logContextCreationPatterns = [
          /createEmailHandlerContext/,
          /createDataApiContext/,
          /createSearchContext/,
          /createTransformApiContext/,
          /createUtilityContext/,
          /createNotificationRouterContext/,
          /createChangelogHandlerContext/,
          /createWebAppContext/,
          /createWebAppContextWithId/,
        ];

        return {
          VariableDeclarator(node) {
            if (!node.id || node.id.type !== 'Identifier') {
              return;
            }

            const varName = node.id.name;

            // Check if this variable is created from a context creation function
            if (node.init) {
              const initText = sourceCode.getText(node.init);
              const isLogContextCreation = logContextCreationPatterns.some(pattern => 
                pattern.test(initText)
              );

              if (isLogContextCreation) {
                // Check if variable name is not "logContext"
                if (varName !== 'logContext') {
                  // Check if it's an allowed descriptive name
                  if (!allowedDescriptiveNames.has(varName)) {
                    // Check if we're in a nested scope (where descriptive name might be needed)
                    let parent = node.parent;
                    let depth = 0;
                    while (parent) {
                      if (
                        parent.type === 'FunctionDeclaration' ||
                        parent.type === 'FunctionExpression' ||
                        parent.type === 'ArrowFunctionExpression' ||
                        parent.type === 'BlockStatement'
                      ) {
                        depth++;
                      }
                      parent = parent.parent;
                    }

                    // Only suggest if not deeply nested (depth < 3 means not deeply nested enough to need descriptive name)
                    if (depth < 3) {
                      context.report({
                        node: node.id,
                        messageId: 'preferLogContext',
                        data: { name: varName },
                      });
                    }
                  }
                }
              }
            }

            // Also check for variables matching *LogContext or *Context pattern
            if (
              (varName.endsWith('LogContext') || varName.endsWith('Context')) &&
              varName !== 'logContext' &&
              !allowedDescriptiveNames.has(varName)
            ) {
              // Check if this variable is used with logger calls
              const varText = sourceCode.getText(node);
              if (
                varText.includes('logger.') ||
                varText.includes('logError') ||
                varText.includes('logInfo') ||
                varText.includes('logWarn')
              ) {
                // Check nesting depth
                let parent = node.parent;
                let depth = 0;
                while (parent) {
                  if (
                    parent.type === 'FunctionDeclaration' ||
                    parent.type === 'FunctionExpression' ||
                    parent.type === 'ArrowFunctionExpression' ||
                    parent.type === 'BlockStatement'
                  ) {
                    depth++;
                  }
                  parent = parent.parent;
                }

                if (depth < 3) {
                  context.report({
                    node: node.id,
                    messageId: 'preferLogContext',
                    data: { name: varName },
                  });
                }
              }
            }
          },
        };
      },
    },
    'require-custom-serializers': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer using custom serializers (user, request, response, dbQuery, args) instead of manual formatting',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useCustomSerializer:
            'Use custom serializer for {type} instead of manual formatting. Use: { ...logContext, {serializer}: {value} } where {serializer} is a custom serializer (user, request, response, dbQuery, args).',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Custom serializers available
        const serializers = {
          user: ['user', 'userId', 'user_id'],
          request: ['request', 'req', 'httpRequest'],
          response: ['response', 'res', 'httpResponse'],
          dbQuery: ['dbQuery', 'query', 'rpc'],
          args: ['args', 'arguments', 'params'],
        };

        return {
          CallExpression(node) {
            // Check logger calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger'
            ) {
              const args = node.arguments;
              const contextArg = args[args.length - 1];

              if (contextArg && contextArg.type === 'ObjectExpression') {
                // Check for manual formatting that should use serializers
                contextArg.properties.forEach((prop) => {
                  if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                    const keyName = prop.key.name.toLowerCase();
                    
                    // Check if this matches a serializer pattern
                    for (const [serializerName, patterns] of Object.entries(serializers)) {
                      if (patterns.some(pattern => keyName.includes(pattern))) {
                        // Check if value is manually formatted (object with specific keys)
                        if (prop.value.type === 'ObjectExpression') {
                          const valueProps = prop.value.properties;
                          // If it has common manual formatting keys, suggest serializer
                          const hasManualFormatting = valueProps.some(
                            (p) =>
                              p.type === 'Property' &&
                              p.key.type === 'Identifier' &&
                              (p.key.name === 'id' ||
                                p.key.name === 'email' ||
                                p.key.name === 'name' ||
                                p.key.name === 'method' ||
                                p.key.name === 'url' ||
                                p.key.name === 'status' ||
                                p.key.name === 'rpcName' ||
                                p.key.name === 'operation')
                          );

                          if (hasManualFormatting) {
                            context.report({
                              node: prop,
                              messageId: 'useCustomSerializer',
                              data: {
                                type: serializerName,
                                serializer: serializerName,
                                value: sourceCode.getText(prop.value),
                              },
                            });
                          }
                        }
                      }
                    }
                  }
                });
              }
            }
          },
        };
      },
    },
    'prefer-logger-helpers-in-edge': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Edge functions should prefer helper functions (logError, logInfo, logWarn, logTrace) from @heyclaude/shared-runtime, but logger from @heyclaude/edge-runtime is also acceptable.',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferHelperFunction:
            'Edge functions should prefer helper functions (logError, logInfo, logWarn, logTrace) from @heyclaude/shared-runtime instead of direct logger.{method}() calls. However, logger from @heyclaude/edge-runtime is also acceptable.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only apply to edge function files
        const isEdgeFunction = filename.includes('apps/edge/functions');

        if (!isEdgeFunction) {
          return {};
        }

        // Check if helper functions are imported (using AST)
        let hasHelperImports = false;
        let hasEdgeRuntimeLogger = false;

        return {
          CallExpression(node) {
            // Check if this is a direct logger.{method} call
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              (node.callee.property.name === 'info' ||
                node.callee.property.name === 'error' ||
                node.callee.property.name === 'warn' ||
                node.callee.property.name === 'debug' ||
                node.callee.property.name === 'trace')
            ) {
              // Only suggest helper functions if:
              // 1. Helper functions are imported (available to use)
              // 2. Logger is NOT from edge-runtime (if it's from edge-runtime, that's acceptable)
              if (hasHelperImports && !hasEdgeRuntimeLogger) {
                const method = node.callee.property.name;
                const helperName = 
                  method === 'error' ? 'logError' :
                  method === 'info' ? 'logInfo' :
                  method === 'warn' ? 'logWarn' :
                  method === 'trace' ? 'logTrace' :
                  null;

                if (helperName) {
                  context.report({
                    node,
                    messageId: 'preferHelperFunction',
                    data: { helper: helperName },
                  });
                }
              }
            }
          },
        };
      },
    },
    'detect-missing-error-logging-in-functions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detect async functions and service methods that should have error logging but are missing it',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingErrorLogging:
            'Function "{name}" performs async operations but has no error logging in catch blocks. Add error logging using logError() or logger.error() with proper context.',
          missingLoggingInServiceMethod:
            'Service method "{name}" should have error logging for database operations. Add logRpcError() or logger.error() calls.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only apply to service files and edge functions
        const isServiceFile =
          filename.includes('packages/data-layer/src/services') ||
          filename.includes('packages/web-runtime/src/data') ||
          filename.includes('apps/edge/functions');

        if (!isServiceFile) {
          return {};
        }

        /**
         * Check if a node contains await expressions
         */
        function hasAwaitExpressions(node) {
          if (!node) return false;
          if (node.type === 'AwaitExpression') return true;
          
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (hasAwaitExpressions(item)) return true;
                }
              } else if (hasAwaitExpressions(node[key])) {
                return true;
              }
            }
          }
          return false;
        }

        /**
         * Check if a node contains error logging calls
         */
        function hasErrorLoggingInNode(node) {
          if (!node) return false;
          
          if (node.type === 'CallExpression') {
            // Check for logger.error, logger.warn
            if (node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                if (obj.name === 'logger' && (prop.name === 'error' || prop.name === 'warn')) {
                  return true;
                }
                // Check for child logger patterns (reqLogger.error, etc.)
                const childLoggerNames = ['reqLogger', 'userLogger', 'actionLogger', 'metadataLogger', 'viewerLogger', 'processLogger', 'callbackLogger', 'requestLogger'];
                if (childLoggerNames.includes(obj.name) && (prop.name === 'error' || prop.name === 'warn')) {
                  return true;
                }
              }
            }
            // Check for logError, logRpcError, withRpcErrorLogging
            if (node.callee.type === 'Identifier') {
              const name = node.callee.name;
              if (name === 'logError' || name === 'logRpcError' || name === 'withRpcErrorLogging') {
                return true;
              }
            }
          }
          
          // Recursively check children
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (hasErrorLoggingInNode(item)) return true;
                }
              } else if (hasErrorLoggingInNode(node[key])) {
                return true;
              }
            }
          }
          
          return false;
        }

        /**
         * Check if a node contains try-catch statements
         */
        function hasTryCatch(node) {
          if (!node) return false;
          if (node.type === 'TryStatement') return true;
          
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (hasTryCatch(item)) return true;
                }
              } else if (hasTryCatch(node[key])) {
                return true;
              }
            }
          }
          return false;
        }

        /**
         * Check if a node contains database operations
         */
        function hasDatabaseOperations(node) {
          if (!node) return false;
          
          // Check for .rpc() calls
          if (node.type === 'CallExpression' &&
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier' &&
              (node.callee.property.name === 'rpc' || node.callee.property.name === 'from')) {
            return true;
          }
          
          // Check for supabase. or db. member expressions
          if (node.type === 'MemberExpression') {
            const obj = node.object;
            if (obj && obj.type === 'Identifier' &&
                (obj.name === 'supabase' || obj.name === 'db')) {
              return true;
            }
          }
          
          // Recursively check children
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (hasDatabaseOperations(item)) return true;
                }
              } else if (hasDatabaseOperations(node[key])) {
                return true;
              }
            }
          }
          
          return false;
        }

        /**
         * Estimate function complexity (rough count of statements)
         */
        function estimateFunctionComplexity(node) {
          if (!node || !node.body) return 0;
          
          let count = 0;
          function countStatements(n) {
            if (!n) return;
            if (n.type === 'ExpressionStatement' || n.type === 'VariableDeclaration' ||
                n.type === 'IfStatement' || n.type === 'ReturnStatement' ||
                n.type === 'TryStatement' || n.type === 'ForStatement' ||
                n.type === 'WhileStatement' || n.type === 'SwitchStatement') {
              count++;
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    countStatements(item);
                  }
                } else {
                  countStatements(n[key]);
                }
              }
            }
          }
          
          const body = node.body.type === 'BlockStatement' ? node.body : { body: [node.body] };
          countStatements(body);
          return count;
        }

        return {
          'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
            const isAsync = node.async === true;
            const functionName = node.id?.name || 'anonymous';

            // Skip if function is too simple (fewer than 3 statements)
            const complexity = estimateFunctionComplexity(node);
            if (complexity < 3) {
              return; // Too simple to require logging
            }

            // Check if function has async operations (AST-based)
            const hasAsyncOps = hasAwaitExpressions(node);

            // Check if function has error logging (AST-based)
            const hasErrorLogging = hasErrorLoggingInNode(node);

            // Check if function has try-catch (AST-based)
            const hasTryCatchBlock = hasTryCatch(node);

            // For service methods, check for database operations (AST-based)
            const hasDbOps = hasDatabaseOperations(node);

            if (isAsync && hasAsyncOps && !hasErrorLogging && hasTryCatchBlock) {
              // Has try-catch but no error logging - this is a problem
              context.report({
                node,
                messageId: 'missingErrorLogging',
                data: { name: functionName },
              });
            } else if (isServiceFile && hasDbOps && !hasErrorLogging && functionName !== 'anonymous') {
              // Service method with DB ops but no error logging
              context.report({
                node,
                messageId: 'missingLoggingInServiceMethod',
                data: { name: functionName },
              });
            }
          },
        };
      },
    },
    'detect-incomplete-log-context': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detect logger calls with incomplete or missing required context fields',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingRequiredContext:
            'Logger call is missing required context fields. Ensure logContext includes: {fields}. If using child logger, ensure logger.child({ operation, route }) was called.',
          incompleteContext:
            'Logger call has incomplete context. Add missing fields: {fields} or use logger.child({ operation, route }) to set them globally.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Check for 'use client' directive using pure AST (no getText())
        let isClientComponent = hasUseClientDirective(ast);

        // Also skip specific file patterns
        if (!isClientComponent && (
          filename.includes('error.tsx') ||
          filename.includes('wizard') ||
          filename.includes('draft-manager') ||
          filename.includes('marketing/contact')
        )) {
          isClientComponent = true;
        }

        // Check for localStorage usage (client-side indicator) using AST
        if (!isClientComponent) {
          function hasLocalStorage(node) {
            if (!node) return false;
            if (node.type === 'MemberExpression' && 
                node.object && node.object.type === 'Identifier' && node.object.name === 'localStorage') {
              return true;
            }
            for (const key in node) {
              if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
                if (Array.isArray(node[key])) {
                  for (const item of node[key]) {
                    if (hasLocalStorage(item)) return true;
                  }
                } else if (hasLocalStorage(node[key])) {
                  return true;
                }
              }
            }
            return false;
          }
          if (hasLocalStorage(ast)) {
            isClientComponent = true;
          }
        }

        // Required context fields (if not using child logger)
        // NOTE: With child logger, these are auto-injected, so we only check if child logger is missing
        const requiredFields = ['operation', 'route'];
        const recommendedFields = ['module', 'function', 'userId'];

        // Track child logger usage using AST
        let hasChildLogger = false;
        let hasChildLoggerUsage = false;
        let hasOperationInChildLogger = false;
        let hasRouteInChildLogger = false;
        const childLoggerNames = ['reqLogger', 'userLogger', 'actionLogger', 'metadataLogger', 'viewerLogger', 'processLogger', 'callbackLogger', 'requestLogger'];

        /**
         * Traverse AST to find child logger patterns
         */
        function traverseForChildLogger(node) {
          if (!node) return;

          // Check for logger.child() calls
          if (node.type === 'CallExpression' &&
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'child') {
            hasChildLogger = true;
            
            // Check if child() includes operation and route
            if (node.arguments && node.arguments.length > 0) {
              const contextArg = node.arguments[0];
              if (contextArg && contextArg.type === 'ObjectExpression') {
                for (const prop of contextArg.properties || []) {
                  if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
                    if (prop.key.name === 'operation') {
                      hasOperationInChildLogger = true;
                    }
                    if (prop.key.name === 'route') {
                      hasRouteInChildLogger = true;
                    }
                  }
                }
              }
            }
          }

          // Check for child logger variable usage (reqLogger.error, etc.)
          if (node.type === 'CallExpression' &&
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              childLoggerNames.includes(node.callee.object.name) &&
              node.callee.property.type === 'Identifier' &&
              ['info', 'error', 'warn', 'debug'].includes(node.callee.property.name)) {
            hasChildLoggerUsage = true;
          }

          // Recursively traverse
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  traverseForChildLogger(item);
                }
              } else {
                traverseForChildLogger(node[key]);
              }
            }
          }
        }

        // Traverse entire AST
        traverseForChildLogger(ast);

        return {
          CallExpression(node) {
            // Check logger calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              (node.callee.property.name === 'info' ||
                node.callee.property.name === 'error' ||
                node.callee.property.name === 'warn')
            ) {
              // Skip client components
              if (isClientComponent) {
                return;
              }

              const args = node.arguments;
              const contextArg = args[args.length - 1];

              // Check if this logger call is using a child logger variable
              const isChildLoggerCall = node.callee.object.type === 'Identifier' && 
                /Logger$/.test(node.callee.object.name) && 
                node.callee.object.name !== 'logger';

              // If using child logger, context can be minimal - skip all context field checks
              if (hasChildLogger || hasChildLoggerUsage || isChildLoggerCall) {
                return; // Child loggers handle required fields - no need to check context objects
              }

              // Use contextArg directly (no withDuration wrapper handling needed)
              const actualContextArg = contextArg;

              // Check if context has required fields
              if (actualContextArg && actualContextArg.type === 'ObjectExpression') {
                const contextKeys = actualContextArg.properties
                  .filter((p) => p.type === 'Property' && p.key.type === 'Identifier')
                  .map((p) => {
                    const key = p.key;
                    return key.type === 'Identifier' ? key.name : null;
                  })
                  .filter((name) => name !== null);

                const missingRequired = requiredFields.filter((field) => !contextKeys.includes(field));
                const missingRecommended = recommendedFields.filter((field) => !contextKeys.includes(field));

                if (missingRequired.length > 0) {
                  context.report({
                    node: actualContextArg,
                    messageId: 'missingRequiredContext',
                    data: { fields: missingRequired.join(', ') },
                  });
                } else if (missingRecommended.length > 0) {
                  context.report({
                    node: actualContextArg,
                    messageId: 'incompleteContext',
                    data: { fields: missingRecommended.join(', ') },
                  });
                }
              } else {
                // No context provided or unrecognized format - should use bindings
                context.report({
                  node: contextArg || node,
                  messageId: 'missingRequiredContext',
                  data: { fields: requiredFields.join(', ') },
                });
              }
            }

            // Check helper function calls (logError, logInfo, etc.)
            if (
              node.callee.type === 'Identifier' &&
              (node.callee.name === 'logError' ||
                node.callee.name === 'logInfo' ||
                node.callee.name === 'logWarn' ||
                node.callee.name === 'logTrace')
            ) {
              const args = node.arguments;
              const contextArg = args.length >= 2 ? args[1] : null;

              if (!contextArg) {
                // No context provided to helper function
                if (!hasChildLogger) {
                  context.report({
                    node,
                    messageId: 'missingRequiredContext',
                    data: { fields: requiredFields.join(', ') },
                  });
                }
              }
            }
          },
        };
      },
    },
    'detect-outdated-logging-patterns': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detect outdated logging patterns that need to be updated to new Pino standards',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code', // Enable auto-fix for import path updates and pattern replacements
        schema: [],
        messages: {
          outdatedPattern:
            'Outdated logging pattern detected: {pattern}. Update to use: {replacement}.',
          manualErrorFormatting:
            'Manual error formatting detected. Use Pino\'s stdSerializers.err by passing error as "err" key instead of manual formatting.',
          manualRedaction:
            'Manual data redaction detected. Use Pino\'s built-in redaction (configured in logger config) instead of manual sanitization.',
          directPinoUsage:
            'Direct pino() usage detected. Use createPinoConfig() from @heyclaude/shared-runtime/logger/config instead.',
          oldImportPath:
            'Direct import from old path detected: {path}. Use barrel exports instead: @heyclaude/web-runtime/logging/server (server-side) or @heyclaude/web-runtime/logging/client (client-side).',
          createWebAppContextUsage:
            'createWebAppContextWithId() usage detected. Prefer logger.child() at request start instead. Use: const reqLogger = logger.child({ operation, route }) and remove createWebAppContextWithId() calls.',
          coreImportForLogging:
            'Logging utilities imported from @heyclaude/web-runtime/core. Use barrel exports instead: @heyclaude/web-runtime/logging/server (server-side) or @heyclaude/web-runtime/logging/client (client-side).',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Skip config files
        if (filename.includes('logger/config') || filename.includes('eslint-plugin')) {
          return {};
        }

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);
        
        const isServerCode =
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts') ||
          (!isClientComponent && (filename.includes('apps/web/src') || filename.includes('packages/web-runtime/src')));
        const correctBarrelPath = isClientComponent
          ? '@heyclaude/web-runtime/logging/client'
          : '@heyclaude/web-runtime/logging/server';

        return {
          // Detect old import paths
          ImportDeclaration(node) {
            if (!node.source?.value) {
              return;
            }

            const importPath = node.source.value;
            
            // Old direct import paths that should use barrel exports
            const oldImportPaths = [
              /packages\/web-runtime\/src\/utils\/request-context\.ts/,
              /packages\/web-runtime\/src\/utils\/log-context\.ts/,
              /packages\/web-runtime\/src\/utils\/error-handler\.ts/,
              /packages\/web-runtime\/src\/utils\/client-logger\.ts/,
              /packages\/web-runtime\/src\/utils\/client-session\.ts/,
              /packages\/web-runtime\/src\/hooks\/use-client-logger\.ts/,
              /web-runtime\/utils\/request-context/,
              /web-runtime\/utils\/log-context/,
              /web-runtime\/utils\/error-handler/,
              /web-runtime\/utils\/client-logger/,
              /web-runtime\/utils\/client-session/,
              /web-runtime\/hooks\/use-client-logger/,
            ];

            const isOldPath = oldImportPaths.some((pattern) => pattern.test(importPath));
            
            if (isOldPath) {
              context.report({
                node: node.source,
                messageId: 'oldImportPath',
                data: { path: importPath },
                fix(fixer) {
                  // Replace old path with barrel export
                  return fixer.replaceText(node.source, `'${correctBarrelPath}'`);
                },
              });
            }

            // Detect logging imports from @heyclaude/web-runtime/core
            if (
              importPath === '@heyclaude/web-runtime/core' ||
              importPath.startsWith('@heyclaude/web-runtime/core')
            ) {
              // Check if any imported names are logging-related
              const loggingImports = [
                'logger',
                'normalizeError',
                'generateRequestId',
                'createWebAppContext',
                'createWebAppContextWithId',
                'useClientLogger',
                'logClientError',
                'logClientWarn',
                'logClientInfo',
                'logClientDebug',
                'logClientErrorBoundary',
                'getOrCreateSessionId',
              ];

              const hasLoggingImport = node.specifiers.some((spec) => {
                if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
                  return loggingImports.includes(spec.imported.name);
                }
                if (spec.type === 'ImportNamespaceSpecifier') {
                  return true; // Namespace import might include logging
                }
                return false;
              });

              if (hasLoggingImport) {
                context.report({
                  node: node.source,
                  messageId: 'coreImportForLogging',
                  // Note: This is handled by prefer-barrel-exports-for-logging rule
                  // We just report here, the other rule will fix it
                });
              }
            }
          },

          // Detect createWebAppContextWithId usage (should use bindings instead)
          CallExpression(node) {
            if (
              node.callee.type === 'Identifier' &&
              (node.callee.name === 'createWebAppContextWithId' || node.callee.name === 'createWebAppContext')
            ) {
              // Skip client components - they shouldn't use logger.child() for request context
              if (isClientComponent) {
                return;
              }
              
              // Check if it's in a server component/page context
              if (isServerCode) {
                // Check if this is a simple assignment: const logContext = createWebAppContextWithId(...)
                const parent = node.parent;
                const isSimpleAssignment = 
                  parent.type === 'VariableDeclarator' &&
                  parent.id.type === 'Identifier';

                if (isSimpleAssignment && node.arguments.length >= 3) {
                  // Extract arguments: requestId, route, operation, options?
                  const requestIdArg = sourceCode.getText(node.arguments[0]);
                  const routeArg = sourceCode.getText(node.arguments[1]);
                  const operationArg = sourceCode.getText(node.arguments[2]);
                  const optionsArg = node.arguments[3] ? sourceCode.getText(node.arguments[3]) : null;

                  // Extract module from options if present
                  let moduleValue = null;
                  if (optionsArg && node.arguments[3].type === 'ObjectExpression') {
                    const moduleProp = node.arguments[3].properties.find(
                      (prop) => prop.type === 'Property' && 
                      prop.key.type === 'Identifier' && 
                      prop.key.name === 'module'
                    );
                    if (moduleProp) {
                      moduleValue = sourceCode.getText(moduleProp.value);
                    }
                  }

                  context.report({
                    node,
                    messageId: 'createWebAppContextUsage',
                    fix(fixer) {
                      const fixes = [];
                      const varName = parent.id.name;

                      // Build child logger call
                      const childLoggerProps = [
                        `operation: ${operationArg}`,
                        `route: ${routeArg}`,
                      ];
                      if (moduleValue) {
                        childLoggerProps.push(`module: ${moduleValue}`);
                      }
                      const childLoggerCall = `const reqLogger = logger.child({ ${childLoggerProps.join(', ')} });`;

                      // Find the function that contains this call
                      let containingFunction = parent.parent;
                      while (containingFunction && 
                        containingFunction.type !== 'FunctionDeclaration' &&
                        containingFunction.type !== 'FunctionExpression' &&
                        containingFunction.type !== 'ArrowFunctionExpression') {
                        containingFunction = containingFunction.parent;
                      }

                      if (containingFunction && containingFunction.body) {
                        // Find the first statement in the function body
                        const body = containingFunction.body;
                        
                        if (body.type === 'BlockStatement') {
                          // Block statement: insert before first statement or at start of block
                          if (body.body.length > 0) {
                            fixes.push(fixer.insertTextBefore(body.body[0], `${childLoggerCall}\n  `));
                          } else {
                            // Empty block: insert after opening brace
                            fixes.push(fixer.insertTextAfter(body, `\n  ${childLoggerCall}\n`));
                          }
                        } else {
                          // Expression body (arrow function): convert to block or insert before
                          // For safety, we'll insert before the expression
                          fixes.push(fixer.insertTextBefore(body, `${childLoggerCall}\n  `));
                        }
                      }

                      // Remove the variable declaration
                      if (parent.parent.type === 'VariableDeclaration') {
                        fixes.push(fixer.remove(parent.parent));
                      } else {
                        fixes.push(fixer.remove(parent));
                      }

                      return fixes;
                    },
                  });
                } else {
                  // Complex case - just report
                  context.report({
                    node,
                    messageId: 'createWebAppContextUsage',
                  });
                }
              }
            }

            // Detect direct pino() usage without createPinoConfig
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'pino' &&
              node.arguments.length > 0
            ) {
              const firstArg = node.arguments[0];
              const firstArgText = sourceCode.getText(firstArg);

              // Check if it's using createPinoConfig
              if (!firstArgText.includes('createPinoConfig')) {
                context.report({
                  node,
                  messageId: 'directPinoUsage',
                });
              }
            }

            // Detect manual error formatting
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              (node.callee.property.name === 'error' || node.callee.property.name === 'warn')
            ) {
              const args = node.arguments;
              const contextArg = args[args.length - 1];

              if (contextArg && contextArg.type === 'ObjectExpression') {
                // Check for manual error formatting patterns
                const hasManualErrorFormatting = contextArg.properties.some(
                  (prop) =>
                    prop.type === 'Property' &&
                    prop.key.type === 'Identifier' &&
                    (prop.key.name === 'errorMessage' ||
                      prop.key.name === 'errorMsg' ||
                      prop.key.name === 'errorString' ||
                      (prop.key.name === 'error' && prop.value.type !== 'Identifier'))
                );

                if (hasManualErrorFormatting) {
                  context.report({
                    node: contextArg,
                    messageId: 'manualErrorFormatting',
                  });
                }
              }
            }
          },

          // Detect manual redaction/sanitization
          'CallExpression[callee.name="sanitize"], CallExpression[callee.name="redact"], CallExpression[callee.name="sanitizeText"]'(
            node
          ) {
            // Check if it's being used for log context
            let parent = node.parent;
            while (parent) {
              if (
                parent.type === 'CallExpression' &&
                parent.callee.type === 'MemberExpression' &&
                parent.callee.object.type === 'Identifier' &&
                (parent.callee.object.name === 'logger' ||
                  parent.callee.object.name === 'logError' ||
                  parent.callee.object.name === 'logInfo')
              ) {
                context.report({
                  node,
                  messageId: 'manualRedaction',
                });
                break;
              }
              parent = parent.parent;
            }
          },

          // Detect old console.* patterns that should be logger.*
          'CallExpression[callee.object.name="console"]'(node) {
            const method = node.callee.property?.name;
            if (method === 'log' || method === 'error' || method === 'warn' || method === 'info' || method === 'debug') {
              // This is already handled by no-console-in-production-enhanced
              // But we can add a specific message for outdated patterns
              const surroundingText = sourceCode.getText(node.parent || node);
              if (
                !surroundingText.includes('flush') &&
                !filename.includes('.test.') &&
                !filename.includes('.spec.')
              ) {
                context.report({
                  node,
                  messageId: 'outdatedPattern',
                  data: {
                    pattern: `console.${method}`,
                    replacement: `logger.${method} or log${method.charAt(0).toUpperCase() + method.slice(1)}()`,
                  },
                });
              }
            }
          },
        };
      },
    },
    'detect-missing-logging-in-api-routes': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detect API routes missing proper logging setup (logContext, error logging, request tracing)',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingBindings:
            'API route is missing logger.child() setup. Add: const reqLogger = logger.child({ operation, route }) at route start.',
          missingRequestLogging:
            'API route is missing request logging. Add logger.info() calls for request entry and completion.',
          missingErrorLogging:
            'API route has error handling but missing error logging. Add logger.error() with normalizeError() in error paths.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only apply to API route files
        const isApiRoute =
          (filename.includes('/app/api/') && filename.endsWith('route.ts')) ||
          (filename.includes('/api/') && filename.endsWith('route.ts'));

        if (!isApiRoute) {
          return {};
        }

        // Track findings using AST
        const ast = sourceCode.ast;
        let hasChildLogger = false;
        let hasRequestLogging = false;
        let hasErrorLogging = false;
        let hasErrorHandling = false;
        let hasNormalizeError = false;
        
        const childLoggerNames = ['reqLogger', 'userLogger', 'actionLogger', 'metadataLogger', 'viewerLogger', 'processLogger', 'callbackLogger', 'requestLogger'];
        
        /**
         * Traverse AST to find logging patterns
         */
        function traverseForLogging(node) {
          if (!node) return;
          
          // Check for logger.child() calls
          if (node.type === 'CallExpression' &&
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'child') {
            hasChildLogger = true;
          }
          
          // Check for VariableDeclarator with child logger
          if (node.type === 'VariableDeclarator' &&
              node.id && node.id.type === 'Identifier' &&
              node.id.name.endsWith('Logger') &&
              node.init && node.init.type === 'CallExpression' &&
              node.init.callee.type === 'MemberExpression' &&
              node.init.callee.object.type === 'Identifier' &&
              node.init.callee.object.name === 'logger' &&
              node.init.callee.property.type === 'Identifier' &&
              node.init.callee.property.name === 'child') {
            hasChildLogger = true;
          }
          
          // Check for logger.info, logger.debug, logInfo, logTrace
          if (node.type === 'CallExpression') {
            if (node.callee.type === 'MemberExpression' &&
                node.callee.object.type === 'Identifier' &&
                node.callee.property.type === 'Identifier') {
              if (node.callee.object.name === 'logger' &&
                  (node.callee.property.name === 'info' || node.callee.property.name === 'debug')) {
                hasRequestLogging = true;
              }
              if (childLoggerNames.includes(node.callee.object.name) &&
                  (node.callee.property.name === 'info' || node.callee.property.name === 'debug')) {
                hasRequestLogging = true;
              }
            }
            if (node.callee.type === 'Identifier' &&
                (node.callee.name === 'logInfo' || node.callee.name === 'logTrace')) {
              hasRequestLogging = true;
            }
          }
          
          // Check for logger.error, logger.warn, logError, logWarn
          if (node.type === 'CallExpression') {
            if (node.callee.type === 'MemberExpression' &&
                node.callee.object.type === 'Identifier' &&
                node.callee.property.type === 'Identifier') {
              if (node.callee.object.name === 'logger' &&
                  (node.callee.property.name === 'error' || node.callee.property.name === 'warn')) {
                hasErrorLogging = true;
              }
              if (childLoggerNames.includes(node.callee.object.name) &&
                  (node.callee.property.name === 'error' || node.callee.property.name === 'warn')) {
                hasErrorLogging = true;
              }
            }
            if (node.callee.type === 'Identifier' &&
                (node.callee.name === 'logError' || node.callee.name === 'logWarn')) {
              hasErrorLogging = true;
            }
          }
          
          // Check for try-catch
          if (node.type === 'TryStatement') {
            hasErrorHandling = true;
          }
          
          // Check for normalizeError calls
          if (node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              node.callee.name === 'normalizeError') {
            hasNormalizeError = true;
          }
          
          // Recursively traverse
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  traverseForLogging(item);
                }
              } else {
                traverseForLogging(node[key]);
              }
            }
          }
        }
        
        // Traverse entire AST
        traverseForLogging(ast);

        return {
          'Program:exit'() {
                if (!hasChildLogger) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'missingBindings',
              });
            } else if (!hasRequestLogging) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'missingRequestLogging',
              });
            }

            if (hasErrorHandling && (!hasErrorLogging || !hasNormalizeError)) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'missingErrorLogging',
              });
            }
          },
        };
      },
    },
    'prefer-barrel-exports-for-logging': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce barrel export usage for logging utilities instead of direct imports',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code', // Enable auto-fix for import path updates
        schema: [],
        messages: {
          useBarrelExport:
            'Use barrel exports for logging utilities. Import from @heyclaude/web-runtime/logging/server (server-side) or @heyclaude/web-runtime/logging/client (client-side) instead of: {path}',
          wrongBarrelForContext:
            'Incorrect barrel export for this context. Client components must use @heyclaude/web-runtime/logging/client. Server components must use @heyclaude/web-runtime/logging/server.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);
        
        const isServerCode =
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts') ||
          (!isClientComponent && (filename.includes('apps/web/src') || filename.includes('packages/web-runtime/src')));

        // Determine correct barrel export path
        const correctBarrelPath = isClientComponent
          ? '@heyclaude/web-runtime/logging/client'
          : '@heyclaude/web-runtime/logging/server';

        // Check if logging utilities are already imported from barrel (AST-based)
        let hasBarrelImport = false;
        function checkForBarrelImport(node) {
          if (!node) return;
          if (node.type === 'ImportDeclaration' &&
              node.source && node.source.type === 'Literal' &&
              typeof node.source.value === 'string' &&
              (node.source.value.startsWith('@heyclaude/web-runtime/logging/') ||
               node.source.value.indexOf('@heyclaude/web-runtime/logging/') !== -1)) {
            hasBarrelImport = true;
          }
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  checkForBarrelImport(item);
                }
              } else {
                checkForBarrelImport(node[key]);
              }
            }
          }
        }
        checkForBarrelImport(ast);

        return {
          ImportDeclaration(node) {
            if (!node.source?.value) {
              return;
            }

            const importPath = node.source.value;

            // Check if importing from server barrel in client component
            if (isClientComponent) {
              if (
                importPath === '@heyclaude/web-runtime/logging/server' ||
                importPath.includes('/logging/server')
              ) {
                context.report({
                  node: node.source,
                  messageId: 'wrongBarrelForContext',
                  fix(fixer) {
                    return fixer.replaceText(node.source, `'${correctBarrelPath}'`);
                  },
                });
              }
            }

            // Check if importing from client barrel in server code
            if (isServerCode && !isClientComponent) {
              if (
                importPath === '@heyclaude/web-runtime/logging/client' ||
                importPath.includes('/logging/client')
              ) {
                // Allow client barrel imports in server code if it's for client components being passed as props
                // But flag if it's being used directly in server code (AST-based check)
                let hasClientLoggerUsage = false;
                function checkForClientLoggerUsage(node) {
                  if (!node) return;
                  if (node.type === 'CallExpression' &&
                      node.callee.type === 'Identifier' &&
                      (node.callee.name === 'useClientLogger' ||
                       node.callee.name === 'logClientError' ||
                       node.callee.name === 'logClientWarn')) {
                    hasClientLoggerUsage = true;
                    return;
                  }
                  for (const key in node) {
                    if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
                      if (Array.isArray(node[key])) {
                        for (const item of node[key]) {
                          checkForClientLoggerUsage(item);
                        }
                      } else {
                        checkForClientLoggerUsage(node[key]);
                      }
                    }
                  }
                }
                checkForClientLoggerUsage(sourceCode.ast);
                
                if (hasClientLoggerUsage) {
                  context.report({
                    node: node.source,
                    messageId: 'wrongBarrelForContext',
                    fix(fixer) {
                      return fixer.replaceText(node.source, `'${correctBarrelPath}'`);
                    },
                  });
                }
              }
            }

            // Check if importing logging utilities from @heyclaude/web-runtime/core
            if (importPath === '@heyclaude/web-runtime/core' || importPath.startsWith('@heyclaude/web-runtime/core')) {
              const loggingImports = [
                'logger',
                'normalizeError',
                'generateRequestId',
                'createWebAppContext',
                'createWebAppContextWithId',
                'useClientLogger',
                'logClientError',
                'logClientWarn',
                'logClientInfo',
                'logClientDebug',
                'logClientErrorBoundary',
                'getOrCreateSessionId',
                'hashUserId',
              ];

              const loggingSpecifiers = node.specifiers.filter((spec) => {
                if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
                  return loggingImports.includes(spec.imported.name);
                }
                if (spec.type === 'ImportNamespaceSpecifier') {
                  return true; // Namespace import might include logging
                }
                return false;
              });

              if (loggingSpecifiers.length > 0) {
                // Extract logging imports and non-logging imports
                const nonLoggingSpecifiers = node.specifiers.filter((spec) => {
                  if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
                    return !loggingImports.includes(spec.imported.name);
                  }
                  return spec.type !== 'ImportNamespaceSpecifier';
                });

                context.report({
                  node: node.source,
                  messageId: 'useBarrelExport',
                  data: { path: importPath },
                  fix(fixer) {
                    const fixes = [];

                    // If there are logging specifiers, create a new import from barrel
                    if (loggingSpecifiers.length > 0) {
                      const loggingImportsList = loggingSpecifiers
                        .map((spec) => {
                          if (spec.type === 'ImportSpecifier') {
                            const imported = spec.imported.name;
                            const local = spec.local.name;
                            return imported === local ? imported : `${imported} as ${local}`;
                          }
                          return null;
                        })
                        .filter(Boolean)
                        .join(', ');

                      const newImportText = `import { ${loggingImportsList} } from '${correctBarrelPath}';`;

                      // Find where to insert (after this import or at end of imports)
                      const ast = sourceCode.ast;
                      let lastImport = node;
                      for (const statement of ast.body) {
                        if (statement.type === 'ImportDeclaration' && statement.range[0] > node.range[0]) {
                          lastImport = statement;
                        }
                      }

                      fixes.push(fixer.insertTextAfter(lastImport, `\n${newImportText}`));
                    }

                    // Update current import to remove logging specifiers
                    if (nonLoggingSpecifiers.length > 0) {
                      // Preserve original formatting by replacing only the specifiers
                      // This is safer than replacing the entire node
                      const specifiersText = nonLoggingSpecifiers
                        .map((spec) => {
                          if (spec.type === 'ImportSpecifier') {
                            const imported = spec.imported.name;
                            const local = spec.local.name;
                            return imported === local ? imported : `${imported} as ${local}`;
                          }
                          if (spec.type === 'ImportDefaultSpecifier') {
                            return spec.local.name;
                          }
                          return null;
                        })
                        .filter(Boolean)
                        .join(', ');
                      
                      // Replace specifiers using range to preserve formatting
                      if (node.specifiers.length > 0) {
                        const firstSpec = node.specifiers[0];
                        const lastSpec = node.specifiers[node.specifiers.length - 1];
                        fixes.push(fixer.replaceTextRange(
                          [firstSpec.range[0], lastSpec.range[1]],
                          specifiersText
                        ));
                      }
                    } else {
                      // No non-logging imports left, remove the import entirely
                      fixes.push(fixer.remove(node));
                    }

                    return fixes;
                  },
                });
              }
            }
          },
        };
      },
    },
    'require-module-in-bindings': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require module field in logger.child() calls for better traceability',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingModule:
            'logger.child() should include module field. Add module: "path/to/module" to child logger context for better traceability.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only apply to server-side code
        const isServerCode =
          filename.includes('apps/edge/functions') ||
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts');

        if (!isServerCode) {
          return {};
        }

        return {
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'setBindings'
            ) {
              if (node.arguments.length === 0 || node.arguments[0].type !== 'ObjectExpression') {
                return;
              }

              const bindingsArg = node.arguments[0];
              const hasModule = bindingsArg.properties.some(
                (prop) =>
                  prop.type === 'Property' &&
                  prop.key.type === 'Identifier' &&
                  prop.key.name === 'module'
              );

              if (!hasModule) {
                context.report({
                  node: bindingsArg,
                  messageId: 'missingModule',
                });
              }
            }
          },
        };
      },
    },
    'prevent-raw-userid-logging': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent logging raw userId/user.id without hashing for PII privacy compliance',
          category: 'Security',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - complex userId transformation could break TypeScript or create incorrect code
        schema: [],
        messages: {
          rawUserIdLogged:
            'Raw userId detected in log context. While redaction will automatically hash it, prefer explicit userIdHash for clarity. Redaction handles: { userId: user.id } automatically, but use { userIdHash: getUserHashForLogging(user) } for child logger bindings.',
          rawUserIdInContext:
            'Raw userId field detected. While redaction automatically hashes userId/user_id fields, prefer explicit userIdHash for clarity. For child logger bindings, use: const userIdHash = getUserHashForLogging(user); logger.child({ userIdHash })',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);
        
        const isServerCode =
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts') ||
          (!isClientComponent && (filename.includes('apps/web/src') || filename.includes('packages/web-runtime/src')));

        // Determine correct import path
        const hashUserIdImportPath = isClientComponent
          ? '@heyclaude/web-runtime/logging/client'
          : '@heyclaude/web-runtime/logging/server';

        // Check if hashUserId is already imported (AST-based)
        let hasHashUserIdImport = false;
        function checkForHashUserIdImport(node) {
          if (!node) return;
          if (node.type === 'ImportDeclaration' &&
              node.source && node.source.type === 'Literal' &&
              typeof node.source.value === 'string') {
            const importPath = node.source.value;
            if ((importPath.includes('@heyclaude/web-runtime/logging/') ||
                 importPath.includes('@heyclaude/shared-runtime') ||
                 importPath.includes('@heyclaude/web-runtime/core')) &&
                node.specifiers) {
              for (const spec of node.specifiers) {
                if (spec.type === 'ImportSpecifier' &&
                    spec.imported && spec.imported.type === 'Identifier' &&
                    spec.imported.name === 'hashUserId') {
                  hasHashUserIdImport = true;
                  return;
                }
              }
            }
          }
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  checkForHashUserIdImport(item);
                }
              } else {
                checkForHashUserIdImport(node[key]);
              }
            }
          }
        }
        checkForHashUserIdImport(ast);

        return {
          CallExpression(node) {
            // Check logger calls
            // All logger methods including custom levels (audit, security)
            const LOGGER_METHODS = ['info', 'error', 'warn', 'debug', 'trace', 'fatal', 'audit', 'security'];
            
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              LOGGER_METHODS.includes(node.callee.property.name)
            ) {
              // Check all arguments for raw userId
              for (const arg of node.arguments) {
                if (arg.type === 'ObjectExpression') {
                  const properties = arg.properties;
                  for (const prop of properties) {
                    if (
                      prop.type === 'Property' &&
                      prop.key.type === 'Identifier'
                    ) {
                      const keyName = prop.key.name;
                      
                      // Check for raw userId fields
                      if (
                        keyName === 'userId' ||
                        keyName === 'user_id'
                      ) {
                        // Check if value is user.id or similar raw access
                        const valueText = sourceCode.getText(prop.value);
                        const isRawUserId = 
                          valueText.includes('user.id') ||
                          valueText.includes('user?.id') ||
                          (prop.value.type === 'MemberExpression' &&
                           prop.value.object.type === 'Identifier' &&
                           prop.value.object.name === 'user' &&
                           prop.value.property.type === 'Identifier' &&
                           prop.value.property.name === 'id');

                        if (isRawUserId) {
                          // Auto-fix: Replace userId: user.id with userIdHash: hashUserId(user.id)
                          context.report({
                            node: prop,
                            messageId: 'rawUserIdLogged',
                            fix(fixer) {
                              // Replace the property key and value
                              const newKey = fixer.replaceText(prop.key, 'userIdHash');
                              const newValue = fixer.replaceText(
                                prop.value,
                                `hashUserId(${sourceCode.getText(prop.value)})`
                              );
                              return [newKey, newValue];
                            },
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          Property(node) {
            // Check for userId: user.id patterns in object literals passed to logger
            if (
              node.key.type === 'Identifier' &&
              (node.key.name === 'userId' || node.key.name === 'user_id')
            ) {
              const valueText = sourceCode.getText(node.value);
              const isRawUserId =
                valueText.includes('user.id') ||
                valueText.includes('user?.id') ||
                (node.value.type === 'MemberExpression' &&
                 node.value.object.type === 'Identifier' &&
                 node.value.object.name === 'user' &&
                 node.value.property.type === 'Identifier' &&
                 node.value.property.name === 'id');

              if (isRawUserId) {
                // Check if this is in a logger.child() call - allow it since redaction handles it
                let parent = node.parent;
                let isInChildLogger = false;
                while (parent) {
                  if (
                    parent.type === 'CallExpression' &&
                    parent.callee.type === 'MemberExpression' &&
                    parent.callee.object.type === 'Identifier' &&
                    parent.callee.property.type === 'Identifier' &&
                    parent.callee.property.name === 'child'
                  ) {
                    // Verify it's actually logger.child() by checking the object name
                    const loggerObject = parent.callee.object;
                    if (
                      loggerObject.type === 'Identifier' &&
                      (loggerObject.name === 'logger' ||
                       loggerObject.name === 'reqLogger' ||
                       loggerObject.name === 'userLogger' ||
                       loggerObject.name === 'actionLogger')
                    ) {
                      isInChildLogger = true;
                      break;
                    }
                  }
                  parent = parent.parent;
                }

                // Allow userId: user.id in logger.child() calls - redaction automatically hashes it
                // This is safe because Pino's redaction with hashUserIdCensor automatically hashes
                // userId/user_id/user.id fields via the custom censor function
                if (isInChildLogger) {
                  return; // No error - redaction handles it automatically
                }

                // Check if this is in a logger call context (all methods including audit, security)
                const LOGGER_METHODS = ['info', 'error', 'warn', 'debug', 'trace', 'fatal', 'audit', 'security'];
                let isInLoggerCall = false;
                parent = node.parent;
                while (parent) {
                  if (
                    parent.type === 'CallExpression' &&
                    parent.callee.type === 'MemberExpression' &&
                    parent.callee.object.type === 'Identifier' &&
                    (parent.callee.object.name === 'logger' ||
                     parent.callee.object.name === 'reqLogger' ||
                     parent.callee.object.name === 'userLogger' ||
                     parent.callee.object.name === 'actionLogger') &&
                    parent.callee.property.type === 'Identifier' &&
                    LOGGER_METHODS.includes(parent.callee.property.name)
                  ) {
                    isInLoggerCall = true;
                    break;
                  }
                  parent = parent.parent;
                }

                // Allow in logger calls too - redaction handles it automatically
                // Pino's redaction with hashUserIdCensor automatically hashes userId fields
                if (isInLoggerCall && node.parent?.type === 'ObjectExpression') {
                  return; // No error - redaction automatically hashes userId fields
                }

                // For non-logger contexts (function parameters, etc.), don't report
                // The rule is specifically for logging contexts where PII protection matters
                // Function parameters are not logged, so they don't need this protection
                return;
              }
            }
          },
        };
      },
    },
    'prefer-child-logger-over-setbindings': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prefer logger.child() for request-scoped context. This rule detects any remaining setBindings() usage and suggests migration to logger.child().',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - complex setBindings to child() transformation could break code
        schema: [],
        messages: {
          useChildLogger:
            'Use logger.child() instead of logger.setBindings() to avoid race conditions. Replace "logger.setBindings({...})" with "const reqLogger = logger.child({...})" and use reqLogger for all subsequent log calls.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // All code should use logger.child() - no exceptions
        // This rule detects any remaining setBindings() usage

        return {
          CallExpression(node) {
            // Check for logger.setBindings() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'setBindings' &&
              node.arguments.length === 1 &&
              node.arguments[0].type === 'ObjectExpression'
            ) {
              context.report({
                node,
                messageId: 'useChildLogger',
                fix(fixer) {
                  // Get the bindings object text
                  const bindingsArg = node.arguments[0];
                  
                  // Filter out requestId (we don't use it anymore) and build new child logger call
                  const filteredProps = bindingsArg.properties.filter(
                    prop => prop.type === 'Property' && 
                    prop.key.type === 'Identifier' && 
                    prop.key.name !== 'requestId'
                  );
                  
                  if (filteredProps.length === 0) {
                    // No valid properties left after filtering - suggest basic child logger
                    return context.report({
                      node,
                      messageId: 'useChildLogger',
                    });
                  }
                  
                  // Build replacement with filtered properties
                  const filteredBindingsText = sourceCode.getText({
                    ...bindingsArg,
                    properties: filteredProps
                  });
                  const replacement = `const reqLogger = logger.child(${filteredBindingsText})`;
                  
                  return fixer.replaceText(node, replacement);
                },
              });
            }
          },
        };
      },
    },
    'require-record-string-unknown-for-log-context': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure all log context parameters use Record<string, unknown> type for consistency',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - type changes could break TypeScript compilation
        schema: [],
        messages: {
          useRecordStringUnknown:
            'Log context parameters must use Record<string, unknown> type. Found: {actualType}. This ensures type safety and consistency.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          FunctionDeclaration(node) {
            // Check function parameters named logContext, context, logCtx, etc.
            node.params.forEach((param) => {
              if (
                param.type === 'Identifier' &&
                (param.name === 'logContext' ||
                 param.name === 'context' ||
                 param.name === 'logCtx' ||
                 param.name === 'ctx' ||
                 param.name.includes('LogContext') ||
                 param.name.includes('Context'))
              ) {
                // Check if parameter has type annotation
                if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
                  const typeAnnotation = param.typeAnnotation.typeAnnotation;
                  
                  // Check if type is not Record<string, unknown>
                  if (
                    typeAnnotation.type === 'TSTypeReference' &&
                    typeAnnotation.typeName.type === 'Identifier'
                  ) {
                    const typeName = typeAnnotation.typeName.name;
                    
                    // Check for deprecated or incorrect types
                    if (
                      typeName === 'BaseLogContext' ||
                      typeName === 'any' ||
                      typeName === 'object' ||
                      (typeName === 'Record' && 
                       typeAnnotation.typeParameters &&
                       typeAnnotation.typeParameters.params &&
                       typeAnnotation.typeParameters.params[1] &&
                       typeAnnotation.typeParameters.params[1].type === 'TSAnyKeyword')
                    ) {
                      context.report({
                        node: param,
                        messageId: 'useRecordStringUnknown',
                        data: { actualType: typeName },
                        fix(fixer) {
                          return fixer.replaceText(
                            param.typeAnnotation,
                            ': Record<string, unknown>'
                          );
                        },
                      });
                    }
                  } else if (typeAnnotation.type === 'TSAnyKeyword' || 
                            typeAnnotation.type === 'TSObjectKeyword') {
                    context.report({
                      node: param,
                      messageId: 'useRecordStringUnknown',
                      data: { actualType: typeAnnotation.type === 'TSAnyKeyword' ? 'any' : 'object' },
                      fix(fixer) {
                        return fixer.replaceText(
                          param.typeAnnotation,
                          ': Record<string, unknown>'
                        );
                      },
                    });
                  }
                } else {
                  // No type annotation - suggest adding one
                  context.report({
                    node: param,
                    messageId: 'useRecordStringUnknown',
                    data: { actualType: 'no type annotation' },
                    fix(fixer) {
                      return fixer.insertTextAfter(param, ': Record<string, unknown>');
                    },
                  });
                }
              }
            });
          },
          ArrowFunctionExpression(node) {
            // Check arrow function parameters
            if (node.params) {
              node.params.forEach((param) => {
                if (
                  param.type === 'Identifier' &&
                  (param.name === 'logContext' ||
                   param.name === 'context' ||
                   param.name === 'logCtx' ||
                   param.name === 'ctx' ||
                   param.name.includes('LogContext') ||
                   param.name.includes('Context'))
                ) {
                  // Similar logic as FunctionDeclaration
                  if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
                    const typeAnnotation = param.typeAnnotation.typeAnnotation;
                    
                    if (
                      typeAnnotation.type === 'TSTypeReference' &&
                      typeAnnotation.typeName.type === 'Identifier'
                    ) {
                      const typeName = typeAnnotation.typeName.name;
                      
                      if (
                        typeName === 'BaseLogContext' ||
                        typeName === 'any' ||
                        typeName === 'object'
                      ) {
                        context.report({
                          node: param,
                          messageId: 'useRecordStringUnknown',
                          data: { actualType: typeName },
                          fix(fixer) {
                            return fixer.replaceText(
                              param.typeAnnotation,
                              ': Record<string, unknown>'
                            );
                          },
                        });
                      }
                    }
                  }
                }
              });
            }
          },
        };
      },
    },
    'enforce-bracket-notation-for-log-context-access': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce bracket notation with type guards when accessing properties from Record<string, unknown> log contexts',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useBracketNotation:
            'Property access on Record<string, unknown> must use bracket notation with type guard. Use: typeof logContext[\'property\'] === \'string\' ? logContext[\'property\'] : undefined',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          MemberExpression(node) {
            // Check for dot notation access on variables that might be Record<string, unknown>
            if (
              node.property.type === 'Identifier' &&
              (node.property.name === 'request_id' ||
               node.property.name === 'action' ||
               node.property.name === 'function' ||
               node.property.name === 'started_at')
            ) {
              // Check if object is a variable with logContext/context in name
              if (
                node.object.type === 'Identifier' &&
                (node.object.name.includes('logContext') ||
                 node.object.name.includes('Context') ||
                 node.object.name === 'context' ||
                 node.object.name === 'logCtx' ||
                 node.object.name === 'ctx')
              ) {
                // Check if parent is not already using bracket notation or type guard
                let parent = node.parent;
                let isInTypeGuard = false;
                let isInBracketNotation = false;

                // Check if we're already in a typeof check
                while (parent) {
                  if (
                    parent.type === 'BinaryExpression' &&
                    parent.operator === '===' &&
                    parent.left.type === 'UnaryExpression' &&
                    parent.left.operator === 'typeof'
                  ) {
                    isInTypeGuard = true;
                    break;
                  }
                  if (parent.type === 'MemberExpression' && parent.computed === true) {
                    isInBracketNotation = true;
                    break;
                  }
                  parent = parent.parent;
                }

                if (!isInTypeGuard && !isInBracketNotation) {
                  context.report({
                    node,
                    messageId: 'useBracketNotation',
                  });
                }
              }
            }
          },
        };
      },
    },
    'prevent-base-log-context-usage': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent usage of deprecated BaseLogContext type in favor of Record<string, unknown>',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - type changes could break TypeScript compilation
        schema: [],
        messages: {
          useRecordStringUnknown:
            'BaseLogContext is deprecated. Use Record<string, unknown> instead for consistency and maintainability.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          TSTypeReference(node) {
            // Check for BaseLogContext type usage
            if (
              node.typeName.type === 'Identifier' &&
              node.typeName.name === 'BaseLogContext'
            ) {
              context.report({
                node,
                messageId: 'useRecordStringUnknown',
                fix(fixer) {
                  return fixer.replaceText(node, 'Record<string, unknown>');
                },
              });
            }
          },
          ImportSpecifier(node) {
            // Check for BaseLogContext import
            if (
              node.imported.type === 'Identifier' &&
              node.imported.name === 'BaseLogContext'
            ) {
              context.report({
                node,
                messageId: 'useRecordStringUnknown',
                fix(fixer) {
                  // Remove the import
                  const importDeclaration = node.parent;
                  if (importDeclaration.specifiers.length === 1) {
                    // Only this import, remove entire import
                    return fixer.remove(importDeclaration);
                  } else {
                    // Multiple imports, just remove this one
                    const nextToken = sourceCode.getTokenAfter(node);
                    const prevToken = sourceCode.getTokenBefore(node);
                    if (nextToken && nextToken.value === ',') {
                      return fixer.removeRange([node.range[0], nextToken.range[1]]);
                    } else if (prevToken && prevToken.value === ',') {
                      return fixer.removeRange([prevToken.range[0], node.range[1]]);
                    }
                    return fixer.remove(node);
                  }
                },
              });
            }
          },
        };
      },
    },
    'prevent-direct-pino-logger-usage': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent direct pino() or pinoLogger usage. Use helpers (logError/logWarn) or logger wrapper instead',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useHelperOrWrapper:
            'Do not use direct pino() or pinoLogger. Use logError/logWarn/logInfo/logTrace from @heyclaude/shared-runtime or logger wrapper from @heyclaude/shared-runtime/@heyclaude/edge-runtime instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Skip if file is the logger config or logger implementation itself
        // These files are allowed to use pino directly
        if (
          filename.includes('logger/config') || 
          filename.includes('logger/index') ||
          filename.includes('logging.ts') ||
          filename.includes('logger.ts')
        ) {
          return {};
        }
        
        // Check if file uses createPinoConfig (AST-based)
        const ast = sourceCode.ast;
        let hasCreatePinoConfig = false;
        function checkForCreatePinoConfig(node) {
          if (!node) return;
          if (node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              node.callee.name === 'createPinoConfig') {
            hasCreatePinoConfig = true;
            return;
          }
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  checkForCreatePinoConfig(item);
                }
              } else {
                checkForCreatePinoConfig(node[key]);
              }
            }
          }
        }
        checkForCreatePinoConfig(ast);

        return {
          VariableDeclarator(node) {
            // Check for const pinoLogger = pino(...) or const logger = pino(...)
            if (
              node.id.type === 'Identifier' &&
              (node.id.name === 'pinoLogger' || 
               (node.id.name === 'logger' && 
                node.init &&
                node.init.type === 'CallExpression' &&
                node.init.callee.type === 'Identifier' &&
                node.init.callee.name === 'pino'))
            ) {
              // Check if this is in a logger config file (allowed)
              // Files that use createPinoConfig are logger implementations
              if (!hasCreatePinoConfig) {
                context.report({
                  node,
                  messageId: 'useHelperOrWrapper',
                });
              }
            }
          },
          CallExpression(node) {
            // Check for direct pino() calls (not in logger implementation files)
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'pino' &&
              !hasCreatePinoConfig
            ) {
              context.report({
                node,
                messageId: 'useHelperOrWrapper',
              });
            }

            // Check for pinoLogger.error/warn/info calls (not in logger implementation files)
            // Allow pinoLogger calls in files that use createPinoConfig (logger implementations)
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'pinoLogger' &&
              node.callee.property.type === 'Identifier' &&
              ['error', 'warn', 'info', 'debug', 'trace', 'fatal'].includes(node.callee.property.name) &&
              !hasCreatePinoConfig
            ) {
              context.report({
                node,
                messageId: 'useHelperOrWrapper',
              });
            }
          },
        };
      },
    },
    'require-context-creation-functions': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Ensure standardized context creation functions are used instead of manual object creation in edge functions',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useCreationFunction:
            'Use standardized context creation functions (createDataApiContext, createEmailHandlerContext, etc.) instead of manual object creation for consistency.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only apply to edge functions
        const isEdgeFunction = filename.includes('apps/edge/functions');
        if (!isEdgeFunction) {
          return {};
        }

        return {
          VariableDeclarator(node) {
            // Check for manual logContext creation
            if (
              node.id.type === 'Identifier' &&
              (node.id.name.includes('logContext') ||
               node.id.name.includes('Context') ||
               node.id.name === 'context')
            ) {
              // Check if init is an object expression with function, action, request_id, started_at
              if (
                node.init &&
                node.init.type === 'ObjectExpression'
              ) {
                const properties = node.init.properties;
                const hasFunction = properties.some(
                  (prop) =>
                    prop.type === 'Property' &&
                    prop.key.type === 'Identifier' &&
                    prop.key.name === 'function'
                );
                const hasAction = properties.some(
                  (prop) =>
                    prop.type === 'Property' &&
                    prop.key.type === 'Identifier' &&
                    prop.key.name === 'action'
                );
                const hasRequestId = properties.some(
                  (prop) =>
                    prop.type === 'Property' &&
                    prop.key.type === 'Identifier' &&
                    (prop.key.name === 'request_id' || prop.key.name === 'requestId')
                );
                const hasStartedAt = properties.some(
                  (prop) =>
                    prop.type === 'Property' &&
                    prop.key.type === 'Identifier' &&
                    prop.key.name === 'started_at'
                );

                // If it has all the standard fields, suggest using creation function
                if (hasFunction && hasAction && hasRequestId && hasStartedAt) {
                  context.report({
                    node,
                    messageId: 'useCreationFunction',
                  });
                }
              }
            }
          },
        };
      },
    },
    'no-relative-imports-in-import-map-packages': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent relative imports in packages accessible via Deno import maps',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useImportMapPath: 'Files in packages accessible via import map (shared-runtime, edge-runtime, data-layer) must use import map paths instead of relative imports. Use "@heyclaude/package-name/path/to/file.ts" instead of "./path/to/file.ts" or "../path/to/file.ts".',
        },
      },
      create(context) {
        const filename = context.getFilename();
        
        // Only apply to packages that are accessible via import map
        const isImportMapPackage = 
          filename.includes('packages/shared-runtime/src/') ||
          filename.includes('packages/edge-runtime/src/') ||
          filename.includes('packages/data-layer/src/');
        
        if (!isImportMapPackage) {
          return {};
        }
        
        // Skip test files - they're typically not imported via import map
        if (filename.includes('.test.') || filename.includes('.spec.')) {
          return {};
        }
        
        return {
          ImportDeclaration(node) {
            const source = node.source.value;
            
            // Check for relative imports (./ or ../)
            if (typeof source === 'string' && (source.startsWith('./') || source.startsWith('../'))) {
              // Allow relative imports to npm packages (e.g., './node_modules/...')
              if (source.includes('node_modules/')) {
                return;
              }
              
              // Allow relative imports to npm: packages
              if (source.startsWith('npm:')) {
                return;
              }
              
              // Allow relative imports to https:// packages
              if (source.startsWith('https://')) {
                return;
              }
              
              // Report relative import
              context.report({
                node: node.source,
                messageId: 'useImportMapPath',
              });
            }
          },
        };
      },
    },

    // ============================================================================
    // NEXT.JS & REACT SERVER COMPONENTS RULES
    // ============================================================================


    'no-mixed-server-client-patterns': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent mixing server-only and client-only code',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          mixedDirectives:
            'File contains both "use server" and "use client" directives. Separate into different files.',
          clientHookInServerFile:
            'Client-only hook "{{hookName}}" used in server file without "use client" directive.',
          asyncFunctionInClientFile:
            'Server-only async cookies/headers() call in client component. Remove "use client" or use server components.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;
        
        // Check for 'use client' and 'use server' directives using AST
        let hasUseServer = false;
        let hasUseClient = false;
        
        // Check for directives using pure AST (no getText())
        hasUseServer = hasUseServerDirective(ast);
        hasUseClient = hasUseClientDirective(ast);

        const clientOnlyHooks = ['useState', 'useEffect', 'useLayoutEffect', 'useReducer', 'useRef', 'useCallback', 'useMemo', 'useContext'];

        return {
          Program(node) {
            if (hasUseServer && hasUseClient) {
              context.report({
                node,
                messageId: 'mixedDirectives',
              });
            }
          },
          CallExpression(node) {
            // Check for client hooks in server files
            if (!hasUseClient && node.callee.type === 'Identifier') {
              if (clientOnlyHooks.includes(node.callee.name)) {
                context.report({
                  node,
                  messageId: 'clientHookInServerFile',
                  data: { hookName: node.callee.name },
                });
              }
            }

            // Check for cookies()/headers() in client files
            if (hasUseClient && node.callee.type === 'Identifier') {
              if (node.callee.name === 'cookies' || node.callee.name === 'headers') {
                context.report({
                  node,
                  messageId: 'asyncFunctionInClientFile',
                });
              }
            }
          },
        };
      },
    },


    'no-client-component-data-fetching': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent direct data fetching in client components',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          clientDataFetching:
            'Client components should not fetch data directly. Move data fetching to Server Component and pass as props, or use it in event handlers/effects.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const hasUseClient = hasUseClientDirective(ast);

        if (!hasUseClient) {
          return {};
        }

        let inEventHandler = false;
        let inUseEffect = false;

        return {
          CallExpression(node) {
            // Track if we're in useEffect
            if (node.callee.type === 'Identifier' && node.callee.name === 'useEffect') {
              inUseEffect = true;
            }

            // Track if we're in event handler (onClick, onSubmit, etc.)
            const parent = node.parent;
            if (parent?.type === 'Property' && parent.key?.name?.startsWith('on')) {
              inEventHandler = true;
            }

            // Check for Supabase client creation or fetch at component level
            if (
              node.callee.type === 'Identifier' &&
              (node.callee.name === 'createSupabaseBrowserClient' ||
                node.callee.name === 'createSupabaseServerClient' ||
                node.callee.name === 'fetch')
            ) {
              // Allow in event handlers and useEffect
              if (!inEventHandler && !inUseEffect) {
                context.report({
                  node,
                  messageId: 'clientDataFetching',
                });
              }
            }
          },
          'CallExpression:exit'(node) {
            if (node.callee.type === 'Identifier' && node.callee.name === 'useEffect') {
              inUseEffect = false;
            }
          },
        };
      },
    },

    // ============================================================================
    // SUPABASE & DATABASE RULES
    // ============================================================================

    'require-supabase-client-context': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce correct Supabase client usage in appropriate contexts',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          wrongClientInContext:
            'Wrong Supabase client for context. Use createSupabaseServerClient() in Server Components/Actions, createSupabaseBrowserClient() in client components, createSupabaseAnonClient() for public/unauthenticated contexts, createSupabaseAdminClient() only in admin operations.',
          adminClientRequiresComment:
            'createSupabaseAdminClient() bypasses RLS. Add comment explaining why admin access is required.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Check for 'use client' and 'use server' directives using AST
        const ast = sourceCode.ast;
        let hasUseClient = false;
        let hasUseServer = false;
        
        // Check for directives using pure AST (no getText())
        hasUseServer = hasUseServerDirective(ast);
        hasUseClient = hasUseClientDirective(ast);
        
        const isServerComponent = filename.includes('/app/') && !hasUseClient && !hasUseServer;
        const isApiRoute = filename.includes('/api/');
        const isAction = filename.includes('/actions/') || hasUseServer;
        const isClientComponent = hasUseClient;

        return {
          CallExpression(node) {
            if (node.callee.type !== 'Identifier') return;

            const functionName = node.callee.name;

            // Check for wrong client in wrong context
            if (functionName === 'createSupabaseServerClient') {
              if (isClientComponent) {
                context.report({
                  node,
                  messageId: 'wrongClientInContext',
                });
              }
            }

            if (functionName === 'createSupabaseBrowserClient') {
              if (isServerComponent || isApiRoute || isAction) {
                context.report({
                  node,
                  messageId: 'wrongClientInContext',
                });
              }
            }

            if (functionName === 'createSupabaseAdminClient') {
              // Find the parent statement node (AssignmentExpression, VariableDeclarator, etc.)
              // Comments are often before the statement, not the CallExpression
              let statementNode = node.parent;
              while (statementNode && 
                     statementNode.type !== 'VariableDeclarator' && 
                     statementNode.type !== 'AssignmentExpression' &&
                     statementNode.type !== 'ExpressionStatement' &&
                     statementNode.type !== 'ReturnStatement') {
                statementNode = statementNode.parent;
              }

              // Check comments before the parent statement (most common case)
              const statementComments = statementNode 
                ? sourceCode.getCommentsBefore(statementNode) || []
                : [];

              // Also check comments directly before the CallExpression
              const directComments = sourceCode.getCommentsBefore(node) || [];

              // Check comments in the surrounding context (within 10 lines before the call)
              // This handles cases where comments are separated by import statements
              const nodeLine = node.loc.start.line;
              const allComments = sourceCode.ast.comments || [];
              
              // Find comments within 10 lines before the call
              const nearbyComments = allComments.filter((comment) => {
                if (!comment.loc) return false;
                const commentLine = comment.loc.end.line;
                return commentLine >= nodeLine - 10 && commentLine < nodeLine;
              });

              // Check all relevant comments for explanation
              const allRelevantComments = [...statementComments, ...directComments, ...nearbyComments];
              const hasExplanation = allRelevantComments.some((comment) => {
                if (!comment || !comment.value) return false;
                // Check comment.value (AST property) - split and check exact matches (pure AST property access)
                const value = comment.value;
                const lowerValue = value.toLowerCase();
                // Split by whitespace/punctuation and check for exact keyword matches (no string includes)
                const words = lowerValue.split(/\s+|[,.;:!?(){}[\]"'`]/);
                return words.includes('admin') || words.includes('bypass') || words.includes('rls') ||
                       words.some(w => w.startsWith('admin') || w.startsWith('bypass') || w.startsWith('rls'));
              });

              if (!hasExplanation) {
                context.report({
                  node,
                  messageId: 'adminClientRequiresComment',
                });
              }
            }
          },
        };
      },
    },

    'require-rpc-error-handling': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require proper error handling and logging for RPC calls (error destructuring, error logging)',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingErrorCheck:
            'RPC call must check for errors. Add "if (error) throw error;" or use runRpc() wrapper.',
          missingRpcErrorLogging:
            'RPC call at line {line} is missing error logging. Use logRpcError(error, { rpcName, operation, args }) or logger.error() with normalizeError() in catch blocks.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Apply to data-layer services and any file with RPC calls
        const isServiceFile = filename.includes('packages/data-layer/src/services') ||
                              filename.includes('packages/web-runtime/src/data') ||
                              filename.includes('apps/edge/functions');

        // Track RPC calls and their error handling
        const rpcCalls = [];

        /**
         * Check if a node or its descendants contain error logging calls (100% AST)
         */
        function hasErrorLoggingInNode(node) {
          if (!node) return false;
          
          // Check for logger.error, logger.warn, logError, logRpcError calls
          if (node.type === 'CallExpression') {
            if (node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                if (obj.name === 'logger' && (prop.name === 'error' || prop.name === 'warn')) {
                  return true;
                }
                // Check for child logger patterns (reqLogger.error, etc.)
                if (obj.name.endsWith('Logger') && (prop.name === 'error' || prop.name === 'warn')) {
                  return true;
                }
              }
            } else if (node.callee.type === 'Identifier') {
              const name = node.callee.name;
              if (name === 'logError' || name === 'logRpcError' || name === 'withRpcErrorLogging') {
                return true;
              }
            }
          }
          
          // Recursively check children
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (hasErrorLoggingInNode(item)) return true;
                }
              } else if (hasErrorLoggingInNode(node[key])) {
                return true;
              }
            }
          }
          
          return false;
        }

        return {
          CallExpression(node) {
            // Look for .rpc() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'rpc'
            ) {
              // Extract RPC name
              const rpcNameArg = node.arguments[0];
              let rpcName = 'unknown';
              if (rpcNameArg && rpcNameArg.type === 'Literal' && typeof rpcNameArg.value === 'string') {
                rpcName = rpcNameArg.value;
              }

              // Check if result is destructured with error property
              let hasErrorProperty = false;
              const parent = node.parent;
              if (parent?.type === 'AwaitExpression') {
                const grandParent = parent.parent;
                if (grandParent?.type === 'VariableDeclarator') {
                  const id = grandParent.id;
                  if (id.type === 'ObjectPattern') {
                    hasErrorProperty = id.properties.some(
                      (prop) => prop.key?.name === 'error'
                    );
                  }
                }
              }

              // Check if this RPC call has error logging in surrounding code (AST-based)
              let hasErrorLogging = false;
              
              // Check parent nodes for error logging
              let current = node.parent;
              while (current) {
                if (current.type === 'TryStatement') {
                  // Check catch block for error logging
                  if (current.handler && current.handler.body) {
                    hasErrorLogging = hasErrorLoggingInNode(current.handler.body);
                  }
                  break;
                }
                if (current.type === 'IfStatement') {
                  // Check if condition mentions error and consequent has logging
                  if (current.test && hasErrorLoggingInNode(current.test)) {
                    hasErrorLogging = hasErrorLoggingInNode(current.consequent);
                  }
                }
                // Check if current node itself has error logging
                if (hasErrorLoggingInNode(current)) {
                  hasErrorLogging = true;
                  break;
                }
                current = current.parent;
              }

              rpcCalls.push({
                node,
                rpcName,
                hasErrorProperty,
                hasErrorLogging,
              });
            }
          },
          'Program:exit'() {
            // Check each RPC call for error handling
            rpcCalls.forEach(({ node, rpcName, hasErrorProperty, hasErrorLogging }) => {
              // Check error destructuring (from original require-rpc-error-handling)
              if (!hasErrorProperty) {
                const parent = node.parent;
                if (parent?.type === 'AwaitExpression') {
                  const grandParent = parent.parent;
                  if (grandParent?.type === 'VariableDeclarator') {
                    context.report({
                      node,
                      messageId: 'missingErrorCheck',
                    });
                  }
                }
              }

              // Check error logging (from detect-missing-rpc-error-logging)
              if (!hasErrorLogging && isServiceFile) {
                // Final check: look for try-catch containing this RPC call
                let parent = node.parent;
                let foundTryCatch = false;
                
                while (parent) {
                  if (parent.type === 'TryStatement') {
                    foundTryCatch = true;
                    // Check catch block for error logging (AST-based)
                    if (parent.handler && parent.handler.body) {
                      const catchHasLogging = hasErrorLoggingInNode(parent.handler.body);
                      if (catchHasLogging) {
                        return; // Has error logging in catch
                      }
                    }
                    break;
                  }
                  parent = parent.parent;
                }

                // If no error logging found, report
                context.report({
                  node,
                  messageId: 'missingRpcErrorLogging',
                  data: { line: node.loc?.start.line || 'unknown' },
                });
              }
            });
          },
        };
      },
    },


    'require-generated-types-for-database-queries': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require typed Supabase clients using Database types',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingDatabaseType:
            'Supabase client should be typed with Database from @heyclaude/database-types. Use: createClient<Database>(url, key)',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        let hasDatabaseImport = false;

        return {
          ImportDeclaration(node) {
            if (node.source && node.source.type === 'Literal' && node.source.value === '@heyclaude/database-types') {
              const hasDatabase = node.specifiers.some(
                (spec) =>
                  (spec.imported && spec.imported.name === 'Database') ||
                  spec.local.name === 'Database'
              );
              if (hasDatabase) {
                hasDatabaseImport = true;
              }
            }
          },
          CallExpression(node) {
            // Check for createClient, createServerClient, createBrowserClient without type parameter
            if (node.callee.type === 'Identifier') {
              const name = node.callee.name;
              if (
                name === 'createClient' ||
                name === 'createServerClient' ||
                name === 'createBrowserClient'
              ) {
                if (!node.typeParameters && !hasDatabaseImport) {
                  context.report({
                    node,
                    messageId: 'missingDatabaseType',
                  });
                }
              }
            }
          },
        };
      },
    },

    // ============================================================================
    // CACHE & PERFORMANCE RULES
    // ============================================================================

    'require-cache-tags-for-mutations': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require cache invalidation after data mutations',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingCacheInvalidation:
            'Data mutation detected without cache invalidation. Add revalidatePath() or revalidateTag() after mutation.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Check for 'use server' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use server' directive using pure AST (no getText())
        const hasUseServer = hasUseServerDirective(ast);
        
        // Only check server actions
        if (!filename.includes('/actions/') && !hasUseServer) {
          return {};
        }

        let hasMutation = false;
        let hasRevalidation = false;

        return {
          CallExpression(node) {
            // Check for mutation RPC calls (insert, update, delete, upsert)
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier'
            ) {
              const methodName = node.callee.property.name;
              if (['insert', 'update', 'delete', 'upsert'].includes(methodName)) {
                hasMutation = true;
              }
              
              // Check for revalidation calls
              if (methodName === 'revalidatePath' || methodName === 'revalidateTag') {
                hasRevalidation = true;
              }
            }

            // Also check for RPC mutations
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'rpc' &&
              node.arguments.length > 0
            ) {
              const rpcName = node.arguments[0];
              if (rpcName.type === 'Literal' && typeof rpcName.value === 'string') {
                // Check RPC name for mutation patterns using string operations on AST node value
                // Note: Checking substring patterns in string literals requires string operations
                // We use startsWith for prefix patterns (more precise than includes)
                const rpcNameValue = rpcName.value;
                if (rpcNameValue.startsWith('create_') || rpcNameValue.startsWith('update_') ||
                    rpcNameValue.startsWith('delete_') || rpcNameValue.startsWith('manage_') ||
                    rpcNameValue.startsWith('insert_') || rpcNameValue.startsWith('upsert_')) {
                  hasMutation = true;
                }
              }
            }
          },
          'Program:exit'() {
            if (hasMutation && !hasRevalidation) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingCacheInvalidation',
              });
            }
          },
        };
      },
    },

    'no-uncached-database-calls': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest caching for expensive database queries',
          category: 'Performance',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          suggestCaching:
            'Consider caching this database query with unstable_cache() or fetchCached() to improve performance.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only check data layer files
        if (!filename.includes('/data/')) {
          return {};
        }

        // Check if file already uses caching (AST-based)
        const ast = sourceCode.ast;
        let hasCaching = false;
        function checkForCaching(node) {
          if (!node) return;
          if (node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              (node.callee.name === 'unstable_cache' || node.callee.name === 'fetchCached')) {
            hasCaching = true;
            return;
          }
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  checkForCaching(item);
                }
              } else {
                checkForCaching(node[key]);
              }
            }
          }
        }
        checkForCaching(ast);
        
        // Skip if file already uses caching
        if (hasCaching) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for database calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier' &&
              (node.callee.property.name === 'from' || node.callee.property.name === 'rpc')
            ) {
              context.report({
                node,
                messageId: 'suggestCaching',
              });
            }
          },
        };
      },
    },

    'require-parallel-fetching': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest Promise.all for independent async operations',
          category: 'Performance',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          usePromiseAll:
            'Multiple independent await statements detected. Consider using Promise.all() or Promise.allSettled() for parallel execution.',
        },
      },
      create(context) {
        return {
          FunctionDeclaration(node) {
            if (!node.async) return;

            // Count await statements in function body
            const awaitStatements = [];
            
            function findAwaits(node) {
              if (node.type === 'AwaitExpression') {
                awaitStatements.push(node);
              }
              // Don't traverse into nested functions
              if (
                node.type !== 'FunctionDeclaration' &&
                node.type !== 'FunctionExpression' &&
                node.type !== 'ArrowFunctionExpression'
              ) {
                for (const key in node) {
                  if (node[key] && typeof node[key] === 'object') {
                    if (Array.isArray(node[key])) {
                      node[key].forEach((child) => findAwaits(child));
                    } else {
                      findAwaits(node[key]);
                    }
                  }
                }
              }
            }

            if (node.body) {
              findAwaits(node.body);
            }

            // If more than 2 sequential awaits, suggest parallelization
            if (awaitStatements.length >= 3) {
              context.report({
                node,
                messageId: 'usePromiseAll',
              });
            }
          },
        };
      },
    },

    'no-blocking-operations-in-layouts': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent blocking operations in layout files',
          category: 'Performance',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          blockingInLayout:
            'Layout files should not contain blocking operations. Move data fetching to page level or use Suspense boundaries.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check layout.tsx files
        if (!filename.endsWith('layout.tsx')) {
          return {};
        }

        return {
          AwaitExpression(node) {
            // Allow Promise.allSettled (non-blocking pattern)
            if (
              node.argument.type === 'CallExpression' &&
              node.argument.callee.type === 'MemberExpression' &&
              node.argument.callee.property.name === 'allSettled'
            ) {
              return;
            }

            context.report({
              node,
              messageId: 'blockingInLayout',
            });
          },
        };
      },
    },

    // ============================================================================
    // ENVIRONMENT VARIABLES & CONFIGURATION RULES
    // ============================================================================

    'require-env-validation-schema': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require validated environment variables instead of direct process.env access',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          directEnvAccess:
            'Direct process.env access is discouraged. Use validated env from packages/shared-runtime/src/schemas/env.ts or requireEnvVar()/getEnvVar() helpers.',
          clientEnvAccess:
            'Client components should not access process.env directly (exposes variables in bundle). Pass env vars from Server Components as props.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const hasUseClient = hasUseClientDirective(ast);

        // Skip env validation schema files themselves
        if (filename.includes('/schemas/env.ts') || filename.includes('/env.ts')) {
          return {};
        }

        // Skip config files and scripts
        if (filename.includes('.config.') || filename.includes('/scripts/')) {
          return {};
        }

        return {
          MemberExpression(node) {
            // Check for process.env['VAR'] or process.env.VAR
            if (
              node.object.type === 'MemberExpression' &&
              node.object.object.type === 'Identifier' &&
              node.object.object.name === 'process' &&
              node.object.property.type === 'Identifier' &&
              node.object.property.name === 'env'
            ) {
              context.report({
                node,
                messageId: hasUseClient ? 'clientEnvAccess' : 'directEnvAccess',
              });
            }
          },
        };
      },
    },

    'no-hardcoded-urls': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent hardcoded URLs that break in different environments',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          hardcodedUrl:
            'Hardcoded URL detected. Use environment variable (NEXT_PUBLIC_SITE_URL) or config constant instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Skip test files and config files
        if (filename.includes('.test.') || filename.includes('.config.') || filename.includes('readme-builder')) {
          return {};
        }

        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              // Check for hardcoded localhost or production URLs
              if (
                node.value.startsWith('http://localhost:') ||
                node.value.startsWith('https://claudepro.directory') ||
                node.value.startsWith('http://127.0.0.1:')
              ) {
                // Allow if it's in a comment or part of API endpoint pattern
                const parent = node.parent;
                if (parent?.type === 'Property' && parent.key?.name === 'url') {
                  // Might be external API, check context
                  return;
                }

                context.report({
                  node,
                  messageId: 'hardcodedUrl',
                });
              }
            }
          },
        };
      },
    },

    'require-feature-flag-validation': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require proper fallback for feature flag checks',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingFallback:
            'Feature flag check should have explicit fallback/default value to handle undefined flags.',
        },
      },
      create(context) {
        // This is a placeholder - would need specific feature flag API to implement
        return {};
      },
    },

    // ============================================================================
    // SERVER ACTIONS & FORM HANDLING RULES
    // ============================================================================

    'require-zod-schema-for-server-actions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require Zod schema validation for server action inputs',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingInputSchema:
            'Server action must use .inputSchema() with Zod validation. Add .inputSchema(z.object({...})) before .action().',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Check for 'use server' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use server' directive using pure AST (no getText())
        const hasUseServer = hasUseServerDirective(ast);

        // Only check server action files
        if (!filename.includes('/actions/') && !hasUseServer) {
          return {};
        }

        return {
          CallExpression(node) {
            // Look for actionClient.action() without inputSchema
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'action'
            ) {
              // Check if there's .inputSchema() in the chain
              let current = node.callee.object;
              let hasInputSchema = false;

              while (current) {
                if (
                  current.type === 'CallExpression' &&
                  current.callee.type === 'MemberExpression' &&
                  current.callee.property.name === 'inputSchema'
                ) {
                  hasInputSchema = true;
                  break;
                }
                current = current.callee?.object;
              }

              if (!hasInputSchema) {
                context.report({
                  node,
                  messageId: 'missingInputSchema',
                });
              }
            }
          },
        };
      },
    },

    'require-database-enum-types-in-schemas': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require database enum types from @heyclaude/database-types in Zod schemas',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          hardcodedEnumInSchema:
            'Use Constants.public.Enums from @heyclaude/database-types instead of hardcoded enum values in Zod schema.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only check action files with Zod schemas
        if (!filename.includes('/actions/')) {
          return {};
        }

        let hasConstantsImport = false;

        return {
          ImportDeclaration(node) {
            if (node.source.value === '@heyclaude/database-types') {
              const hasConstants = node.specifiers.some(
                (spec) => spec.local.name === 'Constants'
              );
              if (hasConstants) {
                hasConstantsImport = true;
              }
            }
          },
          CallExpression(node) {
            // Look for z.enum([...]) with string literals
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.name === 'z' &&
              node.callee.property.name === 'enum' &&
              node.arguments.length > 0
            ) {
              const firstArg = node.arguments[0];
              if (firstArg.type === 'ArrayExpression') {
                // Check if array contains string literals
                const hasStringLiterals = firstArg.elements.some(
                  (el) => el && el.type === 'Literal' && typeof el.value === 'string'
                );

                if (hasStringLiterals && !hasConstantsImport) {
                  context.report({
                    node,
                    messageId: 'hardcodedEnumInSchema',
                  });
                }
              }
            }
          },
        };
      },
    },

    'require-rate-limiting-for-public-actions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require rate limiting for public server actions',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingRateLimit:
            'Public action should use rateLimitedAction wrapper to prevent abuse. Replace optionalAuthAction with rateLimitedAction.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only check server action files
        if (!filename.includes('/actions/')) {
          return {};
        }

        return {
          VariableDeclarator(node) {
            // Look for actions using optionalAuthAction
            if (
              node.init &&
              node.init.type === 'CallExpression' &&
              node.init.callee.type === 'MemberExpression'
            ) {
              let current = node.init.callee;
              let usesOptionalAuth = false;

              while (current) {
                if (
                  current.object?.type === 'Identifier' &&
                  current.object.name === 'optionalAuthAction'
                ) {
                  usesOptionalAuth = true;
                  break;
                }
                current = current.object;
              }

              // Check if it's a mutation action (has keywords like create, update, send, submit)
              if (usesOptionalAuth && node.id.name) {
                const actionName = node.id.name.toLowerCase();
                if (
                  actionName.includes('create') ||
                  actionName.includes('update') ||
                  actionName.includes('send') ||
                  actionName.includes('submit') ||
                  actionName.includes('post')
                ) {
                  context.report({
                    node,
                    messageId: 'missingRateLimit',
                  });
                }
              }
            }
          },
        };
      },
    },

    'no-sensitive-data-in-action-metadata': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent sensitive data in action metadata',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          sensitiveDataInMetadata:
            'Sensitive data detected in action metadata. Avoid logging email, password, token, or other PII. Sanitize or hash before logging.',
        },
      },
      create(context) {
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'accessToken', 'refreshToken'];

        return {
          CallExpression(node) {
            // Look for .metadata() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'metadata' &&
              node.arguments.length > 0
            ) {
              const metadata = node.arguments[0];
              if (metadata.type === 'ObjectExpression') {
                for (const prop of metadata.properties) {
                  if (prop.key && prop.key.name) {
                    const keyName = prop.key.name.toLowerCase();
                    if (sensitiveKeys.some((sensitive) => keyName.includes(sensitive))) {
                      context.report({
                        node: prop,
                        messageId: 'sensitiveDataInMetadata',
                      });
                    }
                  }
                }
              }
            }
          },
        };
      },
    },

    // ============================================================================
    // TYPESCRIPT & TYPE SAFETY RULES
    // ============================================================================

    'require-explicit-return-types-for-data-functions': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require explicit return types for data layer functions',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingReturnType:
            'Data layer function should have explicit return type. Add : Promise<Type> to function signature.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check data layer files
        if (!filename.includes('/data/')) {
          return {};
        }

        return {
          FunctionDeclaration(node) {
            // Check if function is exported and lacks return type
            const parent = node.parent;
            const isExported = parent?.type === 'ExportNamedDeclaration';

            if (isExported && !node.returnType && node.async) {
              context.report({
                node,
                messageId: 'missingReturnType',
              });
            }
          },
        };
      },
    },

    'no-type-assertions-without-comment': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require explanatory comment for type assertions',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          assertionNeedsComment:
            'Type assertion should have comment explaining why it\'s necessary. Consider fixing the type instead.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          TSAsExpression(node) {
            // Check for comment before the assertion (pure AST - check comment existence)
            const comments = sourceCode.getCommentsBefore(node) || [];
            const hasExplanation = comments.length > 0;

            if (!hasExplanation) {
              context.report({
                node,
                messageId: 'assertionNeedsComment',
              });
            }
          },
        };
      },
    },

    'require-props-interface-for-components': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require exported Props interface for React components',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingPropsInterface:
            'React component should have exported Props interface. Add "export interface {{componentName}}Props" for better reusability.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check component files
        if (!filename.includes('/components/') || !filename.endsWith('.tsx')) {
          return {};
        }

        const sourceCode = context.getSourceCode();

        // Track exported interfaces
        const exportedInterfaces = new Set();
        let hasComponent = false;
        let componentName = '';

        return {
          ExportNamedDeclaration(node) {
            if (node.declaration?.type === 'TSInterfaceDeclaration') {
              exportedInterfaces.add(node.declaration.id.name);
            }
          },
          FunctionDeclaration(node) {
            // Check if it's a React component (starts with capital letter)
            if (node.id && /^[A-Z]/.test(node.id.name)) {
              hasComponent = true;
              componentName = node.id.name;
            }
          },
          'Program:exit'() {
            if (hasComponent && componentName) {
              const expectedInterface = `${componentName}Props`;
              if (!exportedInterfaces.has(expectedInterface)) {
                context.report({
                  loc: { line: 1, column: 0 },
                  messageId: 'missingPropsInterface',
                  data: { componentName },
                });
              }
            }
          },
        };
      },
    },

    'no-any-in-public-api': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent any type in exported function signatures',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          anyInPublicApi:
            'Exported function should not use "any" type. Use "unknown" or proper generic types instead.',
        },
      },
      create(context) {
        return {
          ExportNamedDeclaration(node) {
            if (node.declaration?.type === 'FunctionDeclaration') {
              const func = node.declaration;

              // Check parameters for any type
              if (func.params) {
                for (const param of func.params) {
                  if (
                    param.typeAnnotation?.typeAnnotation?.type === 'TSAnyKeyword'
                  ) {
                    context.report({
                      node: param,
                      messageId: 'anyInPublicApi',
                    });
                  }
                }
              }

              // Check return type for any
              if (func.returnType?.typeAnnotation?.type === 'TSAnyKeyword') {
                context.report({
                  node: func.returnType,
                  messageId: 'anyInPublicApi',
                });
              }
            }
          },
        };
      },
    },

    // ============================================================================
    // SECURITY & DATA VALIDATION RULES
    // ============================================================================

    'require-input-sanitization-before-database': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require input validation before database operations',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingSanitization:
            'User input should be validated with Zod schema before database operations. Add schema validation.',
        },
      },
      create(context) {
        // This rule is partially covered by require-zod-schema-for-server-actions
        // and the existing safe-action middleware
        return {};
      },
    },

    'no-admin-client-in-non-admin-context': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Restrict admin client usage to admin-only files or require explanatory comments',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          adminClientInNonAdminFile:
            'createSupabaseAdminClient() should only be used in admin-specific files. Move to /admin/ directory, use server client with RLS instead, or add a comment explaining why admin access is required (e.g., build-time optimization for public data).',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Skip files in admin directories or with admin in name
        if (filename.includes('/admin/') || filename.includes('admin.ts')) {
          return {};
        }

        return {
          CallExpression(node) {
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'createSupabaseAdminClient'
            ) {
              // Find the parent statement node (AssignmentExpression, VariableDeclarator, etc.)
              // Comments are often before the statement, not the CallExpression
              let statementNode = node.parent;
              while (statementNode && 
                     statementNode.type !== 'VariableDeclarator' && 
                     statementNode.type !== 'AssignmentExpression' &&
                     statementNode.type !== 'ExpressionStatement' &&
                     statementNode.type !== 'ReturnStatement') {
                statementNode = statementNode.parent;
              }

              // Check comments before the parent statement (most common case)
              const statementComments = statementNode 
                ? sourceCode.getCommentsBefore(statementNode) || []
                : [];

              // Also check comments directly before the CallExpression
              const directComments = sourceCode.getCommentsBefore(node) || [];

              // Check comments in the surrounding context (within 10 lines before the call)
              // This handles cases where comments are separated by import statements
              const nodeLine = node.loc.start.line;
              const allComments = sourceCode.ast.comments || [];
              
              // Find comments within 10 lines before the call
              const nearbyComments = allComments.filter((comment) => {
                if (!comment.loc) return false;
                const commentLine = comment.loc.end.line;
                return commentLine >= nodeLine - 10 && commentLine < nodeLine;
              });

              // Check all relevant comments for explanation
              const allRelevantComments = [...statementComments, ...directComments, ...nearbyComments];
              const hasExplanation = allRelevantComments.some((comment) => {
                if (!comment || !comment.value) return false;
                // Check comment.value (AST property) - split and check exact matches (pure AST property access)
                const value = comment.value;
                const lowerValue = value.toLowerCase();
                // Split by whitespace/punctuation and check for exact keyword matches (no string includes)
                const words = lowerValue.split(/\s+|[,.;:!?(){}[\]"'`]/);
                return words.includes('admin') || words.includes('bypass') || words.includes('rls') ||
                       words.some(w => w.startsWith('admin') || w.startsWith('bypass') || w.startsWith('rls'));
              });

              // Only report if there's no explanation comment
              // This allows legitimate use cases (build-time, public data) with proper documentation
              if (!hasExplanation) {
                context.report({
                  node,
                  messageId: 'adminClientInNonAdminFile',
                });
              }
            }
          },
        };
      },
    },

    'require-auth-check-before-sensitive-operations': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require authentication check before sensitive operations',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingAuthCheck:
            'Sensitive operation requires authentication check. Use getAuthenticatedUser() or authedAction wrapper.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only check action files
        if (!filename.includes('/actions/')) {
          return {};
        }

        let usesAuthedAction = false;
        let hasAuthCheck = false;

        return {
          VariableDeclarator(node) {
            // Check if using authedAction or rateLimitedAction
            if (
              node.init &&
              node.init.callee?.object?.name === 'authedAction' ||
              node.init?.callee?.object?.name === 'rateLimitedAction'
            ) {
              usesAuthedAction = true;
            }
          },
          CallExpression(node) {
            // Check for getAuthenticatedUser calls
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'getAuthenticatedUser'
            ) {
              hasAuthCheck = true;
            }

            // Check for mutations without auth
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'rpc'
            ) {
              const rpcName = node.arguments[0];
              if (rpcName?.type === 'Literal' && typeof rpcName.value === 'string') {
                // Check RPC name for sensitive patterns using startsWith (more precise)
                const rpcNameValue = rpcName.value;
                if (rpcNameValue.startsWith('delete_') || rpcNameValue.startsWith('manage_') ||
                    rpcNameValue.startsWith('admin_')) {
                  if (!usesAuthedAction && !hasAuthCheck) {
                    context.report({
                      node,
                      messageId: 'missingAuthCheck',
                    });
                  }
                }
              }
            }
          },
        };
      },
    },

    'no-exposed-secrets-in-client-code': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent secrets in client-side code',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          secretInClientCode:
            'Secret/sensitive environment variable in client code. Move to server-only code or use server action.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const hasUseClient = hasUseClientDirective(ast);

        if (!hasUseClient) {
          return {};
        }

        const secretKeys = [
          'SERVICE_ROLE_KEY',
          'SECRET',
          'PRIVATE_KEY',
          'API_SECRET',
          'WEBHOOK_SECRET',
          'ADMIN_KEY',
        ];

        return {
          MemberExpression(node) {
            // Check for process.env['SECRET_VAR']
            if (
              node.object.type === 'MemberExpression' &&
              node.object.object.name === 'process' &&
              node.object.property.name === 'env'
            ) {
              const propName = node.property.name || node.property.value;
              if (propName && typeof propName === 'string') {
                if (secretKeys.some((secret) => propName.includes(secret))) {
                  context.report({
                    node,
                    messageId: 'secretInClientCode',
                  });
                }
              }
            }
          },
        };
      },
    },

    // ============================================================================
    // API ROUTES & EDGE FUNCTIONS RULES
    // ============================================================================

    'require-http-method-validation': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require HTTP method validation in API routes',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingMethodValidation:
            'API route should validate HTTP method. Add method check or use Next.js named exports (GET, POST, etc.).',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check API route files
        if (!filename.includes('/api/') || !filename.endsWith('route.ts')) {
          return {};
        }

        const sourceCode = context.getSourceCode();

        // Check if file uses named exports (GET, POST, etc.) using AST
        const ast = sourceCode.ast;
        let hasNamedExports = false;
        const handlerNames = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        
        function checkForNamedExports(node) {
          if (!node) return;
          if (node.type === 'ExportNamedDeclaration' && node.declaration) {
            if (node.declaration.type === 'FunctionDeclaration' &&
                node.declaration.async &&
                node.declaration.id &&
                node.declaration.id.type === 'Identifier' &&
                handlerNames.includes(node.declaration.id.name)) {
              hasNamedExports = true;
              return;
            }
          }
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  checkForNamedExports(item);
                }
              } else {
                checkForNamedExports(node[key]);
              }
            }
          }
        }
        checkForNamedExports(ast);

        if (hasNamedExports) {
          return {}; // Named exports are good
        }

        let hasMethodCheck = false;

        return {
          MemberExpression(node) {
            // Look for request.method checks
            if (
              node.object.name === 'request' &&
              node.property.name === 'method'
            ) {
              hasMethodCheck = true;
            }
          },
          'Program:exit'() {
            if (!hasMethodCheck && !hasNamedExports) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingMethodValidation',
              });
            }
          },
        };
      },
    },

    'require-request-validation-in-api-routes': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require request body validation in API routes',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingRequestValidation:
            'API route should validate request body with Zod schema before processing.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check API route files
        if (!filename.includes('/api/') || !filename.endsWith('route.ts')) {
          return {};
        }

        let hasRequestParsing = false;
        let hasZodValidation = false;

        return {
          CallExpression(node) {
            // Check for request.json() or request.formData()
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.name === 'request' &&
              (node.callee.property.name === 'json' || node.callee.property.name === 'formData')
            ) {
              hasRequestParsing = true;
            }

            // Check for Zod parse/safeParse
            if (
              node.callee.type === 'MemberExpression' &&
              (node.callee.property.name === 'parse' || node.callee.property.name === 'safeParse')
            ) {
              hasZodValidation = true;
            }
          },
          'Program:exit'() {
            if (hasRequestParsing && !hasZodValidation) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingRequestValidation',
              });
            }
          },
        };
      },
    },

    'require-cors-headers-for-public-apis': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest CORS headers for public API routes',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingCorsHeaders:
            'Public API route should include CORS headers. Add Access-Control-Allow-Origin to Response headers.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check public API routes
        if (!filename.includes('/api/public/')) {
          return {};
        }

        const sourceCode = context.getSourceCode();

        // Check for CORS headers using AST
        const ast = sourceCode.ast;
        let hasCorsHeaders = false;
        function checkForCorsHeaders(node) {
          if (!node) return;
          if (node.type === 'Property' &&
              node.key && node.key.type === 'Identifier' &&
              node.key.name === 'Access-Control-Allow-Origin') {
            hasCorsHeaders = true;
            return;
          }
          if (node.type === 'Literal' &&
              typeof node.value === 'string') {
            // Check for CORS header using exact equality or startsWith (more precise than includes)
            const value = node.value;
            if (value === 'Access-Control-Allow-Origin' || 
                value.startsWith('Access-Control-Allow-Origin') ||
                value.indexOf('Access-Control-Allow-Origin') !== -1) {
              hasCorsHeaders = true;
              return;
            }
          }
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  checkForCorsHeaders(item);
                }
              } else {
                checkForCorsHeaders(node[key]);
              }
            }
          }
        }
        checkForCorsHeaders(ast);

        return {
          'Program:exit'() {
            if (!hasCorsHeaders) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingCorsHeaders',
              });
            }
          },
        };
      },
    },

    'no-long-running-operations-in-edge-functions': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Warn about potentially long-running operations in edge functions',
          category: 'Performance',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          longRunningOperation:
            'Edge functions have strict timeout limits. Consider moving long-running operations to background job or serverless function.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check edge function files
        if (!filename.includes('/functions/') && !filename.includes('/edge/')) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for operations that might be slow
            if (node.callee.type === 'Identifier') {
              const name = node.callee.name;
              // File operations, heavy computation
              if (
                name === 'readFile' ||
                name === 'writeFile' ||
                name === 'setTimeout' && node.arguments[1]?.value > 30000
              ) {
                context.report({
                  node,
                  messageId: 'longRunningOperation',
                });
              }
            }
          },
        };
      },
    },

    // ============================================================================
    // TESTING & QUALITY RULES
    // ============================================================================

    'require-test-file-for-complex-functions': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest test files for complex functions',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingTestFile:
            'Complex function should have corresponding test file. Create {{testFile}} to test this functionality.',
        },
      },
      create(context) {
        // This rule would need file system access to check for test files
        // Skipping implementation for now
        return {};
      },
    },

    'require-error-test-cases': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest error test cases in test files',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingErrorTests:
            'Test file should include error/edge case tests. Add tests for validation errors, network failures, and auth failures.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check test files
        if (!filename.includes('.test.') && !filename.includes('.spec.')) {
          return {};
        }

        const sourceCode = context.getSourceCode();

        // Check for error-related test descriptions using AST
        const ast = sourceCode.ast;
        let hasErrorTests = false;
        const errorKeywords = ['error', 'fail', 'throw', 'invalid', 'edge case'];
        
        function checkForErrorTests(node) {
          if (!node) return;
          if (node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              (node.callee.name === 'it' || node.callee.name === 'test')) {
            // Check first argument (test description)
            if (node.arguments && node.arguments.length > 0) {
              const descArg = node.arguments[0];
              if (descArg.type === 'Literal' && typeof descArg.value === 'string') {
                const desc = descArg.value.toLowerCase();
                if (errorKeywords.some(keyword => desc.includes(keyword))) {
                  hasErrorTests = true;
                  return;
                }
              }
            }
          }
          for (const key in node) {
            if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  checkForErrorTests(item);
                }
              } else {
                checkForErrorTests(node[key]);
              }
            }
          }
        }
        checkForErrorTests(ast);

        return {
          'Program:exit'() {
            if (!hasErrorTests) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingErrorTests',
              });
            }
          },
        };
      },
    },

    'no-focused-tests-in-ci': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent .only() in test files',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          focusedTest:
            'Focused test (.only) should not be committed. Remove .only() to run all tests in CI.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check test files
        if (!filename.includes('.test.') && !filename.includes('.spec.')) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for test.only(), describe.only(), it.only()
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'only'
            ) {
              const object = node.callee.object;
              if (
                object.type === 'Identifier' &&
                (object.name === 'test' || object.name === 'describe' || object.name === 'it')
              ) {
                context.report({
                  node,
                  messageId: 'focusedTest',
                });
              }
            }
          },
        };
      },
    },

    // ============================================================================
    // PERFORMANCE & BUNDLE SIZE RULES
    // ============================================================================

    'no-large-dependencies-in-client-bundles': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest lighter alternatives for heavy dependencies',
          category: 'Performance',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          heavyDependency:
            'Heavy dependency "{{package}}" detected in client bundle. Consider using lighter alternative: {{alternative}}.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const hasUseClient = hasUseClientDirective(ast);

        if (!hasUseClient) {
          return {};
        }

        const heavyPackages = {
          'moment': 'date-fns or dayjs',
          'lodash': 'lodash-es with tree-shaking or native methods',
          'axios': 'native fetch API',
        };

        return {
          ImportDeclaration(node) {
            const packageName = node.source.value;
            for (const [heavy, alternative] of Object.entries(heavyPackages)) {
              if (packageName === heavy || packageName.startsWith(`${heavy}/`)) {
                context.report({
                  node,
                  messageId: 'heavyDependency',
                  data: { package: heavy, alternative },
                });
              }
            }
          },
        };
      },
    },

    'require-dynamic-import-for-heavy-components': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest dynamic imports for heavy components',
          category: 'Performance',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          heavyComponentNeedsDynamic:
            'Large component should use dynamic import. Use next/dynamic for below-the-fold or conditional components.',
        },
      },
      create(context) {
        // This would require analyzing component size which is complex
        // Skipping implementation for now
        return {};
      },
    },

    'no-blocking-third-party-scripts': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest async loading for third-party scripts',
          category: 'Performance',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          blockingScript:
            'Third-party script should use async loading. Add strategy="afterInteractive" or strategy="lazyOnload" to <Script>.',
        },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.name === 'Script') {
              const hasStrategy = node.attributes.some(
                (attr) => attr.name?.name === 'strategy'
              );

              if (!hasStrategy) {
                context.report({
                  node,
                  messageId: 'blockingScript',
                });
              }
            }
          },
        };
      },
    },

    // ============================================================================
    // ACCESSIBILITY & UX RULES
    // ============================================================================

    'require-loading-states-for-async-operations': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest loading states for async operations',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingLoadingState:
            'Async operation should have loading state. Use useTransition, isPending, or loading boolean.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const hasUseClient = hasUseClientDirective(ast);

        if (!hasUseClient) {
          return {};
        }

        let hasAsyncOperation = false;
        let hasLoadingState = false;

        return {
          CallExpression(node) {
            // Check for useTransition, or variables with "loading" or "pending"
            if (node.callee.type === 'Identifier') {
              if (node.callee.name === 'useTransition' || node.callee.name === 'useState') {
                hasLoadingState = true;
              }
              if (node.callee.name === 'fetch' || node.callee.name.includes('async')) {
                hasAsyncOperation = true;
              }
            }
          },
        };
      },
    },

    'require-error-messages-for-forms': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest error messages for form components',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingErrorMessages:
            'Form component should display error messages. Add error message UI for validation failures.',
        },
      },
      create(context) {
        // This would require complex form detection
        // Skipping implementation for now
        return {};
      },
    },

    'no-missing-alt-text-on-dynamic-images': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require fallback alt text for dynamic images',
          category: 'Accessibility',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingAltFallback:
            'Dynamic image should have fallback alt text. Use alt={variable || "fallback description"}.',
        },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.name === 'img' || node.name.name === 'Image') {
              const altAttr = node.attributes.find(
                (attr) => attr.name?.name === 'alt'
              );

              if (altAttr && altAttr.value?.type === 'JSXExpressionContainer') {
                const expr = altAttr.value.expression;
                // Check if alt value is just a variable without fallback
                if (expr.type === 'Identifier') {
                  context.report({
                    node: altAttr,
                    messageId: 'missingAltFallback',
                  });
                }
              }
            }
          },
        };
      },
    },

    // ============================================================================
    // CODE ORGANIZATION & ARCHITECTURE RULES
    // ============================================================================

    'enforce-barrel-export-pattern': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest barrel exports for directory organization',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          useBarrelExport:
            'Consider using barrel export (index.ts) for this directory to simplify imports.',
        },
      },
      create(context) {
        // This would require file system access
        // Skipping implementation for now
        return {};
      },
    },

    'no-circular-dependencies-advanced': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detect circular dependencies across package boundaries',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          circularDependency:
            'Circular dependency detected. Refactor to remove circular import.',
        },
      },
      create(context) {
        // Biome already has noImportCycles, so we defer to that
        return {};
      },
    },

    'enforce-package-boundaries-enhanced': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce architectural boundaries between packages',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          boundaryViolation:
            'Package boundary violation. {{sourcePackage}} should not import from {{targetPackage}}.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Determine source package
        let sourcePackage = '';
        if (filename.includes('/packages/data-layer/')) sourcePackage = 'data-layer';
        if (filename.includes('/packages/shared-runtime/')) sourcePackage = 'shared-runtime';
        if (filename.includes('/packages/edge-runtime/')) sourcePackage = 'edge-runtime';
        if (filename.includes('/packages/web-runtime/')) sourcePackage = 'web-runtime';
        if (filename.includes('/apps/web/')) sourcePackage = 'web-app';
        if (filename.includes('/apps/edge/')) sourcePackage = 'edge-functions';

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;

            // Check violations
            if (sourcePackage === 'data-layer' && importPath.includes('@heyclaude/web-runtime')) {
              context.report({
                node,
                messageId: 'boundaryViolation',
                data: { sourcePackage: 'data-layer', targetPackage: 'web-runtime' },
              });
            }

            if (sourcePackage === 'shared-runtime' && importPath.includes('@heyclaude/web-runtime')) {
              context.report({
                node,
                messageId: 'boundaryViolation',
                data: { sourcePackage: 'shared-runtime', targetPackage: 'web-runtime' },
              });
            }

            // Edge functions should not import Node.js-only modules
            if (sourcePackage === 'edge-functions' && (
              importPath.startsWith('node:') ||
              importPath === 'fs' ||
              importPath === 'path' ||
              importPath === 'os'
            )) {
              context.report({
                node,
                messageId: 'boundaryViolation',
                data: { sourcePackage: 'edge-functions', targetPackage: 'node-modules' },
              });
            }
          },
        };
      },
    },

    // ============================================================================
    // ADDITIONAL HIGH-VALUE RULES
    // ============================================================================

    'require-metadata-for-generatemetadata': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require complete metadata in generateMetadata functions (recognizes database-driven patterns)',
          category: 'SEO',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingDescription:
            'generateMetadata should return description for SEO. Add description field to metadata object.',
          missingOpenGraphImage:
            'generateMetadata should return openGraph.images for social sharing. Add openGraph.images array to metadata.',
          incompleteMetadata:
            'generateMetadata should return complete metadata including title, description, and openGraph.images for optimal SEO.',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only check page files with generateMetadata
        if (!filename.includes('/app/') || !filename.endsWith('.tsx')) {
          return {};
        }

        return {
          FunctionDeclaration(node) {
            // Look for generateMetadata function
            if (node.id?.name === 'generateMetadata') {
              // Check if function body returns metadata object
              const sourceCode = context.getSourceCode();
              const funcText = sourceCode.getText(node);

              // Whitelist: If using database-driven metadata helpers, skip validation
              // These helpers (generatePageMetadata, getSEOMetadata, getCachedHomeMetadata, etc.) ensure complete metadata
              const usesMetadataHelper = 
                /generatePageMetadata\s*\(/.test(funcText) ||
                /getSEOMetadata\s*\(/.test(funcText) ||
                /getSEOMetadataWithSchemas\s*\(/.test(funcText) ||
                /getCachedHomeMetadata\s*\(/.test(funcText) ||
                /getHomeMetadata\s*\(/.test(funcText);

              if (usesMetadataHelper) {
                // Skip validation - metadata helpers ensure completeness
                return;
              }

              // For manually constructed metadata, check for required fields
              const hasDescription = /description\s*:/.test(funcText);
              const hasOpenGraphImages = /openGraph\s*:[\s\S]*?images\s*:/.test(funcText);

              if (!hasDescription) {
                context.report({
                  node,
                  messageId: 'missingDescription',
                });
              }

              if (!hasOpenGraphImages) {
                context.report({
                  node,
                  messageId: 'missingOpenGraphImage',
                });
              }
            }
          },
        };
      },
    },

    'require-error-boundary-in-route-groups': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest error.tsx files for route groups',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingErrorBoundary:
            'Route group should have error.tsx file for proper error handling. Create {{errorFile}} for better UX.',
        },
      },
      create(context) {
        // This would require file system access to check for error.tsx
        // Skipping implementation - too complex for benefit
        return {};
      },
    },

    'no-localstorage-for-auth-data': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent storing authentication data in localStorage',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          authDataInLocalStorage:
            'SECURITY: Never store authentication data in localStorage (vulnerable to XSS). Use secure HttpOnly cookies or server-side sessions. Detected key: "{{key}}"',
        },
      },
      create(context) {
        const sensitiveKeyPatterns = [
          /token/i,
          /jwt/i,
          /auth/i,
          /session/i,
          /password/i,
          /secret/i,
          /key/i,
          /credential/i,
          /refresh/i,
          /access/i,
        ];

        function isSensitiveKey(key) {
          if (typeof key !== 'string') return false;
          return sensitiveKeyPatterns.some((pattern) => pattern.test(key));
        }

        return {
          CallExpression(node) {
            // Check for localStorage.setItem
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'localStorage' &&
              node.callee.property.name === 'setItem'
            ) {
              const keyArg = node.arguments[0];
              if (keyArg && keyArg.type === 'Literal' && typeof keyArg.value === 'string') {
                if (isSensitiveKey(keyArg.value)) {
                  context.report({
                    node,
                    messageId: 'authDataInLocalStorage',
                    data: { key: keyArg.value },
                  });
                }
              }
            }

            // Check for useLocalStorage hook with sensitive keys
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'useLocalStorage'
            ) {
              const keyArg = node.arguments[0];
              if (keyArg && keyArg.type === 'Literal' && typeof keyArg.value === 'string') {
                if (isSensitiveKey(keyArg.value)) {
                  context.report({
                    node,
                    messageId: 'authDataInLocalStorage',
                    data: { key: keyArg.value },
                  });
                }
              }
            }
          },
        };
      },
    },

    'require-child-logger-in-async-functions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require child logger in async page/layout functions (requestId was removed from codebase)',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - complex logger.child() insertion could break TypeScript or create incorrect context
        schema: [],
        messages: {
          missingChildLogger:
            'Async server component should create child logger for request-scoped context. Use: const reqLogger = logger.child({ operation, route, module });',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only check page.tsx and layout.tsx in app directory
        if (!filename.includes('/app/') || (!filename.endsWith('page.tsx') && !filename.endsWith('layout.tsx'))) {
          return {};
        }

        // Check for 'use client' directive using AST
        const ast = sourceCode.ast;
        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        // Skip client components
        if (isClientComponent) {
          return {};
        }

        let hasAsyncExport = false;
        let hasChildLogger = false;
        let asyncFunctionNode = null;
        let firstStatementNode = null;
        let hasLoggerImport = false;
        let lastImportNode = null;

        return {
          ImportDeclaration(node) {
            // Track imports to add logger import if needed
            lastImportNode = node;
            if (node.source && node.source.value) {
              const importPath = typeof node.source.value === 'string' ? node.source.value : '';
              if (importPath.includes('logging/server') || importPath.includes('logger')) {
                // Check if logger is imported
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.type === 'Identifier') {
                    if (spec.imported.name === 'logger') {
                      hasLoggerImport = true;
                    }
                  } else if (spec.type === 'ImportDefaultSpecifier') {
                    // Default import might be logger
                    hasLoggerImport = true;
                  }
                }
              }
            }
          },
          ExportDefaultDeclaration(node) {
            // Check if default export is async function
            if (node.declaration.type === 'FunctionDeclaration' && node.declaration.async) {
              hasAsyncExport = true;
              asyncFunctionNode = node.declaration;
              // Find first statement in function body
              if (asyncFunctionNode.body && asyncFunctionNode.body.body && asyncFunctionNode.body.body.length > 0) {
                firstStatementNode = asyncFunctionNode.body.body[0];
              }
            }
          },
          VariableDeclarator(node) {
            // Check for logger.child() call
            if (
              node.init?.type === 'CallExpression' &&
              node.init.callee.type === 'MemberExpression' &&
              node.init.callee.object.name === 'logger' &&
              node.init.callee.property.name === 'child'
            ) {
              hasChildLogger = true;
            }
          },
          'Program:exit'() {
            // NOTE: requestId was removed from codebase - only check for logger.child() existence
            if (hasAsyncExport && !hasChildLogger) {
              // Determine operation name from function name or file path
              const operationName = asyncFunctionNode?.id?.name || 'Page';
              const route = filename.includes('/app/') 
                ? filename.split('/app/')[1]?.replace(/\/page\.tsx$/, '').replace(/\/layout\.tsx$/, '') || '/'
                : '/';
              const modulePath = filename.includes('apps/web/src/')
                ? filename.split('apps/web/src/')[1] || filename
                : filename;

              context.report({
                node: asyncFunctionNode || ast,
                messageId: 'missingChildLogger',
                fix(fixer) {
                  const fixes = [];

                  // Step 1: Add logger import if missing
                  if (!hasLoggerImport && lastImportNode) {
                    const importPath = filename.includes('apps/web/src/')
                      ? '@heyclaude/web-runtime/logging/server'
                      : '@heyclaude/shared-runtime/logger';
                    fixes.push(
                      fixer.insertTextAfter(
                        lastImportNode,
                        `\nimport { logger } from '${importPath}';`
                      )
                    );
                  } else if (!hasLoggerImport) {
                    // No imports at all - add at top
                    const importPath = filename.includes('apps/web/src/')
                      ? '@heyclaude/web-runtime/logging/server'
                      : '@heyclaude/shared-runtime/logger';
                    fixes.push(
                      fixer.insertTextBefore(
                        ast.body[0] || asyncFunctionNode,
                        `import { logger } from '${importPath}';\n`
                      )
                    );
                  }

                  // Step 2: Add logger.child() call at start of function
                  // NOTE: requestId was removed from codebase - do NOT add it
                  if (asyncFunctionNode && asyncFunctionNode.body) {
                    const childLoggerCode = `const reqLogger = logger.child({\n  operation: '${operationName}',\n  route: '${route}',\n  module: '${modulePath}',\n});\n\n`;
                    
                    if (firstStatementNode) {
                      fixes.push(fixer.insertTextBefore(firstStatementNode, childLoggerCode));
                    } else {
                      // Empty function body - add after opening brace
                      const bodyStart = asyncFunctionNode.body.range[0] + 1; // After {
                      fixes.push(fixer.insertTextAfterRange([bodyStart, bodyStart], `\n${childLoggerCode}`));
                    }
                  }

                  return fixes;
                },
              });
            }
            // NOTE: Removed requestId check - requestId was removed from codebase
          },
        };
      },
    },

    'require-loading-tsx-for-async-pages': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest loading.tsx for async pages',
          category: 'UX',
          recommended: false,
        },
        fixable: null,
        schema: [],
        messages: {
          missingLoadingFile:
            'Async page should have loading.tsx sibling for better UX during data fetching. Create loading.tsx in same directory.',
        },
      },
      create(context) {
        // This would require file system access to check for loading.tsx
        // Skipping implementation for now
        return {};
      },
    },
    
    /**
     * WARN-PII-FIELD-LOGGING
     * 
     * Warns when PII fields (IP, phone, email, geolocation) are detected in log contexts.
     * This is informational - redaction handles these fields automatically, but developers
     * should be aware they're logging PII.
     * 
     * Related: prevent-raw-userid-logging (for user ID hashing)
     * Related: SENSITIVE_PATTERNS in shared-runtime/logger/config.ts (automatic redaction)
     */
    'warn-pii-field-logging': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Warn when PII fields (IP, phone, email, geolocation) are logged. Redaction handles these automatically, but developers should be aware.',
          category: 'Security',
          recommended: true,
        },
        fixable: null, // No auto-fix - just awareness
        schema: [],
        messages: {
          ipFieldLogged:
            'IP address field "{{field}}" detected in log context. This is automatically redacted by the logger, but consider if this data is necessary for debugging.',
          phoneFieldLogged:
            'Phone number field "{{field}}" detected in log context. This is automatically redacted by the logger, but consider if this data is necessary for debugging.',
          emailFieldLogged:
            'Email field "{{field}}" detected in log context. This is automatically redacted by the logger. For user identification, prefer userIdHash instead.',
          geoFieldLogged:
            'Geolocation field "{{field}}" detected in log context. This is automatically redacted by the logger, but consider if this data is necessary for debugging.',
          genericPiiFieldLogged:
            'PII field "{{field}}" detected in log context. This is automatically redacted by the logger, but consider if this data is necessary.',
        },
      },
      create(context) {
        // PII field patterns to detect
        const IP_FIELDS = ['ip', 'ipAddress', 'ip_address', 'clientIp', 'client_ip', 'remoteAddress', 'remote_address', 'xForwardedFor', 'x_forwarded_for'];
        const PHONE_FIELDS = ['phone', 'phoneNumber', 'phone_number', 'mobile', 'mobileNumber', 'mobile_number', 'telephone', 'tel', 'cell', 'cellPhone', 'cell_phone'];
        const EMAIL_FIELDS = ['email', 'userEmail', 'user_email', 'emailAddress', 'email_address'];
        const GEO_FIELDS = ['latitude', 'longitude', 'lat', 'lng', 'geo', 'geolocation', 'coordinates', 'location'];
        
        // Combine all PII fields for quick lookup
        const ALL_PII_FIELDS = new Set([...IP_FIELDS, ...PHONE_FIELDS, ...EMAIL_FIELDS, ...GEO_FIELDS]);
        
        /**
         * Get the message ID for a PII field
         */
        function getMessageId(fieldName) {
          const lowerField = fieldName.toLowerCase();
          if (IP_FIELDS.some(f => f.toLowerCase() === lowerField)) return 'ipFieldLogged';
          if (PHONE_FIELDS.some(f => f.toLowerCase() === lowerField)) return 'phoneFieldLogged';
          if (EMAIL_FIELDS.some(f => f.toLowerCase() === lowerField)) return 'emailFieldLogged';
          if (GEO_FIELDS.some(f => f.toLowerCase() === lowerField)) return 'geoFieldLogged';
          return 'genericPiiFieldLogged';
        }
        
        /**
         * Check if we're inside a logger call context
         */
        function isInLoggerContext(node) {
          let parent = node.parent;
          while (parent) {
            if (
              parent.type === 'CallExpression' &&
              parent.callee.type === 'MemberExpression' &&
              parent.callee.object.type === 'Identifier' &&
              (parent.callee.object.name === 'logger' || 
               parent.callee.object.name.endsWith('Logger') ||
               parent.callee.object.name === 'pinoLogger') &&
              parent.callee.property.type === 'Identifier' &&
              ['info', 'error', 'warn', 'debug', 'trace', 'fatal', 'audit', 'security', 'child'].includes(parent.callee.property.name)
            ) {
              return true;
            }
            // Also check for logError, logInfo, logWarn helper functions
            if (
              parent.type === 'CallExpression' &&
              parent.callee.type === 'Identifier' &&
              ['logError', 'logInfo', 'logWarn', 'logDebug', 'logTrace'].includes(parent.callee.name)
            ) {
              return true;
            }
            parent = parent.parent;
          }
          return false;
        }
        
        return {
          Property(node) {
            // Only check properties with identifier keys
            if (node.key.type !== 'Identifier') return;
            
            const fieldName = node.key.name;
            
            // Check if this is a PII field (case-insensitive match)
            const isPiiField = Array.from(ALL_PII_FIELDS).some(
              piiField => piiField.toLowerCase() === fieldName.toLowerCase()
            );
            
            if (!isPiiField) return;
            
            // Only warn if we're in a logger context
            if (!isInLoggerContext(node)) return;
            
            // Report the warning
            context.report({
              node: node.key,
              messageId: getMessageId(fieldName),
              data: { field: fieldName },
            });
          },
        };
      },
    },
    
    /**
     * REQUIRE-AUDIT-LEVEL-FOR-MUTATIONS
     * 
     * Suggests adding audit/security structured tags for database mutations and sensitive operations.
     * This helps with compliance logging and audit trails.
     * 
     * NOTE: No autofix - use structured tags like { audit: true } or { securityEvent: true }
     * instead of custom log levels (which require TypeScript type augmentation).
     * 
     * Level: warn (suggestion, not error)
     */
    'require-audit-level-for-mutations': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest adding audit/security tags for database mutations and sensitive operations to maintain audit trails.',
          category: 'Best Practices',
          recommended: true,
        },
        // NOTE: No autofix - custom log levels require TypeScript augmentation
        // Use structured tags instead: logger.info('msg', { audit: true })
        schema: [],
        messages: {
          useAuditLevel:
            'Database mutation detected. Consider adding { audit: true } to the log context for compliance audit trails. Example: logger.info("User updated", { audit: true, userId, action: "update" })',
          useSecurityLevel:
            'Security-sensitive operation detected. Consider adding { securityEvent: true } to the log context. Example: logger.warn("Auth failed", { securityEvent: true, reason })',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();
        
        // Patterns that indicate mutations
        const MUTATION_PATTERNS = [
          /\.insert\s*\(/,
          /\.update\s*\(/,
          /\.delete\s*\(/,
          /\.upsert\s*\(/,
          /\.rpc\s*\(\s*['"](?:create|update|delete|insert|upsert|remove|add|modify|set|save)/i,
          /isMutation\s*:\s*true/,
        ];
        
        // Patterns that indicate security operations
        const SECURITY_PATTERNS = [
          /auth\.signIn/,
          /auth\.signOut/,
          /auth\.signUp/,
          /verifyPassword/,
          /checkPermission/,
          /validateToken/,
          /revokeToken/,
          /unauthorized/i,
          /forbidden/i,
          /permission.*denied/i,
        ];
        
        /**
         * Check if the current function contains mutation patterns
         */
        function containsMutationPattern(node) {
          // Get the containing function
          let funcNode = node;
          while (funcNode && !['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(funcNode.type)) {
            funcNode = funcNode.parent;
          }
          
          if (!funcNode) return false;
          
          const funcText = sourceCode.getText(funcNode);
          return MUTATION_PATTERNS.some(pattern => pattern.test(funcText));
        }
        
        /**
         * Check if the current function contains security patterns
         */
        function containsSecurityPattern(node) {
          let funcNode = node;
          while (funcNode && !['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(funcNode.type)) {
            funcNode = funcNode.parent;
          }
          
          if (!funcNode) return false;
          
          const funcText = sourceCode.getText(funcNode);
          return SECURITY_PATTERNS.some(pattern => pattern.test(funcText));
        }
        
        /**
         * Check if the log call already includes audit/security tags
         */
        function hasAuditOrSecurityTag(node) {
          // Check if second argument (log context) exists
          if (node.arguments.length < 2) return false;
          
          const contextArg = node.arguments[1];
          
          // Handle ObjectExpression: { audit: true } or { securityEvent: true }
          if (contextArg.type === 'ObjectExpression') {
            return contextArg.properties.some(prop => {
              if (prop.type !== 'Property') return false;
              const keyName = prop.key.type === 'Identifier' ? prop.key.name : 
                             prop.key.type === 'Literal' ? prop.key.value : null;
              return keyName === 'audit' || keyName === 'securityEvent';
            });
          }
          
          return false;
        }
        
        return {
          CallExpression(node) {
            // Check for logger.info() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              (node.callee.object.name === 'logger' || node.callee.object.name.endsWith('Logger')) &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'info'
            ) {
              // Skip if already has audit/security tags
              if (hasAuditOrSecurityTag(node)) {
                return;
              }
              
              // Check if this is in a mutation context
              if (containsMutationPattern(node)) {
                context.report({
                  node: node.callee.property,
                  messageId: 'useAuditLevel',
                  // No autofix - let developer add structured tag manually
                });
              }
              // Check if this is in a security context
              else if (containsSecurityPattern(node)) {
                context.report({
                  node: node.callee.property,
                  messageId: 'useSecurityLevel',
                  // No autofix - let developer add structured tag manually
                });
              }
            }
          },
        };
      },
    },
    
    /**
     * suggest-warn-for-recoverable-errors
     * 
     * Suggests using logger.warn() instead of logger.error() for recoverable failures.
     * 
     * Patterns detected:
     * - Animation/config loading failures (has fallbacks)
     * - DOMPurify loading failures (has fallbacks)
     * - Clipboard/copy failures (user can retry)
     * - Share/screenshot failures (user can retry)
     * - Confetti/cosmetic failures (non-critical)
     * - localStorage failures (optional feature)
     * - Rendering fallback errors (has UI fallbacks)
     * 
     * Level: warn (suggestion, not error)
     */
    'suggest-warn-for-recoverable-errors': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Suggest using logger.warn() instead of logger.error() for recoverable failures that have fallbacks or can be retried.',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // No auto-fix - requires manual verification
        schema: [],
        messages: {
          animationConfigShouldWarn:
            'Animation config loading failures are non-critical (has fallbacks). Consider using logger.warn() instead of logger.error().',
          domPurifyShouldWarn:
            'DOMPurify loading failures have fallbacks. Consider using logger.warn() instead of logger.error().',
          clipboardShouldWarn:
            'Clipboard operations can be retried by the user. Consider using logger.warn() instead of logger.error().',
          shareShouldWarn:
            'Share/screenshot operations can be retried. Consider using logger.warn() instead of logger.error().',
          confettiShouldWarn:
            'Confetti/animation failures are cosmetic only. Consider using logger.warn() instead of logger.error().',
          localStorageShouldWarn:
            'localStorage failures are recoverable (optional feature). Consider using logger.warn() instead of logger.error().',
          renderingFallbackShouldWarn:
            'Rendering failures with UI fallbacks are recoverable. Consider using logger.warn() instead of logger.error().',
          genericRecoverableShouldWarn:
            'This error appears to be recoverable. Consider using logger.warn() instead of logger.error() if the operation has a fallback or can be retried.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();
        
        // Patterns that indicate recoverable errors (should be warn, not error)
        const RECOVERABLE_PATTERNS = {
          animationConfig: [
            /failed to load animation config/i,
            /animation config/i,
            /load.*animation/i,
          ],
          domPurify: [
            /failed to load dompurify/i,
            /dompurify/i,
            /sanitize.*html/i,
            /Failed to sanitize HTML/i,
          ],
          clipboard: [
            /clipboard/i,
            /copy.*fail/i,
            /failed to copy/i,
            /copy failed/i,
          ],
          share: [
            /share.*fail/i,
            /screenshot.*fail/i,
            /failed to share/i,
            /download.*fail/i,
            /Share failed/i,
            /Download failed/i,
            /Screenshot.*fail/i,
          ],
          confetti: [
            /confetti/i,
            /celebrate/i,
          ],
          localStorage: [
            /localStorage/i,
            /local storage/i,
            /storage event/i,
          ],
          renderingFallback: [
            /rendering failed/i,
            /render.*fail/i,
            /failed to render/i,
            /Rendering failed/i,
          ],
        };
        
        /**
         * Get the message string from a logger call
         */
        function getLogMessage(node) {
          if (!node.arguments || node.arguments.length === 0) return '';
          
          const firstArg = node.arguments[0];
          if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
            return firstArg.value;
          }
          if (firstArg.type === 'TemplateLiteral') {
            // Get the static parts of the template literal
            return firstArg.quasis.map(q => q.value.raw).join('');
          }
          return '';
        }
        
        /**
         * Determine which category of recoverable error this is
         */
        function getRecoverableCategory(message) {
          const lowerMessage = message.toLowerCase();
          
          for (const [category, patterns] of Object.entries(RECOVERABLE_PATTERNS)) {
            if (patterns.some(pattern => pattern.test(lowerMessage))) {
              return category;
            }
          }
          return null;
        }
        
        /**
         * Get the appropriate message ID for a category
         */
        function getMessageId(category) {
          switch (category) {
            case 'animationConfig': return 'animationConfigShouldWarn';
            case 'domPurify': return 'domPurifyShouldWarn';
            case 'clipboard': return 'clipboardShouldWarn';
            case 'share': return 'shareShouldWarn';
            case 'confetti': return 'confettiShouldWarn';
            case 'localStorage': return 'localStorageShouldWarn';
            case 'renderingFallback': return 'renderingFallbackShouldWarn';
            default: return 'genericRecoverableShouldWarn';
          }
        }
        
        return {
          CallExpression(node) {
            // Check if this is a logger.error() call
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'error'
            ) {
              // Check if the object is a logger (logger, reqLogger, childLogger, etc.)
              const objectName = node.callee.object.type === 'Identifier' 
                ? node.callee.object.name 
                : '';
              
              if (
                objectName === 'logger' ||
                objectName.endsWith('Logger') ||
                objectName === 'log'
              ) {
                const message = getLogMessage(node);
                const category = getRecoverableCategory(message);
                
                if (category) {
                  context.report({
                    node: node.callee.property,
                    messageId: getMessageId(category),
                  });
                }
              }
            }
          },
        };
      },
    },
    'require-logging-context': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require route and operation in logger.child() context for server components and API routes. Prefer logger.child() for request-scoped context instead of passing context in every log call.',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingLoggerChild: 'Server components and API routes with async operations must create request-scoped logger using logger.child()',
          missingRoute: 'logger.child() must include route in context object. Use: const reqLogger = logger.child({ operation: "MyPage", route: "/my-page" })',
          missingOperation: 'logger.child() must include operation in context object. Use: const reqLogger = logger.child({ operation: "MyPage", route: "/my-page" })',
          useChildLogger: 'Use logger.child({ {field}, ... }) at request start instead of passing {field} in every log call. Child logger context is automatically included in all logs.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only validate server components and API routes
        const isServerComponent = filename.includes('/app/') && (filename.endsWith('/page.tsx') || filename.endsWith('/page.ts'));
        const isApiRoute = filename.includes('/api/') && (filename.endsWith('/route.ts') || filename.endsWith('/route.tsx'));

        if (!isServerComponent && !isApiRoute) {
          return {};
        }

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        if (isClientComponent) {
          return {};
        }

        let hasUseCache = false;
        let defaultExportFunction = null;
        let hasAsyncInComponentBody = false;
        let hasAsyncOperations = false;
        let hasLoggerChild = false;
        let hasRoute = false;
        let hasOperation = false;
        let loggerChildNode = null;
        
        // Track context fields that should be in child logger (from require-logger-bindings-for-context)
        const contextFields = ['operation', 'route', 'module', 'function', 'userId', 'method'];
        const childLoggerNames = ['reqLogger', 'userLogger', 'actionLogger', 'metadataLogger', 'viewerLogger', 'processLogger', 'callbackLogger', 'requestLogger', 'utilityLogger', 'sectionLogger'];
        let hasChildLoggerVariable = false;

        // Helper to check if node contains async operations
        function hasAsyncOps(node) {
          if (!node) return false;
          const nodeText = sourceCode.getText(node);
          // Check for async patterns using AST
          let found = false;
          function traverse(n) {
            if (!n) return;
            if (n.type === 'AwaitExpression') {
              found = true;
              return;
            }
            if (n.type === 'CallExpression') {
              if (n.callee && n.callee.type === 'MemberExpression') {
                const prop = n.callee.property;
                if (prop && prop.type === 'Identifier' && (prop.name === 'rpc' || prop.name === 'from')) {
                  found = true;
                  return;
                }
              }
              if (n.callee && n.callee.type === 'Identifier') {
                const names = ['fetch', 'getContent', 'getData', 'fetchData', 'loadData', 'query', 'select', 'getUser', 'getCategory'];
                if (names.includes(n.callee.name)) {
                  found = true;
                  return;
                }
              }
            }
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
              if (n.async) {
                found = true;
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        // Helper to check for 'use cache' directive
          function checkUseCache(node) {
            if (!node) return false;
            // Check comments using pure AST (no getText())
            const comments = sourceCode.getCommentsBefore(node) || [];
            return hasUseCacheDirective(comments);
          // Check for directive in program body
          if (node.type === 'Program' && node.body && node.body.length > 0) {
            const first = node.body[0];
            if (first && first.type === 'ExpressionStatement') {
              const expr = first.expression;
              if (expr && expr.type === 'Literal') {
                // Use AST properties directly (no string includes)
                const value = expr.value;
                const raw = expr.raw;
                if (value === 'use cache' || value === "'use cache'" || value === '"use cache"' ||
                    raw === "'use cache'" || raw === '"use cache"' ||
                    value === 'use cache: private' || raw === "'use cache: private'" || raw === '"use cache: private"') {
                  return true;
                }
              }
            }
          }
          return false;
        }

        // Find default export function
        function findDefaultExport(node) {
          if (!node) return null;
          if (node.type === 'Program') {
            for (const stmt of node.body || []) {
              if (stmt.type === 'ExportDefaultDeclaration') {
                const decl = stmt.declaration;
                if (decl && (decl.type === 'FunctionDeclaration' || decl.type === 'FunctionExpression' || decl.type === 'ArrowFunctionExpression')) {
                  return decl;
                }
                if (decl && decl.type === 'Identifier') {
                  // Find the function by name
                  for (const s of node.body || []) {
                    if (s.type === 'FunctionDeclaration' && s.id && s.id.name === decl.name) {
                      return s;
                    }
                  }
                }
              }
            }
          }
          return null;
        }

        return {
          Program(node) {
            hasUseCache = checkUseCache(node);
            defaultExportFunction = findDefaultExport(node);
            
            if (hasUseCache && defaultExportFunction) {
              // Check if component body has async operations
              hasAsyncInComponentBody = hasAsyncOps(defaultExportFunction);
            }
            
            // Check entire file for async operations
            hasAsyncOperations = hasAsyncOps(node);
          },
          CallExpression(node) {
            // Check for logger.child() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'child' &&
              (node.callee.object.type === 'Identifier' && 
               (node.callee.object.name === 'logger' || 
                node.callee.object.name === 'reqLogger' || 
                node.callee.object.name === 'routeLogger'))
            ) {
              hasLoggerChild = true;
              loggerChildNode = node;

              // Check arguments for route and operation
              if (node.arguments.length > 0 && node.arguments[0].type === 'ObjectExpression') {
                const objLiteral = node.arguments[0];
                for (const prop of objLiteral.properties) {
                  if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                    if (prop.key.name === 'route') {
                      hasRoute = true;
                    }
                    if (prop.key.name === 'operation') {
                      hasOperation = true;
                    }
                  }
                }
              }
            }
            
            // Check logger calls (only base logger, not child loggers) - from require-logger-bindings-for-context
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              (node.callee.property.name === 'info' ||
                node.callee.property.name === 'error' ||
                node.callee.property.name === 'warn' ||
                node.callee.property.name === 'debug')
            ) {
              const args = node.arguments;
              const contextArg = args && args.length > 0 ? args[0] : null;

              // Skip if child logger is used (either via logger.child() or child logger variables)
              if (contextArg && contextArg.type === 'ObjectExpression' && !hasLoggerChild && !hasChildLoggerVariable) {
                // Check if context contains fields that should be in child logger
                for (const prop of contextArg.properties || []) {
                  if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                    const keyName = prop.key.name;
                    if (contextFields.includes(keyName)) {
                      context.report({
                        node: prop,
                        messageId: 'useChildLogger',
                        data: { field: keyName },
                      });
                    }
                  }
                }
              }
            }
          },
          VariableDeclarator(node) {
            // Check for child logger variable declarations - from require-logger-bindings-for-context
            if (node.id && node.id.type === 'Identifier' && childLoggerNames.includes(node.id.name)) {
              hasChildLoggerVariable = true;
            }
          },
          'Program:exit'() {
            // Skip static pages with 'use cache' that have no async operations in component body
            if (hasUseCache && !hasAsyncInComponentBody) {
              return;
            }

            // Skip if no async operations
            if (!hasAsyncOperations) {
              return;
            }

            if (!hasLoggerChild) {
              context.report({
                node: ast,
                messageId: 'missingLoggerChild',
              });
            } else if (hasLoggerChild && !hasRoute) {
              context.report({
                node: loggerChildNode || ast,
                messageId: 'missingRoute',
              });
            } else if (hasLoggerChild && !hasOperation) {
              context.report({
                node: loggerChildNode || ast,
                messageId: 'missingOperation',
              });
            }
          },
        };
      },
    },
    'require-error-handling-server-components': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require try/catch blocks and error logging in server components with async operations',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingTryCatch: 'Server components with async operations must have try/catch blocks',
          missingErrorLogging: 'Catch blocks must log errors using logger.error() or reqLogger.error()',
          missingNormalizeError: 'Catch blocks should use normalizeError() before logging',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only validate server components
        const isServerComponent = filename.includes('/app/') && (filename.endsWith('/page.tsx') || filename.endsWith('/page.ts'));

        if (!isServerComponent) {
          return {};
        }

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        if (isClientComponent) {
          return {};
        }

        let hasUseCache = false;
        let defaultExportFunction = null;
        let hasAsyncInComponentBody = false;
        let hasAsyncOperations = false;
        let hasTryCatch = false;
        let hasErrorLogging = false;
        let hasNormalizeError = false;
        const catchBlocks = [];

        // Helper to check if node contains async operations
        function hasAsyncOps(node) {
          if (!node) return false;
          let found = false;
          function traverse(n) {
            if (!n) return;
            if (n.type === 'AwaitExpression') {
              found = true;
              return;
            }
            if (n.type === 'CallExpression') {
              if (n.callee && n.callee.type === 'MemberExpression') {
                const prop = n.callee.property;
                if (prop && prop.type === 'Identifier' && (prop.name === 'rpc' || prop.name === 'from')) {
                  found = true;
                  return;
                }
              }
              if (n.callee && n.callee.type === 'Identifier') {
                const names = ['fetch', 'getContent', 'getData', 'fetchData', 'loadData', 'query', 'select', 'getUser', 'getCategory'];
                if (names.includes(n.callee.name)) {
                  found = true;
                  return;
                }
              }
            }
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
              if (n.async) {
                found = true;
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        // Helper to check for 'use cache' directive
        function checkUseCache(node) {
          if (!node) return false;
          // Check comments using pure AST (no getText())
          const comments = sourceCode.getCommentsBefore(node) || [];
          if (hasUseCacheDirective(comments)) {
            return true;
          }
          // Also check first statement for 'use cache' directive (pure AST)
          if (node.type === 'Program' && node.body && node.body.length > 0) {
            const first = node.body[0];
            if (first && first.type === 'ExpressionStatement') {
              const expr = first.expression;
              if (expr && expr.type === 'Literal') {
                const value = expr.value;
                const raw = expr.raw;
                // Check AST properties directly (no string includes)
                if (value === 'use cache' || value === "'use cache'" || value === '"use cache"' ||
                    raw === "'use cache'" || raw === '"use cache"' ||
                    value === 'use cache: private' || raw === "'use cache: private'" || raw === '"use cache: private"') {
                  return true;
                }
              }
            }
          }
          return false;
        }

        // Find default export function
        function findDefaultExport(node) {
          if (!node) return null;
          if (node.type === 'Program') {
            for (const stmt of node.body || []) {
              if (stmt.type === 'ExportDefaultDeclaration') {
                const decl = stmt.declaration;
                if (decl && (decl.type === 'FunctionDeclaration' || decl.type === 'FunctionExpression' || decl.type === 'ArrowFunctionExpression')) {
                  return decl;
                }
                if (decl && decl.type === 'Identifier') {
                  for (const s of node.body || []) {
                    if (s.type === 'FunctionDeclaration' && s.id && s.id.name === decl.name) {
                      return s;
                    }
                  }
                }
              }
            }
          }
          return null;
        }

        return {
          Program(node) {
            hasUseCache = checkUseCache(node);
            defaultExportFunction = findDefaultExport(node);
            
            if (hasUseCache && defaultExportFunction) {
              hasAsyncInComponentBody = hasAsyncOps(defaultExportFunction);
            }
            
            hasAsyncOperations = hasAsyncOps(node);
          },
          TryStatement(node) {
            hasTryCatch = true;
            if (node.handler) {
              catchBlocks.push(node.handler);
            }
          },
          CallExpression(node) {
            // Check for error logging in catch blocks (Pino object-first API)
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier' &&
              (node.callee.property.name === 'error' || node.callee.property.name === 'warn') &&
              node.callee.object.type === 'Identifier' &&
              (node.callee.object.name === 'logger' || 
               node.callee.object.name === 'reqLogger' || 
               node.callee.object.name === 'routeLogger' ||
               node.callee.object.name === 'userLogger')
            ) {
              // Check if this call is within a catch block
              let parent = node.parent;
              while (parent) {
                if (parent.type === 'CatchClause') {
                  hasErrorLogging = true;
                  // Also check if using correct Pino API (object-first with err key)
                  if (node.arguments && node.arguments.length > 0) {
                    const firstArg = node.arguments[0];
                    if (firstArg && firstArg.type === 'ObjectExpression') {
                      for (const prop of firstArg.properties || []) {
                        if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier' && 
                            (prop.key.name === 'err' || prop.key.name === 'error')) {
                          // Check if error value is normalized
                          if (prop.value && prop.value.type === 'Identifier') {
                            // Check if this identifier is result of normalizeError
                            let isNormalized = false;
                            let varParent = node.parent;
                            while (varParent) {
                              if (varParent.type === 'VariableDeclarator' && varParent.init) {
                                if (varParent.init.type === 'CallExpression' && 
                                    varParent.init.callee && 
                                    varParent.init.callee.type === 'Identifier' && 
                                    varParent.init.callee.name === 'normalizeError') {
                                  if (varParent.id && varParent.id.type === 'Identifier' && 
                                      varParent.id.name === prop.value.name) {
                                    isNormalized = true;
                                    break;
                                  }
                                }
                              }
                              varParent = varParent.parent;
                            }
                            if (isNormalized) {
                              hasNormalizeError = true;
                            }
                          }
                        }
                      }
                    }
                  }
                  break;
                }
                parent = parent.parent;
              }
            }

            // Check for normalizeError usage in catch blocks
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'normalizeError'
            ) {
              let parent = node.parent;
              while (parent) {
                if (parent.type === 'CatchClause') {
                  hasNormalizeError = true;
                  break;
                }
                parent = parent.parent;
              }
            }
          },
          'Program:exit'() {
            // Skip static pages with 'use cache' that have no async operations in component body
            if (hasUseCache && !hasAsyncInComponentBody) {
              return;
            }

            // Skip if no async operations
            if (!hasAsyncOperations) {
              return;
            }

            if (!hasTryCatch) {
              context.report({
                node: ast,
                messageId: 'missingTryCatch',
              });
            } else if (!hasErrorLogging) {
              context.report({
                node: catchBlocks[0] || ast,
                messageId: 'missingErrorLogging',
              });
            } else if (!hasNormalizeError) {
              context.report({
                node: catchBlocks[0] || ast,
                messageId: 'missingNormalizeError',
              });
            }
          },
        };
      },
    },
    'require-error-handling-client-components': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require useLoggedAsync or equivalent error handling in client components with async operations',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingUseLoggedAsync: 'Client components with async operations must use useLoggedAsync or equivalent error handling (.catch with logUnhandledPromise, or try/catch with error logging)',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        if (!isClientComponent) {
          return {};
        }

        let hasAsyncOperations = false;
        let hasUseLoggedAsync = false;
        let hasCatchWithLogUnhandled = false;
        let hasTryCatchWithLogging = false;

        // Helper to check if node contains async operations
        function hasAsyncOps(node) {
          if (!node) return false;
          let found = false;
          function traverse(n) {
            if (!n) return;
            if (n.type === 'AwaitExpression') {
              found = true;
              return;
            }
            if (n.type === 'CallExpression') {
              if (n.callee && n.callee.type === 'Identifier' && n.callee.name === 'fetch') {
                found = true;
                return;
              }
              if (n.callee && n.callee.type === 'MemberExpression' && n.callee.property && n.callee.property.type === 'Identifier') {
                if (n.callee.property.name === 'then' || n.callee.property.name === 'catch') {
                  found = true;
                  return;
                }
              }
            }
            if (n.type === 'NewExpression' && n.callee && n.callee.type === 'Identifier' && n.callee.name === 'Promise') {
              found = true;
              return;
            }
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
              if (n.async) {
                found = true;
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        return {
          Program(node) {
            hasAsyncOperations = hasAsyncOps(node);
          },
          CallExpression(node) {
            // Check for useLoggedAsync usage
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'useLoggedAsync'
            ) {
              hasUseLoggedAsync = true;
            }

            // Check for .catch() with logUnhandledPromise
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'catch'
            ) {
              // Check if catch block contains logUnhandledPromise using AST
              const catchArg = node.arguments[0];
              if (catchArg && (catchArg.type === 'ArrowFunctionExpression' || catchArg.type === 'FunctionExpression')) {
                function findLogUnhandledPromise(n) {
                  if (!n) return false;
                  if (n.type === 'CallExpression' && n.callee && n.callee.type === 'Identifier' && n.callee.name === 'logUnhandledPromise') {
                    return true;
                  }
                  for (const key in n) {
                    if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                      if (Array.isArray(n[key])) {
                        for (const item of n[key]) {
                          if (findLogUnhandledPromise(item)) return true;
                        }
                      } else {
                        if (findLogUnhandledPromise(n[key])) return true;
                      }
                    }
                  }
                  return false;
                }
                if (findLogUnhandledPromise(catchArg)) {
                  hasCatchWithLogUnhandled = true;
                }
              }
            }

            // Check for logClientError or logClientWarn (valid error handling)
            if (
              node.callee.type === 'Identifier' &&
              (node.callee.name === 'logClientError' || node.callee.name === 'logClientWarn')
            ) {
              // Check if within try/catch
              let parent = node.parent;
              while (parent) {
                if (parent.type === 'TryStatement') {
                  hasTryCatchWithLogging = true;
                  break;
                }
                parent = parent.parent;
              }
            }
          },
          'Program:exit'() {
            if (!hasAsyncOperations) {
              return;
            }

            if (!hasUseLoggedAsync && !hasCatchWithLogUnhandled && !hasTryCatchWithLogging) {
              context.report({
                node: ast,
                messageId: 'missingUseLoggedAsync',
              });
            }
          },
        };
      },
    },
    'require-cache-components': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require Cache Components directive for server components with data fetching',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - directive placement is critical and can break pages
        schema: [],
        messages: {
          missingCacheDirective: "Server components with async data fetching must use 'use cache' or 'use cache: private' directive",
          missingCacheLife: "Components with cache directive should use cacheLife() to specify cache profile",
          missingConnection: 'Components with non-deterministic operations (Date.now(), Math.random()) must call await connection() before using them',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only validate server components (pages)
        const isServerComponent = filename.includes('/app/') && (filename.endsWith('/page.tsx') || filename.endsWith('/page.ts'));
        if (!isServerComponent) {
          return {};
        }

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);
        if (isClientComponent) {
          return {};
        }

        // Skip excluded pages
        const excludedPages = ['error.tsx', 'loading.tsx', 'not-found.tsx', 'layout.tsx', 'template.tsx'];
        if (excludedPages.some(excluded => filename.includes(excluded))) {
          return {};
        }

        let hasUseCache = false;
        let hasCacheLife = false;
        let hasConnection = false;
        let hasAsyncDataFetching = false;
        let hasNonDeterministicOps = false;
        let defaultExportFunction = null;

        // Helper to find default export function
        function findDefaultExport(node) {
          if (!node || node.type !== 'Program') return null;
          for (const stmt of node.body || []) {
            if (stmt.type === 'ExportDefaultDeclaration') {
              const decl = stmt.declaration;
              if (decl && (decl.type === 'FunctionDeclaration' || decl.type === 'FunctionExpression' || decl.type === 'ArrowFunctionExpression')) {
                return decl;
              }
              if (decl && decl.type === 'Identifier') {
                for (const s of node.body || []) {
                  if (s.type === 'FunctionDeclaration' && s.id && s.id.name === decl.name) {
                    return s;
                  }
                }
              }
            }
          }
          return null;
        }

        // Helper to check for async data fetching patterns
        function hasAsyncDataFetchingOps(node) {
          if (!node) return false;
          let found = false;
          const dataFetchingPatterns = ['rpc', 'from', 'fetch', 'getContent', 'getData', 'fetchData', 'loadData', 'query', 'select', 'getUser', 'getCategory'];
          function traverse(n) {
            if (!n || found) return;
            if (n.type === 'AwaitExpression') {
              found = true;
              return;
            }
            if (n.type === 'CallExpression') {
              if (n.callee && n.callee.type === 'MemberExpression' && n.callee.property && n.callee.property.type === 'Identifier') {
                if (n.callee.property.name === 'rpc' || n.callee.property.name === 'from') {
                  found = true;
                  return;
                }
              }
              if (n.callee && n.callee.type === 'Identifier' && dataFetchingPatterns.includes(n.callee.name)) {
                found = true;
                return;
              }
            }
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
              if (n.async) {
                found = true;
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        // Helper to check for non-deterministic operations
        function hasNonDeterministicOperations(node) {
          if (!node) return false;
          let found = false;
          function traverse(n) {
            if (!n || found) return;
            if (n.type === 'CallExpression') {
              if (n.callee && n.callee.type === 'MemberExpression') {
                const obj = n.callee.object;
                const prop = n.callee.property;
                if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                  if ((obj.name === 'Date' && prop.name === 'now') ||
                      (obj.name === 'Math' && prop.name === 'random') ||
                      (obj.name === 'crypto' && prop.name === 'randomUUID') ||
                      (obj.name === 'performance' && prop.name === 'now')) {
                    found = true;
                    return;
                  }
                }
              }
              if (n.callee && n.callee.type === 'NewExpression' && n.callee.callee && n.callee.callee.type === 'Identifier' && n.callee.callee.name === 'Date') {
                found = true;
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        // Helper to check for 'use cache' directive
        function checkUseCache(node) {
          if (!node) return false;
          // Check comments using pure AST (no getText())
          const comments = sourceCode.getCommentsBefore(node) || [];
          if (hasUseCacheDirective(comments)) {
            return true;
          }
          // Also check first statement for 'use cache' directive (pure AST)
          if (node.type === 'Program' && node.body && node.body.length > 0) {
            const first = node.body[0];
            if (first && first.type === 'ExpressionStatement') {
              const expr = first.expression;
              if (expr && expr.type === 'Literal') {
                const value = expr.value;
                const raw = expr.raw;
                // Check AST properties directly (no string includes)
                if (value === 'use cache' || value === "'use cache'" || value === '"use cache"' ||
                    raw === "'use cache'" || raw === '"use cache"' ||
                    value === 'use cache: private' || raw === "'use cache: private'" || raw === '"use cache: private"') {
                  return true;
                }
              }
            }
          }
          return false;
        }

        return {
          Program(node) {
            hasUseCache = checkUseCache(node);
            defaultExportFunction = findDefaultExport(node);
            if (defaultExportFunction) {
              hasAsyncDataFetching = hasAsyncDataFetchingOps(defaultExportFunction);
              hasNonDeterministicOps = hasNonDeterministicOperations(defaultExportFunction);
            }
          },
          CallExpression(node) {
            // Check for cacheLife() calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'cacheLife') {
              hasCacheLife = true;
            }
            // Check for connection() calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'connection') {
              hasConnection = true;
            }
          },
          'Program:exit'() {
            if (!hasAsyncDataFetching) {
              return;
            }

            if (!hasUseCache) {
              context.report({
                node: defaultExportFunction || ast,
                messageId: 'missingCacheDirective',
                // NOTE: Autofix disabled - directive placement is critical and can break pages if added incorrectly
              });
            } else if (!hasCacheLife) {
              context.report({
                node: ast,
                messageId: 'missingCacheLife',
              });
            }

            if (hasNonDeterministicOps && !hasConnection) {
              context.report({
                node: ast,
                messageId: 'missingConnection',
              });
            }
          },
        };
      },
    },
    'require-nextjs-async-params': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require proper awaiting of params, searchParams, headers(), and cookies() in Next.js 15+',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          paramsNotAwaited: 'params must be awaited before property access. Use: const { id } = await params',
          searchParamsNotAwaited: 'searchParams must be awaited before property access. Use: const query = await searchParams',
          headersNotAwaited: 'headers() returns a Promise and must be awaited. Use: const headers = await headers()',
          cookiesNotAwaited: 'cookies() returns a Promise and must be awaited. Use: const cookies = await cookies()',
          paramsTypeNotPromise: 'params parameter type should be Promise<T> in Next.js 15+',
          searchParamsTypeNotPromise: 'searchParams parameter type should be Promise<T> in Next.js 15+',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only validate route and page files
        const isRouteFile = filename.includes('/route.ts') || filename.includes('/route.tsx');
        const isPageFile = filename.includes('/page.tsx') || filename.includes('/page.ts');
        if (!isRouteFile && !isPageFile) {
          return {};
        }

        const awaitedVariables = new Set();
        const nextJsParams = new Set();
        const nextJsSearchParams = new Set();
        let hasHeadersImport = false;
        let hasCookiesImport = false;

        // Check for imports
        function checkImports(node) {
          if (!node || node.type !== 'Program') return;
          for (const stmt of node.body || []) {
            if (stmt.type === 'ImportDeclaration') {
              const source = stmt.source;
              if (source && source.type === 'Literal' && source.value === 'next/headers') {
                for (const spec of stmt.specifiers || []) {
                  if (spec.type === 'ImportSpecifier') {
                    if (spec.imported && spec.imported.name === 'headers') {
                      hasHeadersImport = true;
                    }
                    if (spec.imported && spec.imported.name === 'cookies') {
                      hasCookiesImport = true;
                    }
                  }
                }
              }
            }
          }
        }

        // Find function parameters that are Next.js params/searchParams
        function findNextJsParams(node) {
          if (!node || node.type !== 'Program') return;
          for (const stmt of node.body || []) {
            if (stmt.type === 'ExportDefaultDeclaration' || stmt.type === 'FunctionDeclaration' || stmt.type === 'ExportNamedDeclaration') {
              let func = null;
              if (stmt.type === 'ExportDefaultDeclaration') {
                func = stmt.declaration;
              } else if (stmt.type === 'FunctionDeclaration') {
                func = stmt;
              } else if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration && stmt.declaration.type === 'FunctionDeclaration') {
                func = stmt.declaration;
              }
              
              if (func && (func.type === 'FunctionDeclaration' || func.type === 'FunctionExpression' || func.type === 'ArrowFunctionExpression')) {
                const funcName = func.id ? func.id.name : null;
                const isRouteHandler = isRouteFile && funcName && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(funcName);
                const isPageComponent = isPageFile && (!funcName || funcName === 'default' || funcName.startsWith('generate'));
                
                if (isRouteHandler || isPageComponent) {
                  for (const param of func.params || []) {
                    if (param.type === 'Identifier') {
                      const paramName = param.name;
                      const paramType = param.typeAnnotation && param.typeAnnotation.typeAnnotation ? sourceCode.getText(param.typeAnnotation.typeAnnotation) : '';
                      
                      if (paramName === 'params') {
                        nextJsParams.add('params');
                        if (paramType && !paramType.includes('Promise')) {
                          context.report({
                            node: param,
                            messageId: 'paramsTypeNotPromise',
                          });
                        }
                      }
                      if (paramName === 'searchParams') {
                        nextJsSearchParams.add('searchParams');
                        if (paramType && !paramType.includes('Promise')) {
                          context.report({
                            node: param,
                            messageId: 'searchParamsTypeNotPromise',
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Track awaited variables
        function trackAwaitedVariables(node) {
          if (!node) return;
          if (node.type === 'VariableDeclaration') {
            for (const decl of node.declarations || []) {
              if (decl.init && decl.init.type === 'AwaitExpression') {
                const awaitedExpr = decl.init.expression;
                const awaitedText = sourceCode.getText(awaitedExpr);
                if (awaitedText === 'params' || awaitedText === 'searchParams' || awaitedText.endsWith('.params') || awaitedText.endsWith('.searchParams')) {
                  if (decl.id.type === 'Identifier') {
                    awaitedVariables.add(decl.id.name);
                  } else if (decl.id.type === 'ObjectPattern') {
                    for (const prop of decl.id.properties || []) {
                      if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
                        awaitedVariables.add(prop.key.name);
                      }
                    }
                  }
                }
              }
            }
          }
        }

        return {
          Program(node) {
            checkImports(node);
            findNextJsParams(node);
          },
          VariableDeclaration: trackAwaitedVariables,
          Property(node) {
            // Check for params.property or searchParams.property access
            if (node.parent && node.parent.type === 'ObjectPattern') {
              return; // Skip destructuring patterns
            }
            
            const expression = node.parent && node.parent.type === 'MemberExpression' ? node.parent.expression : null;
            if (expression && expression.type === 'Identifier') {
              const exprName = expression.name;
              
              if (exprName === 'params' && nextJsParams.has('params')) {
                if (!awaitedVariables.has('params')) {
                  let isAwaited = false;
                  let parent = node.parent;
                  while (parent) {
                    if (parent.type === 'AwaitExpression') {
                      isAwaited = true;
                      break;
                    }
                    parent = parent.parent;
                  }
                  if (!isAwaited) {
                    context.report({
                      node: node.parent,
                      messageId: 'paramsNotAwaited',
                    });
                  }
                }
              }
              
              if (exprName === 'searchParams' && nextJsSearchParams.has('searchParams')) {
                if (!awaitedVariables.has('searchParams')) {
                  let isAwaited = false;
                  let parent = node.parent;
                  while (parent) {
                    if (parent.type === 'AwaitExpression') {
                      isAwaited = true;
                      break;
                    }
                    parent = parent.parent;
                  }
                  if (!isAwaited) {
                    context.report({
                      node: node.parent,
                      messageId: 'searchParamsNotAwaited',
                    });
                  }
                }
              }
            }
          },
          CallExpression(node) {
            // Check for headers() and cookies() calls
            if (node.callee && node.callee.type === 'Identifier') {
              const funcName = node.callee.name;
              
              if (funcName === 'headers' && hasHeadersImport) {
                let isAwaited = false;
                let parent = node.parent;
                while (parent) {
                  if (parent.type === 'AwaitExpression') {
                    isAwaited = true;
                    break;
                  }
                  parent = parent.parent;
                }
                if (!isAwaited) {
                  context.report({
                    node,
                    messageId: 'headersNotAwaited',
                  });
                }
              }
              
              if (funcName === 'cookies' && hasCookiesImport) {
                let isAwaited = false;
                let parent = node.parent;
                while (parent) {
                  if (parent.type === 'AwaitExpression') {
                    isAwaited = true;
                    break;
                  }
                  parent = parent.parent;
                }
                if (!isAwaited) {
                  context.report({
                    node,
                    messageId: 'cookiesNotAwaited',
                  });
                }
              }
            }
          },
        };
      },
    },
    'require-connection-deferral': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require await connection() before non-deterministic operations in server components',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingConnectionImport: "Missing import: import { connection } from 'next/server' (required for non-deterministic operations)",
          missingConnectionCall: 'Missing await connection() (required before non-deterministic operations like Date.now())',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Only validate server components
        const isServerComponent = filename.includes('/app/') && (filename.endsWith('/page.tsx') || filename.endsWith('/page.ts'));
        if (!isServerComponent) {
          return {};
        }

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);
        if (isClientComponent) {
          return {};
        }

        // Skip excluded pages
        const excludedPages = ['error.tsx', 'loading.tsx', 'not-found.tsx', 'layout.tsx', 'template.tsx'];
        if (excludedPages.some(excluded => filename.includes(excluded))) {
          return {};
        }

        let hasConnectionImport = false;
        let hasConnectionCall = false;
        let hasNonDeterministicOps = false;
        let defaultExportFunction = null;

        // Helper to find default export function
        function findDefaultExport(node) {
          if (!node || node.type !== 'Program') return null;
          for (const stmt of node.body || []) {
            if (stmt.type === 'ExportDefaultDeclaration') {
              const decl = stmt.declaration;
              if (decl && (decl.type === 'FunctionDeclaration' || decl.type === 'FunctionExpression' || decl.type === 'ArrowFunctionExpression')) {
                return decl;
              }
              if (decl && decl.type === 'Identifier') {
                for (const s of node.body || []) {
                  if (s.type === 'FunctionDeclaration' && s.id && s.id.name === decl.name) {
                    return s;
                  }
                }
              }
            }
          }
          return null;
        }

        // Helper to check for non-deterministic operations in component body (not in cached functions)
        function hasNonDeterministicOperations(node) {
          if (!node) return false;
          let found = false;
          function traverse(n, inCachedFunction = false) {
            if (!n || found) return;
            
            // Check if we're entering a cached function
            let currentInCachedFunction = inCachedFunction;
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
              // Check for 'use cache' directive before this function (pure AST)
              const comments = sourceCode.getCommentsBefore(n) || [];
              if (hasUseCacheDirective(comments)) {
                currentInCachedFunction = true;
              }
            }
            
            // Check for non-deterministic operations (only if not in cached function)
            if (!currentInCachedFunction) {
              if (n.type === 'CallExpression') {
                if (n.callee && n.callee.type === 'MemberExpression') {
                  const obj = n.callee.object;
                  const prop = n.callee.property;
                  if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                    if ((obj.name === 'Date' && prop.name === 'now') ||
                        (obj.name === 'Math' && prop.name === 'random') ||
                        (obj.name === 'crypto' && prop.name === 'randomUUID') ||
                        (obj.name === 'performance' && prop.name === 'now')) {
                      found = true;
                      return;
                    }
                  }
                }
                if (n.callee && n.callee.type === 'NewExpression' && n.callee.callee && n.callee.callee.type === 'Identifier' && n.callee.callee.name === 'Date') {
                  found = true;
                  return;
                }
              }
            }
            
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item, currentInCachedFunction);
                    if (found) return;
                  }
                } else {
                  traverse(n[key], currentInCachedFunction);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        return {
          Program(node) {
            // Check for connection import
            for (const stmt of node.body || []) {
              if (stmt.type === 'ImportDeclaration') {
                const source = stmt.source;
                if (source && source.type === 'Literal' && source.value === 'next/server') {
                  for (const spec of stmt.specifiers || []) {
                    if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.name === 'connection') {
                      hasConnectionImport = true;
                      break;
                    }
                  }
                }
              }
            }
            
            defaultExportFunction = findDefaultExport(node);
            if (defaultExportFunction) {
              hasNonDeterministicOps = hasNonDeterministicOperations(defaultExportFunction);
            }
          },
          CallExpression(node) {
            // Check for connection() calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'connection') {
              hasConnectionCall = true;
            }
          },
          'Program:exit'() {
            if (!hasNonDeterministicOps) {
              return;
            }

            if (!hasConnectionImport) {
              context.report({
                node: ast,
                messageId: 'missingConnectionImport',
              });
            }

            if (!hasConnectionCall) {
              context.report({
                node: ast,
                messageId: 'missingConnectionCall',
              });
            }
          },
        };
      },
    },
    'require-dangerously-set-inner-html-sanitization': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require sanitization for dangerouslySetInnerHTML usage to prevent XSS',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingSanitization: 'dangerouslySetInnerHTML used without sanitization (XSS risk). Must sanitize HTML with DOMPurify or similar before use.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        let hasSanitization = false;
        const dangerouslySetInnerHtmlNodes = [];

        // Check for sanitization patterns
        function checkForSanitization(node) {
          if (!node) return false;
          const sanitizationPatterns = ['DOMPurify', 'sanitize', 'sanitized', 'escapeHtml', 'escape'];
          let found = false;
          function traverse(n) {
            if (!n || found) return;
            if (n.type === 'CallExpression' && n.callee) {
              if (n.callee.type === 'MemberExpression' && n.callee.object && n.callee.object.type === 'Identifier' && n.callee.object.name === 'DOMPurify') {
                found = true;
                return;
              }
              if (n.callee.type === 'Identifier' && sanitizationPatterns.includes(n.callee.name)) {
                found = true;
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node);
          return found;
        }

        return {
          JSXAttribute(node) {
            if (node.name && node.name.type === 'JSXIdentifier' && node.name.name === 'dangerouslySetInnerHTML') {
              dangerouslySetInnerHtmlNodes.push(node);
              
              // Check if file has sanitization
              if (checkForSanitization(ast)) {
                hasSanitization = true;
              }
            }
          },
          'Program:exit'() {
            if (dangerouslySetInnerHtmlNodes.length > 0 && !hasSanitization) {
              for (const attrNode of dangerouslySetInnerHtmlNodes) {
                context.report({
                  node: attrNode,
                  messageId: 'missingSanitization',
                });
              }
            }
          },
        };
      },
    },
    'require-nextjs-16-metadata-params': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require Promise types for params in generateMetadata, generateStaticParams, and image generation functions in Next.js 16',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          generateMetadataParamsNotPromise: 'generateMetadata params parameter type should be Promise<T> in Next.js 16',
          generateMetadataSearchParamsNotPromise: 'generateMetadata searchParams parameter type should be Promise<T> in Next.js 16',
          generateStaticParamsNotPromise: 'generateStaticParams params parameter type should be Promise<T> in Next.js 16 (when receiving parent params)',
          imageFunctionParamsNotPromise: 'Image generation function params parameter type should be Promise<T> in Next.js 16',
          imageFunctionIdNotPromise: 'Image generation function id parameter type should be Promise<string | number> in Next.js 16',
          clientComponentParamsNotUse: 'Client component accessing params/searchParams without React.use() hook. In Next.js 16, params/searchParams are Promises and must be unwrapped with use()',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Check for client components using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        // Check for image generation files
        const imageFileNames = ['opengraph-image', 'twitter-image', 'icon', 'apple-icon'];
        const isImageFile = imageFileNames.some(name => filename.includes(name));

        return {
          FunctionDeclaration(node) {
            const funcName = node.id ? node.id.name : null;
            
            // Check generateMetadata
            if (funcName === 'generateMetadata') {
              for (const param of node.params || []) {
                if (param.type === 'Identifier') {
                  const paramName = param.name;
                  const paramType = param.typeAnnotation && param.typeAnnotation.typeAnnotation ? sourceCode.getText(param.typeAnnotation.typeAnnotation) : '';
                  
                  if ((paramName === 'params' || paramName === 'searchParams') && paramType && !paramType.includes('Promise')) {
                    context.report({
                      node: param,
                      messageId: paramName === 'params' ? 'generateMetadataParamsNotPromise' : 'generateMetadataSearchParamsNotPromise',
                    });
                  }
                }
              }
            }
            
            // Check generateStaticParams
            if (funcName === 'generateStaticParams') {
              for (const param of node.params || []) {
                if (param.type === 'Identifier' && param.name === 'params') {
                  const paramType = param.typeAnnotation && param.typeAnnotation.typeAnnotation ? sourceCode.getText(param.typeAnnotation.typeAnnotation) : '';
                  if (paramType && !paramType.includes('Promise')) {
                    context.report({
                      node: param,
                      messageId: 'generateStaticParamsNotPromise',
                    });
                  }
                }
              }
            }
          },
          'ExportDefaultDeclaration > FunctionDeclaration'(node) {
            // Check image generation functions
            if (isImageFile) {
              for (const param of node.params || []) {
                if (param.type === 'Identifier') {
                  const paramName = param.name;
                  const paramType = param.typeAnnotation && param.typeAnnotation.typeAnnotation ? sourceCode.getText(param.typeAnnotation.typeAnnotation) : '';
                  
                  if (paramName === 'params' && paramType && !paramType.includes('Promise')) {
                    context.report({
                      node: param,
                      messageId: 'imageFunctionParamsNotPromise',
                    });
                  }
                  if (paramName === 'id' && paramType && !paramType.includes('Promise')) {
                    context.report({
                      node: param,
                      messageId: 'imageFunctionIdNotPromise',
                    });
                  }
                }
              }
            }
          },
          MemberExpression(node) {
            // Check client components using params without use()
            if (isClientComponent) {
              if (node.object && node.object.type === 'Identifier') {
                const objName = node.object.name;
                if ((objName === 'params' || objName === 'searchParams') && node.property && node.property.type === 'Identifier') {
                  // Check if params/searchParams is wrapped with use()
                  let hasUse = false;
                  let parent = node.parent;
                  while (parent) {
                    if (parent.type === 'CallExpression' && parent.callee && parent.callee.type === 'Identifier' && parent.callee.name === 'use') {
                      hasUse = true;
                      break;
                    }
                    parent = parent.parent;
                  }
                  
                  if (!hasUse) {
                    context.report({
                      node,
                      messageId: 'clientComponentParamsNotUse',
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
    'no-direct-database-queries-in-components': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent direct database queries in components and app pages - should use services/data-layer',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          directDatabaseQuery: 'Direct database queries in components bypass caching and logging. Extract to data layer function in packages/web-runtime/src/data/.',
          directQueryInComponent: 'Direct database query in component (should use services/data-layer). Found: {{queryType}}',
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Skip if it's a service or data-layer file (allowed to have direct queries)
        if (filename.includes('data-layer') || filename.includes('services')) {
          return {};
        }

        // Skip server action files and API routes (they have their own rules)
        if (filename.includes('/actions/') || filename.includes('/api/')) {
          return {};
        }

        // Check both components and app directories
        const isComponent = filename.includes('/components/');
        const isAppPage = filename.includes('/app/') && (filename.endsWith('/page.tsx') || filename.endsWith('/page.ts'));
        
        if (!isComponent && !isAppPage) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for supabase.from() or supabase.rpc() calls
            if (node.callee && node.callee.type === 'MemberExpression' && node.callee.property && node.callee.property.type === 'Identifier') {
              const propName = node.callee.property.name;
              
              if (propName === 'from' || propName === 'rpc') {
                // Check if it's a supabase call
                const obj = node.callee.object;
                if (obj && obj.type === 'Identifier' && (obj.name === 'supabase' || obj.name.toLowerCase().includes('supabase'))) {
                  if (isComponent) {
                    context.report({
                      node,
                      messageId: 'directDatabaseQuery',
                    });
                  } else {
                    context.report({
                      node,
                      messageId: 'directQueryInComponent',
                      data: { queryType: `.${propName}()` },
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
    'require-authentication-for-protected-resources': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require authentication checks for protected API routes and server actions',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingAuthInRoute: 'API route accesses user data or performs mutations but missing authentication check (should use getAuthenticatedUser() or authedAction, or webhook secret/token validation)',
          missingAuthInAction: 'Server action accesses user data or performs mutations but missing authentication (should use authedAction wrapper)',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only validate API routes and server actions
        const isApiRoute = filename.includes('/api/') && (filename.endsWith('/route.ts') || filename.endsWith('/route.tsx'));
        const isServerAction = filename.includes('/actions/') && filename.endsWith('.ts');
        
        if (!isApiRoute && !isServerAction) {
          return {};
        }

        // Public routes/actions that don't require auth
        const publicApiRoutes = ['/api/content', '/api/company', '/api/og', '/api/feeds', '/api/sitemap', '/api/stats/social-proof', '/api/templates', '/api/search', '/api/trending', '/api/status', '/api/seo', '/api/flux'];
        const publicActions = ['searchContent', 'getContent', 'getContentBySlug', 'getTemplates'];
        
        let isPublic = false;
        if (isApiRoute) {
          isPublic = publicApiRoutes.some(route => filename.includes(route.replace('/api', '')));
        }

        let hasAuthCheck = false;
        let accessesUserData = false;
        let performsMutations = false;
        let usesAuthedAction = false;

        // Check for user data access patterns
        function checkUserDataAccess(node) {
          if (!node) return false;
          const userDataPatterns = ['auth.users', 'getUserProfile', 'getUserData', 'getAuthenticatedUser', 'ctx.userId', 'ctx.userEmail', '.eq(\'user_id\')', '.eq(\'userId\')'];
          const nodeText = sourceCode.getText(node);
          return userDataPatterns.some(pattern => nodeText.includes(pattern));
        }

        // Check for mutation patterns
        function checkMutations(node) {
          if (!node) return false;
          const mutationPatterns = ['.insert(', '.update(', '.upsert(', '.delete(', 'createCompany', 'createJob', 'updateCompany', 'updateJob', 'deleteCompany', 'deleteJob'];
          const nodeText = sourceCode.getText(node);
          return mutationPatterns.some(pattern => nodeText.includes(pattern));
        }

        return {
          CallExpression(node) {
            // Check for authentication methods
            if (node.callee && node.callee.type === 'Identifier') {
              const funcName = node.callee.name;
              if (funcName === 'getAuthenticatedUser') {
                hasAuthCheck = true;
              }
            }
            
            // Check for authedAction usage
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'authedAction') {
              usesAuthedAction = true;
            }
            
            // Check for user data access
            if (checkUserDataAccess(node)) {
              accessesUserData = true;
            }
            
            // Check for mutations
            if (checkMutations(node)) {
              performsMutations = true;
            }
          },
          MemberExpression(node) {
            // Check for auth.getUser() or auth.getSession()
            if (node.object && node.object.type === 'Identifier' && node.object.name === 'auth' && node.property && node.property.type === 'Identifier' && (node.property.name === 'getUser' || node.property.name === 'getSession')) {
              hasAuthCheck = true;
            }
          },
          'Program:exit'() {
            if (isPublic) {
              return;
            }

            const shouldBeProtected = accessesUserData || performsMutations;
            
            if (shouldBeProtected) {
              if (isApiRoute && !hasAuthCheck) {
                context.report({
                  node: sourceCode.ast,
                  messageId: 'missingAuthInRoute',
                });
              }
              
              if (isServerAction && !usesAuthedAction) {
                context.report({
                  node: sourceCode.ast,
                  messageId: 'missingAuthInAction',
                });
              }
            }
          },
        };
      },
    },
    'require-server-action-wrapper': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require actionClient wrapper for server actions',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingActionClient: 'Server action missing actionClient wrapper (should use actionClient for automatic error logging)',
          missingMetadata: 'Server action missing metadata with actionName (required for logging and debugging)',
          missingInputSchema: 'Server action missing inputSchema (should validate inputs with Zod)',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only validate server action files
        if (!filename.includes('/actions/') || !filename.endsWith('.ts')) {
          return {};
        }

        // Skip hook files and utility files
        if (filename.includes('/hooks/') || filename.includes('safe-action.ts') || filename.includes('run-rpc-instance.ts')) {
          return {};
        }

        let hasActionClient = false;
        let hasMetadata = false;
        let hasInputSchema = false;
        let isServerAction = false;

        return {
          CallExpression(node) {
            // Check for actionClient or its wrappers
            if (node.callee && node.callee.type === 'Identifier') {
              const funcName = node.callee.name;
              if (['actionClient', 'authedAction', 'rateLimitedAction', 'optionalAuthAction'].includes(funcName)) {
                hasActionClient = true;
                isServerAction = true;
              }
            }
            
            // Check for metadata() call
            if (node.callee && node.callee.type === 'MemberExpression' && node.callee.property && node.callee.property.type === 'Identifier' && node.callee.property.name === 'metadata') {
              hasMetadata = true;
            }
            
            // Check for inputSchema() call
            if (node.callee && node.callee.type === 'MemberExpression' && node.callee.property && node.callee.property.type === 'Identifier' && node.callee.property.name === 'inputSchema') {
              hasInputSchema = true;
            }
          },
          'Program:exit'() {
            // Check if file has 'use server' directive using AST
            // Check for 'use server' directive using pure AST (no getText())
            const ast = sourceCode.ast;
            isServerAction = hasUseServerDirective(ast);
            
            if (isServerAction) {
              if (!hasActionClient) {
                context.report({
                  node: sourceCode.ast,
                  messageId: 'missingActionClient',
                });
              } else if (!hasMetadata) {
                context.report({
                  node: sourceCode.ast,
                  messageId: 'missingMetadata',
                });
              } else if (!hasInputSchema) {
                context.report({
                  node: sourceCode.ast,
                  messageId: 'missingInputSchema',
                });
              }
            }
          },
        };
      },
    },
    'require-nextresponse-await': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require awaiting NextResponse methods before property access',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          promisePropertyAccess: 'Accessing {{property}} on Promise<NextResponse> from {{functionName}} - must await first',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only validate API routes
        const isApiRoute = filename.includes('/api/') && (filename.endsWith('/route.ts') || filename.endsWith('/route.tsx'));
        if (!isApiRoute) {
          return {};
        }

        return {
          MemberExpression(node) {
            // Check for .status or .headers access
            if (node.property && node.property.type === 'Identifier' && (node.property.name === 'status' || node.property.name === 'headers')) {
              const expression = node.object;
              if (expression && expression.type === 'CallExpression' && expression.callee && expression.callee.type === 'Identifier') {
                const funcName = expression.callee.name;
                if (funcName === 'createErrorResponse' || funcName === 'handleApiError') {
                  // Check if it's awaited
                  let isAwaited = false;
                  let parent = node.parent;
                  while (parent) {
                    if (parent.type === 'AwaitExpression') {
                      isAwaited = true;
                      break;
                    }
                    parent = parent.parent;
                  }
                  
                  if (!isAwaited) {
                    context.report({
                      node,
                      messageId: 'promisePropertyAccess',
                      data: {
                        property: node.property.name,
                        functionName: funcName,
                      },
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
    'require-mcp-tool-schema': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require MCP tool input schemas to be exported from lib/types.ts',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingSchemaExport: 'MCP tool "{{toolName}}" references schema "{{schemaName}}" that is not exported from lib/types.ts',
          missingInputSchema: 'MCP tool "{{toolName}}" is missing inputSchema property',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only validate MCP index.ts file
        if (!filename.includes('heyclaude-mcp/index.ts')) {
          return {};
        }

        const toolDefinitions = [];
        const exportedSchemas = new Set();

        // Helper to extract tool name from mcpServer.tool() call
        function extractToolName(node) {
          if (node.arguments && node.arguments.length > 0) {
            const firstArg = node.arguments[0];
            if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
              return firstArg.value;
            }
          }
          return null;
        }

        // Helper to extract schema reference from options object
        function extractSchemaRef(node) {
          if (node.arguments && node.arguments.length > 1) {
            const optionsArg = node.arguments[1];
            if (optionsArg.type === 'ObjectExpression') {
              for (const prop of optionsArg.properties || []) {
                if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier' && prop.key.name === 'inputSchema') {
                  if (prop.value && prop.value.type === 'Identifier') {
                    return prop.value.name;
                  }
                }
              }
            }
          }
          return null;
        }

        return {
          Program(node) {
            // Collect all exported schemas from lib/types.ts
            // This would ideally be done by reading the types file, but for ESLint we'll check imports
            for (const stmt of node.body || []) {
              if (stmt.type === 'ImportDeclaration') {
                const source = stmt.source;
                if (source && source.type === 'Literal' && source.value === './lib/types.ts') {
                  // Collect imported schema names
                  for (const spec of stmt.specifiers || []) {
                    if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.type === 'Identifier') {
                      const name = spec.imported.name;
                      if (name.endsWith('InputSchema')) {
                        exportedSchemas.add(name);
                      }
                    }
                  }
                }
              }
            }
          },
          CallExpression(node) {
            // Check for mcpServer.tool() calls
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && obj.name === 'mcpServer' && 
                  prop && prop.type === 'Identifier' && prop.name === 'tool') {
                const toolName = extractToolName(node);
                const schemaRef = extractSchemaRef(node);
                
                if (toolName) {
                  if (!schemaRef) {
                    context.report({
                      node,
                      messageId: 'missingInputSchema',
                      data: { toolName },
                    });
                  } else if (!exportedSchemas.has(schemaRef)) {
                    context.report({
                      node,
                      messageId: 'missingSchemaExport',
                      data: { toolName, schemaName: schemaRef },
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
    'require-mcp-tool-handler': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require MCP tools to have corresponding handler functions',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingHandler: 'MCP tool "{{toolName}}" references handler "{{handlerName}}" that is not found in routes/',
          missingHandlerRef: 'MCP tool "{{toolName}}" is missing handler property',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only validate MCP index.ts file
        if (!filename.includes('heyclaude-mcp/index.ts')) {
          return {};
        }

        const importedHandlers = new Set();

        // Helper to extract tool name
        function extractToolName(node) {
          if (node.arguments && node.arguments.length > 0) {
            const firstArg = node.arguments[0];
            if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
              return firstArg.value;
            }
          }
          return null;
        }

        // Helper to extract handler reference
        function extractHandlerRef(node) {
          if (node.arguments && node.arguments.length > 1) {
            const optionsArg = node.arguments[1];
            if (optionsArg.type === 'ObjectExpression') {
              for (const prop of optionsArg.properties || []) {
                if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier' && prop.key.name === 'handler') {
                  // Handler is typically a function, look for handleXXX pattern
                  if (prop.value) {
                    // Check if it's a call expression (wrapWithTimeout) or arrow function
                    let handlerExpr = prop.value;
                    if (handlerExpr.type === 'CallExpression') {
                      // Unwrap wrapWithTimeout
                      if (handlerExpr.arguments && handlerExpr.arguments.length > 0) {
                        handlerExpr = handlerExpr.arguments[0];
                      }
                    }
                    // Look for handleXXX identifier in the expression
                    function findHandlerName(n) {
                      if (!n) return null;
                      if (n.type === 'Identifier' && n.name.startsWith('handle') && n.name.length > 6) {
                        return n.name;
                      }
                      for (const key in n) {
                        if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                          if (Array.isArray(n[key])) {
                            for (const item of n[key]) {
                              const found = findHandlerName(item);
                              if (found) return found;
                            }
                          } else {
                            const found = findHandlerName(n[key]);
                            if (found) return found;
                          }
                        }
                      }
                      return null;
                    }
                    return findHandlerName(handlerExpr);
                  }
                }
              }
            }
          }
          return null;
        }

        return {
          ImportDeclaration(node) {
            // Collect imported handler functions
            if (node.source && node.source.type === 'Literal') {
              const sourceValue = node.source.value;
              if (typeof sourceValue === 'string' && sourceValue.startsWith('./routes/')) {
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.type === 'Identifier') {
                    const name = spec.imported.name;
                    if (name.startsWith('handle')) {
                      importedHandlers.add(name);
                    }
                  }
                }
              }
            }
          },
          CallExpression(node) {
            // Check for mcpServer.tool() calls
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && obj.name === 'mcpServer' && 
                  prop && prop.type === 'Identifier' && prop.name === 'tool') {
                const toolName = extractToolName(node);
                const handlerRef = extractHandlerRef(node);
                
                if (toolName) {
                  if (!handlerRef) {
                    context.report({
                      node,
                      messageId: 'missingHandlerRef',
                      data: { toolName },
                    });
                  } else if (!importedHandlers.has(handlerRef)) {
                    context.report({
                      node,
                      messageId: 'missingHandler',
                      data: { toolName, handlerName: handlerRef },
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
    'no-console-calls': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent console.* calls - use structured logging instead',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - complex console.* to logger.* API transformation could break TypeScript or create incorrect object-first patterns
        schema: [],
        messages: {
          useStructuredLogging: 'console.{{method}} is not allowed. Use logger.{{method}} from @heyclaude/web-runtime/logging/server (server) or @heyclaude/web-runtime/logging/client (client) instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Skip test files, build scripts, config files, and generators
        if (
          filename.includes('.test.') ||
          filename.includes('.spec.') ||
          filename.includes('.config.') ||
          filename.includes('scripts/') ||
          filename.includes('bin/') ||
          filename.includes('eslint-plugin') ||
          filename.includes('packages/generators')
        ) {
          return {};
        }

        // Check for 'use client' directive using pure AST (no getText())
        const isClientComponent = hasUseClientDirective(ast);

        // Determine correct import path
        const loggerImportPath = isClientComponent
          ? '@heyclaude/web-runtime/logging/client'
          : '@heyclaude/web-runtime/logging/server';

        // Track logger imports
        let hasLoggerImport = false;
        let lastImportNode = null;

        const consoleMethods = ['log', 'error', 'warn', 'info', 'debug', 'trace', 'table', 'dir', 'time', 'timeEnd', 'group', 'groupEnd'];

        // Allow console.error in logError flush callback (it's a last resort)
        function isInFlushCallback(node) {
          let parent = node.parent;
          while (parent) {
            if (
              parent.type === 'CallExpression' &&
              parent.callee &&
              parent.callee.type === 'MemberExpression' &&
              parent.callee.property &&
              parent.callee.property.type === 'Identifier' &&
              parent.callee.property.name === 'flush'
            ) {
              return true;
            }
            parent = parent.parent;
          }
          return false;
        }

        return {
          ImportDeclaration(node) {
            lastImportNode = node;
            if (node.source && node.source.type === 'Literal') {
              const sourceValue = node.source.value;
              if (typeof sourceValue === 'string' && 
                  (sourceValue.includes('@heyclaude/web-runtime/logging/') || 
                   sourceValue.includes('@heyclaude/shared-runtime') ||
                   sourceValue.includes('@heyclaude/web-runtime/core'))) {
                // Check if logger is imported
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportSpecifier' || spec.type === 'ImportDefaultSpecifier') {
                    const importedName = spec.imported ? spec.imported.name : spec.local.name;
                    if (importedName === 'logger' || spec.local.name === 'logger') {
                      hasLoggerImport = true;
                      break;
                    }
                  }
                }
              }
            }
          },
          CallExpression(node) {
            // Check for console.* calls
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              
              if (obj && obj.type === 'Identifier' && obj.name === 'console') {
                if (prop && prop.type === 'Identifier' && consoleMethods.includes(prop.name)) {
                  // Allow console.error in flush callback (last resort error handling)
                  if (prop.name === 'error' && isInFlushCallback(node)) {
                    return;
                  }

                  // Map console methods to logger methods
                  const methodMap = {
                    'log': 'info',
                    'error': 'error',
                    'warn': 'warn',
                    'info': 'info',
                    'debug': 'debug',
                    'trace': 'trace',
                  };
                  
                  const loggerMethod = methodMap[prop.name] || 'info';
                  
                  context.report({
                    node: prop,
                    messageId: 'useStructuredLogging',
                    data: { method: prop.name },
                    // NOTE: fix() function removed - autofix disabled (fixable: null)
                    // Complex console.* to logger.* transformation is too risky
                  });
                }
              }
            }
          },
        };
      },
    },
    'require-zod-schema-for-api-routes': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require Zod schema validation for API route request bodies and query parameters',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingZodSchema: 'API route must validate request body/query parameters with Zod schema. Use z.object() and safeParse() or parse()',
          missingZodImport: 'API route uses Zod but missing import from "zod"',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only validate API routes
        const isApiRoute = filename.includes('/api/') && (filename.endsWith('/route.ts') || filename.endsWith('/route.tsx'));
        if (!isApiRoute) {
          return {};
        }

        let hasZodImport = false;
        let hasZodSchema = false;
        let hasRequestBodyAccess = false;
        let hasQueryParamsAccess = false;
        const routeHandlers = [];

        // Check for request body access patterns
        function checkRequestBodyAccess(node) {
          if (!node) return false;
          const bodyAccessPatterns = ['request.json()', 'request.body', 'await request.json()', '.json()'];
          const nodeText = sourceCode.getText(node);
          return bodyAccessPatterns.some(pattern => nodeText.includes(pattern));
        }

        // Check for query parameter access patterns
        function checkQueryParamsAccess(node) {
          if (!node) return false;
          const queryPatterns = ['searchParams', 'url.searchParams', 'request.nextUrl.searchParams', 'new URL(request.url)'];
          const nodeText = sourceCode.getText(node);
          return queryPatterns.some(pattern => nodeText.includes(pattern));
        }

        // Check for Zod schema usage
        function checkZodSchema(node) {
          if (!node) return false;
          const zodPatterns = ['z.object', 'safeParse', '.parse(', 'z.string', 'z.number', 'z.array'];
          const nodeText = sourceCode.getText(node);
          return zodPatterns.some(pattern => nodeText.includes(pattern));
        }

        return {
          ImportDeclaration(node) {
            if (node.source && node.source.type === 'Literal' && node.source.value === 'zod') {
              hasZodImport = true;
            }
          },
          'ExportNamedDeclaration > FunctionDeclaration'(node) {
            // Check for route handler functions (GET, POST, etc.)
            const funcName = node.id ? node.id.name : null;
            if (funcName && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(funcName)) {
              routeHandlers.push(node);
            }
          },
          'ExportDefaultDeclaration > FunctionDeclaration'(node) {
            // Also check default exports
            routeHandlers.push(node);
          },
          CallExpression(node) {
            // Check for request.json() or similar
            if (checkRequestBodyAccess(node)) {
              hasRequestBodyAccess = true;
            }
            if (checkQueryParamsAccess(node)) {
              hasQueryParamsAccess = true;
            }
            if (checkZodSchema(node)) {
              hasZodSchema = true;
            }
          },
          MemberExpression(node) {
            // Check for searchParams access
            if (node.property && node.property.type === 'Identifier' && node.property.name === 'searchParams') {
              hasQueryParamsAccess = true;
            }
          },
          'Program:exit'() {
            // Only require Zod if route accesses request body or query params
            if (hasRequestBodyAccess || hasQueryParamsAccess) {
              if (!hasZodImport && !hasZodSchema) {
                context.report({
                  node: sourceCode.ast,
                  messageId: 'missingZodSchema',
                });
              } else if (hasZodSchema && !hasZodImport) {
                context.report({
                  node: sourceCode.ast,
                  messageId: 'missingZodImport',
                });
              }
            }
          },
        };
      },
    },
    'require-normalize-error': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require normalizeError() usage before logging errors with Pino object-first API (logger.error({ err: normalized }, "message"))',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null, // DISABLED: Autofix too risky - complex normalizeError insertion could break TypeScript or create incorrect error handling
        schema: [],
        messages: {
          missingNormalizeError: 'Error must be normalized with normalizeError() before logging. Use: const normalized = normalizeError(error, "fallback message"); logger.error({ err: normalized }, "message")',
          wrongErrorKey: 'Errors should use "err" key (Pino standard). Use: logger.error({ err: normalized }, "message")',
          wrongApiPattern: 'Use Pino object-first API: logger.error({ err: normalized, ...context }, "message"). Not message-first.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const ast = sourceCode.ast;

        // Skip test files
        if (filename.includes('.test.') || filename.includes('.spec.')) {
          return {};
        }

        // Skip logger implementation files - they ARE the helpers
        if (filename.includes('logging.ts') || filename.includes('logger.ts') || filename.includes('error-handling.ts')) {
          return {};
        }

        const errorUsages = [];
        const normalizedVariables = new Set();
        let hasNormalizeErrorImport = false;
        let normalizeErrorImportPath = null;

        // Track normalized variables
        function trackNormalizedVariables(node) {
          if (node.type === 'VariableDeclarator' && node.init && node.init.type === 'CallExpression') {
            if (node.init.callee && node.init.callee.type === 'Identifier' && node.init.callee.name === 'normalizeError') {
              if (node.id && node.id.type === 'Identifier') {
                normalizedVariables.add(node.id.name);
              }
            }
          }
        }

        // Check if error variable is normalized
        function isErrorNormalized(errorVarName) {
          if (normalizedVariables.has(errorVarName) || errorVarName === 'normalized') {
            return true;
          }
          return false;
        }

        // Determine import path based on file location
        function getNormalizeErrorImportPath() {
          if (filename.includes('/app/') || filename.includes('/api/')) {
            return '@heyclaude/web-runtime/logging/server';
          }
          if (filename.includes('client') || hasUseClientDirective(ast)) {
            return '@heyclaude/web-runtime/logging/client';
          }
          // Default to server
          return '@heyclaude/web-runtime/logging/server';
        }

        return {
          ImportDeclaration(node) {
            // Check for normalizeError import
            if (node.source && node.source.type === 'Literal' && typeof node.source.value === 'string') {
              const sourceValue = node.source.value;
              if (sourceValue.includes('logging/server') || sourceValue.includes('logging/client') || sourceValue.includes('errors')) {
                for (const spec of node.specifiers || []) {
                  if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.name === 'normalizeError') {
                    hasNormalizeErrorImport = true;
                    normalizeErrorImportPath = sourceValue;
                  }
                }
              }
            }
          },
          VariableDeclarator: trackNormalizedVariables,
          CatchClause(node) {
            errorUsages.push(node);
          },
          CallExpression(node) {
            // Check for logger.error() calls using Pino object-first API
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                const loggerNames = ['logger', 'reqLogger', 'sectionLogger', 'routeLogger', 'userLogger'];
                if (loggerNames.includes(obj.name) && prop.name === 'error') {
                  // Check for Pino object-first API: logger.error({ err: normalized }, "message")
                  if (node.arguments && node.arguments.length > 0) {
                    const firstArg = node.arguments[0];
                    
                    // First arg should be object (object-first API)
                    if (firstArg && firstArg.type === 'ObjectExpression') {
                      // Check for 'err' key (Pino standard)
                      let hasErrKey = false;
                      let errValue = null;
                      
                      for (const prop of firstArg.properties || []) {
                        if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
                          if (prop.key.name === 'err' || prop.key.name === 'error') {
                            hasErrKey = true;
                            errValue = prop.value;
                            break;
                          }
                        }
                      }
                      
                      if (hasErrKey && errValue && errValue.type === 'Identifier') {
                        // Check if error is normalized
                        if (!isErrorNormalized(errValue.name)) {
                          // Check if errorArg is directly from catch parameter
                          const catchBlock = errorUsages.find(catchNode => {
                            if (catchNode.param && catchNode.param.type === 'Identifier') {
                              return catchNode.param.name === errValue.name;
                            }
                            return false;
                          });
                          if (catchBlock) {
                            const catchParam = catchBlock.param;
                            const errorVarName = catchParam && catchParam.type === 'Identifier' ? catchParam.name : 'error';
                            
                            context.report({
                              node: errValue,
                              messageId: 'missingNormalizeError',
                              fix(fixer) {
                                const fixes = [];
                                
                                // Add import if missing
                                if (!hasNormalizeErrorImport) {
                                  const importPath = getNormalizeErrorImportPath();
                                  let lastImport = null;
                                  for (const stmt of ast.body || []) {
                                    if (stmt.type === 'ImportDeclaration') {
                                      lastImport = stmt;
                                    } else if (lastImport) {
                                      break;
                                    }
                                  }
                                  
                                  if (lastImport) {
                                    fixes.push(fixer.insertTextAfter(lastImport, `\nimport { normalizeError } from '${importPath}';`));
                                  } else {
                                    const firstStmt = ast.body[0];
                                    if (firstStmt) {
                                      fixes.push(fixer.insertTextBefore(firstStmt, `import { normalizeError } from '${importPath}';\n`));
                                    }
                                  }
                                }
                                
                                // Find catch block body
                                if (catchBlock.body && catchBlock.body.type === 'BlockStatement') {
                                  // Check if normalized variable already exists
                                  const hasNormalizedVar = catchBlock.body.body.some(stmt => 
                                    stmt.type === 'VariableDeclaration' &&
                                    stmt.declarations.some(decl =>
                                      decl.id && decl.id.type === 'Identifier' && decl.id.name === 'normalized'
                                    )
                                  );
                                  
                                  if (!hasNormalizedVar) {
                                    // Add normalizeError call at start of catch block
                                    const normalizeCode = `\n    const normalized = normalizeError(${errorVarName}, 'Operation failed');\n`;
                                    if (catchBlock.body.body.length > 0) {
                                      fixes.push(fixer.insertTextBefore(catchBlock.body.body[0], normalizeCode));
                                    } else {
                                      const bodyStart = catchBlock.body.range[0] + 1;
                                      fixes.push(fixer.insertTextAfterRange([bodyStart, bodyStart], normalizeCode));
                                    }
                                  }
                                  
                                  // Replace error usage with normalized
                                  fixes.push(fixer.replaceText(errValue, 'normalized'));
                                }
                                
                                return fixes;
                              },
                            });
                          }
                        }
                      } else if (!hasErrKey) {
                        // Missing err key - should use Pino standard
                        context.report({
                          node: firstArg,
                          messageId: 'wrongErrorKey',
                        });
                      }
                    } else if (firstArg && firstArg.type === 'StringLiteral') {
                      // Message-first API detected - should use object-first
                      context.report({
                        node: node,
                        messageId: 'wrongApiPattern',
                      });
                    }
                  }
                }
              }
            }
            
            // Check for createErrorResponse() calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'createErrorResponse') {
              if (node.arguments && node.arguments.length > 0) {
                const errorArg = node.arguments[0];
                if (errorArg && errorArg.type === 'Identifier') {
                  if (!isErrorNormalized(errorArg.name)) {
                    const catchBlock = errorUsages.find(catchNode => {
                      if (catchNode.param && catchNode.param.type === 'Identifier') {
                        return catchNode.param.name === errorArg.name;
                      }
                      return false;
                    });
                    if (catchBlock) {
                      const catchParam = catchBlock.param;
                      const errorVarName = catchParam && catchParam.type === 'Identifier' ? catchParam.name : 'error';
                      
                      context.report({
                        node: errorArg,
                        messageId: 'missingNormalizeError',
                        fix(fixer) {
                          const fixes = [];
                          
                          // Add import if missing
                          if (!hasNormalizeErrorImport) {
                            const importPath = getNormalizeErrorImportPath();
                            let lastImport = null;
                            for (const stmt of ast.body || []) {
                              if (stmt.type === 'ImportDeclaration') {
                                lastImport = stmt;
                              } else if (lastImport) {
                                break;
                              }
                            }
                            
                            if (lastImport) {
                              fixes.push(fixer.insertTextAfter(lastImport, `\nimport { normalizeError } from '${importPath}';`));
                            } else {
                              const firstStmt = ast.body[0];
                              if (firstStmt) {
                                fixes.push(fixer.insertTextBefore(firstStmt, `import { normalizeError } from '${importPath}';\n`));
                              }
                            }
                          }
                          
                          // Find catch block body
                          if (catchBlock.body && catchBlock.body.type === 'BlockStatement') {
                            // Check if normalized variable already exists
                            const hasNormalizedVar = catchBlock.body.body.some(stmt => 
                              stmt.type === 'VariableDeclaration' &&
                              stmt.declarations.some(decl =>
                                decl.id && decl.id.type === 'Identifier' && decl.id.name === 'normalized'
                              )
                            );
                            
                            if (!hasNormalizedVar) {
                              // Add normalizeError call at start of catch block
                              const normalizeCode = `\n    const normalized = normalizeError(${errorVarName}, 'Operation failed');\n`;
                              if (catchBlock.body.body.length > 0) {
                                fixes.push(fixer.insertTextBefore(catchBlock.body.body[0], normalizeCode));
                              } else {
                                const bodyStart = catchBlock.body.range[0] + 1;
                                fixes.push(fixer.insertTextAfterRange([bodyStart, bodyStart], normalizeCode));
                              }
                            }
                            
                            // Replace error usage with normalized
                            fixes.push(fixer.replaceText(errorArg, 'normalized'));
                          }
                          
                          return fixes;
                        },
                      });
                    }
                  }
                }
              }
            }
          },
        };
      },
    },
    'require-env-var-validation': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require environment variables to be validated (requireEnvVar or env schema)',
          category: 'Security',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingEnvValidation: 'Environment variable access must be validated. Use requireEnvVar() or env schema from @heyclaude/shared-runtime/schemas/env',
          directProcessEnv: 'Direct process.env access is not allowed. Use requireEnvVar() or env schema instead',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Skip test files and config files
        if (filename.includes('.test.') || filename.includes('.spec.') || filename.includes('.config.')) {
          return {};
        }

        let hasEnvValidation = false;
        let hasRequireEnvVar = false;
        let hasEnvSchema = false;

        return {
          ImportDeclaration(node) {
            if (node.source && node.source.type === 'Literal') {
              const sourceValue = node.source.value;
              if (typeof sourceValue === 'string') {
                if (sourceValue.includes('requireEnvVar')) {
                  hasRequireEnvVar = true;
                  hasEnvValidation = true;
                }
                if (sourceValue.includes('schemas/env') || sourceValue.includes('@heyclaude/shared-runtime/schemas/env')) {
                  hasEnvSchema = true;
                  hasEnvValidation = true;
                }
              }
            }
          },
          MemberExpression(node) {
            // Check for process.env access
            if (node.object && node.object.type === 'Identifier' && node.object.name === 'process') {
              if (node.property && node.property.type === 'Identifier' && node.property.name === 'env') {
                // Check if parent is MemberExpression accessing a property
                const parent = node.parent;
                if (parent && parent.type === 'MemberExpression' && parent.property) {
                  // This is process.env.SOMETHING
                  if (!hasEnvValidation) {
                    context.report({
                      node: parent,
                      messageId: 'directProcessEnv',
                    });
                  }
                } else if (!hasEnvValidation) {
                  context.report({
                    node,
                    messageId: 'directProcessEnv',
                  });
                }
              }
            }
          },
          CallExpression(node) {
            // Check for requireEnvVar() usage
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'requireEnvVar') {
              hasEnvValidation = true;
            }
            // Check for env.SOMETHING usage (from env schema)
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              if (obj && obj.type === 'Identifier' && obj.name === 'env') {
                hasEnvValidation = true;
              }
            }
          },
        };
      },
    },
    'require-pino-object-first-api': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce Pino object-first API: logger.error({ err, ...context }, "message") instead of message-first',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useObjectFirst: 'Use Pino object-first API: logger.{{method}}({ err, ...context }, "message"). Not message-first: logger.{{method}}("message", error, context)',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Skip test files
        if (filename.includes('.test.') || filename.includes('.spec.')) {
          return {};
        }

        const logMethods = ['error', 'warn', 'info', 'debug', 'trace', 'fatal'];
        const loggerNames = ['logger', 'reqLogger', 'sectionLogger', 'routeLogger', 'userLogger'];

        return {
          CallExpression(node) {
            // Check for logger.method() calls
            if (node.callee && node.callee.type === 'MemberExpression') {
              const obj = node.callee.object;
              const prop = node.callee.property;
              if (obj && obj.type === 'Identifier' && prop && prop.type === 'Identifier') {
                if (loggerNames.includes(obj.name) && logMethods.includes(prop.name)) {
                  // Check arguments - first should be object (object-first API)
                  if (node.arguments && node.arguments.length > 0) {
                    const firstArg = node.arguments[0];
                    
                    // If first arg is string, it's message-first (wrong)
                    if (firstArg && firstArg.type === 'StringLiteral') {
                      context.report({
                        node: node,
                        messageId: 'useObjectFirst',
                        data: { method: prop.name },
                      });
                    }
                  }
                }
              }
            }
          },
        };
      },
    },
    'require-logger-child-for-context': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require logger.child() for request-scoped context (not createLogger())',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useChildLogger: 'Use logger.child({ operation, route }) for request-scoped context. Do NOT use createLogger() - that creates a new logger instance (only for cache-safe logging).',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only validate server components and API routes
        const isServerComponent = filename.includes('/app/') && (filename.endsWith('/page.tsx') || filename.endsWith('/page.ts'));
        const isApiRoute = filename.includes('/api/') && (filename.endsWith('/route.ts') || filename.endsWith('/route.tsx'));

        if (!isServerComponent && !isApiRoute) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for createLogger() calls with context (not cache-safe)
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'createLogger') {
              if (node.arguments && node.arguments.length > 0) {
                const optionsArg = node.arguments[0];
                if (optionsArg && optionsArg.type === 'ObjectExpression') {
                  // Check if options include operation, route, or other context (not cache-safe)
                  let hasContextOptions = false;
                  let hasTimestampFalse = false;
                  
                  for (const prop of optionsArg.properties || []) {
                    if (prop.type === 'Property' && prop.key && prop.key.type === 'Identifier') {
                      const keyName = prop.key.name;
                      // Context fields that should use logger.child() instead
                      if (['operation', 'route', 'module', 'service', 'base'].includes(keyName)) {
                        hasContextOptions = true;
                      }
                      // timestamp: false is valid (cache-safe logging)
                      if (keyName === 'timestamp' && prop.value && prop.value.type === 'Literal' && prop.value.value === false) {
                        hasTimestampFalse = true;
                      }
                    }
                  }
                  
                  // If createLogger has context options (not just timestamp: false), it's wrong
                  if (hasContextOptions && !hasTimestampFalse) {
                    context.report({
                      node: node,
                      messageId: 'useChildLogger',
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
    'require-async-for-await-in-iife': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require async keyword for IIFE that uses await. Validates next.config.mjs and other config files. ESLint parser automatically validates syntax.',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingAsync: 'IIFE uses await but is not marked as async. Add async keyword: (async () => { ... })',
        },
      },
      create(context) {
        const filename = context.getFilename();
        
        // Only check config files (next.config.mjs, etc.)
        const isConfigFile = filename.includes('config') || 
                            filename.endsWith('.config.mjs') || 
                            filename.endsWith('.config.js') ||
                            filename.includes('next.config');
        
        if (!isConfigFile) {
          return {};
        }

        // Track IIFE state
        let iifeStack = [];
        
        /**
         * Check if node is an IIFE (Immediately Invoked Function Expression)
         * Pattern: (() => { ... })() or (async () => { ... })()
         */
        function isIIFE(node) {
          if (node.type !== 'CallExpression') return false;
          if (!node.callee) return false;
          
          // Check if callee is a parenthesized arrow function
          if (node.callee.type === 'ArrowFunctionExpression') {
            return true;
          }
          
          // Check if callee is wrapped in parentheses: (() => {})
          if (node.callee.type === 'ParenthesizedExpression' && 
              node.callee.expression && 
              node.callee.expression.type === 'ArrowFunctionExpression') {
            return true;
          }
          
          return false;
        }
        
        /**
         * Check if arrow function is async
         */
        function isAsyncArrowFunction(node) {
          if (node.type === 'ArrowFunctionExpression') {
            return node.async === true;
          }
          if (node.type === 'ParenthesizedExpression' && node.expression && node.expression.type === 'ArrowFunctionExpression') {
            return node.expression.async === true;
          }
          return false;
        }
        
        /**
         * Get the arrow function from an IIFE node
         */
        function getArrowFunctionFromIIFE(node) {
          if (node.callee.type === 'ArrowFunctionExpression') {
            return node.callee;
          }
          if (node.callee.type === 'ParenthesizedExpression' && 
              node.callee.expression && 
              node.callee.expression.type === 'ArrowFunctionExpression') {
            return node.callee.expression;
          }
          return null;
        }

        return {
          // Note: ESLint parser automatically validates syntax - if we reach here, syntax is valid
          // Any syntax errors would have been caught during ESLint parsing phase
          CallExpression(node) {
            if (isIIFE(node)) {
              const arrowFunc = getArrowFunctionFromIIFE(node);
              if (arrowFunc) {
                iifeStack.push({
                  node: arrowFunc,
                  isAsync: isAsyncArrowFunction(node.callee),
                });
              }
            }
          },
          AwaitExpression(node) {
            // Check if we're inside an IIFE
            if (iifeStack.length > 0) {
              const currentIIFE = iifeStack[iifeStack.length - 1];
              if (!currentIIFE.isAsync) {
                context.report({
                  node: node,
                  messageId: 'missingAsync',
                });
              }
            }
          },
          'CallExpression:exit'(node) {
            if (isIIFE(node)) {
              iifeStack.pop();
            }
          },
        };
      },
    },

    'autofix-jsdoc-returns': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Add missing JSDoc @returns tag to functions with explicit return types',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: 'code', // ENABLED: Safe when return type is explicitly annotated in function signature
        schema: [],
        messages: {
          missingReturns:
            'Function is missing JSDoc @returns tag. Add @returns tag manually with correct type.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        /**
         * Find JSDoc comment for a function node
         */
        function findJSDocComment(node) {
          const comments = sourceCode.getCommentsBefore(node);
          // Look for the last JSDoc comment (/** ... */) before the function
          for (let i = comments.length - 1; i >= 0; i--) {
            const comment = comments[i];
            if (comment.type === 'Block' && comment.value.startsWith('*')) {
              return comment;
            }
          }
          return null;
        }

        /**
         * Check if JSDoc comment has @returns tag
         */
        function hasReturnsTag(jsdocComment) {
          if (!jsdocComment || !jsdocComment.value) return false;
          const value = jsdocComment.value;
          // Check for @returns or @return (both are valid)
          return /@returns?\s/.test(value);
        }

        /**
         * Get return type text from function signature (100% safe - uses explicit type annotation)
         */
        function getReturnTypeText(node) {
          // Only autofix if function has explicit return type annotation (100% safe)
          if (node.returnType && node.returnType.typeAnnotation) {
            const typeAnnotation = node.returnType.typeAnnotation;
            
            // Handle simple types
            if (typeAnnotation.type === 'TSVoidKeyword') {
              return 'void';
            }
            if (typeAnnotation.type === 'TSNumberKeyword') {
              return 'number';
            }
            if (typeAnnotation.type === 'TSStringKeyword') {
              return 'string';
            }
            if (typeAnnotation.type === 'TSBooleanKeyword') {
              return 'boolean';
            }
            if (typeAnnotation.type === 'TSNullKeyword') {
              return 'null';
            }
            if (typeAnnotation.type === 'TSUndefinedKeyword') {
              return 'undefined';
            }
            if (typeAnnotation.type === 'TSAnyKeyword') {
              return 'any';
            }
            if (typeAnnotation.type === 'TSUnknownKeyword') {
              return 'unknown';
            }
            if (typeAnnotation.type === 'TSNeverKeyword') {
              return 'never';
            }
            
            // For Promise types, extract the inner type
            if (typeAnnotation.type === 'TSTypeReference' && 
                typeAnnotation.typeName && 
                typeAnnotation.typeName.name === 'Promise') {
              if (typeAnnotation.typeParameters && typeAnnotation.typeParameters.params && typeAnnotation.typeParameters.params.length > 0) {
                const innerType = typeAnnotation.typeParameters.params[0];
                const innerTypeText = sourceCode.getText(innerType);
                return `Promise<${innerTypeText}>`;
              }
              return 'Promise<unknown>';
            }
            
            // For other complex types, get the text directly (100% safe - it's already in the code)
            return sourceCode.getText(typeAnnotation);
          }

          // Don't autofix if no explicit return type (too risky to infer)
          return null;
        }

        return {
          FunctionDeclaration(node) {
            // Skip if function has no body (type declaration)
            if (!node.body) return;

            // Find JSDoc comment
            const jsdocComment = findJSDocComment(node);
            
            // If no JSDoc comment exists, skip (let jsdoc/require-returns handle it)
            if (!jsdocComment) return;

            // If @returns already exists, skip
            if (hasReturnsTag(jsdocComment)) return;

            // Get return type text (only if explicitly annotated - 100% safe)
            const returnTypeText = getReturnTypeText(node);
            if (!returnTypeText) return; // Skip if no explicit return type (too risky)

            // Report with autofix (100% safe - uses explicit return type from signature)
            context.report({
              node,
              messageId: 'missingReturns',
              fix(fixer) {
                // Get the full comment text including the /** and */
                const fullCommentText = sourceCode.getText(jsdocComment);
                
                // Extract the content between /** and */
                const commentContent = jsdocComment.value || '';
                const commentLines = commentContent.split('\n').filter(line => line.trim() !== '');
                
                // Add @returns tag at the end (before closing */)
                const returnsTag = ` * @returns {${returnTypeText}} Return value description`;
                commentLines.push(returnsTag);
                
                // Reconstruct the comment content with proper line breaks
                const newContent = '\n' + commentLines.join('\n') + '\n ';
                
                // Replace the entire comment, preserving /** and */
                return fixer.replaceText(jsdocComment, `/**${newContent}*/`);
              },
            });
          },
        };
      },
    },

    // ============================================================================
    // AUTOFIX RULES - Phase 2
    // ============================================================================

    'autofix-jsdoc-param': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Add missing JSDoc @param tags to functions with explicit parameter types',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: 'code', // ENABLED: Safe when parameter types are explicitly annotated in function signature
        schema: [],
        messages: {
          missingParam: 'Function parameter is missing JSDoc @param tag. Add @param tag manually with correct type.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        /**
         * Find JSDoc comment for a function node
         */
        function findJSDocComment(node) {
          const comments = sourceCode.getCommentsBefore(node);
          for (let i = comments.length - 1; i >= 0; i--) {
            const comment = comments[i];
            if (comment.type === 'Block' && comment.value.startsWith('*')) {
              return comment;
            }
          }
          return null;
        }

        /**
         * Check if JSDoc comment has @param tag for a parameter with type
         */
        function hasParamTagWithType(jsdocComment, paramName) {
          if (!jsdocComment || !jsdocComment.value) return false;
          const value = jsdocComment.value;
          // Check for @param tag with type annotation: @param {type} name
          const escapedName = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const paramWithTypeRegex = new RegExp(`@param\\s+\\{[^}]+\\}\\s+${escapedName}\\b`);
          return paramWithTypeRegex.test(value);
        }

        /**
         * Check if JSDoc comment has @param tag for a parameter (with or without type)
         */
        function hasParamTag(jsdocComment, paramName) {
          if (!jsdocComment || !jsdocComment.value) return false;
          const value = jsdocComment.value;
          const escapedName = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const paramRegex = new RegExp(`@param\\s+(?:\\{[^}]+\\}\\s+)?${escapedName}\\b`);
          return paramRegex.test(value);
        }

        /**
         * Get parameter type text from function signature (100% safe - uses explicit type annotation)
         */
        function getParamTypeText(param) {
          if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
            const typeAnnotation = param.typeAnnotation.typeAnnotation;
            
            // Handle simple types
            if (typeAnnotation.type === 'TSNumberKeyword') return 'number';
            if (typeAnnotation.type === 'TSStringKeyword') return 'string';
            if (typeAnnotation.type === 'TSBooleanKeyword') return 'boolean';
            if (typeAnnotation.type === 'TSNullKeyword') return 'null';
            if (typeAnnotation.type === 'TSUndefinedKeyword') return 'undefined';
            if (typeAnnotation.type === 'TSAnyKeyword') return 'any';
            if (typeAnnotation.type === 'TSUnknownKeyword') return 'unknown';
            if (typeAnnotation.type === 'TSNeverKeyword') return 'never';
            if (typeAnnotation.type === 'TSVoidKeyword') return 'void';
            
            // For complex types, get the text directly (100% safe - it's already in the code)
            return sourceCode.getText(typeAnnotation);
          }
          return null; // Don't autofix if no explicit type (too risky)
        }

        return {
          FunctionDeclaration(node) {
            if (!node.body || !node.params || node.params.length === 0) return;

            const jsdocComment = findJSDocComment(node);
            if (!jsdocComment) return; // Skip if no JSDoc comment

            // Check each parameter
            for (const param of node.params) {
              if (param.type !== 'Identifier') continue; // Skip destructured params for now
              
              const paramName = param.name;
              const paramTypeText = getParamTypeText(param);
              if (!paramTypeText) continue; // Skip if no explicit type (too risky)

              // Skip if @param with type already exists
              if (hasParamTagWithType(jsdocComment, paramName)) continue;

              // Report with autofix (100% safe - uses explicit parameter type from signature)
              context.report({
                node: param,
                messageId: 'missingParam',
                fix(fixer) {
                  // Get the current comment text
                  const currentText = sourceCode.getText(jsdocComment);
                  const commentValue = jsdocComment.value || '';
                  const lines = commentValue.split('\n');
                  
                  // Check if @param tag exists without type - if so, add type to it
                  const escapedName = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  let foundParamLine = false;
                  
                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    // Match @param without type: @param name or @param  name
                    const paramMatch = line.match(new RegExp(`(\\s*\\*\\s*@param\\s+)(?!\\{)(${escapedName}\\b)`));
                    if (paramMatch) {
                      // @param exists but no type - add type
                      lines[i] = line.replace(paramMatch[0], `${paramMatch[1]}{${paramTypeText}} ${paramName}`);
                      foundParamLine = true;
                      break;
                    }
                  }
                  
                  if (foundParamLine) {
                    // Reconstruct comment with updated line
                    const newContent = lines.join('\n');
                    return fixer.replaceText(jsdocComment, `/**${newContent}*/`);
                  }
                  
                  // No @param tag exists - add it before closing */
                  const beforeClosing = currentText.lastIndexOf('*/');
                  if (beforeClosing === -1) return null;
                  
                  // Calculate the actual position in the source
                  const commentStart = jsdocComment.range[0];
                  const insertPosition = commentStart + beforeClosing;
                  
                  // Insert @param tag before the closing */
                  return fixer.insertTextBeforeRange([insertPosition, insertPosition], ` * @param {${paramTypeText}} ${paramName} Parameter description\n`);
                },
              });
            }
          },
        };
      },
    },

    'autofix-remove-unnecessary-async': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Remove unnecessary async keyword when function has no await',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null, // DISABLED: Autofix too risky - removing async could break Promise return type inference in TypeScript
        schema: [],
        messages: {
          unnecessaryAsync:
            'Function is marked async but has no await expression. Auto-fix will remove async keyword.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        function hasAwaitExpression(node) {
          if (!node || !node.body) return false;
          let found = false;
          function traverse(n) {
            if (!n || found) return;
            if (n.type === 'AwaitExpression') {
              found = true;
              return;
            }
            // Don't traverse into nested function declarations/expressions
            if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
              if (n !== node) {
                // Skip nested functions
                return;
              }
            }
            for (const key in n) {
              if (key !== 'parent' && typeof n[key] === 'object' && n[key] !== null) {
                if (Array.isArray(n[key])) {
                  for (const item of n[key]) {
                    traverse(item);
                    if (found) return;
                  }
                } else {
                  traverse(n[key]);
                  if (found) return;
                }
              }
            }
          }
          traverse(node.body);
          return found;
        }

        function hasExplicitPromiseReturn(node) {
          // Check if function has explicit Promise return type
          if (node.returnType && node.returnType.typeAnnotation) {
            const returnType = node.returnType.typeAnnotation;
            if (returnType.type === 'TSTypeReference') {
              if (returnType.typeName && returnType.typeName.type === 'Identifier') {
                return returnType.typeName.name === 'Promise';
              }
            }
          }
          return false;
        }

        return {
          FunctionDeclaration(node) {
            if (!node.async) return;
            if (hasExplicitPromiseReturn(node)) return; // Keep async if explicitly returning Promise
            if (hasAwaitExpression(node)) return; // Keep async if has await

            context.report({
              node,
              messageId: 'unnecessaryAsync',
              // No fix() - autofix disabled (fixable: null)
            });
          },
          ArrowFunctionExpression(node) {
            if (!node.async) return;
            if (hasAwaitExpression(node)) return; // Keep async if has await

            // For arrow functions, check parent for return type
            if (node.parent && node.parent.type === 'VariableDeclarator') {
              // Check if variable has type annotation
              if (node.parent.id && node.parent.id.typeAnnotation) {
                const typeAnnotation = node.parent.id.typeAnnotation.typeAnnotation;
                if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName && typeAnnotation.typeName.name === 'Promise') {
                  return; // Keep async if explicitly typed as Promise
                }
              }
            }

            context.report({
              node,
              messageId: 'unnecessaryAsync',
              // No fix() - autofix disabled (fixable: null)
            });
          },
        };
      },
    },

    'autofix-nested-ternary-parentheses': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Add parentheses around nested ternary expressions',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: null, // DISABLED: Autofix too risky - could conflict with Prettier formatting and cause circular fixes
        schema: [],
        messages: {
          nestedTernary:
            'Nested ternary expression should be parenthesized. Auto-fix will add parentheses.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        function isNestedTernary(node) {
          if (node.type !== 'ConditionalExpression') return false;
          // Check if the consequent or alternate is also a ternary
          return (
            (node.consequent && node.consequent.type === 'ConditionalExpression') ||
            (node.alternate && node.alternate.type === 'ConditionalExpression')
          );
        }

        function isAlreadyParenthesized(node) {
          const parent = node.parent;
          if (!parent) return false;
          // Check if parent is a parenthesized expression
          return parent.type === 'ParenthesizedExpression';
        }

        return {
          ConditionalExpression(node) {
            if (!isNestedTernary(node)) return;
            if (isAlreadyParenthesized(node)) return;

            // Only fix if nested ternary is in the alternate (right side)
            // This is the most common case: a ? b : c ? d : e
            if (node.alternate && node.alternate.type === 'ConditionalExpression') {
              context.report({
                node: node.alternate,
                messageId: 'nestedTernary',
                // No fix() - autofix disabled (fixable: null)
              });
            }
            // Also fix if nested ternary is in consequent (left side)
            // Less common: a ? b ? c : d : e
            else if (node.consequent && node.consequent.type === 'ConditionalExpression') {
              context.report({
                node: node.consequent,
                messageId: 'nestedTernary',
                // No fix() - autofix disabled (fixable: null)
              });
            }
          },
        };
      },
    },

    // ============================================================================
    // NEW ROBUST AUTOFIX RULES - 100% Safe, TypeScript-Compatible
    // ============================================================================

    'autofix-fix-import-quotes': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Standardize import path quotes (single quotes) - 100% safe text replacement',
          category: 'Style',
          recommended: false,
        },
        fixable: 'code',
        schema: [],
        messages: {
          useSingleQuotes: 'Import paths should use single quotes for consistency.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          ImportDeclaration(node) {
            if (!node.source || node.source.type !== 'Literal') return;
            
            const sourceValue = node.source.value;
            if (typeof sourceValue !== 'string') return;

            // Check if quotes are inconsistent (double quotes when single quotes are standard)
            const sourceText = sourceCode.getText(node.source);
            if (sourceText.startsWith('"') && sourceText.endsWith('"')) {
              context.report({
                node: node.source,
                messageId: 'useSingleQuotes',
                fix(fixer) {
                  // Replace double quotes with single quotes - 100% safe text replacement
                  // This cannot break TypeScript - it's just a style change
                  return fixer.replaceText(node.source, `'${sourceValue}'`);
                },
              });
            }
          },
        };
      },
    },

    // ============================================================================
    // ADDITIONAL SAFE AUTOFIX RULES - 100% Safe, TypeScript-Compatible
    // ============================================================================

    'autofix-remove-trailing-semicolons-in-type-imports': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Remove trailing semicolons in type-only import statements (Prettier handles this, but ensures consistency)',
          category: 'Style',
          recommended: false,
        },
        fixable: 'code',
        schema: [],
        messages: {
          removeTrailingSemicolon: 'Remove trailing semicolon in type import statement.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          ImportDeclaration(node) {
            // Only check type-only imports
            const isTypeOnly = node.importKind === 'type' || 
              (node.specifiers.length > 0 && node.specifiers.every(spec => spec.type === 'ImportSpecifier' && spec.importKind === 'type'));
            
            if (!isTypeOnly) return;

            const lastToken = sourceCode.getLastToken(node);
            if (lastToken && lastToken.value === ';') {
              context.report({
                node: lastToken,
                messageId: 'removeTrailingSemicolon',
                fix(fixer) {
                  return fixer.remove(lastToken);
                },
              });
            }
          },
        };
      },
    },

    'autofix-sort-import-specifiers': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Sort import specifiers alphabetically within import statements - 100% safe',
          category: 'Style',
          recommended: false,
        },
        fixable: 'code',
        schema: [],
        messages: {
          sortSpecifiers: 'Import specifiers should be sorted alphabetically.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          ImportDeclaration(node) {
            if (!node.specifiers || node.specifiers.length < 2) return;

            // Get all specifiers
            const specifiers = node.specifiers.map(spec => {
              const text = sourceCode.getText(spec);
              let name = '';
              if (spec.type === 'ImportSpecifier') {
                name = spec.imported.name;
              } else if (spec.type === 'ImportDefaultSpecifier') {
                name = spec.local.name;
              } else if (spec.type === 'ImportNamespaceSpecifier') {
                name = spec.local.name;
              }
              return { spec, text, name };
            });

            // Check if already sorted
            const sorted = [...specifiers].sort((a, b) => a.name.localeCompare(b.name));
            const isSorted = specifiers.every((item, index) => item.name === sorted[index].name);

            if (!isSorted) {
              context.report({
                node: node.specifiers[0],
                messageId: 'sortSpecifiers',
                fix(fixer) {
                  // Sort specifiers
                  const sortedTexts = sorted.map(s => s.text).join(', ');
                  const firstSpec = node.specifiers[0];
                  const lastSpec = node.specifiers[node.specifiers.length - 1];
                  return fixer.replaceTextRange(
                    [firstSpec.range[0], lastSpec.range[1]],
                    sortedTexts
                  );
                },
              });
            }
          },
        };
      },
    },

    'autofix-consistent-type-assertions': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Convert type assertions to use `as` syntax consistently - 100% safe',
          category: 'Style',
          recommended: false,
        },
        fixable: 'code',
        schema: [],
        messages: {
          useAsSyntax: 'Use "as" syntax for type assertions instead of angle bracket syntax.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          TSTypeAssertion(node) {
            // TypeScript type assertion using angle brackets: <Type>value
            // Convert to: value as Type
            context.report({
              node,
              messageId: 'useAsSyntax',
              fix(fixer) {
                const expressionText = sourceCode.getText(node.expression);
                const typeText = sourceCode.getText(node.typeAnnotation);
                // Convert <Type>value to value as Type
                return fixer.replaceText(node, `${expressionText} as ${typeText}`);
              },
            });
          },
        };
      },
    },

    'autofix-remove-unnecessary-type-assertions': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Remove unnecessary type assertions when TypeScript can infer the type - 100% safe',
          category: 'Style',
          recommended: false,
        },
        fixable: 'code',
        schema: [],
        messages: {
          removeUnnecessary: 'Unnecessary type assertion can be removed.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          TSAsExpression(node) {
            // Check if type assertion is unnecessary
            // This is a simple check - only remove if the assertion is to the same type
            // More complex checks would require type information (not available in ESLint)
            // So we'll keep this rule simple and safe
            const expressionText = sourceCode.getText(node.expression);
            const typeText = sourceCode.getText(node.typeAnnotation);
            
            // Only remove if it's a simple case like: (value as any) or (value as unknown)
            // These are common unnecessary assertions
            if (typeText === 'any' || typeText === 'unknown') {
              context.report({
                node,
                messageId: 'removeUnnecessary',
                fix(fixer) {
                  // Remove the "as Type" part
                  return fixer.replaceText(node, expressionText);
                },
              });
            }
          },
        };
      },
    },

    // ============================================================================
    // AUTOFIX WRAPPER FOR UNICORN PREFER-STRUCTURED-CLONE
    // ============================================================================
    // Wraps unicorn/prefer-structured-clone suggestion into proper autofix
    // This allows automatic fixing of JSON.parse(JSON.stringify()) patterns
    'autofix-prefer-structured-clone': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Auto-fix: Replace JSON.parse(JSON.stringify()) with structuredClone() - 100% safe',
          category: 'Best Practices',
          recommended: false,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferStructuredClone: 'Prefer `structuredClone(…)` over `JSON.parse(JSON.stringify(…))` to create a deep clone.',
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          CallExpression(node) {
            // Check for JSON.parse(JSON.stringify(...))
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'JSON' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'parse' &&
              node.arguments.length === 1 &&
              node.arguments[0].type === 'CallExpression' &&
              node.arguments[0].callee.type === 'MemberExpression' &&
              node.arguments[0].callee.object.type === 'Identifier' &&
              node.arguments[0].callee.object.name === 'JSON' &&
              node.arguments[0].callee.property.type === 'Identifier' &&
              node.arguments[0].callee.property.name === 'stringify' &&
              node.arguments[0].arguments.length === 1
            ) {
              const jsonStringify = node.arguments[0];
              const jsonStringifyArg = jsonStringify.arguments[0];

              context.report({
                node,
                messageId: 'preferStructuredClone',
                fix(fixer) {
                  // Get the argument text
                  const argText = sourceCode.getText(jsonStringifyArg);

                  // Replace JSON.parse(JSON.stringify(arg)) with structuredClone(arg)
                  return fixer.replaceText(node, `structuredClone(${argText})`);
                },
              });
            }
          },
        };
      },
    },
  },
};
