import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

export async function getUsers() { 
    const [rows]  = await pool.query('SELECT * FROM users');
    return rows;
}

export async function getUserById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
}


export async function insertUser(name, email, password) {
    const [result] = await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?,?)', [name, password,email]);
    const id = result.insertId;
    return getUserById(id);
}
