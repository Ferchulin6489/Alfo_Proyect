/*********************************
 * 
 * DBManager para Argentum United
 *   Por El Yind - 31/07/2022
 * 
**********************************/


const socketListener = require('./server.js');
const Receiver = require('./receiver.js');
const config = require('./config/config.js');


const knex = require('knex')({
    client: 'mysql2',
    connection: config.mysql,
    pool: config.pool,
    migrations: {
      tableName: 'migration'
    }
});
const receiver = new Receiver(knex);

socketListener.start(config.socketPort, receiver);