module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let id = reader.readInt32();
        let npcIndex = reader.readInt16();
        let initBank = reader.readInt8();

        const [acc1] = await trx('account').select('id', 'bank_gold').where({id: id});

        if (!acc1) {
            writer.writeInt8(2); //El usuario no existe
        } else {
            writer.writeInt8(1); //Exitoso
            writer.writeInt32(acc1.bank_gold);
            writer.writeInt16(npcIndex);
            writer.writeInt8(initBank);
        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}