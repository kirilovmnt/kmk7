angular.module('app.controllers', [])

.controller('trackingCtrl', function ($scope, $ionicSideMenuDelegate, $http) {


    trackCtrl = this

    $scope.options = { //yet to be passed to other tabs
        center: {
            lat: 54.5,
            lng: -4
        },
        zoom: 5,
        minZoom: 5
    }


    //initialize map and marker
    $scope.element = document.getElementById('map')

    var map = new google.maps.Map($scope.element, $scope.options);
    var marker = new google.maps.Marker({
        title: "You are here",
        icon: "img/blue-dot.png"
    })
    marker.setMap(map)


    //disable swipe when using the map
    map.addListener('mouseover', function () {
        $ionicSideMenuDelegate.canDragContent(false)
    })
    map.addListener('mouseout', function () {
        $ionicSideMenuDelegate.canDragContent(true)
    })


    //initial location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            var coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }

            //set map center to initial position
            var initialLocation = new google.maps.LatLng(coords);
            map.setCenter(initialLocation);
            map.setZoom(13);
            marker.setPosition(coords)

            trackCtrl.initialLocation = position
        })
    } else {
        //cordova geo plugin code goes here
    }


    //streaming location
    function streamLocation() {

        if (navigator.geolocation) {
            trackCtrl.watchID = navigator.geolocation.watchPosition(function (position) {

                var coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                    //set map center to current position
                var currentLocation = new google.maps.LatLng(coords);
                marker.setPosition(coords)

                trackCtrl.currentLocation = position

                //for debugging purposes
                console.log(position.timestamp + " <- Timestamp of response \n" + position.coords.latitude + " <- current Latitude \n" + position.coords.longitude + " <- current Longitude")
            })
        } else {
            //cordova geo plugin code goes here
        }
    }

    trackCtrl.map = map
    trackCtrl.marker = marker


    //toggle control
    $scope.toggleStreamLocation = function () {
        if (this.streamLocation) {
            trackCtrl.busForTracking = prompt("Which bus are you on?")
            streamLocation()
        } else {
            navigator.geolocation.clearWatch(trackCtrl.watchID)
            trackCtrl.busForTracking = null
        }
    }


    //get coordinates from map
    google.maps.event.addListener(map, 'click', function (e) {
        trackCtrl.searchCoords = {
            lat: e.latLng.lat(),
            lon: e.latLng.lng()
        };
        document.getElementById("trackingSearch").value = trackCtrl.searchCoords.lat + ", " + trackCtrl.searchCoords.lon

    })

    //query Transport API for nearest bus stops
    $scope.queryApi = function () {
        var app_id = "928e6aca"
        var app_key = "aa747294d32b6f68b6a827ed7f79242f"
        nearStops = "https://transportapi.com/v3/uk/bus/stops/near.json?"
        var latLng = document.getElementById("trackingSearch").value
        latLng = latLng.replace(" ", "")
        latLng = latLng.replace(",", "&lon=")
        $scope.stopsRange = document.getElementById("stops-range").value

        var url = nearStops + "app_id=" + app_id + "&app_key=" + app_key + "&lat=" + latLng + "&page=1" + "&rpp=" + $scope.stopsRange + "&callback=?"
        console.log(url)

        //        $http({
        //            method: 'GET',
        //            url: url
        //        }).then(function successCallback(response) {
        //            /* this callback will be called asynchronously
        //             when the response is available*/
        //            console.log(data)
        //        }, function errorCallback(response) {
        //            alert("Something went wrong, trying to fetch near bus stops")
        //        });

        $.getJSON(url, function (data, status) {
            trackCtrl.stopsResults = data.stops
            console.table(trackCtrl.stopsResults)
        })



    }

})







.controller('journeyPlannerCtrl', function ($scope) {

})









.controller('timetablesCtrl', function ($scope) {


})
