var a4AmSchedule = (function () {

    //public class AmortizationAttributes {
    //private Money loanAmount; // original principal amount
    //private Money regularPayment; // monthly payment to be made, assumed monthly
    //private LocalDate startDate; // loan start date
    //private LocalDate adjustmentDate; // date from which amortization calculations commence
    //private int termInMonths; // number of months from the adjustment date at which amortization stops and remaining principal is due
    //private boolean interestOnly; // true if this is an interest only calculation (ie no amortization)
    //private int amortizationPeriodMonths; // number of months over which to amortize the payments. If payments are made till this date, principal remaining will be 0
    //private int compoundingPeriodsPerYear; // number of times a year interest compounding is calculated. Canadian rules: 2 (semi-annually). American rules: 12 (monthly)
    //private double interestRate; // the nominal interest rate being paid (effective rate can be higher if compounding)


//    Number.prototype.formatMoney = function (decPlaces, thouSeparator, decSeparator) {
//        var n = this,
//                decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
//                decSeparator = decSeparator == undefined ? "." : decSeparator,
//                thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
//                sign = n < 0 ? "-" : "",
//                i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
//                j = (j = i.length) > 3 ? j % 3 : 0;
//        return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
//    };
    

    /**
     * Add months to a date, handle edge end of month cases (i.e. Jan 30 = 1 month => Feb 28)
     * 
     * @param {date} dt
     * @param {int} monthOffset
     * @returns {Date}
     */
    var _calcMonthsNoRollover = function(dt, monthOffset) {
        
        var inDate = new Date(dt.substring(0, 4), dt.substring(5, 7) - 1, dt.substring(8,10));
        var outDate = new Date(inDate.getTime());
        outDate.setMonth(inDate.getMonth()+ monthOffset) ;
        if (outDate.getDate() < inDate.getDate()) {
            outDate.setDate(0);
        }
        return outDate;
    };

    
    
    /**
     * Retrieve the interest rate for the compounding period based on the annual interest rate.
     *
     * @param annualInterestRatePercent input annual interest rate as a percent (ie 8.25 for 8.25%)
     * @param compoundPeriodsPerYear 2 if compounding semi-annually, 12 if compounding monthly
     * @return interest rate as a decimal (ie .125 for 12.5%)
     */
    var _getPeriodRate = function (annualInterestRatePercent, compoundPeriodsPerYear) {
        return Math.pow(1 + annualInterestRatePercent / (compoundPeriodsPerYear * 100.0), compoundPeriodsPerYear / 12.0) - 1;
    };


    /**
     * Given an amount and an annual interest rate, return the monthly payment
     * for an interest only loan.
     *
     * @param amount the principal amount
     * @param rate the annual interest rate expressed as a percent
     * @return Raw amount with fractional units representing
     * the monthly interest charge.
     */
    var _getInterestOnlyMonthlyPayment = function (amount, rate) {
        // percent to decimal, annual rate to period (monthly) rate
        return amount * rate / 100. / 12.;
    };



    /**
     * Given an amount and an annual interest rate, return the monthly payment
     * for an interest only loan.
     *
     * @param loanAmount the principal
     * @param i the interest rate expressed as a percent
     * @param compoundPeriodsPerYear The number of times a year interest is calculated
     * Canadian law specifies semi-annually (ie 2x a year). Americans
     * typically use monthly (ie 12x a year)
     * @param amortizationPeriod The number of months the loan is spread over
     *
     * @return The expected monthly payment amortized over the given period.
     */
    var _getAmortizedMonthlyPayment = function (
            loanAmount,
            i,
            compoundPeriodsPerYear,
            amortizationPeriod) {

        a = loanAmount;
        // periodRate
        j = _getPeriodRate(i, compoundPeriodsPerYear);
        //Math.pow( (1 + i/(compoundPeriodsPerYear*100.0)), (compoundPeriodsPerYear/12.0) ) - 1;
        // double j = Math.pow( (1 + i/200.0), (1.0/6.0) ); // Canadian simplified
        // periods per year (ie monthly payments)
        n = 12;
        // amortization period in years
        y = amortizationPeriod / 12.0;
        
        monthlyPayment = a * (j) / (1.0 - Math.pow(j + 1.0, -n * y));
        
        return monthlyPayment;
    };


    var _getInterestOnlyPayments = function(amAttrs) {
        
        var monthlyPayment = getMonthlyPayment(amAttrs);
        var paymentList = [];
        
        for (paymentNumber = 1; paymentNumber <= amAttrs.termInMonths; paymentNumber++) {
            var payment = {};
            payment.paymentNumber = paymentNumber;
            payment.date = _calcMonthsNoRollover(amAttrs.adjustmentDate, paymentNumber);
            payment.interest = monthlyPayment;
            payment.principal = 0;
            payment.balance = amAttrs.loanAmount;
            paymentList.push(payment);
        }
        
        return paymentList;
        
    };    
    
    
    
    var _getAmortizedPayments = function(amAttrs) {
        
        // Calculate regular payment amounts
        
        var balance = amAttrs.loanAmount;
        var monthlyPayment = getMonthlyPayment(amAttrs);
        var thePayment = amAttrs.regularPayment;
        
        if ( Math.ceil((thePayment - monthlyPayment) * 100) * 100 <= 0 ) {
            // The payment has to be at least as much as the calculated monthly payment
            thePayment = monthlyPayment;
        }
        
        // var overpayment = thePayment - monthlyPayment;


        var paymentList = [];
        
        var j = _getPeriodRate(amAttrs.interestRate, amAttrs.compoundingPeriodsPerYear);

        for (paymentNumber = 1; paymentNumber <= amAttrs.termInMonths && balance > 0; paymentNumber++) {
            
            var payment = {};
            
            payment.paymentNumber = paymentNumber;
            payment.date = _calcMonthsNoRollover(amAttrs.adjustmentDate, paymentNumber);
            payment.interest = balance * j;
            payment.principal = thePayment - payment.interest;
            if (payment.principal > balance) {
                payment.principal = balance;
            }
            balance = balance - payment.principal;
            payment.balance = balance;
            
            paymentList.push(payment);
        }
        
        return paymentList;
        
    };
    
    
    var getMonthlyPayment = function (amAttrs) {

        var periodicPayment = amAttrs.interestOnly ?
            _getInterestOnlyMonthlyPayment(amAttrs.loanAmount, amAttrs.interestRate) :
            _getAmortizedMonthlyPayment(
                 amAttrs.loanAmount
                ,amAttrs.interestRate
                ,amAttrs.compoundingPeriodsPerYear
                ,amAttrs.amortizationPeriodMonths
                );
        
        return Math.ceil(periodicPayment * 100) / 100;
    };
    

    /**
     * Generate an ordered list of payments forming an amortization schedule.
     *
     * If the payment is greater than the regular calculated amortization payment,
     * then the monthly surplus is used as extra principal payment.
     *
     * If the payment is less than the regular monthly amortization payments,
     * then the supplied payment is ignored and a regular schedule is generated.
     *
     * @param amAttrs
     *
     * @return An ordered list of payments which comprise the set of regular
     * payments fulfilling the terms of the given amortization parameters.
     */
    var getPayments = function (amAttrs) {
        return amAttrs.interestOnly ?
                _getInterestOnlyPayments(amAttrs) :
                _getAmortizedPayments(amAttrs);
    };
    
    
  return {
    getMonthlyPayment: getMonthlyPayment,
    getPayments: getPayments
  };

})();