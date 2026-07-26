const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All tea routes require authentication
router.use(authenticateToken);

// ============================================
// TEA WORKERS CRUD (Enhanced)
// ============================================

// GET /api/tea/workers
// Query params: search, status, type, sort
router.get('/workers', authorizeRoles('farm_owner', 'supervisor', 'store_manager'), async (req, res) => {
    try {
        const { search, status, type, sort } = req.query;

        let query = supabase
            .from('tea_workers')
            .select('*, users(username)')
            .order('full_name');

        // Search by name, phone, or id_number
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,id_number.ilike.%${search}%`);
        }

        // Filter by active status
        if (status === 'active') {
            query = query.eq('is_active', true);
        } else if (status === 'inactive') {
            query = query.eq('is_active', false);
        }

        // Filter by worker type
        if (type && ['permanent', 'casual', 'seasonal'].includes(type)) {
            query = query.eq('worker_type', type);
        }

        // Sort options
        if (sort === 'name') {
            query = supabase.from('tea_workers').select('*, users(username)').order('full_name');
        } else if (sort === 'date_joined') {
            query = supabase.from('tea_workers').select('*, users(username)').order('date_joined', { ascending: false });
        } else if (sort === 'newest') {
            query = supabase.from('tea_workers').select('*, users(username)').order('created_at', { ascending: false });
        }

        const { data: workers, error } = await query;

        if (error) throw error;

        // Get stats for each worker
        const workersWithStats = await Promise.all(workers.map(async (worker) => {
            // Total kg plucked (verified)
            const { data: plucking } = await supabase
                .from('plucking_verified')
                .select('weight_kg')
                .eq('worker_id', worker.id);
            const totalKg = plucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

            // Current debt
            const { data: debts } = await supabase
                .from('debts')
                .select('amount')
                .eq('worker_id', worker.id)
                .eq('is_settled', false)
                .eq('is_reversed', false);
            const currentDebt = debts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

            return {
                ...worker,
                total_kg: totalKg,
                current_debt: currentDebt
            };
        }));

        res.json({ success: true, workers: workersWithStats });
    } catch (error) {
        console.error('Fetch workers error:', error);
        res.status(500).json({ success: false, message: 'Error fetching workers.' });
    }
});

// GET /api/tea/workers/:id/stats
// Worker summary stats
router.get('/workers/:id/stats', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;

        // Total kg plucked (verified)
        const { data: plucking } = await supabase
            .from('plucking_verified')
            .select('weight_kg')
            .eq('worker_id', id);
        const totalKg = plucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        // Total kg this month
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const { data: monthPlucking } = await supabase
            .from('plucking_verified')
            .select('weight_kg')
            .eq('worker_id', id)
            .gte('plucking_date', monthStart);
        const monthlyKg = monthPlucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        // Current debt
        const { data: debts } = await supabase
            .from('debts')
            .select('amount')
            .eq('worker_id', id)
            .eq('is_settled', false)
            .eq('is_reversed', false);
        const currentDebt = debts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        // Last payment
        const { data: lastPayment } = await supabase
            .from('settlements')
            .select('*')
            .eq('worker_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Recent plucking (last 10)
        const { data: recentPlucking } = await supabase
            .from('plucking_verified')
            .select('*, companies(name), blocks(name)')
            .eq('worker_id', id)
            .order('plucking_date', { ascending: false })
            .limit(10);

        // Recent debts (last 10)
        const { data: recentDebts } = await supabase
            .from('debts')
            .select('*')
            .eq('worker_id', id)
            .order('debt_date', { ascending: false })
            .limit(10);

        res.json({
            success: true,
            stats: {
                total_kg: totalKg,
                monthly_kg: monthlyKg,
                current_debt: currentDebt,
                last_payment: lastPayment || null,
                recent_plucking: recentPlucking || [],
                recent_debts: recentDebts || []
            }
        });
    } catch (error) {
        console.error('Worker stats error:', error);
        res.status(500).json({ success: false, message: 'Error fetching worker stats.' });
    }
});

// GET /api/tea/workers/export/csv
// Export workers as CSV
router.get('/workers/export/csv', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: workers, error } = await supabase
            .from('tea_workers')
            .select('*, users(username)')
            .order('full_name');

        if (error) throw error;

        // Build CSV
        const headers = ['Name', 'Phone', 'ID Number', 'Gender', 'Date of Birth', 'Worker Type', 'Date Joined', 'Status', 'Has Login', 'Total Debt'];
        const rows = workers.map(w => [
            w.full_name,
            w.phone || '',
            w.id_number || '',
            w.gender || '',
            w.date_of_birth || '',
            w.worker_type || '',
            w.date_joined || '',
            w.is_active ? 'Active' : 'Inactive',
            w.users ? 'Yes' : 'No',
            w.total_debt || 0
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(val => `"${val}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=tea_workers.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export workers error:', error);
        res.status(500).json({ success: false, message: 'Error exporting workers.' });
    }
});

// POST /api/tea/workers
router.post('/workers', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { 
            full_name, phone, id_number, gender, date_of_birth, 
            worker_type, date_joined, username, password 
        } = req.body;

        // Validate required
        if (!full_name) {
            return res.status(400).json({ success: false, message: 'Full name is required.' });
        }

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

            if (userError) {
                return res.status(400).json({ success: false, message: 'Username already exists.' });
            }
            user_id = newUser.id;
        }

        // Create tea worker with all fields
        const { data: worker, error } = await supabase
            .from('tea_workers')
            .insert({
                user_id,
                full_name,
                phone,
                id_number,
                gender,
                date_of_birth,
                worker_type: worker_type || 'permanent',
                date_joined: date_joined || new Date().toISOString().split('T')[0]
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
        const { 
            full_name, phone, id_number, gender, date_of_birth, 
            worker_type, date_joined, is_active 
        } = req.body;

        // Build update object with only provided fields
        const updateData = { updated_at: new Date() };
        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone !== undefined) updateData.phone = phone;
        if (id_number !== undefined) updateData.id_number = id_number;
        if (gender !== undefined) updateData.gender = gender;
        if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
        if (worker_type !== undefined) updateData.worker_type = worker_type;
        if (date_joined !== undefined) updateData.date_joined = date_joined;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data: worker, error } = await supabase
            .from('tea_workers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!worker) {
            return res.status(404).json({ success: false, message: 'Worker not found.' });
        }

        res.json({ success: true, worker });
    } catch (error) {
        console.error('Update worker error:', error);
        res.status(500).json({ success: false, message: 'Error updating worker.' });
    }
});
// ============================================
// COMPANIES CRUD (Enhanced)
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

// GET /api/tea/companies/:id/stats
router.get('/companies/:id/stats', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;

        // Get total kg bought by this company (verified plucking)
        const { data: plucking } = await supabase
            .from('plucking_verified')
            .select('weight_kg')
            .eq('company_id', id);

        const totalKg = plucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        // Get company buying rate
        const { data: company } = await supabase
            .from('companies')
            .select('buying_rate')
            .eq('id', id)
            .single();

        const revenue = totalKg * parseFloat(company?.buying_rate || 0);

        res.json({
            success: true,
            stats: {
                total_kg: totalKg,
                revenue: revenue
            }
        });
    } catch (error) {
        console.error('Company stats error:', error);
        res.status(500).json({ success: false, message: 'Error fetching company stats.' });
    }
});

// POST /api/tea/companies
router.post('/companies', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { name, buying_rate, registration_number } = req.body;

        if (!name || buying_rate === undefined) {
            return res.status(400).json({ success: false, message: 'Company name and buying rate are required.' });
        }

        const { data: company, error } = await supabase
            .from('companies')
            .insert({ 
                name, 
                buying_rate, 
                registration_number 
            })
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
        const { name, buying_rate, registration_number, is_active } = req.body;

        // Build update object with only provided fields
        const updateData = { updated_at: new Date() };
        if (name !== undefined) updateData.name = name;
        if (buying_rate !== undefined) updateData.buying_rate = buying_rate;
        if (registration_number !== undefined) updateData.registration_number = registration_number;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data: company, error } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found.' });
        }

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
// WAGE RATE (Enhanced)
// ============================================

// GET /api/tea/wage-rate - Current active rate
router.get('/wage-rate', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        const { data: wageRate, error } = await supabase
            .from('wage_rate')
            .select('*, users!created_by(full_name)')
            .eq('is_active', true)
            .order('effective_from', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Calculate days active
        let daysActive = 0;
        if (wageRate) {
            const effectiveDate = new Date(wageRate.effective_from);
            const today = new Date();
            daysActive = Math.floor((today - effectiveDate) / (1000 * 60 * 60 * 24));
        }

        res.json({ 
            success: true, 
            wage_rate: wageRate ? { ...wageRate, days_active: daysActive } : null 
        });
    } catch (error) {
        console.error('Fetch wage rate error:', error);
        res.status(500).json({ success: false, message: 'Error fetching wage rate.' });
    }
});

// GET /api/tea/wage-rate/history - All historical rates
router.get('/wage-rate/history', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: history, error } = await supabase
            .from('wage_rate')
            .select('*, users!created_by(full_name)')
            .order('effective_from', { ascending: false });

        if (error) throw error;

        // Calculate changes between consecutive rates
        const historyWithChanges = history.map((rate, index) => {
            const previousRate = history[index + 1];
            let change = null;
            if (previousRate) {
                change = parseFloat(rate.rate_per_kg) - parseFloat(previousRate.rate_per_kg);
            }
            return { ...rate, change };
        });

        res.json({ success: true, history: historyWithChanges });
    } catch (error) {
        console.error('Fetch wage rate history error:', error);
        res.status(500).json({ success: false, message: 'Error fetching wage rate history.' });
    }
});

// POST /api/tea/wage-rate
router.post('/wage-rate', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { rate_per_kg, effective_from } = req.body;

        if (!rate_per_kg || rate_per_kg <= 0) {
            return res.status(400).json({ success: false, message: 'Valid rate per kg is required.' });
        }

        if (!effective_from) {
            return res.status(400).json({ success: false, message: 'Effective date is required.' });
        }

        // Deactivate all currently active rates
        await supabase
            .from('wage_rate')
            .update({ is_active: false })
            .eq('is_active', true);

        // Create new rate with created_by
        const { data: wageRate, error } = await supabase
            .from('wage_rate')
            .insert({ 
                rate_per_kg, 
                effective_from,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, wage_rate: wageRate, message: 'Wage rate set successfully.' });
    } catch (error) {
        console.error('Set wage rate error:', error);
        res.status(500).json({ success: false, message: 'Error setting wage rate.' });
    }
});

// GET /api/tea/wage-rate/impact - Calculate impact of a proposed rate
router.get('/wage-rate/impact', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { proposed_rate } = req.query;

        if (!proposed_rate || proposed_rate <= 0) {
            return res.status(400).json({ success: false, message: 'Valid proposed rate is required.' });
        }

        // Get current active rate
        const { data: currentRate } = await supabase
            .from('wage_rate')
            .select('rate_per_kg')
            .eq('is_active', true)
            .single();

        const currentRatePerKg = currentRate ? parseFloat(currentRate.rate_per_kg) : 0;
        const proposedRatePerKg = parseFloat(proposed_rate);

        // Get yesterday's plucking
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: yesterdayPlucking } = await supabase
            .from('plucking_verified')
            .select('weight_kg')
            .eq('plucking_date', yesterdayStr);

        const yesterdayKg = yesterdayPlucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        // Get this month's plucking
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const { data: monthPlucking } = await supabase
            .from('plucking_verified')
            .select('weight_kg')
            .gte('plucking_date', monthStart);

        const monthlyKg = monthPlucking.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);

        const currentCost = yesterdayKg * currentRatePerKg;
        const proposedCost = yesterdayKg * proposedRatePerKg;
        const difference = proposedCost - currentCost;
        const percentChange = currentRatePerKg > 0 ? ((proposedRatePerKg - currentRatePerKg) / currentRatePerKg) * 100 : 100;

        res.json({
            success: true,
            impact: {
                current_rate: currentRatePerKg,
                proposed_rate: proposedRatePerKg,
                yesterday_kg: yesterdayKg,
                monthly_kg: monthlyKg,
                yesterday_current_cost: currentCost,
                yesterday_proposed_cost: proposedCost,
                difference,
                percent_change: percentChange,
                monthly_impact: monthlyKg * (proposedRatePerKg - currentRatePerKg)
            }
        });
    } catch (error) {
        console.error('Wage rate impact error:', error);
        res.status(500).json({ success: false, message: 'Error calculating impact.' });
    }
});
// ============================================
// PLUCKING - SELF (Worker Records) Enhanced
// ============================================

// POST /api/tea/plucking/self
router.post('/plucking/self', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        let { worker_id, company_id, block_id, plucking_date, weight_kg, field_grade, notes } = req.body;

        // If tea worker, use their linked worker_id
        if (req.user.role === 'tea_worker') {
            worker_id = req.user.linked_worker_id;
        }

        // Validate required fields
        if (!worker_id || !company_id || !block_id || !plucking_date || weight_kg === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be provided: worker, company, block, date, weight.' 
            });
        }

        if (weight_kg <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Weight must be greater than 0.' 
            });
        }

        // Check if worker already has a record for this date (warning, not blocking)
        const { data: existingRecords } = await supabase
            .from('plucking_self')
            .select('id, weight_kg, companies(name), blocks(name)')
            .eq('worker_id', worker_id)
            .eq('plucking_date', plucking_date);

        const { data: plucking, error } = await supabase
            .from('plucking_self')
            .insert({
                worker_id,
                company_id,
                block_id,
                plucking_date,
                weight_kg,
                field_grade: field_grade || null,
                notes: notes || null,
                recorded_by: req.user.id  // Auto-track who recorded
            })
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
            .single();

        if (error) throw error;

        res.status(201).json({ 
            success: true, 
            plucking,
            duplicate_warning: existingRecords.length > 0 ? 
                `Worker already has ${existingRecords.length} record(s) for this date.` : null
        });
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
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
            .order('plucking_date', { ascending: false })
            .order('created_at', { ascending: false });

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

// PUT /api/tea/plucking/self/:id
router.put('/plucking/self/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { plucking_date, company_id, block_id, weight_kg, field_grade, notes } = req.body;

        const updateData = {};
        if (plucking_date) updateData.plucking_date = plucking_date;
        if (company_id) updateData.company_id = company_id;
        if (block_id) updateData.block_id = block_id;
        if (weight_kg !== undefined) updateData.weight_kg = weight_kg;
        if (field_grade !== undefined) updateData.field_grade = field_grade || null;
        if (notes !== undefined) updateData.notes = notes || null;

        const { data: record, error } = await supabase
            .from('plucking_self')
            .update(updateData)
            .eq('id', id)
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
            .single();

        if (error) throw error;
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found.' });
        }

        res.json({ success: true, record, message: 'Record updated successfully.' });
    } catch (error) {
        console.error('Update self plucking error:', error);
        res.status(500).json({ success: false, message: 'Error updating record.' });
    }
});

// DELETE /api/tea/plucking/self/:id
router.delete('/plucking/self/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check record exists
        const { data: existing } = await supabase
            .from('plucking_self')
            .select('id')
            .eq('id', id)
            .single();

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Record not found.' });
        }

        const { error } = await supabase
            .from('plucking_self')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Record deleted successfully.' });
    } catch (error) {
        console.error('Delete self plucking error:', error);
        res.status(500).json({ success: false, message: 'Error deleting record.' });
    }
});

// GET /api/tea/plucking/check/:workerId?date=YYYY-MM-DD
router.get('/plucking/check/:workerId', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        const { workerId } = req.params;
        const { date } = req.query;
        const checkDate = date || new Date().toISOString().split('T')[0];

        const { data: existing } = await supabase
            .from('plucking_self')
            .select('*, companies(name), blocks(name), users!recorded_by(username, role)')
            .eq('worker_id', workerId)
            .eq('plucking_date', checkDate);

        res.json({ 
            success: true, 
            has_recorded: existing.length > 0, 
            record_count: existing.length,
            records: existing 
        });
    } catch (error) {
        console.error('Check plucking error:', error);
        res.status(500).json({ success: false, message: 'Error checking records.' });
    }
});
// ============================================
// PLUCKING - VERIFIED (Owner Records) Enhanced
// ============================================

// POST /api/tea/plucking/verified
router.post('/plucking/verified', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { worker_id, company_id, block_id, plucking_date, weight_kg, field_grade, notes } = req.body;

        // Validate required fields
        if (!worker_id || !company_id || !block_id || !plucking_date || weight_kg === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be provided: worker, company, block, date, weight.' 
            });
        }

        if (weight_kg <= 0) {
            return res.status(400).json({ success: false, message: 'Weight must be greater than 0.' });
        }

        // Check if worker already verified for this date
        const { data: existingVerified } = await supabase
            .from('plucking_verified')
            .select('id, weight_kg, companies(name), blocks(name), users!recorded_by(username)')
            .eq('worker_id', worker_id)
            .eq('plucking_date', plucking_date);

        if (existingVerified.length > 0) {
            const record = existingVerified[0];
            const verifiedBy = record.users?.username || 'another user';
            return res.status(400).json({ 
                success: false, 
                message: `Already verified for this date by ${verifiedBy} (${record.weight_kg} kg - ${record.companies?.name || 'N/A'}). Edit the existing record instead.`,
                existing_record: record
            });
        }

        const { data: plucking, error } = await supabase
            .from('plucking_verified')
            .insert({
                worker_id,
                company_id,
                block_id,
                plucking_date,
                weight_kg,
                field_grade: field_grade || null,
                notes: notes || null,
                recorded_by: req.user.id
            })
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
            .single();

        if (error) throw error;

        // ============================================
        // AUTO-APPROVAL LOGIC
        // ============================================
        
        // Check for matching self-reported data
        const { data: selfData } = await supabase
            .from('plucking_self')
            .select('weight_kg, recorded_by')
            .eq('worker_id', worker_id)
            .eq('plucking_date', plucking_date)
            .maybeSingle();

        let approvalStatus = 'pending';
        let approvedKg = null;
        let isApproved = false;

        // Scenario A: Admin recorded on behalf of worker (no self-record or self-recorded by worker)
        // → Auto-approved as trusted figure
        if (!selfData) {
            approvalStatus = 'approved';
            approvedKg = weight_kg;
            isApproved = true;
        } else if (selfData) {
            // Scenario B: Figures match → Auto-approved
            if (parseFloat(selfData.weight_kg) === parseFloat(weight_kg)) {
                approvalStatus = 'approved';
                approvedKg = weight_kg;
                isApproved = true;
            } 
            // Scenario C: Figures don't match → Disputed, needs comparison
            else {
                approvalStatus = 'disputed';
            }
        }

        // Update the record with approval status
        const { data: updatedPlucking, error: updateError } = await supabase
            .from('plucking_verified')
            .update({ 
                approval_status: approvalStatus, 
                approved_kg: approvedKg, 
                is_approved: isApproved 
            })
            .eq('id', plucking.id)
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
            .single();

        if (updateError) throw updateError;

        res.status(201).json({ 
            success: true, 
            plucking: updatedPlucking,
            approval: {
                status: approvalStatus,
                is_approved: isApproved,
                approved_kg: approvedKg,
                message: isApproved ? 'Auto-approved ✅' : 'Disputed ⚠️ - Comparison needed'
            }
        });
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
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
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

// PUT /api/tea/plucking/verified/:id
router.put('/plucking/verified/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { plucking_date, company_id, block_id, weight_kg, field_grade, notes } = req.body;

        const updateData = {};
        if (plucking_date) updateData.plucking_date = plucking_date;
        if (company_id) updateData.company_id = company_id;
        if (block_id) updateData.block_id = block_id;
        if (weight_kg !== undefined) updateData.weight_kg = weight_kg;
        if (field_grade !== undefined) updateData.field_grade = field_grade || null;
        if (notes !== undefined) updateData.notes = notes || null;

        const { data: record, error } = await supabase
            .from('plucking_verified')
            .update(updateData)
            .eq('id', id)
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
            .single();

        if (error) throw error;
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found.' });
        }

        res.json({ success: true, record, message: 'Record updated successfully.' });
    } catch (error) {
        console.error('Update verified plucking error:', error);
        res.status(500).json({ success: false, message: 'Error updating record.' });
    }
});

// PUT /api/tea/plucking/verified/:id/approve - Resolve dispute
router.put('/plucking/verified/:id/approve', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_kg } = req.body;

        if (!approved_kg || approved_kg <= 0) {
            return res.status(400).json({ success: false, message: 'Valid approved kg is required.' });
        }

        const { data: record, error } = await supabase
            .from('plucking_verified')
            .update({ 
                approved_kg: approved_kg, 
                is_approved: true, 
                approval_status: 'resolved' 
            })
            .eq('id', id)
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
            .single();

        if (error) throw error;
        if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });

        res.json({ success: true, record, message: 'Dispute resolved and record approved.' });
    } catch (error) {
        console.error('Approve plucking error:', error);
        res.status(500).json({ success: false, message: 'Error approving record.' });
    }
});

// DELETE /api/tea/plucking/verified/:id
router.delete('/plucking/verified/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;

        const { data: existing } = await supabase
            .from('plucking_verified')
            .select('id')
            .eq('id', id)
            .single();

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Record not found.' });
        }

        const { error } = await supabase
            .from('plucking_verified')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Record deleted successfully.' });
    } catch (error) {
        console.error('Delete verified plucking error:', error);
        res.status(500).json({ success: false, message: 'Error deleting record.' });
    }
});

// GET /api/tea/plucking/verified/check/:workerId?date=YYYY-MM-DD
router.get('/plucking/verified/check/:workerId', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { workerId } = req.params;
        const { date } = req.query;
        const checkDate = date || new Date().toISOString().split('T')[0];

        const { data: existing } = await supabase
            .from('plucking_verified')
            .select('*, companies(name), blocks(name), users!recorded_by(username, role)')
            .eq('worker_id', workerId)
            .eq('plucking_date', checkDate);

        res.json({ 
            success: true, 
            has_verified: existing.length > 0, 
            record_count: existing.length,
            records: existing 
        });
    } catch (error) {
        console.error('Check verified plucking error:', error);
        res.status(500).json({ success: false, message: 'Error checking verification.' });
    }
});

// GET /api/tea/plucking/disputed - Get all disputed records for comparison
router.get('/plucking/disputed', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: records, error } = await supabase
            .from('plucking_verified')
            .select('*, tea_workers(full_name), companies(name), blocks(name), users!recorded_by(username, role)')
            .eq('approval_status', 'disputed')
            .order('plucking_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, records });
    } catch (error) {
        console.error('Fetch disputed records error:', error);
        res.status(500).json({ success: false, message: 'Error fetching disputed records.' });
    }
});
// ============================================
// COMPARISON PANEL (Enhanced with Approval) - FIXED ORDER
// ============================================

// Static routes FIRST - Must be before /:worker_id

// GET /api/tea/comparison/disputes - All disputed records
router.get('/comparison/disputes', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: allRecords, error } = await supabase
            .from('plucking_verified')
            .select('*, tea_workers(full_name), companies(name), blocks(name)')
            .order('plucking_date', { ascending: false });

        if (error) throw error;

        // Filter disputed in JS (safer)
        const disputedRecords = (allRecords || []).filter(r => r.approval_status === 'disputed');

        const disputesWithSelfData = [];
        for (const record of disputedRecords) {
            const { data: selfData } = await supabase
                .from('plucking_self')
                .select('*, companies(name), blocks(name)')
                .eq('worker_id', record.worker_id)
                .eq('plucking_date', record.plucking_date)
                .maybeSingle();

            disputesWithSelfData.push({
                verified: record,
                self_reported: selfData || null,
                discrepancy: selfData ? parseFloat(record.weight_kg) - parseFloat(selfData.weight_kg) : null
            });
        }

        res.json({
            success: true,
            disputes: disputesWithSelfData,
            total_disputes: disputesWithSelfData.length,
            message: disputesWithSelfData.length > 0 
                ? `${disputesWithSelfData.length} dispute(s) need resolution` 
                : 'All records are approved!'
        });
    } catch (error) {
        console.error('Fetch disputes error:', error);
        res.status(500).json({ success: false, message: 'Error fetching disputes: ' + error.message });
    }
});

// GET /api/tea/comparison/resolved - Recently resolved disputes
router.get('/comparison/resolved', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: records, error } = await supabase
            .from('plucking_verified')
            .select('*, tea_workers(full_name), companies(name), blocks(name)')
            .eq('approval_status', 'resolved')
            .order('plucking_date', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({ success: true, records: records || [] });
    } catch (error) {
        console.error('Fetch resolved error:', error);
        res.status(500).json({ success: false, message: 'Error fetching resolved records.' });
    }
});

// PUT /api/tea/comparison/resolve/:id - Resolve a dispute
router.put('/comparison/resolve/:id', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_kg, resolution_notes } = req.body;

        if (!approved_kg || approved_kg <= 0) {
            return res.status(400).json({ success: false, message: 'Valid approved kg is required.' });
        }

        const { data: current } = await supabase
            .from('plucking_verified')
            .select('notes')
            .eq('id', id)
            .single();

        const updatedNotes = resolution_notes 
            ? `${current?.notes || ''}\n[Resolution: ${resolution_notes}]` 
            : current?.notes || null;

        const { data: record, error } = await supabase
            .from('plucking_verified')
            .update({ 
                approved_kg: approved_kg, 
                is_approved: true, 
                approval_status: 'resolved',
                notes: updatedNotes
            })
            .eq('id', id)
            .select('*, tea_workers(full_name), companies(name), blocks(name)')
            .single();

        if (error) throw error;
        if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });

        res.json({ 
            success: true, 
            record, 
            message: `Dispute resolved. Approved: ${approved_kg} kg. Ready for payment.` 
        });
    } catch (error) {
        console.error('Resolve dispute error:', error);
        res.status(500).json({ success: false, message: 'Error resolving dispute.' });
    }
});

// Dynamic route LAST - /:worker_id must come AFTER static routes
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
            .eq('worker_id', worker_id)
            .eq('approval_status', 'disputed');

        if (date) {
            selfQuery = selfQuery.eq('plucking_date', date);
            verifiedQuery = verifiedQuery.eq('plucking_date', date);
        }

        const [selfResult, verifiedResult] = await Promise.all([selfQuery, verifiedQuery]);

        if (selfResult.error) throw selfResult.error;
        if (verifiedResult.error) throw verifiedResult.error;

        const selfTotal = selfResult.data.reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);
        const verifiedTotal = verifiedResult.data.reduce((sum, r) => sum + parseFloat(r.weight_kg), 0);

        res.json({
            success: true,
            comparison: {
                worker_id: worker_id,
                date: date || 'all dates',
                self_reported: { records: selfResult.data, total_kg: selfTotal },
                verified: { records: verifiedResult.data, total_kg: verifiedTotal },
                discrepancy: verifiedTotal - selfTotal,
                status: verifiedResult.data.length > 0 ? 'disputed' : 'no_disputes',
                message: verifiedResult.data.length > 0 
                    ? `${verifiedResult.data.length} disputed record(s) need review` 
                    : 'No disputes found for this worker'
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

        if (!worker_id || !amount || !debt_date) {
            return res.status(400).json({ success: false, message: 'Worker, amount, and date are required.' });
        }

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
            .select('*, tea_workers(full_name)')
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

// PUT /api/tea/debts/:id - Edit debt
router.put('/debts/:id', authorizeRoles('farm_owner', 'supervisor', 'store_manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, debt_date, description } = req.body;

        // Check if debt exists and is editable
        const { data: existing } = await supabase
            .from('debts')
            .select('*')
            .eq('id', id)
            .single();

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Debt not found.' });
        }

        if (existing.is_settled || existing.is_reversed) {
            return res.status(400).json({ success: false, message: 'Cannot edit settled or reversed debt.' });
        }

        const updateData = {};
        if (amount !== undefined) updateData.amount = amount;
        if (debt_date) updateData.debt_date = debt_date;
        if (description !== undefined) updateData.description = description;

        const { data: debt, error } = await supabase
            .from('debts')
            .update(updateData)
            .eq('id', id)
            .select('*, tea_workers(full_name)')
            .single();

        if (error) throw error;

        // Recalculate worker's total debt
        const { data: workerDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('worker_id', existing.worker_id)
            .eq('is_settled', false)
            .eq('is_reversed', false);

        const totalDebt = workerDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        await supabase
            .from('tea_workers')
            .update({ total_debt: totalDebt, updated_at: new Date() })
            .eq('id', existing.worker_id);

        res.json({ success: true, debt, message: 'Debt updated successfully.' });
    } catch (error) {
        console.error('Update debt error:', error);
        res.status(500).json({ success: false, message: 'Error updating debt.' });
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

        if (originalDebt.is_reversed) {
            return res.status(400).json({ success: false, message: 'Debt is already reversed.' });
        }

        // Create reversal record
        await supabase
            .from('debt_reversals')
            .insert({
                debt_id: id,
                reversal_amount: originalDebt.amount,
                reason: reason || 'Reversed by user',
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
// PAY WORKER (With Debt Rolling)
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

        // Get worker info (for rolled debt and roll count)
        const { data: worker } = await supabase
            .from('tea_workers')
            .select('rolled_debt, roll_count, full_name')
            .eq('id', worker_id)
            .single();

        if (!worker) {
            return res.status(404).json({ success: false, message: 'Worker not found.' });
        }

        // Get approved AND unsettled verified plucking (only approved records)
        const { data: approvedPlucking } = await supabase
            .from('plucking_verified')
            .select('*')
            .eq('worker_id', worker_id)
            .eq('is_settled', false)
            .eq('is_approved', true);

        if (!approvedPlucking || approvedPlucking.length === 0) {
            const { data: disputedRecords } = await supabase
                .from('plucking_verified')
                .select('id')
                .eq('worker_id', worker_id)
                .eq('is_settled', false)
                .eq('approval_status', 'disputed');

            if (disputedRecords && disputedRecords.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot process payment. ${disputedRecords.length} disputed record(s) need resolution first.`,
                    disputed_count: disputedRecords.length
                });
            }

            return res.status(400).json({ 
                success: false, 
                message: 'No approved plucking records ready for payment.' 
            });
        }

        // Calculate total kg using approved_kg
        const totalKg = approvedPlucking.reduce((sum, p) => {
            const kg = p.approved_kg || p.weight_kg;
            return sum + parseFloat(kg);
        }, 0);

        if (totalKg === 0) {
            return res.status(400).json({ success: false, message: 'No approved kg to process.' });
        }

        // Calculate gross pay
        const grossPay = totalKg * parseFloat(wageRate.rate_per_kg);

        // Get current store debts (unsettled, not reversed)
        const { data: storeDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('worker_id', worker_id)
            .eq('is_settled', false)
            .eq('is_reversed', false);

        const newStoreDebt = storeDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        // Total Debt = Previously rolled debt + New store debt
        const rolledDebt = parseFloat(worker.rolled_debt || 0);
        const totalDebt = rolledDebt + newStoreDebt;

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
            .eq('is_settled', false)
            .eq('is_approved', true);

        let remainingDebt = 0;
        let newRollCount = 0;
        let alertMessage = null;

        if (netPay > 0) {
            // Worker gets paid - clear all debts
            await supabase
                .from('debts')
                .update({ is_settled: true, settlement_id: settlement.id })
                .eq('worker_id', worker_id)
                .eq('is_settled', false)
                .eq('is_reversed', false);

            remainingDebt = 0;
            newRollCount = 0;
        } else {
            // Worker gets nothing - debt rolls forward
            remainingDebt = totalDebt;
            newRollCount = (worker.roll_count || 0) + 1;

            if (newRollCount >= 3) {
                alertMessage = `⚠️ ALERT: ${worker.full_name} has ${newRollCount} consecutive unpaid cycles. Manual intervention required!`;
            }
        }

        // Update worker: remaining debt, roll count, total debt
        const { data: remainingDebts } = await supabase
            .from('debts')
            .select('amount')
            .eq('worker_id', worker_id)
            .eq('is_settled', false)
            .eq('is_reversed', false);

        const currentRemainingDebt = remainingDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);

        await supabase
            .from('tea_workers')
            .update({ 
                total_debt: currentRemainingDebt,
                rolled_debt: remainingDebt,
                roll_count: newRollCount,
                updated_at: new Date() 
            })
            .eq('id', worker_id);

        const recordsSettled = approvedPlucking.length;

        res.json({
            success: true,
            settlement: {
                worker_name: worker.full_name,
                gross_pay: grossPay,
                rolled_debt: rolledDebt,
                new_store_debt: newStoreDebt,
                total_debt: totalDebt,
                net_pay: netPay > 0 ? netPay : 0,
                kg_settled: totalKg,
                records_settled: recordsSettled,
                remaining_debt: remainingDebt,
                roll_count: newRollCount,
                alert: alertMessage,
                status: netPay > 0 ? 'paid' : 'rolled',
                message: netPay > 0 
                    ? `Worker paid KES ${netPay.toFixed(2)} for ${totalKg.toFixed(2)} kg (${recordsSettled} records)` 
                    : `Gross pay (KES ${grossPay.toFixed(2)}) fully offset by debt (KES ${totalDebt.toFixed(2)}). KES ${remainingDebt.toFixed(2)} rolls forward. Roll #${newRollCount}.`
            }
        });
    } catch (error) {
        console.error('Pay worker error:', error);
        res.status(500).json({ success: false, message: 'Error processing payment.' });
    }
});

// GET /api/tea/pay-worker/history/:worker_id? - Payment history
router.get('/pay-worker/history/:worker_id?', authorizeRoles('farm_owner', 'supervisor', 'tea_worker'), async (req, res) => {
    try {
        let worker_id = req.params.worker_id;

        if (req.user.role === 'tea_worker') {
            worker_id = req.user.linked_worker_id;
        }

        let query = supabase
            .from('settlements')
            .select('*, tea_workers(full_name)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (worker_id) {
            query = query.eq('worker_id', worker_id);
        }

        const { data: payments, error } = await query;

        if (error) throw error;

        res.json({ success: true, payments: payments || [] });
    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ success: false, message: 'Error fetching payment history.' });
    }
});

// ============================================
// PAY STORE (Settle all store debts)
// POST /api/tea/pay-store
// ============================================
router.post('/pay-store', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        // Get all unsettled store debts
        const { data: allDebts } = await supabase
            .from('debts')
            .select('*')
            .eq('is_settled', false)
            .eq('is_reversed', false);

        if (!allDebts || allDebts.length === 0) {
            return res.status(400).json({ success: false, message: 'No unsettled store debts.' });
        }

        const totalStoreDebt = allDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const debtorCount = new Set(allDebts.map(d => d.worker_id)).size;

        // Create settlement for store (worker_id = null means store payment)
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

        // Mark ALL store debts as settled
        await supabase
            .from('debts')
            .update({ is_settled: true, settlement_id: settlement.id })
            .eq('is_settled', false)
            .eq('is_reversed', false);

        // Reset all workers total_debt to 0 (store debts cleared)
        // IMPORTANT: Does NOT touch rolled_debt or roll_count
        await supabase
            .from('tea_workers')
            .update({ total_debt: 0, updated_at: new Date() })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        res.json({
            success: true,
            message: `Store paid KES ${totalStoreDebt.toFixed(2)}. ${allDebts.length} debts across ${debtorCount} workers cleared.`,
            total_paid: totalStoreDebt,
            debts_cleared: allDebts.length,
            debtors: debtorCount
        });
    } catch (error) {
        console.error('Pay store error:', error);
        res.status(500).json({ success: false, message: 'Error processing store payment.' });
    }
});

// GET /api/tea/pay-store/history - Store payment history
router.get('/pay-store/history', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: payments, error } = await supabase
            .from('settlements')
            .select('*')
            .is('worker_id', null)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json({ success: true, payments: payments || [] });
    } catch (error) {
        console.error('Store history error:', error);
        res.status(500).json({ success: false, message: 'Error fetching store history.' });
    }
});

// ============================================
// REPORTS
// ============================================

// GET /api/tea/reports/profit - Profit report with date filters
router.get('/reports/profit', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Get current wage rate
        const { data: wageRate } = await supabase
            .from('wage_rate')
            .select('rate_per_kg')
            .eq('is_active', true)
            .single();

        const ratePerKg = wageRate ? parseFloat(wageRate.rate_per_kg) : 0;

        // Get companies
        const { data: companies } = await supabase
            .from('companies')
            .select('*')
            .eq('is_active', true);

        const reportData = [];

        for (const company of companies) {
            // Total kg sold to this company
            let query = supabase
                .from('plucking_verified')
                .select('weight_kg')
                .eq('company_id', company.id)
                .eq('is_settled', true);

            if (start_date) query = query.gte('plucking_date', start_date);
            if (end_date) query = query.lte('plucking_date', end_date);

            const { data: plucking } = await query;

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
        res.status(500).json({ success: false, message: 'Error generating profit report.' });
    }
});

// GET /api/tea/reports/production - Production summary
router.get('/reports/production', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let vQuery = supabase.from('plucking_verified').select('weight_kg, companies(name), blocks(name)');
        let sQuery = supabase.from('plucking_self').select('weight_kg');

        if (start_date) { vQuery = vQuery.gte('plucking_date', start_date); sQuery = sQuery.gte('plucking_date', start_date); }
        if (end_date) { vQuery = vQuery.lte('plucking_date', end_date); sQuery = sQuery.lte('plucking_date', end_date); }

        const [vRes, sRes] = await Promise.all([vQuery, sQuery]);

        if (vRes.error) throw vRes.error;
        if (sRes.error) throw sRes.error;

        const totalVerified = vRes.data.reduce((s, r) => s + parseFloat(r.weight_kg), 0);
        const totalSelf = sRes.data.reduce((s, r) => s + parseFloat(r.weight_kg), 0);

        // By company
        const byCompany = {};
        vRes.data.forEach(r => {
            const n = r.companies?.name || 'Unknown';
            byCompany[n] = (byCompany[n] || 0) + parseFloat(r.weight_kg);
        });

        // By block
        const byBlock = {};
        vRes.data.forEach(r => {
            const n = r.blocks?.name || 'Unknown';
            byBlock[n] = (byBlock[n] || 0) + parseFloat(r.weight_kg);
        });

        res.json({
            success: true,
            total_kg: totalVerified + totalSelf,
            total_self_kg: totalSelf,
            total_verified_kg: totalVerified,
            by_company: Object.entries(byCompany).map(([name, total_kg]) => ({ name, total_kg })),
            by_block: Object.entries(byBlock).map(([name, total_kg]) => ({ name, total_kg }))
        });
    } catch (error) {
        console.error('Production report error:', error);
        res.status(500).json({ success: false, message: 'Error generating production report.' });
    }
});

// GET /api/tea/reports/workers - Worker performance
router.get('/reports/workers', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = supabase
            .from('plucking_verified')
            .select('weight_kg, tea_workers!inner(full_name)');

        if (start_date) query = query.gte('plucking_date', start_date);
        if (end_date) query = query.lte('plucking_date', end_date);

        const { data, error } = await query;
        if (error) throw error;

        // Group by worker
        const workerKg = {};
        data.forEach(r => {
            const n = r.tea_workers?.full_name || 'Unknown';
            workerKg[n] = (workerKg[n] || 0) + parseFloat(r.weight_kg);
        });

        const sorted = Object.entries(workerKg)
            .map(([full_name, total_kg]) => ({ full_name, total_kg }))
            .sort((a, b) => b.total_kg - a.total_kg);

        const totalWorkers = Object.keys(workerKg).length;
        const totalKg = sorted.reduce((s, w) => s + w.total_kg, 0);

        res.json({
            success: true,
            top_workers: sorted.slice(0, 10),
            total_workers: totalWorkers,
            avg_kg: totalWorkers > 0 ? totalKg / totalWorkers : 0
        });
    } catch (error) {
        console.error('Worker report error:', error);
        res.status(500).json({ success: false, message: 'Error generating worker report.' });
    }
});

// GET /api/tea/reports/debts - Debt summary
router.get('/reports/debts', authorizeRoles('farm_owner', 'supervisor'), async (req, res) => {
    try {
        const { data: debts, error } = await supabase
            .from('debts')
            .select('amount, is_settled, is_reversed, tea_workers(full_name)');

        if (error) throw error;

        const total = debts.reduce((s, d) => s + parseFloat(d.amount), 0);
        const unsettled = debts.filter(d => !d.is_settled && !d.is_reversed).reduce((s, d) => s + parseFloat(d.amount), 0);
        const settled = debts.filter(d => d.is_settled).reduce((s, d) => s + parseFloat(d.amount), 0);

        // By worker (unsettled only)
        const workerDebts = {};
        debts.filter(d => !d.is_settled && !d.is_reversed).forEach(d => {
            const n = d.tea_workers?.full_name || 'Unknown';
            workerDebts[n] = (workerDebts[n] || 0) + parseFloat(d.amount);
        });

        res.json({
            success: true,
            total_debt: total,
            unsettled_debt: unsettled,
            settled_debt: settled,
            debtor_count: Object.keys(workerDebts).length,
            by_worker: Object.entries(workerDebts).map(([full_name, total_debt]) => ({ full_name, total_debt }))
        });
    } catch (error) {
        console.error('Debt report error:', error);
        res.status(500).json({ success: false, message: 'Error generating debt report.' });
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
