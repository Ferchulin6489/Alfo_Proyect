module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let id = reader.readInt32();
        let amount = reader.readInt32();
        let npcIndex = reader.readInt16();

        const [acc1] = await trx('account').select('id', 'bank_gold').where({id: id});

        if (!acc1) {
            writer.writeInt8(2); //El usuario no existe
        } else {

            await trx('account').update({bank_gold: knex.raw('bank_gold + ??', amount)}).where({id: acc1.id});

            writer.writeInt8(1); //Exitoso
            writer.writeInt32(amount);
            writer.writeInt32(acc1.bank_gold + amount);
            writer.writeInt16(npcIndex);

        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}