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

const AUTHORIZATION_RADIX = 36;
const AUTHORIZATION_SLICE_START = 2;
const AUTHORIZATION_SLICE_END = 12;

const authorization = `Basic ${Math.random().toString(AUTHORIZATION_RADIX).slice(AUTHORIZATION_SLICE_START, AUTHORIZATION_SLICE_END)}`;
const END_POINT = 'https://22.objects.htmlacademy.pro/big-trip';

const apiService = new PointsApiService(END_POINT, authorization);
const pointsModel = new PointsModel(apiService);
const destinationsModel = new DestinationsModel();
const offersModel = new OffersModel();
const filterModel = new FilterModel();
const sortModel = new SortModel();
const loadingComponent = new LoadingView();
const newEventButton = siteHeaderElement.querySelector('.trip-main__event-add-btn');

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

render(loadingComponent, siteBoardElement);

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
