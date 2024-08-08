export class AvDvDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {HTMLField, NumberField} = foundry.data.fields;

		return {
			cout: new NumberField({ initial: 0, integer: true, nullable: false }),
			description: new HTMLField({ initial: ""}),
		};
	}

	prepareBaseData() {}

	prepareDerivedData() {}
}