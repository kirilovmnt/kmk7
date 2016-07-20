angular.module('app.controllers', [])

.controller('trackingCtrl', function ($scope, $ionicSideMenuDelegate, $ionicScrollDelegate, $location, $http, $state) {


    trackCtrl = this


    $scope.mapOptions = { //yet to be passed to other tabs
        center: {
            lat: 54.5,
            lng: -4
        },
        zoom: 5,
        minZoom: 5
    }


    //initialize map and marker
    $scope.mapElement = document.getElementById('map');

    var map = new google.maps.Map($scope.mapElement, $scope.mapOptions);
    var marker = new google.maps.Marker({
        title: "Your location",
        icon: "img/pinpoint.gif",
        optimized: false
    })
    marker.setMap(map);


    //initial location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            $scope.initialLocation = position;
            var center = {
                lat: $scope.initialLocation.coords.latitude,
                lng: $scope.initialLocation.coords.longitude
            }
            document.getElementById("trackingSearch").value = center.lat + ", " + center.lng
                //set map center to initial position
            map.setCenter(center)
            map.setZoom(13);
            marker.setPosition(center)
        })
    } else {
        //cordova geo plugin code goes here
    }


    //streaming location (to be moved to service if possible not singleton)
    function streamLocation() {

        if (navigator.geolocation) {
            trackCtrl.watchID = navigator.geolocation.watchPosition(function (position) {

                //set marker to current position
                $scope.currentLocation = position;
                marker.setPosition({
                        lat: $scope.currentLocation.coords.latitude,
                        lng: $scope.currentLocation.coords.longitude
                    })
                    //for debugging purposes
                console.log(position.timestamp + " <- Timestamp of response \n" + position.coords.latitude + " <- current Latitude \n" + position.coords.longitude + " <- current Longitude")
            })
        } else {
            //cordova geo plugin code goes here
        }
    }


    $scope.map = map
    $scope.marker = marker


    //    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ map init and geolocation handling ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //    ___________________________________________________________________________________________________________________

    //    vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv             controls              vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv


    //disable and enable dragging
    $scope.disableSideDrag = function () {
        $ionicSideMenuDelegate.canDragContent(false)
    }
    $scope.enableSideDrag = function () {
        $ionicSideMenuDelegate.canDragContent(true)
    }


    //toggle control
    $scope.toggleStreamLocation = function () {
        if (this.streamLocation) {
            trackCtrl.busForTracking = prompt("Which bus are you on?")
            if (!trackCtrl.busForTracking) {
                this.streamLocation = false
            } else {
                streamLocation()
            }
        } else {
            navigator.geolocation.clearWatch(trackCtrl.watchID)
            trackCtrl.busForTracking = null
        }
    }


    //get coordinates from map tap/click
    google.maps.event.addListener(map, 'click', function (e) {
        $scope.searchCoords = {
            lat: e.latLng.lat(),
            lon: e.latLng.lng()
        };
        document.getElementById("trackingSearch").value = $scope.searchCoords.lat + ", " + $scope.searchCoords.lon
    })


    $scope.stopsRange = document.getElementById("stops-range").value


    //query Transport API for nearest bus stops
    $scope.nearStops = function () {
        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        var baseUrl = "https://transportapi.com/v3/uk/bus/stops/near.json?"

        var latLng = document.getElementById("trackingSearch").value
        $scope.stopsRange = document.getElementById("stops-range").value
        latLng = latLng.replace(" ", "")
        latLng = latLng.replace(",", "&lon=")

        var url = baseUrl + "app_id=" + app_id + "&app_key=" + app_key + "&lat=" + latLng + "&page=1" + "&rpp=" + $scope.stopsRange + "&callback=?"

        { //        $http({
            //            method: 'GET',
            //            url: url
            //        }).then(function successCallback(response) {
            //            /* this callback will be called asynchronously
            //             when the response is available*/
            //            console.log(data)
            //        }, function errorCallback(response) {
            //            alert("Something went wrong, trying to fetch near bus stops")
            //        });
        } //for further consideration to exclude jQuery AJAX lib

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
            console.table($scope.busStopsList)

            map.setZoom(15)

            $scope.$apply()
            $location.hash("tracker-list")
            $ionicScrollDelegate.anchorScroll(true)
        })
        console.log(url)
    }



    //query Transport API for buses from selected bus stop
    $scope.findBuses = function (busStop) {
        alert("click")
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
        console.log(busStop.busesList)

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
        var dir = bus.dir
        var atcocode = busStop.atcocode
        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        var url = "https://transportapi.com/v3/uk/bus/route/" + operator + "/" + line + "/" + dir + "/" + atcocode + "/timetable.json?" + "app_id=" + app_id + "&app_key=" + app_key + "&callback=?"

        $.getJSON(url, function (data, status) {
            console.table(data.stops)
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






.controller('journeyPlannerCtrl', function ($scope) {

})









.controller('timetablesCtrl', function ($scope) {


})
