import { handleRoll } from "./handleRoll.mjs";
import { upgradeMsg } from "./common.mjs";

export const registerHooks = function() {
    Hooks.on("roll", (event, actor) => {
        const tgt = $(event.currentTarget);
        const type = tgt.data('type');
        let itmId = null;
        let itm = null;

        switch(type) {
            case 'competence':
            case 'specialization':
                new handleRoll(actor, tgt, {
                    'prophecy-2e.prophecy-roll':true,
                }).startRoll();
                break;

            case 'magie':
                itmId = tgt.parents('div.summary').data('item-id');
                itm = actor.items.get(itmId);

                if(!itm) return;

                new handleRoll(actor, tgt, {
                    'prophecy-2e.prophecy-roll':true,
                    'prophecy-2e.magic':true,
                    'prophecy-2e.magicSpend':itm.system.cout,
                    'prophecy-2e.magicSphere':itm.system.sphere,
                }, itm.system.difficulte).startRoll();
                break;

            case 'weapon':
                itmId = tgt.parents('.summary').data("item-id");
                itm = actor.items.get(itmId);
                let flagsToAdd = {};

                if(itm === undefined || itm === null) return;

                flagsToAdd = {
                    'prophecy-2e.prophecy-roll':true,
                    'prophecy-2e.weapon':true,
                    'prophecy-2e.dmg':`${itm.system.dommages.total}`,
                    'prophecy-2e.dmgLabel':`${itm.system.dommages.label}`,
                    'prophecy-2e.howToApply':`${itm.system.dommages.howToApply}`,
                }

                new handleRoll(actor, tgt, flagsToAdd, 15).startRoll();
                break;

            case 'caracteristique':
                new handleRoll(actor, tgt, {
                    'prophecy-2e.prophecy-roll':true,
                }).startRoll();
                break;

            case 'avdv':
            case 'sendmagie':
            case 'materiel':
            case 'pouvoir':
                sendItemChat(actor, tgt);
                break;

            case 'lien':
                sendChat(actor, tgt);
                break;
        }
    });


    Hooks.on("renderChatMessage", (message, html, messageData) => {
        upgradeMsg($(html), message);
    });
}

async function sendItemChat(actor, tgt) {
    const header = tgt.parents(".summary");
    const item = actor.items.get(header.data("item-id"));
    const chatRollMode = game.settings.get("core", "rollMode");

    let chatData = {
        user:game.user.id,
        type:CONST.CHAT_MESSAGE_TYPES.OTHER,
        speaker: ChatMessage.getSpeaker({
            actor: actor.actor,
            token: actor.token,
            alias: actor.name
        }),
        content:await renderTemplate('systems/prophecy-2e/templates/roll/other.html', {
            label:item.name,
            description:item.type === 'materiel' || item.type === 'avantage' || item.type === 'desavantage' || item.type === 'pouvoir' ? item.system.description : item.system.effets,
        }),
        rollMode:chatRollMode,
    };

    const msg = await ChatMessage.create(chatData);
}

async function sendChat(actor, tgt) {
    const name = tgt.data("name");
    const description = tgt.data("description");
    const chatRollMode = game.settings.get("core", "rollMode");

    let chatData = {
        user:game.user.id,
        type:CONST.CHAT_MESSAGE_TYPES.OTHER,
        speaker: ChatMessage.getSpeaker({
            actor: actor.actor,
            token: actor.token,
            alias: actor.name
        }),
        content:await renderTemplate('systems/prophecy-2e/templates/roll/other.html', {
            label:name,
            description:description,
        }),
        rollMode:chatRollMode,
    };

    const msg = await ChatMessage.create(chatData);
}