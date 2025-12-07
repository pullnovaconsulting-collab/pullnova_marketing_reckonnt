import { pool } from '../config/db.js';

export const getExampleData = async () => {
  const [rows] = await pool.query('SELECT 1 AS example');
  return rows;
};
