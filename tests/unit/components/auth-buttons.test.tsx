/**
 * Auth Buttons Component Tests
 *
 * Tests OAuth authentication buttons for GitHub and Google sign-in.
 * Validates user interaction, loading states, and error handling.
 *
 * **Security Focus:**
 * - OAuth redirect URL validation
 * - Error message handling
 * - State management during auth flow
 *
 * @see src/components/auth/auth-buttons.tsx
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthButtons, SignOutButton } from '@/src/components/auth/auth-buttons';
import { createClient } from '@/src/lib/supabase/client';

// Mock Supabase client
vi.mock('@/src/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('AuthButtons Component', () => {
  const mockSupabase = {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
      writable: true,
    });
  });

  describe('Rendering', () => {
    test('should render GitHub and Google sign-in buttons', () => {
      render(<AuthButtons />);

      expect(screen.getByRole('button', { name: /sign in with github/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    });

    test('should render with custom className', () => {
      const { container } = render(<AuthButtons className="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('GitHub Sign-in', () => {
    test('should call signInWithOAuth with GitHub provider', async () => {
      const user = userEvent.setup();
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<AuthButtons />);

      const githubButton = screen.getByRole('button', { name: /sign in with github/i });
      await user.click(githubButton);

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });

    test('should include custom redirectTo in callback URL', async () => {
      const user = userEvent.setup();
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<AuthButtons redirectTo="/dashboard" />);

      const githubButton = screen.getByRole('button', { name: /sign in with github/i });
      await user.click(githubButton);

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback?next=/dashboard',
        },
      });
    });

    test('should show loading state during GitHub sign-in', async () => {
      const user = userEvent.setup();
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSupabase.auth.signInWithOAuth.mockReturnValue(signInPromise);

      render(<AuthButtons />);

      const githubButton = screen.getByRole('button', { name: /sign in with github/i });
      await user.click(githubButton);

      // Should show loading text
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();

      // Both buttons should be disabled
      expect(githubButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeDisabled();

      // Resolve the promise
      resolveSignIn!({ error: null });
    });

    test('should handle GitHub sign-in errors', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: { message: 'OAuth provider error', status: 500 },
      });

      render(<AuthButtons />);

      const githubButton = screen.getByRole('button', { name: /sign in with github/i });
      await user.click(githubButton);

      expect(toast.error).toHaveBeenCalledWith('Sign in failed: OAuth provider error');

      // Button should be re-enabled after error
      expect(githubButton).not.toBeDisabled();
    });
  });

  describe('Google Sign-in', () => {
    test('should call signInWithOAuth with Google provider', async () => {
      const user = userEvent.setup();
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<AuthButtons />);

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });

    test('should show loading state during Google sign-in', async () => {
      const user = userEvent.setup();
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSupabase.auth.signInWithOAuth.mockReturnValue(signInPromise);

      render(<AuthButtons />);

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      // Should show loading text
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();

      // Both buttons should be disabled
      expect(screen.getByRole('button', { name: /sign in with github/i })).toBeDisabled();
      expect(googleButton).toBeDisabled();

      // Resolve the promise
      resolveSignIn!({ error: null });
    });

    test('should handle Google sign-in errors', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: { message: 'Invalid OAuth configuration', status: 400 },
      });

      render(<AuthButtons />);

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      expect(toast.error).toHaveBeenCalledWith('Sign in failed: Invalid OAuth configuration');

      // Button should be re-enabled after error
      expect(googleButton).not.toBeDisabled();
    });
  });

  describe('Concurrent Sign-in Prevention', () => {
    test('should disable both buttons when either is clicked', async () => {
      const user = userEvent.setup();
      let resolveSignIn: (value: { error: null }) => void;
      const signInPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSupabase.auth.signInWithOAuth.mockReturnValue(signInPromise);

      render(<AuthButtons />);

      const githubButton = screen.getByRole('button', { name: /sign in with github/i });
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });

      // Click GitHub button
      await user.click(githubButton);

      // Both should be disabled
      expect(githubButton).toBeDisabled();
      expect(googleButton).toBeDisabled();

      // Resolve the promise
      resolveSignIn!({ error: null });
    });

    test('should not allow clicking multiple buttons simultaneously', async () => {
      const user = userEvent.setup();
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<AuthButtons />);

      const githubButton = screen.getByRole('button', { name: /sign in with github/i });
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });

      // Try to click both quickly
      await user.click(githubButton);
      await user.click(googleButton);

      // Should only call signInWithOAuth once (first click)
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledTimes(1);
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'github' })
      );
    });
  });
});

describe('SignOutButton Component', () => {
  const mockSupabase = {
    auth: {
      signOut: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

    // Mock window.location
    delete (window as unknown as { location: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: '' };
  });

  describe('Rendering', () => {
    test('should render sign out button', () => {
      render(<SignOutButton />);

      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    test('should render with custom className', () => {
      render(<SignOutButton className="custom-class" />);

      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Sign-out Functionality', () => {
    test('should call signOut when button is clicked', async () => {
      const user = userEvent.setup();
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      render(<SignOutButton />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    test('should show success toast and redirect to homepage on successful sign-out', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      render(<SignOutButton />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      expect(toast.success).toHaveBeenCalledWith('Signed out successfully');
      expect(window.location.href).toBe('/');
    });

    test('should show error toast when sign-out fails', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Network error', status: 500 },
      });

      render(<SignOutButton />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      expect(toast.error).toHaveBeenCalledWith('Sign out failed: Network error');
      // Should not redirect on error
      expect(window.location.href).toBe('');
    });

    test('should show loading state during sign-out', async () => {
      const user = userEvent.setup();
      let resolveSignOut: (value: { error: null }) => void;
      const signOutPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignOut = resolve;
      });
      mockSupabase.auth.signOut.mockReturnValue(signOutPromise);

      render(<SignOutButton />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      // Should show loading text
      expect(screen.getByText(/signing out/i)).toBeInTheDocument();

      // Button should be disabled
      expect(signOutButton).toBeDisabled();

      // Resolve the promise
      resolveSignOut!({ error: null });
    });

    test('should prevent multiple simultaneous sign-out clicks', async () => {
      const user = userEvent.setup();
      let resolveSignOut: (value: { error: null }) => void;
      const signOutPromise = new Promise<{ error: null }>((resolve) => {
        resolveSignOut = resolve;
      });
      mockSupabase.auth.signOut.mockReturnValue(signOutPromise);

      render(<SignOutButton />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });

      // Try to click multiple times
      await user.click(signOutButton);
      await user.click(signOutButton);
      await user.click(signOutButton);

      // Should only call signOut once
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);

      // Resolve the promise
      resolveSignOut!({ error: null });
    });
  });
});
