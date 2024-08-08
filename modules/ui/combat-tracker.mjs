/**
 * @property {FUCombat} viewed
 */
export class ProphecyCombatTracker extends CombatTracker {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/prophecy-2e/templates/ui/combat-tracker.html",
			classes: [...super.defaultOptions.classes, 'prophecy-combat-tracker'],
		});
	}

  async getData(options = {}) {
		  const data = await super.getData(options);

      if(data.combat) {
        const turn = this.viewed.round === 0 ? 1 : this.viewed.round;

        for(let t of data.turns) {
          const c = data.combat.combatants.get(t.id);
          if(turn !== undefined) {
            const flag = c.getFlag('prophecy-2e', 'initiative')?.[turn] ?? undefined;

            if(flag !== undefined) {
              t.other = flag.other;
              t.current = flag.current;
            }
          }

          data.turns?.forEach((turn, index) => {
            if (index === 0) {
              turn.css = 'active';
              turn.activate = true;
            } else {
              turn.css = '';
              turn.activate = false;
            }
          });
        }
      }

		return data;
	}

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    const tracker = html.find("#combat-tracker");
    const tknImage = tracker.find(".combatant .token-image");
    const tknName = tracker.find(".combatant .token-name");
    const tknRsrc = tracker.find(".combatant .token-name");

    html.find(".token-initiative span.initiative.owner").click(async ev => {
      const btn = ev.currentTarget;
      const tgt = $(ev.currentTarget);
      const value = tgt.data('value');
      const li = btn.closest(".combatant");
      const combat = this.viewed;
      const chatRollMode = game.settings.get("core", "rollMode");
      let next = true;
      if(combat.round === 0) return;

      const combatants = combat.combatants;
      const c = combatants.get(li.dataset.combatantId);
      const rMode = c.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode;
      let update = {};

      update['initiative'] = this._setInitiative(c, ev);
      await c.update(update);

      let chatData = foundry.utils.mergeObject({
        user:game.user.id,
        type:CONST.CHAT_MESSAGE_TYPES.OTHER,
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
            type:CONST.CHAT_MESSAGE_TYPES.OTHER,
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
    });

    html.find(".token-other span.initiative.owner").click(async ev => {
      const btn = $(ev.currentTarget);
      const value = btn.data('value');
      const li = btn.closest(".combatant");
      const combat = this.viewed;
      const chatRollMode = game.settings.get("core", "rollMode");
      if(combat.round === 0) return;

      const combatants = combat.combatants;
      const c = combatants.get(li.data('combatantId'));
      const rMode = c.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode;

      let chatData = foundry.utils.mergeObject({
        user:game.user.id,
        type:CONST.CHAT_MESSAGE_TYPES.OTHER,
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

      this._setInitiative(c, ev);
    });

    tknImage.click(this._onCombatantMouseDown.bind(this));
    tknName.click(this._onCombatantMouseDown.bind(this));
    tknRsrc.click(this._onCombatantMouseDown.bind(this));

    html.find("span.initiative.owner").mouseenter(async ev => {
      const rnd = this.viewed.round;

      if(rnd === 0) return;

      const tgt = $(ev.currentTarget);
      tgt.toggleClass('hover');
    });

    html.find("span.initiative.owner").mouseleave(async ev => {
      const rnd = this.viewed.round;

      if(rnd === 0) return;

      const tgt = $(ev.currentTarget);
      tgt.toggleClass('hover');
    });
  }

  async _onCombatantControl(event) {
      event.preventDefault();
      event.stopPropagation();
      const btn = event.currentTarget;
      const li = btn.closest(".combatant");
      const combat = this.viewed;
      const c = combat.combatants.get(li.dataset.combatantId);

      // Switch control action
      switch (btn.dataset.control) {

        // Toggle combatant visibility
        case "toggleHidden":
          return c.update({hidden: !c.hidden});

        // Toggle combatant defeated flag
        case "toggleDefeated":
          return this._onToggleDefeatedStatus(c);

        // Roll combatant initiative
        case "rollInitiative":
          const initiative = await combat.rollInitiative([c.id]);
          return initiative;

        // Actively ping the Combatant
        case "pingCombatant":
          return this._onPingCombatant(c);
      }
  }

  _setInitiative(combatant, event) {
    const tgt = $(event.currentTarget);
    const index = tgt.data('index');
    const value = tgt.data('value');
    const rnd = this.viewed.round;
    const order = this.viewed.getFlag('prophecy-2e', 'order');
    const rndExist = order?.[rnd] ?? undefined
    let flag = combatant.getFlag('prophecy-2e', 'initiative');
    let currentTurn = flag?.[rnd] ?? undefined;

    if(index === 'current') {
      let current = -999;
      let cIndex = 0;

      for(let i = 0; i < currentTurn.other.length; i++) {
        if(currentTurn.other[i].value > current) {
          current = currentTurn.other[i];
          cIndex = i;
        }
      }

      if(current !== -999 && current !== null) currentTurn.other.splice(cIndex, 1);

      currentTurn.used.push(currentTurn.current);
      currentTurn.current = current;
    } else {
      currentTurn.used.push(currentTurn.other[index]);
      currentTurn.other.splice(index, 1);
    }

    combatant.setFlag('prophecy-2e', 'initiative', flag);

    if(!order || !rndExist) this.viewed.setFlag('prophecy-2e', 'order', {
      [rnd]:[combatant.id]
    });
    else {
      order[rnd].push(combatant.id);

      this.viewed.setFlag('prophecy-2e', 'order', order);
    }

    return combatant.getFlag('prophecy-2e', 'initiative')?.[rnd]?.current?.value ?? null;
  }

  /**
 * Handle mouse-down event on a combatant name in the tracker
 * @param {Event} event   The originating mousedown event
 * @returns {Promise}     A Promise that resolves once the pan is complete
 * @private
 */
  async _onCombatantMouseDown(event) {
    event.preventDefault();

    const clicked = event.currentTarget;
    if($(clicked).hasClass('combatant')) return;
    const li = $(event.currentTarget).parents('.combatant');

    const combatant = this.viewed.combatants.get(li.data('combatantId'));
    const token = combatant.token;
    if ( !combatant.actor?.testUserPermission(game.user, "OBSERVER") ) return;
    const now = Date.now();

    // Handle double-left click to open sheet
    const dt = now - this._clickTime;
    this._clickTime = now;
    if ( dt <= 250 ) return combatant.actor?.sheet.render(true);

    // Control and pan to Token object
    if ( token?.object ) {
      token.object?.control({releaseOthers: true});
      return canvas.animatePan(token.object.center);
    }
  }

  /**
   * Get the Combatant entry context options
   * @returns {object[]}   The Combatant entry context options
   * @private
   */
  _getEntryContextOptions() {
    return [
      {
        name: "COMBAT.CombatantClear",
        icon: '<i class="fas fa-undo"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          return Number.isNumeric(combatant?.initiative);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));

          if ( combatant ) {
            const round = this.viewed.round;
            const rnd = round === 0 ? 1 : round;
            let flag = combatant.getFlag('prophecy-2e', 'initiative');
            let crt = flag?.[rnd] ?? undefined;

            if(crt !== undefined) {
              flag[rnd] = null;

              combatant.setFlag('prophecy-2e', 'initiative', flag);
            }

            return combatant.update({initiative: null});
          }
        }
      },
      {
        name: "COMBAT.CombatantReroll",
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return this.viewed.rollInitiative([combatant.id]);
        }
      },
      {
        name: "COMBAT.CombatantRemove",
        icon: '<i class="fas fa-trash"></i>',
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant.delete();
        }
      }
    ];
  }
}
