const path = require('path');
const fs = require('fs');
const { query, dbGet, dbAll, dbRun } = require('../config/database');

const EXPORT_DIR = path.join(__dirname, '../exports');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

// Helper: simple CSV serializer for array of objects
const toCSV = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for (const r of rows) {
    const vals = keys.map(k => {
      let v = r[k];
      if (v === null || v === undefined) return '""';
      v = String(v).replace(/"/g, '""');
      return `"${v}"`;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
};

const gatherUserData = async (userId) => {
  const user = await dbGet('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId]);
  const member = await dbGet('SELECT * FROM members WHERE user_id = ?', [userId]);
  const memberId = member ? member.id : null;

  const meals = memberId ? await dbAll('SELECT * FROM meals WHERE member_id = ?', [memberId]) : [];
  const bills = memberId ? await dbAll('SELECT * FROM bills WHERE member_id = ?', [memberId]) : [];
  const payments = memberId ? await dbAll('SELECT * FROM payments WHERE member_id = ?', [memberId]) : [];
  const complaints = memberId ? await dbAll('SELECT * FROM complaints WHERE member_id = ?', [memberId]) : [];
  const activity_logs = await dbAll('SELECT * FROM activity_logs WHERE user_id = ?', [userId]);
  const notices = await dbAll('SELECT * FROM notices WHERE created_by = ?', [userId]);
  const expenses = await dbAll('SELECT * FROM expenses WHERE created_by = ?', [userId]);

  return { user, member, meals, bills, payments, complaints, activity_logs, notices, expenses };
};

const safeFilename = (name) => name.replace(/[^a-zA-Z0-9-_\.]/g, '_');

const generateExport = async (exportId) => {
  try {
    await dbRun('UPDATE data_exports SET status = ? WHERE id = ?', ['processing', exportId]);

    const info = await dbGet('SELECT * FROM data_exports WHERE id = ?', [exportId]);
    if (!info) throw new Error('Export request not found');
    const userId = info.user_id;
    const formats = (info.formats || 'json').split(',').map(s => s.trim().toLowerCase());

    const data = await gatherUserData(userId);
    const timestamp = Date.now();
    const baseName = `export_user_${userId}_${exportId}_${timestamp}`;
    const jsonFilename = `${safeFilename(baseName)}.json`;
    const jsonPath = path.join(EXPORT_DIR, jsonFilename);

    let fileUrl = null;
    if (formats.includes('json')) {
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
      fileUrl = `/exports/${jsonFilename}`;
    }

    let csvFileNames = [];
    if (formats.includes('csv')) {
      const arrays = {
        user: data.user ? [data.user] : [],
        member: data.member ? [data.member] : [],
        meals: data.meals,
        bills: data.bills,
        payments: data.payments,
        complaints: data.complaints,
        activity_logs: data.activity_logs,
        notices: data.notices,
        expenses: data.expenses
      };

      for (const key of Object.keys(arrays)) {
        const rows = arrays[key];
        if (rows && rows.length) {
          const csv = toCSV(rows);
          const csvFilename = `${safeFilename(baseName)}_${key}.csv`;
          fs.writeFileSync(path.join(EXPORT_DIR, csvFilename), csv);
          csvFileNames.push(csvFilename);
        }
      }
      if (!fileUrl && csvFileNames.length > 0) {
        fileUrl = `/exports/${csvFileNames[0]}`;
      }
    }

    await dbRun(
      'UPDATE data_exports SET status = ?, file_url = ?, filename = ?, csv_files = ?, completed_at = NOW() WHERE id = ?',
      ['completed', fileUrl, jsonFilename, csvFileNames.join(','), exportId]
    );
  } catch (err) {
    console.error('Export generation error:', err);
    await dbRun('UPDATE data_exports SET status = ?, error_message = ? WHERE id = ?', ['failed', err.message, exportId]);
  }
};

exports.requestExport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { formats = ['json'], request_type = 'full_export' } = req.body;
    const formatsStr = Array.isArray(formats) ? formats.join(',') : String(formats);

    const result = await dbRun(
      'INSERT INTO data_exports (user_id, request_type, status, formats, requested_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, request_type, 'pending', formatsStr]
    );

    const exportId = result.insertId;
    setImmediate(() => generateExport(exportId));

    res.status(202).json({ success: true, id: exportId, status: 'pending' });
  } catch (err) {
    console.error('Request export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getExports = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await query(
      'SELECT id, request_type, status, formats, requested_at, completed_at, file_url, csv_files, error_message FROM data_exports WHERE user_id = ? ORDER BY requested_at DESC',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get exports error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const row = await dbGet('SELECT id, user_id, status, file_url, formats, requested_at, completed_at, error_message, csv_files FROM data_exports WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Export not found' });
    if (row.user_id !== userId) return res.status(403).json({ error: 'Not authorized' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.download = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const format = (req.query.format || 'json').toLowerCase();
    const resource = req.query.resource;

    const row = await dbGet('SELECT * FROM data_exports WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Export not found' });
    if (row.user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    if (format === 'csv') {
      if (!resource) {
        return res.status(400).json({ error: 'CSV resource must be specified' });
      }
      const baseName = path.basename(row.filename, path.extname(row.filename));
      const filename = `${baseName}_${resource}.csv`;
      const filePath = path.join(EXPORT_DIR, filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'CSV file not found' });
      return res.download(filePath, filename);
    }

    if (!row.filename) return res.status(404).json({ error: 'File not ready' });
    const filePath = path.join(EXPORT_DIR, row.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
    res.download(filePath, row.filename);
  } catch (err) {
    console.error('Download export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = exports;
