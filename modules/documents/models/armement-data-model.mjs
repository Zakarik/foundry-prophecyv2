import { setActivateEffect } from "../../helpers/common.mjs";
import { SchemaCreator } from '../../helpers/common-models.mjs';
import { setSurcharge } from "../../helpers/common.mjs";

export class ArmementDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {BooleanField} = foundry.data.fields;
		let data = {
			notPrerequis: new BooleanField({initial:false, nullable:false}),
			malusPrerequis: new BooleanField({initial:false, nullable:false}),
		};

		let sc = new SchemaCreator(data);
		sc.addWpn();
		sc.addItm();

		return data;
	}

	get actor() {
		return this.parent.actor;
	}

	get item() {
		return this.parent;
	}

	get effectsItem() {
		return this.item.effects;
	}

	get satisfyPrerequis() {
		let r = 0;

		if(this.actor !== null) {
			const caracteristiques = this.actor.system.caracteristiques;
			const prerequis = this.prerequis;

			for(let p in prerequis) {
				let total = setSurcharge(caracteristiques[p].data.surcharge,
					caracteristiques[p].data.base,
					caracteristiques[p].data.evo,
					caracteristiques[p].data.mod,
					caracteristiques[p].data.temp);

				if(total < prerequis[p]) {
					r += 1;
				}
			}
		}

		return r;
	}

	get isWeared() {
		let result = false;
		const wear = this.wear || false;
		const wearS = this.wearS || false;
		const wearP = this.wearP || false;

		if(wear || wearS || wearP) result = true;

		return result;
	}

	setActiveUnactiveEffects() {
		const item = this.item;
		const effects = this.effectsItem.contents[0];

		if(effects === null || effects === undefined) return;
		const isDisabled = effects.disabled;
		const wear = this.isWeared;

		if(wear && isDisabled && this.satisfyPrerequis < 2) setActivateEffect(item, effects._id, false);
		else if((!wear || this.satisfyPrerequis >= 2) && !isDisabled) setActivateEffect(item, effects._id, true);
	}

	prepareBaseData() {}

	prepareDerivedData() {
		this.dommages.prepareData();

		if(this.satisfyPrerequis >= 2) {
			Object.defineProperty(this, 'notPrerequis', {
				value: true,
			});
		} else {
			Object.defineProperty(this, 'notPrerequis', {
				value: false,
			});
		}

		if(this.satisfyPrerequis >= 1) {
			Object.defineProperty(this, 'malusPrerequis', {
				value: true,
			});
		} else {
			Object.defineProperty(this, 'malusPrerequis', {
				value: false,
			});
		}

		this.setActiveUnactiveEffects();
	}
}