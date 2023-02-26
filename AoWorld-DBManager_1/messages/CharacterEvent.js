const { DateTime } = require("luxon");
const fs = require('fs');
/*
    PickGold = 1
    DropGold = 2
    PickItem = 3
    DropItem = 4
    TransferGold = 5
    BuyItem = 6
    SellItem = 7
    P2PCommerce = 8
    KillNpc = 9
    ForgeItem = 10
*/

module.exports = async (reader, writer, knex, socket) => {

    let trx;
    try {
        trx = await knex.transaction();

        let char_id = reader.readInt32();
        let char_name = reader.readString();
        let type_id = reader.readInt8();
        let description = reader.readString();
        let entity_id = reader.readInt32();
        let amount = reader.readInt32();
        let value = reader.readInt32();
        
        let data;

        data = {
            character_id: char_id,
            event_type_id: type_id,
            description: description,
            entity_id: entity_id,
            amount: amount,
            value: value
        };

        await trx('character_event_log').insert(data)        

        await trx.commit();

        //Log adicional en txt para control fuera de la db
        let logStr = `[${DateTime.now().toFormat('HH:mm:ss')}] Name: ${char_name}, Id: ${char_id}, Type: ${type_id}, Entity: ${entity_id}, Amount: ${amount}, Value: ${value}, Desc: ${description}`;
        if (!global.eventLogDate || global.eventLogDate.getDay() != new Date().getDay()) {
            global.eventLogDate = new Date();
            if (global.eventLog) {
                global.eventLog.end();
            } 
            global.eventLog = fs.createWriteStream("logs/Events-" + DateTime.now().toFormat('yyyy-MM-dd') + ".log", {flags:'a'});
        }
        global.eventLog.write(logStr + "\n");


    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

    }

}