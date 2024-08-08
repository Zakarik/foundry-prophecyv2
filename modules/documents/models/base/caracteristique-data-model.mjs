import { setSurcharge } from "../../../helpers/common.mjs";

export class CaracteristiqueDataModel extends foundry.abstract.DataModel {

	static defineSchema() {
		const { NumberField, SchemaField } = foundry.data.fields;
		let data = {
			data:new SchemaField({
				base:new NumberField({ initial: 0, min: 0, integer: true, nullable: false}),
				age:new NumberField({ initial: 0, integer: true, nullable: false}),
				evo:new NumberField({ initial: 0, integer: true, nullable: true}),
				mod:new NumberField({ initial: 0, integer: true, nullable: false}),
				temp:new NumberField({ initial: 0, integer: true, nullable: false}),
				surcharge:new NumberField({ initial: null, integer: true, nullable: true}),
			}),
			total: new NumberField({ initial: 0, integer: true, nullable: false}),
		};

		return data;
	}

	get actor() {
		return this.parent;
	}


	_initialize(options = {}) {
		super._initialize(options);

	}

	prepareData() {
		let total = 0;

		total = setSurcharge(this.data.surcharge, this.data.base, this.data.age, this.data.mod, this.data.evo, this.data.temp);

		Object.defineProperty(this, 'total', {
			value:Math.max(total, 0),
		});
	}
}