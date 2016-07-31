angular.module('app.controllers', [])

.controller('trackingCtrl', function (
    $scope,
    $state,
    $window,
    $ionicSideMenuDelegate,
    $ionicScrollDelegate,
    $ionicTabsDelegate,
    $location,
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
    geoServ.setMapCenter(thisTab)
    var map = initMap.maps[thisTab]
    $scope.$on('$ionicView.afterEnter', function () {
        mapResize.thisMap(thisTab)
    });


    //query Transport API for nearest bus stops
    $scope.nearStops = function () {
        var latLng = (document.getElementById("trackingSearch").value).split(",")
        var coords = {
            lat: Number(latLng[0]),
            lng: Number(latLng[1])
        }
        var range = $scope.stopsRange
        queryApi.nearStops(coords, range, map)
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
                console.log(busesList)
                busStop.busesList = busesList
                $scope.shownBusesList = busesList
                $state.go($state.current, {}, {
                    reload: true
                });
            });
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

    //disable and enable dragging
    $scope.disableSideDrag = function () {
        $ionicSideMenuDelegate.canDragContent(false)
    }
    $scope.enableSideDrag = function () {
        $ionicSideMenuDelegate.canDragContent(true)
    }

    //range control
    $scope.stopsRange = document.getElementById("stops-range").value
    $scope.rangeChange = function () {
        $scope.stopsRange = document.getElementById("stops-range").value
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

    //get coordinates from map tap / click
    google.maps.event.addListener(map, 'click', function (e) {
        $scope.searchCoords = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
        document.getElementById("trackingSearch").value = $scope.searchCoords.lat + ", " + $scope.searchCoords.lng
    })

    //details about missing information
    $scope.noInfoAlert = function () {
        alert("The reasons for missing information might be:\n" +
            "1. No services today\n" +
            "2. No services at this time\n" +
            "3. Connection fail")
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
    geoServ.setMapCenter(thisTab)
    var map = initMap.maps[thisTab]
    $scope.$on('$ionicView.afterEnter', function () {
        mapResize.thisMap(thisTab)
    });
})








.controller('timetablesCtrl', function ($scope, $ionicTabsDelegate, $window, initMap, geoServ, mapResize) {
    var thisTab = $ionicTabsDelegate.selectedIndex()
    var thisDomElement = document.getElementById("map3")
    initMap.initIn(thisTab, thisDomElement)
    geoServ.setMapCenter(thisTab)
    var map = initMap.maps[thisTab]
    $scope.$on('$ionicView.afterEnter', function () {
        mapResize.thisMap(thisTab)
    });
})



//$state.go($state.current, {}, {
//    reload: true
//});
