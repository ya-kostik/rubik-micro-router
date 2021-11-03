const { Kubik } = require('rubik-main');

const RouterError = require('./RouterError.js');
const Route = require('./Route.js');

class MicroRouter extends Kubik {
  constructor(routes = []) {
    super(...arguments);
    this.reset();
    this.use(routes);
  }

  get middleware() {
    if (this._middleware) return this._middleware;

    return this._middleware = async (req, res, micro) => {
      if (!req.pathname) {
        this.parseUrl(req);
      }
      const promisses = [];
      for (const route of this.routes) {
        const handle = route.process(req, res, micro);
        if (!handle) continue;
        promisses.push(handle);
        if (route.next) continue;
        break;
      }
      if (!promisses.length) throw new RouterError(405, 'Route not found');
      await Promise.all(promisses);
      return true;
    };
  }

  parse(routes) {
    if (!Array.isArray(routes)) return;
    routes.forEach(this.parseOne, this);
  }

  parseOne(route) {
    this.routes.push(new Route(route));
  }

  reset() {
    this.routes = [];
  }

  applyExtensions(extensions) {
    extensions.forEach(this.applyExtension, this);
  }

  applyExtension(extension) {
    if (Array.isArray(extension)) this.parse(extension);
    else this.parseOne(extension);
  }

  async up({ http }) {
    await this.processHooksAsync('before');
    Object.assign(this, { http });
    this.applyExtensions(this.extensions);
  }

  down() {
    this.reset();
  }

  async after() {
    await this.processHooksAsync('after');
    this.http.use(this.middleware);
  }
}

MicroRouter.prototype.dependencies = Object.freeze(['http']);
MicroRouter.RouterError = RouterError;
module.exports = MicroRouter;
