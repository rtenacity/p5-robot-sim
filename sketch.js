const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight -100;

let force_x = 0;
let force_y = 980; // Gravity (increased for more visible effect)

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
      let vel_x = (this.x - this.old_x) * 0.99; // Add some damping
      let vel_y = (this.y - this.old_y) * 0.99;

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
      this.old_x = this.x + vel_x * 0.9; // Add bounce effect
    } else if (this.x > SCREEN_WIDTH) {
      this.x = SCREEN_WIDTH;
      this.old_x = this.x + vel_x * 0.9;
    }
    if (this.y < 0) {
      this.y = 0;
      this.old_y = this.y + vel_y * 0.9;
    } else if (this.y > SCREEN_HEIGHT) {
      this.y = SCREEN_HEIGHT;
      this.old_y = this.y + vel_y * 0.9;
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

class Stick {
  constructor(p0, p1, restLength, diagonal = false) {
    this.p0 = p0;
    this.p1 = p1;
    this.restLength = restLength;
  }
  update(dt) {
    let dx = this.p1.x - this.p0.x;
    let dy = this.p1.y - this.p0.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let diff = this.restLength - dist;
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
  }
  render() {
    stroke('gray');
    line(this.p0.x, this.p0.y, this.p1.x, this.p1.y);
  }
}

let points = [
  new Point(250, 250, 1.0, false),  // A
  new Point(300, 250, 1.0, false),  // B
  new Point(300, 300, 1.0, false),  // C
  new Point(250, 300, 1.0, false),  // D
];

let sticks = [
  new Stick(points[0], points[1], distance(points[0], points[1])),  //  A-----B
  new Stick(points[1], points[2], distance(points[1], points[2])),  //  | \   |
  new Stick(points[2], points[3], distance(points[2], points[3])),  //  |  \  |
  new Stick(points[3], points[0], distance(points[3], points[0])),  //  |   \ |
  new Stick(points[0], points[2], distance(points[0], points[2]), true),  //  D-----C
];

let draggingPoint = null;
let initialMouseX = 0;

function setup() {
  canvas = createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT+100);
}

function draw() {  
  let dt = deltaTime / 1000;
  
  for (let point of points) {
    point.update(dt);
  }

  for (let i = 0; i < 10; i++) {
    for (let stick of sticks) {
      stick.update(dt);
    }
    maintainRightAngles();
  }
  
  for (let point of points) {
    point.constrain();
  }
  
  background('black');
  for (let stick of sticks) {
    stick.render();
  }
  for (let point of points) {
    point.render();
  }
}

function maintainRightAngles() {
  let avgWidth = (sticks[0].restLength + sticks[2].restLength) / 2;
  let avgHeight = (sticks[1].restLength + sticks[3].restLength) / 2;

  let centerX = (points[0].x + points[1].x + points[2].x + points[3].x) / 4;
  let centerY = (points[0].y + points[1].y + points[2].y + points[3].y) / 4;

  points[0].x = centerX - avgWidth / 2;
  points[0].y = centerY - avgHeight / 2;

  points[1].x = centerX + avgWidth / 2;
  points[1].y = centerY - avgHeight / 2;

  points[2].x = centerX + avgWidth / 2;
  points[2].y = centerY + avgHeight / 2;

  points[3].x = centerX - avgWidth / 2;
  points[3].y = centerY + avgHeight / 2;

  sticks[4].restLength = distance(points[0], points[2]);
}

function mousePressed() {
  for (let point of points) {
    if (point.isMouseOver()) {
      draggingPoint = point;
      initialMouseX = mouseX;
      break;
    }
  }
}

function mouseDragged() {
  if (draggingPoint) {
    let dx = mouseX - initialMouseX;
    
    // Determine which side the dragging point is on
    let isLeftSide = (draggingPoint === points[0] || draggingPoint === points[3]);
    
    // Move the points on the same side
    if (isLeftSide) {
      points[0].x += dx;
      points[3].x += dx;
    } else {
      points[1].x += dx;
      points[2].x += dx;
    }
    
    // Update old positions to prevent sudden velocity changes
    for (let point of points) {
      point.old_x = point.x;
    }

    // Update stick rest lengths for horizontal sticks only
    sticks[0].restLength = distance(points[0], points[1]);
    sticks[2].restLength = distance(points[2], points[3]);
    
    initialMouseX = mouseX;
  }
}

function mouseReleased() {
  draggingPoint = null;
}