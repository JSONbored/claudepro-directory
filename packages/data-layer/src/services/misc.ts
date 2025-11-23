import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type NotificationRecord = Database['public']['Functions']['get_active_notifications']['Returns'][number];
export type AnnouncementRecord = Database['public']['Tables']['announcements']['Row'];
export type NavigationMenuResult = Database['public']['Functions']['get_navigation_menu']['Returns'];
export type ContactCommandsResult = Database['public']['Functions']['get_contact_commands']['Returns'];
export type FormFieldConfigResult = Database['public']['Functions']['get_form_field_config']['Returns'];

export class MiscService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getActiveNotifications(dismissedIds: string[]) {
    const { data, error } = await this.supabase.rpc('get_active_notifications', {
        p_dismissed_ids: dismissedIds
    });
    if (error) throw error;
    return (data ?? []) as NotificationRecord[];
  }

  async getActiveAnnouncement() {
    const { data, error } = await this.supabase.rpc('get_active_announcement');
    if (error) throw error;
    return data as AnnouncementRecord | null;
  }

  async getNavigationMenu() {
    const { data, error } = await this.supabase.rpc('get_navigation_menu');
    if (error) throw error;
    return data as NavigationMenuResult;
  }

  async getContactCommands() {
     const { data, error } = await this.supabase.rpc('get_contact_commands');
     if (error) throw error;
     return data as ContactCommandsResult;
  }

  async getFormFieldConfig(formType: Database['public']['Enums']['submission_type']) {
    const { data, error } = await this.supabase.rpc('get_form_field_config', {
        p_form_type: formType
    });
    if (error) throw error;
    return data as FormFieldConfigResult;
  }
}
