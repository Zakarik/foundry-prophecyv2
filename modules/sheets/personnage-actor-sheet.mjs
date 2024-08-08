import { commonHTML, generateDialog, sortByWear, sortByWearWpn, stylingHTML } from "../helpers/common.mjs";
import toggler from '../helpers/toggler.js';

/**
 * @extends {ActorSheet}
 */
export class PersonnageActorSheet extends ActorSheet {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["prophecy", "sheet", "actor", "personnage"],
        template: "systems/prophecy-2e/templates/personnage-actor-sheet.html",
        width: 1050,
        height: 600,
        tabs: [
          {navSelector: ".tabs", contentSelector: ".body", initial: "principal"},
          {navSelector: ".casteTabs", contentSelector: ".casteBody", initial: "resume"}
        ],
        dragDrop: [{dragSelector: ".draggable", dropSelector: null}],
      });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    getData() {
      const context = super.getData();

      this._prepareCharacterItems(context);

      context.systemData = context.data.system;

      return context;
    }

    /**
       * Return a light sheet if in "limited" state
       * @override
       */
     get template() {
      if (!game.user.isGM && this.actor.limited) {
        //return "systems/donjons-et-chatons/templates/limited-sheet.html";
      }
      return this.options.template;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    activateListeners(html) {
      super.activateListeners(html);

      toggler.init(this.id, html);
      stylingHTML(html);

      // Everything below here is only needed if the sheet is editable
      if ( !this.isEditable ) return;

      commonHTML(html, this.actor, true, true, true, true);

      html.find('.item-create').click(this._onItemCreate.bind(this));

      html.find('.item-edit').click(ev => {
        const header = $(ev.currentTarget).parents(".summary");
        const item = this.actor.items.get(header.data("item-id"));

        item.sheet.render(true);
      });

      html.find('.item-delete').click(async ev => {
        const header = $(ev.currentTarget).parents(".summary");
        const item = this.actor.items.get(header.data("item-id"));
        let category = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        let name = item.name;

        if(category === 'Protection') {
          if(item.system.type === 'armure') category = 'Armure';
          else if(item.system.type === 'bouclier') category = 'Bouclier';
        }

        generateDialog({type:'delete', category:category, name:name, validate:async (d) => {
          item.delete();
          header.slideUp(200, () => this.render(false));
        }});
      });

      html.find('.competence .spe-create').click(async ev => {
        const header = $(ev.currentTarget).parents(".competence");
        const attr = header.data('attr');
        const cat = header.data('cat');
        const id = header.data('id');
        const list = header.data('list');

        await this._addSpecialization(attr, cat, id, list);
      });

      html.find('.competences .multi-create').click(async ev => {
        const header = $(ev.currentTarget).parents(".multi");
        const attr = header.data('attr');
        const cat = header.data('cat');
        const id = header.data('id');

        this._addCompetence(attr, cat, id);
      });

      html.find('.competences .multi-delete').click(async ev => {
        const tgt = $(ev.currentTarget);
        const header = tgt.parents(".multi");
        const attr = header.data('attr');
        const cat = header.data('cat');
        const id = header.data('id');
        const name = tgt.data('name');

        generateDialog({type:'delete', category:'Competence', name:name, validate:async (d) => {
          this._deleteCompetence(attr, cat, id);
        }, render:(html) => {
          stylingHTML(html);
        }});
      });

      html.find('.competence .spe-delete').click(async ev => {
        const tgt = $(ev.currentTarget);
        const header = tgt.parents(".competence");
        const attr = header.data('attr');
        const cat = header.data('cat');
        const id = header.data('id');
        const list = header.data('list');
        const speid = tgt.data('speid');
        const name = tgt.data('name');

        generateDialog({type:'delete', category:'Specialization', name:name, validate:async (d) => {
          await this._deleteSpecialization(attr, cat, id, list, speid);
        }, render:(html) => {
          stylingHTML(html);
        }});
      });

      html.find('.tendance input[type=checkbox]').change(async ev => {
        const tgt = $(ev.currentTarget);
        const header = tgt.parents(".check");
        const type = header.data('type');
        const value = parseInt(tgt.data('value').replace('c', ''));
        const isChecked = tgt.is(":checked");
        let update = {};

        if(isChecked) {
          for(let i = 1;i < value;i++) {
            update[`system.tendances.${type}.check.c${i}`] = true;
          }
        } else {
          for(let i = value+1;i < 11;i++) {
            update[`system.tendances.${type}.check.c${i}`] = false;
          }
        }

        await this.actor.update(update);
      });

      html.find('i.incUsure').click(async ev => {
        const header = $(ev.currentTarget).parents(".data");
        const item = this.actor.items.get(header.data("item-id"));
        const usure = item.system.usure;
        const protection = item.system.protection;

        if(usure < protection) item.update({['system.usure']:usure+1});
      });

      html.find('i.dowUsure').click(async ev => {
        const header = $(ev.currentTarget).parents(".data");
        const item = this.actor.items.get(header.data("item-id"));
        const usure = item.system.usure;

        if(usure > 0) item.update({['system.usure']:usure-1});
      });

      html.find('i.checkPrivilege').click(async ev => {
        const tgt = $(ev.currentTarget);
        const key = tgt.data('num');
        const header = tgt.parents(".summary");
        const item = this.actor.items.get(header.data("item-id"));
        const isCheck = item.system.privileges[key].check;
        const newValue = isCheck ? false : true;

        item.update({[`system.privileges.${key}.check`]:newValue});
      });

      html.find('i.checkPrivilegeAnnexe').click(async ev => {
        const tgt = $(ev.currentTarget);
        const key = tgt.data('num');
        const header = tgt.parents(".summary");
        const item = this.actor.items.get(header.data("item-id"));
        const isCheck = item.system.annexes[key].check;
        const newValue = isCheck ? false : true;

        item.update({[`system.annexes.${key}.check`]:newValue});
      });

      html.find('a.btnUse').click(ev => {
        const tgt = $(ev.currentTarget);
        const header = $(ev.currentTarget).parents(".summary");
        const item = this.actor.items.get(header.data("item-id"));
        const type = tgt.data("type");
        let update = {};

        if(item.system.type !== 'bouclier') return;

        update['system.use'] = type;

        item.update(update);
      });

      html.find('i.editBlessure').click(async ev => {
        let others = {
          id:this.actor._id,
          name:this.actor.name,
          bonus:[{
            class:'egratinure',
            type:'number',
            label:game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Egratinure'),
            min:0,
            value:Object.values(this.actor.system.attributsmineurs.blessure.data.egratinures.check).length,
          },
          {
            class:'legere',
            type:'number',
            label:game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Legere'),
            min:0,
            value:Object.values(this.actor.system.attributsmineurs.blessure.data.legeres.check).length,
          },
          {
            class:'grave',
            type:'number',
            label:game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Grave'),
            min:0,
            value:Object.values(this.actor.system.attributsmineurs.blessure.data.graves.check).length,
          },
          {
            class:'fatale',
            type:'number',
            label:game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Fatale'),
            min:0,
            value:Object.values(this.actor.system.attributsmineurs.blessure.data.fatales.check).length,
          },
          {
            class:'mort',
            type:'number',
            label:game.i18n.localize('PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Mort'),
            min:0,
            value:Object.values(this.actor.system.attributsmineurs.blessure.data.morts.check).length,
          }],
        };

        generateDialog({type:'other', content:await renderTemplate('systems/prophecy-2e/templates/dialog/askMod.html', {combatants:[others]}), classe:['dialogRoll'], name:game.i18n.localize('PROPHECY.EDIT.Seuil'), validate:async (d) => {
          const main = $(d.find('div.main'))[0];
          const egratinure = $(main).find('div.egratinure span.score').text();
          const legere = $(main).find('div.legere span.score').text();
          const grave = $(main).find('div.grave span.score').text();
          const fatale = $(main).find('div.fatale span.score').text();
          const mort = $(main).find('div.mort span.score').text();

          let update = {};
          update['system.attributsmineurs.blessure.edit'] = true;
          update['system.attributsmineurs.blessure.data.egratinures.value'] = parseInt(egratinure);
          update['system.attributsmineurs.blessure.data.legeres.value'] = parseInt(legere);
          update['system.attributsmineurs.blessure.data.graves.value'] = parseInt(grave);
          update['system.attributsmineurs.blessure.data.fatales.value'] = parseInt(fatale);
          update['system.attributsmineurs.blessure.data.morts.value'] = parseInt(mort);

          this.actor.update(update);

        }, render:(html) => {
          stylingHTML(html);
          toggler.init(this.actor._id, html);

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
      });
    }

     /* -------------------------------------------- */
  _prepareCharacterItems(context) {
    const actor = context.actor;
    const items = context.items;
    const avantages = [];
    const desavantages = [];
    const armures = [];
    const boucliers = [];
    const armements = [];
    const materiel = [];
    let caste = {};
    let sortileges = {
      'pierre':[],
      'feu':[],
      'oceans':[],
      'metal':[],
      'nature':[],
      'reves':[],
      'cite':[],
      'vents':[],
      'ombre':[],
    };

    for(let i of items) {
      const type = i.type;
      const data = i.system;
      let updWear = {};

      switch(type) {
        case 'avantage':
          avantages.push(i);
          break;

        case 'desavantage':
          desavantages.push(i);
          break;

        case 'caste':
          caste = i;
          break;

        case 'armement':
          armements.push(i);
          break;

        case 'materiel':
          materiel.push(i);
          break;

        case 'protection':
          if(i.system.type === 'armure') armures.push(i);
          else if(i.system.type === 'bouclier') boucliers.push(i);
          break;

        case 'sortilege':
          sortileges[i.system.sphere].push(i);
          break;
      }
    }

    actor.avantages = avantages;
    actor.desavantages = desavantages;
    actor.armures = armures.sort(sortByWear);
    actor.boucliers = boucliers.sort(sortByWearWpn);
    actor.armements = armements.sort(sortByWearWpn);
    actor.materiel = materiel;
    actor.sortileges = {
      col1:{
        pierre:sortileges.pierre,
        metal:sortileges.metal,
        cite:sortileges.cite
      },
      col2:{
        feu:sortileges.feu,
        nature:sortileges.nature,
        vents:sortileges.vents
      },
      col3:{
        oceans:sortileges.oceans,
        reves:sortileges.reves,
        ombre:sortileges.ombre
      }
    };
    if(!foundry.utils.isEmpty(caste)) actor.caste = caste;
    else actor.caste = null;
  }

  async _addSpecialization(attr, cat, id, list) {
    let spe = null;
    let path = ``;

    spe = this.actor.system.competences[attr][cat][id][list].specialization
    path = `system.competences.${attr}.${cat}.${id}.${list}.specialization`;

    const index = spe === null || spe === undefined || foundry.utils.isEmpty(spe) ? 0 : Math.max(...Object.keys(spe).map(key => parseInt(key))) + 1;

    await this.actor.update({[`${path}.${index}`]: {
      data:{
        base:0,
        evo:0,
        mod:0,
        temp:0,
      },
      label:'',
      total:0
    }});
  }

  async _deleteSpecialization(attr, cat, id, list, speid) {
    await this.actor.update({[`system.competences.${attr}.${cat}.${id}.${list}.specialization.-=${speid}`]: null});
  }

  async _addCompetence(attr, cat, id) {
    const data = this.actor.system.competences[attr][cat][id];
    const raw = data[0].raw;
    const length = Object.keys(data).length;

    await this.actor.update({[`system.competences.${attr}.${cat}.${id}.${length}`]: {
      data:{
        base:0,
        evo:0,
        mod:0,
        temp:0
      },
      specialization:null,
      raw:raw,
      sublabel:'',
      total:0,
      open:false,
      domain:true,
    }});
  }

  async _deleteCompetence(attr, cat, id) {
    const length = Object.keys(this.actor.system.competences[attr][cat][id]).length-1;

    await this.actor.update({[`system.competences.${attr}.${cat}.${id}.-=${length}`]: null});
  }

  async _onDropItemCreate(itemData) {

    itemData = itemData instanceof Array ? itemData : [itemData];
    const itemBaseType = itemData[0].type;

    if(itemBaseType === 'caste') {
      const caste = this.actor.items.filter(i => i.type === 'caste');
      const cExist = caste.length > 0 ? true : false;

      if(cExist) {
        for(let c of caste) {
          await c.delete();
        }
      }
    } else if(itemBaseType === 'pouvoir') return;

    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    const subtype = header.dataset.subtype;
    const sphere = header.dataset.sphere;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `${game.i18n.localize(`TYPES.Item.${type}`)}`;
    // Prepare the item object.
    let itemData = {
      name: name,
      type: type,
      data: data,
      img: CONFIG.PROPHECY.IMAGES[type],
      system:{}
    };

    if(subtype) {
      itemData.system.type = subtype;
      itemData.name = game.i18n.localize(`PROPHECY.${subtype.charAt(0).toUpperCase() + subtype.slice(1)}`);

      delete itemData.data["subtype"];
    }

    if(sphere) {
      itemData.system.sphere = sphere;

      delete itemData.data["sphere"];
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }



    /*_onDragStart(event) {
      const li = event.currentTarget;

      if ( event.target.classList.contains("content-link") ) return;

      const data = this.getData().data.system;
      const aptitude = $(li)?.data("aptitude") || "";
      const spe = $(li)?.data("spe") === undefined ? false : $(li)?.data("spe");
      const wpn = $(li)?.data("wpn") || false;

      let label = game.i18n.localize(CONFIG.NAUTILUS.aptitudes[aptitude]);

      if(!wpn && spe !== false) label = data.aptitudes[aptitude].specialites[spe].name;
      else if(wpn !== false) label = this.actor.items.get(wpn).name;

      // Create drag data
      const dragData = {
        actorId: this.actor.id,
        sceneId: this.actor.isToken ? canvas.scene?.id : null,
        tokenId: this.actor.isToken ? this.actor.token.id : null,
        type:this.actor.type,
        aptitude:aptitude,
        specialite:spe,
        wpn:wpn,
        label:label,
      };

      // Set data transfer
      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }*/
}