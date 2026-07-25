// ============================================
// TALAEN FARM - User Management
// ============================================

class UserManagement {
    static async show() {
        const mainContent = document.getElementById('mainContent');
        
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

    static async loadUsers() {
        try {
            const response = await api.getUsers();
            
            if (response.success && response.users.length > 0) {
                UserManagement.renderUsersTable(response.users);
            } else {
                document.getElementById('usersTableContainer').innerHTML = `
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
        } catch (error) {
            document.getElementById('usersTableContainer').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
                    <p class="text-red-500">Failed to load users. Ensure you have proper permissions.</p>
                </div>
            `;
        }
    }

    static getRoleBadge(role) {
        const roleConfig = {
            'farm_owner': { label: 'Farm Owner', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'fa-crown' },
            'supervisor': { label: 'Supervisor', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'fa-user-shield' },
            'tea_worker': { label: 'Tea Worker', color: 'bg-green-100 text-green-700 border-green-200', icon: 'fa-leaf' },
            'dairy_worker': { label: 'Dairy Worker', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: 'fa-cow' },
            'store_manager': { label: 'Store Manager', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'fa-store' },
            'milk_buyer': { label: 'Milk Buyer', color: 'bg-pink-100 text-pink-700 border-pink-200', icon: 'fa-user-tie' }
        };

        const config = roleConfig[role] || { label: role, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: 'fa-user' };
        
        return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}">
            <i class="fas ${config.icon} text-[10px]"></i> ${config.label}
        </span>`;
    }

    static renderUsersTable(users) {
        const currentUserId = auth.getCurrentUser()?.id;

        const rows = users.map(user => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4" data-label="User">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span class="text-green-700 font-bold text-sm">${user.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-800">${user.full_name}</p>
                            <p class="text-xs text-gray-400">@${user.username}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4" data-label="Role">
                    ${UserManagement.getRoleBadge(user.role)}
                </td>
                <td class="px-6 py-4" data-label="Phone">
                    <span class="text-gray-600 text-sm">${user.phone || '—'}</span>
                </td>
                <td class="px-6 py-4" data-label="Status">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.is_active 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }">
                        <span class="w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}"></span>
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4" data-label="Joined">
                    <span class="text-gray-500 text-sm">${new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </td>
                <td class="px-6 py-4" data-label="Actions">
                    <div class="flex items-center gap-1">
                        ${user.id !== currentUserId ? `
                            <button onclick="UserManagement.toggleUserStatus('${user.id}', ${user.is_active}, '${user.full_name}')" 
                                class="w-8 h-8 flex items-center justify-center rounded-lg ${user.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'} transition-colors"
                                title="${user.is_active ? 'Deactivate' : 'Activate'}">
                                <i class="fas ${user.is_active ? 'fa-ban' : 'fa-check'} text-sm"></i>
                            </button>
                            <button onclick="UserManagement.showResetPasswordForm('${user.id}', '${user.full_name}')" 
                                class="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Reset Password">
                                <i class="fas fa-key text-sm"></i>
                            </button>
                        ` : `
                            <span class="text-xs text-gray-400 italic">You</span>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('usersTableContainer').innerHTML = `
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

    static showAddForm() {
        modal.openForm('Add New User', `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                    <input type="text" id="newFullName" required 
                        class="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="John Doe">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Username *</label>
                    <input type="text" id="newUsername" required 
                        class="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="johndoe">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                    <div class="relative">
                        <input type="password" id="newPassword" required 
                            class="w-full px-3.5 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            placeholder="Min. 6 characters">
                        <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" 
                                onclick="UserManagement.togglePasswordVisibility('newPassword', this)">
                            <i class="fas fa-eye text-sm"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" id="newPhone" 
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
            const userData = {
                full_name: document.getElementById('newFullName').value.trim(),
                username: document.getElementById('newUsername').value.trim().toLowerCase(),
                password: document.getElementById('newPassword').value,
                role: document.getElementById('newRole').value,
                phone: document.getElementById('newPhone').value.trim()
            };

            // Validate
            if (userData.password.length < 6) {
                showToast('Password must be at least 6 characters', 'warning');
                return;
            }

            try {
                const response = await api.register(userData);
                if (response.success) {
                    modal.close();
                    showToast(`User "${userData.full_name}" created successfully!`, 'success');
                    await UserManagement.loadUsers();
                }
            } catch (error) {
                showToast(error.message || 'Failed to create user', 'error');
            }
        }, {
            submitText: 'Create User',
            submitIcon: 'fa-user-plus',
            icon: 'fa-user-plus',
            size: 'max-w-2xl'
        });
    }

    static async toggleUserStatus(userId, currentStatus, userName) {
        const action = currentStatus ? 'Deactivate' : 'Activate';
        
        modal.openConfirm(
            `${action} User`,
            `Are you sure you want to ${action.toLowerCase()} <strong>${userName}</strong>? ${currentStatus ? 'They will no longer be able to log in.' : 'They will regain access to the system.'}`,
            async () => {
                try {
                    // Use update endpoint - we need to add this to backend
                    const response = await api.updateUser(userId, { is_active: !currentStatus });
                    if (response.success) {
                        showToast(`User ${action.toLowerCase()}d successfully!`, 'success');
                        await UserManagement.loadUsers();
                    }
                } catch (error) {
                    showToast(error.message || 'Failed to update user', 'error');
                }
            },
            { 
                confirmText: action,
                confirmIcon: currentStatus ? 'fa-ban' : 'fa-check',
                confirmClass: currentStatus 
                    ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 shadow-lg shadow-yellow-600/25' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/25',
                type: currentStatus ? 'warning' : 'info'
            }
        );
    }

    static showResetPasswordForm(userId, userName) {
        modal.openForm(`Reset Password: ${userName}`, `
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">New Password *</label>
                <div class="relative">
                    <input type="password" id="resetPassword" required 
                        class="w-full px-3.5 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="Enter new password (min. 6 characters)">
                    <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" 
                            onclick="UserManagement.togglePasswordVisibility('resetPassword', this)">
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
            const newPassword = document.getElementById('resetPassword').value;

            if (newPassword.length < 6) {
                showToast('Password must be at least 6 characters', 'warning');
                return;
            }

            try {
                const response = await api.resetUserPassword(userId, newPassword);
                if (response.success) {
                    modal.close();
                    showToast(`Password reset successfully for ${userName}!`, 'success');
                }
            } catch (error) {
                showToast(error.message || 'Failed to reset password', 'error');
            }
        }, {
            submitText: 'Reset Password',
            submitIcon: 'fa-key',
            icon: 'fa-key',
            submitClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25'
        });
    }

    static togglePasswordVisibility(inputId, button) {
        const input = document.getElementById(inputId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash text-sm';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye text-sm';
        }
    }
}
