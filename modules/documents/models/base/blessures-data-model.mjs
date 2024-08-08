export class BlessureDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
		const { SchemaField, NumberField, ObjectField, BooleanField } = foundry.data.fields;
		return {
			data:new SchemaField({
				egratinures: new SchemaField({
					check:new ObjectField(),
					value:new NumberField({ initial: 0, integer: true, nullable: false}),
				}),
				legeres: new SchemaField({
					check:new ObjectField(),
					value:new NumberField({ initial: 0, integer: true, nullable: false}),
				}),
				graves: new SchemaField({
					check:new ObjectField(),
					value:new NumberField({ initial: 0, integer: true, nullable: false}),
				}),
				fatales: new SchemaField({
					check:new ObjectField(),
					value:new NumberField({ initial: 0, integer: true, nullable: false}),
				}),
				morts: new SchemaField({
					check:new ObjectField(),
					value:new NumberField({ initial: 0, integer: true, nullable: false}),
				}),
			}),
			edit: new BooleanField({ initial: false}),
			malus: new NumberField({ initial: 0, integer: true, nullable: false}),
		};
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

	prepareData() {
		const actor = this.parent.parent;
		const res = actor.caracteristiques.resistance.total;
		const vol = actor.caracteristiques.volonte.total;
		const totalRESVOL = res+vol;
		let egratinure = 0;
		let legere = 0;
		let grave = 0;
		let fatale = 0;
		let mort = 0;

		if(totalRESVOL >= 20) {
			egratinure = 3;
			legere = 4;
			grave = 3;
			fatale = 2;
			mort = 1;
		} else if(totalRESVOL >= 15 && totalRESVOL <= 19) {
			egratinure = 3;
			legere = 3;
			grave = 2;
			fatale = 2;
			mort = 1;
		} else if(totalRESVOL >= 10 && totalRESVOL <= 14) {
			egratinure = 3;
			legere = 2;
			grave = 2;
			fatale = 1;
			mort = 1;
		} else if(totalRESVOL >= 5 && totalRESVOL <= 9) {
			egratinure = 3;
			legere = 2;
			grave = 1;
			fatale = 1;
			mort = 1;
		} else if(totalRESVOL <= 4) {
			egratinure = 2;
			legere = 1;
			grave = 1;
			fatale = 1;
			mort = 1;
		}

		if(((!this.edit || this.edit) && actor.actor.type !== 'pnj') || (!this.edit && actor.actor.type === 'pnj')) {
			Object.defineProperty(this.data.egratinures, 'value', {
				value: egratinure,
			});

			Object.defineProperty(this.data.legeres, 'value', {
				value: legere,
			});

			Object.defineProperty(this.data.graves, 'value', {
				value: grave,
			});

			Object.defineProperty(this.data.fatales, 'value', {
				value: fatale,
			});

			Object.defineProperty(this.data.morts, 'value', {
				value: mort,
			});

		}

		this.prepareCheck();
		this.prepareMalus();
	}

	prepareCheck() {
		const egratinures = this.data.egratinures;
		const legeres = this.data.legeres;
		const graves = this.data.graves;
		const fatales = this.data.fatales;
		const morts = this.data.morts;
		let eg = {};
		let le = {};
		let gr = {};
		let fa = {};
		let mo = {};

		for(let i = 1;i <= egratinures.value;i++) {
			eg[`c${i}`] = egratinures.check?.[`c${i}`] ?? false;
		}

		for(let i = 1;i <= legeres.value;i++) {
			le[`c${i}`] = legeres.check?.[`c${i}`] ?? false;
		}

		for(let i = 1;i <= graves.value;i++) {
			gr[`c${i}`] = graves.check?.[`c${i}`] ?? false;
		}

		for(let i = 1;i <= fatales.value;i++) {
			fa[`c${i}`] = fatales.check?.[`c${i}`] ?? false;
		}

		for(let i = 1;i <= morts.value;i++) {
			mo[`c${i}`] = morts.check?.[`c${i}`] ?? false;
		}

		this.data.egratinures.check = eg;
		this.data.legeres.check = le;
		this.data.graves.check = gr;
		this.data.fatales.check = fa;
		this.data.morts.check = mo;
	}

	prepareMalus() {
		const legeres = Object.values(this.data.legeres.check).filter(value => value === true).length;
		const graves = Object.values(this.data.graves.check).filter(value => value === true).length;
		const fatales = Object.values(this.data.fatales.check).filter(value => value === true).length;
		let malus = 0;

		if(fatales > 0) malus = -5;
		else if(graves > 0) malus = -3;
		else if(legeres > 0) malus = -1;

		this.malus = malus;
	}
}