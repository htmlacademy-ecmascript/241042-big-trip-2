export default class PointsModel {
  #points = [];

  constructor(points) {
    this.#points = points;
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

  updatePoint(updatedPoint) {
    const index = this.#points.findIndex((point) => point.id === updatedPoint.id);

    if (index !== -1) {
      this.#points.splice(index, 1, updatedPoint);
    }
  }

  deletePoint(pointId) {
    const index = this.#points.findIndex((point) => point.id === pointId);

    if (index !== -1) {
      this.#points.splice(index, 1);
    }
  }
}
