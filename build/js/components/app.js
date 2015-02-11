import riot from 'riot';

riot.tag('app', '<div class="container"> <header></header> <div class="row"> <div class="col-md-8"> <hero-unit></hero-unit> </div> </div> </div>', function(opts) {
        var type = 'JavaScript1'
        this.test = `This is ${type}`
    
});