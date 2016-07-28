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


    geoServ.setMapCenter = function (tabIndex) {
        var map = initMap.maps[tabIndex]
        var marker = initMap.markers[tabIndex]

        var geoSetSuccess = function (position) {
            var center = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
            geoServ.initialLocation = center

            map.setCenter(center)
            map.setZoom(13);
            marker.setPosition(center)
            marker.setMap(map);
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(geoSetSuccess, geoError, geoOptions)
        } else {
            alert("Your device does not support geolocation")
        }
    }

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


    var geoError = function (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                alert("User denied the request for Geolocation.")
                break;
            case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable.")
                break;
            case error.TIMEOUT:
                alert("The request to get user location timed out." + "\ntabIndex = ")
                break;
            case error.UNKNOWN_ERROR:
                alert("An unknown error occurred.")
                break;
        }
    }

    var geoOptions = {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 27000
    }
}])



.service('')

//
//.factory('initMap', function () {
//    return {map: function (element){
//        var mapOptions = 
//    }
//})
