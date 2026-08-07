import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { TYPES, EMPTY_POINT } from '../const.js';
import { humanizeDate, FLATPICKR_DATE_FORMAT } from '../utils.js';

function createTypesTemplate(currentType, id, isDisabled) {
  return TYPES.map((type) => `
    <div class="event__type-item">
      <input
        id="event-type-${type}-${id}"
        class="event__type-input visually-hidden"
        type="radio"
        name="event-type-${id}"
        value="${type}"
        ${type === currentType ? 'checked' : ''}
        ${isDisabled ? 'disabled' : ''}
      >
      <label class="event__type-label event__type-label--${type}" for="event-type-${type}-${id}">
        ${type}
      </label>
    </div>
  `).join('');
}


function createDestinationsTemplate(destinations = []) {
  return destinations.map((d) =>
    `<option value="${d.name}"></option>`
  ).join('');
}

function createOffersSection(offersByType = [], selectedOfferIds = []) {
  if (!offersByType.length) {
    return '';
  }

  const offersTemplate = offersByType.map((offer) => `
    <div class="event__offer-selector">
      <input
        class="event__offer-checkbox visually-hidden"
        id="event-offer-${offer.id}"
        type="checkbox"
        name="event-offer-${offer.id}"
        ${selectedOfferIds.includes(offer.id) ? 'checked' : ''}
      >
      <label class="event__offer-label" for="event-offer-${offer.id}">
        <span class="event__offer-title">${offer.title}</span>
        &plus;&euro;&nbsp;
        <span class="event__offer-price">${offer.price}</span>
      </label>
    </div>
  `).join('');

  return `
    <section class="event__section event__section--offers">
      <h3 class="event__section-title event__section-title--offers">Offers</h3>
      <div class="event__available-offers">
        ${offersTemplate}
      </div>
    </section>
  `;
}

function createDestinationSection(destination) {
  if (!destination) {
    return '';
  }

  const { description, pictures = [] } = destination;

  const photosTemplate = pictures.length
    ? `
      <div class="event__photos-container">
        <div class="event__photos-tape">
          ${pictures.map((photo) => `
            <img class="event__photo" src="${photo.src}" alt="${photo.description}">
          `).join('')}
        </div>
      </div>
    `
    : '';

  if (!description && !pictures.length) {
    return '';
  }

  return `
    <section class="event__section event__section--destination">
      <h3 class="event__section-title event__section-title--destination">Destination</h3>
      ${description ? `<p class="event__destination-description">${description}</p>` : ''}
      ${photosTemplate}
    </section>
  `;
}

function createEditPointTemplate({
  point,
  destination,
  offersByType,
  allDestinations,
  resetButtonCaption,
  isDisabled,
  saveButtonCaption,
}) {
  const {
    id,
    basePrice,
    dateFrom,
    dateTo,
    type,
    offerIds,
  } = point;

  const offersSection = createOffersSection(offersByType, offerIds);
  const destinationSection = createDestinationSection(destination);

  return (
    `<li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">

          <div class="event__type-wrapper">
            <label class="event__type event__type-btn" for="event-type-toggle-${id}">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle visually-hidden" id="event-type-toggle-${id}" type="checkbox">

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${createTypesTemplate(type, id, isDisabled)}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group event__field-group--destination">
            <label class="event__label event__type-output" for="event-destination-${id}">
              ${type}
            </label>
            <input
              class="event__input event__input--destination"
              id="event-destination-${id}"
              type="text"
              name="event-destination"
              value="${destination?.name ?? ''}"
              list="destination-list-${id}"
              ${isDisabled ? 'disabled' : ''}
            >
            <datalist id="destination-list-${id}">
              ${createDestinationsTemplate(allDestinations)}
            </datalist>
          </div>

          <div class="event__field-group event__field-group--time">
            <label class="visually-hidden" for="event-start-time-${id}">From</label>
            <input
              class="event__input event__input--time"
              id="event-start-time-${id}" type="text" name="event-start-time"
              value="${humanizeDate(dateFrom)}"
              ${isDisabled ? 'disabled' : ''}
            >
            &mdash;
            <label class="visually-hidden" for="event-end-time-${id}">To</label>
            <input
              class="event__input event__input--time"
              id="event-end-time-${id}"
              type="text"
              name="event-end-time"
              value="${humanizeDate(dateTo)}"
              ${isDisabled ? 'disabled' : ''}
            >
          </div>

          <div class="event__field-group event__field-group--price">
            <label class="event__label" for="event-price-${id}">
              <span class="visually-hidden">Price</span>
                &euro;
            </label>
            <input
              class="event__input event__input--price"
              id="event-price-${id}"
              type="text"
              name="event-price"
              value="${basePrice}"
              ${isDisabled ? 'disabled' : ''}
            >
          </div>

          <button class="event__save-btn btn btn--blue" type="submit" ${isDisabled ? 'disabled' : ''}>${saveButtonCaption}</button>
          <button class="event__reset-btn" type="button">${resetButtonCaption}</button>
          <button class="event__rollup-btn" type="button">
            <span class="visually-hidden">Open event</span>
          </button>
        </header>

        <section class="event__details">
          ${offersSection}
          ${destinationSection}
        </section>
      </form>
    </li>`
  );
}

export default class EditPointView extends AbstractStatefulView {
  #destinationsModel = null;
  #offersModel = null;
  #handleFormSubmit = null;
  #handleRollupClick = null;
  #handleResetClick = null;
  #isEditMode = true;
  #startDatepicker = null;
  #endDatepicker = null;

  constructor({
    point,
    destinationsModel,
    offersModel,
    onFormSubmit,
    onRollupClick,
    onResetClick,
    isEditMode = true,
  }) {
    super();

    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#handleFormSubmit = onFormSubmit;
    this.#handleRollupClick = onRollupClick;
    this.#handleResetClick = onResetClick;
    this.#isEditMode = isEditMode;

    const currentPoint = point || EMPTY_POINT;

    this._setState({
      point: structuredClone(currentPoint),
      destination: destinationsModel.getById(currentPoint.destination),
      offersByType: offersModel.getByType(currentPoint.type),
      allDestinations: destinationsModel.destinations,
      isDisabled: false,
      isSaving: false,
      isDeleting: false,
    });

    this._restoreHandlers();
  }

  get template() {
    const resetButtonCaption = this._state.isDeleting
      ? 'Deleting...'
      : this.#getDefaultResetButtonCaption();

    return createEditPointTemplate({
      point: this._state.point,
      destination: this._state.destination,
      offersByType: this._state.offersByType,
      allDestinations: this._state.allDestinations,
      resetButtonCaption,
      isDisabled: this._state.isDisabled,
      saveButtonCaption: this._state.isSaving ? 'Saving...' : 'Save',
    });
  }

  #getDefaultResetButtonCaption() {
    return this.#isEditMode ? 'Delete' : 'Cancel';
  }

  setSaving() {
    this.updateElement({
      isSaving: true,
      isDeleting: false,
      isDisabled: true,
    });
  }

  setDeleting() {
    this.updateElement({
      isSaving: false,
      isDeleting: true,
      isDisabled: true,
    });
  }

  resetState() {
    this.updateElement({
      isSaving: false,
      isDeleting: false,
      isDisabled: false,
    });
  }

  get point() {
    const priceInput = this.element.querySelector('.event__input--price');
    const offerCheckboxes = this.element.querySelectorAll('.event__offer-checkbox:checked');

    return {
      ...this._state.point,
      ...this.#getDatesFromForm(),
      basePrice: Number(priceInput.value) || 0,
      offerIds: Array.from(
        offerCheckboxes,
        (checkbox) => checkbox.id.replace('event-offer-', '')
      ),
    };
  }

  _restoreHandlers() {
    this.element.querySelector('form')
      .addEventListener('submit', this.#formSubmitHandler);

    this.element.querySelector('.event__rollup-btn')
      .addEventListener('click', this.#rollupClickHandler);

    this.element.querySelector('.event__type-group')
      .addEventListener('click', this.#typeChangeHandler);

    this.element.querySelector('.event__input--destination')
      .addEventListener('change', this.#destinationChangeHandler);

    const priceInput = this.element.querySelector('.event__input--price');
    priceInput.addEventListener('input', this.#priceInputHandler);

    this.element.querySelector('.event__reset-btn')
      .addEventListener('click', this.#resetClickHandler);

    this.#setDatepickers();
  }

  #priceInputHandler = (evt) => {
    const digitsOnly = evt.target.value.replace(/\D/g, '');

    if (evt.target.value !== digitsOnly) {
      evt.target.value = digitsOnly;
    }
  };

  #resetClickHandler = (evt) => {
    evt.preventDefault();
    if (this._state.isDisabled) {
      return;
    }
    this.#handleResetClick();
  };

  #setDatepickers() {
    const startInput = this.element.querySelector('[name="event-start-time"]');
    const endInput = this.element.querySelector('[name="event-end-time"]');

    if (this.#startDatepicker) {
      this.#startDatepicker.destroy();
    }

    if (this.#endDatepicker) {
      this.#endDatepicker.destroy();
    }

    this.#startDatepicker = flatpickr(startInput, {
      enableTime: true,
      dateFormat: FLATPICKR_DATE_FORMAT,
      defaultDate: this._state.point.dateFrom || null,
      onChange: () => {
        const startDate = this.#startDatepicker.selectedDates[0];

        if (startDate) {
          this.#endDatepicker.set('minDate', startDate);
        }
      },
    });

    this.#endDatepicker = flatpickr(endInput, {
      enableTime: true,
      dateFormat: FLATPICKR_DATE_FORMAT,
      defaultDate: this._state.point.dateTo || null,
      minDate: this._state.point.dateFrom || null,
    });
  }

  #getDatesFromForm() {
    return {
      dateFrom: this.#startDatepicker?.selectedDates[0]?.toISOString()
        ?? this._state.point.dateFrom,
      dateTo: this.#endDatepicker?.selectedDates[0]?.toISOString()
        ?? this._state.point.dateTo,
    };
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    if (this._state.isDisabled) {
      return;
    }
    this.#handleFormSubmit();
  };

  #rollupClickHandler = (evt) => {
    evt.preventDefault();
    if (this._state.isDisabled) {
      return;
    }
    this.#handleRollupClick();
  };

  #typeChangeHandler = (evt) => {
    const typeLabel = evt.target.closest('.event__type-label');

    if (!typeLabel) {
      return;
    }

    const typeInput = this.element.querySelector(`#${typeLabel.htmlFor}`);

    if (!typeInput || typeInput.disabled) {
      return;
    }

    const type = typeInput.value;

    if (type === this._state.point.type) {
      return;
    }

    const priceInput = this.element.querySelector('.event__input--price');

    this.updateElement({
      point: {
        ...this._state.point,
        ...this.#getDatesFromForm(),
        type,
        offerIds: [],
        basePrice: Number(priceInput.value) || this._state.point.basePrice,
      },
      offersByType: this.#offersModel.getByType(type),
    });
  };

  #destinationChangeHandler = (evt) => {
    const destination = this.#destinationsModel.getByName(evt.target.value);

    if (!destination) {
      evt.target.value = this._state.destination?.name ?? '';
      return;
    }

    this.updateElement({
      point: {
        ...this._state.point,
        ...this.#getDatesFromForm(),
        destination: destination.id,
      },
      destination,
    });
  };
}
