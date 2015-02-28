import riot from 'riot';

var _initCalled = false;

class RouterStore {

    constructor(options) {
        if (_initCalled)
            return;

        _initCalled = true;

        riot.observable(this) // Riot provides our event emitter.

        var self = this



        riot.route.exec(function(collection, id, action) {
            self.url = {
                collection: collection,
                id: id,
                action: action
            }
            self.trigger('route_changed', self.url)
        })

        riot.route(function(collection, id, action) {
            self.url = {
                collection: collection,
                id: id,
                action: action
            }
            self.trigger('route_changed', self.url)
        })

    }

}
var RouterStoreInstance = new RouterStore()

export default RouterStoreInstance;