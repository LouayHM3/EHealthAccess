const express = require('express');
const path = require('node:path');
const { evaluate, LEVELS } = require('./policy');

const app = express();
const auditLog = [];
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: 'demo', service: 'ehealth-access-control' }));
app.get('/api/audit', (_req, res) => res.json(auditLog.slice(-30).reverse()));
app.post('/api/access', (req, res) => {
  try {
    const result = evaluate(req.body || {});
    const event = { id: `evt-${auditLog.length + 1}`, timestamp: new Date().toISOString(), requester: req.body.role, category: req.body.category, attribute: req.body.attribute, decision: result.decision, granted: result.granted, txHash: `0xdemo${String(auditLog.length + 1).padStart(8, '0')}` };
    auditLog.push(event);
    res.status(result.granted ? 200 : 403).json({ ...result, event, notice: result.decision === LEVELS.Suppr ? 'Access denied and no raw value was released.' : 'Decision applied through the demo policy engine.' });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

if (require.main === module) app.listen(process.env.PORT || 3000, () => console.log(`EHealth Access demo listening on http://localhost:${process.env.PORT || 3000}`));
module.exports = { app, auditLog };
