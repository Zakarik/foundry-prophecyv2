/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

    const base = 'systems/prophecy-2e/templates';

    // Define template paths to load
    const templatePaths = [];

    templatePaths.push(
      `${base}/parts/identite.html`,
      `${base}/parts/caracteristiques.html`,
      `${base}/parts/attributs.html`,
      `${base}/parts/menu.html`,
      `${base}/parts/principal.html`,
      `${base}/parts/combat.html`,
      `${base}/parts/description.html`,
      `${base}/parts/effets.html`,
      `${base}/parts/competences.html`,
      `${base}/parts/topData.html`,
      `${base}/parts/privileges.html`,
      `${base}/parts/caste.html`,
      `${base}/parts/magie.html`,
      `${base}/parts/statuts.html`,
      `${base}/parts/lien.html`,
      `${base}/parts/equipement.html`,
      `${base}/parts/concept.html`,
      `${base}/parts/motivations.html`,
      `${base}/parts/compagnons.html`,
      `${base}/roll/initiative.html`,
      `${base}/roll/tooltip.html`,
    );

    templatePaths.push(
      `${base}/parts/subparts/tendances.html`,
      `${base}/parts/subparts/principalLeft.html`,
      `${base}/parts/subparts/principalRight.html`,
      `${base}/parts/subparts/combatRight.html`,
      `${base}/parts/subparts/combatLeft.html`,
      `${base}/parts/subparts/competence.html`,
      `${base}/parts/subparts/blessures.html`,
      `${base}/parts/subparts/magieLeft.html`,
      `${base}/parts/subparts/magieRight.html`,
    )

    templatePaths.push(
      `${base}/dialog/parts/mods.html`,
      `${base}/dialog/askMod.html`,
      `${base}/dialog/postRoll.html`,
      `${base}/dialog/initiative.html`,
    )

    // Load the template parts
    return loadTemplates(templatePaths);
  };