éimport { Scene, Math as PhaserMath, GameObjects } from "phaser";
import { Body, Vec2, World, Circle } from "planck";

let game;

let gameOptions = {
  // starting terrain height, in % of game height
  startTerrainHeight: 0.5,

  // slope amplitude. The higher the value, the higher the hills
  slopeAmplitude: 120,

  // slope lenght range, in pixels
  slopeLengthRange: [100, 350],

  // amount of pixels in a meter, in Box2D world
  worldScale: 30,
};

window.onload = function () {
  let gameConfig = {
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent: "thegame",
      width: 1334,
      height: 750,
    },
    scene: playGame,
  };
  game = new Phaser.Game(gameConfig);
  window.focus();
};

class playGame extends Scene {
  world!: World
  ground!: Body
  slopeStart!: PhaserMath.Vector2
  debugDrawGraphics!: GameObjects.Graphics
  edgeText!: GameObjects.Text
  ball!: Body

  constructor() {
    super("PlayGame");
  }

  create() {
    // gravity vector
    let gravity = Vec2(0, 4);

    // box2D world creation
    this.world = World(gravity);

    // body to represent the ground
    this.ground = this.world.createBody();

    // slope start coordinates
    this.slopeStart = new PhaserMath.Vector2(0, 0);

    // terrain generation
    this.generateTerrain();

    // graphics game object where to draw the debug draw
    this.debugDrawGraphics = this.add.graphics();

    // a text game object to display the number of edges used
    this.edgeText = this.add.text(10, game.config.height - 60, "", {
      fontFamily: "Arial",
      fontSize: 48,
      color: "#00ff00",
    });

    // method to add the ball
    this.addBall();
  }

  generateTerrain() {
    // while next slope starting X coordinate is less than game width and camera scroll...
    while (this.slopeStart.x < this.cameras.main.scrollX + game.config.width) {
      // ... generate a new slope
      this.generateSlope();
    }
  }

  addBall() {
    // ball body
    this.ball = this.world.createBody();

    // set the ball dynamic
    this.ball.setDynamic();

    // creation of a circle fixture to be assigned to the ball
    this.ball.createFixture(Circle(1));

    // set ball position
    this.ball.setPosition(
      Vec2(150 / gameOptions.worldScale, -100 / gameOptions.worldScale)
    );

    // set ball mass data
    this.ball.setMassData({
      mass: 1,
      center: Vec2(),
      I: 1,
    });
  }

  generateSlope() {
    // array to store slope points
    let slopePoints = [];

    // slope start point
    let slopeStart = new Phaser.Math.Vector2(0, this.slopeStart.y);

    // set a random slope length
    let slopeLengthRange = Phaser.Math.Between(
      gameOptions.slopeLengthRange[0],
      gameOptions.slopeLengthRange[1]
    );

    // determine slope end point, with an exception if this is the firstslope: we want it to be flat
    let slopeEnd =
      this.slopeStart.x == 0
        ? new Phaser.Math.Vector2(
            slopeStart.x + gameOptions.slopeLengthRange[1] * 1.5,
            0
          )
        : new Phaser.Math.Vector2(
            slopeStart.x + slopeLengthRange,
            Math.random()
          );

    // current horizontal point
    let pointX = 0;

    // while the slope hans't been completely generated...
    while (pointX <= slopeEnd.x) {
      // slope interpolation value
      let interpolationVal = this.interpolate(
        slopeStart.y,
        slopeEnd.y,
        (pointX - slopeStart.x) / (slopeEnd.x - slopeStart.x)
      );

      // current vertical point
      let pointY =
        game.config.height * gameOptions.startTerrainHeight +
        interpolationVal * gameOptions.slopeAmplitude;

      // add new point to slopePoints array
      slopePoints.push(new Phaser.Math.Vector2(pointX, pointY));

      // move on to next point
      pointX++;
    }

    // simplify the slope
    let simpleSlope = simplify(slopePoints, 1, true);

    // loop through all simpleSlope points starting from the second
    for (let i = 1; i < simpleSlope.length; i++) {
      // create a Box2D edge
      this.ground.createFixture(
        planck.Edge(
          planck.Vec2(
            (simpleSlope[i - 1].x + this.slopeStart.x) / gameOptions.worldScale,
            simpleSlope[i - 1].y / gameOptions.worldScale
          ),
          planck.Vec2(
            (simpleSlope[i].x + this.slopeStart.x) / gameOptions.worldScale,
            simpleSlope[i].y / gameOptions.worldScale
          )
        ),
        {
          density: 0,
          friction: 1,
        }
      );
    }

    // upldate next slope start point
    this.slopeStart.x += pointX - 1;
    this.slopeStart.y = slopeEnd.y;
  }

  update(t, dt) {
    // advance Box2D world simulation
    this.world.step((dt / 1000) * 2);

    // reset Box2D world forces
    this.world.clearForces();

    // get ball position
    let ballPosition = this.ball.getPosition();

    // scroll the camera accordingly
    this.cameras.main.scrollX = ballPosition.x * gameOptions.worldScale - 150;

    // set ball angular velocity
    this.ball.setAngularVelocity(10);

    // debug draw
    this.debugDraw();

    // keep generating terrain
    this.generateTerrain();
  }

  // below this line, only functions to represent objects on the screen or common math functions

  debugDraw() {
    this.debugDrawGraphics.clear();
    let edges = 0;
    for (let body = this.world.getBodyList(); body; body = body.getNext()) {
      for (
        let fixture = body.getFixtureList();
        fixture;
        fixture = fixture.getNext()
      ) {
        let shape = fixture.getShape();
        switch (fixture.getType()) {
          case "edge": {
            edges++;
            this.debugDrawGraphics.lineStyle(4, 0xff0000);
            let v1 = shape.m_vertex1;
            let v2 = shape.m_vertex2;
            if (v2.x * gameOptions.worldScale < this.cameras.main.scrollX) {
              body.destroyFixture(fixture);
            } else {
              this.debugDrawGraphics.beginPath();
              this.debugDrawGraphics.moveTo(
                v1.x * gameOptions.worldScale,
                v1.y * gameOptions.worldScale
              );
              this.debugDrawGraphics.lineTo(
                v2.x * gameOptions.worldScale,
                v2.y * gameOptions.worldScale
              );
              this.debugDrawGraphics.strokePath();
            }
            break;
          }
          case "circle": {
            let position = body.getPosition();
            let angle = body.getAngle();
            this.debugDrawGraphics.fillStyle(0x00ff00, 0.5);
            this.debugDrawGraphics.fillCircle(
              position.x * gameOptions.worldScale,
              position.y * gameOptions.worldScale,
              shape.m_radius * gameOptions.worldScale
            );
            this.debugDrawGraphics.lineStyle(2, 0x00ff00);
            this.debugDrawGraphics.strokeCircle(
              position.x * gameOptions.worldScale,
              position.y * gameOptions.worldScale,
              shape.m_radius * gameOptions.worldScale
            );
            this.debugDrawGraphics.beginPath();
            this.debugDrawGraphics.moveTo(
              position.x * gameOptions.worldScale,
              position.y * gameOptions.worldScale
            );
            this.debugDrawGraphics.lineTo(
              position.x * gameOptions.worldScale + 30 * Math.cos(angle),
              position.y * gameOptions.worldScale + 30 * Math.sin(angle)
            );
            this.debugDrawGraphics.strokePath();
            break;
          }
        }
      }
    }
    this.edgeText.x = this.cameras.main.scrollX + 10;
    this.edgeText.text = "Edges to generate terrain: " + edges;
  }
  interpolate(vFrom, vTo, delta) {
    let interpolation = (1 - Math.cos(delta * Math.PI)) * 0.5;
    return vFrom * (1 - interpolation) + vTo * interpolation;
  }
}
