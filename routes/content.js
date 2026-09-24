const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const pool = require('../config/db');

router.use(authenticateJWT);

// ============================================================
// 1. HERO CONTENT
// ============================================================

router.get('/hero', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM hero_content WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Hero content not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching hero content:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch hero content.'
    });
  }
});

router.put('/hero', async (req, res) => {
  try {
    const { kicker, heading_main, heading_span, description, cta_text, cta_link, image_url } = req.body;

    await pool.execute(
      `UPDATE hero_content
       SET kicker = ?, heading_main = ?, heading_span = ?, description = ?,
           cta_text = ?, cta_link = ?, image_url = ?
       WHERE id = 1`,
      [kicker, heading_main, heading_span, description, cta_text, cta_link, image_url]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM hero_content WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Hero content not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating hero content:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update hero content.'
    });
  }
});

// ============================================================
// 2. GROUP INTRO
// ============================================================

router.get('/group-intro', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM group_intro WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Group intro not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching group intro:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch group intro.'
    });
  }
});

router.put('/group-intro', async (req, res) => {
  try {
    const { kicker, heading_main, heading_span, description } = req.body;

    await pool.execute(
      `UPDATE group_intro
       SET kicker = ?, heading_main = ?, heading_span = ?, description = ?
       WHERE id = 1`,
      [kicker, heading_main, heading_span, description]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM group_intro WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Group intro not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating group intro:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update group intro.'
    });
  }
});

// ============================================================
// 3. FACTS
// ============================================================

router.get('/facts', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM facts ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching facts:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch facts.'
    });
  }
});

router.post('/facts', async (req, res) => {
  try {
    const fact_value = req.body.fact_value !== undefined ? req.body.fact_value : req.body.value;
    const fact_label = req.body.fact_label !== undefined ? req.body.fact_label : req.body.label;
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : undefined);

    if (fact_value === undefined || fact_label === undefined) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'fact_value and fact_label are required.'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO facts (fact_value, fact_label, sort_order) VALUES (?, ?, ?)',
      [fact_value, fact_label, sort_order !== undefined ? sort_order : 0]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM facts WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating fact:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create fact.'
    });
  }
});

router.put('/facts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM facts WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Fact not found.'
      });
    }

    const fact_value = req.body.fact_value !== undefined ? req.body.fact_value : (req.body.value !== undefined ? req.body.value : existing[0].fact_value);
    const fact_label = req.body.fact_label !== undefined ? req.body.fact_label : (req.body.label !== undefined ? req.body.label : existing[0].fact_label);
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : existing[0].sort_order);

    await pool.execute(
      'UPDATE facts SET fact_value = ?, fact_label = ?, sort_order = ? WHERE id = ?',
      [fact_value, fact_label, sort_order, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM facts WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating fact:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update fact.'
    });
  }
});

router.delete('/facts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM facts WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Fact not found.'
      });
    }

    await pool.execute('DELETE FROM facts WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Fact deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting fact:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete fact.'
    });
  }
});

router.post('/facts/reorder', async (req, res) => {
  try {
    const { order, items } = req.body;
    let orderList;

    if (Array.isArray(order)) {
      orderList = order.map((id, i) => ({ id, sort_order: i }));
    } else if (Array.isArray(items)) {
      orderList = items.map((it, i) => ({
        id: it.id,
        sort_order: it.sort_order !== undefined ? it.sort_order : i
      }));
    } else {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of fact IDs or items with sort_order.'
      });
    }

    for (const entry of orderList) {
      if (entry.id === undefined || entry.id === null) continue;
      await pool.execute(
        'UPDATE facts SET sort_order = ? WHERE id = ?',
        [entry.sort_order, entry.id]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM facts ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering facts:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder facts.'
    });
  }
});

// ============================================================
// 4. COMPANIES
// ============================================================

router.get('/companies', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM companies ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch companies.'
    });
  }
});

router.post('/companies', async (req, res) => {
  try {
    const number = req.body.number !== undefined ? req.body.number : (req.body.no || '');
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : (req.body.logo !== undefined ? req.body.logo : '');
    const name = req.body.name !== undefined ? req.body.name : '';
    const description = req.body.description !== undefined ? req.body.description : '';
    const anchor_href = req.body.anchor_href !== undefined ? req.body.anchor_href : (req.body.href !== undefined ? req.body.href : '');
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : 0);

    const [result] = await pool.execute(
      `INSERT INTO companies (number, logo_url, name, description, anchor_href, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [number, logo_url, name, description, anchor_href, sort_order]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM companies WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating company:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create company.'
    });
  }
});

router.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Company not found.'
      });
    }

    const number = req.body.number !== undefined ? req.body.number : (req.body.no !== undefined ? req.body.no : existing[0].number);
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : (req.body.logo !== undefined ? req.body.logo : existing[0].logo_url);
    const name = req.body.name !== undefined ? req.body.name : existing[0].name;
    const description = req.body.description !== undefined ? req.body.description : existing[0].description;
    const anchor_href = req.body.anchor_href !== undefined ? req.body.anchor_href : (req.body.href !== undefined ? req.body.href : existing[0].anchor_href);
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : existing[0].sort_order);

    await pool.execute(
      `UPDATE companies SET number = ?, logo_url = ?, name = ?,
       description = ?, anchor_href = ?, sort_order = ? WHERE id = ?`,
      [number, logo_url, name, description, anchor_href, sort_order, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating company:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update company.'
    });
  }
});

router.delete('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Company not found.'
      });
    }

    await pool.execute('DELETE FROM companies WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Company deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting company:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete company.'
    });
  }
});

router.post('/companies/reorder', async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of company IDs.'
      });
    }

    for (let idx = 0; idx < order.length; idx++) {
      const id_val = order[idx];
      await pool.execute(
        'UPDATE companies SET sort_order = ? WHERE id = ?',
        [idx, id_val]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM companies ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering companies:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder companies.'
    });
  }
});

// ============================================================
// 5. NAV LINKS
// ============================================================

router.get('/nav-links', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM nav_links ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching nav links:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch nav links.'
    });
  }
});

router.post('/nav-links', async (req, res) => {
  try {
    const { label, href, sort_order } = req.body;

    if (label === undefined || href === undefined) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'label and href are required.'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO nav_links (label, href, sort_order) VALUES (?, ?, ?)',
      [label, href, sort_order !== undefined ? sort_order : 0]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM nav_links WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating nav link:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create nav link.'
    });
  }
});

router.put('/nav-links/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM nav_links WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Nav link not found.'
      });
    }

    const {
      label = existing[0].label,
      href = existing[0].href,
      sort_order = existing[0].sort_order
    } = req.body;

    await pool.execute(
      'UPDATE nav_links SET label = ?, href = ?, sort_order = ? WHERE id = ?',
      [label, href, sort_order, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM nav_links WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating nav link:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update nav link.'
    });
  }
});

router.delete('/nav-links/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM nav_links WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Nav link not found.'
      });
    }

    await pool.execute('DELETE FROM nav_links WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Nav link deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting nav link:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete nav link.'
    });
  }
});

router.post('/nav-links/reorder', async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of nav link IDs.'
      });
    }

    for (let idx = 0; idx < order.length; idx++) {
      const id_val = order[idx];
      await pool.execute(
        'UPDATE nav_links SET sort_order = ? WHERE id = ?',
        [idx, id_val]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM nav_links ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering nav links:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder nav links.'
    });
  }
});

// ============================================================
// 6. DIVISIONS (by slug)
// ============================================================

router.get('/divisions/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM divisions WHERE slug = ?',
      [slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Division with slug '${slug}' not found.`
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching division:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch division.'
    });
  }
});

router.put('/divisions/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM divisions WHERE slug = ?',
      [slug]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Division with slug '${slug}' not found.`
      });
    }

    const chapter_label = req.body.chapter_label !== undefined ? req.body.chapter_label : existing[0].chapter_label;
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : (req.body.logo !== undefined ? req.body.logo : existing[0].logo_url);
    const heading_main = req.body.heading_main !== undefined ? req.body.heading_main : existing[0].heading_main;
    const heading_span = req.body.heading_span !== undefined ? req.body.heading_span : existing[0].heading_span;
    const summary = req.body.summary !== undefined ? req.body.summary : (req.body.overview !== undefined ? req.body.overview : existing[0].summary);
    const media_image_url = req.body.media_image_url !== undefined ? req.body.media_image_url : (req.body.media_image !== undefined ? req.body.media_image : existing[0].media_image_url);
    const media_label = req.body.media_label !== undefined ? req.body.media_label : existing[0].media_label;
    const cta_text = req.body.cta_text !== undefined ? req.body.cta_text : existing[0].cta_text;
    const cta_link = req.body.cta_link !== undefined ? req.body.cta_link : existing[0].cta_link;

    await pool.execute(
      `UPDATE divisions
       SET chapter_label = ?, logo_url = ?, heading_main = ?, heading_span = ?,
           summary = ?, media_image_url = ?, media_label = ?, cta_text = ?,
           cta_link = ?, updated_at = NOW()
       WHERE slug = ?`,
      [chapter_label, logo_url, heading_main, heading_span, summary, media_image_url, media_label, cta_text, cta_link, slug]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM divisions WHERE slug = ?',
      [slug]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating division:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update division.'
    });
  }
});

// ============================================================
// 7. DIVISION SERVICES
// ============================================================

router.get('/division-services/:divisionId', async (req, res) => {
  try {
    const { divisionId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM division_services WHERE division_id = ? ORDER BY sort_order ASC, id ASC',
      [divisionId]
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching division services:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch division services.'
    });
  }
});

router.post('/division-services', async (req, res) => {
  try {
    const division_id = req.body.division_id;
    const column_title = req.body.column_title !== undefined ? req.body.column_title :
      (req.body.column_title_text !== undefined ? req.body.column_title_text :
        (req.body.column === 1 ? (req.body.col1_title || 'Earthworks') :
         req.body.column === 2 ? (req.body.col2_title || 'Project Support') : 'Services'));
    const title = req.body.title !== undefined ? req.body.title : req.body.name || '';
    const description = req.body.description !== undefined ? req.body.description : req.body.desc || '';
    const service_text = req.body.service_text !== undefined ? req.body.service_text :
      (description ? `${title} — ${description}` : title);
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order :
      (req.body.order !== undefined ? req.body.order : 0);

    if (division_id === undefined || service_text === '') {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'division_id and service text/title are required.'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO division_services (division_id, column_title, service_text, sort_order)
       VALUES (?, ?, ?, ?)`,
      [division_id, column_title, service_text, sort_order]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM division_services WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating division service:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create division service.'
    });
  }
});

router.put('/division-services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM division_services WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Division service not found.'
      });
    }

    const division_id = req.body.division_id !== undefined ? req.body.division_id : existing[0].division_id;
    const column_title = req.body.column_title !== undefined ? req.body.column_title :
      (req.body.column_title_text !== undefined ? req.body.column_title_text :
        (req.body.column === 1 ? (req.body.col1_title || existing[0].column_title) :
         req.body.column === 2 ? (req.body.col2_title || existing[0].column_title) : existing[0].column_title));
    const title = req.body.title !== undefined ? req.body.title : req.body.name || '';
    const description = req.body.description !== undefined ? req.body.description : req.body.desc || '';
    const service_text = req.body.service_text !== undefined ? req.body.service_text :
      ((req.body.title !== undefined || req.body.name !== undefined) ?
        (description ? `${title} — ${description}` : title) : existing[0].service_text);
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order :
      (req.body.order !== undefined ? req.body.order : existing[0].sort_order);

    await pool.execute(
      `UPDATE division_services SET division_id = ?, column_title = ?,
       service_text = ?, sort_order = ? WHERE id = ?`,
      [division_id, column_title, service_text, sort_order, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM division_services WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating division service:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update division service.'
    });
  }
});

router.delete('/division-services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM division_services WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Division service not found.'
      });
    }

    await pool.execute('DELETE FROM division_services WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Division service deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting division service:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete division service.'
    });
  }
});

router.post('/division-services/reorder', async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of division service IDs.'
      });
    }

    for (let idx = 0; idx < order.length; idx++) {
      const id_val = order[idx];
      await pool.execute(
        'UPDATE division_services SET sort_order = ? WHERE id = ?',
        [idx, id_val]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM division_services ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering division services:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder division services.'
    });
  }
});

// ============================================================
// 8. TECHNOLOGIES
// ============================================================

router.get('/technologies', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM technologies WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Technologies content not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching technologies:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch technologies content.'
    });
  }
});

router.put('/technologies', async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM technologies WHERE id = 1');
    const ex = existing[0] || {};

    const chapter_label = req.body.chapter_label !== undefined ? req.body.chapter_label : ex.chapter_label;
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : (req.body.logo !== undefined ? req.body.logo : ex.logo_url);
    const heading_main = req.body.heading_main !== undefined ? req.body.heading_main : (req.body.heading !== undefined ? req.body.heading : ex.heading_main);
    const heading_span = req.body.heading_span !== undefined ? req.body.heading_span : ex.heading_span;
    const description = req.body.description !== undefined ? req.body.description : (req.body.intro !== undefined ? req.body.intro : ex.description);
    const product_image_url = req.body.product_image_url !== undefined ? req.body.product_image_url : (req.body.product_image !== undefined ? req.body.product_image : (req.body.image_url !== undefined ? req.body.image_url : ex.product_image_url));
    const product_label = req.body.product_label !== undefined ? req.body.product_label : ex.product_label;

    await pool.execute(
      `UPDATE technologies
       SET chapter_label = ?, logo_url = ?, heading_main = ?, heading_span = ?,
           description = ?, product_image_url = ?, product_label = ?
       WHERE id = 1`,
      [chapter_label, logo_url, heading_main, heading_span, description, product_image_url, product_label]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM technologies WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Technologies content not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating technologies:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update technologies content.'
    });
  }
});

// ============================================================
// 9. PROCESS STEPS
// ============================================================

router.get('/process-steps', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM process_steps ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching process steps:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch process steps.'
    });
  }
});

router.post('/process-steps', async (req, res) => {
  try {
    const { step_num, step_text, sort_order } = req.body;

    if (step_num === undefined || step_text === undefined) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'step_num and step_text are required.'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO process_steps (step_num, step_text, sort_order) VALUES (?, ?, ?)',
      [step_num, step_text, sort_order !== undefined ? sort_order : 0]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM process_steps WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating process step:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create process step.'
    });
  }
});

router.put('/process-steps/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM process_steps WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Process step not found.'
      });
    }

    const {
      step_num = existing[0].step_num,
      step_text = existing[0].step_text,
      sort_order = existing[0].sort_order
    } = req.body;

    await pool.execute(
      'UPDATE process_steps SET step_num = ?, step_text = ?, sort_order = ? WHERE id = ?',
      [step_num, step_text, sort_order, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM process_steps WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating process step:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update process step.'
    });
  }
});

router.delete('/process-steps/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM process_steps WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Process step not found.'
      });
    }

    await pool.execute('DELETE FROM process_steps WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Process step deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting process step:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete process step.'
    });
  }
});

router.post('/process-steps/reorder', async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of process step IDs.'
      });
    }

    for (let idx = 0; idx < order.length; idx++) {
      const id_val = order[idx];
      await pool.execute(
        'UPDATE process_steps SET sort_order = ? WHERE id = ?',
        [idx, id_val]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM process_steps ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering process steps:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder process steps.'
    });
  }
});

// ============================================================
// 10. TECHBOLT
// ============================================================

router.get('/techbolt', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM techbolt WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Techbolt content not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching techbolt:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch techbolt content.'
    });
  }
});

router.put('/techbolt', async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM techbolt WHERE id = 1');
    const ex = existing[0] || {};

    const watermark = req.body.watermark !== undefined ? req.body.watermark : ex.watermark;
    const chapter_label = req.body.chapter_label !== undefined ? req.body.chapter_label : ex.chapter_label;
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : (req.body.logo !== undefined ? req.body.logo : ex.logo_url);
    const heading_main = req.body.heading_main !== undefined ? req.body.heading_main : (req.body.heading !== undefined ? req.body.heading : (req.body.name !== undefined ? req.body.name : ex.heading_main));
    const heading_span = req.body.heading_span !== undefined ? req.body.heading_span : (req.body.tagline !== undefined ? req.body.tagline : ex.heading_span);
    const description = req.body.description !== undefined ? req.body.description : ex.description;
    const product_image_url = req.body.product_image_url !== undefined ? req.body.product_image_url : (req.body.product_image !== undefined ? req.body.product_image : (req.body.image_url !== undefined ? req.body.image_url : ex.product_image_url));
    const cta_text = req.body.cta_text !== undefined ? req.body.cta_text : ex.cta_text;
    const cta_link = req.body.cta_link !== undefined ? req.body.cta_link : ex.cta_link;

    await pool.execute(
      `UPDATE techbolt
       SET watermark = ?, chapter_label = ?, logo_url = ?, heading_main = ?,
           heading_span = ?, description = ?, product_image_url = ?,
           cta_text = ?, cta_link = ?
       WHERE id = 1`,
      [watermark, chapter_label, logo_url, heading_main, heading_span, description, product_image_url, cta_text, cta_link]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM techbolt WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Techbolt content not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating techbolt:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update techbolt content.'
    });
  }
});

// ============================================================
// 11. TECHBOLT SPECS
// ============================================================

router.get('/techbolt-specs', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM techbolt_specs ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching techbolt specs:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch techbolt specs.'
    });
  }
});

router.post('/techbolt-specs', async (req, res) => {
  try {
    const spec_value = req.body.spec_value !== undefined ? req.body.spec_value : (req.body.value !== undefined ? req.body.value : '');
    const spec_unit = req.body.spec_unit !== undefined ? req.body.spec_unit : (req.body.unit !== undefined ? req.body.unit : '');
    const spec_label = req.body.spec_label !== undefined ? req.body.spec_label : (req.body.label !== undefined ? req.body.label : '');
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : 0);

    const [result] = await pool.execute(
      'INSERT INTO techbolt_specs (spec_value, spec_unit, spec_label, sort_order) VALUES (?, ?, ?, ?)',
      [spec_value, spec_unit, spec_label, sort_order]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM techbolt_specs WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating techbolt spec:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create techbolt spec.'
    });
  }
});

router.put('/techbolt-specs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM techbolt_specs WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Techbolt spec not found.'
      });
    }

    const spec_value = req.body.spec_value !== undefined ? req.body.spec_value : (req.body.value !== undefined ? req.body.value : existing[0].spec_value);
    const spec_unit = req.body.spec_unit !== undefined ? req.body.spec_unit : (req.body.unit !== undefined ? req.body.unit : existing[0].spec_unit);
    const spec_label = req.body.spec_label !== undefined ? req.body.spec_label : (req.body.label !== undefined ? req.body.label : existing[0].spec_label);
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : existing[0].sort_order);

    await pool.execute(
      'UPDATE techbolt_specs SET spec_value = ?, spec_unit = ?, spec_label = ?, sort_order = ? WHERE id = ?',
      [spec_value, spec_unit, spec_label, sort_order, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM techbolt_specs WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating techbolt spec:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update techbolt spec.'
    });
  }
});

router.delete('/techbolt-specs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM techbolt_specs WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Techbolt spec not found.'
      });
    }

    await pool.execute('DELETE FROM techbolt_specs WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Techbolt spec deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting techbolt spec:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete techbolt spec.'
    });
  }
});

router.post('/techbolt-specs/reorder', async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of techbolt spec IDs.'
      });
    }

    for (let idx = 0; idx < order.length; idx++) {
      const id_val = order[idx];
      await pool.execute(
        'UPDATE techbolt_specs SET sort_order = ? WHERE id = ?',
        [idx, id_val]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM techbolt_specs ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering techbolt specs:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder techbolt specs.'
    });
  }
});

// ============================================================
// 12. BENEFITS
// ============================================================

router.get('/benefits', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM benefits ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching benefits:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch benefits.'
    });
  }
});

router.post('/benefits', async (req, res) => {
  try {
    const benefit_num = req.body.benefit_num !== undefined ? req.body.benefit_num : (req.body.num !== undefined ? req.body.num : '');
    const benefit_heading = req.body.benefit_heading !== undefined ? req.body.benefit_heading : (req.body.heading !== undefined ? req.body.heading : '');
    const benefit_description = req.body.benefit_description !== undefined ? req.body.benefit_description : (req.body.description !== undefined ? req.body.description : '');
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : 0);

    const [result] = await pool.execute(
      `INSERT INTO benefits (benefit_num, benefit_heading, benefit_description, sort_order)
       VALUES (?, ?, ?, ?)`,
      [benefit_num, benefit_heading, benefit_description, sort_order]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM benefits WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating benefit:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create benefit.'
    });
  }
});

router.put('/benefits/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM benefits WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Benefit not found.'
      });
    }

    const benefit_num = req.body.benefit_num !== undefined ? req.body.benefit_num : (req.body.num !== undefined ? req.body.num : existing[0].benefit_num);
    const benefit_heading = req.body.benefit_heading !== undefined ? req.body.benefit_heading : (req.body.heading !== undefined ? req.body.heading : existing[0].benefit_heading);
    const benefit_description = req.body.benefit_description !== undefined ? req.body.benefit_description : (req.body.description !== undefined ? req.body.description : existing[0].benefit_description);
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : existing[0].sort_order);

    await pool.execute(
      `UPDATE benefits SET benefit_num = ?, benefit_heading = ?,
       benefit_description = ?, sort_order = ? WHERE id = ?`,
      [benefit_num, benefit_heading, benefit_description, sort_order, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM benefits WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating benefit:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update benefit.'
    });
  }
});

router.delete('/benefits/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM benefits WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Benefit not found.'
      });
    }

    await pool.execute('DELETE FROM benefits WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Benefit deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting benefit:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete benefit.'
    });
  }
});

router.post('/benefits/reorder', async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of benefit IDs.'
      });
    }

    for (let idx = 0; idx < order.length; idx++) {
      const id_val = order[idx];
      await pool.execute(
        'UPDATE benefits SET sort_order = ? WHERE id = ?',
        [idx, id_val]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM benefits ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering benefits:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder benefits.'
    });
  }
});

// ============================================================
// 13. PROOF SECTION
// ============================================================

router.get('/proof', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM proof_section WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Proof section not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching proof section:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch proof section.'
    });
  }
});

router.put('/proof', async (req, res) => {
  try {
    const { kicker, heading, description } = req.body;

    await pool.execute(
      'UPDATE proof_section SET kicker = ?, heading = ?, description = ? WHERE id = 1',
      [kicker, heading, description]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM proof_section WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Proof section not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating proof section:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update proof section.'
    });
  }
});

// ============================================================
// 14. FILMS
// ============================================================

router.get('/films', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM films ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching films:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch films.'
    });
  }
});

router.post('/films', async (req, res) => {
  try {
    const thumbnail_url = req.body.thumbnail_url !== undefined ? req.body.thumbnail_url : (req.body.thumbnail !== undefined ? req.body.thumbnail : (req.body.image_url !== undefined ? req.body.image_url : ''));
    const category = req.body.category !== undefined ? req.body.category : '';
    const title = req.body.title !== undefined ? req.body.title : '';
    const video_url = req.body.video_url !== undefined ? req.body.video_url : (req.body.url !== undefined ? req.body.url : '');
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : 0);
    const size = req.body.size !== undefined ? req.body.size : 'normal';

    const [result] = await pool.execute(
      `INSERT INTO films (thumbnail_url, category, title, video_url, sort_order, size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [thumbnail_url, category, title, video_url, sort_order, size]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM films WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating film:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create film.'
    });
  }
});

router.put('/films/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM films WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Film not found.'
      });
    }

    const thumbnail_url = req.body.thumbnail_url !== undefined ? req.body.thumbnail_url : (req.body.thumbnail !== undefined ? req.body.thumbnail : (req.body.image_url !== undefined ? req.body.image_url : existing[0].thumbnail_url));
    const category = req.body.category !== undefined ? req.body.category : existing[0].category;
    const title = req.body.title !== undefined ? req.body.title : existing[0].title;
    const video_url = req.body.video_url !== undefined ? req.body.video_url : (req.body.url !== undefined ? req.body.url : existing[0].video_url);
    const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : (req.body.order !== undefined ? req.body.order : existing[0].sort_order);
    const size = req.body.size !== undefined ? req.body.size : existing[0].size;

    await pool.execute(
      `UPDATE films SET thumbnail_url = ?, category = ?, title = ?,
       video_url = ?, sort_order = ?, size = ? WHERE id = ?`,
      [thumbnail_url, category, title, video_url, sort_order, size, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM films WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating film:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update film.'
    });
  }
});

router.delete('/films/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM films WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Film not found.'
      });
    }

    await pool.execute('DELETE FROM films WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Film deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting film:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete film.'
    });
  }
});

router.post('/films/reorder', async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of film IDs.'
      });
    }

    for (let idx = 0; idx < order.length; idx++) {
      const id_val = order[idx];
      await pool.execute(
        'UPDATE films SET sort_order = ? WHERE id = ?',
        [idx, id_val]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM films ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering films:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder films.'
    });
  }
});

// ============================================================
// 15. TESTIMONIAL
// ============================================================

router.get('/testimonial', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM testimonial WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Testimonial not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching testimonial:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch testimonial.'
    });
  }
});

router.put('/testimonial', async (req, res) => {
  try {
    const { label, quote, note } = req.body;

    await pool.execute(
      'UPDATE testimonial SET label = ?, quote = ?, note = ? WHERE id = 1',
      [label, quote, note]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM testimonial WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Testimonial not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating testimonial:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update testimonial.'
    });
  }
});

// ============================================================
// 16. DISTRIBUTION
// ============================================================

router.get('/distribution', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM distribution WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Distribution content not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching distribution:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch distribution content.'
    });
  }
});

router.put('/distribution', async (req, res) => {
  try {
    const { chapter_label, heading_main, heading_span, description, form_label, form_heading, form_button_text } = req.body;

    await pool.execute(
      `UPDATE distribution
       SET chapter_label = ?, heading_main = ?, heading_span = ?, description = ?,
           form_label = ?, form_heading = ?, form_button_text = ?
       WHERE id = 1`,
      [chapter_label, heading_main, heading_span, description, form_label, form_heading, form_button_text]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM distribution WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Distribution content not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating distribution:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update distribution content.'
    });
  }
});

// ============================================================
// 17. DISTRIBUTION REQUIREMENTS
// ============================================================

router.get('/distribution-requirements', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM distribution_requirements ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching distribution requirements:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch distribution requirements.'
    });
  }
});

router.post('/distribution-requirements', async (req, res) => {
  try {
    const { req_text, sort_order } = req.body;

    if (req_text === undefined) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'req_text is required.'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO distribution_requirements (req_text, sort_order) VALUES (?, ?)',
      [req_text, sort_order !== undefined ? sort_order : 0]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM distribution_requirements WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating distribution requirement:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create distribution requirement.'
    });
  }
});

router.put('/distribution-requirements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM distribution_requirements WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Distribution requirement not found.'
      });
    }

    const {
      req_text = existing[0].req_text,
      sort_order = existing[0].sort_order
    } = req.body;

    await pool.execute(
      'UPDATE distribution_requirements SET req_text = ?, sort_order = ? WHERE id = ?',
      [req_text, sort_order, id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM distribution_requirements WHERE id = ?',
      [id]
    );
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating distribution requirement:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update distribution requirement.'
    });
  }
});

router.delete('/distribution-requirements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM distribution_requirements WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Distribution requirement not found.'
      });
    }

    await pool.execute('DELETE FROM distribution_requirements WHERE id = ?', [id]);
    res.status(200).json({
      message: 'Distribution requirement deleted successfully.',
      deletedId: parseInt(id, 10)
    });
  } catch (err) {
    console.error('Error deleting distribution requirement:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete distribution requirement.'
    });
  }
});

router.post('/distribution-requirements/reorder', async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order must be an array of distribution requirement IDs.'
      });
    }

    for (let idx = 0; idx < order.length; idx++) {
      const id_val = order[idx];
      await pool.execute(
        'UPDATE distribution_requirements SET sort_order = ? WHERE id = ?',
        [idx, id_val]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM distribution_requirements ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering distribution requirements:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to reorder distribution requirements.'
    });
  }
});

// ============================================================
// 18. CONTACT SECTION
// ============================================================

router.get('/contact', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM contact_section WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Contact section not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching contact section:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch contact section.'
    });
  }
});

router.put('/contact', async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM contact_section WHERE id = 1');
    const ex = existing[0] || {};

    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : (req.body.logo !== undefined ? req.body.logo : ex.logo_url);
    const kicker = req.body.kicker !== undefined ? req.body.kicker : ex.kicker;
    const heading = req.body.heading !== undefined ? req.body.heading : (req.body.title !== undefined ? req.body.title : ex.heading);
    const description = req.body.description !== undefined ? req.body.description : (req.body.text !== undefined ? req.body.text : ex.description);
    const email = req.body.email !== undefined ? req.body.email : ex.email;
    const footer_left = req.body.footer_left !== undefined ? req.body.footer_left : ex.footer_left;
    const footer_right = req.body.footer_right !== undefined ? req.body.footer_right : ex.footer_right;

    await pool.execute(
      `UPDATE contact_section
       SET logo_url = ?, kicker = ?, heading = ?, description = ?,
           email = ?, footer_left = ?, footer_right = ?
       WHERE id = 1`,
      [logo_url, kicker, heading, description, email, footer_left, footer_right]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM contact_section WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Contact section not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating contact section:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update contact section.'
    });
  }
});

// ============================================================
// 19. SEO SETTINGS
// ============================================================

// ============================================================
// 20. PRODUCTS
// ============================================================

router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products ORDER BY sort_order ASC, id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to fetch products.' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const name             = req.body.name             !== undefined ? req.body.name             : '';
    const short_description = req.body.short_description !== undefined ? req.body.short_description : (req.body.description !== undefined ? req.body.description : '');
    const image_url        = req.body.image_url        !== undefined ? req.body.image_url        : (req.body.image !== undefined ? req.body.image : '');
    const category         = req.body.category         !== undefined ? req.body.category         : 'TECHBOLT';
    const is_active        = req.body.is_active        !== undefined ? (req.body.is_active ? 1 : 0) : 1;
    const sort_order       = req.body.sort_order       !== undefined ? req.body.sort_order       : (req.body.order !== undefined ? req.body.order : 0);

    if (!name.trim()) {
      return res.status(400).json({ error: 'ValidationError', message: 'Product name is required.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO products (name, short_description, image_url, category, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, short_description, image_url, category, is_active, sort_order]
    );

    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to create product.' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Product not found.' });
    }
    const ex = existing[0];

    const name              = req.body.name             !== undefined ? req.body.name             : ex.name;
    const short_description = req.body.short_description !== undefined ? req.body.short_description : (req.body.description !== undefined ? req.body.description : ex.short_description);
    const image_url         = req.body.image_url        !== undefined ? req.body.image_url        : (req.body.image !== undefined ? req.body.image : ex.image_url);
    const category          = req.body.category         !== undefined ? req.body.category         : ex.category;
    const is_active         = req.body.is_active        !== undefined ? (req.body.is_active ? 1 : 0) : ex.is_active;
    const sort_order        = req.body.sort_order       !== undefined ? req.body.sort_order       : (req.body.order !== undefined ? req.body.order : ex.sort_order);

    await pool.execute(
      `UPDATE products SET name = ?, short_description = ?, image_url = ?,
       category = ?, is_active = ?, sort_order = ?, updated_at = NOW() WHERE id = ?`,
      [name, short_description, image_url, category, is_active, sort_order, id]
    );

    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to update product.' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Product not found.' });
    }
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    res.status(200).json({ message: 'Product deleted successfully.', deletedId: parseInt(id, 10) });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to delete product.' });
  }
});

router.post('/products/reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'ValidationError', message: 'Order must be an array of product IDs.' });
    }
    for (let idx = 0; idx < order.length; idx++) {
      await pool.execute('UPDATE products SET sort_order = ? WHERE id = ?', [idx, order[idx]]);
    }
    const [rows] = await pool.execute('SELECT * FROM products ORDER BY sort_order ASC, id ASC');
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error reordering products:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to reorder products.' });
  }
});

router.get('/seo', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM seo_settings WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'SEO settings not found.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error fetching SEO settings:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch SEO settings.'
    });
  }
});

router.put('/seo', async (req, res) => {
  try {
    const { site_title, meta_description } = req.body;

    await pool.execute(
      'UPDATE seo_settings SET site_title = ?, meta_description = ? WHERE id = 1',
      [site_title, meta_description]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM seo_settings WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'SEO settings not found after update.'
      });
    }
    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error('Error updating SEO settings:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update SEO settings.'
    });
  }
});

module.exports = router;
