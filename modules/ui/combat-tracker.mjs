/**
 * @property {FUCombat} viewed
 */
export class ProphecyCombatTracker extends CombatTracker {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      tokenInitiative: ProphecyCombatTracker.#tokenInitiative,
      tokenOther: ProphecyCombatTracker.#tokenOther,
    }
  };

  /** @override */
  static PARTS = {
    ...super.PARTS, // hérite des parts parents (header, tracker, footer)
    tracker: {
      template: "systems/prophecy-2e/templates/ui/combat-tracker.hbs",
      scrollable: [""]
    },
    footer: {
      template: "systems/prophecy-2e/templates/ui/combat-footer.hbs",
    }
  };

  /**
   * Prepare render context for a single entry in the combat tracker.
   * @param {Combat} combat        The active combat.
   * @param {Combatant} combatant  The Combatant whose turn is being prepared.
   * @param {number} index         The index of this entry in the turn order.
   * @returns {Promise<object>}
   * @protected
   */
  async _prepareTurnContext(combat, combatant, index) {
    const turn = await super._prepareTurnContext(combat, combatant, index);

    // En préparation (round 0), les dés sont stockés dans le round 1.
    const rnd = combat?.round || 1;
    const flag = combatant.getFlag("prophecy-2e", "initiative")?.[rnd];

    if (flag) {
      turn.current = flag.current;
      turn.other = flag.other;
    }

    const { initiative } = combatant;
    turn.hasDecimals = Number.isFinite(initiative) && Number.isInteger(initiative);

    return turn;
  }

  /* -------------------------------------------- */
  /** @inheritDoc */
  _attachFrameListeners() {
    super._attachFrameListeners();

    this.element.addEventListener("mouseenter", event => {
      const target = event.target.closest("span.initiative.owner");
      if (!target) return;

      const rnd = this.viewed.round;
      if (rnd === 0) return;

      target.classList.toggle("hover");
    }, { passive: true, capture: true });

    this.element.addEventListener("mouseleave", event => {
      const target = event.target.closest("span.initiative.owner");
      if (!target) return;

      const rnd = this.viewed.round;
      if (rnd === 0) return;

      target.classList.toggle("hover");
    }, { passive: true, capture: true });
  }

  static async #tokenInitiative(ev) {
    const { combatantId } = ev.target.closest("[data-combatant-id]")?.dataset ?? {};
    const combat = this.viewed;
    const chatRollMode = game.settings.get("core", "rollMode");
    let next = true;
    if(combat.round === 0) return;

    const combatants = combat.combatants;
    const c = combatants.get(combatantId);
    const value = c.initiative;
    const rMode = c.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode;
    let update = {};

    update['initiative'] = await this._setInitiative(combat, c, ev);
    await c.update(update);

    let chatData = foundry.utils.mergeObject({
      user:game.user.id,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      speaker: ChatMessage.getSpeaker({
        actor: c.actor,
        token: c.token,
        alias: c.name
    }),
      content:await renderTemplate('systems/prophecy-2e/templates/roll/initiative.html', {
          formula:game.i18n.format("PROPHECY.ROLL.UseAction", {number: value}),
      }),
    });

    ChatMessage.applyRollMode(chatData, rMode);

    const msg = await ChatMessage.create(chatData, {
      rollMode:rMode,
    });

    for(let cbt of combatants) {
      if(cbt.initiative !== null) next = false;
    }

    if(next) {
        const fn = combat['nextRound'];
        await fn.bind(combat)();

        let chatData = foundry.utils.mergeObject({
          user:game.user.id,
          style: CONST.CHAT_MESSAGE_STYLES.OTHER,
          speaker: ChatMessage.getSpeaker({
            actor: null,
            token: null,
            alias: game.i18n.localize('PROPHECY.ROLL.System')
        }),
          content:await renderTemplate('systems/prophecy-2e/templates/roll/initiative.html', {
              formula:game.i18n.localize('PROPHECY.ROLL.NextTurn'),
          }),
        });

        const msg = await ChatMessage.create(chatData);
    }
  }

  static async #tokenOther(ev) {
    const { combatantId } = ev.target.closest("[data-combatant-id]")?.dataset ?? {};
    const combat = this.viewed;
    const combatants = combat.combatants;
    const c = combatants.get(combatantId);
    const value = $(ev.target).data('value');
    const chatRollMode = game.settings.get("core", "rollMode");
    if(combat.round === 0) return;

    const rMode = c.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode;

    let chatData = foundry.utils.mergeObject({
      user:game.user.id,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      speaker: ChatMessage.getSpeaker({
        actor: c.actor,
        token: c.token,
        alias: c.name
      }),
      content:await renderTemplate('systems/prophecy-2e/templates/roll/initiative.html', {
          formula:game.i18n.format("PROPHECY.ROLL.UseAction", {number: value}),
      }),
    });

    ChatMessage.applyRollMode(chatData, rMode);

    const msg = await ChatMessage.create(chatData, {
      rollMode:rMode,
    });

    await this._setInitiative(combat, c, ev);
  }

  async _setInitiative(combat, combatant, ev) {
    const { index } = ev.target.closest("[data-index]")?.dataset ?? {};
    const value = combatant.initiative;
    const rnd = combat.round;
    const order = combat.getFlag('prophecy-2e', 'order');
    const rndExist = order?.[rnd] ?? undefined
    let flag = combatant.getFlag('prophecy-2e', 'initiative');
    let currentTurn = flag?.[rnd] ?? undefined;
    if(index === 'current') {
      let current = -999;
      let currentOther = null;
      let cIndex = 0;

      for(let i = 0; i < currentTurn.other.length; i++) {
        if(currentTurn.other[i].value > current) {
          current = currentTurn.other[i].value;
          currentOther = currentTurn.other[i];
          cIndex = i;
        }
      }

      if(current !== -999 && current !== null) currentTurn.other.splice(cIndex, 1);

      currentTurn.used.push(currentTurn.current);
      currentTurn.current = currentOther ?? current;
    } else {
      currentTurn.used.push(currentTurn.other[index]);
      currentTurn.other.splice(index, 1);
    }

    await combatant.setFlag('prophecy-2e', 'initiative', flag);

    if(!order || !rndExist) await combat.setFlag('prophecy-2e', 'order', {
      [rnd]:[combatant.id]
    });
    else {
      order[rnd].push(combatant.id);

      await combat.setFlag('prophecy-2e', 'order', order);
    }

    return combatant.getFlag('prophecy-2e', 'initiative')?.[rnd]?.current?.value ?? null;
  }

  /**
   * Get the Combatant entry context options
   * @returns {object[]}   The Combatant entry context options
   * @private
   */
  _getEntryContextOptions() {
    const context = super._getEntryContextOptions();
    const clear = context.find(itm => itm.label === 'COMBATANT.ACTIONS.Clear' || itm.name === 'COMBATANT.ACTIONS.Clear');
    const getCombatant = li => this.viewed.combatants.get(li.dataset.combatantId);

    if (clear) {
      clear.onClick = async (event, li) => {
        const combatant = getCombatant(li);
        if (!combatant) return;

        const round = this.viewed.round;
        const rnd = round === 0 ? 1 : round;
        let flag = combatant.getFlag('prophecy-2e', 'initiative');
        let crt = flag?.[rnd] ?? undefined;

        if(crt !== undefined) {
          flag[rnd] = null;

          await combatant.setFlag('prophecy-2e', 'initiative', flag);
        }

        return combatant.update({initiative: null});
      };
    }

    return context;
  }
}
