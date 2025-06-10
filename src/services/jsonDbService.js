const fs = require('fs').promises;

exports.readJSON = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`Error reading JSON file: ${error.message}`);
    }
};

exports.writeJSON = async (filePath, data) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        throw new Error(`Error writing JSON file: ${error.message}`);
    }
};
