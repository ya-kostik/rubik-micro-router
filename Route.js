const path2regexp = require('path-to-regexp');

const RouteError = require('./RouteError.js');

/**
 *
 * @typedef {Object} RouteHash
 * @prop {String}   method is one of http methods (GET, POST etc), if is not defined
 * @prop {Function} handler is a function for handle this route
 * @prop {String}   path
 * @prop {Boolean} [next=false]    process next route or middlewares
 */

/**
 * Route for rubik micro server
 * @class
 * @param {RouteHash} route
 * @prop {String}   method is one of http methods (GET, POST etc)
 * @prop {Function} handler is a function for handle this route
 * @prop {String}   path
 * @prop {Boolean} [next=false]    process next route or middlewares
 */
class Route {
  constructor({ method, path, handler, next }) {
    this.method = method;
    this.handler = handler;
    this.path = path;
    this.next = !!next;

    this.before = new Middlewares();
    this.after = new Middlewares();
  }

  set path(path) {
    if (!path) throw new RouteError('Path is empty or not defined');
    this.keys = [];
    this.regexp = path2regexp(path, this.keys);
    this._path = path;
  }

  get path() {
    return this._path;
  }

  set method(method) {
    this._method = method ? method.toLowerCase() : null;
  }

  get method() {
    return this._method;
  }

  /**
   * Check route path
   * @prop {String}   method is one of http methods (GET, POST etc), if is not defined
   * @prop {String}   path
   * @return {Boolean}
   */
  match(path, method) {
    if (!path) return null;
    if (this._method) {
      if (!method) throw new RouteError('Method is invalid or not defined');
      if (this._method !== method.toLowerCase()) return null;
    }

    const match = this.regexp.exec(path);
    if (!match) return null;
    return this.keys.reduce((step, next, index) => {
      step[next.name] = match[index + 1];
      return step;
    }, {});
  }

  /**
   * Handle route
   * @param  {http.Request}  req
   * @param  {http.Response} res
   * @param  {Micro}  micro
   * @return {Promise}
   */
  async handle(req, res, micro) {
    return this.handler(req, res, micro);
  }

  /**
   * Process route
   * @param  {http.Request}  req
   * @param  {http.Response} res
   * @param  {Micro}  micro
   * @return {Promise|null}
   */
  process(req, res, micro) {
    const match = this.match(req.pathname, req.method);
    if (!match) return null;
    req.params = match;
    return this.handle(req, res, micro);
  }
}

module.exports = Route;
