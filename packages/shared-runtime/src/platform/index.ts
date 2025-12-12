/**
 * Platform Abstraction Layer
 * 
 * Provides platform-agnostic utilities for deployment environment detection,
 * environment variable access, and platform-specific configurations.
 * 
 * @module platform
 */

export {
  type Platform,
  detectPlatform,
  isPlatform,
  isVercel,
  isNetlify,
  isCloudflare,
} from './detection.ts';

export {
  type DeploymentEnv,
  getDeploymentEnv,
  getDeploymentUrl,
  getDeploymentBranch,
  getDeploymentCommit,
  getDeploymentPullRequestId,
} from './env.ts';
