// -----------------------------------------------------------------------------
// Declarative Server Actions Configuration
// -----------------------------------------------------------------------------

export interface ActionConfig {
  /**
   * Override/Hardcode specific RPC args.
   * Useful for "Mega RPCs" where p_action needs to be fixed.
   */
  args?: Record<string, unknown>;
  
  /**
   * Whether the action requires authentication.
   * If true, `p_user_id` will be injected from the session.
   * @default true
   */
  auth?: boolean;
  
  /**
   * Action category for logging/metadata.
   */
  category?: string;
  
  /**
   * External logic hooks.
   */
  hooks?: {
    onSuccess?: string; // Path to hook file#exportName
  };
  
  /**
   * Explicit input schema name if it differs from the action name or needs a specific generated schema.
   * If not provided, will try to infer from RPC args.
   */
  inputSchema?: string;

  /**
   * Return style for the RPC result.
   * 'first_row': Expects array result, takes first element.
   */
  returnStyle?: 'first_row';

  /**
   * Static paths to revalidate after success.
   */
  revalidatePaths?: string[];

  /**
   * Cache tags to revalidate after success.
   * Supports dynamic segments via {param} (from input) or {result.param} (from output).
   */
  revalidateTags?: string[];

  /**
   * The name of the database RPC function to call.
   */
  rpc: string;
}

export const ACTIONS: Record<string, ActionConfig> = {
  /**
   * Job Actions
   */
  createJob: {
    rpc: 'create_job_with_payment',
    category: 'content',
    revalidatePaths: ['/jobs', '/account/jobs'],
    revalidateTags: ['job-{result.job_id}', 'company-{result.company_id}', 'company-id-{result.company_id}', 'jobs', 'companies'],
    hooks: {
      onSuccess: './hooks/job-hooks.ts#onJobCreated'
    }
  },
  updateJob: {
    rpc: 'update_job',
    category: 'content',
    revalidatePaths: ['/account/jobs', '/account/jobs/{job_id}/edit', '/jobs'],
    revalidateTags: ['job-{job_id}', 'jobs', 'companies']
  },
  deleteJob: {
    rpc: 'delete_job',
    category: 'content',
    revalidatePaths: ['/jobs', '/account/jobs'],
    revalidateTags: ['job-{job_id}', 'jobs', 'companies']
  },
  toggleJobStatus: {
    rpc: 'toggle_job_status',
    category: 'content',
    revalidatePaths: ['/jobs', '/account/jobs'],
    revalidateTags: ['job-{job_id}', 'jobs', 'companies']
  },

  /**
   * Company Actions
   */
  createCompany: {
    rpc: 'manage_company',
    category: 'content',
    revalidatePaths: ['/account/companies', '/companies'],
    revalidateTags: ['company-{result.company.slug}', 'company-id-{result.company.id}', 'companies'],
    args: {
      p_action: 'create',
      p_update_data: null
    }
  },
  updateCompany: {
    rpc: 'manage_company',
    category: 'content',
    revalidatePaths: ['/account/companies', '/companies/{result.company.slug}', '/companies'],
    revalidateTags: ['company-{result.company.slug}', 'company-id-{result.company.id}', 'companies'],
    args: {
      p_action: 'update',
      p_create_data: null
    }
  },
  deleteCompany: {
    rpc: 'delete_company',
    category: 'content',
    revalidatePaths: ['/companies', '/account/companies'],
    revalidateTags: ['company-{company_id}', 'company-id-{company_id}', 'companies']
  },

  /**
   * Collection Actions
   */
  createCollection: {
    rpc: 'manage_collection',
    category: 'user',
    revalidatePaths: ['/account', '/account/library'],
    revalidateTags: ['collections', 'users'],
    args: {
      p_action: 'create',
      p_update_data: null,
      p_add_item_data: null,
      p_remove_item_id: null,
      p_delete_id: null
    }
  },
  updateCollection: {
    rpc: 'manage_collection',
    category: 'user',
    revalidatePaths: ['/account', '/account/library', '/account/library/{result.collection.slug}'],
    revalidateTags: ['collections', 'users'],
    args: {
      p_action: 'update',
      p_create_data: null,
      p_add_item_data: null,
      p_remove_item_id: null,
      p_delete_id: null
    }
  },
  deleteCollection: {
    rpc: 'manage_collection',
    category: 'user',
    revalidatePaths: ['/account', '/account/library'],
    revalidateTags: ['collections', 'users'],
    args: {
      p_action: 'delete',
      p_create_data: null,
      p_update_data: null,
      p_add_item_data: null,
      p_remove_item_id: null
    }
  },
  addItemToCollection: {
    rpc: 'manage_collection',
    category: 'user',
    revalidatePaths: ['/account/library', '/account/library/{result.collection.slug}'],
    revalidateTags: ['collections', 'users'],
    args: {
      p_action: 'add_item',
      p_create_data: null,
      p_update_data: null,
      p_remove_item_id: null,
      p_delete_id: null
    }
  },
  removeItemFromCollection: {
    rpc: 'manage_collection',
    category: 'user',
    revalidatePaths: ['/account/library', '/account/library/{result.collection.slug}'],
    revalidateTags: ['collections', 'users'],
    args: {
      p_action: 'remove_item',
      p_create_data: null,
      p_update_data: null,
      p_add_item_data: null,
      p_delete_id: null
    }
  },
  reorderCollectionItems: {
    rpc: 'reorder_collection_items',
    category: 'user',
    revalidatePaths: ['/account/library'],
    revalidateTags: ['collections', 'users']
  },

  /**
   * Review Actions
   */
  createReview: {
    rpc: 'manage_review',
    category: 'user',
    revalidatePaths: ['/{result.review.content_type}/{result.review.content_slug}', '/{result.review.content_type}'],
    revalidateTags: ['reviews:{result.review.content_type}:{result.review.content_slug}', 'content', 'homepage', 'trending'],
    args: {
      p_action: 'create',
      p_update_data: null,
      p_delete_id: null
    }
  },
  updateReview: {
    rpc: 'manage_review',
    category: 'user',
    revalidatePaths: ['/{result.review.content_type}/{result.review.content_slug}', '/{result.review.content_type}'],
    revalidateTags: ['reviews:{result.review.content_type}:{result.review.content_slug}', 'content'],
    args: {
      p_action: 'update',
      p_create_data: null,
      p_delete_id: null
    }
  },
  deleteReview: {
    rpc: 'manage_review',
    category: 'user',
    revalidatePaths: ['/{result.content_type}/{result.content_slug}', '/{result.content_type}'],
    revalidateTags: ['reviews:{result.content_type}:{result.content_slug}', 'content'],
    args: {
      p_action: 'delete',
      p_create_data: null,
      p_update_data: null
    }
  },
  markReviewHelpful: {
    rpc: 'toggle_review_helpful',
    category: 'user',
    revalidatePaths: ['/{result.content_type}/{result.content_slug}'],
    revalidateTags: ['reviews:{result.content_type}:{result.content_slug}', 'content']
  },

  /**
   * Content Actions
   */
  submitContentForReview: {
    rpc: 'submit_content_for_review',
    category: 'content',
    revalidatePaths: ['/account/submissions'],
    revalidateTags: ['submissions']
  },
  
  /**
   * Contact Actions
   */
  submitContactForm: {
    rpc: 'insert_contact_submission',
    auth: false,
    category: 'form',
    returnStyle: 'first_row',
    revalidatePaths: ['/admin/contact-submissions'],
    revalidateTags: ['contact-submission-{result.submission_id}', 'contact', 'submissions'],
    hooks: {
      onSuccess: './hooks/contact-hooks.ts#onContactSubmission'
    }
  },

  /**
   * User Actions
   */
  addBookmark: {
    rpc: 'add_bookmark',
    category: 'user',
    revalidatePaths: ['/account', '/account/library'],
    revalidateTags: ['user-bookmarks', 'users', 'user-{userId}', 'content-{content_slug}']
  },
  removeBookmark: {
    rpc: 'remove_bookmark',
    category: 'user',
    revalidatePaths: ['/account', '/account/library'],
    revalidateTags: ['user-bookmarks', 'users', 'user-{userId}', 'content-{content_slug}']
  },
  unlinkOAuthProvider: {
    rpc: 'unlink_oauth_provider',
    category: 'user',
    revalidatePaths: ['/account/settings'],
    revalidateTags: ['users']
  }
};
