/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class ProphecyActor extends Actor {

    /**
       * Create a new entity using provided input data
       * @override
       */
    static async create(data, options = {}) {
      // Replace default image
      if (data.img === undefined) data.img = CONFIG.PROPHECY.IMAGES[data.type];

      return await super.create(data, options);
    }
  }