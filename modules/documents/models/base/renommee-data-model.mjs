import { setSurcharge } from "../../../helpers/common.mjs";

export class RenommeeDataModel extends foundry.abstract.DataModel {
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
		let total = 0;

		total = setSurcharge(this.data.surcharge, this.data.base, this.data.mod, this.data.temp);

		Object.defineProperty(this, 'total', {
			value: total,
		});
	}
}