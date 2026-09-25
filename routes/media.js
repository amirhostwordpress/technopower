const express = require('express');
const multer = require('multer');
const ftp = require('basic-ftp');
const { Readable, PassThrough } = require('stream');
const path = require('path');
const pool = require('../config/db');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// ─── Multer: memory storage — no local disk writes ──────────────────────────
const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const allowedVideoExts = ['mp4', 'webm'];
const allowedPdfExts  = ['pdf'];
const allowedExts     = [...allowedImageExts, ...allowedVideoExts, ...allowedPdfExts];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed types: images (jpg, jpeg, png, webp, gif), videos (mp4, webm), pdf.'
      ),
      false
    );
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
});

// ─── FTP helpers ─────────────────────────────────────────────────────────────

function normalizeFTPBasePath(value) {
  let basePath = String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');

  const segment = 'public_html/technopowerupload';
  while (basePath.toLowerCase().includes(segment + '/' + segment)) {
    basePath = basePath.replace(new RegExp(segment + '/' + segment, 'ig'), segment);
  }
  if (!basePath) basePath = 'public_html/technopowerupload';
  return basePath;
}

function normalizePublicUrl(value) {
  return String(value || '').replace(/\/+$/g, '');
}

function getRemoteFilename(filename) {
  const clean = path.basename(String(filename || ''));
  if (!clean || clean === '.' || clean === '..') {
    throw new Error('Invalid FTP filename.');
  }
  return clean;
}

async function getFTPSettings() {
  const [rows] = await pool.execute('SELECT meta_key, meta_value FROM site_settings');
  const get = (key, fallback) => {
    const found = rows.find(r => r.meta_key === key);
    const val = found ? found.meta_value : null;
    return val !== null && val !== '' ? val : fallback;
  };

  return {
    host:      get('ftp_host',      process.env.FTP_HOST     || ''),
    port:      parseInt(get('ftp_port', process.env.FTP_PORT || '21'), 10),
    user:      get('ftp_user',      process.env.FTP_USER     || ''),
    password:  get('ftp_password',  process.env.FTP_PASSWORD || ''),
    basePath:  normalizeFTPBasePath(get('ftp_base_path', process.env.FTP_BASE_PATH || 'public_html/technopowerupload')),
    publicUrl: normalizePublicUrl(get('ftp_public_url', process.env.FTP_PUBLIC_URL || ''))
  };
}

async function connectFTP(config) {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  await client.access({
    host:     config.host,
    port:     config.port,
    user:     config.user,
    password: config.password,
    secure:   false
  });

  await client.cd(config.basePath);
  return client;
}

/**
 * Convert a Buffer to a Readable stream so basic-ftp can consume it.
 */
function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * Build the public URL for a stored filename.
 * If publicUrl is configured, files are served directly from the FTP host.
 * If publicUrl is empty, use the built-in streaming proxy at /api/media/file/:filename
 * (this matches the Admin → Settings UI hint).
 */
function buildProxyUrl(storedName, publicUrl) {
  const normalizedPublic = normalizePublicUrl(publicUrl || process.env.FTP_PUBLIC_URL || '');
  // storedName may already be encoded; decode first so we never double-encode
  const clean = decodeURIComponent(storedName);
  if (normalizedPublic) {
    return `${normalizedPublic}/${clean}`;
  }
  // No direct public URL → fall back to backend FTP streaming proxy
  // (the proxy endpoint reads the DB row by stored_name, so use encoded form for URL safety)
  const encoded = encodeURIComponent(storedName);
  return `/api/media/file/${encoded}`;
}

// ─── PROXY: stream a file from FTP directly to the browser ───────────────────
// PUBLIC (no auth) so <img src="..."> and <video src="..."> tags work without a token.
router.get('/file/:filename', async (req, res) => {
  let client = null;

  try {
    // Express already URL-decodes req.params, so do NOT decode again
    // (a second decodeURIComponent would corrupt names containing literal '%')
    const rawFilename    = String(req.params.filename || '');
    const filename       = /%[0-9A-Fa-f]{2}/.test(rawFilename) ? decodeURIComponent(rawFilename) : rawFilename;
    const remoteFilename = getRemoteFilename(filename);

    // Look up mime type from DB
    const [rows] = await pool.execute(
      'SELECT file_type FROM ftp_files WHERE stored_name = ? LIMIT 1',
      [remoteFilename]
    );
    const mimeType = (rows[0] && rows[0].file_type) || 'application/octet-stream';

    const config = await getFTPSettings();
    client = await connectFTP(config);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Stream FTP → HTTP response directly (no intermediate PassThrough)
    await client.downloadTo(res, remoteFilename);
    await client.close();
    client = null;
    res.end();
  } catch (err) {
    if (client) { try { await client.close(); } catch (_) {} }
    console.error('Media proxy error:', err.message);
    if (!res.headersSent) {
      res.status(404).json({ error: 'NotFound', message: err.message });
    } else {
      // Headers already gone — best-effort close so browser doesn't hang
      try { res.end(); } catch (_) {}
    }
  }
});

// ─── All routes below require auth ───────────────────────────────────────────
router.use(authenticateJWT);

// ─── FTP connection test ──────────────────────────────────────────────────────
router.get('/ftp-test', async (req, res) => {
  let client = null;

  try {
    const config = await getFTPSettings();
    client = await connectFTP(config);

    const pwd     = await client.pwd();
    const listing = await client.list();

    return res.status(200).json({
      connected: true,
      ok:        true,
      status:    'ok',
      host:      config.host,
      port:      config.port,
      basePath:  config.basePath,
      currentDirectory: pwd,
      publicUrl: config.publicUrl,
      fileCount: listing.length,
      files:     listing.slice(0, 50).map(item => ({
        name: item.name,
        type: item.type,
        size: item.size
      }))
    });
  } catch (err) {
    console.error('FTP test error:', err);
    return res.status(400).json({ connected: false, ok: false, error: err.message });
  } finally {
    if (client) { try { await client.close(); } catch (_) {} }
  }
});

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
// Files are held in memory (req.file.buffer) and streamed straight to FTP.
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'UploadError', message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({
        error:   'UploadError',
        message: 'No file provided. Field name must be "file".'
      });
    }

    let client = null;

    try {
      const config         = await getFTPSettings();
      const originalName   = req.file.originalname;
      const sanitized      = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storedName     = `${Date.now()}-${sanitized}`;
      const remoteFilename = getRemoteFilename(storedName);

      // Resolve mime type
      const ext = path.extname(originalName).toLowerCase().slice(1);
      let mimeType = req.file.mimetype || 'application/octet-stream';
      if (!mimeType || mimeType === 'application/octet-stream') {
        if      (allowedImageExts.includes(ext)) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        else if (allowedVideoExts.includes(ext)) mimeType = `video/${ext}`;
        else if (allowedPdfExts.includes(ext))   mimeType = 'application/pdf';
      }

      // Stream buffer → FTP (no disk write)
      client = await connectFTP(config);
      await client.uploadFrom(bufferToStream(req.file.buffer), remoteFilename);

      // Verify size on FTP matches what multer received
      const ftpSize = await client.size(remoteFilename);
      if (Number(ftpSize) !== Number(req.file.size)) {
        throw new Error(
          `FTP upload verification failed. Buffer size: ${req.file.size}, FTP size: ${ftpSize}`
        );
      }

      const currentDirectory = await client.pwd();
      await client.close();
      client = null;

      const proxyUrl = buildProxyUrl(remoteFilename, config.publicUrl);

      const [insertResult] = await pool.execute(
        `INSERT INTO ftp_files (original_name, stored_name, file_path, file_size, file_type)
         VALUES (?,?,?,?,?)`,
        [originalName, remoteFilename, proxyUrl, req.file.size, mimeType]
      );

      return res.status(201).json({
        id:         insertResult.insertId,
        success:    true,
        url:        proxyUrl,
        name:       originalName,
        storedName: remoteFilename,
        size:       req.file.size,
        ftpSize,
        type:       mimeType,
        ftp:        { basePath: config.basePath, currentDirectory, remoteFile: remoteFilename }
      });
    } catch (uploadErr) {
      if (client) { try { await client.close(); } catch (_) {} }
      console.error('FTP upload error:', uploadErr);
      return res.status(500).json({ error: 'InternalServerError', message: uploadErr.message });
    }
  });
});

// ─── Fix existing records with broken/proxy URLs ─────────────────────────────
// POST /api/media/fix-urls  →  rewrites all file_path values consistently
router.post('/fix-urls', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, stored_name FROM ftp_files WHERE stored_name IS NOT NULL AND stored_name != ''"
    );

    const config = await getFTPSettings();

    let updated = 0;
    for (const row of rows) {
      const properUrl = buildProxyUrl(row.stored_name, config.publicUrl);
      await pool.execute('UPDATE ftp_files SET file_path = ? WHERE id = ?', [properUrl, row.id]);
      updated++;
    }

    const usingProxy = !normalizePublicUrl(config.publicUrl);
    return res.status(200).json({
      success: true,
      updated,
      message: usingProxy
        ? `${updated} record(s) updated to use the built-in FTP streaming proxy (/api/media/file/...).`
        : `${updated} record(s) updated to direct FTP URLs (${config.publicUrl}).`
    });
  } catch (err) {
    console.error('fix-urls error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

// ─── LIST ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const page       = parseInt(req.query.page, 10)  || 1;
    const limit      = parseInt(req.query.limit, 10) || 24;
    const offset     = (page - 1) * limit;
    const typeFilter = req.query.type;

    let whereClause = '';
    const params    = [];

    if (typeFilter && typeFilter !== '') {
      const type = String(typeFilter).toLowerCase();
      if (type === 'image') {
        whereClause = 'WHERE file_type LIKE ?';
        params.push('%image%');
      } else if (type === 'video') {
        whereClause = 'WHERE file_type LIKE ?';
        params.push('%video%');
      } else if (type === 'pdf') {
        whereClause = 'WHERE file_type LIKE ? OR file_type = ?';
        params.push('%pdf%', 'application/pdf');
      }
    }

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total_rows FROM ftp_files ${whereClause}`,
      params
    );
    const totalRows = countRows[0].total_rows;

    const dataParams = [...params, limit, offset];
    const [data] = await pool.execute(
      `SELECT * FROM ftp_files ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      dataParams
    );

    // Always build URLs from stored_name using the CURRENT config
    // (so if admin changes Public URL setting, previews work immediately
    //  and legacy broken file_path values in the DB don't show broken images)
    const config = await getFTPSettings();

    const normalizedData = data.map(row => {
      const rawType      = row.file_type || '';
      const friendlyType = rawType.startsWith('image') ? 'image'
        : rawType.startsWith('video') ? 'video'
        : rawType.includes('pdf')     ? 'pdf'
        : rawType;
      const freshUrl = row.stored_name ? buildProxyUrl(row.stored_name, config.publicUrl) : (row.file_path || '');
      return {
        ...row,
        file_path: freshUrl,
        url:  freshUrl,
        name: row.original_name,
        type: friendlyType,
        size: row.file_size
      };
    });

    return res.status(200).json({
      data: normalizedData,
      pagination: { page, limit, totalPages: Math.ceil(totalRows / limit), totalRows }
    });
  } catch (err) {
    console.error('Media list error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  let client = null;

  try {
    const id     = parseInt(req.params.id, 10);
    const [rows] = await pool.execute('SELECT * FROM ftp_files WHERE id=?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Media file not found.' });
    }

    const fileRecord     = rows[0];
    const config         = await getFTPSettings();
    const remoteFilename = getRemoteFilename(fileRecord.stored_name);

    client = await connectFTP(config);
    try {
      await client.remove(remoteFilename);
    } catch (ftpErr) {
      // Log but don't abort — still remove the DB record
      console.error('FTP delete warning (continuing with DB deletion):', ftpErr.message);
    }
    await client.close();
    client = null;

    await pool.execute('DELETE FROM ftp_files WHERE id=?', [id]);

    return res.status(200).json({ success: true, deletedFile: remoteFilename });
  } catch (err) {
    if (client) { try { await client.close(); } catch (_) {} }
    console.error('Media delete error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

module.exports = router;
