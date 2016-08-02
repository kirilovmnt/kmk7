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
    noInfo
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
                busStop.busesList = busesList
                $scope.shownBusesList = busesList
                $state.go($state.current, {}, {
                    reload: true
                });
            })
        infoWindow.showFor(map, busStop, true)
        $scope.accordionInfoWindows(busStop)
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
    $scope.isBusesListShown = function (list) {
        if ($scope.shownBusesList) {
            return $scope.shownBusesList === list;
        } else {
            return false
        }
    }
    $scope.toggleStreamLocation = function () {
        if (this.streamLocation) {
            $scope.busForTracking = prompt("Which bus are you on?")

            if (!$scope.busForTracking) {
                this.streamLocation = false
            } else {
                geoServ.watchPosition(thisTab)
            }
        } else {
            navigator.geolocation.clearWatch(geoServ.watchID)
            $scope.busForTracking = null
        }
    }


    $scope.busRoute = function (bus, busStop) {
        var operator = bus.operator
        var line = bus.line
        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        var url = "https://transportapi.com/v3/uk/bus/route/" + operator + "/" + line + "/" + "/timetable.json?" + "app_id=" + app_id + "&app_key=" + app_key + "&callback=?"

        console.log(url)
        $.getJSON(url, function (data, status) {
            //console.table(data.stops)
            var routeCoords = []
            for (i = 0; i < data.stops.length; i++) {
                routeCoords.push({
                    lat: data.stops[i].latitude,
                    lng: data.stops[i].longitude
                })
            }
            $scope.routePolyLine = new google.maps.Polyline({
                path: routeCoords,
                geodesic: false,
                strokeColor: "#FF0000",
                strokeOpacity: 0.9,
                strokeWeight: 4
            })
            $scope.routePolyLine.setMap(map)
        })

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

//range control


//toggle control


//$state.go($state.current, {}, {
//    reload: true
//});
