const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All tea routes require authentication
router.use(authenticateToken);

// ============================================
// TEA WORKERS CRUD
// ============================================

// GET /api/tea/workers
router.get('/workers', authorizeRoles('farm_owner', 'supervisor', 'store_manager'), async (req, res) => {
    try {
        const { data: workers, error } = await supabase
            .from('tea_workers')
            .select('*, users(username)')
            .order('full_name');

        if (error) throw error;

        res.json({ success: true, workers });
    } catch (error) {
        console.error('Fetch workers error:', error);
        res.status(500).json({ success: false, message: 'Error fetching workers.' });
    }
});

// POST /api/tea/workers
router.post('/workers', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { full_name, phone, username, password } = req.body;

        // Create user account first if credentials provided
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
                    role: 'tea_worker',
                    full_name,
                    phone
                })
                .select()
                .single();

            if (userError) throw userError;
            user_id = newUser.id;
        }

        // Create tea worker
        const { data: worker, error } = await supabase
            .from('tea_workers')
            .insert({
                user_id,
                full_name,
                phone
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, worker });
    } catch (error) {
        console.error('Create worker error:', error);
        res.status(500).json({ success: false, message: 'Error creating worker.' });
    }
});

// PUT /api/tea/workers/:id
router.put('/workers/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, is_active } = req.body;

        const { data: worker, error } = await supabase
            .from('tea_workers')
            .update({ full_name, phone, is_active, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, worker });
    } catch (error) {
        console.error('Update worker error:', error);
        res.status(500).json({ success: false, message: 'Error updating worker.' });
    }
});

// ============================================
// COMPANIES CRUD
// ============================================

// GET /api/tea/companies
router.get('/companies', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        const { data: companies, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');

        if (error) throw error;

        res.json({ success: true, companies });
    } catch (error) {
        console.error('Fetch companies error:', error);
        res.status(500).json({ success: false, message: 'Error fetching companies.' });
    }
});

// POST /api/tea/companies
router.post('/companies', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { name, buying_rate, phone } = req.body;

        const { data: company, error } = await supabase
            .from('companies')
            .insert({ name, buying_rate, phone })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, company });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ success: false, message: 'Error creating company.' });
    }
});

// PUT /api/tea/companies/:id
router.put('/companies/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, buying_rate, phone, is_active } = req.body;

        const { data: company, error } = await supabase
            .from('companies')
            .update({ name, buying_rate, phone, is_active, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, company });
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ success: false, message: 'Error updating company.' });
    }
});

// ============================================
// BLOCKS CRUD
// ============================================

// GET /api/tea/blocks
router.get('/blocks', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        const { data: blocks, error } = await supabase
            .from('blocks')
            .select('*')
            .order('name');

        if (error) throw error;

        res.json({ success: true, blocks });
    } catch (error) {
        console.error('Fetch blocks error:', error);
        res.status(500).json({ success: false, message: 'Error fetching blocks.' });
    }
});

// POST /api/tea/blocks
router.post('/blocks', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { name, description } = req.body;

        const { data: block, error } = await supabase
            .from('blocks')
            .insert({ name, description })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, block });
    } catch (error) {
        console.error('Create block error:', error);
        res.status(500).json({ success: false, message: 'Error creating block.' });
    }
});

// ============================================
// WAGE RATE
// ============================================

// GET /api/tea/wage-rate
router.get('/wage-rate', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        const { data: wageRate, error } = await supabase
            .from('wage_rate')
            .select('*')
            .eq('is_active', true)
            .order('effective_from', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({ success: true, wage_rate: wageRate || null });
    } catch (error) {
        console.error('Fetch wage rate error:', error);
        res.status(500).json({ success: false, message: 'Error fetching wage rate.' });
    }
});

// POST /api/tea/wage-rate
router.post('/wage-rate', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { rate_per_kg, effective_from } = req.body;

        // Deactivate old rates
        await supabase
            .from('wage_rate')
            .update({ is_active: false })
            .eq('is_active', true);

        // Create new rate
        const { data: wageRate, error } = await supabase
            .from('wage_rate')
            .insert({ rate_per_kg, effective_from })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, wage_rate: wageRate });
    } catch (error) {
        console.error('Set wage rate error:', error);
        res.status(500).json({ success: false, message: 'Error setting wage rate.' });
    }
});

// ============================================
// PLUCKING - SELF (Worker Records)
// ============================================

// POST /api/tea/plucking/self
router.post('/plucking/self', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        let { worker_id, company_id, block_id, plucking_date, weight_kg, field_grade, notes } = req.body;

        // If tea worker, use their linked worker_id
        if (req.user.role === 'tea_worker') {
            worker_id = req.user.linked_worker_id;
        }

        const { data: plucking, error } = await supabase
            .from('plucking_self')
            .insert({
                worker_id,
                company_id,
                block_id,
                plucking_date,
                weight_kg,
                field_grade,
                notes
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, plucking });
    } catch (error) {
        console.error('Record self plucking error:', error);
        res.status(500).json({ success: false, message: 'Error recording plucking.' });
    }
});

// GET /api/tea/plucking/self/:worker_id?
router.get('/plucking/self/:worker_id?', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        let worker_id = req.params.worker_id;
        
        // If tea worker, force their own records
        if (req.user.role === 'tea_worker') {
            worker_id = req.user.linked_worker_id;
        }

        let query = supabase
            .from('plucking_self')
            .select('*, tea_workers(full_name), companies(name), blocks(name)')
            .order('plucking_date', { ascending: false });

        if (worker_id) {
            query = query.eq('worker_id', worker_id);
        }

        const { data: pluckingRecords, error } = await query;

        if (error) throw error;

        res.json({ success: true, records: pluckingRecords });
    } catch (error) {
        console.error('Fetch self plucking error:', error);
        res.status(500).json({ success: false, message: 'Error fetching plucking records.' });
    }
});

// ============================================
// PLUCKING - VERIFIED (Owner Records)
// ============================================

// POST /api/tea/plucking/verified
router.post('/plucking/verified', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { worker_id, company_id, block_id, plucking_date, weight_kg, field_grade, notes } = req.body;

        const { data: plucking, error } = await supabase
            .from('plucking_verified')
            .insert({
                worker_id,
                company_id,
                block_id,
                plucking_date,
                weight_kg,
                field_grade,
                notes
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, plucking });
    } catch (error) {
        console.error('Record verified plucking error:', error);
        res.status(500).json({ success: false, message: 'Error recording verified plucking.' });
    }
});

// GET /api/tea/plucking/verified/:worker_id?
router.get('/plucking/verified/:worker_id?', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const worker_id = req.params.worker_id;

        let query = supabase
            .from('plucking_verified')
            .select('*, tea_workers(full_name), companies(name), blocks(name)')
            .order('plucking_date', { ascending: false });

        if (worker_id) {
            query = query.eq('worker_id', worker_id);
        }

        const { data: records, error } = await query;

        if (error) throw error;

        res.json({ success: true, records });
    } catch (error) {
        console.error('Fetch verified plucking error:', error);
        res.status(500).json({ success: false, message: 'Error fetching verified plucking.' });
    }
});

// ============================================
// COMPARISON PANEL
// GET /api/tea/comparison/:worker_id?date=YYYY-MM-DD
// ============================================
router.get('/comparison/:worker_id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { worker_id } = req.params;
        const { date } = req.query;

        let selfQuery = supabase
            .from('plucking_self')
            .select('*, companies(name), blocks(name)')
            .eq('worker_id', worker_id);

        let verifiedQuery = supabase
            .from('plucking_verified')
            .select('*, companies(name), blocks(name)')
            .eq('worker_id', worker_id);

        if (date) {
            selfQuery = selfQuery.eq('plucking_date', date);
            verifiedQuery = verifiedQuery.eq('plucking_date', date);
        }

        const [selfResult, verifiedResult] = await Promise.all([
            selfQuery,
            verifiedQuery
        ]);

        if (selfResult.error) throw selfResult.error;
        if (verifiedResult.error) throw verifiedResult.error;

        const selfTotal = selfResult.data.reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);
        const verifiedTotal = verifiedResult.data.reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);

        res.json({
            success: true,
            comparison: {
                self_reported: {
                    records: selfResult.data,
                    total_kg: selfTotal
                },
                verified: {
                    records: verifiedResult.data,
                    total_kg: verifiedTotal
                },
                discrepancy: verifiedTotal - selfTotal
            }
        });
    } catch (error) {
        console.error('Comparison error:', error);
        res.status(500).json({ success: false, message: 'Error generating comparison.' });
    }
});

// ============================================
// DEBTS
// ============================================

// GET /api/tea/debts/:worker_id?
router.get('/debts/:worker_id?', authenticateToken, async (req, res) => {
    try {
        let worker_id = req.params.worker_id;

        // Tea workers can only see their own debts
        if (req.user.role === 'tea_worker') {
            worker_id = req.user.linked_worker_id;
        }

        let query = supabase
            .from('debts')
            .select('*, tea_workers(full_name)')
            .order('debt_date', { ascending: false });

        if (worker_id) {
            query = query.eq('worker_id', worker_id);
        }

        const { data: debts, error } = await query;

        if (error) throw error;

        res.json({ success: true, debts });
    } catch (error) {
        console.error('Fetch debts error:', error);
        res.status(500).json({ success: false, message: 'Error fetching debts.' });
    }
});

// POST /api/tea/debts
router.post('/debts', authorizeRoles('farm_owner', 'supervisor', 'store_manager'), async (req, res) => {
    try {
        const { worker_id, amount, debt_date, description } = req.body;

        // Insert debt
        const { data: debt, error } = await supabase
            .from('debts')
            .insert({
                worker_id,
                amount,
                debt_date,
                description,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Update worker's total debt
        const { data: workerDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('worker_id', worker_id)
            .eq('is_settled', false)
            .eq('is_reversed', false);

        const totalDebt = workerDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        await supabase
            .from('tea_workers')
            .update({ total_debt: totalDebt, updated_at: new Date() })
            .eq('id', worker_id);

        res.status(201).json({ success: true, debt });
    } catch (error) {
        console.error('Add debt error:', error);
        res.status(500).json({ success: false, message: 'Error adding debt.' });
    }
});

// POST /api/tea/debts/:id/reverse
router.post('/debts/:id/reverse', authorizeRoles('farm_owner', 'supervisor', 'store_manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get original debt
        const { data: originalDebt } = await supabase
            .from('debts')
            .select('*')
            .eq('id', id)
            .single();

        if (!originalDebt) {
            return res.status(404).json({ success: false, message: 'Debt not found.' });
        }

        // Create reversal record
        await supabase
            .from('debt_reversals')
            .insert({
                debt_id: id,
                reversal_amount: originalDebt.amount,
                reason,
                reversed_by: req.user.id
            });

        // Mark debt as reversed
        await supabase
            .from('debts')
            .update({ is_reversed: true })
            .eq('id', id);

        // Update worker's total debt
        const { data: workerDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('worker_id', originalDebt.worker_id)
            .eq('is_settled', false)
            .eq('is_reversed', false);

        const totalDebt = workerDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        await supabase
            .from('tea_workers')
            .update({ total_debt: totalDebt, updated_at: new Date() })
            .eq('id', originalDebt.worker_id);

        res.json({ success: true, message: 'Debt reversed successfully.' });
    } catch (error) {
        console.error('Reverse debt error:', error);
        res.status(500).json({ success: false, message: 'Error reversing debt.' });
    }
});

// ============================================
// PAY WORKER
// POST /api/tea/pay-worker
// ============================================
router.post('/pay-worker', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { worker_id } = req.body;

        // Get current wage rate
        const { data: wageRate } = await supabase
            .from('wage_rate')
            .select('*')
            .eq('is_active', true)
            .single();

        if (!wageRate) {
            return res.status(400).json({ success: false, message: 'No active wage rate set.' });
        }

        // Get unsettled verified plucking
        const { data: unsettledPlucking } = await supabase
            .from('plucking_verified')
            .select('*')
            .eq('worker_id', worker_id)
            .eq('is_settled', false);

        const totalKg = unsettledPlucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        if (totalKg === 0) {
            return res.status(400).json({ success: false, message: 'No unsettled plucking records.' });
        }

        // Calculate gross pay
        const grossPay = totalKg * parseFloat(wageRate.rate_per_kg);

        // Get unsettled debts
        const { data: unsettledDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('worker_id', worker_id)
            .eq('is_settled', false)
            .eq('is_reversed', false);

        const totalDebt = unsettledDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        // Calculate net pay
        const netPay = grossPay - totalDebt;

        // Create settlement record
        const { data: settlement, error } = await supabase
            .from('settlements')
            .insert({
                worker_id,
                settlement_date: new Date().toISOString().split('T')[0],
                gross_pay: grossPay,
                total_debt: totalDebt,
                net_pay: netPay > 0 ? netPay : 0,
                kg_settled: totalKg,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Mark plucking as settled
        await supabase
            .from('plucking_verified')
            .update({ is_settled: true, settlement_id: settlement.id })
            .eq('worker_id', worker_id)
            .eq('is_settled', false);

        // Mark debts as settled up to the net pay amount
        if (netPay > 0) {
            await supabase
                .from('debts')
                .update({ is_settled: true, settlement_id: settlement.id })
                .eq('worker_id', worker_id)
                .eq('is_settled', false)
                .eq('is_reversed', false);
        }

        // Update worker total debt
        const { data: remainingDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('worker_id', worker_id)
            .eq('is_settled', false)
            .eq('is_reversed', false);

        const remainingDebt = remainingDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        await supabase
            .from('tea_workers')
            .update({ total_debt: remainingDebt, updated_at: new Date() })
            .eq('id', worker_id);

        res.json({
            success: true,
            settlement: {
                gross_pay: grossPay,
                total_debt: totalDebt,
                net_pay: netPay > 0 ? netPay : 0,
                kg_settled: totalKg,
                message: netPay > 0 
                    ? `Worker paid KES ${netPay.toFixed(2)}` 
                    : 'Gross pay fully offset by debts. No cash payment.'
            }
        });
    } catch (error) {
        console.error('Pay worker error:', error);
        res.status(500).json({ success: false, message: 'Error processing payment.' });
    }
});

// ============================================
// PAY STORE (Settle all debts)
// POST /api/tea/pay-store
// ============================================
router.post('/pay-store', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        // Get all unsettled debts
        const { data: allDebts } = await supabase
            .from('debts')
            .select('*')
            .eq('is_settled', false)
            .eq('is_reversed', false);

        if (allDebts.length === 0) {
            return res.status(400).json({ success: false, message: 'No unsettled debts.' });
        }

        const totalStoreDebt = allDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        // Create settlement for store
        const { data: settlement, error } = await supabase
            .from('settlements')
            .insert({
                worker_id: null,
                settlement_date: new Date().toISOString().split('T')[0],
                gross_pay: 0,
                total_debt: totalStoreDebt,
                net_pay: totalStoreDebt,
                kg_settled: 0,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Mark all debts as settled
        await supabase
            .from('debts')
            .update({ is_settled: true, settlement_id: settlement.id })
            .eq('is_settled', false)
            .eq('is_reversed', false);

        // Reset all workers total debt
        await supabase
            .from('tea_workers')
            .update({ total_debt: 0, updated_at: new Date() })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        res.json({
            success: true,
            message: `Store paid KES ${totalStoreDebt.toFixed(2)}`,
            total_paid: totalStoreDebt
        });
    } catch (error) {
        console.error('Pay store error:', error);
        res.status(500).json({ success: false, message: 'Error processing store payment.' });
    }
});

// ============================================
// REPORTS
// GET /api/tea/reports/profit
// ============================================
router.get('/reports/profit', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        // Get current wage rate
        const { data: wageRate } = await supabase
            .from('wage_rate')
            .select('rate_per_kg')
            .eq('is_active', true)
            .single();

        const ratePerKg = wageRate ? parseFloat(wageRate.rate_per_kg) : 0;

        // Get companies with their plucking totals
        const { data: companies } = await supabase
            .from('companies')
            .select('*')
            .eq('is_active', true);

        const reportData = [];

        for (const company of companies) {
            // Total kg sold to this company (from verified plucking)
            const { data: plucking } = await supabase
                .from('plucking_verified')
                .select('weight_kg')
                .eq('company_id', company.id)
                .eq('is_settled', true);

            const totalKg = plucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);
            const revenue = totalKg * parseFloat(company.buying_rate);
            const laborCost = totalKg * ratePerKg;
            const profit = revenue - laborCost;

            reportData.push({
                company: company.name,
                buying_rate: company.buying_rate,
                total_kg: totalKg,
                revenue,
                labor_cost: laborCost,
                profit
            });
        }

        const totalProfit = reportData.reduce((sum, r) => sum + r.profit, 0);

        res.json({
            success: true,
            report: reportData,
            total_profit: totalProfit,
            wage_rate_used: ratePerKg
        });
    } catch (error) {
        console.error('Profit report error:', error);
        res.status(500).json({ success: false, message: 'Error generating report.' });
    }
});

// ============================================
// DASHBOARD SUMMARY
// GET /api/tea/dashboard
// ============================================
router.get('/dashboard', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get start of week (Monday)
        const dayOfWeek = new Date().getDay();
        const diff = new Date().setDate(new Date().getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const weekStart = new Date(diff).toISOString().split('T')[0];
        
        // Get start of month
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

        // 1. Active Worker count
        const { count: workerCount } = await supabase
            .from('tea_workers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // 2. Active Company count
        const { count: companyCount } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // 3. Today's verified plucking (kg)
        const { data: todayPlucking } = await supabase
            .from('plucking_verified')
            .select('weight_kg')
            .eq('plucking_date', today);
        const todayKg = todayPlucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        // 4. This month's verified plucking (kg)
        const { data: monthPlucking } = await supabase
            .from('plucking_verified')
            .select('weight_kg')
            .gte('plucking_date', monthStart);
        const monthlyKg = monthPlucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        // 5. This week's verified plucking (kg)
        const { data: weekPlucking } = await supabase
            .from('plucking_verified')
            .select('weight_kg')
            .gte('plucking_date', weekStart);
        const weekKg = weekPlucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        // 6. Outstanding worker debt (unsettled, not reversed)
        const { data: outstandingDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('is_settled', false)
            .eq('is_reversed', false);
        const outstandingDebt = outstandingDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        // 7. Total store debt (ALL debts ever, not reversed)
        const { data: allStoreDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('is_reversed', false);
        const totalStoreDebt = allStoreDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        // 8. Current wage rate
        const { data: wageRate } = await supabase
            .from('wage_rate')
            .select('rate_per_kg')
            .eq('is_active', true)
            .order('effective_from', { ascending: false })
            .limit(1)
            .single();

        // 9. Workers with unsettled plucking (unpaid workers count)
        const { data: unpaidWorkers } = await supabase
            .from('plucking_verified')
            .select('worker_id', { distinct: true })
            .eq('is_settled', false);
        const unpaidWorkersCount = unpaidWorkers?.length || 0;

        // 10. Self vs Verified match percentage (today)
        const { data: todaySelf } = await supabase
            .from('plucking_self')
            .select('weight_kg')
            .eq('plucking_date', today);
        const todaySelfKg = todaySelf.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);
        
        let matchPercentage = 100;
        if (todayKg > 0 && todaySelfKg > 0) {
            matchPercentage = Math.round((Math.min(todaySelfKg, todayKg) / Math.max(todaySelfKg, todayKg)) * 100);
        } else if (todayKg === 0 && todaySelfKg === 0) {
            matchPercentage = 100;
        } else {
            matchPercentage = 0;
        }

        // 11. Pending payments (workers with unsettled plucking)
        const pendingPayments = unpaidWorkersCount;

        res.json({
            success: true,
            dashboard: {
                worker_count: workerCount || 0,
                today_kg: todayKg,
                monthly_kg: monthlyKg,
                week_kg: weekKg,
                outstanding_debt: outstandingDebt,
                total_store_debt: totalStoreDebt,
                company_count: companyCount || 0,
                wage_rate: wageRate?.rate_per_kg || 0,
                unpaid_workers_count: unpaidWorkersCount,
                match_percentage: matchPercentage,
                pending_payments: pendingPayments
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard.' });
    }
});

module.exports = router;
