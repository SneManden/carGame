var Police = function(game, x, y, image, settings) {
    Car.call(this, game, x, y, "carPolice1.png", settings);
    this.targetObject;
    this.followTarget = false;
    this.step = 0;
    this.debugVectors = false;
};
Police.prototype = new Car();
Police.prototype.constructor = Police;
Police.prototype.initialize = function() {
    // This function must be called to debug vectors
    this.g = new PIXI.Graphics();
    this.game.world.addChild(this.g);
};
Police.prototype.setTarget = function(target) {
    this.targetObject = target;
    this.followTarget = true;
};
Police.prototype.clearTarget = function() {
    this.targetObject = null;
    this.followTarget = false;
};
Police.prototype.update = function() {
    this.step++;
    // Call parent
    Car.prototype.update.call(this);

    // Follow target
    if (this.followTarget && this.targetObject) {
        var tx = this.targetObject.position.x,
            ty = this.targetObject.position.y,
            xx = this.position.x,
            yy = this.position.y;
        if (tx==xx && ty==yy) return;

        // Local pi
        var PI = Math.PI,
            PI2 = 2*Math.PI;

        // Set angle within proper range
        this.angle = this.angle % (PI2);

        // Calculate desired angle [angle towards player]
        var desiredAngle = (Math.atan2(xx-tx, yy-ty) + PI);
        // Desired angle vector
        var vec = {x: Math.sin(desiredAngle), y: Math.cos(desiredAngle)};
        // Vector perpendicular to angle-vector of vehicle
        var perp = {x: -Math.cos(this.angle), y: Math.sin(this.angle)};
        // Dot product of vec and perp
        var dotP = vec.x*perp.x + vec.y*perp.y;

        // Calculate angle between [angle vector] and [desired angle vector]
        var angv = {x: Math.sin(this.angle), y: Math.cos(this.angle)};
        var angle = Math.acos( vec.x*angv.x + vec.y*angv.y );

        // Steering; if dotP > 0, we go RIGHT, else LEFT
        var steer;
        if (dotP > 0)   steer = -angle; // RIGHT
        else            steer = angle;  // LEFT

        // Determine throttle depending on angle towards player
        // The more direct path to player => max throttle
        var gotoThrottle;
        if (angle > PI) {
            steer = this.MAX_TURN;
            gotoThrottle = 15;
        } else {
            gotoThrottle = PI/angle*100;
        }
        steer = steer/PI*this.MAX_TURN;
        this.steerAngle = steer;
        
        // Speed up or down
        var tStep = 0.5;
        if (this.throttle < gotoThrottle)
            this.throttle = Math.min(100, this.throttle+tStep);
        else
            this.throttle = Math.max(0, this.throttle-tStep);

        // DEBUGGING
        if (this.debugVectors) {
            var color = 0xff0000;
            if (dotP > 0)
                color = 0x00ff00;
            if (this.g) {
                this.g.clear();
                this.g.lineStyle(3, color, 1);
                this.g.beginFill(0xff0000);
                // Desired angle
                this.g.moveTo(xx,yy);
                this.g.lineTo(xx+vec.x*15, yy+vec.y*15);
                // Right angle
                this.g.lineStyle(3, 0x0000ff, 1);
                this.g.moveTo(xx,yy);
                this.g.lineTo(xx+perp.x*15, yy+perp.y*15);
            }
        }
    }
};


function r(num) { return Math.round(num*100)/100; }