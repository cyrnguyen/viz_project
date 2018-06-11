const w = 1500;
const h = 600;
const healthCurveH = 200;
const margin = {top: 30, right: 30, bottom: 30, left: 30};

var diagramsW = w - margin.left - margin.right;

// Data
var dataset = [];
var windTurbineData = [];

// global SVG
var svg = d3.select("body")
            .append("svg")
                .attr("width", w)
                .attr("height", h);

// Define health curve
var healthCurveX = d3.scaleTime().range([0, diagramsW]),
    healthCurveY = d3.scaleLinear().range([healthCurveH, 0]);
var healthCurveXAxis = d3.axisBottom(healthCurveX),
    healthCurveYAxis = d3.axisLeft(healthCurveY);

var area = d3.area()
    .curve(d3.curveMonotoneX)
    .defined(function(d) {return d.index  < 2.0})
    .x(function(d) { return healthCurveX(d.datetime); })
    .y0(healthCurveH)
    .y1(function(d) { return healthCurveY(d.index); });

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", diagramsW)
    .attr("height", healthCurveH);

var health_curve = svg.append("g")
    .attr("class", "health_curve")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var brush = d3.brushX()
    .extent([[0, 0], [diagramsW, healthCurveH]])
    .on("brush end", brushed);

// Define parallel coordinates
// var paraCoordX = d3.scale.ordinal().rangePoints([0, diagramsW], 1),
//     y = {},
//     dragging = {};
//
// var paraCoordLine = d3.svg.line(),
//     paraCoordAxis = d3.svg.axis().orient("left"),
//     paraCoordBackground,
//     paraCoordForeground;
//
// var paraCoordGraph = svg.append("g")
//     .attr("class", "paraCoord")
//     .attr("transform", "translate(" + margin.left + "," + (2 * margin.top + healthCurveH) + ")");

function draw_health_curve() {
    healthCurveX.domain(d3.extent(windTurbineData, function(d) { return d.datetime; }));
    healthCurveY.domain([0, 1]);

    health_curve.append("path")
      .datum(windTurbineData)
      .attr("class", "area")
      .attr("d", area);

    health_curve.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + healthCurveH + ")")
      .call(healthCurveXAxis);

    health_curve.append("g")
      .attr("class", "axis axis--y")
      .call(healthCurveYAxis);



    health_curve.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, healthCurveX.range());
}

function drawParaCoordGraph() {

}

function data_loaded() {
    windTurbineData = getWindTurbineData("R80790-10", dataset);
    for (let i = 0; i < 100; i++) {
        console.log(windTurbineData[i]);
    }
    draw_health_curve()
}

function brushed() {
  // if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  // var s = d3.event.selection || x2.range();
  // x.domain(s.map(x2.invert, x2));
  // focus.select(".area").attr("d", area);
  // focus.select(".axis--x").call(healthCurveXAxis);
  // svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
  //     .scale(width / (s[1] - s[0]))
  //     .translate(-s[0], 0));
    console.log("brushing")
}


// Script executed when the script is launched

loadParks();
