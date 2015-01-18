'use strict';

var app = angular.module('a4App', ['a4App.filters', 'a4App.services', 'a4App.directives', 'ngResource', 'ui']);

app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/amortizationCalculator', {templateUrl: 'partials/amortizationCalculator.html', controller: AmortizationCalculatorCtrl});
    $routeProvider.otherwise({redirectTo: '/amortizationCalculator'});
  }]);

