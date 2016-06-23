var app = angular
    .module("app", [])
    .service("Geo", Geo)
    .controller("MainCtrl", MainCtrl)
    .provider("date", date)

//controller
function MainCtrl(Geo, date) {


    var mainCtrl = this

    mainCtrl.getCoords = function () {
        mainCtrl.coords = Geo.position.coords
        mainCtrl.geoTimestamp = Geo.position.timestamp
    }

    mainCtrl.date = date.showDate()

    console.log(this)
    console.log("^From MainCtrl^")
}




function date() {
    this.$get = function () {
        return {
            showDate: function () {
                var date = new Date()
                return date
            }
        }
    }
}









//services


function Geo() {

    geo = this
    navigator.geolocation.watchPosition(function (position) {
        geo.position = position
    }, function (error) {
        console.log("Error in getting geolocation: ", error);
    }, {
        enableHighAccuracy: true
    });
    /*
    returns methods:
    Geo.position
            .coords
                .accuracy
                .altitude
                .altitudeAccuracy
                .heading
                .latitude
                .longitude
                .speed
           .timestamp
    */
}
