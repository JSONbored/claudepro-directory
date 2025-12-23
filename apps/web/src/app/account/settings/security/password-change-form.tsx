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

const passwordChangeSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export function PasswordChangeForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState({
    confirm: false,
    current: false,
    new: false,
  });

  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'Password change failed',
    defaultRethrow: false,
    scope: 'PasswordChangeForm',
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = (data: PasswordChangeFormData) => {
    startTransition(async () => {
      await runLoggedAsync(async () => {
        const result = await changePassword({
          confirmPassword: data.confirmPassword,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
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
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField required error={errors.currentPassword?.message} label="Current Password">
        <div className="relative">
          <input
            type={showPassword.current ? 'text' : 'password'}
            {...register('currentPassword')}
            autoComplete="current-password"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your current password"
          />
          <button
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 text-sm"
            onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
            type="button"
          >
            {showPassword.current ? 'Hide' : 'Show'}
          </button>
        </div>
      </FormField>

      <FormField required error={errors.newPassword?.message} label="New Password">
        <div className="relative">
          <input
            type={showPassword.new ? 'text' : 'password'}
            {...register('newPassword')}
            autoComplete="new-password"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your new password (min 8 characters)"
          />
          <button
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 text-sm"
            onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
            type="button"
          >
            {showPassword.new ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Password must be at least 8 characters long
        </p>
      </FormField>

      <FormField required error={errors.confirmPassword?.message} label="Confirm New Password">
        <div className="relative">
          <input
            type={showPassword.confirm ? 'text' : 'password'}
            {...register('confirmPassword')}
            autoComplete="new-password"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Confirm your new password"
          />
          <button
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 text-sm"
            onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
            type="button"
          >
            {showPassword.confirm ? 'Hide' : 'Show'}
          </button>
        </div>
      </FormField>

      <Button disabled={isPending} type="submit">
        {isPending ? 'Changing Password...' : 'Change Password'}
      </Button>
    </form>
  );
}
