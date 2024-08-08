import { setSurcharge } from "../../../helpers/common.mjs";

export class DamageDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
		const { SchemaField, NumberField, BooleanField, StringField } = foundry.data.fields;
		return {
			data: new SchemaField({
				caracteristique:new SchemaField({
					base:new StringField({ initial: 'force', blank: true, choices: CONFIG.PROPHECY.LIST.Caracteristiques }),
					multi:new NumberField({ initial: 1, nullable: false }),
				}),
				bonus:new NumberField({ initial: 0, nullable: false }),
				dice:new StringField({ initial: '1D10', nullable: false }),
			}),
			total:new StringField({ initial: '0', nullable: false }),
			label:new StringField({ initial: '0', nullable: false }),
			howToApply:new StringField({ initial: 'normal', blank: true, choices: CONFIG.PROPHECY.LIST.APPLYDMG }),
		};
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

	get actor() {
		return this.parent.actor;
	}

	prepareData() {
		if(this.actor === null) return;

		const caracteristiques = this.actor.system.caracteristiques;

		let caracteristique = 0;
		let bonus = 0;
		let dice = '';
		let result = '';
		let label = '';

		if(caracteristiques[this.data.caracteristique.base].total*this.data.caracteristique.multi !== '') {
			caracteristique += setSurcharge(caracteristiques[this.data.caracteristique.base].data.surcharge,
				caracteristiques[this.data.caracteristique.base].data.base,
				caracteristiques[this.data.caracteristique.base].data.evo,
				caracteristiques[this.data.caracteristique.base].data.mod,
				caracteristiques[this.data.caracteristique.base].data.temp)*this.data.caracteristique.multi;
		}

		if(this.data.bonus !== 0) bonus += this.data.bonus;
		if(this.data.dice !== '') dice = this.data.dice;

		if(caracteristique !== 0) {
			result = caracteristique;
			label = `${caracteristique} (${game.i18n.localize(CONFIG.PROPHECY.Caracteristiques[this.data.caracteristique.base])})`;
		}

		if(bonus !== 0 && result !== '') {
			result = `${result}+${bonus}`;
			label = `${label} + ${bonus}`;
		}
		else if(bonus !== 0) {
			result = bonus;
			label = bonus;
		}

		if(dice !== '' && result !== '') {
			result = `${result}+${dice}`;
			label = `${label} + ${dice}`;
		}
		else if(dice !== '') {
			result = dice;
			label = dice;
		}

		Object.defineProperty(this, 'total', {
			value:`${result}`,
		});

		Object.defineProperty(this, 'label', {
			value:`${label}`,
		});
	}
}