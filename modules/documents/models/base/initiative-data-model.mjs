import { setSurcharge } from "../../../helpers/common.mjs";

export class InitiativeDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
		const { SchemaField, NumberField, BooleanField } = foundry.data.fields;
		return {
			data: new SchemaField({
				base:new NumberField({ initial: 0, min: 0, integer: true, nullable: false}),
				mod:new NumberField({ initial: 0, integer: true, nullable: false}),
				temp:new NumberField({ initial: 0, integer: true, nullable: false}),
				surcharge:new NumberField({ initial: null, integer: true, nullable: true}),
			}),
			total: new NumberField({ initial: 0, integer: true, nullable: false})
		};
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

	prepareData() {
		const actor = this.parent.parent;
		const coo = actor.caracteristiques.coordination.total;
		const per = actor.caracteristiques.perception.total;
		const totalCOOPER = coo+per;
		let base = 0;
		let total = 0;

		if(totalCOOPER <= 5) base = 1;
		else if(totalCOOPER >= 6 && totalCOOPER <= 9) base = 2;
		else if(totalCOOPER >= 10 && totalCOOPER <= 13) base = 3;
		else if(totalCOOPER >= 14 && totalCOOPER <= 16) base = 4;
		else if(totalCOOPER >= 17) base = 5;

		Object.defineProperty(this.data, 'base', {
			value: base,
		});

		total = setSurcharge(this.data.surcharge, this.data.base, this.data.mod, this.data.temp);

		Object.defineProperty(this, 'total', {
			value: total,
		});

	}
}