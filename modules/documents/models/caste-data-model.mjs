export class CasteDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {HTMLField, ObjectField, SchemaField, StringField} = foundry.data.fields;

		return {
			description: new HTMLField({ initial: ""}),
			mentalite: new HTMLField({ initial: ""}),
			organisation: new HTMLField({ initial: ""}),
			carriere: new HTMLField({ initial: ""}),
			interdits: new HTMLField({ initial: ""}),
			privileges: new ObjectField(),
			annexes: new ObjectField(),
			statuts: new ObjectField(),
		};
	}

	prepareBaseData() {}

	prepareDerivedData() {}
}