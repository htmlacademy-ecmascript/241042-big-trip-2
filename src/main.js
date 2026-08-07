import { render, remove } from './framework/render.js';
import BoardPresenter from './presenter/board-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import TripInfoPresenter from './presenter/trip-info-presenter.js';
import PointsModel from './model/points-model.js';
import DestinationsModel from './model/destinations-model.js';
import OffersModel from './model/offers-model.js';
import FilterModel from './model/filter-model.js';
import SortModel from './model/sort-model.js';
import PointsApiService from './api/points-api-service.js';
import LoadingView from './view/loading-view.js';
import FailedLoadView from './view/failed-load-view.js';

const siteHeaderElement = document.querySelector('.page-header');
const siteTripMainElement = siteHeaderElement.querySelector('.trip-main');
const siteFilterElement = siteHeaderElement.querySelector('.trip-controls__filters');
const siteMainElement = document.querySelector('.page-main');
const siteBoardElement = siteMainElement.querySelector('.trip-events');

const AUTHORIZATION = `Basic ${Math.random().toString(36).slice(2, 12)}`;
const END_POINT = 'https://22.objects.htmlacademy.pro/big-trip';

const apiService = new PointsApiService(END_POINT, AUTHORIZATION);
const pointsModel = new PointsModel(apiService);
const destinationsModel = new DestinationsModel();
const offersModel = new OffersModel();
const filterModel = new FilterModel();
const sortModel = new SortModel();
const loadingComponent = new LoadingView();
const newEventButton = siteHeaderElement.querySelector('.trip-main__event-add-btn');

render(loadingComponent, siteBoardElement);

const presenters = {
  onFilterChange() { },
};

const filterPresenter = new FilterPresenter({
  filterContainer: siteFilterElement,
  filterModel,
  pointsModel,
  onFilterChange: () => presenters.onFilterChange(),
});

const tripInfoPresenter = new TripInfoPresenter({
  tripMainContainer: siteTripMainElement,
  pointsModel,
  destinationsModel,
  offersModel,
});

const boardPresenter = new BoardPresenter({
  boardContainer: siteBoardElement,
  pointsModel,
  destinationsModel,
  offersModel,
  filterModel,
  sortModel,
  onDataUpdate: () => {
    filterPresenter.init();
    tripInfoPresenter.init();
  },
});

presenters.onFilterChange = () => boardPresenter.onFilterChange();

let isLoadError = false;

Promise.all([
  apiService.getPoints(),
  apiService.getDestinations(),
  apiService.getOffers(),
])
  .then(([points, destinations, offers]) => {
    pointsModel.setPoints(points.map(PointsModel.adaptToClient));
    destinationsModel.setDestinations(destinations);
    offersModel.setOffers(offers);
  })
  .catch(() => {
    isLoadError = true;
  })
  .finally(() => {
    remove(loadingComponent);

    if (isLoadError) {
      render(new FailedLoadView(), siteBoardElement);
      newEventButton.disabled = true;
      filterPresenter.init();
      return;
    }

    boardPresenter.init();
    filterPresenter.init();
    tripInfoPresenter.init();
  });
