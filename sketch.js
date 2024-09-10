const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight - 100;

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
    this.diagonal = diagonal;
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

class Box {
  constructor(centerX, centerY, width, height) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.width = width;
    this.height = height;
    this.points = this.createPoints();
    this.sticks = this.createSticks();
    this.draggingPoint = null;
    this.initialMouseX = 0;
  }

  createPoints() {
    return [
      new Point(this.centerX - this.width/2, this.centerY - this.height/2, 1.0, false),  // A
      new Point(this.centerX + this.width/2, this.centerY - this.height/2, 1.0, false),  // B
      new Point(this.centerX + this.width/2, this.centerY + this.height/2, 1.0, false),  // C
      new Point(this.centerX - this.width/2, this.centerY + this.height/2, 1.0, false),  // D
    ];
  }

  createSticks() {
    return [
      new Stick(this.points[0], this.points[1], distance(this.points[0], this.points[1])),  //  A-----B
      new Stick(this.points[1], this.points[2], distance(this.points[1], this.points[2])),  //  | \   |
      new Stick(this.points[2], this.points[3], distance(this.points[2], this.points[3])),  //  |  \  |
      new Stick(this.points[3], this.points[0], distance(this.points[3], this.points[0])),  //  |   \ |
      new Stick(this.points[0], this.points[2], distance(this.points[0], this.points[2]), true),  //  D-----C
    ];
  }

  update(dt) {
    for (let point of this.points) {
      point.update(dt);
    }

    for (let i = 0; i < 10; i++) {
      for (let stick of this.sticks) {
        stick.update(dt);
      }
      this.maintainRightAngles();
    }
    
    for (let point of this.points) {
      point.constrain();
    }
  }

  render() {
    for (let stick of this.sticks) {
      stick.render();
    }
    for (let point of this.points) {
      point.render();
    }
  }

  maintainRightAngles() {
    let avgWidth = (this.sticks[0].restLength + this.sticks[2].restLength) / 2;
    let avgHeight = (this.sticks[1].restLength + this.sticks[3].restLength) / 2;

    let centerX = (this.points[0].x + this.points[1].x + this.points[2].x + this.points[3].x) / 4;
    let centerY = (this.points[0].y + this.points[1].y + this.points[2].y + this.points[3].y) / 4;

    this.points[0].x = centerX - avgWidth / 2;
    this.points[0].y = centerY - avgHeight / 2;

    this.points[1].x = centerX + avgWidth / 2;
    this.points[1].y = centerY - avgHeight / 2;

    this.points[2].x = centerX + avgWidth / 2;
    this.points[2].y = centerY + avgHeight / 2;

    this.points[3].x = centerX - avgWidth / 2;
    this.points[3].y = centerY + avgHeight / 2;

    this.sticks[4].restLength = distance(this.points[0], this.points[2]);
  }

  handleMousePressed(mouseX, mouseY) {
    for (let point of this.points) {
      if (point.isMouseOver()) {
        this.draggingPoint = point;
        this.initialMouseX = mouseX;
        return true;
      }
    }
    return false;
  }

  handleMouseDragged(mouseX) {
    if (this.draggingPoint) {
      let dx = mouseX - this.initialMouseX;
      
      // Determine which side the dragging point is on
      let isLeftSide = (this.draggingPoint === this.points[0] || this.draggingPoint === this.points[3]);
      
      // Move the points on the same side
      if (isLeftSide) {
        this.points[0].x += dx;
        this.points[3].x += dx;
      } else {
        this.points[1].x += dx;
        this.points[2].x += dx;
      }
      
      // Update old positions to prevent sudden velocity changes
      for (let point of this.points) {
        point.old_x = point.x;
      }

      // Update stick rest lengths for horizontal sticks only
      this.sticks[0].restLength = distance(this.points[0], this.points[1]);
      this.sticks[2].restLength = distance(this.points[2], this.points[3]);
      
      this.initialMouseX = mouseX;
      return true;
    }
    return false;
  }

  handleMouseReleased() {
    if (this.draggingPoint) {
      this.draggingPoint = null;
      return true;
    }
    return false;
  }
}

let boxes = [];

function setup() {
  canvas = createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT+100);
  // Create multiple boxes
  boxes.push(new Box(250, SCREEN_HEIGHT-30, 50, 50));
  boxes.push(new Box(400, SCREEN_HEIGHT-30, 50, 50));
  boxes.push(new Box(550, SCREEN_HEIGHT-30, 50, 50));
}

function draw() {  
  let dt = deltaTime / 1000;
  
  for (let box of boxes) {
    box.update(dt);
  }
  
  background('black');
  for (let box of boxes) {
    box.render();
  }
}

function mousePressed() {
  for (let box of boxes) {
    if (box.handleMousePressed(mouseX, mouseY)) {
      break;
    }
  }
}

function mouseDragged() {
  for (let box of boxes) {
    if (box.handleMouseDragged(mouseX)) {
      break;
    }
  }
}

function mouseReleased() {
  for (let box of boxes) {
    if (box.handleMouseReleased()) {
      break;
    }
  }
}