import { stylingHTML } from "../helpers/common.mjs";

/**
 * @extends {ItemSheet}
 */
export class PouvoirItemSheet extends ItemSheet {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["prophecy", "sheet", "item", "pouvoir"],
        template: "systems/prophecy-2e/templates/pouvoir-item-sheet.html",
        width: 1050,
        height: 400,
        tabs: [{navSelector: ".tabs", contentSelector: ".body", initial: "description"}],
        dragDrop: [{dragSelector: ".draggable", dropSelector: null}],
      });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    getData() {
      const context = super.getData();

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
    }
  }