/**
 * Type declarations for Deno npm: imports used in edge-runtime email templates
 * These are Deno-specific imports that TypeScript doesn't understand natively.
 * This file provides type declarations so TypeScript can type-check code that
 * imports from edge-runtime even though the email templates themselves use
 * Deno-specific npm: imports.
 * 
 * These declarations work standalone without requiring the actual packages
 * to be available when TypeScript processes excluded files.
 */

// Reference React types without importing (using triple-slash or type reference)
/// <reference types="react" />

declare module 'npm:react@18.3.1' {
  // Re-export everything from react types
  // Using a type reference that TypeScript can resolve from @types/react
  export * from 'react';
  export { default } from 'react';
  
  // Explicitly export commonly used types
  export type {
    Component,
    FC,
    FunctionComponent,
    ComponentType,
    ReactElement,
    ReactNode,
    PropsWithChildren,
    ComponentProps,
    ComponentPropsWithoutRef,
    ComponentPropsWithRef,
  } from 'react';
}

declare module 'npm:@react-email/components@0.0.22' {
  // Re-export everything from @react-email/components
  // This will resolve to the actual package types when available
  export * from '@react-email/components';
  
  // Explicitly export commonly used components
  export { Body } from '@react-email/body';
  export { Button } from '@react-email/button';
  export { Container } from '@react-email/container';
  export { Head } from '@react-email/head';
  export { Hr } from '@react-email/hr';
  export { Html } from '@react-email/html';
  export { Link } from '@react-email/link';
  export { Preview } from '@react-email/preview';
  export { Section } from '@react-email/section';
  export { Text } from '@react-email/text';
}

// JSX namespace declaration - extends React's JSX types
declare global {
  namespace JSX {
    // This will automatically extend React's JSX types from @types/react
    // No explicit extension needed as TypeScript will merge with React's JSX namespace
  }
}
