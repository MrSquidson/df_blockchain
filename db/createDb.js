import { connect } from './connect.js';
import upload from 'pg-upload';

const db = await connect();
const timestamp = (await db.query('select now() as timestamp')).rows[0]['timestamp'];
console.log(`Recreating database on ${timestamp}...`);

const tables = [
    'cur_val',
    'trans',
    'blocks',
    'cur'
]

// drop all tables present in the list.
await tables.forEach(async (db_table) => {
    await db.query(`drop table if exists ${db_table}`);
    console.log(`Dropped table ${db_table}`);
});

await db.query(`
    create table cur (
        currency            text not null,
        currency_id         integer primary key
    )
`);
console.log(`Created table cur`);

await db.query(`
    create table blocks (
        block_hash          text not null,
        timestamp           timestamp not null,
        prev_block_hash     text,
        block_height        integer primary key
    )
`);
console.log(`Created table blocks`);

await db.query(`
    create table trans (
        tx_hash             text not null,
        from_add            text not null,
        amount              integer not null,
        currency_id         integer not null references cur,
        to_add              text not null,
        block_height        integer references blocks
    )
`);
console.log(`Created table trans`);

await db.query(`
    create table cur_val (
        currency_id         integer references cur,
        timestamp           timestamp not null,
        valuation           integer not null
    )
`);
console.log(`Created table cur_val`);

// Insert tables in the remote database
/*
await db.query(`
    insert into actors (actor_id,stage_name,nationality,sex)
    values (1,foobar,DA,M)
`);
console.log(`Inserted table actors`);
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

await db.query(`
    insert into cur (currency_id,currency)
    values (1, 'ETH'),(2, 'LINK'),(3, 'USDC')
`);
console.log(`Inserted Currency Data`);

await db.query(`
    insert into blocks(block_hash,timestamp,prev_block_hash,block_height)
    values ('000ffe7','2026-10-01T07:30:00z',null,0),
    ('0002a81','2026-10-03T14:00:00z','000ffe7',1),
    ('0003bb6','2026-10-09T22:30:00z','0002a81',2);
    
`);
console.log(`Inserted blocks Data`);

await db.query(`
    insert into trans(tx_hash,from_add,amount,currency_id,to_add,block_height)
    values ('5ac6','coinbase',5,1,'a0324425e7',0),
    
    ('78af','coinbase'  ,5,1,'a0324425e7',1),
    ('9cb6','a0324425e7',2,1,'b07c7e7df3',1),
    ('9cb6','a0324425e7',2,1,'d03894efe8',1),
    ('04aa','a0324425e7',3,1,'f076a8c8b0',1),
    ('04aa','f076a8c8b0',760,2,'a0324425e7',1),
    
    ('af78','coinbase'  ,5   ,1,'c0acb3be5f',2),
    ('9033','a0324425e7',540 ,2,'e088c8d932',2),
    ('9033','a0324425e7',1   ,1,'e088c8d932',2),
    ('acdf','d03894efe8',1   ,1,'f076a8c8b0',2), 
    ('acdf','f076a8c8b0',2390,3,'d03894efe8',2);
    
`);
console.log(`Inserted trans Data`);

await db.query(`
    insert into cur_val (currency_id,timestamp, valuation)
    values (1, '2026-10-01T06:00:00z', 2500),
    (2, '2026-10-01T06:00:00z', 10),
    (3, '2026-10-01T06:00:00z', 1),
    
    (1, '2026-10-03T06:00:00z', 2300),
    (2, '2026-10-03T06:00:00z', 9),
    (3, '2026-10-03T06:00:00z', 1),
    
    (1, '2026-10-09T06:00:00z', 2400),
    (2, '2026-10-09T06:00:00z', 12),
    (3, '2026-10-09T06:00:00z', 1)
`);
console.log(`Inserted Currency Valuation Data`);

await db.end();
console.log('Database successfully recreated.');