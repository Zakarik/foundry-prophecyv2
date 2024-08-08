import { PROPHECY } from './config.mjs';

export const registerHandlebars = function() {
    Handlebars.registerHelper('translate', function(...args) {
        let result = CONFIG.PROPHECY;

        args.forEach(arg => {
            if(result[arg] !== undefined) result = result[arg];
        });

        return result;
    });

    Handlebars.registerHelper('threeUppercase', function(str) {
        if (str && str.length >= 3) {
            return str.substring(0, 3).toUpperCase() + str.substring(3);
        }
        return str ? str.toUpperCase() : '';
    });

    Handlebars.registerHelper('sanitizeTxt', function(str) {
        return str;
    });

    Handlebars.registerHelper('min', function(value, min) {
        return Math.max(value, min);
    });

    Handlebars.registerHelper('isEffectActive', function(item) {
        const effects = item.effects[0];
        let result = true;

        if(effects) {
            if(effects.disabled) result = false;
        }

        return result;
    });

    Handlebars.registerHelper('isEffectExist', function(item) {
        const effects = item.effects[0];
        let result = false;

        if(effects) {
            if(effects.changes.length > 0) result = true;
        }

        return result;
    });

    Handlebars.registerHelper('searchData', function(where, path) {
        const split = typeof path === 'string' ? path.split('.') : path['string'].split('.');
        let result = where;

        split.forEach(arg => {
            if(result[arg] !== undefined) result = result[arg];
        });

        return result;
    });

    Handlebars.registerHelper('sanitizeChanges', function(changes) {
        for(let l of PROPHECY.LIST.toSanitiz) {
            if(changes.includes(l.key) && (changes.includes(l.add) || changes.includes(l.surcharge))) {
                changes = changes.split('.');
                changes.pop();
                changes = changes.join('.');
            }
        }

        return changes;
    });

    Handlebars.registerHelper('isNull', function(value) {
        let result = false;

        if(value === null) result = true;

        return result;
    });

    Handlebars.registerHelper('sum', function(...args) {
        let result = 0;

        args.forEach(arg => {
            const parsedArg = parseInt(arg);
            if (!isNaN(parsedArg)) {
                result += parsedArg;
            }
        });

        return result;
    });
}