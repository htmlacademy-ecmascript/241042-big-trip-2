const TYPES = [
  'taxi', 'bus', 'train', 'flight',
  'check-in', 'sightseeing', 'ship',
  'drive', 'restaurant'
];

const EMPTY_POINT = {
  basePrice: 0,
  dateFrom: '',
  dateTo: '',
  destination: null,
  isFavorite: false,
  offerIds: [],
  type: 'flight',
};

const UserAction = {
  UPDATE_POINT: 'UPDATE_POINT',
  ADD_POINT: 'ADD_POINT',
  DELETE_POINT: 'DELETE_POINT',
};

const FilterType = {
  EVERYTHING: 'everything',
  FUTURE: 'future',
  PRESENT: 'present',
  PAST: 'past',
};

const SortType = {
  DAY: 'day',
  TIME: 'time',
  PRICE: 'price',
};

export { TYPES, EMPTY_POINT, FilterType, SortType, UserAction };
