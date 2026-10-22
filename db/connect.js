import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const env = {
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: { rejectUnauthorized: false },
};

// This way of running queries is deprecated in pg 9.x
export async function connect() {
    const client = new pg.Client(env);
    await client.connect();
    return client;
}
  
export function pool() {
    return new pg.Pool(env);
}