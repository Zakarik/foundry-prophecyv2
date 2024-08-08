import toggler from '../helpers/toggler.js';
import { commonHTML, stylingHTML } from "../helpers/common.mjs";

/**
 * @extends {ActorSheet}
 */
export class EtoileActorSheet extends ActorSheet {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["prophecy", "sheet", "actor", "etoile"],
        template: "systems/prophecy-2e/templates/etoile-actor-sheet.html",
        width: 1050,
        height: 600,
        tabs: [
          {navSelector: ".tabs", contentSelector: ".body", initial: "principal"},
        ],
        dragDrop: [{dragSelector: ".draggable", dropSelector: null}],
      });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    getData() {
      const context = super.getData();
      this._prepareCharacterItems(context);
      this._prepareCompagnons(context);

      const guide = Object.values(context.data.system.compagnons).find(itm => itm.guide);
      const archiviste = Object.values(context.data.system.compagnons).find(itm => itm.archiviste);
      const main = Object.values(context.data.system.compagnons).find(itm => itm.main);
      const disparus = Object.values(context.data.system.compagnons).filter(itm => itm.disparu);

      context.actor.motivations = CONFIG.PROPHECY.Motivations;
      context.actor.canGuide = guide ? false : true;
      context.actor.canArchiviste = archiviste ? false : true;
      context.actor.canMain = main ? false : true;

      context.actor.guide = guide;
      context.actor.archiviste = archiviste;
      context.actor.main = main;
      context.actor.disparus = disparus;
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
      stylingHTML(html);

      toggler.init(this.id, html);

      // Everything below here is only needed if the sheet is editable
      if ( !this.isEditable ) return;

      commonHTML(html, this.actor, false, false, false, true);

      html.find('.motivation input[type=checkbox]').change(async ev => {
        const tgt = $(ev.currentTarget);
        const header = tgt.parents(".check");
        const type = header.data('type');
        const value = parseInt(tgt.data('value').replace('c', ''));
        const isChecked = tgt.is(":checked");
        let update = {};

        if(isChecked) {
          for(let i = 1;i < value;i++) {
            update[`system.motivations.${type}.check.c${i}`] = true;
          }
        } else {
          for(let i = value+1;i < 11;i++) {
            update[`system.motivations.${type}.check.c${i}`] = false;
          }
        }

        await this.actor.update(update);
      });

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

      html.find('.addcmp').click(ev => {
        const compagnons = this.actor.system.compagnons;
        const valeurMax = Object.values(compagnons).reduce((max, current) => Math.max(max, current.key), 0) + 1;

        this.actor.update({[`system.compagnons.${valeurMax}`]:{
          id:'custom',
          name:'',
          key:valeurMax
        }})
      });

      html.find('.addguide').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.${key}.guide`]:true});
      });

      html.find('.addarchiviste').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.${key}.archiviste`]:true});
      });

      html.find('.addmain').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.${key}.main`]:true});
      });

      html.find('.adddeath').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.${key}.disparu`]:true});
      });

      html.find('.deleteguide').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.${key}.guide`]:false});
      });

      html.find('.deletearchiviste').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.${key}.archiviste`]:false});
      });

      html.find('.deletemain').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.${key}.main`]:false});
      });

      html.find('.deletedeath').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.${key}.disparu`]:false});
      });

      html.find('.deletecmp').click(ev => {
        const header = $(ev.currentTarget).parents(".line");
        const key = header.data('key');

        this.actor.update({[`system.compagnons.-=${key}`]:null});
      });
    }

    async _onDropItemCreate(itemData) {

      itemData = itemData instanceof Array ? itemData : [itemData];
      const itemBaseType = itemData[0].type;

      if(itemBaseType !== 'pouvoir') return;

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

    _prepareCharacterItems(context) {
      const actor = context.actor;
      const items = context.items;
      const pouvoirs = [];

      for(let i of items) {
        const type = i.type;

        switch(type) {
          case 'pouvoir':
            pouvoirs.push(i);
            break;
        }
      }

      actor.pouvoirs = pouvoirs;
    }

    async _onDropActor(event, data) {
      if ( !this.actor.isOwner ) return false;

      const cls = getDocumentClass(data?.type);
      const document = await cls.fromDropData(data);
      const type = document.type;

      if(type === 'personnage') {
        const compagnons = this.actor.system.compagnons;
        const list = Object.values(compagnons);
        const valeurMax = Object.values(compagnons).reduce((max, current) => Math.max(max, current.key), 0) + 1;
        const exist = list.find(itm => itm.id === document.id);

        if(!exist) {
          this.actor.update({[`system.compagnons.${valeurMax}`]:{
            id:document.id,
            name:document.name,
            key:valeurMax
          }});
        }
      }
    }

    _prepareCompagnons(context) {
      for(let c of Object.values(context.data.system.compagnons)) {
        if(c.id !== 'custom') {
          const actor = game.actors.get(c.id);

          if(actor) c.name = actor.name;
          else this.actor.update({[`system.compagnons.-=${c.key}`]:null});
        }
      }
    }
}