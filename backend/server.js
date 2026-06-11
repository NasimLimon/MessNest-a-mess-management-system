require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const activityLogger = require('./middleware/activityLogger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', activityLogger);
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/activity', require('./routes/activity'));
// Data export routes
app.use('/api/data-export', require('./routes/dataExport'));

// Serve generated export files
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`MessNest server running on http://localhost:${PORT}`);
});
