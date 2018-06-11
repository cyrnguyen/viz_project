// Define framework dimensions (with respect to Mick Bostock's margin convention)
// reference: https://bl.ocks.org/mbostock/3019563

const margin = {
  top: 80,
  bottom: 80,
  left: 100,
  right: 0
};
const width = 1500;
const height = 1000;

// Define constants item size and cell size

const itemSize = 30;
const cellSize = itemSize - 4;

// Define color map

const colorMap = [
  "#9E0142", // strong red
  "#FDAE61",
  "#F6FAAA",
  "#8BE0AE",
  "#4CA64C",
  "#007300", // strong green
];

// Define time formats

const dayFormat = d3.timeFormat('%d');
const hourFormat = d3.timeFormat('%H');

// Define transition duration

const transition_duration = 500;

// Initialize dataset as an empty array

let dataset = [];

// The function run when the data is loaded

function data_loaded() {
    draw();
}

// Define color function

function renderColor() {

  var quantizeScale = d3.scaleQuantize()
        .domain([0, 1])
        .range(colorMap);

  rect.attr("fill", (d) => quantizeScale(d.index));

}

// Define draw function

function draw() {

  var setIds = d3.map(dataset, (d) => d.name).keys();

  var setDatetime = d3.map(dataset, (d) => dayFormat(d.datetime)).keys();

  // Initialize svg element

  var svg = d3.select("[role='heatmap']");

  // Initialize main svg elements

  var heatmap = svg
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  rect = heatmap.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .style("opacity", 0.9)
    .attr("width", itemSize)
    .attr("height", cellSize)
    .attr("x", (d) => itemSize * (dayFormat(d.datetime) - 1))
    .attr("y", (d) => itemSize * (setIds.indexOf(d.name)))
    .attr("fill", d3.color("white"))
    .on('mouseover', function(d) {
      // Pulsating animation
      d3.select(this)
        .style("opacity", 1.0);
      d3.select("#tooltip")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
        .select("#value").text("index : " + d.index + "\nname : " + d.name + "\ndate : " + dayFormat(d.datetime));
      d3.select("#tooltip")
        .classed("hidden", false);
    })
    .on('mouseout', function(d) {
      d3.select(this)
        .style("opacity", 0.9);
      d3.select("#tooltip")
        .classed("hidden", true);
    });

  renderColor();

  // Plot the "x axis"

  svg.append("g").selectAll('.label-datetime')
    .data(dataset)
    .enter()
    .append("text")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .attr("class", "label label-datetime")
    .text(function (d, i) {
      return i < setDatetime.length ? setDatetime[i] : '';
    })
    .attr("x", (d, i) => ((i % setDatetime.length) + 0.3) * itemSize)
    .attr("y", -15)
    .on('mouseenter', function(d, i) {
      var selected_datetime = setDatetime[i];

      console.log("mouse on : ", setDatetime[i]);
      
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', function(d) {
          return dayFormat(d.datetime) == selected_datetime ? 1 : 0;
        });
    })
    .on('mouseout', function() {
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', 1);
    })

  // Plot the "y axis"

  svg.append("g").selectAll('.label-row')
    .data(dataset)
    .enter()
    .append("text")
    .attr("transform", "translate(" + (margin.left - 40) + ", " + margin.top + ")")
    .attr("class", "label label-row")
    .text(function (d, i) {
      return i < setIds.length ? setIds[i] : '';
    })
    .style("font-weight", "bold")
    .attr("y", (d, i) => (i + 0.5) * itemSize)
    .on('mouseenter', function(d, i) {
      var selected_name = setIds[i];

      console.log("mouse on : ", selected_name);
      
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', function(d) {
          console.log('selected_name : ' + selected_name + '/ d.name : ' + d.name);
          return d.name == selected_name ? 1 : 0;
        });
    })
    .on('mouseout', function() {
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', 1);
    })

}

// Script executed when the script is launched

loadParks();
