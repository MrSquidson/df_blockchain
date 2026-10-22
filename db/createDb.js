import { connect } from './connect.js';
import upload from 'pg-upload';

const db = await connect();
const timestamp = (await db.query('select now() as timestamp')).rows[0]['timestamp'];
console.log(`Recreating database on ${timestamp}...`);

const tables = [

]

// drop all tables present in the list.
await tables.forEach(async (db_table) => {
    await db.query(`drop table if exists ${db_table}`);
    console.log(`Dropped table ${db_table}`);
});

// Create tables in the remote database
/*
await db.query(`
    create table actors (
        actor_id   integer,
        stage_name  text,
        nationality char(2),
        sex        char(1)
    )
`);
console.log(`Created table actors`);
*/

// Upload data from CSV files into the tables on remote
/*
await upload(db, 'db/actors.csv', `
    copy actors (actor_id, stage_name, nationality, sex)
    from stdin
    with csv encoding 'UTF-8'
`);
console.log(`Uploaded to table actors`);
*/

await db.end();
console.log('Database successfully recreated.');
