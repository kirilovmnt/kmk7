angular.module('app.services', [])



.service('initMapService', function ($scope) {


    mapServ = this
    mapServ.options = {
        center: {
            lat: 54.5,
            lng: -4
        },
        zoom: 5
    }

    mapServ.element = document.getElementById('map')
    mapServ.map = new google.maps.Map(mapServ.element, mapServ.options);


    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            mapServ.position = position
            mapServ.map.setCenter(initialLocation);
            mapServ.map.setZoom(12);
        })
    } else {
        //cordova geo plugin code goes here
    }
    console.log(this)
})






.factory('BlankFactory', [function () {

}])
