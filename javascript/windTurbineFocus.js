const w = 1500;
const healthCurveH = 200;
const paraCoordGraphH = 600;
const scatterGraphH = 300;
const focusTitleH = 40;
const focusMargin = {top: 80, right: 30, bottom: 50, left: 80};
const scatterGraphW = (w - 3 * (focusMargin.left + focusMargin.right)) / 3
const scattersGraphH = scatterGraphH + focusMargin.bottom + focusMargin.top + scatterGraphH;
const h = focusMargin.top + healthCurveH + focusMargin.bottom + focusMargin.top + paraCoordGraphH + focusMargin.bottom + focusMargin.top + scattersGraphH + focusMargin.bottom;

var diagramsW = w - focusMargin.left - focusMargin.right;

// Data
// var dataset = [];
var windTurbineData = [];

// global focusSVG
var focusSvg = d3.select("[role='focus']")
            .attr("width", w)
            .attr("height", h);

// Define health curve
var healthCurveX = d3.scaleTime().range([0, diagramsW]),
    healthCurveY = d3.scaleLinear().range([healthCurveH, 0]);
var healthCurveXAxis = d3.axisBottom(healthCurveX)
    .tickFormat(d3.timeFormat("%Y-%m-%d %H:%M")),
    healthCurveYAxis = d3.axisLeft(healthCurveY);

var health_curve = focusSvg.append("g");
focusSvg.append("g")
  .attr("transform", "translate(" + focusMargin.left + "," + focusMargin.top + ")")
  .append("text")
  .style("text-anchor", "middle")
  .attr("class", "graph_title")
  .attr("fill", "black")
  .attr("x", "50%")
  .attr("y", - focusTitleH)
  .text("Indicateur de santé");

function initHealthCurve() {
  health_curve.selectAll("*").remove();
  health_curve.attr("class", "health_curve")
    .attr("transform", "translate(" + focusMargin.left + "," + focusMargin.top + ")")
}

function draw_health_curve(domain_dt) {
  initHealthCurve();
  healthCurveX.domain(domain_dt);
  healthCurveY.domain([0, 1]);
  health_curve.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + healthCurveH + ")")
    .call(healthCurveXAxis);

  health_curve.append("g")
    .attr("class", "y axis")
    .call(healthCurveYAxis);

  health_curve.selectAll(".dot")
      .data(windTurbineData)
    .enter().append("circle")
      .attr("class", "dot normal")
      .attr("r", 2)
      .attr("cx", function(d) { return healthCurveX(d.datetime); })
      .attr("cy", function(d) { return healthCurveY(d.index); })
      .attr("cy", function(d) { return healthCurveY(d.index); })
      .style("fill", function (d) {
          idx = d.index
          // whitesmoke color for missing values (index = 2 if NA)
          // if (idx == 2) { return '#F5F5F5'; }
          return quantizeScale(idx);
        });
}


// Define parallel coordinates
var paraCoordX = d3.scalePoint().range([0, diagramsW]),
    dragging = {};
let paraCoordY = {},
    paraCoordAxis = {};

var paraCoordLine = d3.line(),
    paraCoordBackground,
    paraCoordForeground;

var paraCoordGraph = focusSvg.append("g");
focusSvg.append("g")
  .attr("transform", "translate(" + focusMargin.left + "," + (2 * focusMargin.top + healthCurveH + focusMargin.bottom) + ")")
  .append("text")
  .style("text-anchor", "middle")
  .attr("class", "graph_title")
  .attr("fill", "black")
  .attr("x", "50%")
  .attr("y", - focusTitleH)
  .text("Graphe en coordonnées parallèles des relevés de capteurs de l'éolienne");

function createParaCoordScaleAndAxis(d, domain_dt) {
    if (d == "datetime") {
        paraCoordY[d] = d3.scaleTime()
            .domain(domain_dt)
            .range([paraCoordGraphH, 0]);
        paraCoordAxis[d] = d3.axisLeft()
            .tickFormat(d3.timeFormat("%Y-%m-%d %H:%M"));
    } else {
        paraCoordY[d] = d3.scaleLinear()
            .domain(d3.extent(windTurbineData, function(p) { return +p[d]; }))
            .range([paraCoordGraphH, 0]);
        paraCoordAxis[d] = d3.axisLeft();
    }
}

function initParaCoordGraph() {
  paraCoordGraph.selectAll("*").remove();
  paraCoordGraph.attr("class", "paraCoord")
    .attr("transform", "translate(" + focusMargin.left + "," + (2 * focusMargin.top + healthCurveH + focusMargin.bottom) + ")");
}

function drawParaCoordGraph(domain_dt) {
    initParaCoordGraph();
    dimensions = getWindTurbineColumns().filter(
        function(d) {
            return d != "name" && d != "normal" && d != "index"
        });
    dimensions.filter(function (d) {
        createParaCoordScaleAndAxis(d, domain_dt);
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
        .data(getAnormalData(windTurbineData))
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
            dimensions.sort(function(a, b) { return paraCoordPosition(a) - paraCoordPosition(b); });
            paraCoordX.domain(dimensions);
            g.attr("transform", function(d) { return "translate(" + paraCoordPosition(d) + ")"; })
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
}

function paraCoordPosition(d) {
  var v = dragging[d];
  return v == null ? paraCoordX(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return paraCoordLine(dimensions.map(function(p) { return [paraCoordPosition(p), paraCoordY[p](d[p])]; }));
}


// Scatters plots
var scatterTranslateH = focusMargin.top + healthCurveH + focusMargin.bottom + focusMargin.top + paraCoordGraphH + focusMargin.bottom;
var scatterGraph = focusSvg.append("g");

function initScatters() {
  scatterGraph.selectAll("*").remove();
  scatterGraph.attr("class", "scatters")
    .attr("transform", "translate(0" + "," + scatterTranslateH + ")");
}

function draw_scatters() {
  initScatters();
  let anormalData = getAnormalData(windTurbineData);
  col = 0;
  row = 0;
  for (let row = 0; row < 2; row ++) {
    for (let col = 0; col < 3; col ++) {
      let index = col + 3 * row;
      draw_scatter(windTurbineData, getScattersToDisplay()[index][0], getScattersToDisplay()[index][1], scatterGraph, row, col, anormalData);
    }
  }
}

function draw_scatter(data, xCol, yCol, element, row, col, anormalData) {
  let x = d3.scaleLinear()
    .range([0, scatterGraphW]);
  let y = d3.scaleLinear()
    .range([scatterGraphH, 0]);
  x.domain(d3.extent(data, function(d) { return d[xCol]; })).nice();
  y.domain(d3.extent(data, function(d) { return d[yCol]; })).nice();

  let xAxis = d3.axisBottom(x),
      yAxis = d3.axisLeft(y);

  let leftTranslate = focusMargin.left + col * (focusMargin.left + focusMargin.right + scatterGraphW);
  let topTranslate = focusMargin.top + row * (focusMargin.top + focusMargin.bottom + scatterGraphH);

  g = element.append("g")
    .attr("transform", "translate(" + leftTranslate + "," + topTranslate + ")")
    .attr("width", scatterGraphW);

  g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + scatterGraphH + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", scatterGraphW)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text(xCol);

  g.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(yCol);

  g.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot normal")
      .attr("r", 2)
      .attr("cx", function(d) { return x(d[xCol]); })
      .attr("cy", function(d) { return y(d[yCol]); })
      .style("fill", "steelblue");

  let title1 = feat_desc.get(xCol) + " en fonction de" 
  let title2 = feat_desc.get(yCol);
  g.append("g")
    .append("text")
    .attr("class", "scatter_title")
    .attr("fill", "black")
    .attr("y", - 1.2 * focusTitleH)
    .attr("dy", ".3em")
    .append("tspan")
        .style("text-anchor", "middle")
        .attr("x", scatterGraphW / 2)
        .text(title1)
    .append("tspan")
        .style("text-anchor", "middle")
        .attr("x", scatterGraphW / 2)
        .attr("dy", "1.3em")
        .text(title2);

  g1 = element.append("g")
    .attr("transform", "translate(" + leftTranslate + "," + topTranslate + ")");

  g1.selectAll(".dot")
      .data(anormalData)
    .enter().append("circle")
      .attr("class", "dot anormal")
      .attr("r", 3)
      .attr("cx", function(d) { return x(d[xCol]); })
      .attr("cy", function(d) { return y(d[yCol]); })
      .style("fill", "red");
}



function focus_data_loaded(turbineName, begin_dt, end_dt) {
    windTurbineData = getWindTurbineData(turbineName, dataset, begin_dt, end_dt);
    domain_dt = [begin_dt, end_dt]
    for (let i = 0; i < 10; i++) {
        console.log(windTurbineData[i]);
    }
    draw_health_curve(domain_dt)
    drawParaCoordGraph(domain_dt)
    draw_scatters();
    focusSvg.selectAll(".tick text")
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

function toggleFocus() {

    // Set the effect type
    var effect = 'slide';

    // Set the options for the effect type chosen
    var options = { direction: "right" };

    // Set the duration (default: 400 milliseconds)
    var duration = 5000;

    // $('#focus').toggle(effect, options, duration);
    $('#focus').toggleClass('close');
}

$("#close_button").click(function () {
  toggleFocus();
});

// Script executed when the script is launched

// loadParks('parc4', focus_data_loaded);
