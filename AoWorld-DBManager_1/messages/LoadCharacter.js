module.exports = async (reader, writer, knex, socket) => {
    let trx;

    try {
        trx = await knex.transaction();

        let accountId = reader.readInt32();
        let name = reader.readString();
        let ip = reader.readString();

        var insertId; 

        const [char] = await trx('character').select().where({deleted_at: null, character_name: name, account_id: accountId});
    
        if (!char) { //No existe...
            writer.writeInt8(2);
            writer.send(socket);
            return;
        }

        //CHARACTER
        writer.writeInt8(1);
        writer.writeInt32(char.id); 
        writer.writeInt32(char.account_id); 
        writer.writeString(char.character_name);
        writer.writeInt8(char.is_locked);
        writer.writeInt8(char.banned_penalty_id > 0 ? 1 : 0);
    
        if (char.banned_penalty_id > 0) {
            const [ban] = await trx({cp: 'character_penalty'}).select('cp.description', 'cp.created_at', 'cp.unban_at', 'character.character_name as gm').leftJoin('character', 'character.id', 'cp.gm_id').where({'cp.id': char.banned_penalty_id});
            
            if (ban) {
                writer.writeString(ban.description);
                writer.writeString(ban.gm);
                writer.writeInt32(ban.created_at.getTime() / 1000);
                writer.writeInt32(ban.unban_at);
            } else {
                writer.writeString("");
                writer.writeString("");
                writer.writeInt32(0);
                writer.writeInt32(0);
            }

            await trx.rollback();
    
        } else if (char.is_locked == 0) {
    

            const rowsInventory = await trx('character_inventory').select().where({character_id: char.id});
            const rowsVault = await trx('character_vault').select().where({character_id: char.id});
            const rowsAchivement = await trx('character_achievement').select().where({character_id: char.id});
            const rowsQuest = await trx('character_quest').select().where({character_id: char.id});
            const rowsSkill = await trx('character_skill').select().where({character_id: char.id});
            const rowsSpell = await trx('character_spell').select().where({character_id: char.id});
            const rowsHouses = await trx('house').select().where({account_id: char.account_id});

            [insertId] = await trx('login_log').insert(
                {
                    account_id: accountId,
                    character_id: char.id,
                    ip: ip,
                    created_at: knex.fn.now(),
                }
            );

            let loginId = insertId;

            await trx('character').update(
                {
                    last_login_at: knex.fn.now(),
                    previous_ip: knex.ref('last_ip'),
                    is_logged: 1,
                    last_ip: ip
                }
            ).where({id: char.id});

            await trx.commit();
    
            writer.writeInt32(loginId);
            writer.writeInt8(char.level); 
            writer.writeInt32(char.exp); 
            writer.writeInt8(char.genre_id); 
            writer.writeInt8(char.race_id); 
            writer.writeInt8(char.class_id); 
            writer.writeInt8(char.city_id);
            writer.writeString(char.description);
            writer.writeInt32(char.gold); 
            writer.writeInt16(char.free_skillpoints); 
            writer.writeInt16(char.pos_map); 
            writer.writeInt16(char.pos_x); 
            writer.writeInt16(char.pos_y); 
            writer.writeInt16(char.wear_id); 
            writer.writeInt16(char.head_id); 
            writer.writeInt16(char.ship_object_id); 
            writer.writeInt8(char.heading); 
            writer.writeInt16(char.min_hp); 
            writer.writeInt16(char.max_hp); 
            writer.writeInt16(char.min_man); 
            writer.writeInt16(char.max_man); 
            writer.writeInt16(char.min_sta); 
            writer.writeInt16(char.max_sta); 
            writer.writeInt16(char.min_hunger); 
            writer.writeInt16(char.max_hunger); 
            writer.writeInt16(char.min_thirst); 
            writer.writeInt16(char.max_thirst); 
            writer.writeInt16(char.min_hit); 
            writer.writeInt16(char.max_hit); 
            writer.writeInt8(char.invent_level); 
            writer.writeInt8(char.vault_level); 
            writer.writeInt16(char.guild_id);
            writer.writeInt16(char.return_map); 
            writer.writeInt16(char.return_x); 
            writer.writeInt16(char.return_y); 
            writer.writeInt8(char.faction); 
            writer.writeInt8(char.faction_reward); 
            writer.writeInt32(char.faction_entry_users); 
            writer.writeInt32(char.killed_npcs); 
            writer.writeInt32(char.killed_users); 
            writer.writeInt32(char.killed_citizens); 
            writer.writeInt32(char.killed_criminals); 
            writer.writeInt32(char.deaths_npcs); 
            writer.writeInt32(char.deaths_users); 
            writer.writeInt32(char.deaths); 
            writer.writeInt32(char.steps); 
            writer.writeInt8(char.is_poisoned); 
            writer.writeInt8(char.is_incinerated); 
            writer.writeInt8(char.is_sailing); 
            writer.writeInt8(char.is_paralyzed); 
            writer.writeInt8(char.is_silenced); 
            writer.writeInt8(char.is_mounted); 
            writer.writeInt8(char.chat_global); 
            writer.writeInt8(char.chat_combate); 
            writer.writeInt32(char.fishing_points); 
            writer.writeInt32(char.elo); 
            writer.writeInt32(char.time_played);
            writer.writeInt16(char.jail_time);
            writer.writeInt16(char.silence_time);
    
    
            //INVENTORY
            writer.writeInt8(rowsInventory.length);
            for (let r of rowsInventory) {
                writer.writeInt8(r.position);
                writer.writeInt16(r.object_id);
                writer.writeInt16(r.amount);
                writer.writeInt8(r.equipped);
            }
    
            //VAULT
            writer.writeInt8(rowsVault.length);
            for (let r of rowsVault) {
                writer.writeInt8(r.position);
                writer.writeInt16(r.object_id);
                writer.writeInt16(r.amount);
            }
    
            //SKILLS
            writer.writeInt8(rowsSkill.length);
            for (let r of rowsSkill) {
                writer.writeInt8(r.skill_id);
                writer.writeInt8(r.value);
                writer.writeInt8(r.assigned);
            }
    
            //SPELLS
            writer.writeInt8(rowsSpell.length);
            for (let r of rowsSpell) {
                writer.writeInt8(r.position);
                writer.writeInt8(r.spell_id);
            }
    
            //QUESTS
            let completed = 0;
            for (let r of rowsQuest) {
                if (r.completed) completed++;
            }
            writer.writeInt16(completed);
            for (let r of rowsQuest) {
                if (r.completed) writer.writeInt16(r.quest_id);
            }
            writer.writeInt16(rowsQuest.length - completed);
            for (let r of rowsQuest) {
                if (!r.completed) {
                    writer.writeInt16(r.quest_id);
                    writer.writeString(r.data);
                }
            }
        
            //ACHIVEMENTS
            writer.writeInt16(rowsAchivement.length);
            for (let r of rowsAchivement) {
                writer.writeInt16(r.achivement_id);
            }
    
            //HOUSES
            writer.writeInt8(rowsHouses.length);
            for (let r of rowsHouses) {
                writer.writeInt16(r.object_index);
            }
        }
    
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}