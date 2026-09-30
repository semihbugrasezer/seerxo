export function formatAnalyzeResult(data) {
  const s = data.subScores || {};
  const weakPoints = (data.weakPoints || [])
    .map((wp, i) => `${i + 1}. [${wp.severity}] (${wp.field}) ${wp.reason} — fix: ${wp.fix}${wp.source?.url ? ` — [source](${wp.source.url})` : ''}`)
    .join('\n');
  const util = data.tagUtilization || {};
  const utilNotes = [
    util.duplicates?.length ? `duplicates: ${util.duplicates.join(', ')}` : '',
    util.overLong?.length ? `over 20 chars: ${util.overLong.join(', ')}` : '',
    util.tooBroad?.length ? `single-word (too broad): ${util.tooBroad.join(', ')}` : '',
  ].filter(Boolean).join(' · ');
  const score = data.overallScore ?? data.seoScore ?? 'n/a';
  const limitations = (data.limitations || []).map((item) => `- ${item}`).join('\n');

  return (
    `# Listing Readiness\n\n` +
    `**Listing Readiness: ${score}/100**${data.scoringVersion ? ` · rubric ${data.scoringVersion}` : ''} — title ${s.title}, tags ${s.tags}, description ${s.description}, completeness ${s.completeness}\n\n` +
    `## Weak points\n${weakPoints || 'None — this listing passes every check.'}\n\n` +
    `## Missing keywords\n${(data.missingKeywords || []).join(', ') || 'none'}\n\n` +
    `## Tag slots\n${util.used}/${util.max} used${utilNotes ? ` (${utilNotes})` : ''}` +
    `${limitations ? `\n\n## Limitations\n${limitations}` : ''}`
  );
}

export function formatOptimizeResult(data) {
  const before = data.before || {};
  const after = data.after || {};
  const optimized = data.optimized || {};
  const fallbackNote = data.fallback
    ? '\n\n> Note: the rewrite did not beat the original listing, so the original fields were kept.'
    : '';
  const modeNote = data.mode && data.mode !== 'full'
    ? ` · only the ${data.mode.replace('_only', '')} was rewritten`
    : '';
  const beforeScore = before.overallScore ?? before.seoScore ?? 'n/a';
  const afterScore = after.overallScore ?? after.seoScore ?? 'n/a';

  return (
    `# Guided Listing Fix\n\n` +
    `**Listing Readiness: ${beforeScore} → ${afterScore}** · resolved ${data.resolved?.length ?? 0} finding(s)` +
    `${data.unresolved?.length ? `, still open: ${data.unresolved.join(', ')}` : ''}${modeNote}${fallbackNote}\n\n` +
    `## Title\n${optimized.title}\n\n` +
    `## Description\n${optimized.description}\n\n` +
    `## Tags (${(optimized.tags || []).length})\n${(optimized.tags || []).join(', ')}`
  );
}

export function formatKeywordsResult(data) {
  const rows = (data.keywords || [])
    .map((k) => `${k.demandRank}. **${k.keyword}** → ${k.placement}${k.inListing ? ' (already in listing)' : ''}`)
    .join('\n');
  return (
    `# Keyword Suggestions for "${data.seed}"\n\n` +
    `Source: Etsy search autocomplete (relative demand order) · confidence: ${data.confidence}\n\n` +
    `${rows || 'No suggestions found for this seed.'}`
  );
}
