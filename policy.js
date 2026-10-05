const crypto = require('node:crypto');

const LEVELS = Object.freeze({ V: 'VISIBLE', VConst: 'CONSENT_REQUIRED', VConf: 'LEGAL_ORDER_REQUIRED', Pseudo: 'PSEUDONYMIZED', Gen: 'GENERALIZED', Aggr: 'AGGREGATED', Suppr: 'SUPPRESSED' });
const ROLES = ['PA', 'PF', 'HP', 'HI', 'IN', 'RE', 'TS', 'LS'];
const CATEGORY_ATTRIBUTES = {
  PID: ['fullName', 'dateOfBirth', 'ssn', 'address', 'phone', 'email', 'gender'],
  MD: ['clinicalData', 'pharmaceuticalData', 'medicalHistory', 'medicalIoTData', 'telemedicineData'],
  AFD: ['adminClinical', 'adminNonClinical', 'financialData']
};
const PATIENT = {
  patientId: 'P-DEMO-001',
  PID: { fullName: 'Demo Patient', dateOfBirth: '1980-06-15', ssn: '000-00-0000', address: 'Tunis', phone: '+216 00 000 000', email: 'patient@example.test', gender: 'unspecified' },
  MD: { clinicalData: 'Hypertension', pharmaceuticalData: 'Two prescribed medications', medicalHistory: 'Routine follow-up', medicalIoTData: 'Average heart rate 78 bpm', telemedicineData: 'Remote consultation record' },
  AFD: { adminClinical: 'Admission and discharge dates', adminNonClinical: 'Demo institution', financialData: 'Invoice INV-DEMO-001' }
};

function rule(role, category, attribute, consent = false, legalOrder = false) {
  if (role === 'PA') return LEVELS.V;
  if (role === 'PF') return consent ? LEVELS.V : LEVELS.Suppr;
  if (role === 'LS') return legalOrder ? LEVELS.V : LEVELS.Suppr;
  if (category === 'PID') {
    if (attribute === 'fullName') return ['HP', 'HI', 'RE', 'TS'].includes(role) ? LEVELS.Pseudo : LEVELS.Suppr;
    if (attribute === 'dateOfBirth') return LEVELS.Gen;
    if (attribute === 'ssn') return ['HI', 'IN'].includes(role) ? LEVELS.V : LEVELS.Suppr;
    if (attribute === 'address') return role === 'HI' ? LEVELS.V : role === 'RE' ? LEVELS.Gen : LEVELS.Suppr;
    if (attribute === 'phone') return role === 'HI' ? LEVELS.V : LEVELS.Suppr;
    if (attribute === 'email') return ['HP', 'HI', 'IN'].includes(role) ? LEVELS.V : LEVELS.Suppr;
    if (attribute === 'gender') return ['IN', 'RE', 'TS'].includes(role) ? LEVELS.Aggr : LEVELS.V;
  }
  if (category === 'MD') {
    if (['clinicalData', 'medicalHistory'].includes(attribute)) return ['HP', 'HI'].includes(role) ? LEVELS.V : ['IN', 'RE'].includes(role) ? LEVELS.Gen : LEVELS.Suppr;
    if (attribute === 'pharmaceuticalData') return ['HP', 'HI'].includes(role) ? LEVELS.V : role === 'RE' ? LEVELS.Aggr : role === 'IN' ? LEVELS.Gen : LEVELS.Suppr;
    if (attribute === 'medicalIoTData') return ['HP', 'HI'].includes(role) ? LEVELS.V : ['RE', 'IN'].includes(role) ? LEVELS.Aggr : LEVELS.Suppr;
    if (attribute === 'telemedicineData') return ['HP', 'HI'].includes(role) ? LEVELS.V : LEVELS.Suppr;
  }
  if (category === 'AFD') return role === 'IN' ? LEVELS.V : role === 'RE' ? LEVELS.Aggr : role === 'HI' ? LEVELS.Gen : LEVELS.Suppr;
  return LEVELS.Suppr;
}

function transform(value, level, patientId) {
  if (level === LEVELS.Pseudo) return `subject-${crypto.createHash('sha256').update(`${patientId}:${value}`).digest('hex').slice(0, 8)}`;
  if (level === LEVELS.Gen) return value.includes('-') ? '30-49 years / generalized' : 'generalized';
  if (level === LEVELS.Aggr) return 'aggregated cohort value';
  if (level === LEVELS.Suppr) return '[SUPPRESSED]';
  return value;
}

function evaluate({ role, category, attribute, consent = false, legalOrder = false }) {
  if (!ROLES.includes(role)) throw new Error('Unknown stakeholder role');
  if (!CATEGORY_ATTRIBUTES[category]?.includes(attribute)) throw new Error('Unknown data attribute');
  const decision = rule(role, category, attribute, consent, legalOrder);
  return { decision, granted: decision !== LEVELS.Suppr, value: transform(PATIENT[category][attribute], decision, PATIENT.patientId), patientId: PATIENT.patientId };
}

module.exports = { CATEGORY_ATTRIBUTES, LEVELS, PATIENT, ROLES, evaluate };
