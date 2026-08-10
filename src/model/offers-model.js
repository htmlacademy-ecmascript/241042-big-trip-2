export default class OffersModel {
  #offers = [];
  #offersById = new Map();
  #offersByType = new Map();

  constructor(offers = []) {
    this.setOffers(offers);
  }

  get offers() {
    return this.#offers;
  }

  setOffers(offers) {
    this.#offers = offers;
    this.#offersByType = new Map(offers.map((group) => [group.type, group.offers]));
    this.#offersById = new Map();

    offers.forEach((group) => {
      group.offers.forEach((offer) => {
        this.#offersById.set(offer.id, offer);
      });
    });
  }

  getByType(type) {
    return this.#offersByType.get(type) || [];
  }

  getById(id) {
    return this.#offersById.get(id);
  }

  getByIds(ids = []) {
    return ids.map((id) => this.#offersById.get(id)).filter(Boolean);
  }
}
