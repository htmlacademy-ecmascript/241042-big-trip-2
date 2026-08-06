export default class PointsModel {
  #pointsApiService = null;
  #points = [];

  constructor(pointsApiService) {
    this.#pointsApiService = pointsApiService;
  }

  get points() {
    return this.#points;
  }

  setPoints(points) {
    this.#points = points;
  }

  getPointById(id) {
    return this.#points.find((point) => point.id === id);
  }

  addPoint(point) {
    this.#points.push(point);
  }

  async updatePoint(updatedPoint) {
    const response = await this.#pointsApiService.updatePoint(updatedPoint);
    const adaptedPoint = PointsModel.adaptToClient(response);
    const index = this.#points.findIndex((point) => point.id === adaptedPoint.id);

    if (index !== -1) {
      this.#points.splice(index, 1, adaptedPoint);
    }

    return adaptedPoint;
  }

  deletePoint(pointId) {
    const index = this.#points.findIndex((point) => point.id === pointId);

    if (index !== -1) {
      this.#points.splice(index, 1);
    }
  }

  static adaptToClient(point) {
    return {
      id: point.id,
      basePrice: point['base_price'],
      dateFrom: point['date_from'],
      dateTo: point['date_to'],
      destination: point.destination,
      isFavorite: point['is_favorite'],
      offerIds: point.offers,
      type: point.type,
    };
  }

  static adaptToServer(point) {
    return {
      id: point.id,
      ['base_price']: point.basePrice,
      ['date_from']: point.dateFrom,
      ['date_to']: point.dateTo,
      destination: point.destination,
      ['is_favorite']: point.isFavorite,
      offers: point.offerIds,
      type: point.type,
    };
  }
}
