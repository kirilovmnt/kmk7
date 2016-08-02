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

.service('geoServ', ['$ionicPopup', '$q', 'initMap', function ($ionicPopup, $q, initMap) {
    var geoServ = this


    //initial location
    geoServ.initLocation = function (tabIndex) {
        var deferred = $q.defer();
        geoServ.initLocation.loading = true
        var map = initMap.maps[tabIndex]
        var marker = initMap.markers[tabIndex]

        //getCurrentPosition success callback
        var geoSetSuccess = function (position) {
                geoServ.initCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                geoServ.initLocation.loading = false
                geoServ.initMapSettings()
                deferred.resolve(geoServ.initCoords)
            }
            //initial map settings
        geoServ.initMapSettings = function () {
                map.setCenter(geoServ.initCoords)
                map.setZoom(13);
                marker.setPosition(geoServ.initCoords)
                marker.setMap(map);
            }
            //reuse initial location or set it if undefined
        if (typeof (geoServ.initCoords) == "undefined") {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(geoSetSuccess, geoError, geoOptions)
            } else {
                $ionicPopup.alert({
                    title: "Geolocation",
                    template: "Your device does not support geolocation"
                });
            }
        } else {
            geoServ.initMapSettings()
        }
        return deferred.promise
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
            $ionicPopup.alert({
                title: "Geolocation",
                template: "Your device does not support geolocation"
            });
        }
    }

    //error callback for unsuccessfull geolocation requests
    var geoError = function (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:

                $ionicPopup.alert({
                    title: "Geolocation error",
                    template: "User denied the request for Geolocation."
                });
                break;
            case error.POSITION_UNAVAILABLE:
                $ionicPopup.alert({
                    title: "Geolocation error",
                    template: "Location information is unavailable."
                });
                break;
            case error.UNKNOWN_ERROR:
                $ionicPopup.alert({
                    title: "Geolocation error",
                    template: "An unknown error occurred."
                });
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
.service('queryApi', ['$state', '$q', '$http', '$ionicPopup', 'infoWindow', function ($state, $q, $http, $ionicPopup, infoWindow) {

    var queryApi = this
    var app_id = queryApi.app_id = "928e6aca"
    var app_key = queryApi.app_key = "aa747294d32b6f68b6a827ed7f79242f"

    //API query for nearest bus stops
    queryApi.nearStops = function (coords, range, map) {

        var deferred = $q.defer();
        var baseUrl = "https://transportapi.com/v3/uk/bus/stops/near.json?"
        var url = baseUrl +
            "app_id=" + app_id +
            "&app_key=" + app_key +
            "&lat=" + coords.lat +
            "&lon=" + coords.lng +
            "&page=1" +
            "&rpp=" + range + "&callback=JSON_CALLBACK"
        if (typeof (queryApi.nearStops.stopsList) != "undefined") {
            var list = queryApi.nearStops.stopsList
            for (i = 0; i < list.length; i++) {
                list[i].marker.setMap(null)
            }
        }
        $http.jsonp(url)
            .success(function (data) {
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

            var confirmPopup = $ionicPopup.confirm({
                title: "Use NextBuses live data",
                template: "Do you want to use live departures data from NextBuses for this query?<br>(limited queries due to charges)",
                cancelText: "No",
                okText: "Yes"
            });
            confirmPopup.then(function (res) {
                if (res) {
                    var useAPI = "yes"
                    var requestFor = "/live.json?"
                } else {
                    var useAPI = "no"
                    var requestFor = "/timetable.json?" //the timetable request provides inbound/outbound information
                }
                var baseUrl = "https://transportapi.com/v3/uk/bus/stop/"
                var url = baseUrl +
                    busStop.atcocode +
                    requestFor +
                    "app_id=" + app_id +
                    "&app_key=" + app_key +
                    "&nextbus=" + useAPI + "&callback=JSON_CALLBACK"
                console.log(url)

                var busesList = []
                $http.jsonp(url)
                    .success(function (data) {
                        Object.keys(data.departures).forEach(function (key, index) {
                            var bus = data.departures[key][0]
                            busesList.push(bus)
                        })
                        busesListReady(busesList)
                    })
                    .error(function () {
                        busesListReady(busesList)
                    })

                function busesListReady(list) {
                    infoWindow.showFor(map, busStop, true)
                    queryApi.findBuses.busesList = busesList
                    deferred.resolve(queryApi.findBuses.busesList) //deferred promise value
                }
            })
        }
        return deferred.promise
    }
}])

//set the search mode
.service('searchMode', ['$ionicScrollDelegate', '$location', 'geoServ', function ($ionicScrollDelegate, $location, geoServ) {
    var searchMode = this
    searchMode.onchange = function (mode, inputElement, map) {
        searchMode.searchCoords = {}
        inputElement.value = null
        google.maps.event.clearListeners(map, 'click')
        if (searchMode.tapMarker) {
            searchMode.tapMarker.setMap(null)
        }

        if (mode == "mapTap") {
            $location.hash(map.getDiv().id)
            $ionicScrollDelegate.anchorScroll(true)
            google.maps.event.addListener(map, 'click', function (e) {
                var tapCoords = {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng()
                }
                if (typeof (searchMode.tapMarker) == "undefined") {
                    searchMode.tapMarker = new google.maps.Marker({
                        position: tapCoords,
                        map: map,
                        icon: "img/blue-dot.png"
                    });
                }
                inputElement.value = tapCoords.lat + ", " + tapCoords.lng
                searchMode.tapMarker.setPosition(tapCoords)
                searchMode.tapMarker.setMap(map)
            })
        } else if (mode == "nearby") {
            if (geoServ.initCoords) {
                inputElement.value = geoServ.initCoords.lat + ", " + geoServ.initCoords.lng
            }
        } else if (mode == "address") {
            if (typeof (searchMode.address) != "undefined") {
                if (!inputElement.value) {
                    inputElement.value = searchMode.address.formatted_address
                }
            }
        }
    }
}])

.service('noInfo', ['$ionicPopup', function ($ionicPopup) {
    this.noBusesAlert = function () {
        $ionicPopup.alert({
            title: "No Information",
            template: "The reasons for missing information might be:<br>" +
                "&nbsp;&nbsp;1. No services today<br>" +
                "&nbsp;&nbsp;2. No services at this time<br>" +
                "&nbsp;&nbsp;3. This bus is labelled as 'deleted' in NaPTAN's database<br>" +
                "&nbsp;&nbsp;4. Connection fail"
        });
    }
}])

.service('geoCoder', ['$q', '$http', 'searchMode', function ($q, $http, searchMode) {
    var geoCoder = this
    geoCoder.query = function (searchInput) {
        var deferred = $q.defer()
        if (typeof (searchMode.address) != "undefined" &&
            (searchMode.lastAddressSearch.includes(searchInput) ||
                searchMode.lastFormattedAddress.includes(searchInput))) {
            deferred.resolve(false)
        } else {
            geoCoder.sameAddress = false
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + searchInput + "&key=AIzaSyDCufJBM-6w0uYLjXtSHQW7BawJEsB4i8o&callback=JSON_CALLBACK"
            console.log(url)
            $http.get(url)
                .success(function (data) {
                    console.log(data)
                    if (data.status == "ZERO_RESULTS") {
                        $ionicPopup.alert({
                            title: "No results!",
                            template: "The specified address/postcode was not found.<br>Try again or change the search method!"
                        });
                    } else {
                        deferred.resolve(data.results)
                    }
                })
        }
        return deferred.promise
    }
}])
