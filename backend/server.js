import express from 'express';
import { pool } from '../db/connect.js';

const db = pool();

const port = 3002;
const server = express();
server.use(express.static('frontend'));
server.use(onEachRequest);
server.get('/api/ticker/:cur/users', onGetUsersFromCurrency);
server.get('/api/trades/:txHash', onGetTransFromTxHash);
server.get('/api/exists/block/:blockHash', onGetBlockExistsByHash);
server.listen(port, onServerReady);

/*

[TODO]:
[x] • Hvilke adresser har været aktive, altså deltaget i en transaktion, med en given valuta?
[x] • Hvilke overførsler skete i transaktionen med hash-værdien x? Hvornår fandt den sted?
[/] • Er blokken med hash-værdien x eller højde n i databasen? Med hvilke transaktioner?
[ ] • Hvilke kryptovalutaer har en given adresse været aktiv med? I hvilket tidsrum?
[ ] • Hvor meget ejer adressen lige nu af hver kryptovaluta?
[ ] • Hvad er den samlede USD værdi af adressen lige nu?
[ ] • Hvor meget har adressen samlet set afsendt og modtaget i et givet tidsinterval – i hele den aktive periode, hele sidste år, i uge 13 2021, i forgårs, etc.?
[ ] • Og hvad var de overførsler værd i USD på det tidspunkt, de fandt sted?

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
        `SELECT EXISTS (
            SELECT block_hash FROM blocks
            WHERE block_hash = $1
        ) AS exists`,
        [blockHash]
    );
    response.json(result.rows[0])
}

function onServerReady() {
    console.log('Webserver running on port', port);
}

function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}