import { loadContextEffects, loadHtmlEffets, loadEffectsClose, stylingHTML } from "../helpers/common.mjs";

/**
 * @extends {ItemSheet}
 */
export class AvDvItemSheet extends ItemSheet {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["prophecy", "sheet", "item", "avdv"],
        template: "systems/prophecy-2e/templates/avdv-item-sheet.html",
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