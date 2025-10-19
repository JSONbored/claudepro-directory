/**
 * LLMSTxt Validator Wrapper
 *
 * Wraps the existing validate-llmstxt.ts script in the unified validator interface
 */

import { execSync } from 'node:child_process';
import type { ValidationOptions, ValidationResult, Validator } from '../core/types';

export class LLMSTxtValidatorWrapper implements Validator {
  name = 'llmstxt';
  description = 'Validates llms.txt file structure and content';
  enabled = true;

  async validate(options: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const output = execSync('tsx scripts/validation/validate-llmstxt.ts', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const passed = true;

      return {
        validator: this.name,
        passed,
        errors: [],
        warnings: [],
        stats: {
          filesChecked: 1, // Only validates llms.txt
          issues: 0,
          duration: Date.now() - startTime,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      const stderr = (error as { stderr?: Buffer }).stderr?.toString() || String(error);

      return {
        validator: this.name,
        passed: false,
        errors: this.parseErrors(stderr),
        warnings: [],
        stats: {
          filesChecked: 1,
          issues: this.parseErrors(stderr).length,
          duration: Date.now() - startTime,
        },
        timestamp: new Date(),
      };
    }
  }

  private parseErrors(stderr: string): Array<{
    message: string;
    severity: 'error' | 'warning';
  }> {
    const errors: Array<{ message: string; severity: 'error' | 'warning' }> = [];

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
      errors.push({
        message: stderr.trim(),
        severity: 'error',
      });
    }

    return errors;
  }
}
