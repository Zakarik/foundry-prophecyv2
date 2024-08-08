// Import document classes.
import { ProphecyActor } from "./documents/actor.mjs";
import { ProphecyItem } from "./documents/item.mjs";

//Import Data Models
import { PersonnageDataModel } from "./documents/models/personnage-data-model.mjs";
import { EtoileDataModel } from "./documents/models/etoile-data-model.mjs";
import { AvDvDataModel } from "./documents/models/avdv-data-model.mjs";
import { CasteDataModel } from "./documents/models/caste-data-model.mjs";
import { ProtectionDataModel } from "./documents/models/protection-data-model.mjs";
import { ArmementDataModel } from "./documents/models/armement-data-model.mjs";
import { SortilegeDataModel } from "./documents/models/sortilege-data-model.mjs";
import { MaterielDataModel } from "./documents/models/materiel-data-model.mjs";
import { PouvoirDataModel } from "./documents/models/pouvoir-data-model.mjs";

// Import sheet classes.
import { PersonnageActorSheet } from "./sheets/personnage-actor-sheet.mjs";
import { EtoileActorSheet } from "./sheets/etoile-actor-sheet.mjs";
import { AvDvItemSheet } from "./sheets/avdv-item-sheet.mjs";
import { CasteItemSheet } from "./sheets/caste-item-sheet.mjs";
import { ProtectionItemSheet } from "./sheets/protection-item-sheet.mjs";
import { ArmementItemSheet } from "./sheets/armement-item-sheet.mjs";
import { SortilegeItemSheet } from "./sheets/sortilege-item-sheet.mjs";
import { MaterielItemSheet } from "./sheets/materiel-item-sheet.mjs";
import { PouvoirItemSheet } from "./sheets/pouvoir-item-sheet.mjs";

// Import helper/utility classes and constants.
import { registerHandlebars } from "./helpers/handlebars.mjs";
import { registerHooks } from "./helpers/hooks.mjs";
import { registerSettings } from "./helpers/settings.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { PROPHECY } from "./helpers/config.mjs";

// Import UI
import { ProphecyCombatTracker } from "./ui/combat-tracker.mjs";
import { ProphecyCombat } from "./ui/combat.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.prophecy = {
    applications: {
      PersonnageActorSheet,
      EtoileActorSheet,
    },
    documents:{
      ProphecyActor,
      ProphecyItem,
    },
  };

  // Add custom constants for configuration.
  CONFIG.PROPHECY = PROPHECY;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "0",
    decimals: 2
  };
  // Define custom Document classes
  CONFIG.Actor.documentClass = ProphecyActor;
  CONFIG.Item.documentClass = ProphecyItem;

  CONFIG.Actor.dataModels = {
    personnage:PersonnageDataModel,
    etoile:EtoileDataModel,
    pnj:PersonnageDataModel,
  };

  CONFIG.Item.dataModels = {
    avantage:AvDvDataModel,
    desavantage:AvDvDataModel,
    caste:CasteDataModel,
    protection:ProtectionDataModel,
    armement:ArmementDataModel,
    sortilege:SortilegeDataModel,
    materiel:MaterielDataModel,
    pouvoir:PouvoirDataModel,
  };
  CONFIG.ui.combat = ProphecyCombatTracker;
  CONFIG.Combat.documentClass = ProphecyCombat;

  // SETTINGS
  registerSettings();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  Actors.registerSheet("prophecy-2e", PersonnageActorSheet, {
    types: ["personnage", "pnj"],
    makeDefault: true
  });

  Actors.registerSheet("prophecy-2e", EtoileActorSheet, {
    types: ["etoile"],
    makeDefault: true
  });

  Items.registerSheet("prophecy-2e", AvDvItemSheet, {
    types: ["avantage", "desavantage"],
    makeDefault: true
  });

  Items.registerSheet("prophecy-2e", CasteItemSheet, {
    types: ["caste"],
    makeDefault: true
  });

  Items.registerSheet("prophecy-2e", ProtectionItemSheet, {
    types: ["protection"],
    makeDefault: true
  });

  Items.registerSheet("prophecy-2e", ArmementItemSheet, {
    types: ["armement"],
    makeDefault: true
  });

  Items.registerSheet("prophecy-2e", SortilegeItemSheet, {
    types: ["sortilege"],
    makeDefault: true
  });

  Items.registerSheet("prophecy-2e", MaterielItemSheet, {
    types: ["materiel"],
    makeDefault: true
  });

  Items.registerSheet("prophecy-2e", PouvoirItemSheet, {
    types: ["pouvoir"],
    makeDefault: true
  });

  registerHandlebars();
  registerHooks();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  Hooks.on("hotbarDrop", (bar, data, slot) => createMacro(bar, data, slot));
});

/*async function createMacro(bar, data, slot) {
  // Create the macro command

  const type = data.type;
  const label = data.label;
  const actorId = data.actorId;
  const wpnId = data.wpn;
  const aptitude = data.aptitude;
  const specialite = data.specialite;
  const command = type === 'vaisseaux' ? `game.nautilus.RollVaisseauxMacro("${actorId}", "${aptitude}", "${specialite}", "${wpnId}");` : `game.nautilus.RollPersonnageMacro("${actorId}", "${aptitude}", "${specialite}", "${wpnId}");`;

  let img = "";


  if(wpnId !== false) img = game.actors.get(actorId).items.get(wpnId).img;
  else if(specialite !== false) img = "systems/nautilus/assets/icons/dices.svg";

  let macro = await Macro.create({
    name: label,
    type: "script",
    img: img,
    command: command,
    flags: { "nautilus.attributMacro": true }
  });
  game.user.assignHotbarMacro(macro, slot);
  return false;
}*/