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

const datetimeFormat = d3.timeFormat('%d %B %H:%m');
const monthFormat = d3.timeFormat('%B %Y');
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

  rect.transition()
    //.delay((d) => dayFormat(d.datetime) * 15)
    .duration(transition_duration)
    .attr("fill", (d) => quantizeScale(d.index));

}

// Define draw function

function draw() {

  var setOfName = d3.map(dataset, (d) => d.name).keys();

  var setOfDatetime = d3.map(dataset, (d) => dayFormat(d.datetime)).keys();

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
    .attr("y", (d) => itemSize * (setOfName.indexOf(d.name)))
    .attr("fill", d3.color("white"))
    .on('mouseover', function(d) {
      // Pulsating animation
      d3.select(this)
        .style("opacity", 1.0);
      d3.select("#tooltip")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
        .select("#value")
        .text("index : " + d.index + "\ndate : " + datetimeFormat(d.datetime) + "\nname : " + d.name);
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

  // Plot the "timestamp"

  svg.append("text")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .attr("y", 0 - (margin.top / 2))
    .attr("class", "timestamp month")
    .text(monthFormat(dataset[0].datetime));

  // Plot the "x axis"

  svg.append("g").selectAll('.label-datetime')
    .data(dataset)
    .enter()
    .append("text")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .attr("class", "label label-datetime")
    .text(function (d, i) {
      return i < setOfDatetime.length ? setOfDatetime[i] : '';
    })
    .attr("x", (d, i) => (i + 0.3) * itemSize)
    .attr("y", -15)
    .on('mouseenter', function(d, i) {
      var selected_datetime = setOfDatetime[i];

      // for debugging :
      console.log("mouse on : ", setOfDatetime[i]);
      
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', function(d) {

          // for debugging :
          console.log('selected_datetime : ' + selected_datetime + ' / d.datetime : ' + dayFormat(d.datetime));

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
    .text(function (d, i) {
      return i < setOfName.length ? setOfName[i] : '';
    })
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .attr("x", (d) => - 10 * d.name.length)
    .attr("y", (d, i) => (i + 0.5) * itemSize)
    .attr("class", "label label-row")
    .style("font-weight", "bold")
    .on('mouseenter', function(d, i) {
      var selected_name = setOfName[i];

      // for debugging :
      console.log("mouse on : ", selected_name);
      
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', function(d) {

          // for debugging :
          console.log('selected_name : ' + selected_name + ' / d.name : ' + d.name);

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
