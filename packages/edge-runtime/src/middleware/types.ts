import type { RouterContext } from '../utils/router.ts';

export type Next = () => Promise<Response>;

export type Middleware<T extends RouterContext = RouterContext> = (
  ctx: T,
  next: Next
) => Promise<Response>;

export type Handler<T extends RouterContext = RouterContext> = (
  ctx: T
) => Promise<Response>;
