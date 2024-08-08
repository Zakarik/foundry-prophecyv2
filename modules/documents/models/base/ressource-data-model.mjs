export class RessourceDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
		const { SchemaField, NumberField, BooleanField } = foundry.data.fields;
		return {
			data: new SchemaField({
				base:new NumberField({ initial: 0, min: 0, integer: true, nullable: false}),
				mod:new NumberField({ initial: 0, integer: true, nullable: false}),
				temp:new NumberField({ initial: 0, integer: true, nullable: false}),
			}),
			value:new NumberField({ initial: 0, min: 0, integer: true, nullable: false}),
			max:new NumberField({ initial: 0, min: 0, integer: true, nullable: false})
		};
	}
}