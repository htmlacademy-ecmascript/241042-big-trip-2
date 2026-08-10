export default class DestinationsModel {
  #destinations = [];
  #destinationsById = new Map();

  constructor(destinations = []) {
    this.setDestinations(destinations);
  }

  get destinations() {
    return this.#destinations;
  }

  setDestinations(destinations) {
    this.#destinations = destinations;
    this.#destinationsById = new Map(destinations.map((destination) => [destination.id, destination]));
  }

  getById(id) {
    return this.#destinationsById.get(id);
  }

  getByName(name) {
    return this.#destinations.find((destination) => destination.name === name);
  }
}
