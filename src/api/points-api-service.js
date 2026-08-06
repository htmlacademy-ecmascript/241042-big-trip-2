import ApiService from '../framework/api-service.js';
import PointsModel from '../model/points-model.js';

export default class PointsApiService extends ApiService {
  getPoints() {
    return this._load({ url: 'points' })
      .then(ApiService.parseResponse);
  }

  getDestinations() {
    return this._load({ url: 'destinations' })
      .then(ApiService.parseResponse);
  }

  getOffers() {
    return this._load({ url: 'offers' })
      .then(ApiService.parseResponse);
  }

  updatePoint(point) {
    return this._load({
      url: `points/${point.id}`,
      method: 'PUT',
      body: JSON.stringify(PointsModel.adaptToServer(point)),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
      .then(ApiService.parseResponse);
  }
}
