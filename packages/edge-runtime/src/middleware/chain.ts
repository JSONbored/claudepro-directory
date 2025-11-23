import type { Handler, Middleware } from './types.ts';
import type { RouterContext } from '../utils/router.ts';

/**
 * Composes multiple middleware functions into a single middleware.
 * Usage: chain(logger, rateLimit)(handler)
 */
export function chain<T extends RouterContext = RouterContext>(
  ...middlewares: Middleware<T>[]
) {
  return (handler: Handler<T>): Handler<T> => {
    return async (ctx: T): Promise<Response> => {
      let index = -1;
      
      const dispatch = async (i: number): Promise<Response> => {
        if (i <= index) throw new Error('next() called multiple times');
        index = i;
        if (i === middlewares.length) {
          return handler(ctx);
        }
        const fn = middlewares[i];
        if (!fn) {
          return handler(ctx);
        }
        return fn(ctx, () => dispatch(i + 1));
      };

      return dispatch(0);
    };
  };
}
