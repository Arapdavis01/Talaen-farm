const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required.'
            });
        }

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        // Get linked IDs based on role
        let linkedWorkerId = null;
        let linkedBuyerId = null;

        if (user.role === 'tea_worker') {
            const { data: teaWorker } = await supabase
                .from('tea_workers')
                .select('id')
                .eq('user_id', user.id)
                .single();
            linkedWorkerId = teaWorker?.id || null;
        } else if (user.role === 'dairy_worker') {
            const { data: dairyWorker } = await supabase
                .from('dairy_workers')
                .select('id')
                .eq('user_id', user.id)
                .single();
            linkedWorkerId = dairyWorker?.id || null;
        } else if (user.role === 'milk_buyer') {
            const { data: buyer } = await supabase
                .from('milk_buyers')
                .select('id')
                .eq('user_id', user.id)
                .single();
            linkedBuyerId = buyer?.id || null;
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                linked_worker_id: linkedWorkerId,
                linked_buyer_id: linkedBuyerId
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Determine module access
        let availableModules = [];
        if (user.role === 'farm_owner' || user.role === 'supervisor') {
            availableModules = ['tea', 'dairy'];
        } else if (user.role === 'tea_worker' || user.role === 'store_manager') {
            availableModules = ['tea'];
        } else if (user.role === 'dairy_worker' || user.role === 'milk_buyer') {
            availableModules = ['dairy'];
        }

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                linked_worker_id: linkedWorkerId,
                linked_buyer_id: linkedBuyerId
            },
            available_modules: availableModules
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login.'
        });
    }
});

// ============================================
// POST /api/auth/register
// Create new user account (Owner/Supervisor only)
// ============================================
router.post('/register', authenticateToken, authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { username, password, role, full_name, phone } = req.body;

        if (!username || !password || !role || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: username, password, role, full_name'
            });
        }

        // Validate role
        const validRoles = ['farm_owner', 'supervisor', 'tea_worker', 'dairy_worker', 'store_manager', 'milk_buyer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified.'
            });
        }

        // Check if username exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists.'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                username,
                password_hash,
                role,
                full_name,
                phone
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'User account created successfully.',
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                full_name: newUser.full_name
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user account.'
        });
    }
});

// ============================================
// GET /api/auth/me
// Get current user profile
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, role, full_name, phone, is_active, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile.'
        });
    }
});

// ============================================
// POST /api/auth/change-password
// ============================================
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required.'
            });
        }

        // Get current user
        const { data: user } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', req.user.id)
            .single();

        // Verify current password
        const validPassword = await bcrypt.compare(current_password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const new_hash = await bcrypt.hash(new_password, salt);

        // Update password
        const { error } = await supabase
            .from('users')
            .update({ password_hash: new_hash, updated_at: new Date() })
            .eq('id', req.user.id);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Password changed successfully.'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password.'
        });
    }
});

// ============================================
// GET /api/auth/users
// List all users (Owner/Supervisor only)
// ============================================
router.get('/users', authenticateToken, authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, role, full_name, phone, is_active, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users.'
        });
    }
});

module.exports = router;
