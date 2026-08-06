import { render, remove } from '../framework/render.js';
import FilterView from '../view/filter-view.js';
import { FilterType } from '../const.js';
import { filter } from '../utils.js';

function generateFilters(points) {
  return Object.values(FilterType).map((type) => ({
    type,
    isDisabled: filter[type](points).length === 0,
  }));
}

export default class FilterPresenter {
  #filterContainer = null;
  #filterModel = null;
  #pointsModel = null;
  #onFilterChange = null;
  #filterComponent = null;

  constructor({ filterContainer, filterModel, pointsModel, onFilterChange }) {
    this.#filterContainer = filterContainer;
    this.#filterModel = filterModel;
    this.#pointsModel = pointsModel;
    this.#onFilterChange = onFilterChange;
  }

  init() {
    this.#render();
  }

  #render() {
    const filters = generateFilters(this.#pointsModel.points);

    if (this.#filterComponent) {
      remove(this.#filterComponent);
    }

    this.#filterComponent = new FilterView({
      filters,
      currentFilter: this.#filterModel.filter,
      onFilterChange: this.#handleFilterChange,
    });

    render(this.#filterComponent, this.#filterContainer);
  }

  #handleFilterChange = (filterType) => {
    if (this.#filterModel.filter === filterType) {
      return;
    }

    this.#filterModel.setFilter(filterType);
    this.#onFilterChange();
  };
}
