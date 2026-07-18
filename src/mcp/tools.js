const LISTING_INPUT_PROPERTIES = {
  title: { type: 'string', description: 'The listing title, exactly as it appears on Etsy.' },
  description: { type: 'string', description: 'The listing description.' },
  tags: {
    type: 'array',
    items: { type: 'string' },
    description: 'The listing tags (up to 13).',
  },
  product_name: {
    type: 'string',
    description: 'What the product is (e.g. "handmade ceramic coffee mug"). Improves keyword-coverage checks.',
  },
  url: {
    type: 'string',
    description:
      'Optional Etsy listing URL. A URL alone is NOT enough — Etsy blocks server-side fetching, so always pass the listing fields you can see. The URL adds the product name from its slug.',
  },
};

const STRING_ARRAY_SCHEMA = {
  type: 'array',
  items: { type: 'string' },
};

const SUB_SCORES_SCHEMA = {
  type: 'object',
  description: 'SEO scores from 0 to 100 for each listing area.',
  properties: {
    title: { type: 'number', description: 'Title SEO score from 0 to 100.' },
    tags: { type: 'number', description: 'Tags SEO score from 0 to 100.' },
    description: { type: 'number', description: 'Description SEO score from 0 to 100.' },
    completeness: { type: 'number', description: 'Listing completeness score from 0 to 100.' },
  },
  required: ['title', 'tags', 'description', 'completeness'],
};

const WEAK_POINT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Stable identifier for the failed SEO check.' },
    field: { type: 'string', description: 'Listing field that needs improvement.' },
    severity: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority of the finding.' },
    reason: { type: 'string', description: 'Human-readable explanation of the finding.' },
    fix: { type: 'string', description: 'Concrete action that resolves the finding.' },
  },
  required: ['id', 'field', 'severity', 'reason', 'fix'],
};

const AUDIT_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    seoScore: { type: 'number', description: 'Overall Etsy SEO score from 0 to 100.' },
    subScores: SUB_SCORES_SCHEMA,
    weakPoints: { type: 'array', items: WEAK_POINT_SCHEMA, description: 'Ranked SEO findings and fixes.' },
    missingKeywords: { ...STRING_ARRAY_SCHEMA, description: 'Product keywords missing from the listing.' },
    tagUtilization: {
      type: 'object',
      description: 'How effectively the 13 Etsy tag slots are used.',
      properties: {
        used: { type: 'number', description: 'Number of tag slots currently used.' },
        max: { type: 'number', description: 'Maximum Etsy tag slots available.' },
        duplicates: { ...STRING_ARRAY_SCHEMA, description: 'Duplicate tags.' },
        tooBroad: { ...STRING_ARRAY_SCHEMA, description: 'Single-word tags that are too broad.' },
        overLong: { ...STRING_ARRAY_SCHEMA, description: 'Tags longer than Etsy allows.' },
      },
      required: ['used', 'max', 'duplicates', 'tooBroad', 'overLong'],
    },
  },
  required: ['seoScore', 'subScores', 'weakPoints', 'missingKeywords', 'tagUtilization'],
};

const LISTING_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'SEO-optimized Etsy listing title.' },
    description: { type: 'string', description: 'SEO-optimized Etsy listing description.' },
    tags: { ...STRING_ARRAY_SCHEMA, description: 'SEO-optimized Etsy tags.' },
  },
  required: ['title', 'description', 'tags'],
};

const GENERATE_TOOL = {
  name: 'generate_etsy_seo',
  title: 'Generate Etsy SEO Listing',
  description: 'Generate a complete SEO-optimized Etsy listing with a title, description, and 13 tags from a product name and optional category.',
  inputSchema: {
    type: 'object',
    properties: {
      product_name: {
        type: 'string',
        description: 'Name of the product to optimize.',
      },
      category: {
        type: 'string',
        description: 'Optional Etsy category (for example, "Home & Living").',
      },
    },
    required: ['product_name'],
  },
  outputSchema: LISTING_OUTPUT_SCHEMA,
  annotations: {
    title: 'Generate Etsy SEO Listing',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

const QUOTA_TOOL = {
  name: 'seerxo_quota',
  title: 'Check Seerxo Quota',
  description: 'Use this when the user asks how many Seerxo credits remain. Returns the authenticated account\'s monthly usage and remaining quota without consuming a credit.',
  inputSchema: { type: 'object', properties: {}, required: [] },
  outputSchema: {
    type: 'object',
    properties: {
      current: { type: 'number', description: 'Generations used this month.' },
      limit: { type: 'number', description: 'Monthly generation limit.' },
      remaining: { type: 'number', description: 'Generations remaining this month.' },
      tier: { type: 'string', description: 'Seerxo account tier.' },
      usageByChannel: { type: 'object', description: 'Usage grouped by MCP and web.' },
    },
    required: ['current', 'limit', 'remaining', 'tier', 'usageByChannel'],
  },
  annotations: {
    title: 'Check Seerxo Quota',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const LISTING_TOOLS = [
  {
    name: 'seerxo_suggest_keywords',
    title: 'Suggest Etsy Keywords',
    description:
      'Get ranked Etsy keyword suggestions for a product or seed phrase, sampled from Etsy\'s own search autocomplete (relative demand rank, never fabricated volumes). Each keyword comes with a placement recommendation (title / tags / description) and whether the listing already uses it. Pass the listing fields too when you have them for better placement advice.',
    inputSchema: {
      type: 'object',
      properties: {
        seed: { type: 'string', description: 'Seed phrase to expand (e.g. "ceramic mug"). Falls back to product_name or title.' },
        ...LISTING_INPUT_PROPERTIES,
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        seed: { type: 'string', description: 'Normalized seed phrase used for suggestions.' },
        confidence: { type: 'string', enum: ['medium', 'low'], description: 'Confidence in the available suggestions.' },
        keywords: {
          type: 'array',
          description: 'Keyword suggestions in Etsy autosuggest demand order.',
          items: {
            type: 'object',
            properties: {
              keyword: { type: 'string', description: 'Suggested keyword phrase.' },
              demandRank: { type: 'number', description: 'Relative rank from Etsy autosuggest.' },
              placement: { type: 'string', enum: ['title', 'tags', 'description'], description: 'Recommended listing placement.' },
              inListing: { type: 'boolean', description: 'Whether the listing already contains the keyword.' },
            },
            required: ['keyword', 'demandRank', 'placement', 'inListing'],
          },
        },
        source: { type: 'string', description: 'Source used for keyword suggestions.' },
      },
      required: ['seed', 'confidence', 'keywords', 'source'],
    },
    annotations: {
      title: 'Suggest Etsy Keywords',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: 'seerxo_analyze_listing',
    title: 'Analyze Etsy Listing',
    description:
      'Audit an existing Etsy listing. Returns an SEO score (0-100) with per-field sub-scores, ranked weak points (each with severity and a concrete fix), missing keywords, and tag-slot utilization. Call it with whatever listing fields are available (title, tags, description); at least one is required.',
    inputSchema: { type: 'object', properties: LISTING_INPUT_PROPERTIES, required: [] },
    outputSchema: AUDIT_OUTPUT_SCHEMA,
    annotations: {
      title: 'Analyze Etsy Listing',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'seerxo_optimize_listing',
    title: 'Optimize Etsy Listing',
    description:
      'Rewrite an Etsy listing to fix its audit findings: improved title, description, and tag set, each mapped to the finding it resolves, with a before/after SEO score. Etsy limits (140-char title, 13 tags, 20 chars per tag) are enforced server-side and the result never scores below the original. Provide the current listing fields.',
    inputSchema: {
      type: 'object',
      properties: {
        ...LISTING_INPUT_PROPERTIES,
        mode: {
          type: 'string',
          enum: ['full', 'title_only', 'description_only', 'tags_only'],
          description: 'Which field(s) to rewrite. Defaults to "full" (title + description + tags). Use a single-field mode to rewrite just that field and leave the rest untouched.',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        before: {
          type: 'object',
          description: 'Audit summary before optimization.',
          properties: {
            seoScore: { type: 'number', description: 'Original SEO score from 0 to 100.' },
            subScores: SUB_SCORES_SCHEMA,
            weakPoints: { type: 'array', items: WEAK_POINT_SCHEMA, description: 'Original SEO findings.' },
          },
          required: ['seoScore', 'subScores', 'weakPoints'],
        },
        optimized: LISTING_OUTPUT_SCHEMA,
        after: {
          type: 'object',
          description: 'Audit summary after optimization.',
          properties: {
            seoScore: { type: 'number', description: 'Optimized SEO score from 0 to 100.' },
            subScores: SUB_SCORES_SCHEMA,
            weakPoints: { type: 'array', items: WEAK_POINT_SCHEMA, description: 'SEO findings that remain.' },
          },
          required: ['seoScore', 'subScores', 'weakPoints'],
        },
        resolved: { ...STRING_ARRAY_SCHEMA, description: 'Finding IDs resolved by the rewrite.' },
        unresolved: { ...STRING_ARRAY_SCHEMA, description: 'Finding IDs still present after the rewrite.' },
        diff: { type: 'object', description: 'Before and after values for each listing field.' },
        fallback: { type: 'boolean', description: 'Whether the original listing was kept to prevent a score regression.' },
        mode: { type: 'string', enum: ['full', 'title_only', 'description_only', 'tags_only'], description: 'Optimization mode that was applied.' },
      },
      required: ['before', 'optimized', 'after', 'resolved', 'unresolved', 'diff', 'fallback', 'mode'],
    },
    annotations: {
      title: 'Optimize Etsy Listing',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
];

export const MCP_TOOLS = [GENERATE_TOOL, ...LISTING_TOOLS, QUOTA_TOOL];
