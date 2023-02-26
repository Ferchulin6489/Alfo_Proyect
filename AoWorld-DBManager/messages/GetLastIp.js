const { DateTime } = require("luxon");
module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let name = reader.readString();

        const [char] = await trx('character').select('id').where({deleted_at: null, character_name: name});
    
        if (!char) {
            writer.writeInt8(2); //El usuario no existe
        } else {

            const ips = await trx('login_log').select('ip').max({date: 'created_at'}).count({cant: 'id'}).where({character_id: char.id}).groupBy('ip');
            
            writer.writeInt8(1); //Success
            
            writer.writeInt16(ips.length);

            for (let ip of ips) {
                writer.writeString(`${ip.ip} | ${new DateTime(ip.date).toFormat('MM-dd-yyyy HH:mm:ss') } - Ingresos: ${ip.cant}`);
            }
        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();
        writer.sendError(socket);
    }
}