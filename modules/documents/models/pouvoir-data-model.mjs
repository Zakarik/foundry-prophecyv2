import { SchemaCreator } from '../../helpers/common-models.mjs';

export class PouvoirDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {HTMLField} = foundry.data.fields;

		return {
			description: new HTMLField({ initial: ""}),
		};
	}

	prepareBaseData() {}

	prepareDerivedData() {}
}