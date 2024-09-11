const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight - 100;

let force_x = 0;
let force_y = 500; // Gravity (increased for more visible effect)
let damp_constant = 0.2;

function distance(p0, p1) {
  let dx = p1.x - p0.x;
  let dy = p1.y - p0.y;
  return Math.sqrt(dx * dx + dy * dy);
}

class Point {
  constructor(x, y, mass, pinned) {
    this.x = x;
    this.y = y;
    this.old_x = x;
    this.old_y = y;
    this.mass = mass;
    this.pinned = pinned;
    this.radius = 10;
  }

  update(dt) {
    if (!this.pinned) {
      let vel_x = (this.x - this.old_x)
      let vel_y = (this.y - this.old_y)

      this.old_x = this.x;
      this.old_y = this.y;

      let acc_x = force_x / this.mass;
      let acc_y = force_y / this.mass;

      this.x += vel_x + acc_x * dt * dt;
      this.y += vel_y + acc_y * dt * dt;
    }
  }

  constrain() {
    let vel_x = (this.x - this.old_x);
    let vel_y = (this.y - this.old_y);
    if (this.x < 0) {
      this.x = 0;
      this.old_x = this.x + vel_x * damp_constant;
    } else if (this.x > SCREEN_WIDTH) {
      this.x = SCREEN_WIDTH;
      this.old_x = this.x + vel_x * damp_constant;
    }
    if (this.y < 0) {
      this.y = 0;
      this.old_y = this.y + vel_y * damp_constant;
    } else if (this.y > SCREEN_HEIGHT) {
      this.y = SCREEN_HEIGHT;
      this.old_y = this.y + vel_y * damp_constant;
    }
  }

  render() {
    noStroke();
    fill("white");
    circle(this.x, this.y, this.radius * 2);
  }

  isMouseOver() {
    return distance(this, {x: mouseX, y: mouseY}) < this.radius;
  }
}

class Link {
  constructor(p0, p1, restLength, harmonic, diagonal) {
    this.p0 = p0;
    this.p1 = p1;
    this.restLength = restLength;
    this.frameCount = 0;
    this.harmonic = harmonic;
    this.diagonal = diagonal;

    console.log(this.harmonic);
  }

  update(dt) {
    let length = this.restLength;

    if (this.harmonic) {
      length = this.restLength + Math.sin(this.frameCount / 200) * 20;
    }

    let dx = this.p1.x - this.p0.x;
    let dy = this.p1.y - this.p0.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let diff = length - dist;
    let percent = (diff / dist) / 2;
    
    let offset_x = dx * percent;
    let offset_y = dy * percent;
    
    if (!this.p0.pinned) {
      this.p0.x -= offset_x;
      this.p0.y -= offset_y;
    }
    
    if (!this.p1.pinned) {
      this.p1.x += offset_x;
      this.p1.y += offset_y;
    }
    this.frameCount++;
  }

  render() {
    stroke('gray');
    line(this.p0.x, this.p0.y, this.p1.x, this.p1.y);
  }
}

class Box {
  constructor(p1, p2, p3, p4, oscillating) {
    this.ptArray = [p1, p2, p3, p4];
    this.linkArray = [
      new Link(p1, p2, distance(p1, p2), false),
      new Link(p2, p3, distance(p2, p3), false),
      new Link(p3, p4, distance(p3, p4), false),
      new Link(p4, p1, distance(p4, p1), false),
      new Link(p1, p3, distance(p1, p3), false, true),
    ];

    this.oscillating = oscillating;
    this.initialWidth = distance(p1, p2);
    this.initialHeight = distance(p2, p3);
    this.initialDiagonal = distance(p1, p3);
  }

  update(dt) {
    if (this.oscillating) {
      // Oscillate width
      let widthChange = Math.pow(Math.sin(this.linkArray[0].frameCount / 20), 2) * 20;
      this.linkArray[0].restLength = this.initialWidth + widthChange;
      this.linkArray[2].restLength = this.initialWidth + widthChange;

      let heightChange = 0
      this.linkArray[1].restLength = this.initialHeight + heightChange;
      this.linkArray[3].restLength = this.initialHeight + heightChange;

      let newWidth = this.initialWidth + widthChange;
      let newHeight = this.initialHeight + heightChange;
      let newDiagonal = Math.sqrt(newWidth * newWidth + newHeight * newHeight);
      this.linkArray[4].restLength = newDiagonal;
    }

    for (let link of this.linkArray) {
      link.update(dt);
    }

    for (let point of this.ptArray) {
      point.update(dt);
      point.constrain();
    }

    this.render();
  }

  render() {
    for (let link of this.linkArray) {
      link.render();
    }

    for (let point of this.ptArray) {
      point.render();
    }
  }
}

let points = [
  new Point(200, 200, 1.0, false),  // A
  new Point(300, 200, 1.0, false),  // B
  new Point(300, 300, 1.0, false),  // C
  new Point(200, 300, 1.0, false),  // D
  new Point(400, 100, 1.0, true),   // Anchor
];

let links = [
  new Link(points[0], points[1], distance(points[0], points[1])),  //  A-----B
  new Link(points[1], points[2], distance(points[1], points[2])),  //  | \   |
  new Link(points[2], points[3], distance(points[2], points[3])),  //  |  \  |
  new Link(points[3], points[0], distance(points[3], points[0])),  //  |   \ |
  new Link(points[0], points[2], distance(points[0], points[2])),  //  D-----C
  new Link(points[4], points[2], distance(points[4], points[2]), true)   //         \_(anchor)
];

let boxes = [
  new Box(points[0], points[1], points[2], points[3], true),
];

function setup() {
  canvas = createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT+100);
}

function draw() {  
  let dt = deltaTime / 1000;
  
  background('black');

  // for (let point of points) {
  //   point.update(dt);
  // }

  // // Update all links
  // for (let i = 0; i < 10; i++) {
  //   for (let link of links) {
  //     link.update(dt);
  //   }
  // }
  
  // // Force points to stay inside the window borders
  // for (let point of points) {
  //   point.constrain();
  // }
  
  // // Render all points and links
  // background('black');
  // for (let link of links) {
  //   link.render();
  // }
  // for (let point of points) {
  //   point.render();
  // }

  for (let box of boxes) {
    box.update(dt);
  }
}