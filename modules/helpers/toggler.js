class Toggler {
  constructor() {
    this.toggles = this._load();
  }

  init(id, html) {
    id = this._cleanId(id);

    html[0].querySelectorAll('.js-toggler').forEach((element, index) => {
      const visible = this.toggles.get(this._getKey(id, index));

      if ('undefined' !== typeof visible) {
        this._getSiblings(element).toggle(visible);
        this._toggleClasses(element.querySelector('i:first-child'), visible);
      }

      element.querySelector('i:first-child').addEventListener('click', e => {
        e.preventDefault();

        const target = e.currentTarget;

        this._toggleClasses(target);

        this._getSiblings(element).toggle({
          complete: () => this._setElementVisibility(id, index, element),
        });
      });
    });
  }

  clearForId(id) {
    id = this._cleanId(id);

    this.toggles.forEach((value, key) => {
      if (key.startsWith(id)) {
        this.toggles.delete(key);
      }
    });

    this._save();
  }

  clearAll() {
    this.toggles = new Map();

    this._save();
  }

  _cleanId(id) {
    return id.split('-').pop();
  }

  _getSiblings(element) {
    return $(element).siblings();
  }

  _toggleClasses(element, forcedVisibility) {
    if ('undefined' === typeof forcedVisibility) {
      element.classList.toggle('fa-square-plus');
      element.classList.toggle('fa-square-minus');

      return;
    }

    if (forcedVisibility) {
      element.classList.remove('fa-square-plus');
      element.classList.add('fa-square-minus');
    } else {
      element.classList.add('fa-square-plus');
      element.classList.remove('fa-square-minus');
    }
  }

  _setElementVisibility(id, index, element) {
    const target = this._getToggleTarget(element);

    this.toggles.set(this._getKey(id, index), 'none' !== target.style.display);

    this._save();
  }

  _getToggleTarget(element) {
    return element.nextElementSibling;
  }

  _getKey(id, index) {
    return `${id}-${index}`;
  }

  _save() {
    const dataset = {};

    this.toggles.forEach((value, key) => {
      dataset[key] = value;
    });

    localStorage.setItem('knight.togglers', JSON.stringify(dataset));
  }

  _load() {
    const dataset = localStorage.getItem('knight.togglers');
    if (null === dataset) {
      return new Map();
    }

    const map = new Map();

    for (const [key, value] of Object.entries(JSON.parse(dataset))) {
      map.set(key, value);
    }

    return map;
  }
}

export default new Toggler();
