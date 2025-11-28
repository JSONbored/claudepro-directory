export {};

declare global {
  interface RequestInit {
    next?: {
      revalidate?: number | false;
      tags?: string[];
    };
  }
}
