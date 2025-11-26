/**
 * ESLint plugin for architectural rules
 * Enforces requestId in logger calls and standardized error handling
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
            'logger.error/warn calls must include requestId: generateRequestId() and operation: "functionName" in the context object',
          missingOperation:
            'logger.error/warn calls must include operation: "functionName" in the context object',
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

        return {
          CallExpression(node) {
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
              // Find the context argument (usually the 3rd argument for error, 2nd for warn)
              const contextArg = node.arguments[node.arguments.length - 1];

              if (!contextArg) {
                // No context object provided - this is a violation
                context.report({
                  node,
                  messageId: 'missingRequestId',
                });
                return;
              }

              // Check if context is a variable reference (logContext, baseLogContext, etc.)
              // These are created via createWebAppContextWithId which includes requestId and operation
              const isLogContextVariable =
                contextArg.type === 'Identifier' &&
                (contextArg.name === 'logContext' ||
                  contextArg.name === 'baseLogContext' ||
                  contextArg.name === 'actionLogContext' ||
                  contextArg.name === 'metadataLogContext' ||
                  contextArg.name === 'staticParamsLogContext' ||
                  contextArg.name === 'utilityLogContext');

              // Check if context uses spread syntax with logContext (e.g., { ...logContext, ...other })
              const isSpreadLogContext =
                contextArg.type === 'ObjectExpression' &&
                contextArg.properties.some(
                  (prop) =>
                    prop.type === 'SpreadElement' &&
                    prop.argument.type === 'Identifier' &&
                    (prop.argument.name === 'logContext' ||
                      prop.argument.name === 'baseLogContext' ||
                      prop.argument.name === 'actionLogContext' ||
                      prop.argument.name === 'metadataLogContext' ||
                      prop.argument.name === 'staticParamsLogContext' ||
                      prop.argument.name === 'utilityLogContext')
                );

              // Check if context is wrapped in withDuration (e.g., withDuration({ ...baseLogContext }, startTime))
              const isWithDuration =
                contextArg.type === 'CallExpression' &&
                contextArg.callee.type === 'Identifier' &&
                contextArg.callee.name === 'withDuration' &&
                contextArg.arguments.length > 0 &&
                (() => {
                  const firstArg = contextArg.arguments[0];
                  if (firstArg.type === 'ObjectExpression') {
                    // Check if first arg spreads logContext
                    return firstArg.properties.some(
                      (prop) =>
                        prop.type === 'SpreadElement' &&
                        prop.argument.type === 'Identifier' &&
                        (prop.argument.name === 'logContext' ||
                          prop.argument.name === 'baseLogContext' ||
                          prop.argument.name === 'actionLogContext' ||
                          prop.argument.name === 'metadataLogContext' ||
                          prop.argument.name === 'staticParamsLogContext' ||
                          prop.argument.name === 'utilityLogContext')
                    );
                  }
                  if (firstArg.type === 'Identifier') {
                    return (
                      firstArg.name === 'logContext' ||
                      firstArg.name === 'baseLogContext' ||
                      firstArg.name === 'actionLogContext' ||
                      firstArg.name === 'metadataLogContext' ||
                      firstArg.name === 'staticParamsLogContext' ||
                      firstArg.name === 'utilityLogContext'
                    );
                  }
                  return false;
                })();

              // If using logContext variable, spread, or withDuration, it's valid (contains requestId/operation)
              if (isLogContextVariable || isSpreadLogContext || isWithDuration) {
                return; // Valid - logContext contains requestId and operation
              }

              // Check if context object has requestId and operation directly
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

                if (!hasRequestId) {
                  context.report({
                    node: contextArg,
                    messageId: 'missingRequestId',
                  });
                }

                if (!hasOperation) {
                  context.report({
                    node: contextArg,
                    messageId: 'missingOperation',
                  });
                }
              } else {
                // Context is not an object expression and not a logContext variable
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
            "Client components ('use client') cannot import server-only modules. Import from '@heyclaude/web-runtime/data' (client-safe entry point) or pass data as props from Server Components.",
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
              importPath.includes('/data-client')
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

            // Check if catch block contains logger.error call
            const hasLoggerError =
              catchBodyText.includes('logger.error') ||
              catchBodyText.includes('logger.warn') ||
              catchBodyText.includes('logError') ||
              catchBodyText.includes('logWarn');

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
              // Warn if logger.error is used but normalizeError is not
              context.report({
                node: node.body,
                messageId: 'missingErrorLogging',
              });
            } else if (hasLoggerError && !hasLogContext) {
              // Warn if logger.error is used but logContext is not provided
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
            'Require error boundaries to use standardized logging with createWebAppContextWithId and logger.error',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingStandardizedLogging:
            'Error boundaries must use createWebAppContextWithId(requestId, route, operation, options) and logger.error with normalized error. Use generateRequestId() to create requestId.',
          missingRequestId:
            'Error boundaries must generate requestId using generateRequestId() and include it in logContext via createWebAppContextWithId.',
          missingNormalizeError:
            'Error boundaries must normalize errors using normalizeError() before logging.',
          missingLoggerError:
            'Error boundaries must use logger.error() for structured logging (not console.error).',
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

        // Track what we find in the file
        let hasGenerateRequestId = false;
        let hasCreateWebAppContextWithId = false;
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

            // Check for required imports
            if (
              importPath === '@heyclaude/web-runtime/core' ||
              importPath.includes('@heyclaude/web-runtime')
            ) {
              // Check if the import includes the required functions
              if (node.specifiers) {
                for (const specifier of node.specifiers) {
                  if (specifier.type === 'ImportSpecifier') {
                    const importedName = specifier.imported?.name || specifier.imported?.value;
                    if (importedName === 'generateRequestId') {
                      hasGenerateRequestId = true;
                    }
                    if (importedName === 'createWebAppContextWithId') {
                      hasCreateWebAppContextWithId = true;
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
              // Check if it uses the standardized pattern
              const hasStandardPattern =
                /generateRequestId/.test(effectText) &&
                /createWebAppContextWithId/.test(effectText) &&
                /normalizeError/.test(effectText) &&
                /logger\.error/.test(effectText);

              if (!hasStandardPattern) {
                context.report({
                  node,
                  messageId: 'missingStandardizedLogging',
                });
              }
            }
          },

          // Check componentDidCatch in class components
          'MethodDefinition[key.name="componentDidCatch"]'(node) {
            hasComponentDidCatch = true;
            const methodText = sourceCode.getText(node);

            // Check if it uses the standardized pattern
            const hasStandardPattern =
              /generateRequestId/.test(methodText) &&
              /createWebAppContextWithId/.test(methodText) &&
              /normalizeError/.test(methodText) &&
              /logger\.error/.test(methodText);

            if (!hasStandardPattern) {
              context.report({
                node,
                messageId: 'missingStandardizedLogging',
              });
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
              if (!hasGenerateRequestId) {
                context.report({
                  node: context.sourceCode.ast,
                  messageId: 'missingRequestId',
                });
              }
              if (!hasCreateWebAppContextWithId) {
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
            'Server pages should use section-based logging with section: "section-name" in logContext. Example: logger.info("message", withDuration({ ...baseLogContext, section: "data-fetch" }, startTime))',
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
        const hasWithDuration = /withDuration/.test(fileText);

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
    'require-duration-tracking': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure performance-critical operations use withDuration() for tracking',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          missingDurationTracking:
            'Performance-critical operations should track duration using withDuration() or include duration_ms in logContext.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        const fileText = sourceCode.getText();

        // Skip client components and test files
        if (
          fileText.includes("'use client'") ||
          fileText.includes('"use client"') ||
          filename.includes('.test.') ||
          filename.includes('.spec.')
        ) {
          return {};
        }

        // Only apply to server-side files
        const isServerFile =
          filename.includes('/app/') ||
          filename.includes('/api/') ||
          filename.includes('server.ts') ||
          filename.includes('server.tsx');

        if (!isServerFile) {
          return {};
        }

        return {
          // Check logger calls for duration tracking
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'logger' &&
              (node.callee.property.name === 'info' ||
                node.callee.property.name === 'error' ||
                node.callee.property.name === 'warn')
            ) {
              const contextArg = node.arguments[node.arguments.length - 1];
              if (!contextArg) {
                return;
              }

              const contextText = sourceCode.getText(contextArg);
              const hasDuration =
                contextText.includes('duration_ms') ||
                contextText.includes('withDuration') ||
                contextText.includes('sectionDuration_ms');

              // Check if this is a performance-critical operation (data fetch, RPC call, etc.)
              const surroundingText = sourceCode.getText(node.parent || node);
              const isPerformanceCritical =
                surroundingText.includes('await ') &&
                (surroundingText.includes('fetch') ||
                  surroundingText.includes('rpc') ||
                  surroundingText.includes('get') ||
                  surroundingText.includes('select') ||
                  surroundingText.includes('from('));

              if (isPerformanceCritical && !hasDuration) {
                context.report({
                  node: contextArg,
                  messageId: 'missingDurationTracking',
                });
              }
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
          description: 'Ensure edge functions use logError/logInfo/logWarn instead of logger',
          category: 'Best Practices',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          useEdgeLogging:
            'Edge functions must use logError/logInfo/logWarn from @heyclaude/shared-runtime instead of logger from @heyclaude/web-runtime/core.',
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

        // Check if logger is imported from web-runtime (should not be)
        const hasWebRuntimeLogger =
          fileText.includes("from '@heyclaude/web-runtime/core'") &&
          fileText.includes('logger');

        // Check if edge logging is used
        const hasEdgeLogging =
          fileText.includes('logError') || fileText.includes('logInfo') || fileText.includes('logWarn');

        return {
          'Program:exit'() {
            if (hasWebRuntimeLogger && !hasEdgeLogging) {
              context.report({
                node: context.sourceCode.ast,
                messageId: 'useEdgeLogging',
              });
            }
          },
        };
      },
    },
  },
};
