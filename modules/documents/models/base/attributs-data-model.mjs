import { AttributDataModel } from './attribut-data-model.mjs';
import { PROPHECY } from '../../../helpers/config.mjs';
import { setSurcharge } from "../../../helpers/common.mjs";

export class AttributsDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
		const { EmbeddedDataField } = foundry.data.fields;
		let data = {};

		for(let c of Object.keys(PROPHECY.LIST.Attributs)) {
			data[c] = new EmbeddedDataField(AttributDataModel, {});
		}

		return data;
	}

	get actor() {
		return this.parent;
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

	prepareData() {
		for(let c of Object.keys(PROPHECY.LIST.Attributs)) {
			const derived = PROPHECY.LIST.Attributs[c];
			let base = 0;
			let car = 0;
			let total = 0;

			for(let v of derived) {
				base += this.actor.caracteristiques[v].total;
			}

			if(base >= 20) car = 5;
			else if(base === 19 || base === 18) car = 4;
			else if(base === 16 || base === 17) car = 3;
			else if(base === 14 || base === 15) car = 2;
			else if(base === 12 || base === 13) car = 1;
			else if(base === 9 || base === 10 || base === 11) car = 0;
			else if(base === 6 || base === 7 || base === 8) car = -1;
			else if(base === 3 || base === 4 || base === 5) car = -2;
			else if(base === 1 || base === 2) car = -1;
			else if(base <= 0) car = null;

			Object.defineProperty(this[c].data, 'car', {
				value:car,
			});

			total = setSurcharge(this[c].data.surcharge, this[c].data.base,this[c].data.car,this[c].data.mod,this[c].data.temp);

			Object.defineProperty(this[c], 'total', {
				value:total,
			});
		};
	}
}