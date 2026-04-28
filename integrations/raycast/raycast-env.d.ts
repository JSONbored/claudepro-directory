/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search` command */
  export type Search = ExtensionPreferences & {
  /** Developer Feed URL Override - Optional maintainer-only override for testing preview feeds. Leave blank for the production HeyClaude feed. */
  "feedUrlOverride"?: string
}
  /** Preferences accessible in the `jobs` command */
  export type Jobs = ExtensionPreferences & {
  /** Developer Feed URL Override - Optional maintainer-only override for testing preview feeds. Leave blank for the production HeyClaude feed. */
  "feedUrlOverride"?: string
}
}

declare namespace Arguments {
  /** Arguments passed to the `search` command */
  export type Search = {}
  /** Arguments passed to the `jobs` command */
  export type Jobs = {}
}

