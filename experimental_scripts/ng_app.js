/*if the script is loaded synchronously:*/
var app = angular
    .module("app", [])
    .controller("MainCtrl", MainCtrl);

/*if the script is loaded asynchronously:*/
//angular.bootstrap(document.documentElement, ["app"]);
function MainCtrl () {
   
    this.listTitle = "List of items";
    this.items = [{
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
}