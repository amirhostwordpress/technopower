const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');

const router = express.Router();

const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many enquiries from this IP. Please try again after one hour.'
  }
});

function getSiteSetting(settings, key, fallback = '') {
  const found = settings.find(s => s.meta_key === key);
  return found ? (found.meta_value || fallback) : fallback;
}

router.get('/site', async (req, res) => {
  try {
    const [
      seoRows,
      navRows,
      heroRows,
      groupRows,
      factRows,
      companyRows,
      divisionRows,
      techRows,
      processRows,
      techboltRows,
      techboltSpecRows,
      benefitRows,
      proofRows,
      filmRows,
      testimonialRows,
      distRows,
      distReqRows,
      contactRows,
      siteSettingsRows,
      productRows
    ] = await Promise.all([
      pool.execute('SELECT * FROM seo_settings WHERE id=1').then(r => r[0]),
      pool.execute('SELECT * FROM nav_links ORDER BY sort_order ASC').then(r => r[0]),
      pool.execute('SELECT * FROM hero_content WHERE id=1').then(r => r[0]),
      pool.execute('SELECT * FROM group_intro WHERE id=1').then(r => r[0]),
      pool.execute('SELECT * FROM facts ORDER BY sort_order ASC').then(r => r[0]),
      pool.execute('SELECT * FROM companies ORDER BY sort_order ASC').then(r => r[0]),
      pool.execute("SELECT * FROM divisions WHERE slug IN ('building','technical') ORDER BY slug ASC").then(r => r[0]),
      pool.execute('SELECT * FROM technologies WHERE id=1').then(r => r[0]),
      pool.execute('SELECT * FROM process_steps ORDER BY sort_order ASC').then(r => r[0]),
      pool.execute('SELECT * FROM techbolt WHERE id=1').then(r => r[0]),
      pool.execute('SELECT * FROM techbolt_specs ORDER BY sort_order ASC').then(r => r[0]),
      pool.execute('SELECT * FROM benefits ORDER BY sort_order ASC').then(r => r[0]),
      pool.execute('SELECT * FROM proof_section WHERE id=1').then(r => r[0]),
      pool.execute('SELECT * FROM films ORDER BY sort_order ASC').then(r => r[0]),
      pool.execute('SELECT * FROM testimonial WHERE id=1').then(r => r[0]),
      pool.execute('SELECT * FROM distribution WHERE id=1').then(r => r[0]),
      pool.execute('SELECT * FROM distribution_requirements ORDER BY sort_order ASC').then(r => r[0]),
      pool.execute('SELECT * FROM contact_section WHERE id=1').then(r => r[0]),
      pool.execute('SELECT meta_key, meta_value FROM site_settings').then(r => r[0]),
      pool.execute('SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').then(r => r[0])
    ]);

    const divisions = { building: null, technical: null };
    const divisionsAll = divisionRows.map(d => ({ ...d }));
    const divisionServicesAll = [];
    const divIdToSlug = {};
    divisionRows.forEach(d => { divIdToSlug[d.id] = d.slug; });

    for (const div of divisionRows) {
      const [serviceRows] = await pool.execute(
        'SELECT * FROM division_services WHERE division_id = ? ORDER BY sort_order ASC',
        [div.id]
      );
      const key = div.slug;
      divisions[key] = {
        ...div,
        services: serviceRows
      };
      serviceRows.forEach(s => {
        divisionServicesAll.push({
          ...s,
          division_slug: divIdToSlug[s.division_id] || (s.division_id === 1 ? 'building' : 'technical')
        });
      });
    }

    const seo = seoRows[0] || null;
    const nav = navRows;
    const hero = heroRows[0] || null;
    const group = groupRows[0] || null;
    const facts = factRows;
    const companies = companyRows;
    const technologies = techRows[0] || null;
    const processSteps = processRows;
    const techbolt = techboltRows[0] || null;
    const techboltSpecs = techboltSpecRows;
    const benefits = benefitRows;
    const proof = proofRows[0] || null;
    const films = filmRows;
    const testimonial = testimonialRows[0] || null;
    const distribution = distRows[0] || null;
    const distributionRequirements = distReqRows;
    const contact = contactRows[0] || null;
    const products = productRows;

    const ftpPublicUrl = getSiteSetting(siteSettingsRows, 'ftp_public_url', process.env.FTP_PUBLIC_URL || '');
    const enrichedFilms = films.map(f => ({
      ...f,
      _public_url_prefix: ftpPublicUrl
    }));

    res.setHeader('Cache-Control', 'public, max-age=60');

    return res.status(200).json({
      seo,
      nav,
      hero,
      group,
      facts,
      companies,
      divisions,
      divisionsAll,
      divisionServicesAll,
      technologies,
      processSteps,
      techbolt,
      techboltSpecs,
      benefits,
      proof,
      films: enrichedFilms,
      testimonial,
      distribution,
      distributionRequirements,
      contact,
      products
    });
  } catch (err) {
    console.error('Public site content error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

router.post('/enquiries', enquiryLimiter, async (req, res) => {
  try {
    const { company, country, name, email, phone, capability } = req.body;

    if (!company || !country || !name || !email || !phone || !capability) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'All fields are required: company, country, name, email, phone, capability.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'A valid email address is required.'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO enquiries (company, country, contact_person, email, phone, capability) VALUES (?,?,?,?,?,?)',
      [company, country, name, email, phone, capability]
    );

    return res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Public enquiry submit error:', err);
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

module.exports = router;
