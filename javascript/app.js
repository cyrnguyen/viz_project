// Define framework dimensions
// with respect to Mick Bostock's margin convention:
// https://bl.ocks.org/mbostock/3019563

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
  "#007300", // strong green
  "#4CA64C",
  "#8BE0AE",
  "#F6FAAA",
  "#FDAE61",
  "#9E0142" // strong red
];

// Define transition duration

const transition_duration = 500;

// Initialize dataset as an empty array

let dataset = [];

// Define custom transition function

function renderColor() {

  rect.transition()
    .delay((d) => d.datetime * 15)
    .duration(transition_duration)
    .attrTween("fill", function(d, i, a) {
      // choose color dynamically
      var colorIndex = d3.scaleQuantize()
        .range([0, 1, 2, 3, 4, 5])
        .domain([0, 1]);

      return d3.interpolate(a, colorMap[colorIndex(d.index)]);
    });

}

// Define draw function

function draw() {

  var setIds = d3.map(dataset, (d) => d.name).keys();

  var setDatetime = d3.map(dataset, (d) => moment(d.datetime, 'MMM DD hh:mm').day()).keys();

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
    .attr("x", (d) => itemSize * (d.datetime - 1))
    .attr("y", (d) => itemSize * (setIds.indexOf(d.name)))
    .attr("fill", d3.color("white"))
    .on('mouseover', function(d) {
      // Pulsating animation
      d3.select(this)
        .style("opacity", 1.0);
      d3.select("#tooltip")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
        .select("#value").text("indice : " + d.index);
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
      return i < setDatetime.length ? moment(d.datetime, 'MMM DD hh:mm') : '';
    })
    .attr("x", (d, i) => (i + 0.3) * itemSize)
    .attr("y", -15)
    .on('mouseenter', function(d) {
      console.log(setDatetime.length);
      var selected_datetime = d.datetime;
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', function(d) {
          return d.datetime == selected_datetime ? 1 : 0.1;
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
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', function(d) {
          return d.name == selected_name ? 1 : 0.1;
        });
    })
    .on('mouseout', function() {
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', 1);
    })

}

// Import data from the .json file

d3.json("parc4.json", function(error, data) {
    return {
      name: data["name"],
      datetime: data.datetime,
      Ba: +data.Ba,
      Ws: +data.Ws,
      P: +data.P,
      Rs: +data.Rs,
      Dst: +data.Dst,
      Gost: +data.Gost,
      Rbt: +data.Rbt,
      Yt: +data.Yt,
      normal: +data.normal,
      index: +data.index
    };
  })
  // Print on the browser console
  .get((error, rows) => {
    // Print the dataset length
    console.log("Loaded " + rows.length + " rows");
    if (rows.length > 0) {
      // Print content of the first row
      console.log("First row: ", rows[0])
      // Print content of the last row
      console.log("Last row:  ", rows[rows.length - 1])
    }
    // Import rows in the dataset array
    dataset = rows;
    // Call the draw function
    draw();
  })
