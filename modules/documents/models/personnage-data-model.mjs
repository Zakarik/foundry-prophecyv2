import { CaracteristiqueDataModel } from './base/caracteristique-data-model.mjs';
import { AttributsDataModel } from './base/attributs-data-model.mjs';
import { AttributsMineursDataModel } from './base/attributs-mineurs-data-model.mjs';
import { MagieDataModel } from './base/magie-data-model.mjs';

export class PersonnageDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {SchemaField, EmbeddedDataField, StringField, NumberField, BooleanField, ObjectField, ArrayField, HTMLField} = foundry.data.fields;

        let dataIdentite = {};
		let dataTendance = {};
		let dataCaracteristique = {};

		for(let d of CONFIG.PROPHECY.LIST.Identite) {
			if(d.type === 'string') dataIdentite[d.raw] = new StringField({initial:''});
			else if(d.type === 'number') dataIdentite[d.raw] = new NumberField({ initial: 6, integer: true, min:6, nullable: false });
		}

		for(let d of CONFIG.PROPHECY.LIST.Tendances) {
			dataTendance[d] = new SchemaField({
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
				value:new NumberField({ initial: 0, min: 0, integer: true, nullable: false}),
			});
		}
		const LIST = CONFIG.PROPHECY.LIST.Competences;

		let data = {};

		for(let c in LIST) {
			let attributs = {};

			for(let a in LIST[c]) {
				let competence = {};

				for(let comp in LIST[c][a]) {
					const label = LIST[c][a][comp];
					const openCompetence = CONFIG.PROPHECY.OpenCompetence?.[label] || false;

					competence[label] = {
						0:{
							data:{
								base:0,
								evo:0,
								mod:0,
								temp:0
							},
							specialization:null,
							raw:label,
							sublabel:'',
							total:0,
							domain:openCompetence,
						}
					};

				}

				const sortedCompetence = {};
				Object.keys(competence).sort((a, b) => game.i18n.localize(CONFIG.PROPHECY.Competences[competence[a][0].raw]).localeCompare(game.i18n.localize(CONFIG.PROPHECY.Competences[competence[b][0].raw]))).forEach(key => {
					sortedCompetence[key] = competence[key];
				});

				attributs[a] = sortedCompetence;
			}

			data[c] = attributs;
		}

		for(let c of CONFIG.PROPHECY.LIST.Caracteristiques) {
			dataCaracteristique[c] = new EmbeddedDataField(CaracteristiqueDataModel, {label:'test'});
		}

		return {
			experience:new NumberField({ initial: 0, integer: true, nullable: false }),
			catage: new NumberField({ initial: 1, integer: true, nullable: false }),
            identite: new SchemaField(dataIdentite),
            caracteristiques:new SchemaField(dataCaracteristique),
            attributs: new EmbeddedDataField(AttributsDataModel, {}),
			attributsmineurs: new EmbeddedDataField(AttributsMineursDataModel, {}),
			tendances: new SchemaField(dataTendance),
			competences: new ObjectField({initial:data}),
			bonuscompetences: new ObjectField(),
			combat: new SchemaField({
				protection:new NumberField({ initial: 0, integer: true, nullable: false }),
				encombrement:new NumberField({ initial: 0, integer: true, nullable: false }),
				wpnWear:new ArrayField(new StringField()),
				armorWear:new ArrayField(new StringField()),
			}),
			magie:new EmbeddedDataField(MagieDataModel, {}),
			lien: new SchemaField({
				name:new StringField({ initial: ""}),
				description:new HTMLField({ initial: ""}),
			}),
			equipement:new SchemaField({
				richesses:new SchemaField({
					dragon:new NumberField({ initial: 0, min:0, integer: true, nullable: false }),
					or:new NumberField({ initial: 0, min:0, integer: true, nullable: false }),
					argent:new NumberField({ initial: 0, min:0, integer: true, nullable: false }),
					bronze:new NumberField({ initial: 0, min:0, integer: true, nullable: false }),
					fer:new NumberField({ initial: 0, min:0, integer: true, nullable: false }),
				}),
			}),
			concept:new HTMLField({ initial: ""}),
		};
	}

	_initialize(options = {}) {
		super._initialize(options);

		this.prepareIdentite();
		this.prepareCaracteristiques();
	}

	get actor() {
		return this.parent;
	}

	get item() {
		return this.actor.items;
	}

	get initiative() {
		const init = this.attributsmineurs.initiative.total;

		let data = {
			total:init,
			list:[]
		};

		for(let i = 0;i < init;i++) {
			data.list.push(game.i18n.format("PROPHECY.ActionNumber", {number: i+1}));
		}

		return data;
	}

	get maitrise() {
		return this.attributsmineurs.maitrise.value;
	}

	get chance() {
		return this.attributsmineurs.chance.value;
	}

	get blessure() {
		return this.attributsmineurs.blessure.malus;
	}

	get maxTendances() {
		const t0 = this.tendances.dragon.value;
		const t1 = this.tendances.fatalite.value;
		const t2 = this.tendances.homme.value;

		const max = Math.max(t0, t1, t2);
		const maxValues = [];

		if (t0 === max) maxValues.push({
			label:'PROPHECY.TENDANCES.Dragon',
			key:'dragon',
			value:t0,
		});
		if (t1 === max) maxValues.push({
			label:'PROPHECY.TENDANCES.Fatalite',
			key:'fatalite',
			value:t1,
		});
		if (t2 === max) maxValues.push({
			label:'PROPHECY.TENDANCES.Homme',
			key:'homme',
			value:t2,
		});

		return maxValues;
	}

    static migrateData(source) {
		return source;
	}

	prepareBaseData() {
		this.attributsmineurs.prepareBaseData();
	}

	prepareDerivedData() {
		for(let c in this.caracteristiques) {
			this.caracteristiques[c].prepareData();
		}

		this.attributs.prepareData();
		this.attributsmineurs.prepareData();
		this.prepareCompetences();
		this.prepareCombat();
		this.magie.prepareData();
	}

	prepareCompetences() {
		const cmp = this.competences;
		const bonuscmp = this.bonuscompetences;

		for(let a in cmp) {
			for(let cat in cmp[a]) {
				for(let c in cmp[a][cat]) {
					const competence = cmp[a][cat][c];

					for(let l in competence) {
						const lComp = competence[l];
						const bonus = bonuscmp?.[a]?.[cat]?.[lComp.raw] ?? {};
						const totalMod = bonus?.add ?? 0;
						const totalSurcharge = bonus?.surcharge ?? false;
						const lSpe = lComp.specialization;

						if(!lComp.custom) lComp.label = game.i18n.localize(CONFIG.PROPHECY.Competences[lComp.raw]);

						Object.defineProperty(lComp.data, 'mod', {
							value: totalMod,
						});

						Object.defineProperty(lComp, 'total', {
							value: !totalSurcharge ? Math.max(lComp.data.base+lComp.data.evo+lComp.data.mod+lComp.data.temp, 0) : totalSurcharge,
						});

						for(let s in lSpe) {
							const spe = lSpe[s];

							Object.defineProperty(spe, 'total', {
								value: Math.max(spe.data.base+spe.data.evo+spe.data.mod+spe.data.temp, 0),
							});
						}
					}
				}
			}
		}
	}

	prepareIdentite() {
		const age = this.identite.age;
		let catage = 1;

		if(age >= 6 && age <= 10) catage = 1;
		else if(age >= 11 && age <= 15) catage = 2;
		else if(age >= 16 && age <= 40) catage = 3;
		else if(age >= 41 && age <= 50) catage = 4;
		else if(age >= 51) catage = 5;

		Object.defineProperty(this, 'catage', {
			value: catage,
		});
	}

	prepareCombat() {
		const caracteristiques = this.actor.system.caracteristiques;
		const items = this.item.toObject().filter(itm => (itm.type === 'protection' || itm.type === 'armement') && (itm.system.wear || itm.system.wearP || itm.system.wearS));
		let protection = 0;
		let encombrement = 0;

		for(let i of items) {
			const prerequis = i.system.prerequis;
			let canWear = true;
			let r = 0;

			for(let p in prerequis) {
				let total = caracteristiques[p].total;

				if(total < prerequis[p]) {
					r += 1;
				}
			}

			if(r >= 2) canWear = false;

			if(canWear && i.type === 'protection') {
				if(i.system.type === 'bouclier' && i.system.use === 'protection') protection += Math.max(parseInt(i.system.protection) - parseInt(i.system.usure), 0);
				else if(i.system.type !== 'bouclier') protection += Math.max(parseInt(i.system.protection) - parseInt(i.system.usure), 0);
				encombrement += parseInt(i.system.penalite);
			}
		}

		Object.defineProperty(this.combat, 'protection', {
			value: protection,
		});

		Object.defineProperty(this.combat, 'encombrement', {
			value: encombrement,
		});
	}

	prepareCaracteristiques() {
		const age = this.catage;

		for(let c in this.caracteristiques) {
			Object.defineProperty(this.caracteristiques[c].data, 'age', {
				value: CONFIG.PROPHECY.BaseCaracteristique[age][c],
			});
		}
	}
}