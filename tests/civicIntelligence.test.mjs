import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSla, calculateRisk, calculateTrust, haversineMeters, priorityFromScore, reputationTier } from '../src/lib/civicIntelligence.js';

test('risk scoring turns strong evidence and community impact into urgent priority', () => {
  const risk = calculateRisk({ evidenceSeverity: 100, confirmations: 8, ageHours: 96, sensitiveLocation: true, nearbyReports: 5, recurrence: 5 });
  assert.equal(risk.score, 93);
  assert.equal(risk.label, 'urgent');
  assert.equal(priorityFromScore(55), 'medium');
  assert.equal(priorityFromScore(56), 'high');
});

test('SLA targets are derived from civic priority', () => {
  const startedAt = new Date('2026-08-27T00:00:00.000Z');
  const urgent = buildSla('urgent', startedAt);
  assert.equal(urgent.targetHours, 6);
  assert.equal(urgent.dueAt.toISOString(), '2026-08-27T06:00:00.000Z');
});

test('proof-chain trust includes citizen confirmation and resolution evidence', () => {
  const trust = calculateTrust({
    images: ['/uploads/example.png'],
    evidenceAnalysis: { score: 90, analyzedAt: new Date() },
    impactConfirmations: [{ user: '1' }, { user: '2' }],
    communityVerifications: [{ verdict: 'still_exists' }],
    assignedTo: { department: 'department' },
    sla: { dueAt: new Date() },
    resolutionEvidence: { images: ['/uploads/after.png'], aiImprovementScore: 85 },
    citizenFeedback: { resolved: true, submittedAt: new Date() }
  });
  assert.ok(trust.issueScore >= 70);
  assert.ok(trust.resolutionScore >= 85);
  assert.equal(trust.proofIntegrity, 100);
});

test('community validation distance is calculated in meters', () => {
  assert.equal(Math.round(haversineMeters([77.209, 28.6139], [77.209, 28.6139])), 0);
  assert.ok(haversineMeters([77.209, 28.6139], [77.21, 28.6149]) < 1000);
});

test('civic reputation tiers advance at stable thresholds', () => {
  assert.equal(reputationTier(74), 'newcomer');
  assert.equal(reputationTier(75), 'contributor');
  assert.equal(reputationTier(1000), 'civic_champion');
});
