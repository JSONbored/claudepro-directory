/**
 * User Factory
 *
 * Generates realistic user data matching Supabase Auth structure.
 * Supports authenticated, GitHub OAuth, and admin users.
 *
 * **Usage:**
 * ```ts
 * import { userFactory } from '@/tests/factories';
 *
 * // Generate authenticated user
 * const user = userFactory.build();
 *
 * // Generate admin user
 * const admin = userFactory.admin().build();
 *
 * // Generate GitHub OAuth user
 * const githubUser = userFactory.githubUser().build();
 *
 * // Generate unconfirmed user
 * const unconfirmed = userFactory.unconfirmed().build();
 * ```
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

interface User {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
    role?: string;
    permissions?: string[];
  };
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    username?: string;
    preferred_username?: string;
    provider_id?: string;
  };
  identities: unknown[];
  created_at: string;
  updated_at: string;
}

/**
 * User Factory Class with Trait Methods
 *
 * Extends Factory to provide trait-like builder methods for common user variations.
 */
class UserFactory extends Factory<User> {
  /**
   * Admin user trait - user with admin role and permissions
   */
  admin() {
    return this.params({
      app_metadata: {
        provider: 'email',
        providers: ['email'],
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage_users'],
      },
      user_metadata: {
        full_name: 'Admin User',
        username: 'admin',
        avatar_url: faker.image.avatar(),
      },
    });
  }

  /**
   * GitHub OAuth user trait - user authenticated via GitHub
   */
  githubUser() {
    return this.afterBuild((user) => {
      user.app_metadata = {
        provider: 'github',
        providers: ['github'],
      };
      user.user_metadata = {
        ...user.user_metadata,
        preferred_username: user.user_metadata.username,
        provider_id: faker.number.int({ min: 100000, max: 999999 }).toString(),
      };
      user.identities = [
        {
          id: `github-identity-${faker.string.uuid()}`,
          user_id: user.id,
          identity_data: {
            email: user.email,
            name: user.user_metadata.full_name,
            avatar_url: user.user_metadata.avatar_url,
          },
          provider: 'github',
          last_sign_in_at: user.last_sign_in_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      ];
    });
  }

  /**
   * Unconfirmed user trait - user who hasn't confirmed their email
   */
  unconfirmed() {
    return this.params({
      email_confirmed_at: null,
      confirmed_at: null,
    });
  }
}

export const userFactory = UserFactory.define(() => {
  const username = faker.internet.username().toLowerCase();
  const email = faker.internet.email().toLowerCase();
  const createdAt = faker.date.past({ years: 2 }).toISOString();

  return {
    id: `user-${faker.string.uuid()}`,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: createdAt,
    phone: null,
    confirmed_at: createdAt,
    last_sign_in_at: faker.date.recent({ days: 7 }).toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      full_name: faker.person.fullName(),
      avatar_url: faker.image.avatar(),
      username,
    },
    identities: [],
    created_at: createdAt,
    updated_at: faker.date.recent({ days: 30 }).toISOString(),
  };
});
