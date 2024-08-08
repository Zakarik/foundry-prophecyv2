import { commonHTML, generateDialog, loadContextEffects, loadHtmlEffets, loadEffectsClose, stylingHTML } from "../helpers/common.mjs";
/**
 * @extends {ItemSheet}
 */
export class CasteItemSheet extends ItemSheet {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["prophecy", "sheet", "item", "caste"],
        template: "systems/prophecy-2e/templates/caste-item-sheet.html",
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
      commonHTML(html, this.item, true)

      html.find('.addStatuts').click(async ev => {
        const item = this.item;
        const data = item.system.statuts;
        const list = Object.entries(data);

        list.push({
          num:list.length+1,
          check:list.length === 0 ? true : false,
          name:'',
          description:'',
        });

        const objectList = {};
        list.forEach((entry, index) => {
          objectList[index] = {
            num:entry.num,
            check: entry.check,
            name: entry.name,
            description: entry.description,
          };
        });

        let update = {}
        update[`system.statuts`] = objectList;

        await item.update(update);
      });

      html.find('.removeStatut').click(async ev => {
        const tgt = $(ev.currentTarget);
        const item = this.item;
        const num = tgt.data("num");
        const data = item.system.statuts;
        const name = data[num].name;
        const list = Object.entries(data).map(([cle, valeur]) => { return valeur; });
        let std = false;

        generateDialog({type:'delete', category:'Statut', name:name, validate:async (d) => {
            let update = {};
            update[`system.statuts.-=${list.length-1}`] = null;

            if(data[num].check) std = true;

            list.splice(num, 1);

            for(let i = 0;i < list.length;i++) {
              let check = list[i]?.check ?? false;

              if(i === 0 && !check) check = std;

              update[`system.statuts.${i}`] = {
                num:i+1,
                check: check,
                name: list[i]?.name ?? '',
                description: list[i]?.description ?? '',
              };
            }

            await item.update(update);
        }, render:(html) => {
          stylingHTML(html);
        }});
      });

      html.find('.checkStatuts').click(async ev => {
        const tgt = $(ev.currentTarget);
        const item = this.item;
        const num = tgt.data("num");
        const data = item.system.statuts;
        const list = Object.entries(data).map(([cle, valeur]) => { return valeur; });

        for(let l in list) {
          const d = list[l];

          if(l == num) d.check = true;
          else d.check = false;
        }

        const objectList = {};
        list.forEach((entry, index) => {
          objectList[index] = {
            num:entry.num,
            check: entry.check,
            name: entry.name,
            description: entry.description,
          };
        });

        let update = {}
        update[`system.statuts`] = objectList;

        await item.update(update);
      });
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