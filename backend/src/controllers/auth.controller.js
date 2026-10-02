import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { env } from '../config/env.js';
import { validateEmail, validatePassword } from '../utils/validation.js';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const hasMustChangePasswordColumn = async () => {
  const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'must_change_password'");
  return columns.length > 0;
};

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const register = async (req, res, next) => {
  try {
    const { name, email, password, address } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length < 20 || name.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 20 and 60 characters.' });
    }
    if (typeof email !== 'string' || !validateEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (typeof password !== 'string' || !validatePassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be 8-16 characters long and contain at least one uppercase letter and one special character.' });
    }
    if (address !== undefined && (typeof address !== 'string' || address.length > 400)) {
      return res.status(400).json({ success: false, message: 'Address must not exceed 400 characters.' });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const includeMustChangePassword = await hasMustChangePasswordColumn();

    // Create user. Force role to USER regardless of input.
    const insertSql = includeMustChangePassword
      ? 'INSERT INTO users (name, email, password_hash, address, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)'
      : 'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)';
    const insertValues = includeMustChangePassword
      ? [normalizedName, normalizedEmail, passwordHash, address?.trim() || null, 'USER', false]
      : [normalizedName, normalizedEmail, passwordHash, address?.trim() || null, 'USER'];

    const [result] = await pool.query(insertSql, insertValues);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.insertId,
        name: normalizedName,
        email: normalizedEmail,
        address: address?.trim() || null,
        role: 'USER'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [normalizedEmail]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error(`Password verification failed for user ${user.id}:`, error);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    const mustChangePassword = user.must_change_password ?? false;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        mustChangePassword: Boolean(mustChangePassword)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ success: false, message: 'New password must be 8-16 characters long and contain at least one uppercase letter and one special character.' });
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const includeMustChangePassword = await hasMustChangePasswordColumn();

    if (includeMustChangePassword) {
      await pool.query(
        'UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?',
        [newPasswordHash, userId]
      );
    } else {
      await pool.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, userId]
      );
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body ?? {};

    if (typeof email !== 'string' || !validateEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [normalizedEmail]);

    if (rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account matches that email, a password reset link has been sent.'
      });
    }

    const user = rows[0];
    const token = generateResetToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    const resetToken = process.env.NODE_ENV !== 'production' ? token : undefined;

    res.json({
      success: true,
      message: 'If an account matches that email, a password reset link has been sent.',
      ...(resetToken ? { resetToken } : {})
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body ?? {};

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ success: false, message: 'New password must be 8-16 characters long and contain at least one uppercase letter and one special character.' });
    }

    const tokenHash = hashToken(String(token).trim());
    const [resetRows] = await pool.query(
      'SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > NOW() AND used_at IS NULL ORDER BY created_at DESC LIMIT 1',
      [tokenHash]
    );

    if (resetRows.length === 0) {
      return res.status(401).json({ success: false, message: 'This reset link is invalid or has expired.' });
    }

    const resetRecord = resetRows[0];
    const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [resetRecord.user_id]);

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?',
      [newPasswordHash, resetRecord.user_id]
    );
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [resetRecord.id]);

    res.json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};
