/**
 * View Transitions API Type Declarations
 *
 * Provides TypeScript support for the View Transitions API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 *
 * Browser Support:
 * - Chrome/Edge 111+
 * - Safari/Firefox: Not yet supported (progressive enhancement)
 */

interface ViewTransition {
  /**
   * Promise that fulfills once the transition animation is finished,
   * and the new page view is visible and interactive to the user.
   */
  finished: Promise<void>;

  /**
   * Promise that fulfills once the pseudo-element tree is created
   * and the transition animation is about to start.
   */
  ready: Promise<void>;

  /**
   * Promise that fulfills when the promise returned by the
   * document.startViewTransition()'s callback fulfills.
   */
  updateCallbackDone: Promise<void>;

  /**
   * Skips the animation part of the view transition.
   */
  skipTransition(): void;
}

interface Document {
  /**
   * Starts a new view transition and returns a ViewTransition object to represent it.
   *
   * @param updateCallback A function that is invoked when the pseudo-element tree
   * is created and the transition animation is ready to start. Typically this will
   * involve updating the DOM to reflect the new view state. Returns a Promise that
   * fulfills when the DOM update is complete.
   *
   * @example
   * ```typescript
   * document.startViewTransition(() => {
   *   // Update DOM
   *   element.classList.add('new-state');
   * });
   * ```
   */
  startViewTransition(updateCallback: () => void | Promise<void>): ViewTransition;
}
