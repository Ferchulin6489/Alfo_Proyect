const Writer = require('./writer.js');
const Reader = require('./reader.js');

const Commands = {
	1: 'LoadCharacter',
    2: 'SaveCharacter',
    3: 'CreateAccount',
    4: 'BanCharacter',
    5: 'UnbanCharacter',
    6: 'SilenceChar',
    7: 'AddPenalty',
    8: 'AlterName',
    9: 'LoginAccount',
    10: 'GetUserPenalties',
    11: 'TransferGold',
    12: 'DepositGold',
    13: 'WithdrawGold',
    14: 'KickFaction',
    15: 'BankGold',
    16: 'CharacterEvent',
    17: 'GetLastIp',

    18: 'guild/ListGuilds',
    19: 'guild/GetGuild',
    20: 'guild/SetGuild',
    21: 'guild/AddMemberRequest',
    22: 'guild/ListMemberRequests',
    23: 'guild/EventMemberRequest',
    24: 'guild/RemoveMember',
    25: 'guild/ListMembers',
    26: 'guild/EventElection',
    27: 'guild/GetVotes',
    28: 'guild/ListPropositions',
    29: 'guild/ListRelations',
    30: 'guild/NewGuildProposition',
}

for (let key in Commands) {
    Commands[key] = require(`./messages/${Commands[key]}.js`);
}

class Receiver {
    knex
    constructor(db) {
        this.knex = db
    }
    async process(data, socket) {
        let reader = new Reader(Buffer.from(data));

        let len = 0;
        
        //Pueden venir varios paquetes juntos.
        while (len + reader.offset < reader.buffer.length) {
            len = reader.readInt16();
            await this.readPacket(reader, socket);
        }
    }
    async readPacket(reader, socket) {
        try {
            let command = reader.readInt16();

            let UserIndex = reader.readInt16();
            let Validator = reader.readInt32();

            let writer = new Writer();
            //COMMAND
            writer.writeInt16(command);
        
            //VALIDATION DATA
            writer.writeInt16(UserIndex);
            writer.writeInt32(Validator);

            let func = Commands[command];

            if (func) {
                await func(reader, writer, this.knex, socket);
            }
        } catch (ex) {
            console.log('Error reading packet: ', ex);
        }
    }
}



module.exports = Receiver;
