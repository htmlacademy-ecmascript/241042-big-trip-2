export default class DestinationsModel {
  #destinations = [];
  #destinationsMap = new Map();

  constructor(destinations = []) {
    this.setDestinations(destinations);
  }

  get destinations() {
    return this.#destinations;
  }

  setDestinations(destinations) {
    this.#destinations = destinations;
    this.#destinationsMap = new Map(destinations.map((destination) => [destination.id, destination]));
  }

  getById(id) {
    return this.#destinationsMap.get(id);
  }

  getByName(name) {
    return this.#destinations.find((destination) => destination.name === name);
  }
}
