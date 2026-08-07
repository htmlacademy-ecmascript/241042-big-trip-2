import { render, remove, RenderPosition } from '../framework/render.js';
import TripInfoView from '../view/trip-info-view.js';
import { getTripRouteTitle, getTripDates, getTripCost } from '../utils.js';

export default class TripInfoPresenter {
  #tripMainContainer = null;
  #pointsModel = null;
  #destinationsModel = null;
  #offersModel = null;
  #tripInfoComponent = null;

  constructor({ tripMainContainer, pointsModel, destinationsModel, offersModel }) {
    this.#tripMainContainer = tripMainContainer;
    this.#pointsModel = pointsModel;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
  }

  init() {
    const points = this.#pointsModel.points;

    if (this.#tripInfoComponent) {
      remove(this.#tripInfoComponent);
      this.#tripInfoComponent = null;
    }

    if (points.length === 0) {
      return;
    }

    const getDestinationName = (destinationId) =>
      this.#destinationsModel.getById(destinationId)?.name;

    this.#tripInfoComponent = new TripInfoView({
      title: getTripRouteTitle(points, getDestinationName),
      dates: getTripDates(points),
      cost: getTripCost(points, this.#offersModel),
    });

    render(this.#tripInfoComponent, this.#tripMainContainer, RenderPosition.AFTERBEGIN);
  }
}
