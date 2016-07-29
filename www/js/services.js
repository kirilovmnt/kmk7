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

.service('geoServ', ['initMap', function (initMap) {
    var geoServ = this

    //initial location
    geoServ.setMapCenter = function (tabIndex) {
        var map = initMap.maps[tabIndex]
        var marker = initMap.markers[tabIndex]

        //getCurrentPosition success callback
        var geoSetSuccess = function (position) {
                geoServ.initialLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                geoServ.initMapSettings()
            }
            //initial map settings
        geoServ.initMapSettings = function () {
                map.setCenter(geoServ.initialLocation)
                map.setZoom(13);
                marker.setPosition(geoServ.initialLocation)
                marker.setMap(map);
            }
            //reuse initial location or set it if undefined
        if (typeof (geoServ.initialLocation) == "undefined") {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(geoSetSuccess, geoError, geoOptions)
            } else {
                alert("Your device does not support geolocation")
            }
        } else {
            geoServ.initMapSettings()
        }
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
            alert("Your device does not support geolocation")
        }
    }

    //error callback for unsuccessfull geolocation requests
    var geoError = function (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                alert("User denied the request for Geolocation.")
                break;
            case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable.")
                break;
            case error.TIMEOUT:
                alert("The request to get user location timed out.")
                break;
            case error.UNKNOWN_ERROR:
                alert("An unknown error occurred.")
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
