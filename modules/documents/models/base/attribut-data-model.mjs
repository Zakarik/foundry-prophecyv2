import { setSurcharge } from "../../../helpers/common.mjs";

export class AttributDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
		const { SchemaField, NumberField, BooleanField } = foundry.data.fields;
		return {
			data: new SchemaField({
				base:new NumberField({ initial: 0, min: 0, integer: true, nullable: false}),
				car:new NumberField({ initial: 0, integer: true, nullable: true}),
				mod:new NumberField({ initial: 0, integer: true, nullable: false}),
				temp:new NumberField({ initial: 0, integer: true, nullable: false}),
				surcharge:new NumberField({ initial: null, integer: true, nullable: true}),
			}),
			total: new NumberField({ initial: 0, integer: true, nullable: false})
		};
	}

	_initialize(options = {}) {
		super._initialize(options);

		let total = setSurcharge(this.data.surcharge, this.data.base, this.data.car, this.data.mod, this.data.temp)

		Object.defineProperty(this, 'total', {
			value:total,
		});
	}
}