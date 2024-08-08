export function commonHTML(html, actor, hasClickable=false, hasEffects=false, hasRoll=false, hasSend=false) {
    if(hasClickable) {
        html.find('.clickable').click(ev => {
            const tgt = $(ev.currentTarget);
            const type = tgt.data("type");
            let attr = null;
            let cat = null;
            let id = null;
            let update = {};

            switch(type) {
                case 'blessure':
                    addBlessure(actor, tgt);
                    break;

                case 'heal':
                    removeBlessure(actor, tgt);
                    break;

                case 'addObject':
                    addObject(actor, tgt);
                    break;

                case 'checkObject':
                    checkObject(actor, tgt);
                    break;

                case 'deleteObject':
                    removeObject(actor, tgt);
                    break;

                case 'wear':
                    wearObject(actor, tgt);
                    break;

                case 'addCompetence':
                    attr = tgt.data("attr");
                    cat = tgt.data("cat");
                    const cmp = Object.keys(actor.system.competences[attr][cat]).length;
                    update[`system.competences.${attr}.${cat}.z${cmp}`] = {
                        0:{
                            data:{
                                base:0,
                                evo:0,
                                mod:0,
                                temp:0
                            },
                            custom:true,
                            domain:false,
                            label:"",
                            raw:cmp,
                            sublabel:"",
                            total:0
                        }
                    }

                    actor.update(update);
                    break;

                case 'removeCompetence':
                    attr = tgt.parents('div.competence').data("attr");
                    cat = tgt.parents('div.competence').data("cat");
                    id = tgt.parents('div.competence').data("id");

                    generateDialog({type:'delete', category:'Competence', name:actor.system.competences[attr][cat][id][0].label, validate:async (d) => {
                        update[`system.competences.${attr}.${cat}.-=${id}`] = null;

                        actor.update(update);
                    }, render:(html) => {
                        stylingHTML(html);
                    }});
                    break;
            }
        });
    }

    if(hasEffects) {
        html.find('.clickableEffect').click(ev => {
            const tgt = $(ev.currentTarget)
            const header = tgt.parents(".summary");
            const item = actor.items.get(header.data("item-id"));
            const effects = item.effects.contents[0];

            if(effects.active) setActivateEffect(item, effects._id, true);
            else setActivateEffect(item, effects._id, false);
        });
    }

    if(hasRoll) {
        html.find('.clickableRoll').click(ev => {
            Hooks.call('roll', ev, actor);
        });

        html.find('.clickableRoll').mouseenter(ev => {
            const tgt = $(ev.currentTarget);
            const icon = tgt.find('i');
            icon.addClass('fa-dice-d10');
        });

        html.find('.clickableRoll').mouseleave(ev => {
            const tgt = $(ev.currentTarget);
            const icon = tgt.find('i');
            icon.removeClass('fa-dice-d10');
        });
    }

    if(hasSend) {
        html.find('.clickableSend').click(ev => {
            Hooks.call('roll', ev, actor);
        });

        html.find('.clickableSend').mouseenter(ev => {
            const tgt = $(ev.currentTarget);
            const icon = tgt.find('i');
            icon.addClass('fa-comment-dots');
        });

        html.find('.clickableSend').mouseleave(ev => {
            const tgt = $(ev.currentTarget);
            const icon = tgt.find('i');
            icon.removeClass('fa-comment-dots');
        });
    }
}

export function stylingHTML(html) {
    html.parents('.window-content').css("background", game.settings.get('prophecy-2e', 'background'));
}

async function addBlessure(actor, tgt, autoupdate=true) {
    const type = tgt?.['value'] ?? tgt.data("value");
    let currentType = type;
    let update = {};
    let applied = '';

    while (currentType !== 'end') {
        const data = actor.system.attributsmineurs.blessure.data[currentType];
        const numCheck = Object.values(data.check).filter(value => value === true).length;

        if (numCheck < data.value) {
            applied = currentType;
            update[`system.attributsmineurs.blessure.data.${currentType}.check.c${numCheck + 1}`] = true;
            break;
        } else {
            currentType = {
                'egratinures': 'legeres',
                'legeres': 'graves',
                'graves': 'fatales',
                'fatales': 'morts',
                'morts': 'end',
            }[currentType];
        }
    }

    await actor.update(update);
    return applied;
}

async function removeBlessure(actor, tgt) {
    const type = tgt.data("value");
    const data = actor.system.attributsmineurs.blessure.data[type];
    const numCheck = Object.values(data.check).filter(value => value === true).length;
    let update = {}

    if(numCheck > 0) update[`system.attributsmineurs.blessure.data.${type}.check.c${numCheck}`] = false;

    await actor.update(update);
}

async function addObject(actor, tgt) {
    const type = tgt.data("subtype");
    const data = actor.system[type];
    const list = Object.entries(data);

    list.push({
        check:false,
        name:'',
        description:'',
        cout:0,
    });

    const objectList = {};
    list.forEach((entry, index) => {
      objectList[index] = {
        check: entry.check,
        name: entry.name,
        description: entry.description,
        cout: entry.cout,
      };
    });

    let update = {}
    update[`system.${type}`] = objectList;

    await actor.update(update);
}

async function checkObject(actor, tgt) {
    const type = tgt.data("subtype");
    const num = tgt.data("num");
    const check = actor.system[type][num].check;
    const result = check ? false : true;

    let update = {}
    update[`system.${type}.${num}.check`] = result;

    await actor.update(update);
}

async function removeObject(actor, tgt) {
    const type = tgt.data("subtype");
    const num = tgt.data("num");
    const name = actor.system[type][num].name;
    let category = '';

    switch(type) {
        case 'privileges':
            category = 'Privilege';
            break;

        case 'annexes':
            category = 'PrivilegeAnnexe';
            break;
    }

    generateDialog({type:'delete', category:category, name:name, validate:async (d) => {
        let update = {}
        update[`system.${type}.-=${num}`] = null;

        await actor.update(update);
    }, render:(html) => {
        stylingHTML(html);
    }});
}

async function wearObject(actor, tgt) {
    const header = tgt.parents(".summary");
    const id = header.data("item-id");
    const wTypeP = tgt.hasClass("wearP");
    const item = actor.items.get(id);
    const type = item.type === 'protection' ? item.system.type : item.type;
    const wearType = {
        'armure':'armorWear',
        'bouclier':'wpnWear',
        'armement':'wpnWear'
    }[type];
    const wear = item.system.wear;
    const wearP = item.system.wearP;
    const wearS = item.system.wearS;
    const listItems = [];
    const listItemsWear = [];
    let listWear = actor.system.combat[wearType];
    let result = true;
    let remove = '';
    let mains = '1main';

    if(type === 'armure') {
        if(wear) result = false;
    } else {
        if(wTypeP && wearP) result = false;
        else if(wearS) result = false;
    }

    if(type === 'armure') await item.update({['system.wear']:result});
    else {
        let itmUpd = {};
        mains = item.system?.mains ?? '1main';

        if(mains === '2mains') {
            itmUpd['system.wearP'] = result;
            itmUpd['system.wearS'] = result;
        } else if(wTypeP) {
            if(wearP) itmUpd['system.wearP'] = result;
            else {
                itmUpd['system.wearP'] = true;
                itmUpd['system.wearS'] = false;
                result = true;
            }
        }
        else itmUpd['system.wearS'] = result;

        await item.update(itmUpd);
    }

    if(result) {
        switch(type) {
            case 'armure':
                if(listWear.length === 1) {
                    remove = actor.items?.get(listWear[0]) ?? null;

                    if(remove !== null) {
                        await remove.update({['system.wear']:false});

                        listItems.push(remove);
                        listItemsWear.push(false);
                    }
                    listWear.shift();
                }

                listWear.push(id);
                break;

            case 'armement':
            case 'bouclier':
                let updMItm = {};
                let updItm1 = {};
                let updItm2 = {};

                if(mains === '2mains') {
                    const filter = actor.items.filter(itm => (itm.type === 'armement' || (itm.type === 'protection' && itm.system.type === 'bouclier')) && (itm.system.wearP || itm.system.wearS) && itm.id !== id);

                    if(filter[0]) {
                        updItm1['system.wearP'] = false;
                        updItm1['system.wearS'] = false;

                        listWear = listWear.filter(itm => itm !== filter[0].id);
                        listItems.push(filter[0]);
                        listItemsWear.push(false);

                        if(filter[1]) {
                            updItm2['system.wearP'] = false;
                            updItm2['system.wearS'] = false;

                            listWear = listWear.filter(itm => itm !== filter[1].id);
                            listItems.push(filter[1]);
                            listItemsWear.push(false);
                        }
                    }

                    if(!foundry.utils.isEmpty(updItm1)) await filter[0].update(updItm1);
                    if(!foundry.utils.isEmpty(updItm2)) await filter[1].update(updItm2);
                }
                else if(wTypeP) {
                    if(wearS) updMItm['system.wearS'] = false;

                    const filter = actor.items.filter(itm => (itm.type === 'armement' || (itm.type === 'protection' && itm.system.type === 'bouclier')) && itm.system.wearP && itm.id !== id);

                    if(filter[0]) {
                        updItm1['system.wearP'] = false;

                        listItems.push(filter[0]);
                        listItemsWear.push(false);

                        if(filter[0].system.wearS) {
                            updItm1['system.wearS'] = false;
                        }

                        listWear = listWear.filter(itm => itm !== filter[0].id);
                    }

                    if(!foundry.utils.isEmpty(updItm1)) await filter[0].update(updItm1);
                }
                else {
                    if(wearP) updMItm['system.wearP'] = false;

                    const filter = actor.items.filter(itm => (itm.type === 'armement' || (itm.type === 'protection' && itm.system.type === 'bouclier')) && itm.system.wearS && itm.id !== id);

                    if(filter[0]) {
                        updItm1['system.wearS'] = false;

                        listItems.push(filter[0]);
                        listItemsWear.push(false);

                        if(filter[0].system.wearP) {
                            updItm1['system.wearP'] = false;
                        }

                        listWear = listWear.filter(itm => itm !== filter[0].id);
                    }

                    if(!foundry.utils.isEmpty(updItm1)) await filter[0].update(updItm1);
                }

                if(!foundry.utils.isEmpty(updMItm)) await item.update(updMItm);
                break;
        }
    } else {
        listWear = listWear.filter(itm => itm !== id);
    }

    listItems.push(item);
    listItemsWear.push(result);

    await sendMsgWear(actor, listItems, listItemsWear);
    await actor.update({[`system.combat.${wearType}`]:listWear});
}

export function generateDialog({...args}) {
    const type = args['type'];
    const category = args['category'];
    const name = args['name'];
    const validate = args?.['validate'] ?? null;
    const cancel = args?.['cancel'] ?? null;
    const render = args?.['render'] ?? null;
    const close = args?.['close'] ?? null;
    const height = args?.['height'] ?? null;
    const width = args?.['width'] ?? null;
    const classe = args?.['classe'] ?? null;

    let dataDialog = {};
    let content = ``;
    let classes = ['prophecy', 'dialog'];

    switch(type) {
        case 'initiative':
            dataDialog.title = game.i18n.localize("PROPHECY.ATTRIBUTSMINEURS.Initiative");
            content += args['content'];

            dataDialog.content = content;
            dataDialog.buttons = {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("PROPHECY.Jet"),
                   },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("PROPHECY.Annuler"),
                }
            }
            if(validate !== null) dataDialog.buttons.one.callback = validate;
            if(cancel !== null) dataDialog.buttons.two.callback = cancel;

            dataDialog.default = 'one';
            dataDialog.render = render;

            classes.push('dialogInitiative');
            break;

        case 'roll':
            dataDialog.title = name;
            content += args['content'];

            dataDialog.content = content;
            dataDialog.buttons = {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("PROPHECY.Jet"),
                   },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("PROPHECY.Annuler"),
                }
            }
            if(validate !== null) dataDialog.buttons.one.callback = validate;
            if(cancel !== null) dataDialog.buttons.two.callback = cancel;

            dataDialog.default = 'one';
            dataDialog.render = render;
            dataDialog.close = close;

            classes.push('dialogRoll');
            break;

        case 'delete':
            dataDialog.title = game.i18n.localize("PROPHECY.DIALOG.DELETE.Label");

            content += `<div class='main'><span class='title'>${game.i18n.localize(`PROPHECY.DIALOG.DELETE.${category}`)}</span>`;
            content += `<span class='center'>${name}</span></div>`;

            dataDialog.content = content;
            dataDialog.buttons = {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("PROPHECY.Valider"),
                   },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("PROPHECY.Annuler"),
                }
            }
            if(validate !== null) dataDialog.buttons.one.callback = validate;
            if(cancel !== null) dataDialog.buttons.two.callback = cancel;

            dataDialog.default = 'one';

            classes.push('dialogDelete');
            break;

        case 'other':
            dataDialog.title = name;
            dataDialog.content = args['content'];
            dataDialog.buttons = {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("PROPHECY.Valider"),
                   },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("PROPHECY.Annuler"),
                }
            }
            dataDialog.default = 'one';
            dataDialog.render = render;

            if(validate !== null) dataDialog.buttons.one.callback = validate;
            if(cancel !== null) dataDialog.buttons.two.callback = cancel;
            break;
    }

    new Dialog(dataDialog, {
        classes:classes.concat(classe),
        height:height,
        width:width
    }).render(true);
}

export function loadContextEffects(context) {
    const data = CONFIG.PROPHECY;
    const lists = data.LIST;
    const actor = context.item.actor;
    let lMods = {};

    for(let l of lists.Caracteristiques) {
        lMods[`system.caracteristiques.${l}.data`] = `${game.i18n.localize('PROPHECY.CARACTERISTIQUES.Singular')} : ${game.i18n.localize(data.Caracteristiques[l])}`;
    }

    for(let l in lists.Attributs) {
        lMods[`system.attributs.${l}.data`] = `${game.i18n.localize('PROPHECY.ATTRIBUTS.Singular')} : ${game.i18n.localize(data.Attributs[l])}`;
    }

    for(let attr in lists.AttributsMineurs) {
        for(let l of lists.AttributsMineurs[attr]) {
            let str = '';
            if(attr === 'Jauge') str = `system.attributsmineurs.${l}.max`;
            else if(attr === 'Score') str = `system.attributsmineurs.${l}.data`;

            if(str !== '') lMods[str] = `${game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.Singular')} : ${game.i18n.localize(data.AttributsMineurs[l])}`;
        }
    }

    for(let l of lists.Disciplines) {
        lMods[`system.magie.disciplines.${l}.data`] = `${game.i18n.localize('PROPHECY.MAGIE.Discipline')} : ${game.i18n.localize(data.MAGIE.Disciplines[l])}`;
    }

    for(let l of lists.Spheres) {
        lMods[`system.magie.spheres.${l}.data`] = `${game.i18n.localize('PROPHECY.MAGIE.Sphere')} : ${game.i18n.localize(data.MAGIE.Spheres[l])}`;
        lMods[`system.magie.spheres.${l}.reserve.data`] = `${game.i18n.localize('PROPHECY.MAGIE.Reserve')} ( ${game.i18n.localize(data.MAGIE.Spheres[l])} )`;
    }

    lMods[`system.magie.reserve.data`] = `${game.i18n.localize('PROPHECY.MAGIE.Reserve')}`;

    if(!actor) {
        for(let d in lists.Competences) {
            for(let cat in lists.Competences[d]) {
                for(let l of lists.Competences[d][cat]) {
                    lMods[`system.bonuscompetences.${d}.${cat}.${l}`] = `${game.i18n.localize('PROPHECY.COMPETENCES.Singular')} : ${game.i18n.localize(data.Competences[l])}`;
                }
            }
        }
    } else {
        const skills = actor.system.competences;

        for(let d in skills) {
            for(let cat in skills[d]) {
                for(let l in skills[d][cat]) {
                    for(let c in skills[d][cat][l]) {
                        const skill = skills[d][cat][l][c];
                        const raw = skill.raw;
                        const name = CONFIG.PROPHECY.Competences?.[raw] ?? false
                        const path = !name ? `system.bonuscompetences.${d}.${cat}.${l}` : `system.bonuscompetences.${d}.${cat}.${raw}`;

                        lMods[path] = `${game.i18n.localize('PROPHECY.COMPETENCES.Singular')} : ${!name ? name : game.i18n.localize(name)}`;
                    }
                }
            }
        }
    }

    context.item.listMods = lMods;
    context.item.listModes = CONFIG.PROPHECY.Modes;
}

export function loadHtmlEffets(item, html, defaultDisabled=false) {
    html.find('.addEffets').click(async ev => {
        ev.preventDefault();
        const effects = item.effects;
        const size = effects.size;
        let effect;

        if(size === 0) {
            await createEffects(item, defaultDisabled);
        } else {
            effect = item.effects.contents[0];
            const changes = effect?.changes ?? [];

            changes.push({
                key: "",
                mode: 2,
                priority: null,
                value: "0"
            });

            await updateEffects(item, effect._id, changes);
        }
    });

    html.find('.deleteEffets').click(async ev => {
        ev.preventDefault();
        const header = $(ev.currentTarget).parents(".effectsChanges");;
        const id = header.data("id");
        const key = header.data("key");

        await deleteEffects(item, id, key);
    });

    html.find(`div.effectsBlock select.effect`).change(async ev => {
        ev.preventDefault();
        const target = $(ev.currentTarget);
        const id = target.data('id');
        const key = target.data('key');
        const value = target.val();
        let effect = item.effects.find(itm => itm._id === id);
        let changes = effect.changes;

        changes[key].key = value;

        await updateEffects(item, effect._id, changes);
    });

    html.find(`div.effectsBlock select.mode`).change(async ev => {
        ev.preventDefault();
        const target = $(ev.currentTarget);
        const id = target.data('id');
        const key = target.data('key');
        const value = target.val();
        let effect = item.effects.find(itm => itm._id === id);
        let changes = effect.changes;

        changes[key].mode = value;

        await updateEffects(item, effect._id, changes);
    });

    html.find(`div.effectsBlock input`).blur(async ev => {
        ev.preventDefault();
        const target = $(ev.currentTarget);
        const id = target.data('id');
        const key = target.data('key');
        const value = target.val();
        let effect = item.effects.find(itm => itm._id === id);
        let changes = effect.changes;
        changes[key].value = value;

        await updateEffects(item, effect._id, changes);
    });
}

export async function loadEffectsClose(item) {
    const form = item.sheet.form;
    const input = $($(form).find('input.effect'));
    const itmName = $($(form).find('input.itmName'));

    for(let i of input) {
      const id = $(i).data('id');
      const key = $(i).data('key');
      const value = $(i).val();
      const effect = item.effects.find(itm => itm._id === id);
      let change = effect.changes;
      change[key].value = value;

      await updateEffects(item, id, change);
    }

    for(let i of itmName) {
        const value = $(i).val();
        const effects = item.effects;
        const size = effects.size;

        if(size !== 0) {
            const effect = item.effects.contents[0];

            await updateEffectsName(item, effect._id, value);
        }
    }
}

export function setSurcharge(surcharge, ...data) {
    return surcharge === null ? Math.max(data.reduce((a,b)=>a+b, 0), 0) : Math.max(surcharge, 0);
}

async function createEffects(item, defaultDisable=false) {
    const actor = getActor(item);

    let addItemEffects = {
        name: item.name,
        icon:'',
        changes:[{
            key: "",
            mode: 2,
            priority: null,
            value: "0"
        }],
        origin:item._id,
        transfer:true,
        disabled:defaultDisable
    };

    await item.createEmbeddedDocuments('ActiveEffect', [addItemEffects]);

    if(actor !== null) {
        let addActorEffects = {
            name: item.name,
            icon:'',
            changes:[{
                key: "",
                mode: 2,
                priority: null,
                value: "0"
            }],
            origin:`Actor.${actor._id}.Item.${item._id}`,
            transfer:true,
            disabled:defaultDisable
        };

      await actor.createEmbeddedDocuments('ActiveEffect', [addActorEffects]);
    }
}

async function deleteEffects(item, id, key) {
    const effect = item.effects.find(eff => eff._id === id);

    if (effect) {
        let changes = effect.changes;
        changes.splice(key, 1)

        await updateEffects(item, id, changes);
    }
}

async function updateEffects(item, id, changes) {
    const actor = getActor(item);
    const sanitizChanges = sanitizKey(changes);

    await item.updateEmbeddedDocuments('ActiveEffect', [{
      "_id":id,
      icon:'',
      changes:sanitizChanges,
    }]);

    if(actor !== null) {
      const getActorEffects = actor.effects.contents.find(itm => itm.origin === `Actor.${actor._id}.Item.${item._id}`);

      await actor.updateEmbeddedDocuments('ActiveEffect', [{
        "_id":getActorEffects._id,
        icon:'',
        changes:sanitizChanges,
      }]);
    }
}

async function updateEffectsName(item, id, name) {
    const actor = getActor(item);

    await item.updateEmbeddedDocuments('ActiveEffect', [{
      "_id":id,
      icon:'',
      name:name,
    }]);

    if(actor !== null) {
      const getActorEffects = actor.effects.contents.find(itm => itm.origin === `Actor.${actor._id}.Item.${item._id}`);

      await actor.updateEmbeddedDocuments('ActiveEffect', [{
        "_id":getActorEffects._id,
        icon:'',
        name:name,
      }]);
    }
}

export async function setActivateEffect(item, id, disabled) {
    const actor = getActor(item);

    await item.updateEmbeddedDocuments('ActiveEffect', [{
      "_id":id,
      icon:'',
      disabled:disabled
    }]);

    if(actor !== null) {
      const getActorEffects = actor.effects.contents.find(itm => itm.origin === `Actor.${actor._id}.Item.${item._id}`);

      await actor.updateEmbeddedDocuments('ActiveEffect', [{
        "_id":getActorEffects._id,
        icon:'',
        disabled:disabled
      }]);
    }
}

function sanitizKey(changes) {
    for(let c in changes) {
        let key = changes[c].key;
        let mode = changes[c].mode;

        for(let l of CONFIG.PROPHECY.LIST.toSanitiz) {
            const other = l.other;
            let valid = false;

            if(!other) valid = true;
            else {
                for(let o of other) {
                    if(key.includes(o)) valid = true;
                }
            }

            if((key.includes(l.key) && valid) && (key.includes(l.add) || key.includes(l.surcharge))) {
                key = key.split('.');
                key.pop();
                key = key.join('.');
            }

            if((key.includes(l.key) && valid) && mode == 2 && !key.includes(l.add)) key += `.${l.add}`;
            else if((key.includes(l.key) && valid) && mode == 5 && !key.includes(l.surcharge)) key += `.${l.surcharge}`;

            changes[c].key = key;
        }
    }

    return changes;
}

function getActor(item) {
    return item.actor;
}

export function sortByWear(a, b) {
    if (a.system.notPrerequis) {
      return 1;
    } else if (b.system.notPrerequis) {
      return -1;
    } else if (!a.system.wear && b.system.wear) {
      return 1;
    } else if (a.system.wear && !b.system.wear) {
      return -1;
    } else return 0;
}

export function sortByWearWpn(a, b) {
    // Si l'objet est notPrerequis, il est toujours en dernier
    if (a.system.notPrerequis) {
        return 1;
    } else if (b.system.notPrerequis) {
        return -1;
    }

    // wearP a toujours la priorité la plus élevée
    if (a.system.wearP && !b.system.wearP) {
        return -1;
    } else if (!a.system.wearP && b.system.wearP) {
        return 1;
    }

    // wearS a la priorité sur pas de wear si les deux n'ont pas de wearP
    if (a.system.wearS && !b.system.wearS) {
        return -1;
    } else if (!a.system.wearS && b.system.wearS) {
        return 1;
    }

    // If both elements have the same wear status
    return 0;
}

export async function sendMsgWear(actor, item, wear) {
    const setting = game.settings.get('prophecy-2e', 'msgwear');
    const chatRollMode = game.settings.get("core", "rollMode");

    if(setting) {
        const list = [];

        for(let i = 0;i < item.length;i++) {
            const type = item[i].type === 'protection' ? item[i].system.type : item[i].type;

            let label = '';

            switch(type) {
                case 'armure':
                    label = wear[i] ? game.i18n.format('PROPHECY.MSG.WearArmor', {name:item[i].name}) : game.i18n.format('PROPHECY.MSG.UnwearArmor', {name:item[i].name});
                    break;
                case 'bouclier':
                    label = wear[i] ? game.i18n.format('PROPHECY.MSG.WearShield', {name:item[i].name}) : game.i18n.format('PROPHECY.MSG.UnwearShield', {name:item[i].name});
                    break;
                case 'armement':
                    label = wear[i] ? game.i18n.format('PROPHECY.MSG.WearWeapon', {name:item[i].name}) : game.i18n.format('PROPHECY.MSG.UnwearWeapon', {name:item[i].name});
                    break;
            }

            list.push(label);
        }

        let chatData = {
            user:game.user.id,
            type:CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: ChatMessage.getSpeaker({
                actor: actor.actor,
                token: actor.token,
                alias: actor.name
            }),
            content:await renderTemplate('systems/prophecy-2e/templates/roll/multiother.html', {
                list:list,
            }),
            rollMode:chatRollMode,
        };

        const msg = await ChatMessage.create(chatData);
    }
}

export async function upgradeMsg(html, msg) {
    addDmgButton(html, msg);
    addApplyDmgButton(html, msg);
    addApplyMagicButton(html, msg);
}

async function addDmgButton(html, msg) {
    html.find('a.dmg').click(async ev => {
        const chatRollMode = game.settings.get("core", "rollMode");
        const flavor = msg.getFlag('prophecy-2e', 'flavor');
        const dmg = msg.getFlag('prophecy-2e', 'dmg');
        const dmgLabel = msg.getFlag('prophecy-2e', 'dmgLabel');
        const howToApply = msg.getFlag('prophecy-2e', 'howToApply');
        const nr = msg.getFlag('prophecy-2e', 'NR');
        const acteurs = [];
        const actor = game.actors.get(ChatMessage.getSpeaker(msg).alias) || null;

        let acteur = {
            id:'',
            name:ChatMessage.getSpeaker(msg).alias,
            noFold:true,
            bonus:[],
        };

        acteur.bonus.push({
            class:'nr',
            type:'number',
            label:game.i18n.localize('PROPHECY.NR-Short'),
            value:nr.val !== 'fail' ? nr.val : 0,
            min:0,
        });

        acteurs.push(acteur);

        const d = generateDialog({type:'roll', content:await renderTemplate('systems/prophecy-2e/templates/dialog/askMod.html', {combatants:acteurs}), height:200, width:300, classes:['dialogRoll'], validate:async (d) => {
            const main = $(d.find('div.main'))[0];
            const nr = parseInt($(main).find('div.nr span.score').text());
            const roll = new Roll(`${dmg} + ${nr}D10`, {});
            await roll.evaluate({async: true});

            let contentTemplate = {
                formula:`${flavor} : ${game.i18n.localize('PROPHECY.Dommages')}`,
                total:roll.total,
                btnSimple:true,
                btn:[{
                    class:'applydmg'
                }],
                tooltip:await renderTemplate('systems/prophecy-2e/templates/roll/tooltip.html', {parts:[{
                    formula:`${dmgLabel} + ${nr}D10 (${game.i18n.localize('PROPHECY.NR-Short')})`,
                    result:roll.total,
                    rolls:roll.dice.map(d => (
                        d.results.map(r => ({
                            classes: `d${d.faces}`,
                            result: r.result
                        }))
                    )).flat()
                }]}),
            };

            let content = await renderTemplate('systems/prophecy-2e/templates/roll/std.html', contentTemplate);

            let chatData = {
                user:game.user.id,
                type:CONST.CHAT_MESSAGE_TYPES.ROLL,
                speaker: ChatMessage.getSpeaker(msg),
                content:content,
                rolls:[roll],
                sound: CONFIG.sounds.dice,
                flags: {
                    'prophecy-2e.prophecy-roll':true,
                    'prophecy-2e.dmg':true,
                    'prophecy-2e.dmgtotal':roll.total,
                    'prophecy-2e.howToApply':howToApply,
                },
                rollMode:chatRollMode,
            };

            const msgdmg = await ChatMessage.create(chatData);
            Hooks.call('msgroll', actor, msgdmg);
        }, render:(html) => {
            stylingHTML(html);

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

            html.find('.dataWithCheck input').change(async ev => {
                const tgt = $(ev.currentTarget);
                const sibling = tgt.parents('label').siblings('.inner');

                if(tgt.is(':checked')) sibling.show();
                else sibling.hide();
            });
        }});
    });
}

async function addApplyDmgButton(html, msg) {
    html.find('a.applydmg').click(async ev => {
        const dmg = parseInt(msg.getFlag('prophecy-2e', 'dmgtotal'));
        const howToApply = msg.getFlag('prophecy-2e', 'howToApply');
        const targets = game.users.current.targets;

        for(let t of targets) {
            const tgt = t.actor;
            let protection = tgt.system.combat.protection;
            if(howToApply === 'divide') protection = protection/2;
            else if(howToApply === 'none') protection = 0;

            const totaldmg = dmg-protection;

            if(totaldmg > 0) {
                const armor = tgt.items.find(itm => itm.type === 'protection' && itm.system.type === 'armure' && itm.system.wear);
                let addToChat = undefined

                if(armor) {
                    const usure = armor.system.usure;
                    const protection = armor.system.protection;

                    if(usure < protection && totaldmg > protection) {
                        armor.update({['system.usure']:usure+1});

                        addToChat = game.i18n.format('PROPHECY.MSG.ArmorDmg', {actor:tgt.name});
                    }
                }

                applyDmg(tgt, totaldmg, addToChat)
            }
        }
    });
}

async function applyDmg(actor, totaldmg, addToChat=undefined) {
    const chatRollMode = game.settings.get("core", "rollMode");

    let label = '';
    if(totaldmg <= 10) {
        const bls = await addBlessure(actor, {value:'egratinures'});
        label = !bls ? game.i18n.format('PROPHECY.MSG.AlreadyDead', {actor:actor.name}) : game.i18n.format('PROPHECY.MSG.Dmg', {
            actor:actor.name,
            type:game.i18n.localize(CONFIG.PROPHECY.Blessures[bls])}
        );
    } else if(totaldmg <= 20) {
        const bls = await addBlessure(actor, {value:'legeres'});
        label = !bls ? game.i18n.format('PROPHECY.MSG.AlreadyDead', {actor:actor.name}) : game.i18n.format('PROPHECY.MSG.Dmg', {
            actor:actor.name,
            type:game.i18n.localize(CONFIG.PROPHECY.Blessures[bls])}
        );

    } else if(totaldmg <= 30) {
        const bls = await addBlessure(actor, {value:'graves'});
        label = !bls ? game.i18n.format('PROPHECY.MSG.AlreadyDead', {actor:actor.name}) : game.i18n.format('PROPHECY.MSG.Dmg', {
            actor:actor.name,
            type:game.i18n.localize(CONFIG.PROPHECY.Blessures[bls])}
        );
    } else if(totaldmg <= 40) {
        const bls = await addBlessure(actor, {value:'fatales'});
        label = !bls ? game.i18n.format('PROPHECY.MSG.AlreadyDead', {actor:actor.name}) : game.i18n.format('PROPHECY.MSG.Dmg', {
            actor:actor.name,
            type:game.i18n.localize(CONFIG.PROPHECY.Blessures[bls])}
        );

    } else if(totaldmg > 40) {
        const bls = await addBlessure(actor, {value:'morts'});
        label = !bls ? game.i18n.format('PROPHECY.MSG.AlreadyDead', {actor:actor.name}) : game.i18n.format('PROPHECY.MSG.Dmg', {
            actor:actor.name,
            type:game.i18n.localize(CONFIG.PROPHECY.Blessures[bls])}
        );
    }
    const list = [];
    list.push(label);

    if(addToChat) list.push(addToChat);

    let chatData = {
        user:game.user.id,
        type:CONST.CHAT_MESSAGE_TYPES.OTHER,
        speaker: ChatMessage.getSpeaker({
            actor: actor.actor,
            token: actor.token,
            alias: actor.name,
        }),
        content:await renderTemplate('systems/prophecy-2e/templates/roll/multiother.html', {
            list:list,
        }),
        rollMode:chatRollMode,
    };

    const msg = await ChatMessage.create(chatData);
}

async function addApplyMagicButton(html, msg) {
    html.find('a.applymagic').click(async ev => {
        const chatRollMode = game.settings.get("core", "rollMode");
        const dataActors = msg.speaker;
        const actor = dataActors.token !== null ? game.scenes.get(dataActors.scene).tokens.get(dataActors.token).actor : game.actors.get(dataActors.actor);
        const sphere = msg.getFlag('prophecy-2e', 'magicSphere');
        const getSphereReserve = actor.system.magie.spheres[sphere].reserve.value;
        const getGeneralReserve = actor.system.magie.reserve.value;
        const spend = parseInt(msg.getFlag('prophecy-2e', 'magicSpend'));
        let sphereSubstraction = getSphereReserve === 0 ? null : getSphereReserve-spend;
        let generalSubstraction = null;
        let spendSubstract = spend;
        let update = {};
        let typeDmg = {
            'egratinures': 0,
            'legeres': 0,
            'graves': 0,
            'fatales': 0,
            'morts': 0,
        }
        let list = [];

        spendSubstract -= getSphereReserve;
        spendSubstract -= getGeneralReserve;

        if(sphereSubstraction !== null && sphereSubstraction < 0) {
            if(getSphereReserve > 0) {
                list.push(game.i18n.format('PROPHECY.MSG.MagicSphere', {
                    actor:actor.name,
                    value:getSphereReserve,
                    sphere:game.i18n.localize(CONFIG.PROPHECY.MAGIEROLL.Spheres[sphere]),
                }));
            }

            generalSubstraction = getGeneralReserve-Math.abs(sphereSubstraction);
            sphereSubstraction = 0;

            update[`system.magie.spheres.${sphere}.reserve.value`] = sphereSubstraction;
        } else if(sphereSubstraction !== null) {
            list.push(game.i18n.format('PROPHECY.MSG.MagicSphere', {
                actor:actor.name,
                value:spend,
                sphere:game.i18n.localize(CONFIG.PROPHECY.MAGIEROLL.Spheres[sphere]),
            }));

            update[`system.magie.spheres.${sphere}.reserve.value`] = sphereSubstraction;
        } else generalSubstraction = getGeneralReserve === 0 ? null : getGeneralReserve-spend;

        if(generalSubstraction !== null && generalSubstraction < 0) {
            if(getGeneralReserve > 0) {
                list.push(game.i18n.format('PROPHECY.MSG.MagicReserve', {
                    actor:actor.name,
                    value:getGeneralReserve,
                }));
            }

            generalSubstraction = 0;

            update[`system.magie.reserve.value`] = generalSubstraction;
        } else if(generalSubstraction !== null) {
            list.push(game.i18n.format('PROPHECY.MSG.MagicReserve', {
                actor:actor.name,
                value:spend,
            }));

            update[`system.magie.reserve.value`] = generalSubstraction;
        }

        if(spendSubstract > 0) {
            const dataBlessures = actor.system.attributsmineurs.blessure.data;

            for(let n = 0;n < spendSubstract;n++) {
                let currentType = 'egratinures';

                while (currentType !== 'end') {
                    const data = dataBlessures[currentType];
                    const numCheck = Object.values(data.check).filter(value => value === true).length;

                    if (numCheck < data.value) {
                        typeDmg[currentType] += 1;
                        dataBlessures[currentType]['check'][`c${numCheck + 1}`] = true;
                        update[`system.attributsmineurs.blessure.data.${currentType}.check.c${numCheck + 1}`] = true;
                        break;
                    } else {
                        currentType = {
                            'egratinures': 'legeres',
                            'legeres': 'graves',
                            'graves': 'fatales',
                            'fatales': 'morts',
                            'morts': 'end',
                        }[currentType];
                    }
                }
            }

            for(let d in typeDmg) {
                if(typeDmg[d] === 1) list.push(game.i18n.format('PROPHECY.MSG.Dmgs', {
                    actor:actor.name,
                    blessure:game.i18n.localize("PROPHECY.MSG.BlessureEgratinure"),
                    type:game.i18n.localize(CONFIG.PROPHECY.Blessures[d]),
                }))
                else if(typeDmg[d] > 1) list.push(game.i18n.format('PROPHECY.MSG.Dmgs', {
                    actor:actor.name,
                    blessure:game.i18n.format("PROPHECY.MSG.Blessures", {
                        value:typeDmg[d],
                    }),
                    type:game.i18n.localize(CONFIG.PROPHECY.Blessures[d]),
                }))
            }
        }

        await actor.update(update);

        let chatData = {
            user:game.user.id,
            type:CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: msg.speaker,
            content:await renderTemplate('systems/prophecy-2e/templates/roll/multiother.html', {
                list:list,
            }),
            rollMode:chatRollMode,
        };

       await ChatMessage.create(chatData);
    });
}
