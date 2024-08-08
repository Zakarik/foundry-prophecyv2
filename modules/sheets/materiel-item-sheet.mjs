import { commonHTML, loadContextEffects, loadHtmlEffets, loadEffectsClose, stylingHTML } from "../helpers/common.mjs";

/**
 * @extends {ItemSheet}
 */
export class MaterielItemSheet extends ItemSheet {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["prophecy", "sheet", "item", "materiel"],
        template: "systems/prophecy-2e/templates/materiel-item-sheet.html",
        width: 1050,
        height: 600,
        tabs: [{navSelector: ".tabs", contentSelector: ".body", initial: "description"}],
        dragDrop: [{dragSelector: ".draggable", dropSelector: null}],
      });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    getData() {
      const context = super.getData();

      context.item.TypeArme = CONFIG.PROPHECY.TypeWpn;
      context.item.Mains = CONFIG.PROPHECY.Mains;
      context.item.Caracteristiques = CONFIG.PROPHECY.Caracteristiques;
      loadContextEffects(context);
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

      // Everything below here is only needed if the sheet is editable
      if ( !this.isEditable ) return;

      loadHtmlEffets(this.item, html);
      commonHTML(html, this.item, true);

      html.find('div.prerequis input').blur(ev => {
        const tgt = $(ev.currentTarget);
        const attr = tgt.attr('name');
        const itm = this.item;
        const wear = itm.system.wear;
        const prerequis = itm.system.prerequis;
        const actor = this.actor;
        let result = true;

        if(actor === null) return;

        const caracteristiques = actor.system.caracteristiques;
        let n = 0;

        for(let p in prerequis) {
          let cValue = attr.includes(p) ? tgt.val() : prerequis[p];

          if(caracteristiques[p].total < cValue) {
            n++;
          }
        }
      });

      html.find('select.mains').change(ev => {
        const tgt = $(ev.currentTarget);
        const value = tgt.val();
        const actor = this.item.actor;
        const isWeared = this.item.system.wear;
        const id = this.item._id;

        if(actor === null || !isWeared) return;

        if(value === '2mains') {
          let weared = actor.system.combat.wpnWear;

          if(weared.length === 2) {
            if(weared[0] !== id) {
              const oldItm = actor.items.get(weared[0]);

              weared = weared.filter(itm => itm !== weared[0]);

              weared.push(id);
              actor.update({['system.combat.wpnWear']:weared});
              oldItm.update({['system.wear']:false});
            } else if(weared[1] !== id) {
              const oldItm = actor.items.get(weared[1]);

              weared = weared.filter(itm => itm !== weared[1]);

              weared.push(id);
              actor.update({['system.combat.wpnWear']:weared});
              oldItm.update({['system.wear']:false});
            } else {
              weared.push(id);
              actor.update({['system.combat.wpnWear']:weared});
            }
          } else if(weared.length === 1) {
            if(weared[0] !== id) {
              const oldItm = actor.items.get(weared[0]);

              weared = weared.filter(itm => itm !== weared[0]);

              weared.push(id);
              actor.update({['system.combat.wpnWear']:weared});
              oldItm.update({['system.wear']:false});
            } else {
              weared.push(id);
              actor.update({['system.combat.wpnWear']:weared});
            }
          }
        } else if(value === '1main') {
          let weared = actor.system.combat.wpnWear;
          const length = weared.filter(itm => itm === id).length;

          if(length === 2) {
            weared.shift();
            actor.update({['system.combat.wpnWear']:weared});
          }
        }
      });

      /*html.find('.item-create').click(this._onItemCreate.bind(this));

      html.find('.item-edit').click(ev => {
        const header = $(ev.currentTarget).parents(".summary");
        const item = this.actor.items.get(header.data("item-id"));

        item.sheet.render(true);
      });

      html.find('.item-delete').click(async ev => {
        const header = $(ev.currentTarget).parents(".summary");
        const item = this.actor.items.get(header.data("item-id"));

        item.delete();
        header.slideUp(200, () => this.render(false));
      });*/
    }


    /** @inheritdoc */
    async close(options={}) {
      loadEffectsClose(this.item);

      await super.close(options);
      delete this.object.apps?.[this.appId];
    }

    /*async _onDropItemCreate(itemData) {
      itemData = itemData instanceof Array ? itemData : [itemData];
      const itemBaseType = itemData[0].type;

      return this.actor.createEmbeddedDocuments("Item", itemData);
    }

    async _onItemCreate(event) {
      event.preventDefault();
      const header = event.currentTarget;
      // Get the type of item to create.
      const type = header.dataset.type;
      // Grab any data associated with this control.
      const data = duplicate(header.dataset);
      // Initialize a default name.
      const name = `${game.i18n.localize(`TYPES.Item.${type}`)}`;
      // Prepare the item object.
      const itemData = {
        name: name,
        type: type,
        data: data,
        img: {
          "distance": "systems/nautilus/assets/icons/distance.svg",
          "melee": "systems/nautilus/assets/icons/melee.svg",
          "equipement": "systems/nautilus/assets/icons/equipement.svg",
        }[type]
      };

      // Remove the type from the dataset since it's in the itemData.type prop.
      delete itemData.data["type"];

      // Finally, create the item!
      return await Item.create(itemData, {parent: this.actor});
    }

    _onDragStart(event) {
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