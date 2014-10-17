var Car = function(game, x, y, image, settings) {
    this.game = game;
    this.image = image;
    for (var i in settings)
        this[i] = settings[i];

    // Position, velocity, acceleration
    this.position = {x: x, y: y};
    this.pos_wc = {x: x, y: y};
    this.vel_wc = {x: 0, y: 0};
    this.acc_wc = {x: 0, y: 0};
    this.scale = 15.0;
    // Angles
    this.angle = 0; // Face down
    this.angularVel = 0;
    this.steerAngle = 0;
    // Throttle and braking
    this.throttle = 0;
    this.brake = 0;
    // Slip
    this.front_slip = 1;
    this.rear_slip = 1;
    // Car parameters
    this.b = 1.0;
    this.c = 1.0;
    this.wheelBase = this.b + this.c;
    this.h = 1.0;
    this.mass = 1500;
    this.inertia = 1500;
    this.length = 3.0;
    this.width = 1.5;
    this.wheelLength = 0.7;
    this.wheelWidth = 0.3;
    this.calcLimit = 0.5;
    this.calcLimitAv = 0.1;
    // Constants
    this.DRAG = 5.0;
    this.RESISTANCE = 30.0;
    this.CA_F = -5.0;
    this.CA_R = -5.2;
    this.MAX_GRIP = 3.0;
    this.TURN = Math.PI/32.0;
    this.MAX_TURN = Math.PI/4.0;
};
Car.prototype = {

    calcResistance: function(velocity) {
        var vx = velocity.x,
            vy = velocity.y;
        var resistanceForce = {x: 0, y: 0};
        resistanceForce.x = -( this.RESISTANCE*vx + this.DRAG*vx*Math.abs(vx) );
        resistanceForce.y = -( this.RESISTANCE*vy + this.DRAG*vy*Math.abs(vy) );
        return resistanceForce;
    },

    calcTraction: function(velocity) {
        // Find the direction (if going backwards, the brake work in other direction)
        var ux;
        if (velocity.x != 0)
            ux = velocity.x / Math.abs(velocity.x)
        else
            ux = 0;

        var tractionForce = {x: 0, y: 0};
        tractionForce.x = 50.0 * (this.throttle - ux*this.brake);
        if (this.rear_slip)
            tractionForce.x *= 0.5;
        return tractionForce;
    },

    physics: function(delta) {
        var cos = Math.cos(this.angle),
            sin = Math.sin(this.angle);

        // Velocity transformation
        var velocity = {x: 0, y: 0};
        velocity.x = round( cos*this.vel_wc.y + sin*this.vel_wc.x , 2);
        velocity.y = round( -sin*this.vel_wc.y + cos*this.vel_wc.x , 2);

        // Lateral force on wheels
        var yawSpeed = this.wheelBase*0.5*this.angularVel;

        // Bangz: vel.x = fVlong, vel.y = fVlat
        var rotAngle;
        if (Math.abs(this.angularVel) < this.calcLimitAv && Math.abs(velocity.x) < this.calcLimit)
            rotAngle = 0;
        else
            rotAngle = Math.atan2(yawSpeed, velocity.x);

        // Calculate side slip angle of the car (aka beta)
        var sideSlip;
        if (Math.abs(velocity.y) < this.calcLimit && Math.abs(velocity.x) < this.calcLimit)
            sideSlip = 0;
        else
            sideSlip = Math.atan2(velocity.y, velocity.x);

        // Calculate slip angles for front and rear wheels (aka alpha)
        var slipAngleFront = sideSlip + rotAngle - this.steerAngle;
        var slipAngleRear = sideSlip - rotAngle;

        // Weight per axle = half car mass times 1G
        var weight = this.mass * 9.8 * 0.5;

        // Lateral force on front wheels = (Ca * slipAngle) capped to friction circle*load
        var flatF = {x: 0, y: 0};
        flatF.y = this.CA_F * slipAngleFront;
        flatF.y = Math.min(this.MAX_GRIP, flatF.y);
        flatF.y = Math.max(-this.MAX_GRIP, flatF.y);
        flatF.y = flatF.y * weight;
        if (this.front_slip)
            flatF.y = flatF.y * 0.5;

        // Lateral force on rear wheels
        var flatR = {x: 0, y: 0};
        flatR.y = this.CA_R * slipAngleRear;
        flatR.y = Math.min(this.MAX_GRIP, flatR.y);
        flatR.y = Math.max(-this.MAX_GRIP, flatR.y);
        flatR.y = flatR.y * weight;
        if (this.front_slip)
            flatR.y = flatR.y * 0.5;

        // Longitudal fornce on rear wheels (TRACTION)
        var fTraction = this.calcTraction(velocity);

        // Forces on body (RESISTANCE)
        var fResistance = this.calcResistance(velocity);

        // Lateral force sum
        var flat = {x: 0, y: 0};
        flat.x = Math.sin(this.steerAngle)*flatF.x + flatR.x;
        flat.y = Math.cos(this.steerAngle)*flatF.y + flatR.y;

        // Sum forces
        var force = {x: 0, y: 0};
        force.x = fTraction.x + flat.x + fResistance.x;
        force.y = fTraction.y + flat.y + fResistance.y;        

        // Torque on body (from lateral forces)
        var bodyTorque = this.b*flatF.y - this.c*flatR.y;

        // Acceleration
        var acceleration = {x: 0, y: 0};
        acceleration.x = force.x / this.mass;
        acceleration.y = force.y / this.mass;

        if (Math.abs(velocity.x) < this.calcLimit)
            acceleration.y = -velocity.y;

        var angularAcc;
        if (Math.abs(velocity.x) < this.calcLimit)
            angularAcc = -this.angularVel;
        else
            angularAcc = bodyTorque / this.inertia;

        // Transform to world reference
        this.acc_wc.x = cos*acceleration.y + sin*acceleration.x;
        this.acc_wc.y = -sin*acceleration.y + cos*acceleration.x;

        // Velocity (integrated acceleration)
        this.vel_wc.x += delta * this.acc_wc.x;
        this.vel_wc.y += delta * this.acc_wc.y;

        // Position
        this.pos_wc.x += delta * this.vel_wc.x;
        this.pos_wc.y += delta * this.vel_wc.y;

        // Angular velocity and heading
        this.angularVel += delta * angularAcc;
        this.angle += delta * this.angularVel;
    },

    update: function() {
        this.physics(1/45); // this.game.timer.getFPS();

        // Calculate speed
        var vx2 = Math.pow(this.vel_wc.x,2),
            vy2 = Math.pow(this.vel_wc.y,2);
        this.speed = Math.sqrt( vx2 + vy2 );

        // Move sprite to position of object
        this.position.x = this.pos_wc.x*this.scale;
        this.position.y = this.pos_wc.y*this.scale;
        this.sprite.position.x = this.position.x;
        this.sprite.position.y = this.position.y;

        // Rotate to angle
        this.sprite.rotation = -this.angle;
    },

    createSprite: function() {
        this.texture = PIXI.Texture.fromImage(this.image);
        this.sprite = new PIXI.Sprite(this.texture);
        // Center the sprites anchor point
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        // Move sprite to position of object
        this.sprite.position.x = this.pos_wc.x*this.scale;
        this.sprite.position.y = this.pos_wc.y*this.scale;
        // Scale sprite
        this.sprite.width = this.width * this.scale;
        this.sprite.height = this.length * this.scale;
        // Add sprite to stage
        this.game.world.addChild(this.sprite);
    }

};



function round(num, dec) {
    dec *= Math.pow(10,dec);
    return Math.round(num*dec)/dec;
}



/**
 * Player class
 */
var Player = function(game, x, y, image, settings) {
    Car.call(this, game, x, y, image, settings);
};
Player.prototype = new Car();
Player.prototype.constructor = Player;
Player.prototype.update = function() {
    // Call parent
    Car.prototype.update.call(this);

    // React to input
    this.reactToInput();
};
Player.prototype.reactToInput = function() {
    // Turning
    if (this.game.keyPressed.LEFT && this.steerAngle < this.MAX_TURN)
        this.steerAngle += this.TURN;
    else if (this.game.keyPressed.RIGHT && this.steerAngle > -this.MAX_TURN)
        this.steerAngle -= this.TURN;
    else
        this.steerAngle = 0;

    // Throttle & brake
    if (this.game.keyPressed.UP)
        this.throttle = Math.min(100, this.throttle+2);
    else 
        this.throttle = Math.max(0, this.throttle-2);
    if (this.game.keyPressed.DOWN) {
        this.throttle = 0;
        this.brake = 100; // Slam the brake
    } else
        this.brake = 0;
};