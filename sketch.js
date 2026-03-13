let video;
let view_width;
let view_height;
let clear;
let prev_size;

const max_number = 2000;
let x_offsets = [];
let dot_radius = [];
let noiseVal;
let noiseScale = 0.02;

let bkg_color;
let warm_color;
let dark_color;


function setup() {
  prev_size = 0;
  clear = true;
  view_width = windowWidth-5;
  view_height = windowHeight-5;
  createCanvas(view_width,view_height);
  background(0);
  video = createCapture(VIDEO);
  video.hide();

  createCanvas(windowWidth - 5, windowHeight - 5);
  for (let i = 0; i < 1000; i++) {
    x_offsets[i] = random(0, 4);
  }

  for (let i = 0; i < max_number; i++) {
    dot_radius.push({ x: random(2, 4), y: random(1, 2) });
  }

}

function get_video_scale(video, canvasWidth, canvasHeight) {
  let res = {};
  let video_ratio = video.width/video.height;
  let window_ratio = canvasWidth/canvasHeight;
//  if (window_ratio<1) { 
//    // portrait mode
//  } else {
//    // landscape  
//  }
    if (video_ratio<=window_ratio) {
      //the display is wider. strech the video from bottom to top with margins on the sides
      res.height = canvasHeight;
      res.width = video_ratio * canvasHeight;
      res.x = (canvasWidth - res.width)/2;
      res.y = 0;
    } else {
      //the display is narrower. strech the video from left to right with margins on the top/bottom
      res.width = canvasWidth;
      res.height = canvasWidth / video_ratio;
      res.x = 0;;
      res.y = (canvasHeight - res.height)/2;
    }
  return res;    
}

function video_to_canvas(video, x, y, canvasWidth, canvasHeight) {
  var res = {}
  var scale = get_video_scale(video, canvasWidth, canvasHeight);
  res.x = res.x + map(x,0,video.width,0, res.width);
  res.y = res.y + map(y,0,video.height,0, res.height);
  return res;
}

function canvas_to_video(video, x, y, canvasWidth, canvasHeight) {
  let res = {};
  let scale = get_video_scale(video, canvasWidth, canvasHeight);
  let min_x = scale.x;
  let max_x = scale.x + scale.width;
  let min_y = scale.y;
  let max_y = scale.y + scale.height;

  if (x>=min_x && x<=max_x && y>=min_y && y<=max_y) {
    res.err = false;
    res.x = 0.0 + round( (x-min_x)/scale.width  * video.width  );
    res.y = 0.0 + round( (y-min_y)/scale.height * video.height );
  } else {
    res.err = true;
    res.x = 0;
    res.y = 0;
  }
  return res;
}

function mapColor(value, min, max, color1, color2, alpha) {
  var r, g, b;

  r = map(value, min, max, red(color1), red(color2), true);
  g = map(value, min, max, green(color1), green(color2), true);
  b = map(value, min, max, blue(color1), blue(color2), true);

  return color(r, g, b, alpha);

}

function draw_outside(x,y) {
  noiseDetail(2, 0.1);
  noiseVal = noise(x * noiseScale, y * noiseScale);
  
  fill(mapColor(noiseVal, 0, 0.3, bkg_color, warm_color, 128));
  let r = noise(x * y * noiseScale * 2) * 20
  arc(x, y - 4 + 12 * noise(x * noiseScale * 2) - 8, r, r, 0, 2 * PI);

}

function draw_inside(x,y,c) {
  noiseDetail(2, 0.1);
  c=255-c;
  noiseVal = noise(x * noiseScale, y * noiseScale);
  //fill(mapColor(c, 0, 10 + noiseVal * 50, bkg_color, warm_color, 128));
  //fill(mapColor(c, 0, 255, bkg_color, warm_color, 128));
  fill(mapColor(c*0.3 + c*noiseVal*0.7, 0, 255*0.3, bkg_color, warm_color, 128))
  let r = map(c,0,255,0,6) + noise(x * y * noiseScale * 2)*15;
  arc(x, y - 4 + 12 * noise(x * noiseScale * 2) - 8, r, r, 0, 2 * PI);
}

function draw() {
  dark_color = color('#674335');
  bkg_color = color('#F8F2DA');
  warm_color = color('#A65A04');
  
  var d=pixelDensity();

  noStroke();

  background(bkg_color);

  if (true) {
    let row = 0;
    let dot_index = 0;
    for (let y = 0; y < windowHeight; y += 17) {
      row++;
      for (let x = 0; x < windowWidth; x += 8) {
        dot_index++;
        fill(dark_color);
        arc(x + x_offsets[row], y, dot_radius[dot_index % max_number].x, dot_radius[dot_index % max_number].y, 0, 2 * PI);
      }
    }
    clear=false;
  }
    

  var mapped;
  if (video) {
    var capture = createGraphics(video.width,video.height);
    if (video.width*video.height != prev_size) {
      prev_size = video.width * video.height;
      clear=true;
    }
    capture.image(video,0,0);
    capture.filter('GRAY');
    capture.loadPixels();
    for (let x=0; x<view_width; x = x+4) {
      for (let y=0; y<view_height; y = y+17) {
        mapped = canvas_to_video(video, view_width-x-1, y, view_width, view_height);
        if (!mapped.err)
        {
          var pixel_index = d*4*mapped.y*video.width + d*4*mapped.x;

          if (capture.pixels && pixel_index<capture.pixels.length) {
            if (capture.pixels[ pixel_index ] >=0 && capture.pixels[ pixel_index ]<=255) {
              draw_inside(x,y,capture.pixels[pixel_index]);  
            }
          }
        }
        else {
          draw_outside(x,y);
        }
      }
    } 
  }
    
}

function mousePressed() {
  console.log("frame rate:" + frameRate());
}

function windowResized() {
  clear = true;
  view_width = windowWidth-5;
  view_height = windowHeight-5;
  resizeCanvas(view_width,view_height);
}