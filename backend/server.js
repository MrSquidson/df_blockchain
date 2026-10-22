import express from 'express';
import { pool } from '../db/connect.js';

const db = pool();

const port = 3002;
const server = express();
server.use(express.static('frontend'));
server.use(onEachRequest);
server.get('/api/actor/:id/costar', onGetCostarsByActorId);
server.listen(port, onServerReady);

async function onGetCostarsByActorId(request, response) {
    const actor_id = request.params.id;
    const result = await db.query(`
        select distinct a2.stage_name as costar, m.title as movie_title, c2.role as role
        from actors a1
        join castings c1 on a1.actor_id = c1.actor_id
        join castings c2 on c1.movie_id = c2.movie_id
        join actors a2 on c2.actor_id = a2.actor_id
        join movies m on c1.movie_id = m.id
        where a1.stage_name = $1 and a2.stage_name <> $1
    `, [actor_id]);
    response.json(result.rows);
}

function onServerReady() {
    console.log('Webserver running on port', port);
}

function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}