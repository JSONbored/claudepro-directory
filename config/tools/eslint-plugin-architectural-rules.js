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

              if (!contextArg || contextArg.type !== 'ObjectExpression') {
                // No context object provided - this is a violation
                context.report({
                  node,
                  messageId: 'missingRequestId',
                });
                return;
              }

              // Check if context object has requestId and operation
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
            if (!node.body || node.body.body.length === 0) {
              context.report({
                node,
                messageId: 'emptyCatchBlock',
              });
              return;
            }

            const catchBodyText = sourceCode.getText(node.body);

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

            if (!(hasLoggerError || usesErrorHandler || isRethrow || isPromiseCatch)) {
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
  },
};
