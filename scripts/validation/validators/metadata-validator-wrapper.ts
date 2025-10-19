/**
 * Metadata Validator Wrapper
 */

import { execSync } from 'node:child_process';
import type { ValidationOptions, ValidationResult, Validator } from '../core/types';

export class MetadataValidatorWrapper implements Validator {
  name = 'metadata';
  description = 'Validates metadata quality (title/description length)';
  enabled = true;

  async validate(options: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const args = options.quick ? ' --quick' : '';
      const output = execSync(`tsx scripts/validation/validate-metadata.ts${args}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      return {
        validator: this.name,
        passed: true,
        errors: [],
        warnings: [],
        stats: {
          filesChecked: this.extractCount(output, 'routes'),
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
