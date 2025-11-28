/// <reference path="@heyclaude/edge-runtime/jsx-types.d.ts" />

/**
 * TypeScript-compatible Deno global declarations for IDE support
 * This file provides Deno types that TypeScript can understand
 * Note: JSR and npm: imports will still show errors in IDE but work at runtime
 */

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
    function set(key: string, value: string): void;
    function has(key: string): boolean;
    function remove(key: string): void;
    function toObject(): Record<string, string>;
  }

  function serve(handler: (req: Request) => Response | Promise<Response>): void;
  function exit(code?: number): never;
  const args: string[];

  namespace errors {
    class NotFound extends Error {
      name: string;
      code: string;
    }
    class PermissionDenied extends Error {
      name: string;
      code: string;
    }
    class AlreadyExists extends Error {
      name: string;
      code: string;
    }
    class InvalidData extends Error {
      name: string;
      code: string;
    }
    class TimedOut extends Error {
      name: string;
      code: string;
    }
    class Interrupted extends Error {
      name: string;
      code: string;
    }
    class WriteZero extends Error {
      name: string;
      code: string;
    }
    class UnexpectedEof extends Error {
      name: string;
      code: string;
    }
    class BadResource extends Error {
      name: string;
      code: string;
    }
    class Busy extends Error {
      name: string;
      code: string;
    }
  }

  namespace crypto {
    namespace subtle {
      function digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>;
      function importKey(
        format: string,
        keyData: BufferSource,
        algorithm:
          | AlgorithmIdentifier
          | RsaHashedImportParams
          | EcKeyImportParams
          | HmacImportParams
          | AesKeyAlgorithm,
        extractable: boolean,
        keyUsages: KeyUsage[]
      ): Promise<CryptoKey>;
      function sign(
        algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
        key: CryptoKey,
        data: BufferSource
      ): Promise<ArrayBuffer>;
    }
    function randomUUID(): string;
  }

  function readFile(path: string | URL): Promise<Uint8Array>;
  function writeFile(
    path: string | URL,
    data: Uint8Array | ReadableStream<Uint8Array>
  ): Promise<void>;
  function readTextFile(path: string | URL): Promise<string>;
  function writeTextFile(path: string | URL, contents: string): Promise<void>;
  function stat(path: string | URL): Promise<FileInfo>;

  interface FileInfo {
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
    size: number;
    mtime: Date | null;
    atime: Date | null;
    birthtime: Date | null;
    dev: number | null;
    ino: number | null;
    mode: number | null;
    nlink: number | null;
    uid: number | null;
    gid: number | null;
    rdev: number | null;
    blksize: number | null;
    blocks: number | null;
  }
}

declare global {
  // deno-lint-ignore no-var
  var Deno: typeof Deno;
}
