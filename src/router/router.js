
function Router(routes) {
  try {
    if (!routes) {
      throw 'error: routes param is mandatory';
    }
    this.constructor(routes);
    this.init();
  } catch (e) {
    console.error(e);
  }
}

Router.prototype = {
  routes: undefined,
  rootElem: undefined,
  constructor(routes) {
    this.routes = routes;
    this.rootElem = document.getElementById('app');
  },
  init() {
    const r = this.routes;
    (function (scope, r) {
      window.addEventListener('hashchange', (e) => {
        scope.hasChanged(scope, r);
      });
    }(this, r));
    this.hasChanged(this, r);
  },
  hasChanged(scope, r) {
    if (window.location.hash.length > 0) {
      for (var i = 0, { length } = r; i < length; i++) {
        var route = r[i];
        if (route.isActiveRoute(window.location.hash.substr(1))) {
          scope.goToRoute(route.htmlName);
        }
      }
    } else {
      for (var i = 0, { length } = r; i < length; i++) {
        var route = r[i];
        if (route.default) {
          scope.goToRoute(route.htmlName);
        }
      }
    }
  },
  goToRoute(htmlName, callback) {
    (function (scope) {
      const url = `views/${htmlName}`;
      const xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
          scope.rootElem.innerHTML = this.responseText;
        }
      };
      xhttp.open('GET', url, true);
      xhttp.send();
      xhttp.onload = function (e) {
        if (xhttp.readyState === 4) {
          if (xhttp.status === 200) {
            if (typeof callback === 'function') {
              callback();
            }
          }
        }
      };
    }(this));
  },
};

export default Router;
