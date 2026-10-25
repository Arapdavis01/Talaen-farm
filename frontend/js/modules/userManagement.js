// ============================================
// TALAEN FARM - User Management
// ============================================

class UserManagement {

    // ---------- Helpers ----------
    static _esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    static _initials(fullName) {
        const name = String(fullName || '').trim();
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    }

    static _fmtDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        try {
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (_) {
            return '—';
        }
    }

    static _fmtPhone(phone) {
        const p = String(phone || '').trim();
        return p ? this._esc(p) : '—';
    }

    // ---------- Show ----------
    static async show() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">User Management</h1>
                    <p class="text-gray-500">Manage system users and their roles</p>
                </div>
                <button onclick="UserManagement.showAddForm()"
                    class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 self-start shadow-lg shadow-green-600/25 font-medium">
                    <i class="fas fa-plus"></i> Add User
                </button>
            </div>

            <!-- Users Table -->
            <div id="usersTableContainer" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="text-center py-8">
                    <div class="spinner mx-auto"></div>
                    <p class="text-gray-500 mt-3">Loading users...</p>
                </div>
            </div>
        `;

        await UserManagement.loadUsers();
    }

    // ---------- Load ----------
    static async loadUsers() {
        try {
            const response = await api.getUsers();

            if (response && response.success && Array.isArray(response.users) && response.users.length > 0) {
                UserManagement.renderUsersTable(response.users);
                return true;
            }

            const container = document.getElementById('usersTableContainer');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-users text-gray-300 text-3xl"></i>
                        </div>
                        <p class="text-gray-500 mb-4">No users found.</p>
                        <button onclick="UserManagement.showAddForm()"
                            class="text-green-600 hover:text-green-700 font-medium">
                            <i class="fas fa-plus mr-1"></i> Add your first user
                        </button>
                    </div>
                `;
            }
            return true;
        } catch (error) {
            const container = document.getElementById('usersTableContainer');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                        <p class="text-red-500 mb-1">Failed to load users.</p>
                        <p class="text-gray-400 text-xs">${UserManagement._esc(error.message || '')}</p>
                        <button onclick="UserManagement.loadUsers()"
                            class="mt-3 text-sm text-green-600 hover:text-green-700 font-medium">
                            <i class="fas fa-rotate-right mr-1"></i> Retry
                        </button>
                    </div>
                `;
            }
            return false;
        }
    }

    // ---------- Role badge ----------
    static getRoleBadge(role) {
        const roleConfig = {
            farm_owner:    { label: 'Farm Owner',    color: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'fa-crown' },
            supervisor:    { label: 'Supervisor',    color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: 'fa-user-shield' },
            tea_worker:    { label: 'Tea Worker',    color: 'bg-green-100 text-green-700 border-green-200',    icon: 'fa-leaf' },
            dairy_worker:  { label: 'Dairy Worker',  color: 'bg-cyan-100 text-cyan-700 border-cyan-200',       icon: 'fa-cow' },
            store_manager: { label: 'Store Manager', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'fa-store' },
            milk_buyer:    { label: 'Milk Buyer',    color: 'bg-pink-100 text-pink-700 border-pink-200',       icon: 'fa-user-tie' }
        };

        const config = roleConfig[role] || { label: role || 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: 'fa-user' };

        return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}">
            <i class="fas ${config.icon} text-[10px]"></i> ${UserManagement._esc(config.label)}
        </span>`;
    }

    // ---------- Table render ----------
    static renderUsersTable(users) {
        const container = document.getElementById('usersTableContainer');
        if (!container) return;

        const currentUser = auth.getCurrentUser();
        const currentUserId = currentUser ? currentUser.id : null;

        const rows = users.map((user) => {
            const safeName = UserManagement._esc(user.full_name || '—');
            const safeUsername = UserManagement._esc(user.username || '');
            const isActive = !!user.is_active;
            const isSelf = user.id === currentUserId;

            const actionButtons = isSelf
                ? `<span class="text-xs text-gray-400 italic">You</span>`
                : `
                    <button onclick="UserManagement.toggleUserStatus('${user.id}', ${isActive}, '${UserManagement._esc((user.full_name || '').replace(/'/g, "\\'"))}')"
                        class="w-8 h-8 flex items-center justify-center rounded-lg ${isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'} transition-colors"
                        title="${isActive ? 'Deactivate' : 'Activate'}">
                        <i class="fas ${isActive ? 'fa-ban' : 'fa-check'} text-sm"></i>
                    </button>
                    <button onclick="UserManagement.showResetPasswordForm('${user.id}', '${UserManagement._esc((user.full_name || '').replace(/'/g, "\\'"))}')"
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Reset Password">
                        <i class="fas fa-key text-sm"></i>
                    </button>
                `;

            return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4" data-label="User">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span class="text-green-700 font-bold text-sm">${UserManagement._initials(user.full_name)}</span>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-800">${safeName}</p>
                                <p class="text-xs text-gray-400">@${safeUsername}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4" data-label="Role">
                        ${UserManagement.getRoleBadge(user.role)}
                    </td>
                    <td class="px-6 py-4" data-label="Phone">
                        <span class="text-gray-600 text-sm">${UserManagement._fmtPhone(user.phone)}</span>
                    </td>
                    <td class="px-6 py-4" data-label="Status">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isActive
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }">
                            <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}"></span>
                            ${isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="px-6 py-4" data-label="Joined">
                        <span class="text-gray-500 text-sm">${UserManagement._fmtDate(user.created_at)}</span>
                    </td>
                    <td class="px-6 py-4" data-label="Actions">
                        <div class="flex items-center gap-1">${actionButtons}</div>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="responsive-table w-full">
                    <thead>
                        <tr class="bg-gray-50/80 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-4">User</th>
                            <th class="px-6 py-4">Role</th>
                            <th class="px-6 py-4">Phone</th>
                            <th class="px-6 py-4">Status</th>
                            <th class="px-6 py-4">Joined</th>
                            <th class="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ---------- Add User ----------
    static showAddForm() {
        modal.openForm('Add New User', `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                    <input type="text" id="newFullName" required
                        autocomplete="name"
                        enterkeyhint="next"
                        class="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="John Doe">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Username *</label>
                    <input type="text" id="newUsername" required
                        autocomplete="off"
                        autocapitalize="none"
                        autocorrect="off"
                        spellcheck="false"
                        enterkeyhint="next"
                        class="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="johndoe">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                    <div class="relative">
                        <input type="password" id="newPassword" required
                            autocomplete="new-password"
                            enterkeyhint="next"
                            class="w-full px-3.5 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            placeholder="Min. 6 characters">
                        <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                onclick="UserManagement.togglePasswordVisibility('newPassword', this)"
                                aria-label="Toggle password visibility">
                            <i class="fas fa-eye text-sm"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" id="newPhone"
                        inputmode="tel"
                        autocomplete="tel"
                        enterkeyhint="next"
                        class="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="0712345678">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Role *</label>
                    <select id="newRole" required
                        class="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white">
                        <option value="">Select Role</option>
                        <option value="farm_owner">🏆 Farm Owner</option>
                        <option value="supervisor">🛡️ Supervisor</option>
                        <option value="tea_worker">🌿 Tea Worker (Plucker)</option>
                        <option value="dairy_worker">🐄 Dairy Worker</option>
                        <option value="store_manager">🏪 Store Manager</option>
                        <option value="milk_buyer">👔 Milk Buyer</option>
                    </select>
                </div>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
                <p class="text-amber-700 text-xs flex items-start gap-2">
                    <i class="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                    <span>For <strong>Tea Worker</strong>, <strong>Dairy Worker</strong>, and <strong>Milk Buyer</strong> roles, you'll need to create the corresponding worker/buyer record separately in their respective modules after creating the user account.</span>
                </p>
            </div>
        `, async (e) => {
            const form = document.getElementById('modalForm');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                throw new Error('Please fill all required fields');
            }

            const userData = {
                full_name: document.getElementById('newFullName').value.trim(),
                username: document.getElementById('newUsername').value.trim().toLowerCase(),
                password: document.getElementById('newPassword').value,
                role: document.getElementById('newRole').value,
                phone: document.getElementById('newPhone').value.trim()
            };

            if (!userData.full_name) throw new Error('Full name is required');
            if (!userData.username) throw new Error('Username is required');
            if (!userData.role) throw new Error('Role is required');
            if (userData.password.length < 6) throw new Error('Password must be at least 6 characters');

            const response = await api.register(userData);
            if (response && response.success) {
                modal.close();
                if (typeof showToast === 'function') {
                    showToast(`User "${userData.full_name}" created successfully!`, 'success');
                }
                if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
                    try { navigator.vibrate(15); } catch (_) {}
                }
                await UserManagement.loadUsers();
            } else {
                throw new Error((response && response.message) || 'Failed to create user');
            }
        }, {
            submitText: 'Create User',
            submitIcon: 'fa-user-plus',
            icon: 'fa-user-plus',
            size: 'max-w-2xl',
            autoClose: false
        });
    }

    // ---------- Toggle active status ----------
    static async toggleUserStatus(userId, currentStatus, userName) {
        const action = currentStatus ? 'Deactivate' : 'Activate';

        modal.openConfirm(
            `${action} User`,
            `Are you sure you want to ${action.toLowerCase()} <strong>${UserManagement._esc(userName)}</strong>? ` +
            (currentStatus
                ? 'They will no longer be able to log in.'
                : 'They will regain access to the system.'),
            async () => {
                const response = await api.updateUser(userId, { is_active: !currentStatus });
                if (response && response.success !== false) {
                    if (typeof showToast === 'function') {
                        showToast(`User ${action.toLowerCase()}d successfully!`, 'success');
                    }
                    if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
                        try { navigator.vibrate(10); } catch (_) {}
                    }
                    await UserManagement.loadUsers();
                } else {
                    throw new Error((response && response.message) || 'Failed to update user');
                }
            },
            {
                confirmText: action,
                confirmClass: currentStatus
                    ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 shadow-lg shadow-yellow-600/25'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/25',
                type: currentStatus ? 'warning' : 'info'
            }
        );
    }

    // ---------- Reset password ----------
    static showResetPasswordForm(userId, userName) {
        const safeName = String(userName || '').slice(0, 30);
        const titleSuffix = safeName.length < String(userName || '').length
            ? safeName + '…'
            : safeName;

        modal.openForm(`Reset Password: ${UserManagement._esc(titleSuffix)}`, `
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">New Password *</label>
                <div class="relative">
                    <input type="password" id="resetPassword" required
                        autocomplete="new-password"
                        enterkeyhint="done"
                        class="w-full px-3.5 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="Enter new password (min. 6 characters)">
                    <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onclick="UserManagement.togglePasswordVisibility('resetPassword', this)"
                            aria-label="Toggle password visibility">
                        <i class="fas fa-eye text-sm"></i>
                    </button>
                </div>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p class="text-blue-700 text-xs flex items-start gap-2">
                    <i class="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                    <span>The user will be required to use this new password on their next login.</span>
                </p>
            </div>
        `, async (e) => {
            const form = document.getElementById('modalForm');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                throw new Error('Please fill all required fields');
            }

            const newPassword = document.getElementById('resetPassword').value;
            if (!newPassword || newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const response = await api.resetUserPassword(userId, newPassword);
            if (response && response.success !== false) {
                modal.close();
                if (typeof showToast === 'function') {
                    showToast(`Password reset successfully for ${safeName || 'user'}!`, 'success');
                }
                if (window.TALAEN && window.TALAEN.isAndroidApp && navigator.vibrate) {
                    try { navigator.vibrate(10); } catch (_) {}
                }
            } else {
                throw new Error((response && response.message) || 'Failed to reset password');
            }
        }, {
            submitText: 'Reset Password',
            submitIcon: 'fa-key',
            icon: 'fa-key',
            submitClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25',
            autoClose: false
        });
    }

    // ---------- Password visibility toggle ----------
    static togglePasswordVisibility(inputId, button) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const icon = button ? button.querySelector('i') : null;

        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.className = 'fas fa-eye-slash text-sm';
        } else {
            input.type = 'password';
            if (icon) icon.className = 'fas fa-eye text-sm';
        }
    }
}
