import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function usage() {
  console.error('Usage: node scripts/summarize-report.mjs <report-json-path>');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function ensureString(value, fieldName) {
  assert(typeof value === 'string' && value.trim() !== '', `${fieldName} must be a non-empty string.`);
}

function ensureArray(value, fieldName) {
  assert(Array.isArray(value), `${fieldName} must be an array.`);
}

function formatCount(label, count) {
  return `- ${label}: **${count}**`;
}

function buildMarkdownSummary(report, sourcePath) {
  const { meta } = report;

  return [
    '### Report Summary',
    '',
    `- Source file: \`${sourcePath}\``,
    `- URL: ${meta.url}`,
    `- Audience: ${meta.audience}`,
    `- Scope: ${meta.scope}`,
    `- Report status: ${meta.report_status}`,
    `- Analyst confidence: ${meta.analyst_confidence}`,
    `- Analyzed at: ${meta.analyzed_at}`,
    '',
    '#### Counts',
    '',
    formatCount('task_longlist', report.task_longlist.length),
    formatCount('top_tasks', report.top_tasks.length),
    formatCount('tiny_tasks', report.tiny_tasks.length),
    formatCount('meta.evidence_gaps', meta.evidence_gaps.length),
  ].join('\n');
}

async function main() {
  const [reportPathArg] = process.argv.slice(2);
  if (!reportPathArg) {
    usage();
    process.exitCode = 1;
    return;
  }

  const reportPath = resolve(process.cwd(), reportPathArg);
  const raw = await readFile(reportPath, 'utf8');
  const report = JSON.parse(raw);

  assert(report && typeof report === 'object' && !Array.isArray(report), 'Report JSON must be an object.');
  assert(report.meta && typeof report.meta === 'object' && !Array.isArray(report.meta), 'meta must be an object.');

  ensureString(report.meta.url, 'meta.url');
  ensureString(report.meta.audience, 'meta.audience');
  ensureString(report.meta.scope, 'meta.scope');
  ensureString(report.meta.report_status, 'meta.report_status');
  ensureString(report.meta.analyst_confidence, 'meta.analyst_confidence');
  ensureString(report.meta.analyzed_at, 'meta.analyzed_at');

  ensureArray(report.task_longlist, 'task_longlist');
  ensureArray(report.top_tasks, 'top_tasks');
  ensureArray(report.tiny_tasks, 'tiny_tasks');
  ensureArray(report.meta.evidence_gaps, 'meta.evidence_gaps');

  console.log(buildMarkdownSummary(report, reportPathArg));
}

main().catch((error) => {
  console.error(`Failed to summarize report: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
