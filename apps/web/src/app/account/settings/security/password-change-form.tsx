'use client';

/**
 * Password Change Form
 * Allows users to change their account password
 */

import { changePassword } from '@heyclaude/web-runtime/actions/security';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, FormField, toasts } from '@heyclaude/web-runtime/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export function PasswordChangeForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const runLoggedAsync = useLoggedAsync({
    scope: 'PasswordChangeForm',
    defaultMessage: 'Password change failed',
    defaultRethrow: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = (data: PasswordChangeFormData) => {
    startTransition(async () => {
      await runLoggedAsync(async () => {
        const result = await changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        });

        if (result?.serverError) {
          toasts.error(result.serverError);
          return;
        }

        if (result?.data?.success) {
          toasts.success('Password changed successfully');
          reset();
        }
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Current Password"
        error={errors.currentPassword?.message}
        required
      >
        <div className="relative">
          <input
            type={showPassword.current ? 'text' : 'password'}
            {...register('currentPassword')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
          >
            {showPassword.current ? 'Hide' : 'Show'}
          </button>
        </div>
      </FormField>

      <FormField
        label="New Password"
        error={errors.newPassword?.message}
        required
      >
        <div className="relative">
          <input
            type={showPassword.new ? 'text' : 'password'}
            {...register('newPassword')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your new password (min 8 characters)"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
          >
            {showPassword.new ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Password must be at least 8 characters long
        </p>
      </FormField>

      <FormField
        label="Confirm New Password"
        error={errors.confirmPassword?.message}
        required
      >
        <div className="relative">
          <input
            type={showPassword.confirm ? 'text' : 'password'}
            {...register('confirmPassword')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Confirm your new password"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
          >
            {showPassword.confirm ? 'Hide' : 'Show'}
          </button>
        </div>
      </FormField>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Changing Password...' : 'Change Password'}
      </Button>
    </form>
  );
}

