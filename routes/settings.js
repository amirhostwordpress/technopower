require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticateJWT, requireSuperAdmin } = require('../middleware/auth');
const { requiredFields, validateEmail } = require('../middleware/validate');

router.use(authenticateJWT);

router.get('/ftp', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT meta_key, meta_value FROM site_settings WHERE meta_key LIKE 'ftp_%'"
    );

    const result = {};
    const keyMap = {
      'ftp_host': 'host',
      'ftp_port': 'port',
      'ftp_user': 'user',
      'ftp_password': 'password',
      'ftp_base_path': 'base_path',
      'ftp_public_url': 'public_url'
    };

    for (const row of rows) {
      if (keyMap[row.meta_key]) {
        result[keyMap[row.meta_key]] = row.meta_value;
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Get FTP settings error:', err);
    return res.status(500).json({ error: 'An error occurred while fetching FTP settings.' });
  }
});

router.put(
  '/ftp',
  requiredFields(['host', 'port', 'user', 'password', 'base_path', 'public_url']),
  async (req, res) => {
    try {
      let {
        host,
        port,
        user,
        password,
        base_path,
        public_url
      } = req.body;

      base_path = String(base_path || '')
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '');

      const duplicate =
        'public_html/technopowerupload/public_html/technopowerupload';

      if (base_path.toLowerCase() === duplicate) {
        base_path = 'public_html/technopowerupload';
      }

      const segment = 'public_html/technopowerupload';
      while (base_path.toLowerCase().includes(segment + '/' + segment)) {
        base_path = base_path.replace(
          new RegExp(segment + '/' + segment, 'ig'),
          segment
        );
      }

      if (!base_path) {
        base_path = 'public_html/technopowerupload';
      }

      public_url = String(public_url || '').replace(/\/+$/g, '');

      const settings = [
        { key: 'ftp_host', value: host },
        { key: 'ftp_port', value: port },
        { key: 'ftp_user', value: user },
        { key: 'ftp_password', value: password },
        { key: 'ftp_base_path', value: base_path },
        { key: 'ftp_public_url', value: public_url }
      ];

      for (const setting of settings) {
        await pool.execute(
          `INSERT INTO site_settings (meta_key, meta_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)`,
          [setting.key, String(setting.value ?? '')]
        );
      }

      return res.status(200).json({
        message: 'FTP settings updated successfully.',
        settings: {
          host,
          port,
          user,
          base_path,
          public_url
        }
      });
    } catch (err) {
      console.error('Update FTP settings error:', err);
      return res.status(500).json({
        error: 'An error occurred while updating FTP settings.'
      });
    }
  }
);

module.exports = router;
