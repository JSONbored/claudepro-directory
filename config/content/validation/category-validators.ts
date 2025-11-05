/**
 * Category Validators - Database-First Architecture
 * All configuration loaded from category_configs.validation_config via get_generation_config() RPC.
 * 69 lines → 10 lines (86% reduction)
 */

import { getGenerationConfig } from '../generation-rules';

export { getGenerationConfig as getCategoryValidators };
