angular.module('app.services', [])



.service('initMap', [function () {

    var initMapSrv = this
    var mapOptions = {
        center: {
            lat: 54.5,
            lng: -4
        },
        zoom: 5,
        minZoom: 5
    }

    initMapSrv.domElement = function (element) {
        initMapSrv.map = new google.maps.Map(element, mapOptions);
    }
    initMapSrv.marker = new google.maps.Marker({
        title: "Your location",
        icon: "img/pinpoint.gif",
        optimized: false
    })

}])



.service('geolocation', ['initMap', function (initMap) {
    var geolocation = this


    geolocation.setMapCenter = function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(geoSetSuccess, geoError, geoOptions)
        } else {
            //cordova geo plugin code goes here
        }
    }
    geolocation.watchPosition = function () {
        if (navigator.geolocation) {
            this.watchID = navigator.geolocation.watchPosition(geoWatchSuccess, geoError, geoOptions)
        } else {
            //cordova geo plugin code goes here
        }
    }

    var geoSetSuccess = function (position) {
        var center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        }

        initMap.map.setCenter(center)
        initMap.map.setZoom(13);
        initMap.marker.setPosition(center)
        initMap.marker.setMap(initMap.map);
    }

    var geoWatchSuccess = function (position) {
        //set marker to current position
        initMap.marker.setPosition({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            })
            //for debugging purposes
        console.log(position.timestamp + " <- Timestamp of response")
    }

    var geoError = function (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                x.innerHTML = "User denied the request for Geolocation."
                break;
            case error.POSITION_UNAVAILABLE:
                x.innerHTML = "Location information is unavailable."
                break;
            case error.TIMEOUT:
                x.innerHTML = "The request to get user location timed out."
                break;
            case error.UNKNOWN_ERROR:
                x.innerHTML = "An unknown error occurred."
                break;
        }
    }

    var geoOptions = {
        enableHighAccuracy: true,
        maximumAge: 30000,
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
