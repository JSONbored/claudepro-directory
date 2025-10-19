/**
 * Title Validator Wrapper
 *
 * Wraps the existing verify-titles.ts script in the unified validator interface
 */

import { execSync } from 'node:child_process';
import type { ValidationOptions, ValidationResult, Validator } from '../core/types';

export class TitleValidatorWrapper implements Validator {
  name = 'titles';
  description = 'Validates title optimization and length standards';
  enabled = true;

  async validate(options: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const args = options.quick ? ' --quick' : '';
      const output = execSync(`tsx scripts/validation/verify-titles.ts${args}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const passed = true;
      const filesChecked = this.extractCount(output, 'pages');

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
      const stderr = (error as { stderr?: Buffer }).stderr?.toString() || String(error);

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

  private extractCount(output: string, type: string): number {
    const match = output.match(new RegExp(`(\\d+)\\s+${type}`, 'i'));
    return match ? Number.parseInt(match[1], 10) : 0;
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
