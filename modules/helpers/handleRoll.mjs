import { generateDialog, stylingHTML } from "./common.mjs";
import toggler from './toggler.js';

export class handleRoll {
    static optionsWithDIfficulte = ['competence', 'specialization', 'weapon', 'magie'];
    static optionsWithTendances = ['competence', 'specialization', 'weapon', 'magie'];
    static templateMods = 'systems/prophecy-2e/templates/dialog/askMod.html';
    static templatePost = 'systems/prophecy-2e/templates/dialog/postRoll.html';
    static templateStdRoll = 'systems/prophecy-2e/templates/roll/std.html';
    static tempalteTendanceRoll = 'systems/prophecy-2e/templates/roll/tendance.html';

    constructor(actor, html, flags={}, difficulte=null, options=[]) {
        this.actor = actor;
        this.html = html;
        this.dataRoll = {
            attribut:null,
            specialization:null,
            type:'',
            flavor:'',
            tags:[],
            options:options,
            flags:flags,
            tendance:{
                annoncee:null,
                conservee:null,
            },
            difficulte:difficulte,
            critique:null,
            formula:{
                label:'',
                roll:'',
                attribut:0,
                score:0,
                maitrise:null,
                chance:null,
                other:0,
                keys:0,
                parade:0,
                fatigue:0,
                total:0,
            },
            NR:{
                loc:null,
                val:null
            },
            tooltip:[],
        }
    }

    get flavor() {
        return this.dataRoll.flavor;
    }

    get score() {
        return this.dataRoll.formula.score;
    }

    get maitrise() {
        return parseInt(this.dataRoll.formula.maitrise);
    }

    get chance() {
        return parseInt(this.dataRoll.formula.chance);
    }

    get other() {
        return parseInt(this.dataRoll.formula.other);
    }

    get fatigue() {
        return parseInt(this.dataRoll.formula.fatigue);
    }

    get keys() {
        return parseInt(this.dataRoll.formula.keys);
    }

    get parade() {
        return parseInt(this.dataRoll.formula.parade);
    }

    get total() {
        return this.dataRoll.formula.total;
    }

    get difficulte() {
        return this.dataRoll.difficulte;
    }

    get critique() {
        return this.dataRoll.critique;
    }

    get NR() {
        return this.dataRoll.NR;
    }

    get tendances() {
        return this.dataRoll.tendance;
    }

    get isTendance() {
        let result = false;

        if(this.dataRoll.tendance.annoncee) result = true;

        return result;
    }

    get formula() {
        return this.dataRoll.formula;
    }

    get tooltip() {
        return this.dataRoll.tooltip;
    }

    get tags() {
        return this.dataRoll.tags;
    }

    get flags() {
        const base = {
            "prophecy-2e.tooltip":this.tooltip,
            "prophecy-2e.formula":this.formula,
            "prophecy-2e.tags":this.tags,
            "prophecy-2e.total":this.total,
            "prophecy-2e.flavor":this.flavor,
            "prophecy-2e.NR":this.NR,
            "prophecy-2e.difficulte":this.difficulte,
            "prophecy-2e.type":this.type,
        };

        const toAdd = this.dataRoll.flags;

        return foundry.utils.mergeObject(base, toAdd);
    }

    async startRoll() {
        const actor = this.actor;
        const type = this.html.data('type');

        this.#addOptions(type);

        const height = this.#setDialogHeight(125, this.dataRoll.options);

        let acteur = {
            id:actor._id,
            name:actor.name,
            bonus:this.dataRoll.options,
        };

        const acteurs = [];

        acteurs.push(acteur);

        generateDialog({type:'roll', content:await renderTemplate(handleRoll.templateMods, {combatants:acteurs}), height:height, width:300, classes:['dialogRoll'], validate:async (d) => {
            const main = $(d.find('div.main'))[0];
            const attribut = $(main).find('div.attribut select').val();
            const specialization = $(main).find('div.specialization select').val();
            const maitriseUsed = $(main).find('div.maitrise span.score').text();
            const other = parseInt($(main).find('div.other span.score').text());
            const isTendance = $(main).find('div.tendance input').is(':checked') || false;
            const tendance = isTendance ? $(main).find('div.tendance select').val() : null;
            const hasDifficulte = $(main).find('div.nr input').is(':checked') || false;
            const fatigue = $(main).find('div.fatigue');
            const badKeys = $(main).find('div.badKeys');
            const perfectKeys = $(main).find('div.perfectKey');
            const difficulte = hasDifficulte ? parseInt($(main).find('div.nr span.score').text()) : null;
            const parade = $(main).find('div.parade');

            this.dataRoll.attribut = attribut;
            this.dataRoll.type = type;
            this.dataRoll.formula.other = other;
            this.dataRoll.tendance.annoncee = tendance !== '' ? tendance : null;
            this.dataRoll.difficulte = difficulte;

            if(specialization !== '') this.dataRoll.specialization = specialization;

            for(let f of fatigue) {
                const t = $(f);
                const c = t.find('input');

                if(c.is(':checked')) this.dataRoll.formula.fatigue += parseInt(t.data('value'));
            }

            if(badKeys) {
                const bKisChecked = badKeys.find('input').is(':checked');

                if(bKisChecked) this.dataRoll.formula.keys += parseInt(badKeys.find('span.score').text());
            }

            if(perfectKeys) {
                const pKisChecked = perfectKeys.find('input').is(':checked');

                if(pKisChecked) this.dataRoll.formula.keys += parseInt(perfectKeys.data('value'));
            }

            if(parade) {
                const paradeisChecked = parade.find('input').is(':checked');

                if(paradeisChecked) this.dataRoll.formula.parade += parseInt(parade.data('value'));
            }

            this.#useMaitrise(maitriseUsed);
            this.#setFlavor(type);
            this.#setFormula(type);
            this.#doRoll();
        }, render:(html) => this.#addRenders(html)});
    }

    async #endRoll(rolls, msg) {
        const id = msg.id;
        const actor = this.actor;
        const options = [];
        let hasOptions = false;
        let template = handleRoll.templatePost;
        let mainClass = 'dialogPostRoll';
        let height = 200;
        let width = 300;

        if(this.isTendance) {
            height = 250;
            width = 350;
            template = handleRoll.templateMods;
            mainClass = '';

            let choice = {
                id:actor._id,
                name:actor.name,
                bonus:[],
            };

            for(let r in rolls) {
                const roll = rolls[r];

                choice.bonus.push({
                    type:'checkWithTotal',
                    class:`tendance`,
                    label:r === this.tendances.annoncee ? `${game.i18n.localize('PROPHECY.Choisir')} : ${game.i18n.localize(CONFIG.PROPHECY.Tendances[r])} (${game.i18n.localize('PROPHECY.ROLL.Annoncee')})` : `${game.i18n.localize('PROPHECY.Choisir')} : ${game.i18n.localize(CONFIG.PROPHECY.Tendances[r])}`,
                    value:roll.total,
                    locNR:roll.locNR,
                    valNR:roll.valNR,
                    data:r,
                    checked:r === this.tendances.annoncee ? true : false,
                });
            }

            if(actor.system.chance > 0) {
                choice.bonus.push({
                    label:game.i18n.localize('PROPHECY.ROLL.PointsChances'),
                    value:0,
                    min:0,
                    max:actor.system.chance,
                    class:'chance',
                    type:'number',
                });
            }

            options.push(choice)
        } else if(actor.system.chance > 0) {
            let tooltip = this.dataRoll.tooltip;

            if(this.critique !== null) tooltip.pop();

            tooltip.forEach(roll => {
                roll.mods = [];

                roll.mods.push({
                    label:game.i18n.localize('PROPHECY.ROLL.PointsChances'),
                    value:0,
                    min:0,
                    max:actor.system.chance,
                    class:'chance',
                    type:'number',
                });

                hasOptions = true;
            });

            if(hasOptions) {
                options.push({
                    id:actor._id,
                    name:actor.name,
                    msg:id,
                    rolls:this.tooltip,
                })
            }
        }

        if(options.length !== 0) {
            generateDialog({type:'roll', content:await renderTemplate(template, {combatants:options}), height:height, width:width, classe:[mainClass], validate:async (d) => {
                const masters = d.find('div.main');

                for(let main of masters) {
                    const m = $(main);

                    const roll = await this.#handleTendance(m, msg, rolls);
                    this.#handleChance(m);
                    this.#sendRollToChat(roll, true);
                }

            }, render:(html) => this.#addRenders(html, true)});
        }

    }

    async #doRoll() {
        if(this.isTendance) {
            const roll1 = new Roll(this.formula.roll, {});
            const roll2 = new Roll(this.formula.roll, {});
            const roll3 = new Roll(this.formula.roll, {});
            await roll1.evaluate({async: true});
            await roll2.evaluate({async: true});
            await roll3.evaluate({async: true});
            const roll = {
                dragon:roll1,
                homme:roll2,
                fatalite:roll3,
            };
            this.#sendRollToChat(roll);
        } else {
            const roll = new Roll(this.formula.roll, {});
            await roll.evaluate({async: true});

            this.#sendRollToChat({std:roll});
        }
    }

    async #sendRollToChat(rolls, final=false) {
        const chatRollMode = game.settings.get("core", "rollMode");
        const actor = this.actor;
        const isWPN = this.flags['prophecy-2e']['weapon'] || false;
        const isMagic = this.flags['prophecy-2e']['magic'] || false;
        let critique = [];
        let roll = null;
        let contentTemplate = {};
        let content = '';
        let flags = {};
        let itm = null;

        if(rolls !== null && !this.isTendance && !final) {
            roll = rolls['std'];
            let total = roll.total;

            this.dataRoll.formula.total = total;

            this.#setBaseTag();
            this.#setTooltip(roll);
            critique = await this.#handleCritique(roll);
            this.#handleDifficulte();

            contentTemplate = {
                formula:this.flavor,
                total:this.total,
                tooltip:await renderTemplate('systems/prophecy-2e/templates/roll/tooltip.html', {parts:this.tooltip}),
                bonus:this.tags,
                locNR:this.NR.loc,
                valNR:this.NR.val,
            };

            if(isWPN) {
                contentTemplate.dmg = await renderTemplate('systems/prophecy-2e/templates/roll/parts/damage.html', {});
            }

            if(isMagic) {
                contentTemplate.magic = await renderTemplate('systems/prophecy-2e/templates/roll/parts/magic.html', {});
            }

            content = await renderTemplate(handleRoll.templateStdRoll, contentTemplate);

            roll = [roll].concat(critique);
            flags = this.flags;
        } else if(rolls !== null && this.isTendance && !final) {
            contentTemplate = [];
            roll = [];

            this.#setBaseTag();
            flags = this.flags;

            for(let r in rolls) {
                const tRoll = rolls[r];
                const NR = this.#handleDifficulte(tRoll, true);
                const ttip = this.#setTooltip(tRoll, true);

                roll.push(tRoll);

                contentTemplate.push({
                    formula:game.i18n.localize(CONFIG.PROPHECY.Tendances[r]),
                    total:tRoll.total,
                    tooltip:await renderTemplate('systems/prophecy-2e/templates/roll/tooltip.html', {parts:[ttip]}),
                    locNR:NR.loc,
                    valNR:NR.val,
                });

                flags[`prophecy-2e.rolls.${r}`] = {
                    formula:game.i18n.localize(CONFIG.PROPHECY.Tendances[r]),
                    tooltip:ttip,
                    total:tRoll.total,
                    locNR:NR.loc,
                    valNR:NR.val,
                }
            }

            content = await renderTemplate(handleRoll.tempalteTendanceRoll, {
                flavor:this.flavor,
                bonus:this.tags,
                rolls:contentTemplate
            });

        } else {
            roll = rolls;
            this.#handleDifficulte();

            contentTemplate = {
                formula:this.flavor,
                total:this.total,
                tooltip:await renderTemplate('systems/prophecy-2e/templates/roll/tooltip.html', {parts:this.tooltip}),
                bonus:this.tags,
                locNR:this.NR.loc,
                valNR:this.NR.val,
            };

            if(isWPN) {
                contentTemplate.dmg = await renderTemplate('systems/prophecy-2e/templates/roll/parts/damage.html', {});
            }

            if(isMagic) {
                contentTemplate.magic = await renderTemplate('systems/prophecy-2e/templates/roll/parts/magic.html', {});
            }

            content = await renderTemplate(handleRoll.templateStdRoll, contentTemplate);

            flags = this.flags;
        }

        let chatData = {
            user:game.user.id,
            speaker: {
                actor: actor.id,
                token: actor.token,
                alias: actor.name,
                scene: actor?.token?.parent?.id ?? null
            },
            content:content,
            sound: CONFIG.sounds.dice,
            flags: flags,
            rollMode:chatRollMode,
        };

        if(rolls !== null) chatData.rolls = roll;

        ChatMessage.applyRollMode(chatData, chatRollMode);
        const msg = await ChatMessage.create(chatData);

        if(!final) this.#endRoll(rolls, msg);

        Hooks.call('msgroll', actor, msg);
    }

    #addOptions(type) {
        const actor = this.actor;
        const options = [];
        let item = null;
        let itemType = '';
        let attr = 'physique';

        if(type === 'caracteristique') {
            const carac = this.html.data('caracteristique');

            switch(carac) {
                case 'force':
                case 'resistance':
                    attr = 'physique';
                    break;
                case 'intelligence':
                case 'volonte':
                    attr = 'mental';
                    break;
                case 'perception':
                case 'coordination':
                    attr = 'manuel';
                    break;
                case 'empathie':
                case 'presence':
                    attr = 'social';
                    break;
            }

            options.push({
                class:'attribut',
                type:'choice',
                label:game.i18n.localize('PROPHECY.ATTRIBUTS.Singular'),
                choices:{
                    'physique':game.i18n.localize('PROPHECY.ATTRIBUTS.Physique'),
                    'mental':game.i18n.localize('PROPHECY.ATTRIBUTS.Mental'),
                    'manuel':game.i18n.localize('PROPHECY.ATTRIBUTS.Manuel'),
                    'social':game.i18n.localize('PROPHECY.ATTRIBUTS.Social'),
                },
                selected:attr,
            });
        }

        if(type === 'competence' || type === 'specialization') {
            attr = this.html.parents('div.competence').data('attr');

            options.push({
                class:'attribut',
                type:'choice',
                label:game.i18n.localize('PROPHECY.ATTRIBUTS.Singular'),
                choices:{
                    'physique':game.i18n.localize('PROPHECY.ATTRIBUTS.Physique'),
                    'mental':game.i18n.localize('PROPHECY.ATTRIBUTS.Mental'),
                    'manuel':game.i18n.localize('PROPHECY.ATTRIBUTS.Manuel'),
                    'social':game.i18n.localize('PROPHECY.ATTRIBUTS.Social'),
                },
                selected:attr,
            });
        }

        if(type === 'weapon') {
            item = actor.items.get(this.html.parents('.summary').data("item-id"));

            if(item === undefined || item === null) return;
            itemType = item.system.type;

            switch(itemType) {
                case 'projectile':
                case 'mecanique':
                    attr = 'manuel';
                    break;

                case 'articulee':
                case 'contondante':
                case 'hast':
                case 'jet':
                case 'choc':
                case 'corpsacorps':
                case 'double':
                case 'tranchante':
                    attr = 'physique';
                    break;
            }

            options.push({
                class:'attribut',
                type:'choice',
                label:game.i18n.localize('PROPHECY.ATTRIBUTS.Singular'),
                choices:{
                    'physique':game.i18n.localize('PROPHECY.ATTRIBUTS.Physique'),
                    'mental':game.i18n.localize('PROPHECY.ATTRIBUTS.Mental'),
                    'manuel':game.i18n.localize('PROPHECY.ATTRIBUTS.Manuel'),
                    'social':game.i18n.localize('PROPHECY.ATTRIBUTS.Social'),
                },
                selected:attr,
            });

            if(itemType !== '') {
                const allSpe = this.#getWeaponSkill(itemType).specialization;
                let spe = {};

                spe[''] = '';

                for(let s in allSpe) {
                    spe[s] = `${allSpe[s].label} (${allSpe[s].total})`;
                }

                options.push({
                    class:'specialization',
                    type:'choice',
                    label:game.i18n.localize('PROPHECY.ROLL.SpecializationUsed'),
                    choices:spe,
                    selected:'',
                });

                if(itemType === 'bouclier' && item.system.use === 'parade') {
                    options.push({
                        class:'parade',
                        type:'stdCheck',
                        value:item.system.protection,
                        label:game.i18n.localize('PROPHECY.ROLL.BonusParade'),
                    })
                }
            }
        }

        if(handleRoll.optionsWithTendances.includes(type)) {
            options.push({
                class:'tendance',
                type:'choiceWithCheck',
                label:game.i18n.localize('PROPHECY.ROLL.AskTendance'),
                choices:actor.system.maxTendances,
            });
        }

        options.push({
            class:'maitrise',
            type:'number',
            label:game.i18n.localize('PROPHECY.ROLL.PointsMaitrises'),
            max:actor.system.attributsmineurs.maitrise.value,
            min:0,
            value:0,
        },
        {
            class:'other',
            type:'number',
            label:game.i18n.localize('PROPHECY.Modificateur'),
            value:0,
        });

        if(type === 'magie') {
            options.push({
                class:'badKeys',
                type:'numberWithCheck',
                label:game.i18n.localize('PROPHECY.MAGIE.BadKeys'),
                value:-5,
                max:0,
                checked:false,
            },
            {
                class:'perfectKey',
                type:'stdCheck',
                value:5,
                label:game.i18n.localize('PROPHECY.MAGIE.PerfectKey'),
            },
            {
                class:'fatigue',
                type:'stdCheck',
                value:-1,
                label:game.i18n.format('PROPHECY.ROLL.FatigueLegere', {value:-1}),
                onlyone:true
            },
            {
                class:'fatigue',
                type:'stdCheck',
                value:-2,
                label:game.i18n.format('PROPHECY.ROLL.Fatigue', {value:-2}),
                onlyone:true
            });
        }

        if(handleRoll.optionsWithDIfficulte.includes(type)) {
            options.push({
                class:'nr',
                type:'numberWithCheck',
                label:game.i18n.localize('PROPHECY.Difficulte'),
                value:!this.difficulte ? 15 : this.difficulte,
                min:0,
                checked:!this.difficulte ? false : true,
            })
        }


        this.dataRoll.options = options;
    }

    #setDialogHeight(base, options) {
        return Math.min(base + options.length*25, 500);
    }

    #setFlavor(type) {
        const actor = this.actor;
        const sibling = this.html.siblings('input.sublabel');
        let flavor = '';
        let item = null;

        switch(type) {
            case 'caracteristique':
                flavor = game.i18n.localize(CONFIG.PROPHECY.Caracteristiques[this.html.data('caracteristique')]);
                break;
            case 'competence':
                flavor = this.html.data('custom') ? this.html.data('label') : game.i18n.localize(CONFIG.PROPHECY.Competences[this.html.parents('div.competence').data('id')]);

                if(sibling.length > 0) {
                    const sib = $(sibling[0]).val();

                    flavor += sib !== '' ? ` - ${sib}` : '';
                }
                break;

            case 'specialization':
                flavor = this.html.parents('.competence').find('.main i.clickableRoll').data('custom') ? this.html.parents('.competence').find('.main i.clickableRoll').data('label') : game.i18n.localize(CONFIG.PROPHECY.Competences[this.html.parents('div.competence').data('id')]);

                if(sibling.length > 0) {
                    const sib = $(sibling[0]).val();

                    flavor += sib !== '' ? ` - ${sib}` : '';
                }

                flavor += ` (${this.html.data('name')})`;
                break;

            case 'weapon':
                const parent = this.html.parents('.summary');
                item = actor.items.get(parent.data("item-id"));

                if(item === undefined || item === null) return;
                flavor = `${item.name}`;
                break;

            case 'magie':
                const itmId = this.html.parents('div.summary').data('item-id');
                const itm = actor.items.get(itmId);
                flavor = itm.name;
                break;
        }

        this.dataRoll.flavor = flavor;
    }

    #setFormula(type) {
        const actor = this.actor;
        const attribut = this.dataRoll?.attribut ?? 'physique';
        let item = null;

        let header = '';
        let baseFormula = '';
        let labelFormula = '';

        let attrTotal = 0;
        let score = 0;

        switch(type) {
            case 'caracteristique':
                attrTotal = actor.system.attributs[attribut].total;
                score = parseInt(actor.system.caracteristiques[this.html.data('caracteristique')].total);
                break;

            case 'specialization':
                attrTotal = actor.system.attributs[attribut].total;
                score = parseInt(this.html.data('value'));
                break;

            case 'competence':
                header = this.html.parents('div.competence');

                attrTotal = actor.system.attributs[attribut].total;
                score = actor.system.competences[header.data('attr')][header.data('cat')][header.data('id')][header.data('list')].total;
                break;

            case 'magie':
                header = this.html.parents('div.summary');
                const itmId = header.data('item-id');
                const itm = actor.items.get(itmId);
                if(!itm) return;

                const discipline = itm.system.discipline;
                const sphere = itm.system.sphere;

                attrTotal = actor.system.magie.disciplines[discipline].total;
                score = actor.system.magie.spheres[sphere].total;
                break;

            case 'weapon':
                const parent = this.html.parents('.summary');
                item = actor.items.get(parent.data("item-id"));

                if(item === undefined || item === null) return;
                const wpn = this.#getWeaponSkill(item.system.type);

                attrTotal = wpn.attribut;
                score = this.dataRoll.specialization !== null ? wpn.specialization[this.dataRoll.specialization].total : wpn.score;
                break;
        }

        baseFormula = `${attrTotal} + ${score} + 1D10`;
        labelFormula = `${attrTotal} + ${score} + 1D10`;

        if(actor.system.blessure < 0) {
            baseFormula += ` + ${actor.system.blessure}`;
            labelFormula += ` + ${actor.system.blessure} (${game.i18n.localize('PROPHECY.ROLL.Blessures')})`;
        }

        this.dataRoll.formula.label = labelFormula;
        this.dataRoll.formula.roll = baseFormula;
        this.dataRoll.formula.attribut = attrTotal;
        this.dataRoll.formula.score = score;

        if(this.maitrise > 0) {
            this.dataRoll.formula.label += ` + ${this.maitrise} (${game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.Maitrise')})`;
            this.dataRoll.formula.roll += ` + ${this.maitrise}`;
        }

        if(this.other !== 0) {
            this.dataRoll.formula.label += ` + ${this.other} (${game.i18n.localize('PROPHECY.Modificateur')})`;
            this.dataRoll.formula.roll += ` + ${this.other}`;
        }

        if(this.keys !== 0) {
            this.dataRoll.formula.label += ` + ${this.keys} (${game.i18n.localize('PROPHECY.MAGIE.SORTILEGE.Cles')})`;
            this.dataRoll.formula.roll += ` + ${this.keys}`;
        }

        if(this.fatigue !== 0) {
            this.dataRoll.formula.label += ` + ${this.fatigue} (${game.i18n.localize('PROPHECY.Fatigue')})`;
            this.dataRoll.formula.roll += ` + ${this.fatigue}`;
        }

        if(this.parade !== 0) {
            this.dataRoll.formula.label += ` + ${this.parade} (${game.i18n.localize('PROPHECY.Parade')})`;
            this.dataRoll.formula.roll += ` + ${this.parade}`;
        }
    }

    #setBaseTag() {
        const actor = this.actor;
        const html = this.html;
        const type = this.dataRoll.type;
        const blessures = this.actor.system.blessure;
        const maitrise = this.maitrise;
        const other = this.other;
        const difficulte = this.difficulte;
        const isTendance = this.isTendance;
        const tendance = this.tendances;
        let tags = [];

        if(type === 'competence' || type === 'specialization' || type === 'weapon' || type === 'caracteristique') {
            tags.push({
                value:this.dataRoll.attribut,
                class:'attribut',
                label:`${game.i18n.localize(CONFIG.PROPHECY.Attributs[this.dataRoll.attribut])}`,
            });
        }

        if(type === 'weapon') {
            const itm = actor.items.get(this.html.parents('.summary').data("item-id"));

            if(itm.system.type !== '') {
                const dataWpn = this.#getWeaponSkill(itm.system.type);

                tags.push({
                    value:itm.system.type,
                    class:'wpntype',
                    label:this.dataRoll.specialization !== null ?
                    `${game.i18n.localize(CONFIG.PROPHECY.Competences[dataWpn.raw])} (${dataWpn.specialization[this.dataRoll.specialization].label})` :
                    `${game.i18n.localize(CONFIG.PROPHECY.Competences[dataWpn.raw])}`,
                });

                if(dataWpn.raw === 'bouclier' && itm.system.use === 'parade') tags.push({
                    value:itm.system.use,
                    class:'bouclier',
                    label:game.i18n.localize('PROPHECY.Parade')
                });
                else if(dataWpn.raw === 'bouclier' && itm.system.use === 'protection') tags.push({
                    value:itm.system.use,
                    class:'bouclier',
                    label:game.i18n.localize('PROPHECY.ProtectionStatique')
                });
            }
        }

        if(type === 'magie') {
            const itmId = html.parents('div.summary').data('item-id');
            const itm = actor.items.get(itmId);

            tags.push({
                value:itm.system.discipline,
                class:'discipline',
                label:`${game.i18n.localize(CONFIG.PROPHECY.MAGIE.Disciplines[itm.system.discipline])}`,
            });

            tags.push({
                value:itm.system.sphere,
                class:'sphere',
                label:`${game.i18n.localize(CONFIG.PROPHECY.MAGIEROLL.Spheres[itm.system.sphere])}`,
            });

            tags.push({
                value:itm.system.cout,
                class:'cout',
                label:`${game.i18n.localize('PROPHECY.Cout')} : ${itm.system.cout}`,
            });
        }

        if(blessures !== 0) {
            tags.push({
                value:blessures,
                class:'blessure',
                label:`${game.i18n.localize("PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Malus")} : ${blessures}`,
            })
        }

        if(maitrise === 1) tags.push({
            value:1,
            class:'maitrise',
            label:game.i18n.format("PROPHECY.ROLL.MaitriseUtilise", {number: 1})
        });
        else if(maitrise > 1) tags.push({
            value:maitrise,
            class:'maitrise',
            label:game.i18n.format("PROPHECY.ROLL.MaitrisesUtilises", {number: maitrise})
        });

        if(other !== 0) {
            tags.push({
                value:other,
                class:'modificateur',
                label:game.i18n.format("PROPHECY.ROLL.Mod", {number: other})
            })
        }

        if(this.keys !== 0) {
            tags.push({
                value:this.keys,
                class:'cles',
                label:game.i18n.format("PROPHECY.ROLL.Cles", {number: this.keys})
            })
        }

        if(this.fatigue !== 0) {
            tags.push({
                value:this.fatigue,
                class:'fatigue',
                label:game.i18n.format("PROPHECY.ROLL.Fatigue", {value: this.fatigue})
            })
        }


        if(difficulte) {
            tags.push({
                value:difficulte,
                class:'difficulte',
                label:game.i18n.format("PROPHECY.ROLL.Difficulte", {number: difficulte})
            })
        }

        if(isTendance) {
            tags.push({
                value:tendance.annoncee,
                class:'tendance',
                label:`${game.i18n.localize('PROPHECY.ROLL.TendanceAnnoncee')} : ${game.i18n.localize(CONFIG.PROPHECY.Tendances[tendance.annoncee])}`,
            });
        }

        this.dataRoll.tags = tags;
    }

    #setTooltip(roll, extract=false) {
        const listDice = roll.dice[0];

        if(!extract) {
            this.dataRoll.tooltip.push({
                formula: this.formula.label,
                result:roll.total,
                rolls: roll.dice[0].results.map(r => ({
                    classes: `d${listDice.faces}`,
                    result: r.result
                }))
            });
        } else {
            return {
                formula: this.formula.label,
                result:roll.total,
                rolls: roll.dice[0].results.map(r => ({
                    classes: `d${listDice.faces}`,
                    result: r.result
                }))
            }
        }
    }

    #addRenders(html, end=false) {
        stylingHTML(html);
        toggler.init(this.actor._id, html);

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

        html.find('.stdCheck input').click(async ev => {
            const tgt = $(ev.currentTarget);
            const header = tgt.parents('div.stdCheck');
            const index = header.data('index');
            const onlyone = header.data('onlyone');
            const classe = header.data('class');
            const others = header.parents(`div.main`).find(`.stdCheck.${classe}`);

            if(onlyone) {
                for(let o of others) {
                    const t = $(o);
                    const c = t.find('input');
                    const nIndex = t.data('index');
                    if(nIndex !== index && c.is(':checked')) c.prop("checked", false);
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

        html.find('.dataWithCheck .inner .plus').click(async ev => {
            const tgt = $(ev.currentTarget);
            const master = tgt.data('class');
            const max = parseInt(tgt.data('max'));
            let mScore = tgt.parents(`.${master}`).find('span.score');
            let score = parseInt(mScore.text());

            if(score === max) {
                ui.notifications.warn(game.i18n.localize('PROPHECY.WRN.MaitriseMax'));
                return;
            }

            mScore.text(score+5);
        });

        html.find('.dataWithCheck .inner .minus').click(async ev => {
            const tgt = $(ev.currentTarget);
            const master = tgt.data('class');
            const min = parseInt(tgt.data('min'));
            let mScore = tgt.parents(`.${master}`).find('span.score');
            let score = parseInt(mScore.text());

            if(score === min) return;

            mScore.text(score-5);
        });

        if(this.isTendance && end) {
            html.find('.dataWithCheck input').change(async ev => {
                const tgt = $(ev.currentTarget);
                const sibling = tgt.parents('.dataWithCheck').siblings('.tendance');

                if(!tgt.is(':checked')) tgt.prop('checked', true);

                for(let s of sibling) {
                    const act = $(s);
                    const child = act.find('input')

                    if(child.is(':checked')) child.prop('checked', false);
                }
            });
        } else {
            html.find('.dataWithCheck input').change(async ev => {
                const tgt = $(ev.currentTarget);
                const sibling = tgt.parents('label').siblings('.inner');

                if(tgt.is(':checked')) sibling.show();
                else sibling.hide();
            });
        }

    }

    #useMaitrise(used) {
        if(used === 0) return;

        this.actor.update({['system.attributsmineurs.maitrise.value']:this.actor.system.maitrise-parseInt(used)});

        this.dataRoll.formula.maitrise = used;
    }

    #useChance(used) {
        if(used === 0) return;

        this.actor.update({['system.attributsmineurs.chance.value']:this.actor.system.chance-parseInt(used)});

        this.dataRoll.formula.chance = used;
    }

    #handleDifficulte(roll=null, extract=false) {
        const total = roll === null ? this.total : roll.total;
        const difficulte = this.difficulte;
        const critique = this.critique;
        let locNR = this.NR.loc;
        let valNR = this.NR.val;

        valNR = (total - difficulte) >= 0 && difficulte !== null && critique !== 'epicfail' ? Math.floor((total - difficulte) / 5) : null;
        let echec = (total - difficulte) < 0 && difficulte !== null && critique !== 'epicfail'  ? 'fail' : null;

        if(valNR !== null) {
            if(valNR > 1) locNR = game.i18n.format("PROPHECY.ROLL.NRs", {number: valNR});
            else locNR = game.i18n.format("PROPHECY.ROLL.NR", {number: valNR});
        }

        if(echec === 'fail' && critique !== 'epicfail') {
            locNR = game.i18n.localize('PROPHECY.ROLL.Echec');
            valNR = echec;
        }

        if(critique === 'epicfail') {
            locNR = game.i18n.localize('PROPHECY.ROLL.EchecCritique');
            valNR = 'fail';
        }

        if(!extract) {
            this.dataRoll.NR = {
                loc:locNR,
                val:valNR,
            }
        } else {
            return {
                loc:locNR,
                val:valNR,
            }
        }
    }

    async #handleCritique(roll) {
        const listDice = roll.dice[0];
        let verifRoll = [];

        if(listDice.total === 10) {
            const verif = new Roll('1D10', {});
            await verif.evaluate({async: true});
            const vTotal = verif.total;
            verifRoll.push(verif);

            this.dataRoll.tooltip.push({
                formula:`1D10 < ${this.score} (${game.i18n.localize('PROPHECY.ROLL.TestCritique')})`,
                result:vTotal,
                rolls:verif.dice[0].results.map(r => ({
                    classes: `d${verif.dice[0].faces}`,
                    result: r.result
                }))
            });

            if(vTotal < this.score) {
                this.dataRoll.formula.label += ` + 5 (${game.i18n.localize('PROPHECY.ROLL.Critique')})`;
                this.dataRoll.formula.roll += ` + 5`;
                this.dataRoll.formula.total += 5;
                this.dataRoll.critique = 5;
                this.dataRoll.tooltip[0].formula += ` + 5 (${game.i18n.localize('PROPHECY.ROLL.Critique')})`;
                this.dataRoll.tooltip[0].result += 5;

                this.dataRoll.tags.push({
                    value:5,
                    class:'critique',
                    label:game.i18n.localize('PROPHECY.ROLL.ReussiteCritique'),
                });
            } else this.dataRoll.critique = 'notconfirmed';
        } else if(listDice.total === 1) {
            const verif = new Roll('1D10', {});
            await verif.evaluate({async: true});
            const vTotal = verif.total;
            verifRoll.push(verif);

            this.dataRoll.tooltip.push({
                formula:`1D10 > ${this.score} (${game.i18n.localize('PROPHECY.ROLL.TestCritique')})`,
                result:vTotal,
                rolls:verif.dice[0].results.map(r => ({
                    classes: `d${verif.dice[0].faces}`,
                    result: r.result
                }))
            });

            if(vTotal > this.score) {
                this.dataRoll.critique = 'epicfail';

                this.dataRoll.tags.push({
                    value:'epicfail',
                    class:'critique',
                    label:game.i18n.localize('PROPHECY.ROLL.EchecCritique'),
                });
            } else this.dataRoll.critique = 'notconfirmed';
        }

        return verifRoll;
    }

    #handleChance(html) {
        const cChance = html.find('div.chance')[0];
        const bChance = parseInt($(cChance).find('span.score').text());

        if(bChance > 0) {
            this.dataRoll.tooltip[0].formula += ` + ${bChance} (${game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.Chance')})`;
            this.dataRoll.tooltip[0].result += parseInt(bChance);
            this.dataRoll.formula.total += bChance;

            if(bChance > 1) this.dataRoll.tags.push({
                value:bChance,
                class:'chance',
                label:game.i18n.format("PROPHECY.ROLL.ChancesUtilises", {number: bChance})
            });
            else if(bChance === 1) this.dataRoll.tags.push({
                value:1,
                class:'chance',
                label:game.i18n.format("PROPHECY.ROLL.ChanceUtilise", {number: 1})
            });

            this.#useChance(bChance);
        }
    }

    async #handleTendance(html, msg, rolls) {
        if(!this.isTendance) return;

        const getTendances = html.find('div.tendance');
        const getRolls = msg.getFlag('prophecy-2e', 'rolls');
        let roll = null;

        for(let t of getTendances) {
            const mT = $(t);
            const mData = mT.data('tag');
            const mInput = mT.find('input');
            const isCheck = mInput.is(':checked');

            if(isCheck) {
                this.dataRoll.formula.label = getRolls[mData].tooltip.formula;
                this.dataRoll.formula.total = getRolls[mData].total;
                this.dataRoll.tooltip = [getRolls[mData].tooltip];
                this.dataRoll.NR.val = getRolls[mData].valNR;
                this.dataRoll.NR.loc = getRolls[mData].locNR;
                this.dataRoll.tendance.conservee = mData;
                const crit = await this.#handleCritique(rolls[mData]);

                this.dataRoll.tags.push({
                    value:mData,
                    class:'tendanceConservee',
                    label:`${game.i18n.localize("PROPHECY.ROLL.TendanceConservee")} : ${game.i18n.localize(CONFIG.PROPHECY.Tendances[mData])}`,
                });

                roll = crit.length > 0 ? crit : null;
                break;
            }
        }

        return roll;
    }

    #getWeaponSkill(type) {
        const system = this.actor.system;
        let attr = system.attributs[this?.dataRoll?.attribut ?? 'physique'].total;
        let score = [{
            total:0,
            specialization:0,
        }]
        let raw = '';

        switch(type) {
            case 'projectile':
                score = system.competences.manuel.manipulation['armesaprojectiles'];
                raw = 'armesaprojectiles';
                break;

            case 'articulee':
                score = system.competences.physique.combat['armesarticulees'];
                raw = 'armesarticulees';
                break;

            case 'contondante':
                score = system.competences.physique.combat['armescontondantes'];
                raw = 'armescontondantes';
                break;

            case 'hast':
                score = system.competences.physique.combat['armesdhast'];
                raw = 'armesdhast';
                break;

            case 'jet':
                score = system.competences.physique.combat['armesdejet'];
                raw = 'armesdejet';
                break;

            case 'choc':
                score = system.competences.physique.combat['armesdechoc'];
                raw = 'armesdechoc';
                break;

            case 'corpsacorps':
                score = system.competences.physique.combat['corpsacorps'];
                raw = 'corpsacorps';
                break;

            case 'double':
                score = system.competences.physique.combat['armesdoubles'];
                raw = 'armesdoubles';
                break;

            case 'mecanique':
                score = system.competences.manuel.manipulation['armesmecaniques'];
                raw = 'armesmecaniques';
                break;

            case 'tranchante':
                score = system.competences.physique.combat['armestranchantes'];
                raw = 'armestranchantes';
                break;

            case 'bouclier':
                score = system.competences.physique.combat['bouclier'];
                raw = 'bouclier';
                break;
        }

        score = score[0];

        return {
            raw:raw,
            attribut:attr,
            score:score.total,
            specialization:score.specialization
        }
    }
}