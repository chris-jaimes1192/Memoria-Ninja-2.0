import { IStorageRepository } from '../domain/IStorageRepository.js';

export class LocalStorageRepository extends IStorageRepository {
  getItem(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  removeItem(key) {
    localStorage.removeItem(key);
  }
}