import { render, remove, RenderPosition } from '../framework/render.js';
import SortView from '../view/sort-view.js';
import EventListView from '../view/event-list-view.js';
import NoPointsView from '../view/no-points-view.js';
import EditPointView from '../view/edit-point-view.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';
import PointPresenter from './point-presenter.js';

import { FilterType, SortType, UserAction } from '../const.js';
import { filter, sort, generateId } from '../utils.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000,
};

export default class BoardPresenter {
  #boardContainer = null;
  #pointsModel = null;
  #destinationsModel = null;
  #offersModel = null;
  #filterModel = null;
  #sortModel = null;
  #onDataUpdate = null;

  #boardComponent = new EventListView();
  #sortComponent = null;
  #noPointsComponent = null;
  #creationFormComponent = null;
  #pointPresenters = [];
  #newEventButton = null;
  #isCreating = false;
  #uiBlocker = new UiBlocker(TimeLimit);

  constructor({
    boardContainer,
    pointsModel,
    destinationsModel,
    offersModel,
    filterModel,
    sortModel,
    onDataUpdate,
  }) {
    this.#boardContainer = boardContainer;
    this.#pointsModel = pointsModel;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#filterModel = filterModel;
    this.#sortModel = sortModel;
    this.#onDataUpdate = onDataUpdate;
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
    this.#newEventButton.addEventListener('click', this.#newEventButtonClickHandler);
    this.#renderBoard();
  }

  onFilterChange() {
    this.#sortModel.setSort(SortType.DAY);
    this.#resetAllPointViews();
    this.#closeCreationForm();
    this.#clearBoard();
    this.#renderBoard();
  }

  #newEventButtonClickHandler = () => {
    if (this.#isCreating) {
      return;
    }

    this.#filterModel.setFilter(FilterType.EVERYTHING);
    this.#sortModel.setSort(SortType.DAY);
    this.#onDataUpdate();

    this.#resetAllPointViews();
    this.#closeCreationForm();
    this.#clearBoard();

    this.#isCreating = true;
    this.#newEventButton.disabled = true;

    this.#renderBoard();
    document.addEventListener('keydown', this.#creationEscKeyDownHandler);
  };

  #creationEscKeyDownHandler = (evt) => {
    if (evt.key !== 'Escape') {
      return;
    }

    evt.preventDefault();

    if (this.#creationFormComponent?.isDisabled) {
      return;
    }

    this.#closeCreationForm();
    this.#clearBoard();
    this.#renderBoard();
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

  #handleCreationFormSubmit = async () => {
    const point = this.#creationFormComponent.point;

    if (!point.destination) {
      this.#creationFormComponent.shake();
      return;
    }

    this.#creationFormComponent.setSaving();

    try {
      await this.#handleViewAction(UserAction.ADD_POINT, point);
    } catch (err) {
      this.#creationFormComponent.resetState();
      this.#creationFormComponent.shake();
    }
  };

  #handleCreationFormClose = () => {
    this.#closeCreationForm();
    this.#clearBoard();
    this.#renderBoard();
  };

  #closeCreationForm() {
    document.removeEventListener('keydown', this.#creationEscKeyDownHandler);

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

  #blockingClickHandler = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  };

  #handleViewAction = async (actionType, payload) => {
    this.#uiBlocker.block();
    document.addEventListener('click', this.#blockingClickHandler, true);

    try {
      switch (actionType) {
        case UserAction.UPDATE_POINT: {
          const updatedPoint = await this.#pointsModel.update(payload);

          this.#syncPointPresenters();

          const updatedPresenter = this.#pointPresenters
            .find((presenter) => presenter.id === updatedPoint.id);

          if (updatedPresenter) {
            updatedPresenter.update(updatedPoint);
          }

          this.#renderPointsOrder();
          this.#onDataUpdate();
          return updatedPoint;
        }
        case UserAction.DELETE_POINT: {
          await this.#pointsModel.delete(payload);

          const presenterIndex = this.#pointPresenters
            .findIndex((presenter) => presenter.id === payload);

          if (presenterIndex !== -1) {
            const [removedPresenter] = this.#pointPresenters.splice(presenterIndex, 1);
            removedPresenter.destroy();
            remove(removedPresenter.viewComponent);
          }

          if (this.#points.length === 0) {
            this.#clearBoard();
            this.#renderBoard();
          } else {
            this.#renderPointsOrder();
          }

          this.#onDataUpdate();
          return null;
        }
        case UserAction.ADD_POINT: {
          await this.#pointsModel.add(payload);
          this.#closeCreationForm();
          this.#syncPointPresenters();
          this.#renderPointsOrder();
          this.#onDataUpdate();
          return null;
        }
        default:
          return null;
      }
    } finally {
      document.removeEventListener('click', this.#blockingClickHandler, true);
      this.#uiBlocker.unblock();
    }
  };

  #syncPointPresenters() {
    const points = this.#points;

    this.#pointPresenters.forEach((presenter) => {
      const isPointPresent = points.some((point) => point.id === presenter.id);

      if (!isPointPresent) {
        presenter.destroy();
        remove(presenter.viewComponent);
      }
    });

    this.#pointPresenters = this.#pointPresenters.filter((presenter) =>
      points.some((point) => point.id === presenter.id)
    );

    points.forEach((point) => {
      const hasPresenter = this.#pointPresenters.some(
        (presenter) => presenter.id === point.id
      );

      if (!hasPresenter) {
        this.#renderPoint(point);
      }
    });
  }

  #handleOpenForm = () => {
    this.#closeCreationForm();
    this.#resetAllPointViews();
  };

  #resetAllPointViews() {
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
  }
}
