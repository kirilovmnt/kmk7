angular.module('app.services', [])


.service('initMap', [function () {

    var initMap = this
    var mapOptions = {
        center: {
            lat: 54.5,
            lng: -4
        },
        zoom: 5,
        minZoom: 5
    }

    initMap.initIn = function (tabIndex, element) {
        if (typeof (initMap.maps) == "undefined") {
            initMap.maps = []
        }
        if (typeof (initMap.resizedMaps) == "undefined") {
            initMap.resizedMaps = []
        }
        if (typeof (initMap.markers) == "undefined") {
            initMap.markers = []
        }
        initMap.maps[tabIndex] = new google.maps.Map(element, mapOptions);
        initMap.markers[tabIndex] = new google.maps.Marker({
            title: "Your location",
            icon: "img/pinpoint.gif",
            optimized: false
        })
    }
}])

.service('geoServ', ['initMap', function (initMap) {
    var geoServ = this

    //initial location
    geoServ.setMapCenter = function (tabIndex) {
        var map = initMap.maps[tabIndex]
        var marker = initMap.markers[tabIndex]

        //getCurrentPosition success callback
        var geoSetSuccess = function (position) {
                geoServ.initialLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                geoServ.initMapSettings()
            }
            //initial map settings
        geoServ.initMapSettings = function () {
                map.setCenter(geoServ.initialLocation)
                map.setZoom(13);
                marker.setPosition(geoServ.initialLocation)
                marker.setMap(map);
            }
            //reuse initial location or set it if undefined
        if (typeof (geoServ.initialLocation) == "undefined") {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(geoSetSuccess, geoError, geoOptions)
            } else {
                alert("Your device does not support geolocation")
            }
        } else {
            geoServ.initMapSettings()
        }
    }

    //watch location
    geoServ.watchPosition = function (tabIndex) {
        var marker = initMap.markers[tabIndex]

        var geoWatchSuccess = function (position) {

            //set marker to current position
            marker.setPosition({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            })

            //for debugging purposes
            console.log(position.timestamp)
            document.getElementById("trackingSearch").value = position.timestamp
        }
        if (navigator.geolocation) {
            this.watchID = navigator.geolocation.watchPosition(geoWatchSuccess, geoError, geoOptions)
        } else {
            alert("Your device does not support geolocation")
        }
    }

    //error callback for unsuccessfull geolocation requests
    var geoError = function (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                alert("User denied the request for Geolocation.")
                break;
            case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable.")
                break;
            case error.TIMEOUT:
                alert("The request to get user location timed out.")
                break;
            case error.UNKNOWN_ERROR:
                alert("An unknown error occurred.")
                break;
        }
    }

    //options for geolocation requests
    var geoOptions = {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 27000
    }
}])

.service('mapResize', ['initMap', '$window', function (initMap, $window) {
    var mapResize = this
    angular.element($window).bind('resize', function () {
        mapResize.windowResized = true
        console.log("window resized")
        for (i = 0; i < initMap.maps.length; i++) {
            initMap.resizedMaps[i] = false
        }
    })
    mapResize.thisMap = function (tabIndex) {
        if (mapResize.windowResized == true) {
            if (initMap.resizedMaps[tabIndex] == false) {
                google.maps.event.trigger(initMap.maps[tabIndex], 'resize')
                initMap.resizedMaps[tabIndex] = true
                console.log("map resized")
            }
        }
    }
}])

.service('infoWindow', [function () {
    this.showFor = function (map, busStop, status) {
        if (status) {
            busStop.infowindow.open(map, busStop.marker)
        } else {
            busStop.infowindow.close()
        }
    }
}])

//Transport API queries, handled by asynchronous services with promises
.service('queryApi', ['$state', '$q', 'infoWindow', function ($state, $q, infoWindow) {

    var queryApi = this
    var app_id = queryApi.app_id = "928e6aca"
    var app_key = queryApi.app_key = "aa747294d32b6f68b6a827ed7f79242f"

    //API query for nearest bus stops
    queryApi.nearStops = function (coords, range, map) {
        var deferred = $q.defer();
        var baseUrl = "https://transportapi.com/v3/uk/bus/stops/near.json?"
        var url = baseUrl + "app_id=" + app_id + "&app_key=" + app_key + "&lat=" + coords.lat + "&lon=" + coords.lng + "&page=1" + "&rpp=" + range + "&callback=?"
        if (typeof (queryApi.nearStops.stopsList) != "undefined") {
            var list = queryApi.nearStops.stopsList
            for (i = 0; i < list.length; i++) {
                list[i].marker.setMap(null)
            }
        }
        $.getJSON(url, function (data) { //jQuery AJAX deals easier with CORS issues
            console.log(url)
            for (var i = 0; i < data.stops.length; i++) {
                var busStop = data.stops[i]
                busStop.marker = new google.maps.Marker({
                    position: new google.maps.LatLng(busStop.latitude, busStop.longitude),
                    map: map
                })
                busStop.infowindow = new google.maps.InfoWindow({
                    content: busStop.indicator + " " + busStop.name
                })
            }
            queryApi.nearStops.stopsList = data.stops
            deferred.resolve(queryApi.nearStops.stopsList) //deferred promise value
        })
        return deferred.promise
    }

    //API query for particular bus stops's list of servicing buses
    queryApi.findBuses = function (busStop, map, nextBuses) {
        var deferred = $q.defer();

        if (typeof (busStop.busesList) == "undefined") {
            var useNextBuses = prompt("Do you want to use NextBuses API\nfor this query?\n(limited queries due to charges)\nType 'yes' if you do:")
            if (useNextBuses == "yes" || useNextBuses == 'y') {
                var useAPI = "yes"
                var requestFor = "/live.json?"
            } else {
                var useAPI = "no"
                var requestFor = "/timetable.json?" //the timetable request provides inbound/outbound information
            }
        }
        var baseUrl = "https://transportapi.com/v3/uk/bus/stop/"
        var url = baseUrl +
            busStop.atcocode +
            requestFor +
            "app_id=" + app_id +
            "&app_key=" + app_key +
            "&nextbus=" + useAPI + "&callback=?"

        if (typeof (busStop.busesList) == "undefined") {
            $.getJSON(url, function (data, status) { //jQuery AJAX deals easier with CORS issues
                console.log(url)
                var busesList = []
                Object.keys(data.departures).forEach(function (key, index) {
                    var bus = data.departures[key][0]
                    busesList.push(bus)
                })
                infoWindow.showFor(map, busStop, true)
                queryApi.findBuses.busesList = busesList
                deferred.resolve(queryApi.findBuses.busesList) //deferred promise value
            })
        }
        return deferred.promise
    }
}])
