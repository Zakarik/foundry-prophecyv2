export class EtoileDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {NumberField, BooleanField, ArrayField, StringField, ObjectField, SchemaField} = foundry.data.fields;
		let dataMotivations = {};

		for(let d of CONFIG.PROPHECY.LIST.Motivations) {
			dataMotivations[d] = new SchemaField({
				check:new SchemaField({
					c1:new BooleanField({ initial:false }),
					c2:new BooleanField({ initial:false }),
					c3:new BooleanField({ initial:false }),
					c4:new BooleanField({ initial:false }),
					c5:new BooleanField({ initial:false }),
					c6:new BooleanField({ initial:false }),
					c7:new BooleanField({ initial:false }),
					c8:new BooleanField({ initial:false }),
					c9:new BooleanField({ initial:false }),
					c10:new BooleanField({ initial:false }),
				}),
				name:new StringField({initial:''}),
				value:new NumberField({initial:0, min:0, max:10, integer: true, nullable: false })
			});
		}

		let data = {
			experience:new NumberField({ initial: 0, integer: true, nullable: false }),
			motivations: new SchemaField(dataMotivations),
			eclat:new NumberField({initial:1, min:1, max:10}),
			envergure:new NumberField({initial:0, min:0, integer: true, nullable: false }),
			compagnons:new ObjectField(),
			pouvoirs:new ObjectField(),
		};

		return data;
	}

    _initialize(options = {}) {
		super._initialize(options);
	}

	prepareBaseData() {
		const motivations = this.motivations;
		let less = null;

		for(let m in motivations) {
			if(!less) less = motivations[m].value;
			else if(motivations[m].value < less) less = motivations[m].value;
		}

		Object.defineProperty(this, 'eclat', {
			value: less,
		});
	}
}