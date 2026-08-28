import { SLA_HOURS } from './constants.js';

export function priorityFromScore(score) {
  if (score >= 76) return 'urgent';
  if (score >= 56) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

export function calculateRisk({ evidenceSeverity = 0, confirmations = 0, ageHours = 0, sensitiveLocation = false, nearbyReports = 0, recurrence = 0 } = {}) {
  const factors = {
    aiSeverity: Math.min(30, Math.round(Number(evidenceSeverity || 0) * .3)),
    citizenImpact: Math.min(20, confirmations * 3),
    reportAge: Math.min(15, Math.floor(ageHours / 24) * 2),
    locationSensitivity: sensitiveLocation ? 20 : 5,
    nearbyReports: Math.min(10, nearbyReports * 2),
    recurrence: Math.min(5, recurrence)
  };
  const score = Math.min(100, Math.max(0, Object.values(factors).reduce((sum, value) => sum + value, 0)));
  return { score, label: priorityFromScore(score), factors, calculatedAt: new Date() };
}

export function buildSla(priority, from = new Date()) {
  const targetHours = SLA_HOURS[priority] || SLA_HOURS.medium;
  return { targetHours, dueAt: new Date(new Date(from).getTime() + targetHours * 3_600_000), escalationLevel: 0 };
}

export function calculateTrust(report) {
  const ai = Number(report.evidenceAnalysis?.score || 0);
  const impact = Math.min(100, (report.impactConfirmations?.length || 0) * 10);
  const confirmations = report.communityVerifications || [];
  const positive = confirmations.filter((item) => item.verdict === 'still_exists').length;
  const negative = confirmations.filter((item) => item.verdict === 'incorrect').length;
  const community = confirmations.length ? Math.max(0, Math.min(100, 50 + (positive - negative) * 12)) : 40;
  const issueScore = Math.round(ai * .45 + impact * .2 + community * .25 + 10);
  const afterProof = report.resolutionEvidence?.images?.length ? 80 : 0;
  const improvement = Number(report.resolutionEvidence?.aiImprovementScore || 0);
  const citizen = report.citizenFeedback?.resolved === true ? 100 : report.citizenFeedback?.resolved === false ? 0 : 40;
  const resolutionScore = Math.round(afterProof * .3 + improvement * .4 + citizen * .3);
  const proofSteps = [report.images?.length, report.evidenceAnalysis?.analyzedAt, confirmations.length, report.assignedTo?.department, report.sla?.dueAt, report.resolutionEvidence?.images?.length, report.citizenFeedback?.submittedAt].filter(Boolean).length;
  return { issueScore: Math.min(100, issueScore), resolutionScore: Math.min(100, resolutionScore), proofIntegrity: Math.round((proofSteps / 7) * 100) };
}

export function reputationTier(score) {
  if (score >= 1000) return 'civic_champion';
  if (score >= 300) return 'trusted';
  if (score >= 75) return 'contributor';
  return 'newcomer';
}

export function haversineMeters([lng1, lat1], [lng2, lat2]) {
  const radius = 6_371_000;
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
