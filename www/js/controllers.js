angular.module('app.controllers', [])

.controller('trackingCtrl', function ($scope, $ionicSideMenuDelegate, $ionicScrollDelegate, $location, $http) {


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
        title: "You are here",
        icon: "img/blue-dot.png"
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


    //    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ map init and geolocation handling ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //    ____________________________________________________________________________________________________________________

    //    vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv             controls              vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv


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


    //range control
    $scope.stopsRange = document.getElementById("stops-range").value



    //get coordinates from map tap/click
    google.maps.event.addListener(map, 'click', function (e) {
        $scope.searchCoords = {
            lat: e.latLng.lat(),
            lon: e.latLng.lng()
        };
        document.getElementById("trackingSearch").value = $scope.searchCoords.lat + ", " + $scope.searchCoords.lon
    })


    //query Transport API for nearest bus stops
    $scope.nearStops = function () {
        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        var baseUrl = "https://transportapi.com/v3/uk/bus/stops/near.json?"

        var latLng = document.getElementById("trackingSearch").value
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
            $scope.busStopsList = data.stops
            console.table($scope.busStopsList)

            $location.hash("tracker-list")
            $ionicScrollDelegate.anchorScroll(true)
        })
        console.log(url)

    }


    //query Transport API for buses from selected bus stop
    $scope.findBuses = function () {
        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        var baseUrl = "https://transportapi.com/v3/uk/bus/stop/"
        var atcocode = this.busStop.atcocode

        var url = baseUrl + atcocode + "/timetable.json?" + "app_id=" + app_id + "&app_key=" + app_key + "&callback=?"

        console.log(url)
        $.getJSON(url, function (data, status) {
            var busesList = []

            Object.keys(data.departures).forEach(function (key, index) {
                var bus = data.departures[key][0]
                busesList.push({
                    line: bus.line,
                    direction: bus.direction
                })
            })
            $scope.busesList = busesList
            console.log($scope.busesList)
        })
    }
})







.controller('journeyPlannerCtrl', function ($scope) {

})









.controller('timetablesCtrl', function ($scope) {


})
