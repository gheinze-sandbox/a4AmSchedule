'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('a4App.services', []).value('version', '0.1');


angular.module('a4App.services').factory('AmortizationService', function($http, $window) {
    
    return {
        
        monthlyPayment : function(amAttributes, onSuccess) {
            onSuccess(a4AmSchedule.getMonthlyPayment(amAttributes));
        },
    
    
        amSchedule : function(amAttributes, onSuccess) {
            onSuccess(a4AmSchedule.getPayments(amAttributes));
        },
    

        // For pdf functionality, post the attributes to the server. Then open
        // a new browser window requesting the doc id returned by the previous post.
        amSchedulePdf : function(amAttributes) {
            
            var httpPostConfig = {
                method: 'POST'
                        , url: 'http://glenn-think.accounted4.com:8443/accounted4-midtier/amortization/prepareSchedule'
                        , withCredentials: true
                        , data: amAttributes
            };

            $http(httpPostConfig).success(
                    
                    function(data, status, headers, config) {
                        var url = "http://glenn-think.accounted4.com:8443/accounted4-midtier/amortization/showSchedule/pdf/" + data.id;
                        $window.open(url);
                    }
                
                ).error(
                        
                    function(data, status, headers, config) {
                        alert("Amortization service failed to return amortization schedule.");
                    }
                
                );
            
        }
                
                
                
    };

});

