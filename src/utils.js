import dayjs from 'dayjs';
import { FilterType, SortType } from './const.js';

const DateFormat = {
  DATE: 'DD/MM/YY HH:mm',
  FLATPICKR: 'd/m/y H:i',
  TIME: 'HH:mm',
  DAY: 'MMM D',
};

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MAX_CITIES_IN_ROUTE = 3;

const generateId = () => crypto.randomUUID();

function humanizeDate(date) {
  return date ? dayjs(date).format(DateFormat.DATE) : '';
}

function humanizeTime(date) {
  return date ? dayjs(date).format(DateFormat.TIME) : '';
}

function humanizeDay(date) {
  return date ? dayjs(date).format(DateFormat.DAY).toUpperCase() : '';
}

function formatDurationUnit(value) {
  return String(value).padStart(2, '0');
}

function getDuration(startDate, endDate) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  const minutesPerDay = MINUTES_PER_HOUR * HOURS_PER_DAY;

  const totalMinutes = end.diff(start, 'minute');
  const days = Math.floor(totalMinutes / minutesPerDay);
  const hours = Math.floor((totalMinutes % minutesPerDay) / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  if (days > 0) {
    return `${formatDurationUnit(days)}D ${formatDurationUnit(hours)}H ${formatDurationUnit(minutes)}M`;
  }

  if (hours > 0) {
    return `${formatDurationUnit(hours)}H ${formatDurationUnit(minutes)}M`;
  }

  return `${minutes}M`;
}

const isFuture = (point) => new Date(point.dateFrom) > new Date();
const isPast = (point) => new Date(point.dateTo) < new Date();
const isPresent = (point) =>
  new Date(point.dateFrom) <= new Date() &&
  new Date(point.dateTo) >= new Date();

const filter = {
  [FilterType.EVERYTHING]: (points) => points,
  [FilterType.FUTURE]: (points) => points.filter(isFuture),
  [FilterType.PRESENT]: (points) => points.filter(isPresent),
  [FilterType.PAST]: (points) => points.filter(isPast),
};

const sortByDay = (pointA, pointB) =>
  dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));

const sortByPrice = (pointA, pointB) =>
  pointB.basePrice - pointA.basePrice;

const sortByDuration = (pointA, pointB) => {
  const durationA = dayjs(pointA.dateTo).diff(dayjs(pointA.dateFrom));
  const durationB = dayjs(pointB.dateTo).diff(dayjs(pointB.dateFrom));

  return durationB - durationA;
};

const sort = {
  [SortType.DAY]: (points) => [...points].sort(sortByDay),
  [SortType.TIME]: (points) => [...points].sort(sortByDuration),
  [SortType.PRICE]: (points) => [...points].sort(sortByPrice),
};

function getTripRouteTitle(points, getDestinationName) {
  const cities = sort[SortType.DAY](points)
    .map((point) => getDestinationName(point.destination))
    .filter(Boolean);

  if (cities.length === 0) {
    return '';
  }

  if (cities.length <= MAX_CITIES_IN_ROUTE) {
    return cities.join(' &mdash; ');
  }

  return `${cities[0]} &mdash;... &mdash; ${cities[cities.length - 1]}`;
}

function getTripDates(points) {
  if (points.length === 0) {
    return '';
  }

  const sortedPoints = sort[SortType.DAY](points);
  const dateFrom = sortedPoints[0].dateFrom;
  const dateTo = sortedPoints.reduce(
    (latestDate, point) => (dayjs(point.dateTo).isAfter(dayjs(latestDate)) ? point.dateTo : latestDate),
    sortedPoints[0].dateTo
  );

  const start = dayjs(dateFrom);
  const end = dayjs(dateTo);

  if (start.isSame(end, 'day')) {
    return start.format('D MMM').toUpperCase();
  }

  return `${start.format('D MMM').toUpperCase()}&nbsp;&mdash;&nbsp;${end.format('D MMM').toUpperCase()}`;
}

function getTripCost(points, offersModel) {
  return points.reduce((total, point) => {
    const offersPrice = offersModel.getByIds(point.offerIds)
      .reduce((sum, offer) => sum + offer.price, 0);

    return total + point.basePrice + offersPrice;
  }, 0);
}

export {
  DateFormat,
  generateId,
  humanizeDate,
  humanizeTime,
  humanizeDay,
  getDuration,
  filter,
  sort,
  getTripRouteTitle,
  getTripDates,
  getTripCost,
};
