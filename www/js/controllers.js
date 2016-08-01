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
    infoWindow
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
    $scope.$on('$ionicView.afterEnter', function () {
        mapResize.thisMap(thisTab)
    });
    $scope.searchInput = $scope.searchMode = {}
    $scope.searchMode.mode = "nearby"
    $scope.showStopsList = true

    $scope.$watch('searchInput.value', function (newVal, oldVal) {
        if ($scope.searchMode.mode == "address" &&
            oldVal &&
            !(oldVal.includes(newVal)) ||
            !($scope.searchInput.value)
        ) {
            $scope.showSuggestions = false
            $scope.suggestions = []
        }
    })


    $scope.searchModeChange = function (mode) {
        $scope.searchCoords = {}
        document.getElementById("trackingSearch").value = null
        google.maps.event.clearListeners(map, 'click')
        if ($scope.tapMarker) {
            $scope.tapMarker.setMap(null)
        }
        if (mode == "mapTap") {
            $location.hash(map.getDiv().id)
            $ionicScrollDelegate.anchorScroll(true)
            google.maps.event.addListener(map, 'click', function (e) {
                var tapCoords = {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng()
                }
                if (typeof ($scope.tapMarker) == "undefined") {
                    $scope.tapMarker = new google.maps.Marker({
                        position: tapCoords,
                        map: map,
                        icon: "img/blue-dot.png"
                    });
                }
                document.getElementById("trackingSearch").value = tapCoords.lat + ", " + tapCoords.lng
                $scope.tapMarker.setPosition(tapCoords)
                $scope.tapMarker.setMap(map)
            })

        } else if (mode == "nearby") {
            if (typeof ($scope.initCoords) == "undefined") {
                if (!geoServ.initLocation.loading) {
                    geoServ.initLocation(thisTab)
                        .then(function (coords) {
                            document.getElementById("trackingSearch").value = coords.lat + ", " + coords.lng
                        })
                }
            } else {
                document.getElementById("trackingSearch").value = $scope.initCoords.lat + ", " + $scope.initCoords.lng
            }
        } else if (mode == "address") {
            if (typeof ($scope.address) != "undefined") {
                if (!document.getElementById("trackingSearch").value) {
                    $scope.inputSearch.value = $scope.address.formatted_address
                }
            }
        }

    }

    $scope.selectSuggestion = function (address) {
        $scope.address = address
        console.log(address)
        $scope.searchInput.value = address.formatted_address
        $scope.searchCoords = address.geometry.location
        console.log($scope.searchCoords)
        $scope.showSuggestions = false
        $scope.nearStops()
    }
    $scope.geoCoder = function () {
        if (typeof ($scope.address) != "undefined") {
            $scope.selectSuggestion($scope.address)
        } else {
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + document.getElementById("trackingSearch").value + "&key=AIzaSyDCufJBM-6w0uYLjXtSHQW7BawJEsB4i8o&callback=JSON_CALLBACK"
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
                        $scope.suggestions = data.results
                        $scope.showSuggestions = true
                        $state.go($state.current, {}, {
                            reload: true
                        });
                    }
                })
        }
    }





    //query Transport API for nearest bus stops
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

    //query Transport API for buses from selected bus stop
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

    //control for the accordion list and Google Maps infowindows for bus stops
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

    //    //disable and enable dragging
    //    $scope.disableSideDrag = function () {
    //        $ionicSideMenuDelegate.canDragContent(false)
    //    }
    //    $scope.enableSideDrag = function () {
    //        $ionicSideMenuDelegate.canDragContent(true)
    //    }

    //range control
    $scope.stopsRange = document.getElementById("stops-range").value
    $scope.rangeChange = function (value) {
        $scope.stopsRange = value
    }

    //toggle control
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



    //details about missing information
    $scope.noInfoAlert = function () {
        $ionicPopup.alert({
            title: "No Information",
            template: "The reasons for missing information might be:<br>" +
                "&nbsp;&nbsp;1. No services today<br>" +
                "&nbsp;&nbsp;2. No services at this time<br>" +
                "&nbsp;&nbsp;3. This bus is labelled as 'deleted' in NaPTAN's database<br>" +
                "&nbsp;&nbsp;4. Connection fail"
        });
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



//$state.go($state.current, {}, {
//    reload: true
//});
