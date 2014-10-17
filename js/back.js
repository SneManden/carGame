var Back = function(game, width, height, image, settings) {
    this.game = game;
    this.width = width;
    this.height = height;
    this.image = image;
    for (var i in settings)
        this[i] = settings[i];
    
    this.count = 0;
};
Back.prototype = {

    createSprite: function() {
        this.texture = PIXI.Texture.fromImage(this.image);
        this.sprite = new PIXI.TilingSprite(this.texture, this.width, this.height);
        // Add sprite to stage
        this.game.stage.addChild(this.sprite);
    },

    update: function() {
        this.sprite.tilePosition.x = this.game.world.position.x;
        this.sprite.tilePosition.y = this.game.world.position.y;
    }

}