export const PROPHECY = {};

PROPHECY.LIST = {
    Identite:[{
        raw:'augure',
        type:'string',
    },
    {
        raw:'age',
        type:'number',
        min:6
    },
    {
        raw:'taille',
        type:'string'
    },
    {
        raw:'poids',
        type:'string',
    },
    {
        raw:'pays',
        type:'string',
    }],
    Caracteristiques:['force', 'resistance', 'intelligence', 'volonte', 'coordination', 'perception', 'presence', 'empathie'],
    Attributs:{
        'physique':['force', 'resistance'],
        'mental':['intelligence', 'volonte'],
        'manuel':['perception', 'coordination'],
        'social':['empathie', 'presence'],
    },
    AttributsMineurs:{
        Jauge:['chance', 'maitrise'],
        Score:['initiative', 'renommee'],
    },
    Tendances:['fatalite', 'dragon', 'homme'],
    Motivations:['vertu', 'penchant', 'ideal', 'interdit', 'epreuve', 'destinee'],
    Competences:{
        'physique':{
            'combat':['armescontondantes', 'armesdhast', 'armesdoubles', 'armesarticulees', 'armestranchantes', 'armesdechoc', 'armesdejet', 'bouclier', 'corpsacorps'],
            'mouvement':['acrobatie', 'athletisme', 'equitation', 'escalade', 'esquive', 'natation'],
        },
        'mental':{
            'theorie':['castes', 'connaissancedelamagie', 'connaissancedesanimaux', 'connaissancedesdragons', 'geographie', 'histoire', 'lois', 'orientation', 'strategie'],
            'pratique':['alchimie', 'astrologie', 'cartographie', 'estimation', 'herboristerie', 'lireetecrire', 'matierespremieres', 'medecine', 'premierssoins', 'survie', 'vieencite'],
        },
        'manuel':{
            'technique':['armesdesiege', 'artisanat', 'contrefacon', 'discretion', 'pieges', 'pister'],
            'manipulation':['armesaprojectiles', 'armesmecaniques', 'attelages', 'deverouillage', 'deguisement', 'donartistique', 'jeu', 'jongler', 'fairelespoches'],
        },
        'social':{
            'communication':['baratin', 'conte', 'eloquence', 'marchandage', 'psychologie'],
            'influence':['artdelascene', 'commandement', 'diplomatie', 'dressage', 'intimidation', 'seduction'],
        },
    },
    TypeWpn:['tranchante', 'choc', 'contondante', 'articulee', 'double', 'corpsacorps', 'hast', 'jet', 'projectile', 'mecanique'],
    Spheres:['pierre', 'feu', 'oceans', 'metal', 'nature', 'reves', 'cite', 'vents', 'ombre'],
    Disciplines:['instinctive', 'invocatoire', 'sorcellerie'],
    toSanitiz:[
        {
            key:'.bonuscompetences.',
            add:'add',
            surcharge:'surcharge'
        },
        {
            key:'.caracteristiques.',
            add:'mod',
            surcharge:'surcharge'
        },
        {
            key:'.attributs.',
            add:'mod',
            surcharge:'surcharge'
        },
        {
            key:'.initiative.',
            add:'mod',
            surcharge:'surcharge'
        },
        {
            key:'.magie.disciplines.',
            add:'mod',
            surcharge:'surcharge'
        },
        {
            key:'.magie.reserve.',
            add:'mod',
            surcharge:'surcharge'
        },
        {
            key:'.magie.spheres.',
            other:['.pierre.data', '.feu.data', '.oceans.data', '.metal.data', '.nature.data', '.reves.data', '.cite.data', '.vents.data', '.ombre.data'],
            add:'mod',
            surcharge:'surcharge'
        },
        {
            key:'.magie.spheres.',
            other:['.reserve.data'],
            add:'mod',
            surcharge:'surcharge'
        },
    ],
    howToApply:['normal', 'divide', 'none']
}

PROPHECY.Caracteristiques = {
    'force':'PROPHECY.CARACTERISTIQUES.Force',
    'intelligence':'PROPHECY.CARACTERISTIQUES.Intelligence',
    'resistance':'PROPHECY.CARACTERISTIQUES.Resistance',
    'volonte':'PROPHECY.CARACTERISTIQUES.Volonte',
    'coordination':'PROPHECY.CARACTERISTIQUES.Coordination',
    'perception':'PROPHECY.CARACTERISTIQUES.Perception',
    'presence':'PROPHECY.CARACTERISTIQUES.Presence',
    'empathie':'PROPHECY.CARACTERISTIQUES.Empathie',
};

PROPHECY.Attributs = {
    'physique':'PROPHECY.ATTRIBUTS.Physique',
    'mental':'PROPHECY.ATTRIBUTS.Mental',
    'manuel':'PROPHECY.ATTRIBUTS.Manuel',
    'social':'PROPHECY.ATTRIBUTS.Social',
};

PROPHECY.AttributsMineurs = {
    'chance':'PROPHECY.ATTRIBUTSMINEURS.Chance',
    'maitrise':'PROPHECY.ATTRIBUTSMINEURS.Maitrise',
    'initiative':'PROPHECY.ATTRIBUTSMINEURS.Initiative',
    'renommee':'PROPHECY.ATTRIBUTSMINEURS.Renommee',
};

PROPHECY.Tendances = {
    "dragon":'PROPHECY.TENDANCES.Dragon',
    "homme":'PROPHECY.TENDANCES.Homme',
    "fatalite":'PROPHECY.TENDANCES.Fatalite',
};

PROPHECY.Modes = {
    [CONST.ACTIVE_EFFECT_MODES.ADD]:'PROPHECY.Modificateur',
    [CONST.ACTIVE_EFFECT_MODES.OVERRIDE]:'PROPHECY.Surcharge'
};

PROPHECY.Dialog = {
    1:'age',
};

PROPHECY.CatAge = {
    1:'PROPHECY.CATAGE.Enfant',
    2:'PROPHECY.CATAGE.Adolescent',
    3:'PROPHECY.CATAGE.Adulte',
    4:'PROPHECY.CATAGE.Ancien',
    5:'PROPHECY.CATAGE.Venerable',
};

PROPHECY.BaseChance = {
    1:4,
    2:2,
    3:0,
    4:0,
    5:0
};

PROPHECY.BaseMaitrise = {
    1:0,
    2:0,
    3:0,
    4:2,
    5:4
};

PROPHECY.BaseCaracteristique = {
    1:{
        'force':-2,
        'resistance':-2,
        'intelligence':0,
        'volonte':0,
        'perception':1,
        'coordination':0,
        'empathie':2,
        'presence':1,
    },
    2:{
        'force':-1,
        'resistance':-1,
        'intelligence':0,
        'volonte':0,
        'perception':1,
        'coordination':0,
        'empathie':1,
        'presence':0,
    },
    3:{
        'force':0,
        'resistance':0,
        'intelligence':0,
        'volonte':0,
        'perception':0,
        'coordination':0,
        'empathie':0,
        'presence':0,
    },
    4:{
        'force':-1,
        'resistance':-1,
        'intelligence':1,
        'volonte':1,
        'perception':-1,
        'coordination':0,
        'empathie':0,
        'presence':1,
    },
    5:{
        'force':-2,
        'resistance':-1,
        'intelligence':1,
        'volonte':1,
        'perception':-1,
        'coordination':-1,
        'empathie':1,
        'presence':1,
    },
};

PROPHECY.Competences = {
    "acrobatie": "PROPHECY.COMPETENCES.Acrobatie",
    "alchimie": "PROPHECY.COMPETENCES.Alchimie",
    "armesaprojectiles": "PROPHECY.COMPETENCES.ArmesProjectiles",
    "armescontondantes": "PROPHECY.COMPETENCES.ArmesContondantes",
    "armesdesiege": "PROPHECY.COMPETENCES.ArmesSiege",
    "armesdhast": "PROPHECY.COMPETENCES.ArmesHast",
    "armesdoubles": "PROPHECY.COMPETENCES.ArmesDoubles",
    "armesarticulees": "PROPHECY.COMPETENCES.ArmesArticulees",
    "armestranchantes": "PROPHECY.COMPETENCES.ArmesTranchantes",
    "armesmecaniques": "PROPHECY.COMPETENCES.ArmesMecaniques",
    "armesdejet": "PROPHECY.COMPETENCES.ArmesJet",
    "armesdechoc": "PROPHECY.COMPETENCES.ArmesChoc",
    "artdelascene": "PROPHECY.COMPETENCES.ArtScene",
    "artisanat": "PROPHECY.COMPETENCES.Artisanat",
    "astrologie": "PROPHECY.COMPETENCES.Astrologie",
    "athletisme": "PROPHECY.COMPETENCES.Athletisme",
    "attelages": "PROPHECY.COMPETENCES.Attelages",
    "baratin": "PROPHECY.COMPETENCES.Baratin",
    "bouclier": "PROPHECY.COMPETENCES.Bouclier",
    "cartographie": "PROPHECY.COMPETENCES.Cartographe",
    "castes": "PROPHECY.COMPETENCES.Castes",
    "commandement": "PROPHECY.COMPETENCES.Commandement",
    "connaissancedelamagie": "PROPHECY.COMPETENCES.ConnaissanceMagie",
    "connaissancedesanimaux": "PROPHECY.COMPETENCES.ConnaissanceAnimaux",
    "connaissancedesdragons": "PROPHECY.COMPETENCES.ConnaissanceDragons",
    "conte": "PROPHECY.COMPETENCES.Conte",
    "contrefacon": "PROPHECY.COMPETENCES.Contrefacon",
    "corpsacorps": "PROPHECY.COMPETENCES.CorpsACorps",
    "deguisement": "PROPHECY.COMPETENCES.Deguisement",
    "deverouillage": "PROPHECY.COMPETENCES.Deverouillage",
    "diplomatie": "PROPHECY.COMPETENCES.Diplomatie",
    "discretion": "PROPHECY.COMPETENCES.Discretion",
    "donartistique": "PROPHECY.COMPETENCES.DonArtistique",
    "dressage": "PROPHECY.COMPETENCES.Dressage",
    "eloquence": "PROPHECY.COMPETENCES.Eloquence",
    "equitation": "PROPHECY.COMPETENCES.Equitation",
    "escalade": "PROPHECY.COMPETENCES.Escalade",
    "esquive": "PROPHECY.COMPETENCES.Esquive",
    "estimation": "PROPHECY.COMPETENCES.Estimation",
    "fairelespoches": "PROPHECY.COMPETENCES.FairePoches",
    "geographie": "PROPHECY.COMPETENCES.Geographie",
    "herboristerie": "PROPHECY.COMPETENCES.Herboristerie",
    "histoire": "PROPHECY.COMPETENCES.Histoire",
    "intimidation": "PROPHECY.COMPETENCES.Intimidation",
    "jeu": "PROPHECY.COMPETENCES.Jeu",
    "jongler": "PROPHECY.COMPETENCES.Jongler",
    "lireetecrire": "PROPHECY.COMPETENCES.LireEtEcrire",
    "lois": "PROPHECY.COMPETENCES.Lois",
    "marchandage": "PROPHECY.COMPETENCES.Marchandage",
    "matierespremieres": "PROPHECY.COMPETENCES.MatieresPremieres",
    "medecine": "PROPHECY.COMPETENCES.Medecine",
    "natation": "PROPHECY.COMPETENCES.Natation",
    "orientation": "PROPHECY.COMPETENCES.Orientation",
    "pieges": "PROPHECY.COMPETENCES.Pieges",
    "pister": "PROPHECY.COMPETENCES.Pister",
    "premierssoins": "PROPHECY.COMPETENCES.PremiersSoins",
    "psychologie": "PROPHECY.COMPETENCES.Psychologie",
    "seduction": "PROPHECY.COMPETENCES.Seduction",
    "strategie": "PROPHECY.COMPETENCES.Strategie",
    "survie": "PROPHECY.COMPETENCES.Survie",
    "vieencite": "PROPHECY.COMPETENCES.VieEnCite"
};

PROPHECY.OpenCompetence = {
    'artisanat':true,
    'survie':true,
    'donartistique':true,
    'artdelascene':true,
};

PROPHECY.CatComp = {
    "combat":"PROPHECY.CATCOMP.Combat",
    "theorie":"PROPHECY.CATCOMP.Theorie",
    "technique":"PROPHECY.CATCOMP.Technique",
    "communication":"PROPHECY.CATCOMP.Communication",
    "mouvement":"PROPHECY.CATCOMP.Mouvement",
    "pratique":"PROPHECY.CATCOMP.Pratique",
    "manipulation":"PROPHECY.CATCOMP.Manipulation",
    "influence":"PROPHECY.CATCOMP.Influence",
};

PROPHECY.Blessures = {
    'egratinures':'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Egratinure',
    'legeres':'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Legere',
    'graves':'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Grave',
    'fatales':'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Fatale',
    'morts':'PROPHECY.ATTRIBUTSMINEURS.BLESSURES.Mort',
};

PROPHECY.SeuilsBlessures = {
    'egratinures':'(1 - 10)',
    'legeres':'(11 - 20)',
    'graves':'(21 - 30)',
    'fatales':'(31 - 40)',
    'morts':'(41+)',
};

PROPHECY.TypeArmures = {
    'armure':"PROPHECY.Armure",
    'bouclier':"PROPHECY.Bouclier",
};

PROPHECY.TypeWpn = {
    'tranchante':'PROPHECY.WPN.Tranchante',
    'choc':'PROPHECY.WPN.Choc',
    'contondante':'PROPHECY.WPN.Contondante',
    'articulee':'PROPHECY.WPN.Articulee',
    'double':'PROPHECY.WPN.Double',
    'corpsacorps':'PROPHECY.WPN.Corpsacorps',
    'hast':'PROPHECY.WPN.Hast',
    'jet':'PROPHECY.WPN.Hast',
    'projectile':'PROPHECY.WPN.Projectile',
    'mecanique':'PROPHECY.WPN.Mecanique',
};

PROPHECY.Mains = {
    '1main':'PROPHECY.WPN.1main',
    '2mains':'PROPHECY.WPN.2mains',
}

PROPHECY.MAGIE = {
    Disciplines:{
        'instinctive':'PROPHECY.MAGIE.MagieInstinctive',
        'invocatoire':'PROPHECY.MAGIE.MagieInvocatoire',
        'sorcellerie':'PROPHECY.MAGIE.Sorcellerie',
    },
    Spheres:{
        'pierre':'PROPHECY.MAGIE.Pierre',
        'feu':'PROPHECY.MAGIE.Feu',
        'oceans':'PROPHECY.MAGIE.Oceans',
        'metal':'PROPHECY.MAGIE.Metal',
        'nature':'PROPHECY.MAGIE.Nature',
        'reves':'PROPHECY.MAGIE.Reves',
        'cite':'PROPHECY.MAGIE.Cite',
        'vents':'PROPHECY.MAGIE.Vents',
        'ombre':'PROPHECY.MAGIE.Ombre',
    }
}

PROPHECY.MAGIEROLL = {
    Spheres:{
        'pierre':'PROPHECY.ROLL.Pierre',
        'feu':'PROPHECY.ROLL.Feu',
        'oceans':'PROPHECY.ROLL.Oceans',
        'metal':'PROPHECY.ROLL.Metal',
        'nature':'PROPHECY.ROLL.Nature',
        'reves':'PROPHECY.ROLL.Reves',
        'cite':'PROPHECY.ROLL.Cite',
        'vents':'PROPHECY.ROLL.Vents',
        'ombre':'PROPHECY.ROLL.Ombre',
    }
}

PROPHECY.HowToApplyDmg = {
    'normal':'PROPHECY.HOWTOAPPLYDMG.Normal',
    'divide':'PROPHECY.HOWTOAPPLYDMG.Divide',
    'none':'PROPHECY.HOWTOAPPLYDMG.None',
}

PROPHECY.Motivations = {
    'vertu':"PROPHECY.ETOILE.Vertu",
    'penchant':"PROPHECY.ETOILE.Penchant",
    'ideal':"PROPHECY.ETOILE.Ideal",
    'interdit':"PROPHECY.ETOILE.Interdit",
    'epreuve':"PROPHECY.ETOILE.Epreuve",
    'destinee':"PROPHECY.ETOILE.Destinee",
}

PROPHECY.IMAGES = {
    'armement':'systems/prophecy-2e/img/icons/armement.svg',
    'avantage':'systems/prophecy-2e/img/icons/avantage.svg',
    'desavantage':'systems/prophecy-2e/img/icons/desavantage.svg',
    'caste':'systems/prophecy-2e/img/icons/caste.svg',
    'pouvoir':'systems/prophecy-2e/img/icons/eclat.svg',
    'materiel':'systems/prophecy-2e/img/icons/materiel.svg',
    'pnj':'systems/prophecy-2e/img/icons/pnj.svg',
    'protection':'systems/prophecy-2e/img/icons/protection.svg',
    'sortilege':'systems/prophecy-2e/img/icons/sortilege.svg',
    'etoile':'systems/prophecy-2e/img/icons/etoile.svg',
}