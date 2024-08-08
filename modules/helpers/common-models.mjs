import { PROPHECY } from './config.mjs';
import { DamageDataModel } from '../documents/models/base/damage-data-model.mjs';

const {HTMLField, NumberField, SchemaField, BooleanField, StringField, EmbeddedDataField} = foundry.data.fields;

export class SchemaCreator {
    constructor(data) {
        this.data = data;
    }

    addCaracteristique(data=null) {
        let otherData = data === null ? this.data : data;

        for(let c of PROPHECY.LIST.Caracteristiques) {
			otherData[c] = new NumberField({initial:0, min:0, nullable:false});
		}
    }

    addPrerequis(data=null) {
        let otherData = data === null ? this.data : data;
        let subData = {};

        this.addCaracteristique(subData);

        otherData['prerequis'] = new SchemaField(subData);
    }

    addArtisanat(data=null) {
        let otherData = data === null ? this.data : data;

        otherData['artisanat'] = new SchemaField({
            dc: new StringField({ initial: '', blank: true }),
            tc: new StringField({ initial: '', blank: true }),
        });
    }

    addDmg(data=null) {
        let otherData = data === null ? this.data : data;

        otherData['dommages'] = new EmbeddedDataField(DamageDataModel, {});
    }

    addWpn(data=null) {
        let otherData = data === null ? this.data : data;

        this.addPrerequis(otherData);

        otherData['wearP'] = new BooleanField({initial:false});
        otherData['wearS'] = new BooleanField({initial:false});

        otherData['initiative'] = new SchemaField({
            m:new StringField({ initial: 'NA', nullable: false }),
            cc:new StringField({ initial: 'NA', nullable: false }),
        });

        otherData['type'] = new StringField({ initial: '', blank: true, choices: PROPHECY.LIST.TypeWpn });
        otherData['mains'] = new StringField({ initial: '1main', blank: false, choices: ['1main', '2mains'] });
        otherData['portee'] = new StringField({ initial: '', blank: true });

        this.addDmg(otherData);
    }

    addItm(data=null) {
        let otherData = data === null ? this.data : data;

        this.addArtisanat(otherData);

        otherData['description'] = new HTMLField({ initial: ""});
        otherData['cout'] = new StringField({ initial: "", nullable:false});
        otherData['poids'] = new StringField({ initial: '', blank: true });
    }
}