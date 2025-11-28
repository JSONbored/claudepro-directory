declare module 'npm:react@18.3.1' {
  export * from 'react';
  export { default } from 'react';
}

declare module 'npm:@react-email/components@0.0.22' {
  export * from '@react-email/components';
}

import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
    interface Element extends ReactJSX.Element {}
  }
}
