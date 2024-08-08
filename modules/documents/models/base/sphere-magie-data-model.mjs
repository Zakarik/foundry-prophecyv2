import { setSurcharge } from "../../../helpers/common.mjs";

export class SphereMagieDataModel extends foundry.abstract.DataModel {

	static defineSchema() {
		const { NumberField, SchemaField } = foundry.data.fields;
		let data = {
				reserve:new SchemaField({
					data:new SchemaField({
						base:new NumberField({ initial: 0, integer: true, nullable: false }),
						mod:new NumberField({ initial: 0, integer: true, nullable: false }),
						temp:new NumberField({ initial: 0, integer: true, nullable: false }),
						surcharge:new NumberField({ initial: null, integer: true, nullable: true }),
					}),
					value:new NumberField({ initial: 0, integer: true, nullable: false }),
					total:new NumberField({ initial: 0, integer: true, nullable: false }),
				}),
				data:new SchemaField({
					base:new NumberField({ initial: 0, integer: true, nullable: false }),
					evo:new NumberField({ initial: 0, integer: true, nullable: false }),
					mod:new NumberField({ initial: 0, integer: true, nullable: false }),
					temp:new NumberField({ initial: 0, integer: true, nullable: false }),
					surcharge:new NumberField({ initial: null, integer: true, nullable: true }),
				}),
				total:new NumberField({ initial: 0, integer: true, nullable: false }),
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

		total = setSurcharge(this.data.surcharge, this.data.base, this.data.mod, this.data.evo, this.data.temp);

		Object.defineProperty(this, 'total', {
			value:total,
		});

		Object.defineProperty(this.reserve.data, 'base', {
			value:this.total,
		});

		let totalReserve = 0;

		totalReserve = setSurcharge(this.reserve.data.surcharge, this.reserve.data.base, this.reserve.data.mod, this.reserve.data.temp);

		Object.defineProperty(this.reserve, 'total', {
			value:totalReserve,
		});

		if(this.reserve.value > totalReserve) {
			Object.defineProperty(this.reserve, 'value', {
				value:totalReserve,
			});
		}
	}
}