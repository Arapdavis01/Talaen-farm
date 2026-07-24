const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All dairy routes require authentication
router.use(authenticateToken);

// ============================================
// COWS CRUD
// ============================================

// GET /api/dairy/cows
router.get('/cows', authorizeRoles('farm_owner', 'supervisor', 'dairy_worker'), async (req, res) => {
    try {
        const { data: cows, error } = await supabase
            .from('cows')
            .select('*')
            .order('tag_number');

        if (error) throw error;

        res.json({ success: true, cows });
    } catch (error) {
        console.error('Fetch cows error:', error);
        res.status(500).json({ success: false, message: 'Error fetching cows.' });
    }
});

// POST /api/dairy/cows
router.post('/cows', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { tag_number, breed, date_of_birth, notes } = req.body;

        // Check if tag number exists
        const { data: existing } = await supabase
            .from('cows')
            .select('id')
            .eq('tag_number', tag_number)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A cow with this tag number already exists.'
            });
        }

        const { data: cow, error } = await supabase
            .from('cows')
            .insert({ tag_number, breed, date_of_birth, notes })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, cow });
    } catch (error) {
        console.error('Create cow error:', error);
        res.status(500).json({ success: false, message: 'Error creating cow record.' });
    }
});

// PUT /api/dairy/cows/:id
router.put('/cows/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { tag_number, breed, date_of_birth, is_active, notes } = req.body;

        const { data: cow, error } = await supabase
            .from('cows')
            .update({ tag_number, breed, date_of_birth, is_active, notes })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, cow });
    } catch (error) {
        console.error('Update cow error:', error);
        res.status(500).json({ success: false, message: 'Error updating cow record.' });
    }
});

// DELETE /api/dairy/cows/:id
router.delete('/cows/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('cows')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Cow record deleted successfully.' });
    } catch (error) {
        console.error('Delete cow error:', error);
        res.status(500).json({ success: false, message: 'Error deleting cow record.' });
    }
});

// ============================================
// DAIRY WORKERS CRUD
// ============================================

// GET /api/dairy/workers
router.get('/workers', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: workers, error } = await supabase
            .from('dairy_workers')
            .select('*, users(username)')
            .order('full_name');

        if (error) throw error;

        res.json({ success: true, workers });
    } catch (error) {
        console.error('Fetch dairy workers error:', error);
        res.status(500).json({ success: false, message: 'Error fetching dairy workers.' });
    }
});

// POST /api/dairy/workers
router.post('/workers', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { full_name, phone, monthly_salary, username, password } = req.body;

        // Create user account
        let user_id = null;
        if (username && password) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert({
                    username,
                    password_hash,
                    role: 'dairy_worker',
                    full_name,
                    phone
                })
                .select()
                .single();

            if (userError) throw userError;
            user_id = newUser.id;
        }

        const { data: worker, error } = await supabase
            .from('dairy_workers')
            .insert({
                user_id,
                full_name,
                phone,
                monthly_salary: monthly_salary || 0
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, worker });
    } catch (error) {
        console.error('Create dairy worker error:', error);
        res.status(500).json({ success: false, message: 'Error creating dairy worker.' });
    }
});

// PUT /api/dairy/workers/:id
router.put('/workers/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, monthly_salary, is_active } = req.body;

        const { data: worker, error } = await supabase
            .from('dairy_workers')
            .update({ full_name, phone, monthly_salary, is_active, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, worker });
    } catch (error) {
        console.error('Update dairy worker error:', error);
        res.status(500).json({ success: false, message: 'Error updating dairy worker.' });
    }
});

// ============================================
// MILK BUYERS CRUD
// ============================================

// GET /api/dairy/buyers
router.get('/buyers', authorizeRoles('farm_owner', 'supervisor', 'milk_buyer'), async (req, res) => {
    try {
        const { data: buyers, error } = await supabase
            .from('milk_buyers')
            .select('*, users(username)')
            .order('full_name');

        if (error) throw error;

        res.json({ success: true, buyers });
    } catch (error) {
        console.error('Fetch buyers error:', error);
        res.status(500).json({ success: false, message: 'Error fetching buyers.' });
    }
});

// POST /api/dairy/buyers
router.post('/buyers', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { full_name, phone, username, password } = req.body;

        // Create user account
        let user_id = null;
        if (username && password) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert({
                    username,
                    password_hash,
                    role: 'milk_buyer',
                    full_name,
                    phone
                })
                .select()
                .single();

            if (userError) throw userError;
            user_id = newUser.id;
        }

        const { data: buyer, error } = await supabase
            .from('milk_buyers')
            .insert({ user_id, full_name, phone })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, buyer });
    } catch (error) {
        console.error('Create buyer error:', error);
        res.status(500).json({ success: false, message: 'Error creating buyer.' });
    }
});

// PUT /api/dairy/buyers/:id
router.put('/buyers/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, is_active } = req.body;

        const { data: buyer, error } = await supabase
            .from('milk_buyers')
            .update({ full_name, phone, is_active, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, buyer });
    } catch (error) {
        console.error('Update buyer error:', error);
        res.status(500).json({ success: false, message: 'Error updating buyer.' });
    }
});

// ============================================
// MILK PRODUCTION
// ============================================

// POST /api/dairy/production
router.post('/production', authorizeRoles('farm_owner', 'supervisor', 'dairy_worker'), async (req, res) => {
    try {
        let { cow_id, worker_id, production_date, morning_litres, evening_litres, notes } = req.body;

        // If dairy worker, use their linked worker_id
        if (req.user.role === 'dairy_worker') {
            worker_id = req.user.linked_worker_id;
        }

        const { data: production, error } = await supabase
            .from('milk_production')
            .insert({
                cow_id,
                worker_id,
                production_date,
                morning_litres: morning_litres || 0,
                evening_litres: evening_litres || 0,
                notes
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, production });
    } catch (error) {
        console.error('Record production error:', error);
        res.status(500).json({ success: false, message: 'Error recording milk production.' });
    }
});

// GET /api/dairy/production
router.get('/production', authorizeRoles('farm_owner', 'supervisor', 'dairy_worker'), async (req, res) => {
    try {
        const { date, cow_id } = req.query;

        let query = supabase
            .from('milk_production')
            .select('*, cows(tag_number), dairy_workers(full_name)')
            .order('production_date', { ascending: false });

        if (date) {
            query = query.eq('production_date', date);
        }

        if (cow_id) {
            query = query.eq('cow_id', cow_id);
        }

        // Dairy workers see only their records
        if (req.user.role === 'dairy_worker') {
            query = query.eq('worker_id', req.user.linked_worker_id);
        }

        const { data: records, error } = await query;

        if (error) throw error;

        res.json({ success: true, records });
    } catch (error) {
        console.error('Fetch production error:', error);
        res.status(500).json({ success: false, message: 'Error fetching production records.' });
    }
});

// ============================================
// MILK DISPOSAL
// ============================================

// POST /api/dairy/disposal
router.post('/disposal', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { disposal_date, disposal_type, buyer_id, litres, price_per_litre, notes } = req.body;

        let total_amount = null;
        if (disposal_type === 'sale' && price_per_litre) {
            total_amount = litres * price_per_litre;
        }

        const { data: disposal, error } = await supabase
            .from('milk_disposal')
            .insert({
                disposal_date,
                disposal_type,
                buyer_id: disposal_type === 'sale' ? buyer_id : null,
                litres,
                price_per_litre: disposal_type === 'sale' ? price_per_litre : null,
                total_amount,
                notes,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, disposal });
    } catch (error) {
        console.error('Record disposal error:', error);
        res.status(500).json({ success: false, message: 'Error recording milk disposal.' });
    }
});

// GET /api/dairy/disposal
router.get('/disposal', authorizeRoles('farm_owner', 'supervisor', 'milk_buyer'), async (req, res) => {
    try {
        const { date, type } = req.query;

        let query = supabase
            .from('milk_disposal')
            .select('*, milk_buyers(full_name)')
            .order('disposal_date', { ascending: false });

        if (date) {
            query = query.eq('disposal_date', date);
        }

        if (type) {
            query = query.eq('disposal_type', type);
        }

        const { data: records, error } = await query;

        if (error) throw error;

        res.json({ success: true, records });
    } catch (error) {
        console.error('Fetch disposal error:', error);
        res.status(500).json({ success: false, message: 'Error fetching disposal records.' });
    }
});

// ============================================
// FEED TRACKING
// ============================================

// POST /api/dairy/feed
router.post('/feed', authorizeRoles('farm_owner', 'supervisor', 'dairy_worker'), async (req, res) => {
    try {
        let { cow_id, worker_id, feed_date, feed_type, quantity_kg, notes } = req.body;

        // If dairy worker, use their linked worker_id
        if (req.user.role === 'dairy_worker') {
            worker_id = req.user.linked_worker_id;
        }

        const { data: feed, error } = await supabase
            .from('feed')
            .insert({
                cow_id,
                worker_id,
                feed_date,
                feed_type,
                quantity_kg,
                notes
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, feed });
    } catch (error) {
        console.error('Record feed error:', error);
        res.status(500).json({ success: false, message: 'Error recording feed.' });
    }
});

// GET /api/dairy/feed
router.get('/feed', authorizeRoles('farm_owner', 'supervisor', 'dairy_worker'), async (req, res) => {
    try {
        const { date, cow_id } = req.query;

        let query = supabase
            .from('feed')
            .select('*, cows(tag_number), dairy_workers(full_name)')
            .order('feed_date', { ascending: false });

        if (date) {
            query = query.eq('feed_date', date);
        }

        if (cow_id) {
            query = query.eq('cow_id', cow_id);
        }

        const { data: records, error } = await query;

        if (error) throw error;

        res.json({ success: true, records });
    } catch (error) {
        console.error('Fetch feed error:', error);
        res.status(500).json({ success: false, message: 'Error fetching feed records.' });
    }
});

// ============================================
// PAY DAIRY WORKER
// ============================================

// POST /api/dairy/pay-worker
router.post('/pay-worker', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { worker_id, amount, payment_period, notes } = req.body;

        const { data: payment, error } = await supabase
            .from('dairy_payments')
            .insert({
                worker_id,
                payment_date: new Date().toISOString().split('T')[0],
                amount,
                payment_period,
                notes,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            payment,
            message: `Worker paid KES ${amount}`
        });
    } catch (error) {
        console.error('Pay dairy worker error:', error);
        res.status(500).json({ success: false, message: 'Error processing payment.' });
    }
});

// GET /api/dairy/payments/:worker_id?
router.get('/payments/:worker_id?', authorizeRoles('farm_owner', 'supervisor', 'dairy_worker'), async (req, res) => {
    try {
        let worker_id = req.params.worker_id;

        // Dairy workers see only their payments
        if (req.user.role === 'dairy_worker') {
            worker_id = req.user.linked_worker_id;
        }

        let query = supabase
            .from('dairy_payments')
            .select('*, dairy_workers(full_name)')
            .order('payment_date', { ascending: false });

        if (worker_id) {
            query = query.eq('worker_id', worker_id);
        }

        const { data: payments, error } = await query;

        if (error) throw error;

        res.json({ success: true, payments });
    } catch (error) {
        console.error('Fetch payments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching payments.' });
    }
});

// ============================================
// BUYER DELIVERIES
// ============================================

// POST /api/dairy/deliveries
router.post('/deliveries', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { buyer_id, delivery_date, litres_assigned, price_per_litre } = req.body;

        const total_amount = litres_assigned * price_per_litre;

        const { data: delivery, error } = await supabase
            .from('buyer_deliveries')
            .insert({
                buyer_id,
                delivery_date,
                litres_assigned,
                price_per_litre,
                total_amount,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, delivery });
    } catch (error) {
        console.error('Create delivery error:', error);
        res.status(500).json({ success: false, message: 'Error creating delivery.' });
    }
});

// GET /api/dairy/deliveries
router.get('/deliveries', authorizeRoles('farm_owner', 'supervisor', 'milk_buyer'), async (req, res) => {
    try {
        let query = supabase
            .from('buyer_deliveries')
            .select('*, milk_buyers(full_name)')
            .order('delivery_date', { ascending: false });

        // Milk buyers see only their deliveries
        if (req.user.role === 'milk_buyer') {
            query = query.eq('buyer_id', req.user.linked_buyer_id);
        }

        const { data: deliveries, error } = await query;

        if (error) throw error;

        res.json({ success: true, deliveries });
    } catch (error) {
        console.error('Fetch deliveries error:', error);
        res.status(500).json({ success: false, message: 'Error fetching deliveries.' });
    }
});

// ============================================
// BUYER CONFIRMATION (Milk Buyer confirms litres)
// ============================================

// PUT /api/dairy/deliveries/:id/confirm
router.put('/deliveries/:id/confirm', authorizeRoles('farm_owner', 'supervisor', 'milk_buyer'), async (req, res) => {
    try {
        const { id } = req.params;
        const { litres_confirmed } = req.body;

        // Get original delivery
        const { data: delivery } = await supabase
            .from('buyer_deliveries')
            .select('*')
            .eq('id', id)
            .single();

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found.' });
        }

        // Milk buyers can only confirm their own deliveries
        if (req.user.role === 'milk_buyer' && delivery.buyer_id !== req.user.linked_buyer_id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const updatedTotal = litres_confirmed * delivery.price_per_litre;

        const { data: confirmed, error } = await supabase
            .from('buyer_deliveries')
            .update({
                litres_confirmed,
                total_amount: updatedTotal,
                is_confirmed: true,
                confirmed_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, delivery: confirmed });
    } catch (error) {
        console.error('Confirm delivery error:', error);
        res.status(500).json({ success: false, message: 'Error confirming delivery.' });
    }
});

// ============================================
// BUYER PAYMENTS
// ============================================

// POST /api/dairy/buyer-payments
router.post('/buyer-payments', authorizeRoles('farm_owner', 'supervisor', 'milk_buyer'), async (req, res) => {
    try {
        let { buyer_id, amount, period_covered, notes } = req.body;

        // If milk buyer, use their linked buyer_id
        if (req.user.role === 'milk_buyer') {
            buyer_id = req.user.linked_buyer_id;
        }

        const { data: payment, error } = await supabase
            .from('buyer_payments')
            .insert({
                buyer_id,
                payment_date: new Date().toISOString().split('T')[0],
                amount,
                period_covered,
                notes,
                recorded_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            payment,
            message: `Payment of KES ${amount} recorded successfully.`
        });
    } catch (error) {
        console.error('Record buyer payment error:', error);
        res.status(500).json({ success: false, message: 'Error recording payment.' });
    }
});

// GET /api/dairy/buyer-payments
router.get('/buyer-payments', authorizeRoles('farm_owner', 'supervisor', 'milk_buyer'), async (req, res) => {
    try {
        let query = supabase
            .from('buyer_payments')
            .select('*, milk_buyers(full_name)')
            .order('payment_date', { ascending: false });

        // Milk buyers see only their payments
        if (req.user.role === 'milk_buyer') {
            query = query.eq('buyer_id', req.user.linked_buyer_id);
        }

        const { data: payments, error } = await query;

        if (error) throw error;

        res.json({ success: true, payments });
    } catch (error) {
        console.error('Fetch buyer payments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching buyer payments.' });
    }
});

// ============================================
// DAIRY DASHBOARD
// ============================================

// GET /api/dairy/dashboard
router.get('/dashboard', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        // Cow count
        const { count: cowCount } = await supabase
            .from('cows')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // Today's milk production
        const today = new Date().toISOString().split('T')[0];
        const { data: todayProduction } = await supabase
            .from('milk_production')
            .select('morning_litres, evening_litres')
            .eq('production_date', today);

        const todayMilk = todayProduction.reduce((sum, p) => {
            return sum + parseFloat(p.morning_litres) + parseFloat(p.evening_litres);
        }, 0);

        // Total milk sales this month
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString().split('T')[0];

        const { data: monthlySales } = await supabase
            .from('milk_disposal')
            .select('total_amount')
            .eq('disposal_type', 'sale')
            .gte('disposal_date', firstOfMonth);

        const monthlyRevenue = monthlySales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

        res.json({
            success: true,
            dashboard: {
                cow_count: cowCount,
                today_milk_litres: todayMilk,
                monthly_revenue: monthlyRevenue
            }
        });
    } catch (error) {
        console.error('Dairy dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error fetching dairy dashboard.' });
    }
});

// ============================================
// DAIRY REPORTS
// GET /api/dairy/reports/summary
// ============================================
router.get('/reports/summary', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let productionQuery = supabase
            .from('milk_production')
            .select('morning_litres, evening_litres');

        let salesQuery = supabase
            .from('milk_disposal')
            .select('litres, total_amount')
            .eq('disposal_type', 'sale');

        if (start_date) {
            productionQuery = productionQuery.gte('production_date', start_date);
            salesQuery = salesQuery.gte('disposal_date', start_date);
        }

        if (end_date) {
            productionQuery = productionQuery.lte('production_date', end_date);
            salesQuery = salesQuery.lte('disposal_date', end_date);
        }

        const [productionResult, salesResult] = await Promise.all([
            productionQuery,
            salesQuery
        ]);

        if (productionResult.error) throw productionResult.error;
        if (salesResult.error) throw salesResult.error;

        const totalProduction = productionResult.data.reduce((sum, p) => {
            return sum + parseFloat(p.morning_litres) + parseFloat(p.evening_litres);
        }, 0);

        const totalSalesLitres = salesResult.data.reduce((sum, s) => sum + parseFloat(s.litres), 0);
        const totalRevenue = salesResult.data.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

        res.json({
            success: true,
            report: {
                total_milk_produced: totalProduction,
                total_milk_sold: totalSalesLitres,
                total_revenue: totalRevenue,
                period: {
                    start: start_date || 'all time',
                    end: end_date || 'all time'
                }
            }
        });
    } catch (error) {
        console.error('Dairy report error:', error);
        res.status(500).json({ success: false, message: 'Error generating dairy report.' });
    }
});

module.exports = router;
