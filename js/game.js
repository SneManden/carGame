/**
 * Game object
 * @param {integer} width      Width of canvas in px
 * @param {integer} height     Height of canvas in px
 * @param {hexnum} background  Hexadecimal number representing background color
 */
var Game = function(width, height, background) {
    this.width = width;
    this.height = height;
    this.background = (background ? background : 0xFFFFFF);

    this.STATES = {
        INIT: 0,
        LOADING: 1,
        STARTED: 2
    }
    this.state = this.STATES.TEST;
    this.loaded = false;

    this.entities = [];

    this.keys = {
        LEFT:   37,
        UP:     38,
        RIGHT:  39,
        DOWN:   40,
        A:      65,
        S:      83
    };
    this.keyCodes = [37, 38, 39, 40, 65, 83];
    this.keyPressed = {};

    this.lastTick = new Date().getTime();
};
Game.prototype = {

    init: function() {
        console.log('Game initialized');
        this.state = this.STATES.INIT;
        
        // Create a stage, renderer and canvas-element
        this.stage = new PIXI.Stage(this.background);
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height);
        document.body.appendChild(this.renderer.view);

        this.world = new PIXI.DisplayObjectContainer();

        // Load entities
        this.loadAssets();

        // Setup keyboard
        this.setupKeyboard();

        this.timer = new Timer();

        // Start game loop
        var self = this;
        setTimeout(function() {
            gameLoop();
        }, 0);
    },

    loadAssets: function() {
        console.log('Game loading');
        this.state = this.STATES.LOADING;

        // Create loader
        this.loader = new PIXI.AssetLoader([
            "carRed.png",
            "roadTile.png",
            "testTrack2.png"
        ]);
        var self = this;
        this.loader.onComplete = function() {
            self.onAssetsLoaded(self);
        };
        this.loader.load();
    },

    onAssetsLoaded: function(self) {
        self.loaded = true;
        self.start();
    },

    start: function() {
        console.log('Game started');
        this.state = this.STATES.STARTED;

        // Add background
        this.back = new Back(this, 640, 480, "testTrack2.png");
        this.back.createSprite();
        this.entities.push(this.back);
        
        // Add car
        this.player = new Player(this, 320, 260, "carRed.png");
        this.player.angle = Math.PI/2;
        this.player.createSprite();
        this.entities.push(this.player);

        // Add Police car
        this.police = new Police(this, 320, 250);
        this.police.angle = Math.PI/2;
        this.police.createSprite();
        this.police.setTarget(this.player);
        this.entities.push(this.police);
        this.policeCars = [];
        for (var i=0; i<10; i++) {
            var y = Math.random()*25 - 12;
            var newPoliceCar = new Police(this, 300, 260+y)
            newPoliceCar.angle = Math.PI/2;
            newPoliceCar.createSprite();
            newPoliceCar.setTarget(this.player);
            this.entities.push(newPoliceCar);
            this.policeCars.push(newPoliceCar);
        }

        // Add the world
        this.stage.addChild(this.world);

        // Debugging
        this.debugText = new PIXI.Text("", {
            font: "10px ubuntu mono",
            fill: "black",
            align: "left"
        });
        this.debugText.position.x = 15;
        this.debugText.position.y = 15;
        this.stage.addChild(this.debugText);
    },

    update: function() {
        for (var i in this.entities) {
            this.entities[i].update();
        }
        // Follow player
        this.world.position.x = -this.player.position.x + 320;
        this.world.position.y = -this.player.position.y + 240;
        this.debug(true);
    },

    debug: function(extras) {
        var debugInfo =
            "FPS: " + game.timer.getFPS() + "\n";
        if (extras)
            debugInfo +=
            "Car:\n  x: " + Math.round(this.player.position.x*100)/100 +
                "\n  y: " + Math.round(this.player.position.y*100)/100 +
                "\n  speed: " + Math.round(this.player.speed*100)/100 +
                "\n  vx: " + Math.round(this.player.vel_wc.x*100)/100 +
                "\n  vy: " + Math.round(this.player.vel_wc.y*100)/100 +
                "\n  ax: " + Math.round(this.player.acc_wc.x*100)/100 +
                "\n  ay: " + Math.round(this.player.acc_wc.y*100)/100 +
                "\n  ang: " + Math.round(this.player.angle*100)/100 +
                "\n  angVel: " + Math.round(this.player.angularVel*100)/100 +
                "\n  steAng: " + Math.round(this.player.steerAngle*100)/100 + "\n" +
            "Controls:" +
                "\n  Left:     " + this.keyPressed.LEFT +
                "\n  Right:    " + this.keyPressed.RIGHT +
                "\n  Breake:   " + this.keyPressed.DOWN +
                "\n  Throttle: " + this.keyPressed.UP;
        this.debugText.setText(debugInfo);
    },

    updateWhileLoading: function() {
        // When loading (like, for loading bar)
    },

    upd: function() {
        if (this.loaded)    this.update();
        else                this.updateWhileLoading();
    },

    setupKeyboard: function() {
        var self = this;
        window.addEventListener('keydown', function(e) {
            if (self.keyCodes.indexOf(e.keyCode) != -1)
                e.preventDefault(); // Prevent default behaviour
            for (var i in self.keys) {
                if (e.keyCode == self.keys[i]) self.keyPressed[i] = true;
            }
        }, false);
        window.addEventListener('keyup', function(e) {
            if (self.keyCodes.indexOf(e.keyCode) == -1)
                e.preventDefault(); // Prevent default behaviour
            for (var i in self.keys) {
                if (e.keyCode == self.keys[i]) self.keyPressed[i] = false;
            }
        }, false);
    }

};

// Gameloop
function gameLoop() {
    requestAnimFrame(gameLoop);
    game.renderer.render(game.stage);
    game.upd();
}



/**
 * Timer
 */
var Timer = function() {
    this.startTime = new Date().getTime();
    this.frameNumber = 0;
};
Timer.prototype = {
    getFPS: function() {
        this.frameNumber++;
        var d = new Date().getTime(),
            currentTime = (d-this.startTime) / 1000,
            result = Math.floor( (this.frameNumber/currentTime) );

        if (currentTime > 1) {
            this.startTime = new Date().getTime();
            this.frameNumber = 0;
        }
        return (result == Infinity ? 30 : result);
    }
};