import { SphereMagieDataModel } from './sphere-magie-data-model.mjs';
import { DisciplineMagieDataModel } from './discipline-magie-data-model.mjs';
import { PROPHECY } from '../../../helpers/config.mjs';
import { setSurcharge } from "../../../helpers/common.mjs";

export class MagieDataModel extends foundry.abstract.DataModel {

	static defineSchema() {
		const { NumberField, SchemaField, EmbeddedDataField } = foundry.data.fields;
		let spheres = {};
		let disciplines = {}

		for(let s of PROPHECY.LIST.Spheres) {
			spheres[s] = new EmbeddedDataField(SphereMagieDataModel, {});
		}

		for(let s of PROPHECY.LIST.Disciplines) {
			disciplines[s] = new EmbeddedDataField(DisciplineMagieDataModel, {});
		}

		let data = {
			disciplines:new SchemaField(disciplines),
			spheres:new SchemaField(spheres),
			reserve: new SchemaField({
				data:new SchemaField({
					base:new NumberField({ initial: 0, integer: true, nullable: false }),
					mod:new NumberField({ initial: 0, integer: true, nullable: false }),
					evo:new NumberField({ initial: 0, integer: true, nullable: false }),
					temp:new NumberField({ initial: 0, integer: true, nullable: false }),
					surcharge:new NumberField({ initial: null, integer: true, nullable: true }),
				}),
				value:new NumberField({ initial: 0, integer: true, nullable: false }),
				total:new NumberField({ initial: 0, integer: true, nullable: false })
			})
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
		const actor = this.actor;
		const reserve = this.reserve;

		for(let d in this.disciplines) {
			this.disciplines[d].prepareData();
		}

		Object.defineProperty(this.reserve.data, 'base', {
			value:actor.caracteristiques.volonte.total,
		});

		let totalReserve = 0;

		totalReserve = setSurcharge(reserve.data.surcharge, reserve.data.base, reserve.data.mod, reserve.data.evo, reserve.data.temp);

		Object.defineProperty(this.reserve, 'total', {
			value:totalReserve,
		});

		if(reserve.value > totalReserve) {
			Object.defineProperty(this.reserve, 'value', {
				value:totalReserve,
			});
		}

		for(let s in this.spheres) {
			this.spheres[s].prepareData();
		}
	}
}