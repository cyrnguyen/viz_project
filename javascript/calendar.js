var json = "parcs.json" 

const margin = { top: 80, bottom: 80, left: 100, right: 0 };
const width = 1500;
const height = 1000;
const label_padding = 40;
const item_size = 30;
const cell_size = item_size - 4;

const transition_duration = 500; // ms

const getDateTime = d3.timeFormat('%d %B %H:%m');
const getMonth = d3.timeFormat('%B %Y');
const getDay = d3.timeFormat('%d');
const getHour = d3.timeFormat('%H');

const color_map = [
  "#9E0142", // strong red
  "#FDAE61", // orange
  "#F6FAAA", // yellow
  "#8BE0AE", // light green
  "#4CA64C", // green
  "#007300", // strong green
];

var svg = d3.select("[role='heatmap']");

var heatmap = svg.attrs({width : width, height : height})
  .append("g")
  .attrs({width: width - margin.left - margin.right,
          height: height - margin.top - margin.bottom})
  .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

var names_axis = svg.append("g")

var button = svg.append("g")


function drawButton() {

  button.attr('class', 'button')
    .style('opacity', 0)
    .on('click', function () {
      json = "parcs.json"
      loadParks(json);
    });

  button.append("circle")
    .attr('cx', label_padding)
    .attr('cy', label_padding)
    .attr('r', item_size / 2);

  button.append("text")
    .attr('x', label_padding)
    .attr('y', label_padding - 1)
    .attr('dy', function () {
      return Math.floor(width / 100) / 2.5;
    })
    .attr('font-size', function () {
      return Math.floor(label_padding / 3) + 'px';
    })
    .html('&#x2190;');

  button.transition()
    .duration(transition_duration)
    .style('opacity', 1)
    .style('display', function(d) { return json == "parcs.json" ? "none" : "flex"; })

}


// Define nesting function
function indexGroupBy(time_unit) {

  if (time_unit === "day")
    f = getDay;
  else if (time_unit === "hour")
    f = getHour;

  var nested_index = d3.nest()
    .key((d) => f(d.datetime))
    .key((d) => d.name)
    .rollup(function(values) {
      return d3.min(values, function(d) {return d.index; })
    })
    .map(dataset);

  var nested_index_to_array = [];

  Object.keys(nested_index).forEach(function(e) {
    var that = this;
    Object.keys(nested_index[e]).forEach(function(a) {
      that[a] = {name: a.substr(1), datetime: +e.substr(1), index: nested_index[e][a]}
      nested_index_to_array.push(that[a])
    })
  }, {})

  return nested_index_to_array;

}


// Define color function
function printColor() {

  var quantizeScale = d3.scaleQuantize()
        .domain([0, 1])
        .range(color_map);

  rect.transition()
    .delay((d) => d.datetime * 15)
    .duration(transition_duration)
    .attr("fill", function (d) {
      idx = d.index

      if (idx > 1) {
        // whitesmoke color for missing values
        return "#F5F5F5";
      }

      return quantizeScale(idx);
    });

}


function draw() {

  var set_names = d3.map(dataset, (d) => d.name).keys();

  var set_datetimes = d3.map(dataset, (d) => getDay(d.datetime)).keys();

  var daily_index = indexGroupBy("day");

  rect = heatmap.selectAll("rect")
    .data(daily_index)
    .enter()
    .append("rect")
    .attrs({width: item_size, height: cell_size})
    .attr("x", (d) => item_size * (d.datetime - 1))
    .attr("y", (d) => item_size * (set_names.indexOf(d.name)))
    .attr("fill", d3.color("white"))
    .on('mouseover', function(d) {
      d3.select("#tooltip")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
        .select("#value")
        .text(d.name + "\non the " + d.datetime + " " + getMonth(dataset[0].datetime) + "\nindex : " + d.index.toFixed(3));
      d3.select("#tooltip")
        .classed("hidden", false);
    })
    .on('mouseout', function(d) {
      d3.select("#tooltip")
        .classed("hidden", true);
    });

  printColor();

  // Plot the "timestamp"
  svg.append("text")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .attr("y", 0 - (margin.top / 2))
    .attr("class", "timestamp month")
    .text(getMonth(dataset[0].datetime));

  // Plot the datetime axis
  svg.append("g").selectAll('.label-datetime')
    .data(dataset)
    .enter()
    .append("text")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .attr("class", "label label-datetime")
    .text(function (d, i) {
      return i < set_datetimes.length ? set_datetimes[i] : '';
    })
    .attr("x", (d, i) => (i + 0.3) * item_size)
    .attr("y", -15)
    .on('mouseenter', function(d, i) {
      var selected_datetime = set_datetimes[i];
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

  // Plot the names axis

  names_axis.selectAll('.label-row').remove();
  names_axis.selectAll('.label-row')
    .data(dataset)
    .enter()
    .append("text")
    .text(function (d, i) {
      return i < set_names.length ? set_names[i] : '';
    })
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .attr("x", (d) => - 10 * d.name.length)
    .attr("y", (d, i) => (i + 0.5) * item_size)
    .attr("class", "label label-row")
    .style("font-weight", "bold")
    .on('mouseenter', function(d, i) {
      var selected_name = set_names[i];
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
    .on('click', function(d, i) {
      var selected_parc = set_names[i];
      json = selected_parc + ".json"
      loadParks(json);
    })

  drawButton();

}


// The function run when the data is loaded
function data_loaded() {
    heatmap.selectAll("rect").remove();
    console.log('json : ' + json);
    draw();
}

// Script executed when the script is launched
loadParks(json);
