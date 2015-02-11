/* */ 
var LocationActions = require("../actions/LocationActions");
var ImitateBrowserBehavior = {updateScrollPosition: function(position, actionType) {
    switch (actionType) {
      case LocationActions.PUSH:
      case LocationActions.REPLACE:
        window.scrollTo(0, 0);
        break;
      case LocationActions.POP:
        if (position) {
          window.scrollTo(position.x, position.y);
        } else {
          window.scrollTo(0, 0);
        }
        break;
    }
  }};
module.exports = ImitateBrowserBehavior;
