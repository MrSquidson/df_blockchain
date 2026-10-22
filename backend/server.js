import express from 'express';
import { pool } from '../db/connect.js';

const db = pool();

const port = 3002;
const server = express();
server.use(express.static('frontend'));
server.use(onEachRequest);
server.get('/api/ticker/:cur/users', onGetUsersFromCurrency);
server.listen(port, onServerReady);

async function onGetUsersFromCurrency(request, response) {
    const currency = request.params.cur;
    const result = await db.query(`
        select distinct to_add + from_add as Users from trans where currency = $1`[currency]
    )
}

function onServerReady() {
    console.log('Webserver running on port', port);
}

function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}


async function onGetTransFromTxHash(request, response) {
    const txHash = request.params.txHash;
    const result = await db.query(`
    select from_add as Sender, 
    amount as Amount, 
    cur.currency as Currency, 
    to_add as Reciever, 
    blocks.timestamp as Time
    
    from trans 
    
    join cur, 
    join blocks, 
    
    where tx_hash = $1` [txHash]
    )
}

async function blockExistsByHash(hash) {
    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1 FROM block
            WHERE hash = $1
        ) AS exists`,
        [hash]
    );

    return result.rows[0].exists;
}

const hash = 'DIN_HASH_VÆRDI';

const exists = await blockExistsByHash(hash);

if (exists) {
    console.log('Blokken findes i databasen');
} else {
    console.log('Blokken findes ikke i databasen');
}


SELECT
    c.currency,
SUM(
    CASE
        WHEN t.t_add =  'a0324425e7' THEN t.amount 
        WHEN t.from_add = 'a0324425e7' THEN -t.amount 
        ELSE 0 

    END 
