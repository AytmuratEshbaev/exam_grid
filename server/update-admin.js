require('dotenv').config();
const db = require('./database/db');
const bcrypt = require('bcrypt');

async function updateAdminPassword() {
    try {
        const username = 'admin';
        const password = '#Aytmurat3003';
        const newHash = await bcrypt.hash(password, 10);
        
        const result = await db.query(
            'UPDATE admins SET password_hash = $1 WHERE username = $2 RETURNING *',
            [newHash, username]
        );
        
        if (result.rows.length > 0) {
            console.log('Admin password updated successfully.');
            console.log(result.rows[0]);
        } else {
            console.log('Admin user not found, inserting it...');
            const insertResult = await db.query(
                `INSERT INTO admins (username, password_hash, full_name, role) 
                 VALUES ($1, $2, 'Super Admin', 'superadmin') RETURNING *`,
                 [username, newHash]
            );
            console.log('Inserted new admin:', insertResult.rows[0]);
        }
    } catch (err) {
        console.error('Error updating admin password:', err);
    } finally {
        process.exit(0);
    }
}

updateAdminPassword();
