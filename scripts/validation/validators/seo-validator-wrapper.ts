/**
 * SEO Validator Wrapper
 *
 * Wraps the existing validate-seo.ts script in the unified validator interface
 */

import { execSync } from 'node:child_process';
import type { ValidationOptions, ValidationResult, Validator } from '../core/types';

export class SEOValidatorWrapper implements Validator {
  name = 'seo';
  description = 'Validates SEO metadata in MDX content files';
  enabled = true;

  async validate(options: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      const args = options.fix ? ' --fix' : '';
      const output = execSync(`tsx scripts/validation/validate-seo.ts${args}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const passed = true;
      const filesChecked = this.extractFileCount(output);
      const fixed = options.fix ? this.extractFixedCount(output) : undefined;

      return {
        validator: this.name,
        passed,
        errors: [],
        warnings: [],
        stats: {
          filesChecked,
          issues: 0,
          fixed,
          duration: Date.now() - startTime,
        },
        timestamp: new Date(),
      };
    } catch (error) {
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

  private extractFileCount(output: string): number {
    const match = output.match(/(\d+)\s+(?:files?|pages?)/i);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  private extractFixedCount(output: string): number {
    const match = output.match(/(\d+)\s+(?:issues?)\s+fixed/i);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  private parseErrors(stderr: string): Array<{
    file?: string;
    message: string;
    severity: 'error' | 'warning';
  }> {
    const errors: Array<{
      file?: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

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
