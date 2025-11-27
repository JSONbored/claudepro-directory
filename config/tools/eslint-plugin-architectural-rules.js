/**
 * ESLint plugin for architectural rules
 * Enforces comprehensive Pino logger & error instrumentation standards:
 * - Message-first API consistency
 * - Helper function usage (logError, logInfo, logWarn, logTrace)
 * - Context creation functions
 * - Custom serializers (user, request, response, dbQuery, args)
 * - Bindings/setBindings usage
 * - Error normalization
 * - Edge function patterns (initRequestLogging, traceRequestComplete)
 * - No console.* calls
 *
 * Located in config/tools/ to match codebase organization pattern
 */

export default {
  rules: {
    'require-request-id-in-logger': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require requestId and operation in logger.error/warn calls',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingRequestId:
            'logger.error/warn calls must include requestId in logger.setBindings() or context. Use logger.setBindings({ requestId, operation, module, route }) at request start.',
          missingOperation:
            'logger.error/warn calls must include operation in logger.setBindings() or context. Use logger.setBindings({ requestId, operation, module, route }) at request start.',
          missingModule:
            'logger.setBindings() should include module field for better traceability. Use logger.setBindings({ requestId, operation, module, route }) at request start.',
          useBarrelExport:
            'Use barrel exports for logging utilities. Import from @heyclaude/web-runtime/logging/server (server-side) or @heyclaude/web-runtime/logging/client (client-side) instead of direct imports.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Skip client components - they can't use server-only generateRequestId
        // Check for 'use client' directive at the top of the file
        // Also skip client-side utilities like draft-manager (uses localStorage)
        // Skip marketing/contact.ts - module-level initialization, not request context
        const fileText = sourceCode.getText();
        const isClientComponent =
          filename.includes('error.tsx') ||
          filename.includes('wizard') ||
          filename.includes('draft-manager') ||
          filename.includes('marketing/contact') ||
          fileText.includes("'use client'") ||
          fileText.includes('"use client"') ||
          fileText.includes('localStorage');

        // Track setBindings() calls per function scope
        // Map of function node to bindings info: { hasRequestId: boolean, hasOperation: boolean }
        const functionBindings = new Map();

        /**
         * Get the function node that contains the given node
         */
        function getContainingFunction(node) {
          let parent = node.parent;
          while (parent) {
            if (
              parent.type === 'FunctionDeclaration' ||
              parent.type === 'FunctionExpression' ||
              parent.type === 'ArrowFunctionExpression'
            ) {
              return parent;
            }
            parent = parent.parent;
          }
          return null;
        }

        /**
         * Check if setBindings with required fields exists in the function body
         * by examining the function's source text
         */
        function hasSetBindingsInFunctionBody(funcNode) {
          if (!funcNode) {
            return false;
          }

          // Get the function body text
          const funcText = sourceCode.getText(funcNode);
          
          // Check if setBindings or child logger is called with requestId, operation, and module
          // This regex checks for logger.setBindings({ ... requestId ... operation ... module ... })
          // or logger.child({ ... requestId ... operation ... module ... })
          // It's a bit lenient but should catch most cases
          const hasSetBindings = /logger\.setBindings\s*\(/.test(funcText);
          const hasChildLogger = /logger\.child\s*\(/.test(funcText) || /const\s+\w+Logger\s*=\s*logger\.child/.test(funcText);
          
          if (!hasSetBindings && !hasChildLogger) {
            return false;
          }

          // Check if the setBindings/child call includes requestId, operation, and module
          // We look for the pattern before the logger.error/warn call
          // This is a fallback check when AST traversal doesn't work
          const hasRequestId = /requestId\s*[:=]/.test(funcText);
          const hasOperation = /operation\s*[:=]/.test(funcText);
          const hasModule = /module\s*[:=]/.test(funcText);

          return hasRequestId && hasOperation && hasModule;
        }

        /**
         * Get all parent function nodes (traverses up the function hierarchy)
         * Returns an array of function nodes, starting with the immediate containing function
         */
        function getAllContainingFunctions(node) {
          const functions = [];
          let parent = node.parent;
          while (parent) {
            if (
              parent.type === 'FunctionDeclaration' ||
              parent.type === 'FunctionExpression' ||
              parent.type === 'ArrowFunctionExpression'
            ) {
              functions.push(parent);
            }
            parent = parent.parent;
          }
          return functions;
        }

        /**
         * Check if a setBindings call includes requestId, operation, and module
         */
        function checkSetBindingsArgs(node) {
          if (!node.arguments || node.arguments.length === 0) {
            return { hasRequestId: false, hasOperation: false, hasModule: false };
          }

          const bindingsArg = node.arguments[0];
          if (bindingsArg.type !== 'ObjectExpression') {
            return { hasRequestId: false, hasOperation: false, hasModule: false };
          }

          let hasRequestId = false;
          let hasOperation = false;
          let hasModule = false;

          for (const prop of bindingsArg.properties) {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
              if (prop.key.name === 'requestId') {
                hasRequestId = true;
              }
              if (prop.key.name === 'operation') {
                hasOperation = true;
              }
              if (prop.key.name === 'module') {
                hasModule = true;
              }
            }
          }

          return { hasRequestId, hasOperation, hasModule };
        }

        /**
         * Check if bindings (with requestId, operation, and module) exist in the function or any parent function
         * Traverses up the function hierarchy to find bindings set in parent scopes
         * Also checks all ancestor nodes (not just functions) to handle try-catch blocks and other nested scopes
         */
        function hasBindingsInFunctionOrParents(funcNode) {
          if (!funcNode) {
            return false;
          }

          // Check the function itself
          const bindingsInfo = functionBindings.get(funcNode);
          if (bindingsInfo && bindingsInfo.hasRequestId && bindingsInfo.hasOperation && bindingsInfo.hasModule) {
            return true;
          }

          // Traverse up to parent functions AND check all ancestor nodes
          // This handles cases where logger calls are in try-catch blocks, callbacks, etc.
          let current = funcNode;
          while (current) {
            // Check if current node is a function
            if (
              current.type === 'FunctionDeclaration' ||
              current.type === 'FunctionExpression' ||
              current.type === 'ArrowFunctionExpression'
            ) {
              const currentBindings = functionBindings.get(current);
              if (currentBindings && currentBindings.hasRequestId && currentBindings.hasOperation && currentBindings.hasModule) {
                return true;
              }
            }
            
            // Move to parent
            current = current.parent;
            
            // Also check if we've reached the Program node (top level)
            if (current && current.type === 'Program') {
              break;
            }
          }

          return false;
        }

        return {
          CallExpression(node) {
            // Track logger.setBindings() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'setBindings'
            ) {
              const funcNode = getContainingFunction(node);
              if (funcNode) {
                const bindingsInfo = checkSetBindingsArgs(node);
                functionBindings.set(funcNode, bindingsInfo);
                
                // Check if module field is missing in bindings
                if (bindingsInfo.hasRequestId && bindingsInfo.hasOperation && !bindingsInfo.hasModule) {
                  context.report({
                    node: node.arguments[0],
                    messageId: 'missingModule',
                  });
                }
              }
              return;
            }

            // Check if this is a logger.error or logger.warn call
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              (node.callee.property.name === 'error' || node.callee.property.name === 'warn')
            ) {
              // Skip client components
              if (isClientComponent) {
                return;
              }

              // Check if this logger call is using a child logger variable (reqLogger, userLogger, etc.)
              const isChildLoggerCall = node.callee.object.type === 'Identifier' && 
                /Logger$/.test(node.callee.object.name) && 
                node.callee.object.name !== 'logger';
              
              if (isChildLoggerCall) {
                // Using a child logger variable - context is provided via child logger - valid
                return;
              }
              
              // Check if setBindings or child logger was called in the same function or any parent function
              // This handles nested callbacks (e.g., promise.catch(), async callbacks)
              // where bindings may be set in the parent function scope
              // Also handles try-catch blocks and other nested scopes
              const funcNode = getContainingFunction(node);
              
              // First check if bindings exist in the function or parent functions (AST-based check)
              if (hasBindingsInFunctionOrParents(funcNode)) {
                // setBindings() was called with requestId, operation, and module in this function or a parent - valid
                return;
              }
              
              // Fallback: Check function body text for setBindings or child logger calls
              // This handles cases where AST traversal doesn't work (e.g., try-catch blocks)
              // We check if setBindings/child with required fields exists in the function body
              if (funcNode && hasSetBindingsInFunctionBody(funcNode)) {
                // Found setBindings/child with required fields in function body - valid
                return;
              }
              
              // Also check parent functions using text-based check as fallback
              let current = funcNode;
              while (current) {
                const parentFunc = getContainingFunction(current.parent);
                if (parentFunc && hasSetBindingsInFunctionBody(parentFunc)) {
                  return; // Found bindings in parent function
                }
                if (!parentFunc) {
                  break;
                }
                current = parentFunc;
              }
              
              // Final fallback: Check entire file for setBindings or child logger with required fields
              // This handles cases where a function is called from another function that has bindings
              // (e.g., SearchResultsSection called from SearchPage)
              // Since Pino's bindings are global to the logger instance, if setBindings is called
              // anywhere in the file with required fields, it will be available to all logger calls
              // Child loggers are scoped to their creation, so we check for child logger patterns too
              const fileText = sourceCode.getText();
              const hasSetBindingsInFile = /logger\.setBindings\s*\(/.test(fileText);
              const hasChildLoggerInFile = /logger\.child\s*\(/.test(fileText) || /const\s+\w+Logger\s*=\s*logger\.child/.test(fileText);
              
              if (hasSetBindingsInFile || hasChildLoggerInFile) {
                const hasRequestId = /requestId\s*[:=]/.test(fileText);
                const hasOperation = /operation\s*[:=]/.test(fileText);
                const hasModule = /module\s*[:=]/.test(fileText);
                // If setBindings/child with required fields exists anywhere in the file, it's valid
                // (Pino bindings are global to the logger instance, so they're available to all calls)
                // (Child loggers are scoped, but if they're created with required fields, they're valid)
                if (hasRequestId && hasOperation && hasModule) {
                  // Check if this is a server-side file (not a client component)
                  // Client components shouldn't use setBindings for request context
                  if (!isClientComponent) {
                    // setBindings/child with required fields exists in the file - valid
                    return;
                  }
                }
              }

              // Find the context argument (usually the 3rd argument for error, 2nd for warn)
              const contextArg = node.arguments[node.arguments.length - 1];

              if (!contextArg) {
                // No context object provided - bindings should be set instead
                context.report({
                  node,
                  messageId: 'missingRequestId',
                });
                return;
              }

              // Check if context object has requestId and operation directly
              // NOTE: This is deprecated - prefer logger.setBindings() instead
              if (contextArg.type === 'ObjectExpression') {
                const hasRequestId = contextArg.properties.some(
                  (prop) =>
                    prop.type === 'Property' &&
                    prop.key.type === 'Identifier' &&
                    prop.key.name === 'requestId'
                );

                const hasOperation = contextArg.properties.some(
                  (prop) =>
                    prop.type === 'Property' &&
                    prop.key.type === 'Identifier' &&
                    prop.key.name === 'operation'
                );

                if (!hasRequestId || !hasOperation) {
                  // Missing required fields - should use bindings instead
                  context.report({
                    node: contextArg,
                    messageId: !hasRequestId ? 'missingRequestId' : 'missingOperation',
                  });
                }
              } else {
                // Context is not an object expression - should use bindings
                context.report({
                  node: contextArg,
                  messageId: 'missingRequestId',
                });
              }
            }
          },
        };
      },
    },
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
        },
      },
      create(context) {
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Check if this is a client component
        const isClientComponent =
          fileText.includes("'use client'") || fileText.includes('"use client"');

        if (!isClientComponent) {
          return {};
        }

        // Server-only import patterns that should not be in client components
        const serverOnlyPatterns = [
          /packages\/web-runtime\/src\/data\/(?!config\/category|changelog\.shared|forms\/submission-form-fields)/,
          /packages\/web-runtime\/src\/cache\//,
          /packages\/web-runtime\/src\/supabase\/(server|server-anon)\.ts/,
          /packages\/web-runtime\/src\/server\.ts/,
          /\.server\.ts/,
          /\.server\.tsx/,
          /server-only/,
          // Server-only logging utilities
          /packages\/web-runtime\/src\/utils\/request-context\.ts/,
          /packages\/web-runtime\/src\/utils\/log-context\.ts/,
          /packages\/web-runtime\/src\/utils\/error-handler\.ts/,
          // Server-only logging barrel
          /@heyclaude\/web-runtime\/logging\/server/,
          /packages\/web-runtime\/src\/logging\/server\.ts/,
        ];

        return {
          ImportDeclaration(node) {
            if (!node.source?.value) {
              return;
            }

            const importPath = node.source.value;

            // Skip if importing from client-safe entry point
            if (
              importPath === '@heyclaude/web-runtime/data' ||
              importPath.startsWith('@heyclaude/web-runtime/data/') ||
              importPath.includes('/data-client') ||
              // Client-safe logging barrel
              importPath === '@heyclaude/web-runtime/logging/client' ||
              importPath.startsWith('@heyclaude/web-runtime/logging/client') ||
              importPath.includes('/logging/client')
            ) {
              return;
            }

            // Check against server-only patterns
            const isServerOnly = serverOnlyPatterns.some((pattern) => pattern.test(importPath));

            if (isServerOnly) {
              context.report({
                node: node.source,
                messageId: 'serverImportInClient',
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
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only apply to API route files
        if (!(filename.includes('/api/') && filename.endsWith('route.ts'))) {
          return {};
        }

        let hasErrorHandlerImport = false;
        let hasTryCatch = false;

        return {
          ImportDeclaration(node) {
            if (
              node.source.value === '@heyclaude/web-runtime/utils/error-handler' ||
              node.source.value.includes('error-handler')
            ) {
              hasErrorHandlerImport = true;
            }
          },
          TryStatement(node) {
            hasTryCatch = true;

            // Check if catch block uses createErrorResponse or handleApiError
            if (node.handler?.body) {
              const catchBody = node.handler.body;
              const usesErrorHandler =
                context.getSourceCode().getText(catchBody).includes('createErrorResponse') ||
                context.getSourceCode().getText(catchBody).includes('handleApiError');

              if (hasTryCatch && !usesErrorHandler && hasErrorHandlerImport) {
                context.report({
                  node: node.handler,
                  messageId: 'useErrorHandler',
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
        fixable: null,
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
        const fileText = sourceCode.getText();

        // Skip client components - they may use different error handling patterns
        const isClientComponent =
          filename.includes('error.tsx') ||
          filename.includes('wizard') ||
          filename.includes('draft-manager') ||
          filename.includes('marketing/contact') ||
          fileText.includes("'use client'") ||
          fileText.includes('"use client"') ||
          fileText.includes('localStorage');

        // Skip edge functions - they use different logging (logError, logInfo, logWarn)
        const isEdgeFunction = filename.includes('apps/edge/functions');

        // Skip test files
        const isTestFile = filename.includes('.test.') || filename.includes('.spec.');

        if (isClientComponent || isEdgeFunction || isTestFile) {
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

        return {
          CatchClause(node) {
            // Skip utility functions that are pure validation/parsing (they return fallback values)
            // These are typically simple try/catch for URL parsing, validation, etc.
            const catchBodyText = sourceCode.getText(node.body);
            const isSimpleReturn =
              catchBodyText.includes('return false') ||
              catchBodyText.includes('return null') ||
              catchBodyText.includes("return '#'") ||
              catchBodyText.includes('return ""') ||
              catchBodyText.includes('return []') ||
              catchBodyText.trim() === 'return null;' ||
              catchBodyText.trim() === 'return false;' ||
              catchBodyText.trim() === "return '#';";

            // Check if this is a utility function (module-level, not in component)
            let parent = node.parent;
            let isInUtilityFunction = false;
            let functionName = '';
            while (parent) {
              if (parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') {
                functionName = parent.id?.name || 'anonymous';
                // Utility functions are typically named functions at module level
                // They're not default exports and don't match component patterns
                // Common patterns: isAllowedHttpUrl, parseGitHubPrUrl, buildSafePrUrl, getSafeWebsiteUrl, etc.
                if (
                  functionName !== 'default' &&
                  !functionName.match(
                    /^(Page|Component|Server|generateMetadata|generateStaticParams)$/
                  ) &&
                  !functionName.includes('Page') &&
                  !functionName.includes('Component') &&
                  !functionName.includes('generateMetadata') &&
                  !functionName.includes('generateStaticParams')
                ) {
                  isInUtilityFunction = true;
                  break;
                }
              }
              if (parent.type === 'ExportDefaultDeclaration') {
                break; // Inside default export (likely a component)
              }
              parent = parent.parent;
            }

            // Allow simple utility functions that just return fallback values
            // These are typically validation/parsing functions that don't need logging
            // Also allow if function name suggests it's a utility (is*, parse*, build*, get*, normalize*, extract*, etc.)
            const isUtilityPattern = functionName.match(
              /^(is|parse|build|get|normalize|validate|sanitize|extract|format|canonicalize)/i
            );
            if ((isSimpleReturn && isInUtilityFunction) || (isSimpleReturn && isUtilityPattern)) {
              return; // Skip - utility function with simple fallback
            }

            if (!node.body || node.body.body.length === 0) {
              context.report({
                node,
                messageId: 'emptyCatchBlock',
              });
              return;
            }

            // Check if catch block contains logger.error call, helper functions, or uses bindings
            // Also check for child logger patterns (reqLogger.error, userLogger.error, etc.)
            const hasLoggerError =
              catchBodyText.includes('logger.error') ||
              catchBodyText.includes('logger.warn') ||
              /(reqLogger|userLogger|actionLogger|metadataLogger|viewerLogger|processLogger|callbackLogger|requestLogger|utilityLogger|sectionLogger)\.(error|warn)/.test(catchBodyText) ||
              catchBodyText.includes('logError') ||
              catchBodyText.includes('logWarn') ||
              catchBodyText.includes('logInfo') ||
              catchBodyText.includes('logTrace');

            // Check if it uses normalizeError
            const hasNormalizeError = catchBodyText.includes('normalizeError');

            // Check if it uses logContext (or baseLogContext, actionLogContext, etc.)
            const hasLogContext =
              catchBodyText.includes('logContext') ||
              catchBodyText.includes('baseLogContext') ||
              catchBodyText.includes('actionLogContext') ||
              catchBodyText.includes('metadataLogContext') ||
              catchBodyText.includes('staticParamsLogContext') ||
              catchBodyText.includes('utilityLogContext');

            // Allow if it's a re-throw pattern (error is logged elsewhere or will be caught by error boundary)
            const isRethrow = catchBodyText.includes('throw');

            // Allow if it uses createErrorResponse or handleApiError (API routes)
            const usesErrorHandler =
              catchBodyText.includes('createErrorResponse') ||
              catchBodyText.includes('handleApiError');

            // Allow if it's a Promise.catch with proper error handling
            const isPromiseCatch = node.parent?.type === 'CallExpression';

            // Allow if it's in JSX render code (image loading, etc.) - these are handled differently
            // Check if catch is inside an IIFE in JSX: (() => { try { ... } catch { return null } })()
            let checkParent = node.parent;
            let isInJSX = false;
            while (checkParent) {
              if (checkParent.type === 'JSXExpressionContainer') {
                isInJSX = true;
                break;
              }
              if (
                checkParent.type === 'CallExpression' &&
                checkParent.callee?.type === 'ArrowFunctionExpression'
              ) {
                // This is likely an IIFE in JSX
                isInJSX = true;
                break;
              }
              if (
                checkParent.type === 'ReturnStatement' ||
                checkParent.type === 'JSXElement' ||
                checkParent.type === 'JSXFragment'
              ) {
                // Inside JSX render
                isInJSX = true;
                break;
              }
              if (
                checkParent.type === 'FunctionDeclaration' ||
                checkParent.type === 'FunctionExpression' ||
                checkParent.type === 'ArrowFunctionExpression'
              ) {
                // Check if this function is inside JSX
                const funcText = sourceCode.getText(checkParent);
                if (funcText.includes('JSX') || funcText.includes('return <')) {
                  isInJSX = true;
                  break;
                }
              }
              checkParent = checkParent.parent;
            }

            const shouldSkip =
              hasLoggerError || usesErrorHandler || isRethrow || isPromiseCatch || isInJSX;
            if (!shouldSkip) {
              context.report({
                node: node.body,
                messageId: 'missingErrorLogging',
              });
            } else if (hasLoggerError && !hasNormalizeError) {
              // Error if logger.error is used but normalizeError is not
              context.report({
                node: node.body,
                messageId: 'missingErrorLogging',
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
            // Check if this is auth.getUser() call
            const text = sourceCode.getText(node);
            if (text.includes('auth.getUser')) {
              context.report({
                node,
                messageId: 'directAuthGetUser',
              });
            }
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
          // Normalized paths
          'lib/data/config/constants.ts',
          'lib/data/marketing/contact.ts',
          'data/config/constants.ts',
          'data/marketing/site.ts',
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
              node.value.includes('SOCIAL_LINKS') &&
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
                node.source.value.includes('@/src/lib/data/marketing'))
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
            'Server-side error boundaries must use logger.error() with proper context. Use logger.setBindings({ requestId, operation, module, route }) at request start.',
          missingRequestId:
            'Server-side error boundaries must generate requestId using generateRequestId() and include it in logger.setBindings().',
          missingNormalizeError:
            'Error boundaries must normalize errors using normalizeError() before logging.',
          missingLoggerError:
            'Error boundaries must use logger.error() or logClientErrorBoundary() for structured logging (not console.error).',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Check if this is an error boundary file
        const isErrorBoundaryFile =
          filename.includes('/error.tsx') ||
          filename.includes('/error.ts') ||
          filename.includes('/global-error.tsx') ||
          filename.includes('error-boundary');

        if (!isErrorBoundaryFile) {
          return {};
        }

        // Check if this is a client component
        const isClientComponent =
          fileText.includes("'use client'") || fileText.includes('"use client"');

        // Track what we find in the file
        let hasLogClientErrorBoundary = false;
        let hasGenerateRequestId = false;
        let hasSetBindings = false;
        let hasNormalizeError = false;
        let hasLoggerError = false;
        let hasConsoleError = false;
        let hasComponentDidCatch = false;
        let hasUseEffect = false;

        // Check for componentDidCatch (class component error boundary)
        if (fileText.includes('componentDidCatch')) {
          hasComponentDidCatch = true;
        }

        // Check for useEffect (Next.js error boundary)
        if (fileText.includes('useEffect')) {
          hasUseEffect = true;
        }

        // Check for console.error (should not be used)
        if (/console\.error/.test(fileText)) {
          hasConsoleError = true;
        }

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
                        // Check if logger.error is used in the file
                        if (/logger\.error/.test(fileText)) {
                          hasLoggerError = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          // Check for logger.setBindings() in server-side code
          CallExpression(node) {
            if (!isClientComponent) {
              if (
                node.callee.type === 'MemberExpression' &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === 'logger' &&
                node.callee.property.type === 'Identifier' &&
                node.callee.property.name === 'setBindings'
              ) {
                hasSetBindings = true;
              }
            }
          },

          // Check useEffect in error boundaries
          'CallExpression[callee.name="useEffect"]'(node) {
            if (!hasUseEffect) {
              return;
            }

            // Check if this useEffect contains error logging
            const effectText = sourceCode.getText(node);
            const hasErrorInEffect = /error/.test(effectText);

            if (hasErrorInEffect) {
              if (isClientComponent) {
                // Client-side: check for logClientErrorBoundary
                if (!/logClientErrorBoundary\s*\(/.test(effectText)) {
                  context.report({
                    node,
                    messageId: 'missingClientErrorBoundaryLogging',
                  });
                }
              } else {
                // Server-side: check for logger.error with proper context
                const hasStandardPattern =
                  /logger\.setBindings/.test(fileText) &&
                  /normalizeError/.test(effectText) &&
                  /logger\.error/.test(effectText);

                if (!hasStandardPattern) {
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
            hasComponentDidCatch = true;
            const methodText = sourceCode.getText(node);

            if (isClientComponent) {
              // Client-side: check for logClientErrorBoundary
              if (!/logClientErrorBoundary\s*\(/.test(methodText)) {
                context.report({
                  node,
                  messageId: 'missingClientErrorBoundaryLogging',
                });
              }
            } else {
              // Server-side: check for logger.error with proper context
              const hasStandardPattern =
                /logger\.setBindings/.test(fileText) &&
                /normalizeError/.test(methodText) &&
                /logger\.error/.test(methodText);

              if (!hasStandardPattern) {
                context.report({
                  node,
                  messageId: 'missingStandardizedLogging',
                });
              }
            }
          },

          // Check for console.error usage (should not be used)
          'CallExpression[callee.object.name="console"][callee.property.name="error"]'(node) {
            if (isErrorBoundaryFile) {
              context.report({
                node,
                messageId: 'missingLoggerError',
              });
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
                    node: context.sourceCode.ast,
                    messageId: 'missingClientErrorBoundaryLogging',
                  });
                }
                if (!hasLoggerError && hasConsoleError) {
                  context.report({
                    node: context.sourceCode.ast,
                    messageId: 'missingLoggerError',
                  });
                }
              } else {
                // Server-side: must use logger.error with proper setup
                if (!hasGenerateRequestId && !hasSetBindings) {
                  context.report({
                    node: context.sourceCode.ast,
                    messageId: 'missingRequestId',
                  });
                }
                if (!hasSetBindings) {
                  context.report({
                    node: context.sourceCode.ast,
                    messageId: 'missingStandardizedLogging',
                  });
                }
                if (!hasNormalizeError) {
                  context.report({
                    node: context.sourceCode.ast,
                    messageId: 'missingNormalizeError',
                  });
                }
                if (!hasLoggerError && hasConsoleError) {
                  context.report({
                    node: context.sourceCode.ast,
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

        // Only check files that contain createErrorBoundaryFallback
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        if (!fileText.includes('createErrorBoundaryFallback')) {
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

          // Check for console.error in createErrorBoundaryFallback function
          'FunctionDeclaration[id.name="createErrorBoundaryFallback"], FunctionExpression[parent.id.name="createErrorBoundaryFallback"]'(
            node
          ) {
            const functionText = sourceCode.getText(node);
            if (/console\.error/.test(functionText)) {
              hasConsoleError = true;
            }
            if (/logger\.error/.test(functionText)) {
              hasLoggerError = true;
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
            if (fileText.includes('createErrorBoundaryFallback')) {
              if (
                !(
                  hasLoggerImport &&
                  hasGenerateRequestIdImport &&
                  hasCreateWebAppContextWithIdImport &&
                  hasNormalizeErrorImport
                )
              ) {
                context.report({
                  node: context.sourceCode.ast,
                  messageId: 'missingLoggerImport',
                });
              }
              if (hasConsoleError && !hasLoggerError) {
                context.report({
                  node: context.sourceCode.ast,
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
        const fileText = sourceCode.getText();

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
        const fileText = sourceCode.getText();

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
        const constantsUsagePattern = /Constants\.(public|private)\.Enums\./;

        if (fileText.includes("from '@heyclaude/database-types'") || fileText.includes('from "@heyclaude/database-types"')) {
          hasConstantsImport = fileText.includes('Constants');
        }

        return {
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
                // Check if Constants is not being used nearby
                const surroundingText = sourceCode.getText(node.parent);
                if (!constantsUsagePattern.test(surroundingText) && !hasConstantsImport) {
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
        fixable: null,
        schema: [],
        messages: {
          missingSectionLogging:
            'Server pages should use section-based logging with section: "section-name" in logContext. Example: logger.info("message", { section: "data-fetch" })',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only apply to server pages (app directory pages, not components)
        const isServerPage =
          filename.includes('/app/') &&
          (filename.endsWith('/page.tsx') || filename.endsWith('/page.ts')) &&
          !filename.includes('/components/') &&
          !fileText.includes("'use client'") &&
          !fileText.includes('"use client"');

        if (!isServerPage) {
          return {};
        }

        // Check if page has async data fetching operations
        const hasAsyncOperations =
          fileText.includes('await ') && (fileText.includes('fetch') || fileText.includes('get') || fileText.includes('rpc'));

        if (!hasAsyncOperations) {
          return {}; // Skip pages without async operations
        }

        // Check if section-based logging is used
        const hasSectionLogging = /section:\s*['"][\w-]+['"]/.test(fileText);
        const hasBaseLogContext = /baseLogContext/.test(fileText);

        return {
          'Program:exit'() {
            // If page has async operations but no section logging, warn
            if (hasAsyncOperations && hasBaseLogContext && !hasSectionLogging) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'missingSectionLogging',
              });
            }
          },
        };
      },
    },
    'no-console-in-production': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent console.log, console.error, console.warn in favor of structured logging',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useStructuredLogging:
            'console.{method} is not allowed. Use logger.{method} with proper logContext instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Skip test files, build scripts, and config files
        if (
          filename.includes('.test.') ||
          filename.includes('.spec.') ||
          filename.includes('.config.') ||
          filename.includes('scripts/') ||
          filename.includes('bin/')
        ) {
          return {};
        }

        return {
          'CallExpression[callee.object.name="console"]'(node) {
            const method = node.callee.property?.name;
            if (method === 'log' || method === 'error' || method === 'warn' || method === 'info' || method === 'debug') {
              context.report({
                node,
                messageId: 'useStructuredLogging',
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
        fixable: null,
        schema: [],
        messages: {
          useLoggedAsync:
            'Client components with async operations must use useLoggedAsync hook for consistent error logging. Example: const runLoggedAsync = useLoggedAsync({ scope: "ComponentName" });',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only apply to client components
        const isClientComponent =
          fileText.includes("'use client'") || fileText.includes('"use client"');

        if (!isClientComponent) {
          return {};
        }

        // Check if component has async operations
        const hasAsyncOperations = /async\s+(\(|=>)/.test(fileText) && /await\s+/.test(fileText);

        if (!hasAsyncOperations) {
          return {};
        }

        // Check if useLoggedAsync is used
        const hasUseLoggedAsync = /useLoggedAsync/.test(fileText);
        const hasRunLoggedAsync = /runLoggedAsync/.test(fileText);

        return {
          'Program:exit'() {
            if (hasAsyncOperations && !hasUseLoggedAsync && !hasRunLoggedAsync) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'useLoggedAsync',
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
        const fileText = sourceCode.getText();

        // Only apply to server action files
        const isServerActionFile =
          (filename.includes('/actions/') || filename.includes('action')) &&
          fileText.includes("'use server'") &&
          !filename.includes('.test.') &&
          !filename.includes('.spec.');

        if (!isServerActionFile) {
          return {};
        }

        // Check if safe-action middleware is used
        const hasSafeAction =
          fileText.includes('authedAction') ||
          fileText.includes('optionalAuthAction') ||
          fileText.includes('rateLimitedAction') ||
          fileText.includes('actionClient');

        // Check for exported async functions that look like server actions
        const hasExportedAsyncFunction = /export\s+(async\s+function|const\s+\w+\s*=\s*async)/.test(fileText);

        return {
          'Program:exit'() {
            if (hasExportedAsyncFunction && !hasSafeAction) {
              context.report({
                node: context.sourceCode.ast,
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
        const fileText = sourceCode.getText();

        // Only apply to server action files
        const isServerActionFile =
          (filename.includes('/actions/') || filename.includes('action')) &&
          fileText.includes("'use server'") &&
          !filename.includes('.test.') &&
          !filename.includes('.spec.');

        if (!isServerActionFile) {
          return {};
        }

        // Check for direct database access patterns
        const hasDirectAccess =
          /supabase\.(from|rpc)\(/.test(fileText) ||
          /\.from\(/.test(fileText) ||
          /\.rpc\(/.test(fileText);

        // Check if data layer services are used
        const hasDataLayer =
          fileText.includes('Service') ||
          fileText.includes('ContentService') ||
          fileText.includes('AccountService') ||
          fileText.includes('SearchService') ||
          fileText.includes('JobsService');

        return {
          'Program:exit'() {
            if (hasDirectAccess && !hasDataLayer) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'useDataLayer',
              });
            }
          },
        };
      },
    },
    'require-edge-logging': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure edge functions use proper logging. Prefer logError/logInfo/logWarn from @heyclaude/shared-runtime or logger from @heyclaude/edge-runtime. Do not use logger from @heyclaude/web-runtime/core.',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useEdgeLogging:
            'Edge functions must use logError/logInfo/logWarn from @heyclaude/shared-runtime OR logger from @heyclaude/edge-runtime. Do not use logger from @heyclaude/web-runtime/core.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only apply to edge function files
        const isEdgeFunction = filename.includes('apps/edge/functions');

        if (!isEdgeFunction) {
          return {};
        }

        // Check if logger is imported from web-runtime/core (should not be - this is server-only)
        const hasWebRuntimeCoreLogger =
          fileText.includes("from '@heyclaude/web-runtime/core'") &&
          fileText.includes('logger');

        // Check if proper edge logging is used (either helpers from shared-runtime OR logger from edge-runtime)
        const hasSharedRuntimeHelpers =
          (fileText.includes("from '@heyclaude/shared-runtime'") ||
           fileText.includes('from "@heyclaude/shared-runtime"')) &&
          (fileText.includes('logError') || fileText.includes('logInfo') || fileText.includes('logWarn'));
        
        const hasEdgeRuntimeLogger =
          (fileText.includes("from '@heyclaude/edge-runtime'") ||
           fileText.includes('from "@heyclaude/edge-runtime"')) &&
          fileText.includes('logger');

        return {
          'Program:exit'() {
            // Only flag if using web-runtime/core logger without proper edge logging alternatives
            if (hasWebRuntimeCoreLogger && !hasSharedRuntimeHelpers && !hasEdgeRuntimeLogger) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'useEdgeLogging',
              });
            }
          },
        };
      },
    },
    'enforce-message-first-logger-api': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce message-first API for logger calls (message, context) instead of object-first (context, message)',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useMessageFirst:
            'Logger calls must use message-first API: logger.{method}(message, context). Found object-first pattern: logger.{method}(context, message).',
          invalidFirstArg:
            'First argument to logger.{method} must be a string (message). Found: {type}',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Only apply to packages that should use message-first API
        // Skip data-layer for now (will be fixed separately)
        const shouldEnforce = 
          filename.includes('packages/web-runtime') ||
          filename.includes('packages/shared-runtime') ||
          filename.includes('packages/edge-runtime') ||
          filename.includes('packages/generators') ||
          filename.includes('apps/edge/functions') ||
          filename.includes('apps/web');

        // Skip data-layer (will be fixed separately)
        if (filename.includes('packages/data-layer')) {
          return {};
        }

        if (!shouldEnforce) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check if this is a logger.{method} call
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              (node.callee.property.name === 'info' ||
                node.callee.property.name === 'error' ||
                node.callee.property.name === 'warn' ||
                node.callee.property.name === 'debug' ||
                node.callee.property.name === 'trace' ||
                node.callee.property.name === 'fatal')
            ) {
              const method = node.callee.property.name;
              const args = node.arguments;

              if (args.length === 0) {
                return; // No args - skip (might be valid for some cases)
              }

              const firstArg = args[0];
              const secondArg = args.length > 1 ? args[1] : null;

              // Check if first argument is an object (object-first pattern - BAD)
              if (
                firstArg.type === 'ObjectExpression' ||
                (firstArg.type === 'Identifier' && 
                 !sourceCode.getText(firstArg).startsWith('"') && 
                 !sourceCode.getText(firstArg).startsWith("'"))
              ) {
                // Check if second argument is a string (message) - this is object-first pattern
                const secondArgText = secondArg ? sourceCode.getText(secondArg) : '';
                const isSecondArgString = 
                  secondArg && 
                  (secondArg.type === 'Literal' && typeof secondArg.value === 'string') ||
                  (secondArgText.startsWith('"') || secondArgText.startsWith("'"));

                if (isSecondArgString) {
                  // This is object-first pattern: logger.method(context, message)
                  context.report({
                    node: firstArg,
                    messageId: 'useMessageFirst',
                    data: { method },
                  });
                  return;
                }
              }

              // Check if first argument is NOT a string (message) - this is invalid
              const firstArgText = sourceCode.getText(firstArg);
              const isFirstArgString = 
                (firstArg.type === 'Literal' && typeof firstArg.value === 'string') ||
                firstArgText.startsWith('"') ||
                firstArgText.startsWith("'");

              if (!isFirstArgString && firstArg.type !== 'TemplateLiteral') {
                // First arg is not a string - this might be object-first or invalid
                // But allow if it's a variable that might be a string (we can't determine at lint time)
                // Only report if it's clearly an object
                if (firstArg.type === 'ObjectExpression' || 
                    firstArg.type === 'ArrayExpression' ||
                    (firstArg.type === 'Identifier' && 
                     !firstArgText.match(/^['"]/))) {
                  // Check if there's a second arg that's a string - this confirms object-first
                  if (secondArg) {
                    const secondArgText = sourceCode.getText(secondArg);
                    const isSecondArgString = 
                      (secondArg.type === 'Literal' && typeof secondArg.value === 'string') ||
                      secondArgText.startsWith('"') ||
                      secondArgText.startsWith("'");
                    
                    if (isSecondArgString) {
                      context.report({
                        node: firstArg,
                        messageId: 'useMessageFirst',
                        data: { method },
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
    'require-await-log-error': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require await for logError() calls in async functions',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
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
          'baseLogContext',
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
    'require-edge-init-request-logging': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Edge functions must call initRequestLogging() at handler entry',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingInitRequestLogging:
            'Edge function handlers must call initRequestLogging(logContext) at the start of the handler to set bindings and trace request entry.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only apply to edge function files
        const isEdgeFunction = filename.includes('apps/edge/functions');

        if (!isEdgeFunction) {
          return {};
        }

        // Check if file exports a handler function (GET, POST, etc.)
        const hasHandlerExport = 
          /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/.test(fileText) ||
          /export\s+(const|let|var)\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/.test(fileText) ||
          /export\s*\{\s*(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/.test(fileText);

        if (!hasHandlerExport) {
          return {}; // Not a handler file
        }

        // Check if initRequestLogging is imported
        const hasInitRequestLoggingImport = 
          fileText.includes('initRequestLogging') &&
          (fileText.includes("from '@heyclaude/edge-runtime'") ||
           fileText.includes('from "@heyclaude/edge-runtime"'));

        // Check if initRequestLogging is called
        const hasInitRequestLoggingCall = /initRequestLogging\s*\(/.test(fileText);

        return {
          'Program:exit'() {
            if (hasHandlerExport && hasInitRequestLoggingImport && !hasInitRequestLoggingCall) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'missingInitRequestLogging',
              });
            }
          },
        };
      },
    },
    'require-edge-trace-request-complete': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Edge functions must call traceRequestComplete() before returning success responses',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingTraceRequestComplete:
            'Edge function handlers should call traceRequestComplete(logContext) before returning successful responses for consistent tracing.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only apply to edge function files
        const isEdgeFunction = filename.includes('apps/edge/functions');

        if (!isEdgeFunction) {
          return {};
        }

        // Check if file has handler exports
        const hasHandlerExport = 
          /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/.test(fileText) ||
          /export\s+(const|let|var)\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/.test(fileText);

        if (!hasHandlerExport) {
          return {};
        }

        // Check if traceRequestComplete is imported
        const hasTraceRequestCompleteImport = 
          fileText.includes('traceRequestComplete') &&
          (fileText.includes("from '@heyclaude/edge-runtime'") ||
           fileText.includes('from "@heyclaude/edge-runtime"'));

        // Check if traceRequestComplete is called
        const hasTraceRequestCompleteCall = /traceRequestComplete\s*\(/.test(fileText);

        // Check if there are return statements (suggesting success paths)
        const hasReturnStatements = /return\s+(new\s+)?Response/.test(fileText);

        return {
          'Program:exit'() {
            if (
              hasHandlerExport &&
              hasTraceRequestCompleteImport &&
              hasReturnStatements &&
              !hasTraceRequestCompleteCall
            ) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'missingTraceRequestComplete',
              });
            }
          },
        };
      },
    },
    'require-error-normalization': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Errors must be normalized using normalizeError() before logging',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useNormalizeError:
            'Errors must be normalized using normalizeError(error, fallback?) before logging. Use: const normalized = normalizeError(error, "fallback message"); await logError("message", logContext, normalized);',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Skip edge functions - they use logError which handles errors differently
        if (filename.includes('apps/edge/functions')) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check if this is a logger.error call with an error argument
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              node.callee.property.name === 'error'
            ) {
              // Check if error is passed directly (not normalized)
              const args = node.arguments;
              
              // logger.error(message, error, context) or logger.error(message, context) with error in context
              if (args.length >= 2) {
                const errorArg = args[1];
                const contextArg = args.length > 2 ? args[2] : args[1];

                // Check if error is passed directly (not via normalizeError)
                if (errorArg && errorArg.type === 'Identifier') {
                  const errorVarName = errorArg.name;
                  const surroundingText = sourceCode.getText(node.parent || node);
                  
                  // Check if this error variable was normalized
                  const isNormalized = 
                    surroundingText.includes(`normalizeError(${errorVarName}`) ||
                    surroundingText.includes(`normalized`) ||
                    errorVarName === 'normalized';

                  if (!isNormalized && errorVarName !== 'normalized') {
                    // Check if it's an Error object or unknown
                    context.report({
                      node: errorArg,
                      messageId: 'useNormalizeError',
                    });
                  }
                }

                // Check if context contains err key with unnormalized error
                if (contextArg && contextArg.type === 'ObjectExpression') {
                  const errProperty = contextArg.properties.find(
                    (prop) =>
                      prop.type === 'Property' &&
                      prop.key.type === 'Identifier' &&
                      prop.key.name === 'err'
                  );

                  if (errProperty && errProperty.value.type === 'Identifier') {
                    const errVarName = errProperty.value.name;
                    const surroundingText = sourceCode.getText(node.parent || node);
                    const isNormalized = 
                      surroundingText.includes(`normalizeError(${errVarName}`) ||
                      errVarName === 'normalized';

                    if (!isNormalized && errVarName !== 'normalized') {
                      context.report({
                        node: errProperty.value,
                        messageId: 'useNormalizeError',
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
    'require-logger-bindings-for-context': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer using logger.setBindings() for request-scoped context instead of passing in every log call',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useBindings:
            'Use logger.setBindings({ {field} }) at request start instead of passing {field} in every log call. Bindings are automatically injected via mixin.',
          missingModule:
            'logger.setBindings() should include module field for better traceability. Add module: "path/to/module" to bindings.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only suggest for edge functions and server-side code
        const isServerCode =
          filename.includes('apps/edge/functions') ||
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts');

        if (!isServerCode) {
          return {};
        }

        // Track common context fields that should be in bindings
        const bindingFields = ['requestId', 'operation', 'module', 'function', 'userId', 'method', 'route'];

        // Track if setBindings or child logger is used
        const hasSetBindings = /logger\.setBindings\s*\(/.test(fileText);
        const hasChildLogger = /logger\.child\s*\(/.test(fileText);
        const hasChildLoggerVariable = /(reqLogger|userLogger|actionLogger|metadataLogger|viewerLogger|processLogger|callbackLogger|requestLogger|utilityLogger)\s*=/.test(fileText);

        return {
          CallExpression(node) {
            // Check logger.setBindings() calls for module field
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'setBindings'
            ) {
              if (node.arguments.length > 0 && node.arguments[0].type === 'ObjectExpression') {
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
              return;
            }

            // Check logger calls (only base logger, not child loggers)
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
              const contextArg = args[args.length - 1];

              // Skip if child logger is used (either via logger.child() or child logger variables)
              if (contextArg && contextArg.type === 'ObjectExpression' && !hasSetBindings && !hasChildLogger && !hasChildLoggerVariable) {
                // Check if context contains fields that should be in bindings
                contextArg.properties.forEach((prop) => {
                  if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                    const keyName = prop.key.name;
                    if (bindingFields.includes(keyName)) {
                      context.report({
                        node: prop,
                        messageId: 'useBindings',
                        data: { field: keyName },
                      });
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
        const fileText = sourceCode.getText();

        // Only apply to edge function files
        const isEdgeFunction = filename.includes('apps/edge/functions');

        if (!isEdgeFunction) {
          return {};
        }

        // Check if helper functions are imported
        const hasHelperImports =
          (fileText.includes("from '@heyclaude/shared-runtime'") ||
           fileText.includes('from "@heyclaude/shared-runtime"')) &&
          (fileText.includes('logError') ||
           fileText.includes('logInfo') ||
           fileText.includes('logWarn') ||
           fileText.includes('logTrace'));

        // Check if logger is from edge-runtime (acceptable alternative)
        const hasEdgeRuntimeLogger =
          (fileText.includes("from '@heyclaude/edge-runtime'") ||
           fileText.includes('from "@heyclaude/edge-runtime"')) &&
          fileText.includes('logger');

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
    'no-console-in-production-enhanced': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent console.* calls in favor of structured logging with Pino',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code', // Enable auto-fix for console.* → logger.* replacements
        schema: [],
        messages: {
          useStructuredLogging:
            'console.{method} is not allowed. Use logger.{method} or helper functions (logError, logInfo, logWarn, logTrace) with proper logContext instead.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Skip test files, build scripts, and config files
        if (
          filename.includes('.test.') ||
          filename.includes('.spec.') ||
          filename.includes('.config.') ||
          filename.includes('scripts/') ||
          filename.includes('bin/') ||
          filename.includes('eslint-plugin')
        ) {
          return {};
        }

        // Determine if this is a client or server file
        const isClientComponent =
          fileText.includes("'use client'") || fileText.includes('"use client"');
        const isServerCode =
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts') ||
          (!isClientComponent && (filename.includes('apps/web/src') || filename.includes('packages/web-runtime/src')));

        // Determine correct import path
        const loggerImportPath = isClientComponent
          ? '@heyclaude/web-runtime/logging/client'
          : '@heyclaude/web-runtime/logging/server';

        // Check if logger is already imported
        const hasLoggerImport = 
          (fileText.includes('import') && fileText.includes('logger') && 
           (fileText.includes('@heyclaude/web-runtime/logging/') || 
            fileText.includes('@heyclaude/shared-runtime') ||
            fileText.includes('@heyclaude/web-runtime/core'))) ||
          fileText.includes('from') && fileText.includes('logger');

        // Map console methods to logger methods
        const methodMap = {
          log: 'info',
          error: 'error',
          warn: 'warn',
          info: 'info',
          debug: 'debug',
        };

        // Allow console.error in logError flush callback (it's a last resort)
        const isInFlushCallback = (node) => {
          let parent = node.parent;
          while (parent) {
            if (
              parent.type === 'CallExpression' &&
              parent.callee.type === 'MemberExpression' &&
              parent.callee.property.name === 'flush'
            ) {
              return true;
            }
            parent = parent.parent;
          }
          return false;
        };

        return {
          'CallExpression[callee.object.name="console"]'(node) {
            const method = node.callee.property?.name;
            if (method === 'log' || method === 'error' || method === 'warn' || method === 'info' || method === 'debug') {
              // Allow console.error in flush callback (last resort error handling)
              if (method === 'error' && isInFlushCallback(node)) {
                return;
              }

              const loggerMethod = methodMap[method];

              context.report({
                node,
                messageId: 'useStructuredLogging',
                data: { method },
                fix(fixer) {
                  const fixes = [];

                  // Replace console.{method} with logger.{method}
                  // Only replace the object part (console -> logger), preserve the property
                  if (node.callee.type === 'MemberExpression' && node.callee.object.type === 'Identifier') {
                    fixes.push(fixer.replaceText(node.callee.object, 'logger'));
                  } else {
                    // Fallback: replace entire callee
                    const consoleCall = sourceCode.getText(node.callee);
                    const loggerCall = consoleCall.replace('console', 'logger');
                    fixes.push(fixer.replaceText(node.callee, loggerCall));
                  }

                  // Add logger import if missing
                  if (!hasLoggerImport) {
                    // Find the last import statement
                    const ast = sourceCode.ast;
                    let lastImport = null;
                    for (const statement of ast.body) {
                      if (statement.type === 'ImportDeclaration') {
                        lastImport = statement;
                      }
                    }

                    if (lastImport) {
                      // Add import after the last import
                      const importText = `import { logger } from '${loggerImportPath}';`;
                      fixes.push(fixer.insertTextAfter(lastImport, `\n${importText}`));
                    } else {
                      // Add at the top of the file
                      fixes.push(fixer.insertTextAfterRange([0, 0], `import { logger } from '${loggerImportPath}';\n`));
                    }
                  }

                  return fixes;
                },
              });
            }
          },
        };
      },
    },
    'detect-missing-rpc-error-logging': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detect RPC calls without error logging (missing logRpcError or withRpcErrorLogging)',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingRpcErrorLogging:
            'RPC call at line {line} is missing error logging. Use logRpcError(error, { rpcName, operation, args }) or wrap with withRpcErrorLogging().',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only apply to data-layer services
        if (!filename.includes('packages/data-layer/src/services')) {
          return {};
        }

        // Track RPC calls and their error handling
        const rpcCalls = [];

        return {
          CallExpression(node) {
            // Detect supabase.rpc() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'MemberExpression' &&
              node.callee.object.property.type === 'Identifier' &&
              (node.callee.object.property.name === 'supabase' ||
                node.callee.object.property.name === 'client') &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'rpc'
            ) {
              // Extract RPC name
              const rpcNameArg = node.arguments[0];
              let rpcName = 'unknown';
              if (rpcNameArg && rpcNameArg.type === 'Literal' && typeof rpcNameArg.value === 'string') {
                rpcName = rpcNameArg.value;
              }

              // Check if this RPC call has error logging in surrounding code
              const surroundingText = sourceCode.getText(node.parent?.parent || node.parent || node);
              const hasErrorLogging =
                surroundingText.includes('logRpcError') ||
                surroundingText.includes('withRpcErrorLogging') ||
                surroundingText.includes('logger.error') ||
                surroundingText.includes('logError');

              rpcCalls.push({
                node,
                rpcName,
                hasErrorLogging,
              });
            }
          },
          'Program:exit'() {
            // Check each RPC call for error logging
            rpcCalls.forEach(({ node, rpcName, hasErrorLogging }) => {
              if (!hasErrorLogging) {
                // Check if it's in a try-catch or has error handling
                let parent = node.parent;
                let inTryCatch = false;
                let hasErrorCheck = false;

                while (parent) {
                  if (parent.type === 'TryStatement') {
                    inTryCatch = true;
                    // Check if catch block has logging
                    if (parent.handler?.body) {
                      const catchBodyText = sourceCode.getText(parent.handler.body);
                      if (
                        catchBodyText.includes('logRpcError') ||
                        catchBodyText.includes('logger.error') ||
                        catchBodyText.includes('logError')
                      ) {
                        hasErrorLogging = true;
                      }
                    }
                    break;
                  }
                  // Check for error handling pattern: if (error) { ... }
                  if (
                    parent.type === 'IfStatement' &&
                    parent.test &&
                    sourceCode.getText(parent.test).includes('error')
                  ) {
                    const ifBodyText = sourceCode.getText(parent.consequent);
                    if (
                      ifBodyText.includes('logRpcError') ||
                      ifBodyText.includes('logger.error') ||
                      ifBodyText.includes('logError')
                    ) {
                      hasErrorLogging = true;
                    }
                  }
                  parent = parent.parent;
                }

                if (!hasErrorLogging) {
                  context.report({
                    node,
                    messageId: 'missingRpcErrorLogging',
                    data: { line: node.loc?.start.line || 'unknown' },
                  });
                }
              }
            });
          },
        };
      },
    },
    'detect-missing-edge-logging-setup': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detect edge function handlers missing proper logging setup (logContext creation, initRequestLogging, traceRequestComplete). Note: initRequestLogging() internally calls logger.setBindings(), so setBindings is handled automatically.',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingInitRequestLogging:
            'Edge function handler is missing initRequestLogging() call. Add: initRequestLogging(logContext) at handler start. This will automatically set logger bindings.',
          missingSetBindings:
            'Edge function handler is missing logger.setBindings() call. Add: logger.setBindings({ requestId, operation, function }) after initRequestLogging. (Note: initRequestLogging() internally calls setBindings, so prefer using initRequestLogging).',
          missingTraceRequestComplete:
            'Edge function handler is missing traceRequestComplete() call before success response. Add: traceRequestComplete(logContext) before returning.',
          missingLogContextCreation:
            'Edge function handler is missing logContext creation. Add: const logContext = create{Service}Context(...) at handler start.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only apply to edge function files
        const isEdgeFunction = filename.includes('apps/edge/functions');

        if (!isEdgeFunction) {
          return {};
        }

        // Check if file exports a handler function
        const hasHandlerExport =
          /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/.test(fileText) ||
          /export\s+(const|let|var)\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/.test(fileText) ||
          /export\s*\{\s*(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/.test(fileText);

        if (!hasHandlerExport) {
          return {}; // Not a handler file
        }

        // Check for required logging setup
        const hasInitRequestLogging = /initRequestLogging\s*\(/.test(fileText);
        // Note: initRequestLogging() internally calls logger.setBindings(), so we don't need to check for setBindings separately
        const hasSetBindings = /logger\.setBindings\s*\(/.test(fileText);
        const hasTraceRequestComplete = /traceRequestComplete\s*\(/.test(fileText);
        const hasLogContextCreation =
          /createEmailHandlerContext|createDataApiContext|createSearchContext|createTransformApiContext|createUtilityContext|createNotificationRouterContext|createChangelogHandlerContext|createWebAppContext/.test(
            fileText
          );

        return {
          'Program:exit'() {
            if (hasHandlerExport) {
              if (!hasLogContextCreation) {
                context.report({
                  node: context.sourceCode.ast,
                  messageId: 'missingLogContextCreation',
                });
              } else if (!hasInitRequestLogging) {
                context.report({
                  node: context.sourceCode.ast,
                  messageId: 'missingInitRequestLogging',
                });
                // Note: We don't check for setBindings separately because initRequestLogging() 
                // internally calls logger.setBindings(). If initRequestLogging is missing, 
                // we've already reported that. If it's present, setBindings is handled.
              }

              // Check for success responses (return new Response with 200-299 status)
              const hasSuccessResponse = /return\s+(new\s+)?Response/.test(fileText);
              if (hasSuccessResponse && !hasTraceRequestComplete) {
                context.report({
                  node: context.sourceCode.ast,
                  messageId: 'missingTraceRequestComplete',
                });
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

        return {
          'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
            const isAsync = node.async === true;
            const functionName = node.id?.name || 'anonymous';

            // Skip if it's a simple getter or very short function
            const functionText = sourceCode.getText(node);
            if (functionText.length < 100) {
              return; // Too short to require logging
            }

            // Check if function has async operations
            const hasAsyncOps = /await\s+/.test(functionText);

            // Check if function has error logging
            // Note: logger.warn in catch blocks is also valid error logging (for fallback scenarios)
            // Also check for child logger patterns (reqLogger.error, userLogger.warn, etc.)
            const hasErrorLogging =
              functionText.includes('logError') ||
              functionText.includes('logger.error') ||
              functionText.includes('logger.warn') ||
              /(reqLogger|userLogger|actionLogger|metadataLogger|viewerLogger|processLogger|callbackLogger|requestLogger)\.(error|warn)/.test(functionText) ||
              functionText.includes('logRpcError') ||
              functionText.includes('withRpcErrorLogging');

            // Check if function has try-catch
            const hasTryCatch = /try\s*\{/.test(functionText);

            // For service methods, check for database operations
            const hasDbOps =
              functionText.includes('.rpc(') ||
              functionText.includes('.from(') ||
              functionText.includes('supabase.') ||
              functionText.includes('db.');

            if (isAsync && hasAsyncOps && !hasErrorLogging && hasTryCatch) {
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
            'Logger call is missing required context fields. Ensure logContext includes: {fields}. If using bindings, ensure logger.setBindings() was called.',
          incompleteContext:
            'Logger call has incomplete context. Add missing fields: {fields} or use logger.setBindings() to set them globally.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Skip client components - they can't use server-only generateRequestId
        // Check for 'use client' directive at the top of the file
        // Also skip client-side utilities like draft-manager (uses localStorage)
        // Skip marketing/contact.ts - module-level initialization, not request context
        const isClientComponent =
          filename.includes('error.tsx') ||
          filename.includes('wizard') ||
          filename.includes('draft-manager') ||
          filename.includes('marketing/contact') ||
          fileText.includes("'use client'") ||
          fileText.includes('"use client"') ||
          fileText.includes('localStorage');

        // Required context fields (if not using bindings)
        // NOTE: With bindings, these are auto-injected, so we only check if bindings are missing
        const requiredFields = ['requestId', 'operation'];
        const recommendedFields = ['module', 'function', 'userId'];

        // Check if setBindings is used in the file (more flexible regex to catch various formats)
        const hasSetBindings = /logger\.setBindings\s*\(/.test(fileText);
        
        // Check if child logger is used (logger.child() pattern)
        // Matches: logger.child({...}) or const reqLogger = logger.child({...})
        const hasChildLogger = /logger\.child\s*\(/.test(fileText) || /const\s+\w+Logger\s*=\s*logger\.child/.test(fileText);
        
        // Check if logger calls use child logger variables (reqLogger, userLogger, actionLogger, etc.)
        const hasChildLoggerUsage = /\b(reqLogger|userLogger|actionLogger|metadataLogger|viewerLogger|processLogger|callbackLogger)\.(info|error|warn|debug)/.test(fileText);
        
        // Check if bindings include module field (flexible regex - matches module: value, module, or module = value)
        // Matches: module: 'value', module, (shorthand), or module = 'value'
        const hasModuleInBindings = /logger\.setBindings\s*\([\s\S]*?\bmodule\s*[:=,}]/.test(fileText);
        const hasModuleInChildLogger = /logger\.child\s*\([\s\S]*?\bmodule\s*[:=,}]/.test(fileText);

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

              // If using bindings or child logger, context can be minimal - skip all context field checks
              // The require-module-in-bindings rule will check if module is in bindings
              if (hasSetBindings || hasChildLogger || hasChildLoggerUsage || isChildLoggerCall) {
                return; // Bindings/child loggers handle required fields - no need to check context objects
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
                if (!hasSetBindings) {
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
            'createWebAppContextWithId() usage detected. Prefer logger.setBindings() at request start instead. Use: logger.setBindings({ requestId, operation, module, route }) and remove createWebAppContextWithId() calls.',
          coreImportForLogging:
            'Logging utilities imported from @heyclaude/web-runtime/core. Use barrel exports instead: @heyclaude/web-runtime/logging/server (server-side) or @heyclaude/web-runtime/logging/client (client-side).',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Skip config files
        if (filename.includes('logger/config') || filename.includes('eslint-plugin')) {
          return {};
        }

        // Determine correct barrel export path
        const isClientComponent =
          fileText.includes("'use client'") || fileText.includes('"use client"');
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
              // Skip client components - they shouldn't use setBindings() for request context
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

                      // Build setBindings call
                      const bindingsProps = [
                        `requestId: ${requestIdArg}`,
                        `operation: ${operationArg}`,
                        `route: ${routeArg}`,
                      ];
                      if (moduleValue) {
                        bindingsProps.push(`module: ${moduleValue}`);
                      }
                      const setBindingsCall = `logger.setBindings({ ${bindingsProps.join(', ')} });`;

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
                            fixes.push(fixer.insertTextBefore(body.body[0], `${setBindingsCall}\n  `));
                          } else {
                            // Empty block: insert after opening brace
                            fixes.push(fixer.insertTextAfter(body, `\n  ${setBindingsCall}\n`));
                          }
                        } else {
                          // Expression body (arrow function): convert to block or insert before
                          // For safety, we'll insert before the expression
                          fixes.push(fixer.insertTextBefore(body, `${setBindingsCall}\n  `));
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
            'API route is missing logger.setBindings() or logger.child() setup. Add: const reqLogger = logger.child({ requestId, operation, module, route }) at route start.',
          missingRequestLogging:
            'API route is missing request logging. Add logger.info() calls for request entry and completion.',
          missingErrorLogging:
            'API route has error handling but missing error logging. Add logger.error() with normalizeError() in error paths.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Only apply to API route files
        const isApiRoute =
          (filename.includes('/app/api/') && filename.endsWith('route.ts')) ||
          (filename.includes('/api/') && filename.endsWith('route.ts'));

        if (!isApiRoute) {
          return {};
        }

        // Check for required logging setup (setBindings or child logger)
        const hasBindings = /logger\.setBindings\s*\(/.test(fileText);
        const hasChildLogger = /logger\.child\s*\(/.test(fileText) || /const\s+\w+Logger\s*=\s*logger\.child/.test(fileText);
        const hasRequestLogging =
          fileText.includes('logger.info') ||
          /(reqLogger|userLogger|actionLogger|metadataLogger|viewerLogger|processLogger|callbackLogger)\.(info|debug)/.test(fileText) ||
          fileText.includes('logInfo') ||
          fileText.includes('logger.debug') ||
          fileText.includes('logTrace');
        const hasErrorLogging =
          fileText.includes('logger.error') ||
          /(reqLogger|userLogger|actionLogger|metadataLogger|viewerLogger|processLogger|callbackLogger)\.(error|warn)/.test(fileText) ||
          fileText.includes('logError') ||
          fileText.includes('logger.warn') ||
          fileText.includes('logWarn');
        const hasErrorHandling = fileText.includes('try') || fileText.includes('catch');
        const hasNormalizeError = fileText.includes('normalizeError');

        return {
          'Program:exit'() {
            if (!hasBindings && !hasChildLogger) {
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
        const fileText = sourceCode.getText();

        const isClientComponent =
          fileText.includes("'use client'") || fileText.includes('"use client"');
        const isServerCode =
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts') ||
          (!isClientComponent && (filename.includes('apps/web/src') || filename.includes('packages/web-runtime/src')));

        // Determine correct barrel export path
        const correctBarrelPath = isClientComponent
          ? '@heyclaude/web-runtime/logging/client'
          : '@heyclaude/web-runtime/logging/server';

        // Check if logging utilities are already imported from barrel
        const hasBarrelImport = fileText.includes('@heyclaude/web-runtime/logging/');

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
                // But flag if it's being used directly in server code
                const hasClientLoggerUsage =
                  fileText.includes('useClientLogger') ||
                  fileText.includes('logClientError') ||
                  fileText.includes('logClientWarn');
                
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
          description: 'Require module field in logger.setBindings() calls for better traceability',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingModule:
            'logger.setBindings() must include module field. Add module: "path/to/module" to bindings for better traceability.',
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
        fixable: 'code', // Enable auto-fix for simple cases
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
        const fileText = sourceCode.getText();

        // Determine if this is a client or server file
        const isClientComponent =
          fileText.includes("'use client'") || fileText.includes('"use client"');
        const isServerCode =
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts') ||
          (!isClientComponent && (filename.includes('apps/web/src') || filename.includes('packages/web-runtime/src')));

        // Determine correct import path
        const hashUserIdImportPath = isClientComponent
          ? '@heyclaude/web-runtime/logging/client'
          : '@heyclaude/web-runtime/logging/server';

        // Check if hashUserId is already imported
        const hasHashUserIdImport = fileText.includes('hashUserId') && 
          (fileText.includes('@heyclaude/web-runtime/logging/') || 
           fileText.includes('@heyclaude/shared-runtime') ||
           fileText.includes('@heyclaude/web-runtime/core'));

        return {
          CallExpression(node) {
            // Check logger calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              (node.callee.property.name === 'info' ||
                node.callee.property.name === 'error' ||
                node.callee.property.name === 'warn' ||
                node.callee.property.name === 'debug')
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
                    isInChildLogger = true;
                    break;
                  }
                  parent = parent.parent;
                }

                // Allow userId: user.id in logger.child() calls - redaction automatically hashes it
                if (isInChildLogger) {
                  return; // No error - redaction handles it
                }

                // Check if this is in a logger call context (info, error, warn, debug)
                let isInLoggerCall = false;
                parent = node.parent;
                while (parent) {
                  if (
                    parent.type === 'CallExpression' &&
                    parent.callee.type === 'MemberExpression' &&
                    parent.callee.object.type === 'Identifier' &&
                    parent.callee.object.name === 'logger' &&
                    parent.callee.property.type === 'Identifier' &&
                    (parent.callee.property.name === 'info' ||
                     parent.callee.property.name === 'error' ||
                     parent.callee.property.name === 'warn' ||
                     parent.callee.property.name === 'debug')
                  ) {
                    isInLoggerCall = true;
                    break;
                  }
                  parent = parent.parent;
                }

                // Allow in logger calls too - redaction handles it
                if (isInLoggerCall && node.parent?.type === 'ObjectExpression') {
                  return; // No error - redaction automatically hashes userId fields
                }

                // For other contexts, report but don't auto-fix (complex cases)
                context.report({
                  node: node.key,
                  messageId: 'rawUserIdInContext',
                });
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
          description: 'Prefer logger.child() over logger.setBindings() to avoid race conditions in concurrent environments (Next.js). Edge functions (Deno) can use setBindings() safely since each request is isolated.',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          useChildLogger:
            'Use logger.child() instead of logger.setBindings() to avoid race conditions. Replace "logger.setBindings({...})" with "const reqLogger = logger.child({...})" and use reqLogger for all subsequent log calls.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();

        // Edge functions (Deno) are safe to use setBindings() - each request is isolated
        // Next.js Server Components/API Routes must use child() to avoid race conditions
        const isEdgeFunction = filename.includes('apps/edge/functions');
        
        if (isEdgeFunction) {
          // Allow setBindings() in edge functions - they're safe in Deno's isolated execution model
          return {};
        }

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
                  const bindingsText = sourceCode.getText(node.arguments[0]);
                  
                  // Replace logger.setBindings({...}) with const reqLogger = logger.child({...})
                  const replacement = `const reqLogger = logger.child(${bindingsText})`;
                  
                  return fixer.replaceText(node, replacement);
                },
              });
            }
          },
        };
      },
    },
  },
};
