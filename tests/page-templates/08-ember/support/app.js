/* global Ember,App */
window.App = Ember.Application.create({
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true
});

Ember.Handlebars.helper("random", function() {
  return new Ember.Handlebars.SafeString(Math.floor(Math.random() * 1000 * 1000) + "");
});
App.ApplicationRoute = Ember.Route.extend({
  init: function() {
    var router = this;

    this._super.apply(arguments);
    Ember.run.scheduleOnce("afterRender", function() {
      if (typeof window.ember_nav_routes !== "undefined" && BOOMR.utils.isArray(window.ember_nav_routes)) {
        BOOMR.subscribe("onbeacon", function(beacon) {
          // only continue for non-early SPA beacons
          if (!BOOMR.utils.inArray(beacon["http.initiator"], BOOMR.constants.BEACON_TYPE_SPAS) ||
              typeof beacon.early !== "undefined") {
            return;
          }

          if (window.ember_nav_routes.length > 0) {
            var nextRoute = window.ember_nav_routes.shift();

            setTimeout(function() {
              router.transitionTo(nextRoute);
            }, 100);
          }
        });
      }
    });
  },
  actions: {
    willTransition: function(transition) {
      // Ember 1.x issues History API calls after the transition is complete (after XHRs and mutations).
      // To work around this, we set auto:false and manually issue route changes
      // for spa soft routes
      BOOMR.plugins.SPA.route_change();
    }
  }
});

App.WidgetsRoute = Ember.Route.extend({
  beforeModel: function() {
    return Ember.$.get("support/widgets.html?rnd=" + Math.random()).then(function(data) {
      Ember.TEMPLATES.widgets = Ember.Handlebars.compile(data);
    });
  },
  model: function() {
    return Ember.$.getJSON("support/widgets.json?rnd=" + Math.random());
  }
});

App.WidgetsWidgetRoute = Ember.Route.extend({
  beforeModel: function() {
    return Ember.$.get("support/widget.html?rnd=" + Math.random()).then(function(data) {
      Ember.TEMPLATES.widget = Ember.Handlebars.compile(data);
    });
  },
  model: function(params)  {
    return Ember.$.getJSON("support/widgets.json?rnd=" + Math.random()).then(function(data) {
      var model;

      // these overwrite what was in the HTML
      window.custom_metric_1 = params.id;
      window.custom_metric_2 = function() {
        return 10 * params.id;
      };

      window.custom_timer_1 = params.id;
      window.custom_timer_2 = function() {
        return 10 * params.id;
      };

      model = data.filter(function(widget) {
        return String(widget.id) === params.id;
      })[0];
      model.carttotal = 11.11 * params.id;

      return model;
    });
  }
});

App.WidgetRoute = App.WidgetsWidgetRoute;

App.HomeRoute = Ember.Route.extend({
  beforeModel: function() {
    if (!Ember.TEMPLATES.home) {
      return Ember.$.get("support/home.html?rnd=" + Math.random()).then(function(data) {
        Ember.TEMPLATES.home = Ember.Handlebars.compile(data);
      });
    }
  },
  model: function() {
    return Ember.$.getJSON("/delay?delay=250&file=/pages/08-ember/support/widgets.json?rnd=" + Math.random()).then(function(data) {
      var model = {};

      model.widgets = data;
      model.imgs = typeof window.imgs !== "undefined" ? window.imgs : [0];
      console.log(model.imgs);
      model.hide = model.imgs[0] === -1;
      model.rnd = Math.random();

      // these overwrite what was in the HTML
      window.custom_metric_1 = 11;
      window.custom_metric_2 = function() {
        return 22;
      };

      window.custom_timer_1 = 11;
      window.custom_timer_2 = function() {
        return 22;
      };

      if (typeof window.performance !== "undefined" &&
          typeof window.performance.mark === "function") {
        window.performance.mark("mark_usertiming");
      }

      return model;
    });
  }
});

App.EmptyRoute = Ember.Route.extend({
  beforeModel: function() {
  },
  model: function() {
    return {};
  }
});

App.Router.map(function() {
  this.resource("widgets");
  this.resource("widget", {path: "widgets/:id"});

  this.resource("empty", { path: "empty" });

  this.route("home", { path: "" });

  var hadRouteChange = false;
  var hadRouteChangeToggle = function() {
    hadRouteChange = true;
  };

  if (App.ApplicationRoute) {
    App.ApplicationRoute.reopen({
      activate: hadRouteChangeToggle
    });
  }
  else {
    App.ApplicationRoute = Ember.Route.extend({
      activate: hadRouteChangeToggle
    });
  }

  var hookOptions = {};

  if (window.ember_route_wait) {
    hookOptions.routeChangeWaitFilter = window.ember_route_wait;
  }

  if (window.ember_route_filter) {
    hookOptions.routeFilter = window.ember_route_filter;
  }

  function hookEmberBoomerang() {
    if (window.BOOMR && BOOMR.version) {
      if (BOOMR.plugins && BOOMR.plugins.Ember) {
        BOOMR.plugins.Ember.hook(App, hadRouteChange, hookOptions);
      }

      return true;
    }
  }

  if (!window.disableBoomerangHook) {
    if (!hookEmberBoomerang()) {
      if (document.addEventListener) {
        document.addEventListener("onBoomerangLoaded", hookEmberBoomerang);
      }
      else if (document.attachEvent) {
        document.attachEvent("onpropertychange", function(e) {
          e = e || window.event;

          if (e && e.propertyName === "onBoomerangLoaded") {
            hookEmberBoomerang();
          }
        });
      }
    }
  }
});

if (window.html5_mode) {
  App.Router.reopen({
    location: "history",
    rootURL: ""
  });
}
