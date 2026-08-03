const BLESSURE_ORDER = ['egratinures', 'legeres', 'graves', 'fatales', 'morts'];

const BLESSURE_DEFAULTS = {
	egratinures: {
		label: 'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Egratinure',
		max: 10,
	},
	legeres: {
		label: 'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Legere',
		max: 20,
	},
	graves: {
		label: 'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Grave',
		max: 30,
	},
	fatales: {
		label: 'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Fatale',
		max: 40,
	},
	morts: {
		label: 'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Mort',
		max: null,
	},
};

function duplicateData(data) {
	return foundry.utils.deepClone(data);
}

function createExtendedThreshold(type, value = 0, check = {}) {
	const defaults = BLESSURE_DEFAULTS[type];

	return {
		label: defaults.label,
		max: defaults.max,
		value,
		check: duplicateData(check ?? {}),
	};
}

function createExtendedData() {
	const data = {};

	for(const type of BLESSURE_ORDER) {
		data[type] = createExtendedThreshold(type);
	}

	return data;
}

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
			etendu: new BooleanField({ initial: false}),
			extended: new ObjectField({ initial: createExtendedData() }),
			malus: new NumberField({ initial: 0, integer: true, nullable: false}),
		};
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

	get actor() {
		return this.parent.parent;
	}

	get isExtended() {
		return this.actor.actor.type === 'pnj' && this.etendu;
	}

	get displayData() {
		return this.getDisplayData();
	}

	getExtendedThreshold(type) {
		if(!this.extended?.[type]) this.extended[type] = createExtendedThreshold(type);

		const threshold = this.extended[type];
		const data = this.data[type];
		const label = threshold.label || BLESSURE_DEFAULTS[type].label;
		const max = threshold.max === '' || threshold.max === undefined ? BLESSURE_DEFAULTS[type].max : threshold.max;

		threshold.label = label;
		threshold.max = max;
		threshold.value = Number.isInteger(threshold.value) ? threshold.value : (data?.value ?? 0);
		threshold.check = duplicateData(threshold.check ?? data?.check ?? {});

		return threshold;
	}

	getThresholdData(type) {
		return this.isExtended ? this.getExtendedThreshold(type) : this.data[type];
	}

	prepareExtendedData() {
		if(!this.extended) this.extended = createExtendedData();

		for(const type of BLESSURE_ORDER) {
			const threshold = this.getExtendedThreshold(type);
			threshold.value = Number.isInteger(threshold.value) ? Math.max(threshold.value, 0) : 0;
			threshold.max = threshold.max === null || threshold.max === '' ? null : parseInt(threshold.max);
			threshold.check = this.prepareThresholdCheck(threshold.check, threshold.value);
		}
	}

	prepareThresholdCheck(currentCheck = {}, value = 0) {
		let prepared = {};

		for(let i = 1;i <= value;i++) {
			prepared[`c${i}`] = currentCheck?.[`c${i}`] ?? false;
		}

		return prepared;
	}

	getThresholdLabel(type) {
		if(this.isExtended) {
			const label = this.getExtendedThreshold(type).label;
			return label?.startsWith('PROPHECY.') ? game.i18n.localize(label) : label;
		}

		return game.i18n.localize(CONFIG.PROPHECY.Blessures[type]);
	}

	getDisplayData() {
		const entries = [];
		let start = 1;

		for(const type of BLESSURE_ORDER) {
			const threshold = this.getThresholdData(type);
			const value = threshold?.value ?? 0;
			const visible = !this.isExtended || value > 0;

			if(!visible) continue;

			const entry = {
				type,
				value,
				check: threshold.check ?? {},
				label: this.getThresholdLabel(type),
				range: this.isExtended ? this.getExtendedRange(type, start) : CONFIG.PROPHECY.SeuilsBlessures[type],
			};

			entries.push(entry);

			if(this.isExtended) {
				const max = this.getExtendedThreshold(type).max;

				if(Number.isInteger(max)) start = max + 1;
			}
		}

		return entries;
	}

	getExtendedRange(type, start) {
		const threshold = this.getExtendedThreshold(type);
		const visibleTypes = BLESSURE_ORDER.filter(currentType => (this.getThresholdData(currentType)?.value ?? 0) > 0);
		const isLastVisible = visibleTypes[visibleTypes.length - 1] === type;
		const max = threshold.max;

		if(isLastVisible) {
			return `(${start}+)`;
		}

		if(Number.isInteger(max) && max >= start) {
			return `(${start} - ${max})`;
		}

		return `(${start}+)`;
	}

	getThresholdTypeFromDamage(totaldmg) {
		if(!this.isExtended) {
			if(totaldmg <= 10) return 'egratinures';
			if(totaldmg <= 20) return 'legeres';
			if(totaldmg <= 30) return 'graves';
			if(totaldmg <= 40) return 'fatales';
			return 'morts';
		}

		const visibleTypes = BLESSURE_ORDER.filter(type => (this.getThresholdData(type)?.value ?? 0) > 0);

		if(visibleTypes.length === 0) return 'morts';

		for(const type of visibleTypes) {
			const max = this.getExtendedThreshold(type).max;

			if(!Number.isInteger(max)) return type;
			if(totaldmg <= max) return type;
		}

		return visibleTypes[visibleTypes.length - 1];
	}

	findNextAvailableThreshold(startType = 'egratinures') {
		let currentType = startType;

		while(currentType !== 'end') {
			const data = this.getThresholdData(currentType);
			const numCheck = Object.values(data.check ?? {}).filter(value => value === true).length;

			if(numCheck < (data?.value ?? 0)) {
				return {
					type: currentType,
					check: `c${numCheck + 1}`,
				};
			}

			currentType = {
				egratinures: 'legeres',
				legeres: 'graves',
				graves: 'fatales',
				fatales: 'morts',
				morts: 'end',
			}[currentType];
		}

		return null;
	}

	getUpdatePath(type, field, suffix = '') {
		const prefix = this.isExtended ? `system.attributsmineurs.blessure.extended.${type}` : `system.attributsmineurs.blessure.data.${type}`;
		return `${prefix}.${field}${suffix}`;
	}

	prepareData() {
		const actor = this.actor;
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
		this.prepareExtendedData();
		this.prepareMalus();
	}

	prepareCheck() {
		for(const type of BLESSURE_ORDER) {
			this.data[type].check = this.prepareThresholdCheck(this.data[type].check, this.data[type].value);
		}
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