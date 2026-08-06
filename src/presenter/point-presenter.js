import { render, replace } from '../framework/render.js';
import EditPointView from '../view/edit-point-view.js';
import PointView from '../view/point-view.js';
import { UserAction } from '../const.js';

const Mode = {
  DEFAULT: 'DEFAULT',
  EDIT: 'EDIT',
};

export default class PointPresenter {
  #container = null;
  #point = null;
  #destinationsModel = null;
  #offersModel = null;
  #onViewAction = null;
  #onOpenForm = null;

  #pointComponent = null;
  #editPointComponent = null;
  #mode = Mode.DEFAULT;

  constructor({
    container,
    point,
    destinationsModel,
    offersModel,
    onViewAction,
    onOpenForm,
  }) {
    this.#container = container;
    this.#point = point;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#onViewAction = onViewAction;
    this.#onOpenForm = onOpenForm;
  }

  get id() {
    return this.#point.id;
  }

  get viewComponent() {
    if (this.#mode === Mode.EDIT) {
      return this.#editPointComponent;
    }

    return this.#pointComponent;
  }

  init() {
    this.#pointComponent = this.#createPointComponent();
    render(this.#pointComponent, this.#container);
  }

  resetView() {
    if (this.#mode === Mode.EDIT) {
      this.#replaceFormToPoint();
    }
  }

  update(point) {
    this.#point = point;

    if (this.#mode === Mode.EDIT) {
      return;
    }

    const newPointComponent = this.#createPointComponent();
    replace(newPointComponent, this.#pointComponent);
    this.#pointComponent = newPointComponent;
  }

  destroy() {
    if (this.#escKeyDownHandler) {
      document.removeEventListener('keydown', this.#escKeyDownHandler);
    }
  }

  #createPointComponent() {
    const destination = this.#destinationsModel.getById(this.#point.destination);

    return new PointView({
      point: this.#point,
      destination,
      offers: this.#offersModel.getByIds(this.#point.offerIds),
      onEditClick: this.#handleEditClick,
      onFavoriteClick: this.#handleFavoriteClick,
    });
  }

  #createEditPointComponent() {
    return new EditPointView({
      point: this.#point,
      destinationsModel: this.#destinationsModel,
      offersModel: this.#offersModel,
      onFormSubmit: this.#handleFormSubmit,
      onRollupClick: this.#handleRollupClick,
      onResetClick: this.#handleDeleteClick,
    });
  }

  #handleEditClick = () => {
    this.#editPointComponent = this.#createEditPointComponent();
    this.#onOpenForm();
    this.#replacePointToForm();
    document.addEventListener('keydown', this.#escKeyDownHandler);
  };

  #handleFormSubmit = () => {
    const updatedPoint = this.#editPointComponent.point;

    if (!updatedPoint.destination) {
      this.#editPointComponent.shake();
      return;
    }

    this.#point = updatedPoint;
    this.#onViewAction(UserAction.UPDATE_POINT, updatedPoint);

    const newPointComponent = this.#createPointComponent();
    replace(newPointComponent, this.#editPointComponent);
    this.#pointComponent = newPointComponent;
    this.#editPointComponent = null;
    this.#mode = Mode.DEFAULT;

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  };

  #handleRollupClick = () => {
    this.#replaceFormToPoint();
    document.removeEventListener('keydown', this.#escKeyDownHandler);
  };

  #handleDeleteClick = () => {
    this.#onViewAction(UserAction.DELETE_POINT, this.#point.id);
    document.removeEventListener('keydown', this.#escKeyDownHandler);
  };

  #handleFavoriteClick = (updatedPoint) => {
    this.#onViewAction(UserAction.UPDATE_POINT, updatedPoint);
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#replaceFormToPoint();
      document.removeEventListener('keydown', this.#escKeyDownHandler);
    }
  };

  #replacePointToForm() {
    replace(this.#editPointComponent, this.#pointComponent);
    this.#mode = Mode.EDIT;
  }

  #replaceFormToPoint() {
    replace(this.#pointComponent, this.#editPointComponent);
    this.#editPointComponent = null;
    this.#mode = Mode.DEFAULT;
  }
}
