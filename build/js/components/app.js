import riot from 'riot';


riot.tag('app', '<style> .main-content{ padding-top: 80px; } </style> <div class="container"> <header></header> <div class="main-content row"> <div class="col-md-8"> <hero-unit></hero-unit> <nav class="navbar navbar-default"> <div class="container-fluid">  <div class="navbar-header"> <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1"> <span class="sr-only">Toggle navigation</span> <span class="icon-bar"></span> <span class="icon-bar"></span> <span class="icon-bar"></span> </button> </div>  <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1"> <ul class="nav navbar-nav"> <li><a href="#/story">Story</a></li> <li><a href="#/comments">Comments</a></li> <li><a href="#/music">My Music</a></li> </ul> </div> </div> </nav> <div if="{ tab_url==\'story\' }"> <story ></story> </div> <div if="{ tab_url==\'comments\' }"> <comments ></comments> </div> <div if="{ tab_url==\'music\' }"> <music ></music> </div> </div> </div> </div>', function(opts) {
        var type = 'JavaScript1'
        this.test = `This is ${type}`
        var that = this
        this.tab_url = "story"
        riot.route(function(collection, id, action) {
            if (id) {
                that.tab_url = id;
            }
            else {
                that.tab_url = "story"
            }
            that.update()
        })
    
});