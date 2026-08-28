import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { InferenceClient } from '@huggingface/inference';

export const CIVIC_VISION_LABELS = {
  pothole: 'a pothole or damaged road surface',
  streetlight: 'a broken street light or lamp post',
  trash: 'garbage trash or overflowing waste',
  graffiti: 'graffiti or damaged public property',
  water_leak: 'a leaking water pipe or flooded street',
  other: 'another civic infrastructure problem'
};

const REPAIRED_LABELS = {
  pothole: 'a repaired smooth road surface without a pothole',
  streetlight: 'a working repaired street light',
  trash: 'a clean area with waste removed',
  graffiti: 'clean repaired public property without graffiti',
  water_leak: 'a dry repaired water pipe with no leak',
  other: 'repaired civic infrastructure in good condition'
};

const MODEL = process.env.HF_VISION_MODEL || 'openai/clip-vit-large-patch14-336';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function getClient() {
  if (!process.env.HF_TOKEN) throw new Error('HF_TOKEN is not configured.');
  return new InferenceClient(process.env.HF_TOKEN);
}

async function loadImage(imageUrl) {
  if (imageUrl.startsWith('/uploads/')) {
    if (process.env.NODE_ENV === 'production') throw new Error('Local development uploads are not available in production.');
    const buffer = await readFile(path.join(process.cwd(), 'public', ...imageUrl.split('/').filter(Boolean)));
    if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error('Evidence image is too large for analysis.');
    return new Blob([buffer]);
  }

  const response = await fetch(imageUrl, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Unable to fetch evidence image (${response.status}).`);
  const data = await response.arrayBuffer();
  if (data.byteLength > MAX_IMAGE_BYTES) throw new Error('Evidence image is too large for analysis.');
  return new Blob([data], { type: response.headers.get('content-type') || 'application/octet-stream' });
}

async function classify(imageUrl, candidates) {
  const client = getClient();
  const image = await loadImage(imageUrl);
  return client.zeroShotImageClassification({
    model: MODEL,
    provider: 'hf-inference',
    inputs: image,
    parameters: { candidate_labels: candidates }
  }, {
    retry_on_error: false,
    signal: AbortSignal.timeout(20_000)
  });
}

export async function analyzeCivicEvidence(imageUrl, selectedCategory) {
  const candidates = Object.values(CIVIC_VISION_LABELS);
  const output = await classify(imageUrl, candidates);
  const labels = output.slice(0, 6).map((item) => ({ label: item.label, score: item.score }));
  const best = labels[0];
  const suggestedCategory = Object.entries(CIVIC_VISION_LABELS).find(([, label]) => label === best?.label)?.[0] || 'other';
  const score = Math.round((best?.score || 0) * 100);
  const categoryMatch = suggestedCategory === selectedCategory || suggestedCategory === 'other';
  const severity = Math.min(100, Math.round(score * .85 + (['pothole', 'water_leak', 'streetlight'].includes(suggestedCategory) ? 12 : 4)));
  return {
    status: score >= 72 && categoryMatch ? 'ai_verified' : score >= 38 ? 'needs_review' : 'suspicious',
    score,
    suggestedCategory,
    categoryMatch,
    severity,
    imageQuality: score >= 55 ? 'good' : score >= 30 ? 'usable' : 'poor',
    labels,
    model: `${MODEL} · Hugging Face Inference`
  };
}

export async function compareCivicEvidence(beforeImage, afterImage, category) {
  const issueLabel = CIVIC_VISION_LABELS[category] || CIVIC_VISION_LABELS.other;
  const repairedLabel = REPAIRED_LABELS[category] || REPAIRED_LABELS.other;
  const candidates = [issueLabel, repairedLabel];
  const [beforeOutput, afterOutput] = await Promise.all([
    classify(beforeImage, candidates),
    classify(afterImage, candidates)
  ]);
  const scoreFor = (output, label) => Number(output.find((item) => item.label === label)?.score || 0);
  const beforeProblemScore = Math.round(scoreFor(beforeOutput, issueLabel) * 100);
  const afterRepairScore = Math.round(scoreFor(afterOutput, repairedLabel) * 100);
  const improvementScore = Math.round((beforeProblemScore + afterRepairScore) / 2);
  return {
    improvementScore,
    beforeProblemScore,
    afterRepairScore,
    assessment: improvementScore >= 75 ? 'likely_resolved' : improvementScore >= 45 ? 'needs_review' : 'unlikely_resolved',
    model: `${MODEL} · Hugging Face before/after comparison`
  };
}
