import express from 'express';
import { pool } from '../db/connect.js';

const db = pool();

const port = 3002;
const server = express();
server.use(express.static('frontend'));
server.use(onEachRequest);
server.get('/api/ticker/:cur/users', onGetUsersFromCurrency);
server.get('/api/trades/:txHash', onGetTransFromTxHash);
server.get('/api/exists/blockheight/:blockheight', onGetBlockByHeight);
server.get('/api/exists/block/:blockHash', onGetBlockExistsByHash);
server.get('/api/currency/:address', onGetCurrencyAmount);
server.get('/api/address/:address', OnGetAddressActivity);
server.get('/api/address/:address/holdings', onGetAddressHoldings);
server.get('/api/address/:address/totalusdvalue', onGetAddressTotalUSDValue);
server.get('/api/transfers/:user/:date1/:date2', onGetTransfersBetweenDates);
server.listen(port, onServerReady);

/*

[TODO]:
[x] • Hvilke adresser har været aktive, altså deltaget i en transaktion, med en given valuta?
[x] • Hvilke overførsler skete i transaktionen med hash-værdien x? Hvornår fandt den sted?
[/] • Er blokken med hash-værdien x eller højde n i databasen? Med hvilke transaktioner?
[/] • Hvilke kryptovalutaer har en given adresse været aktiv med? I hvilket tidsrum?
[/] • Hvor meget ejer adressen lige nu af hver kryptovaluta?
[ ] • Hvad er den samlede USD værdi af adressen lige nu?
[ ] • Hvor meget har adressen samlet set afsendt og modtaget i et givet tidsinterval – i hele den aktive periode, hele sidste år, i uge 13 2021, i forgårs, etc.?
[/] • Og hvad var de overførsler værd i USD på det tidspunkt, de fandt sted?

*/
async function onGetUsersFromCurrency(request, response) {
    const currencyName = request.params.cur;
    console.log(currencyName)
    const result = await db.query(`
        select t.to_add, t.from_add from trans t 
        inner join cur c on c.currency_id=t.currency_id
        where c.currency = $1
        group by t.to_add, t.from_add
        `, [currencyName])
        let result_adds = [];
        for (let add of result.rows) {
            if (!result_adds.includes(add['to_add'])){
                result_adds.push(add['to_add']);
            };
            if (!result_adds.includes(add['from_add'])){
                result_adds.push(add['from_add']);
            };
        };
        if (result_adds.length > 0) {
            response.json(result_adds);
        } else {
            response.sendStatus(404);
        };
}



async function onGetTransFromTxHash(request, response) {
    const txHash = request.params.txHash;
    const result = await db.query(`
    select t.from_add as Sender, 
    t.amount as Amount, 
    c.currency as Currency, 
    t.to_add as Reciever, 
    b.timestamp as Time
    
    from trans t 
    
    join cur c on c.currency_id=t.currency_id
    join blocks b on t.block_height=b.block_height 
    
    where tx_hash = $1
    `, [txHash]
)
if (result.rows > 0){
    response.json(result.rows)
} else {
    response.sendStatus(404)
}
}

async function onGetBlockExistsByHash(request, response) {
    const blockHash = request.params.blockHash;
    const result = await db.query(
        `
        SELECT EXISTS (SELECT distinct b.block_hash) AS exists, 
         ARRAY (
         SELECT t.tx_hash from trans t 
         JOIN blocks b on t.block_height=b.block_height 
         WHERE b.block_hash = $1
         ) AS trans_hash 
         
         FROM trans t
         JOIN blocks b on t.block_height=b.block_height
         WHERE b.block_hash = $1
         GROUP BY exists;
         `,
        [blockHash]
    );
    console.log(result)
    if (result.rowCount != 0){
        response.json(result.rows)
    } else {
        // Probably the wrong way to do this but i dont really care
        response.json(
            [{
            exists:false,
            trans_hash:[null]
        }]
    )
    }
}

async function onGetBlockByHeight(request, response) {
    const blockheight = request.params.blockheight;
    const result = await db.query(
        `SELECT EXISTS (SELECT distinct b.block_height) AS exists,
         ARRAY (select t.tx_hash where b.block_height = $1) AS trans_hash 
            FROM trans t
            JOIN blocks b on t.block_height=b.block_height
            WHERE b.block_height = $1
         `,
        [blockheight]
    );
    if (result.rows > 0){
    response.json(result.rows)
    } else {
    response.sendStatus(404)
}
        
}

async function onGetCurrencyAmount(request, response) {
    const address = request.params.address;
    const result = await db.query(`
        select
            from_add as address,
            amount,
            currency
        from trans
        join cur using (currency_id)
        where from_add = $1 or to_add = $1
        order by from_add, currency
    `, [address]);

    if (result.rows > 0){
    response.json(result.rows)
    } else {
    response.sendStatus(404)}
}

async function OnGetAddressActivity(request, response) {
    const address = request.params.address;
    const result = await db.query(`
        select distinct c.currency 
        min(time) as first,
        max(time) as last
        from trans t 
        inner join cur c on c.currency_id=t.currency_id
        where t.from_add=$1 or t.to_add=$1
        `, [address]);
    response.json(result.rows);
}

async function onGetAddressHoldings(request, response) {
    const address = request.params.address;
    const result = await db.query(`
        select distinct c.currency, sum(t.amount) as total from trans t
        inner join cur c on c.currency_id=t.currency_id
        where t.from_add=$1 or t.to_add=$1
        group by c.currency
        `, [address]);
    response.json(result.rows);
}

async function onGetAddressTotalUSDValue(request, response) {
    const address = request.params.address;
    const result = await db.query(`
        select sum(amount * ) as total_usd_value from trans t
        inner join cur c on c.currency_id=t.currency_id
        where t.from_add=$1 or t.to_add=$1
        `, [address]);
    response.json(result.rows);
}

async function onGetTransfersBetweenDates (request, response) {
    const user = request.params.user;
    const date1 = request.params.date1;
    const date2 = request.params.date2;

    console.log(`Running onGetTransfersBetweenDates with variables;
        User: ${user}
        Date1: ${date1}
        Date2: ${date2}
        `)
        
    /*
    const result = await db.query(`
        SELECT 
        t.from_add as Sender, 
        t.amount as Amount, 
        c.currency as Currency, 
        t.to_add as Reciever 
        FROM trans t
        JOIN blocks b on t.block_height=b.block_height
        JOIN cur c on c.currency_id=t.currency_id
        WHERE (t.to_add = $1 OR t.from_add = $1) 
        AND b.timestamp BETWEEN $2 AND $3 
        `, [user, date1, date2])
        
    */

    const result = await db.query(`
        SELECT 
        c.currency as Currency, 
        t.to_add as Reciever 
        FROM trans t
        JOIN blocks b on t.block_height=b.block_height
        JOIN cur c on c.currency_id=t.currency_id
        WHERE (t.to_add = $1 OR t.from_add = $1) 
        AND b.timestamp BETWEEN $2 AND $3 
        `, [user, date1, date2])
        response.json(result.rows)
}

function onServerReady() {
    console.log('Webserver running on port', port);
}

function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}