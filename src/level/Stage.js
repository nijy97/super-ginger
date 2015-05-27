/**
 * @file 平台
 * @author yumao [zhangyu38@baidu.com]
 */

define(function (require) {

    var util = require('common/util');
    var Food = require('./Food');

    var Stage = function (game) {
        this.game = game;

        this.prev = null;
        this.curr = null;
        this.next = null;
        this.spot = null;
        this.food = null;

        this.height = 235; // TODO: set to global
        this.currEdgeX = 110;
        this.minWidth = 24;
        this.maxWidth = 110;
        this.spotWidth = 10; // TODO: 英雄技能影响

        this.foodProba = 0.5;

        this._init();
    };

    Stage.prototype._init = function () {
        var game = this.game;

        // var curr = game.add.image(0, game.height - this.height, 'stage');
        var curr = game.add.image((game.width - this.maxWidth) / 2, game.height - 150, 'stage');
        curr.scale.set(this.maxWidth, this.height);
        this.curr = curr;
    };

    Stage.prototype.setForPlay = function (useAnim, cb) {
        var game = this.game;

        // 初始化 next
        // 初始 next 限制宽度与距离，使得首次难度不要太奇葩
        var nextWidth = this.maxWidth;
        var next = game.add.image(
            game.width,
            game.height - this.height,
            'stage'
        );
        next.scale.set(nextWidth, this.height);
        this.next = next;
        this.spot = this._createSpot(next);

        var currX = 0;
        var currY = game.height - this.height;
        var nextX = this.currEdgeX + util.random(40, 180);

        if (useAnim) {
            // curr 移动
            var moveCurr = game.add.tween(this.curr)
                .to({x: currX, y: currY}, 200, Phaser.Easing.Linear.None);

            // next 移动
            var moveNext = game.add.tween(next)
                .to({x: nextX}, 200, Phaser.Easing.Linear.None);
            cb && moveNext.onComplete.add(cb);

            moveCurr.chain(moveNext);
            moveCurr.start();
        }
        else {
            var curr = this.curr;
            curr.x = currX;
            curr.y = currY;
            next.x = nextX;
        }
    };

    Stage.prototype._createSpot = function (pillar) {
        var spot = this.game.add.image(0.5, 0, 'spot');
        spot.scale.set(this.spotWidth / pillar.width, 8 / pillar.height); // XXX: 先缩放柱子
        spot.anchor.set(0.5, 0);
        pillar.addChild(spot);

        return spot;
    };

    Stage.prototype._createFood = function () {
        var game = this.game;

        var food = new Food(
            game,
            {
                x: game.width,
                y: game.height - this.height + 10 // TODO: global
            }
        );

        return food;
    };

    Stage.prototype.addNext = function (cb) {
        var game = this.game;

        var nextWidth = util.random(this.minWidth, this.maxWidth);
        var nextMargin = 20;
        var nextX = util.random(this.currEdgeX + nextMargin, game.width - nextWidth - nextMargin);

        // 来一个 food
        var foodWidth = 24;
        var foodMargin = 10;
        var food = null;
        var foodX = nextX;
        var hasFood = !!util.random(0, 1) // 先验概率
            && nextX - this.currEdgeX >= foodWidth + foodMargin * 2; // 间距是否足够放
        if (hasFood) {
            foodX = util.random(this.currEdgeX + foodMargin, nextX - foodMargin - foodWidth);
            // foodX = this.currEdgeX + foodMargin;
            food = this._createFood();
            var moveFood = game.add.tween(food.getEl())
                .to({x: foodX}, 300, Phaser.Easing.Linear.None);
            moveFood.start();
        }

        // 来下一根柱子
        var next = this.game.add.image(
            game.width + nextX - foodX,
            game.height - this.height,
            'stage'
        );
        next.scale.set(nextWidth, this.height);

        var spot = this._createSpot(next);

        var move = game.add.tween(next)
            .to({x: nextX}, 300, Phaser.Easing.Linear.None);
        move.onComplete.add(function () {
            this.prev && this.prev.destroy();
            this.prev = this.curr;
            this.curr = this.next;
            this.next = next;
            this.spot = spot;

            this.food && this.food.destroy();
            this.food = food || null;

            cb && cb();
        }, this);
        move.start();
    };

    Stage.prototype.getCurrEdgeX = function () {
        return this.currEdgeX;
    };

    Stage.prototype.getNextEdgeX = function () {
        var next = this.next;
        return next.x + next.width;
    };

    Stage.prototype.getEl = function () {
        var el = [this.prev, this.curr, this.next];
        this.food && el.push(this.food.getEl());
        return el;
    };

    Stage.prototype.getInterval = function () {
        var curr = this.curr;
        return this.next.x - curr.x - curr.width;
    };

    Stage.prototype.getSpotX = function () {
        var next = this.next;
        return next.x + this.spot.x * next.width;
    };

    Stage.prototype.getSpotRange = function () {
        var lower = this.getSpotX() - this.currEdgeX - this.spotWidth / 2;
        var upper = lower + this.spotWidth;

        return {
            lower: lower,
            upper: upper
        };
    };

    Stage.prototype.getFood = function () {
        return this.food;
    };

    return Stage;

});
