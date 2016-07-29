angular.module('app.controllers', [])

.controller('trackingCtrl', function ($scope, $state, $window, $ionicSideMenuDelegate, $ionicScrollDelegate, $ionicTabsDelegate, $location, initMap, geoServ, mapResize) {

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

          v v v v v v             controls              v v v v v v
    */



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
            lon: e.latLng.lng()
        };
        document.getElementById("trackingSearch").value = $scope.searchCoords.lat + ", " + $scope.searchCoords.lon
    })

    //stops range
    $scope.stopsRange = document.getElementById("stops-range").value



    //query Transport API for nearest bus stops
    $scope.nearStops = function () {
        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        var baseUrl = "https://transportapi.com/v3/uk/bus/stops/near.json?"

        var latLng = document.getElementById("trackingSearch").value
        latLng = latLng.replace(" ", "")
        latLng = latLng.replace(",", "&lon=")

        var url = baseUrl + "app_id=" + app_id + "&app_key=" + app_key + "&lat=" + latLng + "&page=1" + "&rpp=" + $scope.stopsRange + "&callback=?"

        $.getJSON(url, function (data, status) {

                for (i = 0; i < data.stops.length; i++) {
                    var busStop = data.stops[i]
                    busStop.marker = new google.maps.Marker({
                        busStop: busStop.atcocode,
                        position: new google.maps.LatLng(busStop.latitude, busStop.longitude),
                        map: map
                    })
                    busStop.infowindow = new google.maps.InfoWindow({
                        content: busStop.indicator + " " + busStop.name
                    })
                }
                $scope.busStopsList = data.stops
                    //console.table($scope.busStopsList)

                map.setZoom(15)

                $scope.$apply()
                $location.hash("tracker-list")
                $ionicScrollDelegate.anchorScroll(true)
            })
            //console.log(url)
    }


    //query Transport API for buses from selected bus stop
    $scope.findBuses = function (busStop) {

        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        var baseUrl = "https://transportapi.com/v3/uk/bus/stop/"
        var url = baseUrl + busStop.atcocode + "/timetable.json?" + "app_id=" + app_id + "&app_key=" + app_key + "&callback=?"

        console.log(url)

        if (!(busStop.busesList)) {
            $.getJSON(url, function (data, status) {
                $scope.shownBusesList = busStop.busesList = []

                Object.keys(data.departures).forEach(function (key, index) {
                    var bus = data.departures[key][0]
                    busStop.busesList.push(bus)
                })
                showInfoWindow(busStop, true)
                $state.go($state.current, {}, {
                    reload: true
                });
                $scope.$apply()
            })
        }
        //console.log(busStop.busesList)

        if ($scope.isBusesListShown(busStop.busesList)) {
            $scope.shownBusesList = null;
            showInfoWindow(busStop, false)
        } else {
            $scope.shownBusesList = busStop.busesList
            showInfoWindow(busStop, true)
        }
    }



    $scope.isBusesListShown = function (list) {
        return $scope.shownBusesList === list;
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
            var polyLineCoords = []
            for (i = 0; i < data.stops.length; i++) {
                polyLineCoords.push({
                    lat: data.stops[i].latitude,
                    lng: data.stops[i].longitude
                })
            }
            $scope.polyLine = new google.maps.Polyline({
                path: polyLineCoords,
                geodesic: false,
                strokeColor: "#FF0000",
                strokeOpacity: 0.9,
                strokeWeight: 4
            })
            $scope.polyLine.setMap(map)
        })

    }


    //control infowindows
    function showInfoWindow(busStop, status) {
        if (status) {
            busStop.infowindow.close() //need to track the right infowindow to close before opening another one
            busStop.infowindow.open(map, busStop.marker)
        } else {
            busStop.infowindow.close()
        }
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
