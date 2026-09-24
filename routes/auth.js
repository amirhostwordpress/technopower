require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticateJWT } = require('../middleware/auth');
const { requiredFields, validateEmail } = require('../middleware/validate');

router.post('/login', requiredFields(['email', 'password']), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, name, role FROM admins WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An error occurred during login.' });
  }
});

router.post('/change-password', authenticateJWT, requiredFields(['currentPassword', 'newPassword']), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, password_hash FROM admins WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found.' });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE admins SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'An error occurred while changing the password.' });
  }
});

router.post('/logout', authenticateJWT, (req, res) => {
  try {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'An error occurred during logout.' });
  }
});

router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT id, email, name, role FROM admins WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found.' });
    }

    const admin = rows[0];
    return res.status(200).json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'An error occurred while fetching profile.' });
  }
});

module.exports = router;
