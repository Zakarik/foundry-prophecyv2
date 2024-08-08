import { generateDialog, stylingHTML } from "../helpers/common.mjs";
import toggler from '../helpers/toggler.js';

export class ProphecyCombat extends Combat {
    async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant?.id;
        const chatRollMode = game.settings.get("core", "rollMode");
        const rnd = this.round === 0 ? 1 : this.round;

        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        const modificateurs = [];
        const combatants = [];

        for ( let [i, id] of ids.entries() ) {
            // Get Combatant data (non-strictly)
            const combatant = this.combatants.get(id);
            if ( !combatant?.isOwner ) continue;
            combatants.push(combatant);
            const prevRnd = rnd-1;
            const flag = combatant.getFlag('prophecy-2e', 'initiative')?.[prevRnd] ?? null;
            const actor = combatant.actor;
            let actValue = 0;

            if(prevRnd > 0 && flag !== null) {
                const cur = flag.current.value > 0 ? 1 : 0;
                actValue = flag.other.length + cur;
            }

            let allMods = {
                id:id,
                name:actor.name,
                bonus:[{
                    class:'maitrise',
                    type:'number',
                    label:game.i18n.localize('PROPHECY.ROLL.PointsMaitrises'),
                    max:Math.min(actor.system.initiative.total, actor.system.attributsmineurs.maitrise.value),
                    min:0,
                    value:0,
                },
                {
                    label:game.i18n.localize('PROPHECY.ROLL.ActionsInutilisees'),
                    class:'actions',
                    type:'number',
                    min:0,
                    value:actValue,
                }]
            }

            modificateurs.push(allMods);
        }

        let height = Math.min(180*modificateurs.length, 500);

        generateDialog({type:'initiative', content:await renderTemplate('systems/prophecy-2e/templates/dialog/askMod.html', {combatants:modificateurs}), height:height, width:350, validate:async (d) => {
            const mains = d.find('div.main');

            for ( let m of mains ) {
                const tgt = $(m);
                const id = tgt.data('id');

                const combatant = this.combatants.get(id);
                if ( !combatant?.isOwner ) continue;
                const actions = tgt.find('div.data.actions');
                const actor = combatant.actor
                const getBlessure = actor.system.blessure;
                const getWpn = actor.items.find(itm => itm.type === 'armement' && itm.system.wearP && !itm.system.notPrerequis);
                const getWpnOffHand = actor.items.find(itm => itm.type === 'armement' && itm.system.wearS && !itm.system.notPrerequis);
                const getMaitrise = actor.system.maitrise;
                const getInitiative = actor.system.initiative.total;
                const maitriseUsed = parseInt(tgt.find('div.maitrise span.score').text());
                const actionsUsed = parseInt(tgt.find('div.actions span.score').text());
                let diceTotal = getInitiative+actionsUsed;
                let hasOffHand = false;

                if(getWpn && getWpnOffHand && getWpn.id !== getWpnOffHand.id) hasOffHand = true;
                if(hasOffHand) diceTotal += 1;

                combatant.actor.update({['system.attributsmineurs.maitrise.value']:getMaitrise-maitriseUsed});

                let f = '';

                for(let i = 0;i < diceTotal;i++) {
                    f += `1D10+`;
                }

                f = f.slice(0, -1); // Remove the last '+'
                let other = [];

                // Produce an initiative roll for the Combatant
                const roll = combatant.getInitiativeRoll(f);
                await roll.evaluate({async: true});
                const formula = roll.formula.split(' + ');
                let tooltip = [];
                let bonus = [];

                for(let i = 0;i < formula.length;i++) {
                    const d = roll.dice[i];
                    let f = d.formula;
                    let t = d.total;

                    if(getBlessure < 0) {
                        f += ` + ${getBlessure} (${game.i18n.localize('PROPHECY.ROLL.Blessure')})`;
                        t += getBlessure;
                    }

                    tooltip.push({
                        formula: f,
                        result:t,
                        drop:false,
                        offhand:false,
                        rolls: d.results.map(r => ({
                            classes: `d${d.faces}`,
                            result: r.result
                        }))
                    });
                }

                if(hasOffHand && tooltip.length > 0) {
                    tooltip[tooltip.length-1].offhand = true;
                }


                // Trier le tableau en fonction de la valeur result pour trouver les plus bas
                let sortedTooltip = [...tooltip].sort((a, b) => {
                    if (!a.offhand && b.offhand) {
                        return -1;
                    } else if (a.offhand && !b.offhand) {
                        return 1;
                    } else {
                        return a.result - b.result;
                    }
                });

                // Marquer les trois plus bas résultats avec drop = true
                for (let i = 0; i < actionsUsed; i++) {
                    sortedTooltip[i].drop = true;
                }

                sortedTooltip.reverse();

                const filter = sortedTooltip.filter(itm => !itm.drop && itm.result >= 0).map(itm => ({value: itm.result, offhand: itm.offhand}));

                let current = Math.max(...filter.map(f => f.value));
                let cIndex = filter.findIndex(f => f.value === current);
                let filterCurrent = filter[cIndex];

                other = filter;
                other.splice(cIndex, 1);
                other.sort().reverse();

                this._setInitiativeList(combatant, filterCurrent, other);
                updates.push({_id: id, initiative: current});

                if(maitriseUsed === 1) bonus.push({
                    value:1,
                    class:'maitrise',
                    label:game.i18n.format("PROPHECY.ROLL.MaitriseUtilise", {number: 1})
                });
                else if(maitriseUsed > 1) bonus.push({
                    value:maitriseUsed,
                    class:'maitrise',
                    label:game.i18n.format("PROPHECY.ROLL.MaitrisesUtilises", {number: maitriseUsed})
                });

                if(actionsUsed === 1) bonus.push({
                    value:1,
                    class:'actions',
                    label:game.i18n.format("PROPHECY.ROLL.ActionUtilisee", {number: 1})
                });
                else if(actionsUsed > 1) bonus.push({
                    value:actionsUsed,
                    class:'actions',
                    label:game.i18n.format("PROPHECY.ROLL.ActionsUtilisees", {number: actionsUsed})
                });

                if(hasOffHand) {
                    const offM = parseInt(getWpnOffHand.system.initiative.m);
                    const offCC = parseInt(getWpnOffHand.system.initiative.cc);
                    let malus = 0;

                    if(getWpnOffHand.system.malusPrerequis) malus = 1;

                    let m = !isNaN(offM) ? offM-malus : offM;
                    let cc = !isNaN(offCC) ? offCC-malus : offCC;

                    bonus.push({
                        value:`${m}/${cc}`,
                        class:'offhand',
                        label:game.i18n.localize("PROPHECY.ROLL.TwoWeapons")
                    })
                }

                // Construct chat message data
                let chatData = foundry.utils.mergeObject({
                    user:game.user.id,
                    type:CONST.CHAT_MESSAGE_TYPES.ROLL,
                    speaker: ChatMessage.getSpeaker({
                        actor: combatant.actor,
                        token: combatant.token,
                        alias: combatant.name
                    }),
                    content:await renderTemplate('systems/prophecy-2e/templates/roll/initiative.html', {
                        formula:game.i18n.format("PROPHECY.ROLL.PhasesActions", {number: actions.length}),
                        tooltip:await renderTemplate('systems/prophecy-2e/templates/roll/tooltip.html', {parts:sortedTooltip}),
                        bonus:bonus
                    }),
                    flavor: game.i18n.format("COMBAT.RollsInitiative", {name: combatant.name}),
                    rolls:[roll],
                    sound: CONFIG.sounds.dice,
                    flags: {
                        "core.initiativeRoll": true,
                        "prophecy-2e.tooltip":sortedTooltip,
                        "prophecy-2e.formula":game.i18n.format("PROPHECY.ROLL.PhasesActions", {number: actions.length}),
                        "prophecy-2e.bonus":bonus,
                    }
                }, messageOptions);

                // If the combatant is hidden, use a private roll unless an alternative rollMode was explicitly requested
                chatData.rollMode = "rollMode" in messageOptions ? messageOptions.rollMode
                    : (combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode );

                messages.push(chatData);
            }
            if ( !updates.length ) return this;

            // Update multiple combatants
            await this.updateEmbeddedDocuments("Combatant", updates);

            // Ensure the turn order remains with the same combatant
            if ( updateTurn && currentId ) {
            await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
            }

            // Create multiple chat messages
            const msg = await ChatMessage.implementation.create(messages);
            const post = [];

            for(let m of msg) {
                const id = m.id;
                const html = $(m.content);
                const maitrise = $(html.find('.bonus .maitrise')).data('value');
                const offhand = $(html.find('.bonus .offhand')).data('value');
                const actorId = m.speaker.actor;
                const getCmbt = combatants.find(act => act.actorId === actorId);
                const getWpn = getCmbt.actor.items.find(itm => itm.type === 'armement' && itm.system.wearP && !itm.system.notPrerequis);
                const getWpnOffhand = getCmbt.actor.items.find(itm => itm.type === 'armement' && itm.system.wearS && !itm.system.notPrerequis);
                let hasBonus = false;

                let tooltip = m.getFlag('prophecy-2e', 'tooltip');

                tooltip.forEach(roll => {
                    roll.mods = [];
                    roll.modsoffhand = [];
                    roll.modsmainhand = [];

                    roll.mods.push({
                        label:game.i18n.localize('PROPHECY.ROLL.AddOther'),
                        value:0,
                        class:'other',
                        type:'number',
                    });

                    hasBonus = true;

                    if(maitrise) {
                        roll.mods.push({
                            label:game.i18n.localize('PROPHECY.ROLL.AddMaitrise'),
                            value:maitrise,
                            ischeck:false,
                            class:'maitrise',
                            type:'check',
                        });

                        hasBonus = true;
                    }

                    if(roll.offhand) {
                        const offSplit = offhand.split('/');
                        const offM = parseInt(offSplit[0]);
                        const offCC = parseInt(offSplit[1]);

                        if(offM !== 0 && !isNaN(offM)) {
                            roll.modsoffhand.push({
                                label:game.i18n.format('PROPHECY.ROLL.AddInitM', {number:offM}),
                                value:offM,
                                ischeck:false,
                                class:'offhand',
                                onlyone:true,
                                type:'check',
                                name:getWpnOffhand.name
                            });

                            hasBonus = true;
                        }

                        if(offCC !== 0 && !isNaN(offCC)) {
                            roll.modsoffhand.push({
                                label:game.i18n.format('PROPHECY.ROLL.AddInitCC', {number:offCC}),
                                value:offCC,
                                ischeck:false,
                                class:'offhand',
                                onlyone:true,
                                type:'check',
                                name:getWpnOffhand.name
                            });

                            hasBonus = true;
                        }
                    } else if(getWpn) {
                        const initM = getWpn.system.initiative.m;
                        const initCC = getWpn.system.initiative.cc;
                        let malus = 0;

                        if(getWpn.system.malusPrerequis) malus = 1;

                        if(initM !== 0 && !isNaN(initM)) {
                            roll.modsmainhand.push({
                                label:game.i18n.format('PROPHECY.ROLL.AddInitM', {number:initM-malus}),
                                value:initM,
                                ischeck:false,
                                class:'mainhand',
                                onlyone:true,
                                type:'check',
                                name:getWpn.name
                            });

                            hasBonus = true;
                        }

                        if(initCC !== 0 && !isNaN(initCC)) {
                            roll.modsmainhand.push({
                                label:game.i18n.format('PROPHECY.ROLL.AddInitCC', {number:initCC-malus}),
                                value:initCC,
                                ischeck:false,
                                class:'mainhand',
                                onlyone:true,
                                type:'check',
                                name:getWpn.name
                            });

                            hasBonus = true;
                        }
                    } else if(getWpnOffhand) {
                        const initM = getWpnOffhand.system.initiative.m;
                        const initCC = getWpnOffhand.system.initiative.cc;
                        let malus = 0;

                        if(getWpnOffhand.system.malusPrerequis) malus = 1;

                        if(initM !== 0 && !isNaN(initM)) {
                            roll.modsmainhand.push({
                                label:game.i18n.format('PROPHECY.ROLL.AddInitM', {number:initM-malus}),
                                value:initM,
                                ischeck:false,
                                class:'offhand',
                                onlyone:true,
                                type:'check',
                                name:getWpnOffhand.name
                            });

                            hasBonus = true;
                        }

                        if(initCC !== 0 && !isNaN(initCC)) {
                            roll.modsmainhand.push({
                                label:game.i18n.format('PROPHECY.ROLL.AddInitCC', {number:initCC-malus}),
                                value:initCC,
                                ischeck:false,
                                class:'offhand',
                                onlyone:true,
                                type:'check',
                                name:getWpnOffhand.name
                            });

                            hasBonus = true;
                        }
                    }
                });

                if(hasBonus) {
                    post.push({
                        name:getCmbt.name,
                        msg:id,
                        rolls:tooltip,
                    })
                }
            }

            if(post.length !== 0) {
                const hPost = Math.min(post.length*300, 500);
                generateDialog({type:'initiative', content:await renderTemplate('systems/prophecy-2e/templates/dialog/postRoll.html', {combatants:post}), height:hPost, width:300, classe:['dialogPostRoll'], validate:async (d) => {
                    const masters = d.find('div.main');
                    let postupdate = [];

                    for(let main of masters) {
                        const m = $(main);
                        const mId = m.data('id');
                        const cMaitrise = m.find('label.checked.maitrise');
                        const cMainhand = m.find('label.checked.mainhand');
                        const cOffhand = m.find('label.checked.offhand');
                        const cOther = m.find('div.other');
                        const idMaitrise = $(cMaitrise).data('index');
                        const bMaitrise = $(cMaitrise).data('value');
                        const idMainhand = $(cMainhand).data('index');
                        const bMainhand = $(cMainhand).data('value');
                        const nMainhand = $(cMainhand).data('name');
                        const idOffhand = $(cOffhand).data('index');
                        const bOffhand = $(cOffhand).data('value');
                        const nOffhand = $(cOffhand).data('name');
                        const getMsg = game.messages.get(mId);
                        const getCmbt = combatants.find(act => act.actorId === getMsg.speaker.actor);;
                        let getFormula = getMsg.getFlag('prophecy-2e', 'formula');
                        let getTooltip = getMsg.getFlag('prophecy-2e', 'tooltip');
                        let getBonus = getMsg.getFlag('prophecy-2e', 'bonus');
                        let other = [];

                        if(cMainhand.length > 0) {
                            getTooltip[idMainhand].formula += ` + ${bMainhand} (${nMainhand})`;
                            getTooltip[idMainhand].result += bMainhand;
                        }

                        if(cOffhand.length > 0) {
                            getTooltip[idOffhand].formula += ` + ${bOffhand} (${nOffhand})`;
                            getTooltip[idOffhand].result += bOffhand;
                        }

                        if(cMaitrise.length > 0) {
                            getTooltip[idMaitrise].formula += ` + ${bMaitrise} (${game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.Maitrise')})`;
                            getTooltip[idMaitrise].result += bMaitrise;
                        }

                        for(let o of cOther) {
                            const idOther = $(o).data('index');
                            const bOther = parseInt($(o).find('span.score').text());

                            if(bOther > 0) {
                                getTooltip[idOther].formula += ` + ${bOther} (${game.i18n.localize('PROPHECY.ROLL.AddOther')})`;
                                getTooltip[idOther].result += parseInt(bOther);
                            }
                        }

                        const filter = getTooltip.filter(itm => !itm.drop && itm.result >= 0).map(itm => ({value: itm.result, offhand: itm.offhand}));

                        let current = Math.max(...filter.map(f => f.value));
                        let cIndex = filter.findIndex(f => f.value === current);
                        let filterCurrent = filter[cIndex];

                        other = filter;
                        other.splice(cIndex, 1);
                        other.sort().reverse();

                        this._setInitiativeList(getCmbt, filterCurrent, other);
                        postupdate.push({_id: getCmbt.id, initiative: current});

                        let chatData = foundry.utils.mergeObject({
                            user:game.user.id,
                            type:CONST.CHAT_MESSAGE_TYPES.ROLL,
                            speaker: getMsg.speaker,
                            content:await renderTemplate('systems/prophecy-2e/templates/roll/initiative.html', {
                                formula:getFormula,
                                tooltip:await renderTemplate('systems/prophecy-2e/templates/roll/tooltip.html', {parts:getTooltip}),
                                bonus:getBonus
                            }),
                            flavor: game.i18n.format("PROPHECY.ROLL.Finalize", {name: getCmbt.name}),
                            sound: CONFIG.sounds.dice,
                            flags: {
                                "core.initiativeRoll": true,
                                "prophecy-2e.tooltip":getTooltip,
                                "prophecy-2e.formula":getFormula,
                                "prophecy-2e.bonus":getBonus,
                            }
                        }, messageOptions);

                        chatData.rollMode = "rollMode" in messageOptions ? messageOptions.rollMode
                        : (getCmbt.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode );

                        await ChatMessage.create(chatData);
                    }

                    await this.updateEmbeddedDocuments("Combatant", postupdate);

                }, render:(html) => {
                    stylingHTML(html);
                    toggler.init(this.id, html);

                    html.find('.data .sub label.check').click(async ev => {
                        const tgt = $(ev.currentTarget);
                        const i = tgt.find(`i`);
                        const index = tgt.data('index');
                        const index2 = tgt.data('index2');
                        const classe = tgt.data('class');
                        const onlyone = tgt.data('onlyone');
                        const labels = tgt.parents(`div.main`).find(`.sub label.${classe}`);

                        tgt.toggleClass('checked');
                        i.toggleClass('fa-xmark');
                        i.toggleClass('fa-check');

                        for(let l of labels) {
                            const t = $(l);
                            const c = t.find('i');
                            const nIndex = t.data('index');
                            const nIndex2 = t.data('index2');

                            if(onlyone) {
                                if(nIndex2 !== index2 && t.hasClass('checked')) {
                                    t.toggleClass('checked');
                                    c.toggleClass('fa-xmark');
                                    c.toggleClass('fa-check');
                                }
                            } else {
                                if(nIndex !== index && t.hasClass('checked')) {
                                    t.toggleClass('checked');
                                    c.toggleClass('fa-xmark');
                                    c.toggleClass('fa-check');
                                }
                            }
                        }
                    });

                    html.find('.data .inner .plus').click(async ev => {
                        const tgt = $(ev.currentTarget);
                        const master = tgt.data('class');
                        const max = parseInt(tgt.data('max'));
                        let mScore = tgt.parents(`.${master}`).find('span.score');
                        let score = parseInt(mScore.text());

                        if(score === max) {
                            ui.notifications.warn(game.i18n.localize('PROPHECY.WRN.MaitriseMax'));
                            return;
                        }

                        mScore.text(score+1);
                    });

                    html.find('.data .inner .minus').click(async ev => {
                        const tgt = $(ev.currentTarget);
                        const master = tgt.data('class');
                        const min = parseInt(tgt.data('min'));
                        let mScore = tgt.parents(`.${master}`).find('span.score');
                        let score = parseInt(mScore.text());

                        if(score === min) return;

                        mScore.text(score-1);
                    });
                }});
            }

          }, render:(html) => {
            stylingHTML(html);
            toggler.init(this.id, html);

            html.find('.data .inner .plus').click(async ev => {
                const tgt = $(ev.currentTarget);
                const master = tgt.data('class');
                const max = parseInt(tgt.data('max'));
                let mScore = tgt.parents(`.${master}`).find('span.score');
                let score = parseInt(mScore.text());

                if(score === max) {
                    ui.notifications.warn(game.i18n.localize('PROPHECY.WRN.MaitriseMax'));
                    return;
                }

                mScore.text(score+1);
            });

            html.find('.data .inner .minus').click(async ev => {
                const tgt = $(ev.currentTarget);
                const master = tgt.data('class');
                const min = parseInt(tgt.data('min'));
                let mScore = tgt.parents(`.${master}`).find('span.score');
                let score = parseInt(mScore.text());

                if(score === min) return;

                mScore.text(score-1);
            });
        }});

        return this;
    }

    /**
   * Advance the combat to the next round
   * @returns {Promise<Combat>}
   */
    async nextRound() {
        let turn = this.turn === null ? null : 0; // Preserve the fact that it's no-one's turn currently.

        if ( this.settings.skipDefeated && (turn !== null) ) {
        turn = this.turns.findIndex(t => !t.isDefeated);
        if (turn === -1) {
            ui.notifications.warn("COMBAT.NoneRemaining", {localize: true});
            turn = 0;
        }
        }
        let advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
        advanceTime += CONFIG.time.roundTime;
        let nextRound = this.round + 1;

        // Update the document, passing data through a hook first
        const updateData = {round: nextRound, turn};
        const updateOptions = {advanceTime, direction: 1};
        const combatants = this.combatants;
        Hooks.callAll("combatRound", this, updateData, updateOptions);

        for(let cbt of combatants) {
            cbt.update({['initiative']:null});
        }

        return this.update(updateData, updateOptions);
    }

    /**
     * Rewind the combat to the previous turn
     * @returns {Promise<Combat>}
     */
    async previousTurn() {
        const rnd = this.round;
        const allOrder = this.getFlag('prophecy-2e', 'order');
        const order = allOrder?.[rnd] ?? [];

        if (this.round === 0) return this;
        else if(order.length !== 0) {
            let advanceTime = -1 * CONFIG.time.turnTime;

            // Update the document, passing data through a hook first
            const updateData = {};
            const updateOptions = {advanceTime, direction: -1};
            Hooks.callAll("combatTurn", this, updateData, updateOptions);

            const combatant = this.combatants.get(order[order.length-1]);

            if(combatant !== undefined) {
                const initiative = combatant.getFlag('prophecy-2e', 'initiative');

                if(initiative !== undefined) {
                    let currentInitiative = initiative?.[rnd] ?? undefined;

                    if(initiative !== undefined) {

                        if(currentInitiative.used.length === 0) return;

                        const last = currentInitiative.used[currentInitiative.used.length-1];
                        const current = combatant.initiative;

                        if(current === null || last.value > current) {
                            if(current !== null && current !== -999) currentInitiative.other.push(currentInitiative.current);
                            combatant.update({['initiative']:last.value});
                            currentInitiative.current = last;
                        } else {
                            currentInitiative.other.push(last);
                        }

                        order.pop();
                        currentInitiative.used.pop();
                        combatant.setFlag('prophecy-2e', 'initiative', initiative);
                        this.setFlag('prophecy-2e', 'order', allOrder);
                    }
                }
            }

            return this.update(updateData, updateOptions);
        }
    }

    _setInitiativeList(combatant, current, other) {
        const rnd = this.round === 0 ? 1 : this.round;
        let values = {
            current:current,
            other: other,
            used:[]
        };

        combatant.setFlag('prophecy-2e', 'initiative', {
            [rnd]:null
        }).then(() => this._updateInitiative(combatant, values));
    }

    _updateInitiative(combatant, values) {
        const flag = combatant.getFlag('prophecy-2e', 'initiative');
        const rnd = this.round === 0 ? 1 : this.round;
        const crt = flag?.[rnd] ?? undefined;

        if(flag === undefined || crt === undefined) {
            combatant.setFlag('prophecy-2e', 'initiative', {
                [rnd]:values
            });
        } else {
            crt[rnd] = values;

            combatant.setFlag('prophecy-2e', 'initiative', flag);
        }
    }
}