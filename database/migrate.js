require('dotenv').config();
const pool = require('../config/db');

const tables = [
  `CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role ENUM('admin','super_admin') DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS hero_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kicker TEXT,
    heading_main TEXT,
    heading_span TEXT,
    description TEXT,
    cta_text VARCHAR(255),
    cta_link VARCHAR(500),
    image_url VARCHAR(1000),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS group_intro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kicker TEXT,
    heading_main TEXT,
    heading_span TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS facts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fact_value VARCHAR(255),
    fact_label VARCHAR(255),
    sort_order INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number VARCHAR(10),
    logo_url VARCHAR(1000),
    name VARCHAR(255),
    description TEXT,
    anchor_href VARCHAR(255),
    sort_order INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS divisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    chapter_label VARCHAR(255),
    logo_url VARCHAR(1000),
    heading_main TEXT,
    heading_span TEXT,
    summary TEXT,
    media_image_url VARCHAR(1000),
    media_label VARCHAR(255),
    cta_text VARCHAR(255),
    cta_link VARCHAR(500),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS division_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    division_id INT,
    column_title VARCHAR(255),
    service_text TEXT,
    sort_order INT DEFAULT 0,
    INDEX idx_division_id (division_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS technologies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_label VARCHAR(255),
    logo_url VARCHAR(1000),
    heading_main TEXT,
    heading_span TEXT,
    description TEXT,
    product_image_url VARCHAR(1000),
    product_label VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS process_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    step_num VARCHAR(10),
    step_text TEXT,
    sort_order INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS techbolt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    watermark VARCHAR(20),
    chapter_label VARCHAR(255),
    logo_url VARCHAR(1000),
    heading_main TEXT,
    heading_span TEXT,
    description TEXT,
    product_image_url VARCHAR(1000),
    cta_text VARCHAR(255),
    cta_link VARCHAR(500),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS techbolt_specs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spec_value VARCHAR(50),
    spec_unit VARCHAR(50),
    spec_label VARCHAR(255),
    sort_order INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS benefits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    benefit_num VARCHAR(10),
    benefit_heading VARCHAR(255),
    benefit_description TEXT,
    sort_order INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS proof_section (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kicker TEXT,
    heading TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS films (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thumbnail_url VARCHAR(1000),
    category VARCHAR(255),
    title VARCHAR(255),
    video_url VARCHAR(1000),
    sort_order INT DEFAULT 0,
    size ENUM('large','normal','product') DEFAULT 'normal'
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS testimonial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(255),
    quote TEXT,
    note TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS distribution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_label VARCHAR(255),
    heading_main TEXT,
    heading_span TEXT,
    description TEXT,
    form_label VARCHAR(255),
    form_heading VARCHAR(255),
    form_button_text VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS distribution_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    req_text TEXT,
    sort_order INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS contact_section (
    id INT AUTO_INCREMENT PRIMARY KEY,
    logo_url VARCHAR(1000),
    kicker TEXT,
    heading TEXT,
    description TEXT,
    email VARCHAR(255),
    footer_left VARCHAR(500),
    footer_right VARCHAR(500),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS nav_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100),
    href VARCHAR(500),
    sort_order INT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(255),
    country VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    capability TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_status TINYINT DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS ftp_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255),
    stored_name VARCHAR(255),
    file_path VARCHAR(1000),
    file_size INT,
    file_type VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meta_key VARCHAR(255) UNIQUE NOT NULL,
    meta_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS seo_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_title VARCHAR(500),
    meta_description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    short_description TEXT,
    image_url VARCHAR(1000),
    category VARCHAR(255) DEFAULT 'TECHBOLT',
    is_active TINYINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

const defaultInserts = [
  {
    sql: `INSERT INTO hero_content (id, kicker, heading_main, heading_span, description, cta_text, cta_link, image_url)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM hero_content WHERE id = ?)`,
    values: [
      1,
      'DEFAULT KICKER',
      'Default heading',
      'default span',
      'Default description placeholder content.',
      'Learn more',
      '#',
      'assets/hero-earthworks-full-hd.webp',
      1
    ]
  },
  {
    sql: `INSERT INTO group_intro (id, kicker, heading_main, heading_span, description)
          SELECT ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM group_intro WHERE id = ?)`,
    values: [1, 'DEFAULT GROUP', 'Default group heading', 'default span', 'Default group description.', 1]
  },
  {
    sql: `INSERT INTO divisions (id, slug, chapter_label, logo_url, heading_main, heading_span, summary, media_image_url, media_label, cta_text, cta_link)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM divisions WHERE id = ?)`,
    values: [1, 'building', '01 · BUILDING CONTRACTING', 'assets/logo-building-contracting-hd.png', 'Default building main', 'building span', 'Default building summary.', 'assets/hero-earthworks-full-hd.webp', 'Building media label', 'Contact division', '#building', 1]
  },
  {
    sql: `INSERT INTO divisions (id, slug, chapter_label, logo_url, heading_main, heading_span, summary, media_image_url, media_label, cta_text, cta_link)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM divisions WHERE id = ?)`,
    values: [2, 'technical', '02 · TECHNICAL SERVICES', 'assets/logo-technical-services-hd.png', 'Default technical main', 'technical span', 'Default technical summary.', 'assets/technical-services-full-hd.webp', 'Technical media label', 'Contact division', '#technical', 2]
  },
  {
    sql: `INSERT INTO technologies (id, chapter_label, logo_url, heading_main, heading_span, description, product_image_url, product_label)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM technologies WHERE id = ?)`,
    values: [1, '03 · TECHNOLOGIES', 'assets/logo-technologies-hd.png', 'Default tech main', 'tech span', 'Default technologies description.', 'assets/techbolt-module-hd.webp', 'Product label', 1]
  },
  {
    sql: `INSERT INTO techbolt (id, watermark, chapter_label, logo_url, heading_main, heading_span, description, product_image_url, cta_text, cta_link)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM techbolt WHERE id = ?)`,
    values: [1, '000', 'FLAGSHIP PRODUCT', 'assets/logo-techbolt-hd.png', 'Default product main', 'product span', 'Default techbolt description.', 'assets/techbolt-module-hd.webp', 'Learn more', '#techbolt', 1]
  },
  {
    sql: `INSERT INTO proof_section (id, kicker, heading, description)
          SELECT ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM proof_section WHERE id = ?)`,
    values: [1, 'PROOF', 'Default proof heading', 'Default proof description.', 1]
  },
  {
    sql: `INSERT INTO testimonial (id, label, quote, note)
          SELECT ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM testimonial WHERE id = ?)`,
    values: [1, 'CLIENT VOICE', 'Default testimonial quote.', '— Default note', 1]
  },
  {
    sql: `INSERT INTO distribution (id, chapter_label, heading_main, heading_span, description, form_label, form_heading, form_button_text)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM distribution WHERE id = ?)`,
    values: [1, 'DISTRIBUTOR OPPORTUNITY', 'Default distribution main', 'distribution span', 'Default distribution description.', 'ENQUIRY', 'Default form heading.', 'Send enquiry', 1]
  },
  {
    sql: `INSERT INTO contact_section (id, logo_url, kicker, heading, description, email, footer_left, footer_right)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM contact_section WHERE id = ?)`,
    values: [1, 'assets/tech-power-group-reverse.png', 'CONTACT', 'Default contact heading', 'Default contact description.', 'info@example.com', 'Footer left', 'Footer right', 1]
  },
  {
    sql: `INSERT INTO seo_settings (id, site_title, meta_description)
          SELECT ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM seo_settings WHERE id = ?)`,
    values: [1, 'Default Site Title', 'Default meta description for SEO.', 1]
  }
];

async function runMigrations() {
  try {
    console.log('Running migrations...');
    for (let i = 0; i < tables.length; i++) {
      await pool.execute(tables[i]);
      console.log(`Table ${i + 1}/${tables.length} processed.`);
    }
    console.log('All tables created or verified.');

    console.log('Inserting default placeholder rows...');
    for (const insert of defaultInserts) {
      await pool.execute(insert.sql, insert.values);
    }
    console.log('Default placeholder inserts completed.');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigrations();
