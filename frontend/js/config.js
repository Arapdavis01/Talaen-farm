// ============================================
// TALAEN FARM - Configuration
// ============================================

const CONFIG = {
    // API Base URL - Change this to your deployed backend URL
    API_URL: 'http://localhost:3000/api',
    
    // App Settings
    APP_NAME: 'Talaen Farm',
    APP_VERSION: '1.0.0',
    
    // Token storage key
    TOKEN_KEY: 'talaen_token',
    USER_KEY: 'talaen_user',
    
    // Role definitions
    ROLES: {
        FARM_OWNER: 'farm_owner',
        SUPERVISOR: 'supervisor',
        TEA_WORKER: 'tea_worker',
        DAIRY_WORKER: 'dairy_worker',
        STORE_MANAGER: 'store_manager',
        MILK_BUYER: 'milk_buyer'
    },
    
    // Module definitions
    MODULES: {
        TEA: 'tea',
        DAIRY: 'dairy'
    },
    
    // Role to module mapping
    ROLE_MODULES: {
        farm_owner: ['tea', 'dairy'],
        supervisor: ['tea', 'dairy'],
        tea_worker: ['tea'],
        store_manager: ['tea'],
        dairy_worker: ['dairy'],
        milk_buyer: ['dairy']
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
