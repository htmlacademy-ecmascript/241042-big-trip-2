import { render, remove, RenderPosition } from '../framework/render.js';
import SortView from '../view/sort-view.js';
import EventListView from '../view/event-list-view.js';
import NoPointsView from '../view/no-points-view.js';
import EditPointView from '../view/edit-point-view.js';
import PointPresenter from './point-presenter.js';

import { FilterType, SortType, UserAction } from '../const.js';
import { filter, sort, generateId } from '../utils.js';

export default class BoardPresenter {
  #boardContainer = null;
  #pointsModel = null;
  #destinationsModel = null;
  #offersModel = null;
  #filterModel = null;
  #sortModel = null;
  #onFiltersUpdate = null;

  #boardComponent = new EventListView();
  #sortComponent = null;
  #noPointsComponent = null;
  #creationFormComponent = null;
  #pointPresenters = [];
  #newEventButton = null;
  #isCreating = false;

  constructor({
    boardContainer,
    pointsModel,
    destinationsModel,
    offersModel,
    filterModel,
    sortModel,
    onFiltersUpdate,
  }) {
    this.#boardContainer = boardContainer;
    this.#pointsModel = pointsModel;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#filterModel = filterModel;
    this.#sortModel = sortModel;
    this.#onFiltersUpdate = onFiltersUpdate;
  }

  get #points() {
    const points = this.#pointsModel.points;
    const filterType = this.#filterModel.filter;
    const sortType = this.#sortModel.sort;
    const filteredPoints = filter[filterType](points);

    return sort[sortType](filteredPoints);
  }

  init() {
    this.#newEventButton = document.querySelector('.trip-main__event-add-btn');
    this.#newEventButton.addEventListener('click', this.#handleNewEventButtonClick);
    this.#renderBoard();
  }

  onFilterChange() {
    this.#sortModel.setSort(SortType.DAY);
    this.#resetAllPointViews();
    this.#closeCreationForm();
    this.#clearBoard();
    this.#renderBoard();
  }

  #handleNewEventButtonClick = () => {
    if (this.#isCreating) {
      return;
    }

    this.#filterModel.setFilter(FilterType.EVERYTHING);
    this.#sortModel.setSort(SortType.DAY);
    this.#onFiltersUpdate();

    this.#resetAllPointViews();
    this.#closeCreationForm();
    this.#clearBoard();

    this.#isCreating = true;
    this.#newEventButton.disabled = true;

    this.#renderBoard();
    document.addEventListener('keydown', this.#creationEscKeyDownHandler);
  };

  #creationEscKeyDownHandler = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#closeCreationForm();
      this.#renderBoard();
      document.removeEventListener('keydown', this.#creationEscKeyDownHandler);
    }
  };

  #renderSort() {
    if (this.#sortComponent) {
      remove(this.#sortComponent);
    }

    this.#sortComponent = new SortView({
      currentSortType: this.#sortModel.sort,
      onSortTypeChange: this.#handleSortTypeChange,
    });

    render(this.#sortComponent, this.#boardContainer);
  }

  #handleSortTypeChange = (sortType) => {
    if (this.#sortModel.sort === sortType) {
      return;
    }

    this.#sortModel.setSort(sortType);
    this.#renderPointsOrder();
  };

  #clearBoard() {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters = [];

    if (this.#sortComponent) {
      remove(this.#sortComponent);
      this.#sortComponent = null;
    }

    if (this.#noPointsComponent) {
      remove(this.#noPointsComponent);
      this.#noPointsComponent = null;
    }

    if (this.#creationFormComponent) {
      remove(this.#creationFormComponent);
      this.#creationFormComponent = null;
    }

    this.#boardComponent.element.innerHTML = '';
  }

  #renderBoard() {
    const points = this.#points;
    const hasPoints = points.length > 0 || this.#isCreating;

    if (!hasPoints) {
      this.#renderNoPoints();
      return;
    }

    this.#renderSort();
    render(this.#boardComponent, this.#boardContainer);

    if (this.#isCreating) {
      this.#renderCreationForm();
    }

    points.forEach((point) => {
      this.#renderPoint(point);
    });
  }

  #renderNoPoints() {
    this.#noPointsComponent = new NoPointsView({
      filterType: this.#filterModel.filter,
    });
    render(this.#noPointsComponent, this.#boardContainer);
  }

  #renderCreationForm() {
    const newPoint = {
      id: generateId(),
      type: 'flight',
      destination: null,
      dateFrom: '',
      dateTo: '',
      basePrice: 0,
      isFavorite: false,
      offerIds: [],
    };

    this.#creationFormComponent = new EditPointView({
      point: newPoint,
      destinationsModel: this.#destinationsModel,
      offersModel: this.#offersModel,
      isEditMode: false,
      onFormSubmit: this.#handleCreationFormSubmit,
      onRollupClick: this.#handleCreationFormClose,
      onResetClick: this.#handleCreationFormClose,
    });

    render(
      this.#creationFormComponent,
      this.#boardComponent.element,
      RenderPosition.AFTERBEGIN
    );
  }

  #handleCreationFormSubmit = () => {
    const point = this.#creationFormComponent.point;

    if (!point.destination) {
      this.#creationFormComponent.shake();
      return;
    }

    this.#handleViewAction(UserAction.ADD_POINT, point);
    document.removeEventListener('keydown', this.#creationEscKeyDownHandler);
  };

  #handleCreationFormClose = () => {
    this.#closeCreationForm();
    this.#renderBoard();
    document.removeEventListener('keydown', this.#creationEscKeyDownHandler);
  };

  #closeCreationForm() {
    if (!this.#isCreating) {
      return;
    }

    if (this.#creationFormComponent) {
      remove(this.#creationFormComponent);
      this.#creationFormComponent = null;
    }

    this.#isCreating = false;
    this.#newEventButton.disabled = false;
  }

  #renderPoint(point) {
    const pointPresenter = new PointPresenter({
      container: this.#boardComponent.element,
      point,
      destinationsModel: this.#destinationsModel,
      offersModel: this.#offersModel,
      onViewAction: this.#handleViewAction,
      onOpenForm: this.#handleOpenForm,
    });

    this.#pointPresenters.push(pointPresenter);
    pointPresenter.init();
  }

  #renderPointsOrder() {
    if (this.#isCreating && this.#creationFormComponent) {
      this.#boardComponent.element.prepend(this.#creationFormComponent.element);
    }

    this.#points.forEach((point) => {
      const pointPresenter = this.#pointPresenters
        .find((presenter) => presenter.id === point.id);

      this.#boardComponent.element.append(pointPresenter.viewComponent.element);
    });
  }

  #handleViewAction = (actionType, payload) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointsModel.updatePoint(payload);
        this.#pointPresenters
          .find((presenter) => presenter.id === payload.id)
          ?.update(payload);
        break;
      case UserAction.DELETE_POINT:
        this.#pointsModel.deletePoint(payload);
        this.#onFiltersUpdate();
        this.#clearBoard();
        this.#renderBoard();
        break;
      case UserAction.ADD_POINT:
        this.#pointsModel.addPoint(payload);
        this.#closeCreationForm();
        this.#onFiltersUpdate();
        this.#clearBoard();
        this.#renderBoard();
        break;
    }
  };

  #handleOpenForm = () => {
    this.#closeCreationForm();
    document.removeEventListener('keydown', this.#creationEscKeyDownHandler);
    this.#resetAllPointViews();
  };

  #resetAllPointViews() {
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
  }
}
