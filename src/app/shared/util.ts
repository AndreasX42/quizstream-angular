import { Key } from '../models/key.model';

export class Util {
  // get the next integer to increment id
  static getNextIncrement(arr: Key[]): string {
    if (arr.length == 0) {
      return '0';
    }

    return (Math.max(...arr.map((key) => +key.id)) + 1).toString();
  }
}
