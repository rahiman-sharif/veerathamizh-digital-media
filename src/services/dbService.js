/**
 * Database Service - Abstract Layer for Data Access
 * Currently using JSON files, but designed to be easily replaceable with SQL in the future
 */

const jsonDbService = require('./jsonDbService');

// Define table/collection mapping to file paths
const DB_TABLES = {
    USERS: 'src/data/users.json',
    ORDERS: 'src/data/orders.json',
    OTPS: 'src/data/otps.json',
    RESET_TOKENS: 'src/data/resetTokens.json'
};

/**
 * Find all records in a table
 * @param {string} table - Table/collection name
 * @returns {Promise<Array>} - Array of records
 */
exports.findAll = async (table) => {
    try {
        // Validate table
        const tablePath = DB_TABLES[table];
        if (!tablePath) {
            throw new Error(`Invalid table: ${table}`);
        }
        
        // Read data from JSON file
        return await jsonDbService.readJSON(tablePath);
    } catch (error) {
        // If file doesn't exist, return empty array
        if (error.message.includes('ENOENT')) {
            return [];
        }
        throw new Error(`Database error in findAll: ${error.message}`);
    }
};

/**
 * Find a record by ID
 * @param {string} table - Table/collection name
 * @param {string} id - Record ID
 * @returns {Promise<object|null>} - Record or null if not found
 */
exports.findById = async (table, id) => {
    try {
        const records = await this.findAll(table);
        return records.find(record => record.id === id) || null;
    } catch (error) {
        throw new Error(`Database error in findById: ${error.message}`);
    }
};

/**
 * Find records by a field value
 * @param {string} table - Table/collection name
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @returns {Promise<Array>} - Array of matching records
 */
exports.findByField = async (table, field, value) => {
    try {
        const records = await this.findAll(table);
        return records.filter(record => record[field] === value);
    } catch (error) {
        throw new Error(`Database error in findByField: ${error.message}`);
    }
};

/**
 * Find one record by a field value
 * @param {string} table - Table/collection name
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @returns {Promise<object|null>} - Record or null if not found
 */
exports.findOneByField = async (table, field, value) => {
    try {
        const records = await this.findAll(table);
        return records.find(record => record[field] === value) || null;
    } catch (error) {
        throw new Error(`Database error in findOneByField: ${error.message}`);
    }
};

/**
 * Create a new record
 * @param {string} table - Table/collection name
 * @param {object} data - Record data
 * @returns {Promise<object>} - Created record
 */
exports.create = async (table, data) => {
    try {
        // Validate table
        const tablePath = DB_TABLES[table];
        if (!tablePath) {
            throw new Error(`Invalid table: ${table}`);
        }
        
        // Read existing data
        let records = [];
        try {
            records = await jsonDbService.readJSON(tablePath);
        } catch (error) {
            // If file doesn't exist, create an empty array
            records = [];
        }
        
        // Add new record
        records.push(data);
        
        // Save to JSON file
        await jsonDbService.writeJSON(tablePath, records);
        
        return data;
    } catch (error) {
        throw new Error(`Database error in create: ${error.message}`);
    }
};

/**
 * Update a record by ID
 * @param {string} table - Table/collection name
 * @param {string} id - Record ID
 * @param {object} data - Updated data
 * @returns {Promise<object|null>} - Updated record or null if not found
 */
exports.updateById = async (table, id, data) => {
    try {
        // Validate table
        const tablePath = DB_TABLES[table];
        if (!tablePath) {
            throw new Error(`Invalid table: ${table}`);
        }
        
        // Read existing data
        let records = await jsonDbService.readJSON(tablePath);
        
        // Find record index
        const index = records.findIndex(record => record.id === id);
        
        // If record not found, return null
        if (index === -1) {
            return null;
        }
        
        // Update record
        records[index] = { ...records[index], ...data };
        
        // Save to JSON file
        await jsonDbService.writeJSON(tablePath, records);
        
        return records[index];
    } catch (error) {
        throw new Error(`Database error in updateById: ${error.message}`);
    }
};

/**
 * Delete a record by ID
 * @param {string} table - Table/collection name
 * @param {string} id - Record ID
 * @returns {Promise<boolean>} - True if record was deleted
 */
exports.deleteById = async (table, id) => {
    try {
        // Validate table
        const tablePath = DB_TABLES[table];
        if (!tablePath) {
            throw new Error(`Invalid table: ${table}`);
        }
        
        // Read existing data
        let records = await jsonDbService.readJSON(tablePath);
        
        // Filter out record
        const newRecords = records.filter(record => record.id !== id);
        
        // Check if record was found and deleted
        if (newRecords.length === records.length) {
            return false;
        }
        
        // Save to JSON file
        await jsonDbService.writeJSON(tablePath, newRecords);
        
        return true;
    } catch (error) {
        throw new Error(`Database error in deleteById: ${error.message}`);
    }
};

/**
 * Custom query - delete records by field value
 * @param {string} table - Table/collection name
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @returns {Promise<number>} - Number of records deleted
 */
exports.deleteByField = async (table, field, value) => {
    try {
        // Validate table
        const tablePath = DB_TABLES[table];
        if (!tablePath) {
            throw new Error(`Invalid table: ${table}`);
        }
        
        // Read existing data
        let records = await jsonDbService.readJSON(tablePath);
        
        // Count records before deletion
        const beforeCount = records.length;
        
        // Filter out records
        const newRecords = records.filter(record => record[field] !== value);
        
        // Save to JSON file
        await jsonDbService.writeJSON(tablePath, newRecords);
        
        // Return number of deleted records
        return beforeCount - newRecords.length;
    } catch (error) {
        throw new Error(`Database error in deleteByField: ${error.message}`);
    }
};

/**
 * Find one record by a field value - specifically for login with delay
 * @param {string} table - Table/collection name
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @returns {Promise<object|null>} - Record or null if not found
 */
exports.findOneByFieldForLogin = async (table, field, value) => {
    try {
        // Add 2-second delay for login operations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const records = await this.findAll(table);
        return records.find(record => record[field] === value) || null;
    } catch (error) {
        throw new Error(`Database error in findOneByFieldForLogin: ${error.message}`);
    }
};
