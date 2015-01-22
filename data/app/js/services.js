'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('a4App.services', []).value('version', '2015-01-21');


angular.module('a4App.services').factory('AmortizationService', function($window) {
    
    return {
        
        monthlyPayment : function(amAttributes, onSuccess) {
            onSuccess(a4AmSchedule.getMonthlyPayment(amAttributes));
        },
    
    
        amSchedule : function(amAttributes, onSuccess) {
            onSuccess(a4AmSchedule.getPayments(amAttributes));
        }
                
    };

});

