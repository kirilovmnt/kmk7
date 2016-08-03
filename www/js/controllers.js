angular.module('app.controllers', [])

.controller('trackingCtrl', function (
    $scope,
    $state,
    $window,
    //    $ionicSideMenuDelegate,
    $ionicScrollDelegate,
    $ionicTabsDelegate,
    $location,
    $ionicPopup,
    $q,
    $http,
    initMap,
    geoServ,
    mapResize,
    queryApi,
    infoWindow,
    searchMode,
    geoCoder,
    noInfo,
    timestamp
) {
    var trackCtrl = this
    var thisTab = $ionicTabsDelegate.selectedIndex()
    var thisDomElement = document.getElementById("map")
    initMap.initIn(thisTab, thisDomElement)
    geoServ.initLocation(thisTab)
        .then(function (initCoords) {
            $scope.initCoords = initCoords
            $scope.searchCoords = $scope.initCoords
            document.getElementById("trackingSearch").value = initCoords.lat + ", " + initCoords.lng
        })
    var map = initMap.maps[thisTab]
    $scope.searchInput = $scope.searchMode = {}
    $scope.searchMode.mode = "nearby"
    $scope.$on('$ionicView.afterEnter', function () {
        mapResize.thisMap(thisTab)
        if (geoServ.initCoords && $scope.searchMode.mode == "nearby") {
            document.getElementById("trackingSearch").value = geoServ.initCoords.lat + ", " + geoServ.initCoords.lng
        }

    });
    $scope.noInfoAlert = function () {
        noInfo.noBusesAlert()
    }
    $scope.showStopsList = true
    $scope.stopsRange = document.getElementById("stops-range").value
    $scope.rangeChange = function (value) {
        $scope.stopsRange = value
    }
    $scope.$watch('searchInput.value', function (newVal, oldVal) {
        if ($scope.searchMode.mode == "address" &&
            oldVal &&
            !(oldVal.includes(newVal))) {
            $scope.showSuggestions = false
            $scope.suggestions = []
        }
    })
    $scope.searchModeChange = function (mode) {
        searchMode.onchange(mode, document.getElementById("trackingSearch"), map)
    }
    $scope.selectSuggestion = function (address) {
        searchMode.address = address
        searchMode.lastAddressSearch = $scope.searchInput.value
        $scope.searchInput.value = address.formatted_address
        searchMode.lastFormattedAddress = address.formatted_address
        $scope.searchCoords = address.geometry.location
        $scope.showSuggestions = false
        $scope.nearStops()
    }
    $scope.accordionInfoWindows = function (busStop) {
        if ($scope.isBusesListShown(busStop.busesList)) {
            $scope.shownBusesList = null;
            infoWindow.showFor(map, busStop, false)
        } else {
            $scope.shownBusesList = busStop.busesList
            infoWindow.showFor(map, busStop, true)
            for (var i = 0; i < $scope.busStopsList.length; i++) {
                if (busStop.atcocode != $scope.busStopsList[i].atcocode) {
                    infoWindow.showFor(map, $scope.busStopsList[i], false)
                }
            }
        }
    }
    $scope.geoCoder = function () {
        var searchInput = document.getElementById("trackingSearch").value
        geoCoder.query(searchInput)
            .then(function (suggestions) {
                if (suggestions) {
                    $scope.suggestions = suggestions
                    $scope.showSuggestions = true
                    $state.go($state.current, {}, {
                        reload: true
                    });
                } else {
                    $scope.selectSuggestion(searchMode.address)
                }
            })
    }
    $scope.isBusesListShown = function (list) {
        if ($scope.shownBusesList) {
            return $scope.shownBusesList === list;
        } else {
            return false
        }
    }
    $scope.nearStops = function () {
        if ($scope.searchMode.mode != "address") {
            var latLng = document.getElementById("trackingSearch").value.split(",")
            $scope.searchCoords = {
                lat: Number(latLng[0]),
                lng: Number(latLng[1])
            }
        }
        var range = $scope.stopsRange
        queryApi.nearStops($scope.searchCoords, range, map)
            .then(function (busStopsList) {
                $scope.busStopsList = busStopsList
                map.setZoom(15)
                map.setCenter($scope.searchCoords)
                $location.hash("tracker-list")
                $ionicScrollDelegate.anchorScroll(true)
            })
    }
    $scope.findBuses = function (busStop, map) {
            queryApi.findBuses(busStop, map)
                .then(function (busesList) {
                    assignActiveTrace(busesList)
                    busStop.busesList = busesList
                    $scope.shownBusesList = busesList
                    $state.go($state.current, {}, {
                        reload: true
                    });
                })
            infoWindow.showFor(map, busStop, true)
            $scope.accordionInfoWindows(busStop)
        }
        //toggle the location watcher to emulate live GPS feed from a bus
    $scope.toggleStreamLocation = function () {
            if (this.streamLocation) {
                $scope.busForTracking = {}
                $scope.busForTracking.line = prompt("Which bus are you on?")
                $scope.busForTracking.trace = []
                if (!$scope.busForTracking.line.replace((/[^0-9]/g), "")) {
                    this.streamLocation = false
                } else {
                    geoServ.watchPosition(map)
                }
            } else {
                navigator.geolocation.clearWatch(geoServ.watchID)
                if (geoServ.liveMarker) {
                    var marker = geoServ.liveMarker
                    var currentCoords = {
                        lat: marker.getPosition().lat(),
                        lng: marker.getPosition().lng()
                    }
                    for (i = 0; i < initMap.markers.length; i++) {
                        initMap.markers[i].setPosition(currentCoords)
                        marker.setMap(null)
                    }
                }
            }
        }
        //assign the active GPS trace (if any) to corresponding buses in the list
    function assignActiveTrace(busesList) {
        if ($scope.busForTracking) {
            var traceLineNumber = $scope.busForTracking.line.replace((/[^0-9]/g), "")
            for (i = 0; i < busesList.length; i++) {
                var busLineNumber = busesList[i].line.replace((/[^0-9]/g), "")
                if (traceLineNumber == busLineNumber) {
                    busesList[i].trace = true
                } else {
                    busesList[i].trace = false
                }
            }
        }
    }
    $scope.$on('traceMark:updated', function (event, data) {
        $scope.busForTracking.trace.push(data)
    })


    $scope.busRoute = function (bus, busStop) {

        if ($scope.busForTracking) {
            var trace = $scope.busForTracking.trace
            for (i = 0; i < trace.length; i++) {
                trace[i].marker.setMap(null)
            }
        }
        if ($scope.wholeRoute) {
            $scope.wholeRoute.setMap(null)
        }

        var traceLineNumber = $scope.busForTracking.line.replace((/[^0-9]/g), "")
        var busLineNumber = bus.line.replace((/[^0-9]/g), "")

        var operator = bus.operator
        var line = bus.line
        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        var url = "https://transportapi.com/v3/uk/bus/route/" + operator + "/" + line + "/" + "/timetable.json?" + "app_id=" + app_id + "&app_key=" + app_key + "&callback=JSON_CALLBACK"

        console.log(url)

        $http.jsonp(url)
            .success(function (data) {
                var stopsCoords = []
                for (i = 0; i < data.stops.length; i++) {
                    stopsCoords.push({
                        lat: data.stops[i].latitude,
                        lng: data.stops[i].longitude
                    })
                }
                $scope.wholeRoute = new google.maps.Polyline({
                    path: stopsCoords,
                    geodesic: false,
                    strokeColor: "#0000ff",
                    strokeOpacity: 0.7,
                    strokeWeight: 4,
                    map: map
                })
            })
        if ($scope.busForTracking) {
            var trace = $scope.busForTracking.trace
            if (traceLineNumber == busLineNumber) {
                $ionicPopup.alert({
                    title: "Live GPS Trace",
                    template: "There is available live GPS trace for line " + $scope.busForTracking.line
                });
                for (i = 0; i < trace.length; i++) {
                    trace[i].marker.setMap(map)
                }
                $scope.$on('traceMark:updated', function (event, data) {
                    data.marker.setMap(map)
                })
            } else {
                $scope.$on('traceMark:updated', function (event, data) {
                    data.marker.setMap(null)
                })
            }
        }
    }
})






.controller('journeyPlannerCtrl', function ($scope, $ionicTabsDelegate, $window, initMap, geoServ, mapResize) {
    var thisTab = $ionicTabsDelegate.selectedIndex()
    var thisDomElement = document.getElementById("map2")
    initMap.initIn(thisTab, thisDomElement)
    geoServ.initLocation(thisTab)
    var map = initMap.maps[thisTab]
    $scope.$on('$ionicView.afterEnter', function () {
        mapResize.thisMap(thisTab)
    });
})



.controller('timetablesCtrl', function ($scope, $ionicTabsDelegate, $window, initMap, geoServ, mapResize) {
    var thisTab = $ionicTabsDelegate.selectedIndex()
    var thisDomElement = document.getElementById("map3")
    initMap.initIn(thisTab, thisDomElement)
    geoServ.initLocation(thisTab)
    var map = initMap.maps[thisTab]
    $scope.$on('$ionicView.afterEnter', function () {
        mapResize.thisMap(thisTab)
    });
})


//    //disable and enable dragging
//    $scope.disableSideDrag = function () {
//        $ionicSideMenuDelegate.canDragContent(false)
//    }
//    $scope.enableSideDrag = function () {
//        $ionicSideMenuDelegate.canDragContent(true)
//    }



//$state.go($state.current, {}, {
//    reload: true
//});




//-remove polyline syntax
//-toggle function not responding on invalid input
