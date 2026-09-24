const express = require('express');
const pool = require('../config/db');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);

router.get('/stats', async (req, res) => {
  try {
    const [totalRows] = await pool.execute('SELECT COUNT(*) AS total FROM enquiries');
    const [newRows] = await pool.execute('SELECT COUNT(*) AS new_count FROM enquiries WHERE read_status=0');

    return res.status(200).json({
      total: totalRows[0].total,
      new: newRows[0].new_count
    });
  } catch (err) {
    console.error('Enquiries stats error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const readFilter = req.query.read;

    let whereClause = '';
    const params = [];

    if (readFilter !== undefined && readFilter !== '') {
      whereClause = 'WHERE read_status = ?';
      params.push(parseInt(readFilter, 10));
    }

    const countSql = `SELECT COUNT(*) AS total_rows FROM enquiries ${whereClause}`;
    const [countRows] = await pool.execute(countSql, params);
    const totalRows = countRows[0].total_rows;

    params.push(limit, offset);
    const dataSql = `SELECT * FROM enquiries ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [data] = await pool.execute(dataSql, params);

    const totalPages = Math.ceil(totalRows / limit);

    return res.status(200).json({
      data,
      pagination: {
        page,
        limit,
        totalPages,
        totalRows
      }
    });
  } catch (err) {
    console.error('Enquiries list error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

router.get('/export/csv', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM enquiries ORDER BY created_at DESC');

    function escapeCSV(val) {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    const headers = ['ID', 'Company', 'Country', 'Contact Person', 'Email', 'Phone', 'Capability', 'Created At', 'Read Status'];
    const csvRows = [headers.map(escapeCSV).join(',')];

    for (const row of rows) {
      const readStatus = row.read_status === 1 ? 'Read' : 'New';
      const created = row.created_at ? new Date(row.created_at).toISOString() : '';
      csvRows.push([
        row.id,
        row.company,
        row.country,
        row.contact_person,
        row.email,
        row.phone,
        row.capability,
        created,
        readStatus
      ].map(escapeCSV).join(','));
    }

    const csvContent = csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=enquiries.csv');
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('Enquiries CSV export error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.execute('SELECT * FROM enquiries WHERE id=?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Enquiry not found.' });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Enquiry get error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const [checkRows] = await pool.execute('SELECT id FROM enquiries WHERE id=?', [id]);
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Enquiry not found.' });
    }

    await pool.execute('UPDATE enquiries SET read_status = IF(read_status=0, 1, 0) WHERE id=?', [id]);

    const [updatedRows] = await pool.execute('SELECT * FROM enquiries WHERE id=?', [id]);
    return res.status(200).json(updatedRows[0]);
  } catch (err) {
    console.error('Enquiry toggle read error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const [checkRows] = await pool.execute('SELECT id FROM enquiries WHERE id=?', [id]);
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Enquiry not found.' });
    }

    await pool.execute('DELETE FROM enquiries WHERE id=?', [id]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Enquiry delete error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

module.exports = router;
