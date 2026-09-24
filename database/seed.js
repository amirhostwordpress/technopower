require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { exec } = require('child_process');
const path = require('path');

async function runMigrationsFirst() {
  return new Promise((resolve, reject) => {
    const migratePath = path.join(__dirname, 'migrate.js');
    exec(`node "${migratePath}"`, (err, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      if (err) return reject(err);
      resolve();
    });
  });
}

async function seed() {
  try {
    console.log('Running migrations first...');
    await runMigrationsFirst();
    console.log('Migrations finished. Starting seed...');

    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10);

    await pool.execute(
      `INSERT INTO admins (id, email, password_hash, name, role)
       SELECT ?, ?, ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM admins WHERE id = ?)`,
      [1, process.env.ADMIN_EMAIL || 'admin@techpoweruae.com', passwordHash, 'Super Admin', 'super_admin', 1]
    );
    console.log('Admin user seeded.');

    await pool.execute(
      `REPLACE INTO hero_content (id, kicker, heading_main, heading_span, description, cta_text, cta_link, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        'TECH POWER GROUP · UNITED ARAB EMIRATES',
        'Built for the',
        'work ahead.',
        'Contracting strength, technical execution and practical engineering—brought together under one focused group.',
        'Explore our capabilities',
        '#companies',
        'assets/hero-earthworks-full-hd.webp'
      ]
    );
    console.log('hero_content seeded.');

    await pool.execute(
      `REPLACE INTO group_intro (id, kicker, heading_main, heading_span, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        1,
        'THE GROUP',
        'Experience on site.',
        'Thinking beyond it.',
        'Tech Power brings together specialist businesses serving construction, infrastructure and equipment markets. Each company has a clear role; together they provide one accountable route from site execution to engineered solutions.'
      ]
    );
    console.log('group_intro seeded.');

    const facts = [
      [1, '4', 'Focused brands', 0],
      [2, 'UAE', 'Base of operations', 1],
      [3, 'One', 'Delivery mindset', 2]
    ];
    for (const f of facts) {
      await pool.execute(
        `REPLACE INTO facts (id, fact_value, fact_label, sort_order) VALUES (?, ?, ?, ?)`,
        f
      );
    }
    console.log('facts seeded.');

    const companies = [
      [1, '01', 'assets/logo-building-contracting-hd.png', 'Building Contracting', 'Earthworks, civil works and enabling packages', '#building', 0],
      [2, '02', 'assets/logo-technical-services-hd.png', 'Technical Services', 'Specialist work, maintenance and project support', '#technical', 1],
      [3, '03', 'assets/logo-technologies-hd.png', 'Technologies', 'Product engineering, manufacturing and lifecycle support', '#technology', 2],
      [4, '04', 'assets/logo-techbolt-hd.png', 'TECHBOLT', 'Modular hydraulic concrete pile breaking system', '#techbolt', 3]
    ];
    for (const c of companies) {
      await pool.execute(
        `REPLACE INTO companies (id, number, logo_url, name, description, anchor_href, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        c
      );
    }
    console.log('companies seeded.');

    await pool.execute(
      `REPLACE INTO divisions (id, slug, chapter_label, logo_url, heading_main, heading_span, summary, media_image_url, media_label, cta_text, cta_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        'building',
        '01 · BUILDING CONTRACTING',
        'assets/logo-building-contracting-reverse.png',
        'Groundwork that',
        'keeps projects moving.',
        'Planned resources, experienced operators and coordinated delivery for large-volume earthworks and civil enabling activities.',
        'assets/hero-earthworks-full-hd.webp',
        'EARTHWORKS · CIVIL · PLANT',
        'Discuss a contracting requirement',
        '#contact'
      ]
    );

    await pool.execute(
      `REPLACE INTO divisions (id, slug, chapter_label, logo_url, heading_main, heading_span, summary, media_image_url, media_label, cta_text, cta_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        2,
        'technical',
        '02 · TECHNICAL SERVICES',
        'assets/logo-technical-services-reverse.png',
        'Skilled support.',
        'Delivered responsibly.',
        'Flexible technical teams for specialist construction tasks, maintenance requirements and changing site programmes.',
        'assets/technical-services-full-hd.webp',
        'PEOPLE · SKILL · SITE RESPONSE',
        'Plan technical support',
        '#contact'
      ]
    );
    console.log('divisions seeded.');

    const buildingServices = [
      [1, 1, 'Earthworks', 'Bulk excavation', 0],
      [2, 1, 'Earthworks', 'Backfilling and compaction', 1],
      [3, 1, 'Earthworks', 'Sand loading and shifting', 2],
      [4, 1, 'Earthworks', 'Grading and site preparation', 3],
      [5, 1, 'Project support', 'Road and infrastructure works', 4],
      [6, 1, 'Project support', 'Plant and equipment deployment', 5],
      [7, 1, 'Project support', 'Tipper and trailer operations', 6],
      [8, 1, 'Project support', 'Site supervision and coordination', 7]
    ];
    const technicalServices = [
      [9, 2, 'Site services', 'Manual pile breaking', 0],
      [10, 2, 'Site services', 'Block and plaster works', 1],
      [11, 2, 'Site services', 'Tile and finishing works', 2],
      [12, 2, 'Site services', 'Specialist installation support', 3],
      [13, 2, 'Technical support', 'Maintenance and corrective works', 4],
      [14, 2, 'Technical support', 'Skilled manpower deployment', 5],
      [15, 2, 'Technical support', 'MEP assistance', 6],
      [16, 2, 'Technical support', 'Site coordination', 7]
    ];
    for (const s of [...buildingServices, ...technicalServices]) {
      await pool.execute(
        `REPLACE INTO division_services (id, division_id, column_title, service_text, sort_order) VALUES (?, ?, ?, ?, ?)`,
        s
      );
    }
    console.log('division_services seeded.');

    await pool.execute(
      `REPLACE INTO technologies (id, chapter_label, logo_url, heading_main, heading_span, description, product_image_url, product_label)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        '03 · TECH POWER TECHNOLOGIES',
        'assets/logo-technologies-reverse.png',
        'Engineering shaped',
        'by field experience.',
        'We develop practical construction equipment around real operating conditions—considering manufacturing, maintenance and long-term service from the first drawing.',
        'assets/techbolt-module-hd.webp',
        'MODEL 313 · ENGINEERED MODULE'
      ]
    );
    console.log('technologies seeded.');

    const processSteps = [
      [1, '01', 'Observe the need', 0],
      [2, '02', 'Engineer the solution', 1],
      [3, '03', 'Manufacture and test', 2],
      [4, '04', 'Support the product', 3]
    ];
    for (const p of processSteps) {
      await pool.execute(
        `REPLACE INTO process_steps (id, step_num, step_text, sort_order) VALUES (?, ?, ?, ?)`,
        p
      );
    }
    console.log('process_steps seeded.');

    await pool.execute(
      `REPLACE INTO techbolt (id, watermark, chapter_label, logo_url, heading_main, heading_span, description, product_image_url, cta_text, cta_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        '313',
        'FLAGSHIP PRODUCT',
        'assets/logo-techbolt-hd.png',
        'One modular system.',
        'Multiple pile diameters.',
        'TECHBOLT Model 313 is designed for controlled crunching of round reinforced-concrete pile heads. Links are added or removed to suit the reviewed pile application.',
        'assets/techbolt-module-hd.webp',
        'Request a TECHBOLT review',
        '#contact'
      ]
    );
    console.log('techbolt seeded.');

    const specs = [
      [1, '320', 'bar', 'Maximum working pressure', 0],
      [2, '190', 'mm', 'Chisel travel', 1],
      [3, '240', 'kg', 'Approximate module weight', 2]
    ];
    for (const s of specs) {
      await pool.execute(
        `REPLACE INTO techbolt_specs (id, spec_value, spec_unit, spec_label, sort_order) VALUES (?, ?, ?, ?, ?)`,
        s
      );
    }
    console.log('techbolt_specs seeded.');

    const benefits = [
      [1, '01', 'Modular configuration', 'Change the ring opening by adjusting the number of connected links.', 0],
      [2, '02', 'Compact architecture', 'Purpose-designed modules avoid the bulk of a conventional plate frame.', 1],
      [3, '03', 'Service-minded design', 'Internal cylinder components are arranged for controlled workshop servicing.', 2],
      [4, '04', 'Application review', 'Every selection is checked against pile and carrier information before supply.', 3]
    ];
    for (const b of benefits) {
      await pool.execute(
        `REPLACE INTO benefits (id, benefit_num, benefit_heading, benefit_description, sort_order) VALUES (?, ?, ?, ?, ?)`,
        b
      );
    }
    console.log('benefits seeded.');

    await pool.execute(
      `REPLACE INTO proof_section (id, kicker, heading, description)
       VALUES (?, ?, ?, ?)`,
      [
        1,
        'PROOF, NOT NOISE',
        'Work in motion.',
        'Project footage, product demonstrations and verified client experience will live here—cleanly presented without social-media overlays.'
      ]
    );
    console.log('proof_section seeded.');

    const films = [
      [1, 'assets/hero-earthworks-full-hd.webp', 'BUILDING CONTRACTING', 'Earthworks and logistics', '#', 0, 'large'],
      [2, 'assets/technical-services-full-hd.webp', 'TECHNICAL SERVICES', 'People behind delivery', '#', 1, 'normal'],
      [3, 'assets/techbolt-module-hd.webp', 'TECHBOLT', 'Model 313 demonstration', '#', 2, 'product']
    ];
    for (const f of films) {
      await pool.execute(
        `REPLACE INTO films (id, thumbnail_url, category, title, video_url, sort_order, size) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        f
      );
    }
    console.log('films seeded.');

    await pool.execute(
      `REPLACE INTO testimonial (id, label, quote, note)
       VALUES (?, ?, ?, ?)`,
      [
        1,
        'CLIENT VOICES',
        'Verified project feedback and measurable results will be published here after client approval.',
        'No invented names. No generic testimonials.'
      ]
    );
    console.log('testimonial seeded.');

    await pool.execute(
      `REPLACE INTO distribution (id, chapter_label, heading_main, heading_span, description, form_label, form_heading, form_button_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        'GLOBAL DISTRIBUTOR OPPORTUNITY',
        'Can you build the',
        'TECHBOLT market?',
        'We are inviting capable construction-equipment distributors and service partners to represent TECHBOLT in selected countries.',
        'DISTRIBUTOR ENQUIRY',
        'Tell us about your capability.',
        'Send distributor enquiry'
      ]
    );
    console.log('distribution seeded.');

    const distReqs = [
      [1, 'Established contractor and equipment network', 0],
      [2, 'Sales, demonstration and market-development capability', 1],
      [3, 'Local technical and after-sales support', 2]
    ];
    for (const r of distReqs) {
      await pool.execute(
        `REPLACE INTO distribution_requirements (id, req_text, sort_order) VALUES (?, ?, ?)`,
        r
      );
    }
    console.log('distribution_requirements seeded.');

    await pool.execute(
      `REPLACE INTO contact_section (id, logo_url, kicker, heading, description, email, footer_left, footer_right)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        'assets/tech-power-group-reverse.png',
        'START A CONVERSATION',
        'Bring us the challenge.',
        'Contracting projects, technical support, TECHBOLT application reviews and international distribution.',
        'info@techpoweruae.com',
        'Tech Power Group · United Arab Emirates',
        '© 2026 Tech Power Group'
      ]
    );
    console.log('contact_section seeded.');

    const navLinks = [
      [1, 'Group', '#group', 0],
      [2, 'Companies', '#companies', 1],
      [3, 'TECHBOLT', '#techbolt', 2],
      [4, 'Distribution', '#distribution', 3],
      [5, 'Contact', '#contact', 4]
    ];
    for (const n of navLinks) {
      await pool.execute(
        `REPLACE INTO nav_links (id, label, href, sort_order) VALUES (?, ?, ?, ?)`,
        n
      );
    }
    console.log('nav_links seeded.');

    await pool.execute(
      `REPLACE INTO seo_settings (id, site_title, meta_description)
       VALUES (?, ?, ?)`,
      [
        1,
        'Tech Power Group — Dynamic Industrial Website',
        'Tech Power Group — contracting, technical services, engineering technologies and TECHBOLT pile breaking systems from the UAE.'
      ]
    );
    console.log('seo_settings seeded.');

    const products = [
      [1,  'TECHBOLT Model 313 – Modular Round Pile Crusher',    'Modular hydraulic system designed to crush round reinforced-concrete pile heads. Links are added or removed to suit the reviewed pile diameter and application.',                                    'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 0],
      [2,  'TECHBOLT 313 Round Pile Breaker',                    'Purpose-engineered for controlled breaking of circular pile heads on construction sites. Adjustable module configuration ensures compatibility across a wide range of pile diameters.',               'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 1],
      [3,  'TECHBOLT 313 Hydraulic Pile Crusher',                'High-pressure hydraulic operation at up to 320 bar delivers consistent, controlled force to concrete pile heads. Designed for carrier-mounted deployment with minimal site disruption.',                'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 2],
      [4,  'TECHBOLT 313 Circular Pile Head Breaker',            'Specifically optimised for circular pile geometries. The ring-based architecture wraps the pile head precisely, delivering even load distribution for clean, controlled breaks.',                       'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 3],
      [5,  'TECHBOLT 313 Reinforced Concrete Pile Crusher',      'Built to handle reinforced-concrete pile heads encountered in heavy civil and foundation works. The chisel travel of 190 mm accommodates varying rebar cage configurations.',                          'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 4],
      [6,  'TECHBOLT 313 Modular Pile Head Crusher',             'The modular architecture allows rapid reconfiguration between pile sizes without specialist tooling. Compact at approximately 240 kg, it suits a broad range of carrier machines.',                    'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 5],
      [7,  'TECHBOLT 313 Hydraulic Pile Cropper',                'Delivers clean, vibration-reduced pile head removal using controlled hydraulic force. Reduces manual breaking time and improves site safety compared to conventional pile cropping methods.',          'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 6],
      [8,  'TECHBOLT 313 Round Concrete Pile Breaker',           'Engineered for round cast-in-situ and precast concrete piles. Internal cylinder components are arranged for controlled workshop servicing, extending operational life on active project sites.',        'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 7],
      [9,  'TECHBOLT 313 Adjustable Pile Crusher',               'Every unit selection is reviewed against pile diameter and carrier information before supply. The adjustable link count makes this the most versatile pile crushing attachment in the 313 range.',      'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 8],
      [10, 'TECHBOLT 313 Modular Pile Cutting System',           'A complete hydraulic pile cutting system combining modular ring design, high-pressure operation and field-proven chisel geometry. Designed for the demands of high-volume pile-breaking programmes.',    'assets/techbolt-module-hd.webp', 'TECHBOLT', 1, 9]
    ];
    for (const p of products) {
      await pool.execute(
        `REPLACE INTO products (id, name, short_description, image_url, category, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        p
      );
    }
    console.log('products seeded.');

    console.log('Seed completed successfully.');
    process.exit(0);
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
