/**
 * Content Validator Wrapper
 *
 * Wraps the existing validate-content.ts script in the unified validator interface
 */

import { execSync } from 'node:child_process';
import type { ValidationOptions, ValidationResult, Validator } from '../core/types';

export class ContentValidatorWrapper implements Validator {
  name = 'content';
  description = 'Validates JSON content files against Zod schemas';
  enabled = true;

  async validate(options: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Run the existing validate-content.ts script
      const output = execSync('tsx scripts/validation/validate-content.ts', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Parse output to detect success/failure
      // The existing script exits with code 0 on success
      const passed = true;
      const filesChecked = this.extractFileCount(output);

      return {
        validator: this.name,
        passed,
        errors: [],
        warnings: [],
        stats: {
          filesChecked,
          issues: 0,
          duration: Date.now() - startTime,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      // Script failed - parse error output
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stderr = (error as { stderr?: Buffer }).stderr?.toString() || errorMessage;

      return {
        validator: this.name,
        passed: false,
        errors: this.parseErrors(stderr),
        warnings: [],
        stats: {
          filesChecked: 0,
          issues: this.parseErrors(stderr).length,
          duration: Date.now() - startTime,
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Extract file count from output
   */
  private extractFileCount(output: string): number {
    // Look for patterns like "198 files validated" or similar
    const match = output.match(/(\d+)\s+(?:files?|items?)\s+(?:validated|checked)/i);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  /**
   * Parse errors from stderr
   */
  private parseErrors(stderr: string): Array<{
    file?: string;
    line?: number;
    message: string;
    severity: 'error' | 'warning';
  }> {
    const errors: Array<{
      file?: string;
      line?: number;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    // Parse error lines
    const lines = stderr.split('\n');
    for (const line of lines) {
      if (line.includes('Error') || line.includes('error')) {
        errors.push({
          message: line.trim(),
          severity: 'error',
        });
      }
    }

    if (errors.length === 0 && stderr.trim()) {
      // Generic error if we can't parse
      errors.push({
        message: stderr.trim(),
        severity: 'error',
      });
    }

    return errors;
  }
}
