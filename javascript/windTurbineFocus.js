const w = 1500;
const h = 900;
const healthCurveH = 200;
const margin = {top: 30, right: 30, bottom: 30, left: 80};

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
var healthCurveXAxis = d3.axisBottom(healthCurveX)
    .tickFormat(d3.timeFormat("%Y %m-%d"));
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

// Define parallel coordinates
const paraCoordGraphH = 600;

var paraCoordX = d3.scalePoint().range([0, diagramsW]),
    dragging = {};
let paraCoordY = {},
    paraCoordAxis = {};

var paraCoordLine = d3.line(),
    paraCoordBackground,
    paraCoordForeground;

var paraCoordGraph = svg.append("g")
    .attr("class", "paraCoord")
    .attr("transform", "translate(" + margin.left + "," + (2 * margin.top + healthCurveH + margin.bottom) + ")");

function createParaCoordScaleAndAxis(d) {
    if (d == "datetime") {
        paraCoordY[d] = d3.scaleTime()
            .domain(d3.extent(windTurbineData, function(p) { return +p[d]; }))
            .range([paraCoordGraphH, 0]);
        paraCoordAxis[d] = d3.axisLeft()
            .tickFormat(d3.timeFormat("%Y-%m-%d"));
    } else {
        paraCoordY[d] = d3.scaleLinear()
            .domain(d3.extent(windTurbineData, function(p) { return +p[d]; }))
            .range([paraCoordGraphH, 0]);
        paraCoordAxis[d] = d3.axisLeft();
    }
}

function drawParaCoordGraph() {
    dimensions = getWindTurbineColumns().filter(
        function(d) {
            return d != "name" && d != "normal" && d != "index"
        });
    dimensions.filter(function (d) {
        createParaCoordScaleAndAxis(d);
    });
    paraCoordX.domain(dimensions);

    // Add grey background lines for context.
    background = paraCoordGraph.append("g")
        .attr("class", "background")
      .selectAll("path")
        .data(windTurbineData)
      .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = paraCoordGraph.append("g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(windTurbineData)
      .enter().append("path")
        .attr("d", path);

    // Add a group element for each dimension.
    var g = paraCoordGraph.selectAll(".dimension")
        .data(dimensions)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + paraCoordX(d) + ")"; })
        .call(d3.drag()
        //   .origin(function(d) { return {x: paraCoordX(d)}; })
          .subject(function (d) {
              return {x: paraCoordX(d)};
          })
          .on("start", function(d) {
            dragging[d] = paraCoordX(d);
            background.attr("visibility", "hidden");
          })
          .on("drag", function(d) {
            dragging[d] = Math.min(diagramsW, Math.max(0, d3.event.x));
            foreground.attr("d", path);
            dimensions.sort(function(a, b) { return position(a) - position(b); });
            paraCoordX.domain(dimensions);
            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
          })
          .on("end", function(d) {
            delete dragging[d];
            transition(d3.select(this)).attr("transform", "translate(" + paraCoordX(d) + ")");
            transition(foreground).attr("d", path);
            background
                .attr("d", path)
              .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
          }));

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(paraCoordAxis[d].scale(paraCoordY[d])); })
      .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .attr("fill", "black")
        .text(function(d) { return d; });

    // Add and store a brush for each axis.
    g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(paraCoordY[d].brush = d3.brushY().on("brush start", brushstart).on("brush", brush));
      })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);
}

function position(d) {
  var v = dragging[d];
  return v == null ? paraCoordX(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return paraCoordLine(dimensions.map(function(p) { return [position(p), paraCoordY[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !paraCoordY[p].brush.empty(); }),
      extents = actives.map(function(p) { return paraCoordY[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}

function data_loaded() {
    windTurbineData = getWindTurbineData("R80790-10", dataset);
    for (let i = 0; i < 10; i++) {
        console.log(windTurbineData[i]);
    }
    draw_health_curve()
    drawParaCoordGraph()
    svg.selectAll(".tick text")
      .call(wrap, 8);
}

function wrap(text, width) {
    text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
    });
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

loadPark('parc4');
