export class SortilegeDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {HTMLField, StringField, NumberField} = foundry.data.fields;

		return {
			effets: new HTMLField({ initial: ""}),
			discipline: new StringField({ initial: 'instinctive', blank: false, choices: ['instinctive', 'invocatoire', 'sorcellerie'] }),
			sphere: new StringField({ initial: 'pierre', blank: false, choices: ['pierre', 'feu', 'oceans', 'metal', 'nature', 'reves', 'cite', 'vents', 'ombre']}),
			cout: new NumberField({ initial: 0, min:0, nullable:false}),
			difficulte: new NumberField({ initial: 0, min:0, nullable:false}),
			complexite: new NumberField({ initial: 0, min:0, nullable:false}),
			temps: new StringField({ initial: ''}),
			cles: new StringField({ initial: ''}),
		};
	}

	prepareBaseData() {}

	prepareDerivedData() {}
}