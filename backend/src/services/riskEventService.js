const Alert = require('../models/Alert');

const normalizeRiskLevel = (analysis = {}) => {
  const explicitLevel = String(analysis.riskLevel || analysis.risk_level || analysis.dangerLevel || analysis.danger_level || '').toUpperCase();
  if (explicitLevel === 'CRITICAL' || explicitLevel === 'SEVERE') return 'CRITICAL';
  if (explicitLevel === 'HIGH') return 'HIGH';
  if (explicitLevel === 'MEDIUM' || explicitLevel === 'MODERATE' || explicitLevel === 'YELLOW') return 'MEDIUM';
  if (explicitLevel === 'LOW' || explicitLevel === 'GREEN') return 'LOW';

  const score = Number(analysis.riskScore ?? analysis.risk_score ?? analysis.distress_score ?? 0);
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
};

const hasDangerSignal = (analysis = {}) => {
  if (analysis.crisis_flag === true || analysis.crisisFlag === true) return true;

  const dangerLevel = String(analysis.dangerLevel || analysis.danger_level || '').toUpperCase();
  if (dangerLevel === 'HIGH' || dangerLevel === 'CRITICAL' || dangerLevel === 'SEVERE') return true;

  const indicators = Array.isArray(analysis.indicators)
    ? analysis.indicators
    : Array.isArray(analysis.intentIndicators)
      ? analysis.intentIndicators
      : [];

  return indicators.some((indicator) => {
    if (typeof indicator === 'string') return true;
    return indicator && (indicator.present === true || indicator.detected === true)
      && ['HIGH', 'CRITICAL', 'SEVERE'].includes(String(indicator.severity || '').toUpperCase());
  });
};

const isEscalationEligible = (analysis = {}) => {
  const riskLevel = normalizeRiskLevel(analysis);
  return riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
};

const createRiskEvent = async ({ victimId, caseId, sourceMessageId, analysis }) => {
  const riskLevel = normalizeRiskLevel(analysis);
  if (!isEscalationEligible(analysis)) {
    return { eligible: false, riskLevel, event: null };
  }

  const eventKey = `AI_RISK:${String(sourceMessageId)}`;
  const existing = await Alert.findOne({ eventKey });
  if (existing) {
    return { eligible: true, duplicate: true, riskLevel, event: existing };
  }

  const riskScore = Math.max(0, Math.min(100, Number(
    analysis.riskScore ?? analysis.risk_score ?? analysis.distress_score ?? 0
  )));

  const event = await Alert.create({
    caseId,
    victimId,
    severity: riskLevel,
    alertType: riskLevel === 'CRITICAL' ? 'AI_CRITICAL_RISK' : 'AI_HIGH_RISK',
    description: `AI-derived ${riskLevel.toLowerCase()} risk event requires counselor review.`,
    eventKey,
    source: 'AI_RISK',
    riskScore,
    riskLevel,
  });

  return { eligible: true, duplicate: false, riskLevel, event };
};

module.exports = {
  normalizeRiskLevel,
  hasDangerSignal,
  isEscalationEligible,
  createRiskEvent,
};
