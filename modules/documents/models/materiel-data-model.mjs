import { SchemaCreator } from '../../helpers/common-models.mjs';

export class MaterielDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {} = foundry.data.fields;
		let data = {};
		let sc = new SchemaCreator(data);
		sc.addItm();

		return data;
	}

	prepareBaseData() {}

	prepareDerivedData() {}
}