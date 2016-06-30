var app_id = "928e6aca"
var app_key = "aa747294d32b6f68b6a827ed7f79242f"
nearStops = "https://transportapi.com/v3/uk/bus/stops/near.json?"


//======== Set Coordinates ========//
function getCoords(callback) {

    var lat = Number($("#lat").val())
    var lon = Number($("#lon").val())

    if (lat || lon) {
        callback(lat, lon)
    } else {
        navigator.geolocation.getCurrentPosition(function (position) {
            lat = position.coords.latitude;
            lon = position.coords.longitude;
            callback(lat, lon);
        }, function (error) {
            console.log("Something went wrong: ", error);
        }, {
            enableHighAccuracy: true
        });
    }
}


//======== Query API with Coordinates
function queryAPI(geo, baseUrl, useRetrievedData) {

    var url = baseUrl + "app_id=" + app_id + "&app_key=" + app_key

    if (geo) {
        getCoords(function (latitude, longitude) {
            url = url + "&lat=" + latitude + "&lon=" + longitude + "&callback=?"
            $.getJSON(url, function (data, status) {
                useRetrievedData(data)
            })
        });
    } else {
        url = url + "&callback=?"
        $.getJSON(url, function (data, status) {
            useRetrievedData(data)
        })
    }
}

$(document).ready(function () {
    $("#btn").click(function () {

        queryAPI(true, nearStops, function (data) {
            alert(data.searchlat + " <- Lat" + "\n" + data.searchlon + " <- Lon")
        })

    })
})