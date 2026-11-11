require('dotenv').config();
const pool = require('../config/db');

async function run() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS c FROM blog_posts');
  if (Number(rows[0].c) > 0) {
    console.log('blog_posts already has', rows[0].c, 'row(s)');
    process.exit(0);
  }

  await pool.execute(
    `INSERT INTO blog_posts (title, slug, excerpt, body, image_url, category, is_active, sort_order)
     VALUES
     (?, ?, ?, ?, ?, ?, 1, 0),
     (?, ?, ?, ?, ?, ?, 1, 1)`,
    [
      'Built for the work ahead',
      'built-for-the-work-ahead',
      'How Tech Power Group brings contracting, technical services and TECHBOLT together on Gulf sites.',
      'Tech Power Group is built around a simple idea: one accountable route from site execution to engineered solutions.\n\nOur building contracting teams handle earthworks, civil works and enabling packages. Technical services cover specialist installation, maintenance and project support.',
      'assets/hero-earthworks-full-hd.webp',
      'Group',
      'Why modular pile breaking matters',
      'why-modular-pile-breaking-matters',
      'Controlled hydraulic force, less vibration, and a cleaner pile-head finish than conventional cropping.',
      'Conventional pile cropping is slow, noisy and hard on the cage. TECHBOLT uses a modular ring of hydraulic chisels so force is applied evenly around the pile head.',
      'assets/techbolt-module-hd.webp',
      'TECHBOLT',
    ]
  );

  console.log('Inserted sample blog posts');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
