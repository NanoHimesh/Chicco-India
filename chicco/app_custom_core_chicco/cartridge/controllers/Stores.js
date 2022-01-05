'use strict';

var storeHelpers = require('*/cartridge/scripts/helpers/customStoreHelper');
var googleService = require('*/cartridge/scripts/googleMapService');

var ZERO_RESULTS = 'ZERO_RESULTS';

var server = require('server');
var page = module.superModule;
server.extend(page);

/**
 * Find route : Searches for stores calling getStores method from storeHelpers using the geo location.
 * It renders the storelocator.
 */
server.append('Find', function (req, res, next) {

    var viewData = res.getViewData();

    viewData = {
        findPage: true
    };

    res.setViewData(viewData);
    next();
});

/**
 * FindStores route : Searches for stores calling getStores method from storeHelpers
 * using the longitude & latitude returned by the Google GeoCode API.
 * It returns the store data as JSON.
 */
server.replace('FindStores', function (req, res, next) {

    var radius = req.querystring.radius;
    var showMap = req.querystring.showMap;
    var queryAddress = req.querystring.postalCode;
    var viewData = res.getViewData();

    var stores = null;
    var status = null;

    if (queryAddress) {
        //Custom Start: Updated the regex of the queryAddress
        queryAddress = queryAddress.replace(/[\s,]+/g, '+').trim();
        //Custom End
    }

    if (queryAddress) {
        var params = {
            countryCodeFromRequest: 'IN',
            address: queryAddress
        };

        var googleServiceObject = googleService.getCoordinates();
        googleServiceObject.setURL(googleServiceObject.getURL() + '&address=' + params.address);
        var googleServiceResultObj = googleServiceObject.call(params);

        //Custom Start: Initialize the status variable
        status = googleServiceResultObj.object.status;
        //Custom End

        if (googleServiceResultObj.status === 'OK' && googleServiceResultObj.object.status !== ZERO_RESULTS) {
            var googleServiceResult = googleServiceResultObj.object.results[0];

            if (googleServiceResult) {
                stores = storeHelpers.getStores(radius,
                    googleServiceResult.geometry.location.lat,
                    googleServiceResult.geometry.location.lng,
                    req.geolocation,
                    'IN',
                    showMap,
                    null,
                    status);
                res.json(stores);
            }
        } else if (googleServiceResultObj && (googleServiceResultObj.status !== 'OK' || googleServiceResultObj.object.status === ZERO_RESULTS)) {
            status = googleServiceResultObj.object.status;
            stores = storeHelpers.getStores(radius, null, null, null, null, showMap, null, googleServiceResultObj.object.status);
            res.json(stores);
        } else {
            stores = storeHelpers.getStores(radius, null, null, req.geolocation, null, showMap, null, status);
            res.json(stores);
        }
    } else {
        stores = storeHelpers.getStores(radius, req.querystring.lat, req.querystring.long, req.geolocation, null, showMap, null, status);
        res.json(stores);
    }

    //Custom Start: Adding the custom attribute to check its page stage
    viewData = {
        findPage: false
    };
    //Custom End

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
