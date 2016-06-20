var app = angular
    .module("app", [])
    .service("Geo", Geo)
    .controller("MainCtrl", MainCtrl)

//controller
function MainCtrl(Geo) {


    var mainCtrl = this

    mainCtrl.getCoords = function () {
        mainCtrl.coords = Geo.position.coords
        mainCtrl.geoTimestamp = Geo.position.timestamp
    }

    mainCtrl.listTitle = "List of items";
    mainCtrl.items = [{
        name: 'Scuba Diving Kit',
        id: 7297510
    }, {
        name: 'Snorkel',
        id: 0278916
    }, {
        name: 'Wet Suit',
        id: 2389017
    }, {
        name: 'Beach Towel',
        id: 1000983
    }];

    console.log(this)
    console.log("^From MainCtrl^")

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
