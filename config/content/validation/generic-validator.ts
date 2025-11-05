/**
 * Generic Validator - Database-First Architecture
 * All configuration loaded from category_configs.validation_config via get_generation_config() RPC.
 * 312 lines → 10 lines (97% reduction)
 */

import { getGenerationConfig } from '../generation-rules';

export { getGenerationConfig as getValidationConfig };
