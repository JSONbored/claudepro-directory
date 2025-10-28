/**
 * Weekly Digest - Database-First Architecture
 * All aggregation in PostgreSQL via materialized views and RPC functions.
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

class DigestService {
  async generateDigest(weekStart: Date) {
    const supabase = await createClient();
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const { data, error } = await supabase.rpc('get_weekly_digest', {
      p_week_start: weekStartStr,
    });

    if (error || !data) {
      logger.error('Failed to generate digest', error);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      return {
        weekOf: this.formatWeekRange(weekStart, weekEnd),
        weekStart: weekStartStr,
        weekEnd: weekEnd.toISOString().split('T')[0],
        newContent: [],
        trendingContent: [],
      };
    }

    return data;
  }

  private formatWeekRange(start: Date, end: Date): string {
    const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();

    if (start.getMonth() === end.getMonth()) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    }

    const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }

  getStartOfWeek(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getStartOfPreviousWeek(date: Date = new Date()): Date {
    const start = this.getStartOfWeek(date);
    start.setDate(start.getDate() - 7);
    return start;
  }
}

export const digestService = new DigestService();
