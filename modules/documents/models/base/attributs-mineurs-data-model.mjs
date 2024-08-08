import { RessourceDataModel } from './ressource-data-model.mjs';
import { InitiativeDataModel } from './initiative-data-model.mjs';
import { BlessureDataModel } from './blessures-data-model.mjs';
import { RenommeeDataModel } from './renommee-data-model.mjs';
import { PROPHECY } from '../../../helpers/config.mjs';

export class AttributsMineursDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
		const { EmbeddedDataField } = foundry.data.fields;
		let data = {
			chance:new EmbeddedDataField(RessourceDataModel, {}),
			maitrise:new EmbeddedDataField(RessourceDataModel, {}),
			initiative:new EmbeddedDataField(InitiativeDataModel, {}),
			renommee:new EmbeddedDataField(RenommeeDataModel, {}),
			blessure:new EmbeddedDataField(BlessureDataModel, {}),
		};

		return data;
	}

	get actor() {
		return this.parent;
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

	prepareBaseData() {
		const age = this.actor.catage;

		Object.defineProperty(this.chance.data, 'base', {
			value:PROPHECY.BaseChance[age],
		});

		Object.defineProperty(this.chance, 'max', {
			value:Math.min(this.chance.data.base+this.chance.data.mod+this.chance.data.temp, 10),
		});

		Object.defineProperty(this.maitrise.data, 'base', {
			value:PROPHECY.BaseMaitrise[age],
		});

		Object.defineProperty(this.maitrise, 'max', {
			value:Math.min(this.maitrise.data.base+this.maitrise.data.mod+this.maitrise.data.temp, 10),
		});

	}

	prepareData() {

		if(this.chance.value > this.chance.max) {
			Object.defineProperty(this.chance, 'value', {
				value:this.chance.max,
			});
		}

		if(this.maitrise.value > this.maitrise.max) {
			Object.defineProperty(this.maitrise, 'value', {
				value:this.maitrise.max,
			});
		}

		this.initiative.prepareData();
		this.blessure.prepareData();
		this.renommee.prepareData();
	}
}