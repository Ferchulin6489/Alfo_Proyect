module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();

        const [votes] = await trx('guild-vote').select('*').where({ guild_id: guild_id });
        if (!votes) {
            writer.writeInt8(2); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        for (let vote of votes) {
            let str = '';

            str = `${vote.vote_id}\t${vote.vote_at}\t${vote.name}\t${vote.vote_to}\n`;

            writer.writeString(str);
        }
        
        await trx.commit();

        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}