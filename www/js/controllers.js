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

    trackCtrl = this

    var thisTab = $ionicTabsDelegate.selectedIndex()
    var thisDomElement = document.getElementById("map")
    initMap.initIn(thisTab, thisDomElement)
    geoServ.setMapCenter(thisTab)
    var map = initMap.maps[thisTab]
    $scope.$on('$ionicView.afterEnter', function () {
        mapResize.thisMap(thisTab)
    });


    /*
          ^ ^ ^ ^ ^ ^ map init and geolocation handling ^ ^ ^ ^ ^ ^
          _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

          v v v v v v     transport API and controls    v v v v v v
    */


    $scope.queryApi = queryApi

    //query Transport API for nearest bus stops
    $scope.nearStops = function () {
        var latLng = (document.getElementById("trackingSearch").value).split(",")
        var coords = {
            lat: Number(latLng[0]),
            lng: Number(latLng[1])
        }
        var range = $scope.stopsRange
        queryApi.nearStops(coords, range, map)
    }

    //query Transport API for buses from selected bus stop
    $scope.findBuses = function (busStop) {
        console.log(this)
        queryApi.findBuses(busStop, map)
        var stopsList = $scope.queryApi.nearStops.stopsList


        if ($scope.isBusesListShown(busStop.busesList)) {
            $scope.shownBusesList = null;
            infoWindow.showFor(map, busStop, false)
        } else {
            $scope.shownBusesList = busStop.busesList
            infoWindow.showFor(map, busStop, true)
            $scope.$apply
            for (var i = 0; i < stopsList.length; i++) { //handle infowindows when bus lists already loaded (outside the AJAX call)
                if (busStop.atcocode != stopsList[i].atcocode) {
                    infoWindow.showFor(map, stopsList[i], false)
                }
            }
        }
    }


    $scope.isBusesListShown = function (list) {
        return $scope.shownBusesList === list;
    }


    $scope.$watch('queryApi.nearStops.stopsList', function (newVal, oldVal, scope) {
        if (newVal) {
            scope.busStopsList = newVal;
            $scope.$apply
            map.setZoom(15)
            map.setCenter($scope.searchCoords)
            $location.hash("tracker-list")
            $ionicScrollDelegate.anchorScroll(true)
        }
    })

    //disable and enable dragging
    $scope.disableSideDrag = function () {
        $ionicSideMenuDelegate.canDragContent(false)
    }
    $scope.enableSideDrag = function () {
        $ionicSideMenuDelegate.canDragContent(true)
    }

    //range control
    $scope.rangeChange = function () {
        $scope.stopsRange = document.getElementById("stops-range").value
    }

    //toggle control
    $scope.toggleStreamLocation = function () {
        if (this.streamLocation) {
            trackCtrl.busForTracking = prompt("Which bus are you on?")

            if (!trackCtrl.busForTracking) {
                this.streamLocation = false
            } else {
                geoServ.watchPosition(thisTab)
            }
        } else {
            navigator.geolocation.clearWatch(geoServ.watchID)
            trackCtrl.busForTracking = null
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

    //stops range
    $scope.stopsRange = document.getElementById("stops-range").value



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
