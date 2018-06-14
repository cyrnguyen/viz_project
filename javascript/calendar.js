const margin = { top: 80, bottom: 80, left: 100, right: 0 };
const width = 1500;
const height = 1000;
const item_size = 30;
const cell_size = item_size - 4;

const color_map = [
  "#9E0142", // strong red
  "#FDAE61",
  "#F6FAAA",
  "#8BE0AE",
  "#4CA64C",
  "#007300", // strong green
];

const transition_duration = 500;

const getDateTime = d3.timeFormat('%d %B %H:%m');
const getMonth = d3.timeFormat('%B %Y');
const getDay = d3.timeFormat('%d');
const getHour = d3.timeFormat('%H');

var nested_index;

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

  var svg = d3.select("[role='heatmap']");

  var heatmap = svg.attrs({width : width, height : height})
    .append("g")
    .attrs({width: width - margin.left - margin.right, height: height - margin.top - margin.bottom})
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  var set_names = d3.map(dataset, (d) => d.name).keys();

  var set_datetimes = d3.map(dataset, (d) => getDay(d.datetime)).keys();

  nested_index = d3.nest()
    .key((d) => getDay(d.datetime))
    .key((d) => d.name)
    .rollup(function(values) {
      return d3.min(values, function(d) {return d.index; })
    })
    .map(dataset);

  var daily_index = [];

  Object.keys(nested_index).forEach(function(e) {
    var that = this;
    Object.keys(nested_index[e]).forEach(function(a) {
      that[a] = {name: a.substr(1), datetime: +e.substr(1), index: nested_index[e][a]}
      daily_index.push(that[a])
    })
  }, {})

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

      // for debugging :
      // console.log("mouse on : ", set_datetimes[i]);
      
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', function(d) {

          // for debugging :
          // console.log('selected_datetime : ' + selected_datetime + ' / d.datetime : ' + getDay(d.datetime));

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
  svg.append("g").selectAll('.label-row')
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

      // for debugging :
      // console.log("mouse on : ", selected_name);
      
      heatmap.selectAll("rect")
        .transition()
        .duration(transition_duration)
        .style('opacity', function(d) {

          // for debugging :
          // console.log('selected_name : ' + selected_name + ' / d.name : ' + d.name);

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

// The function run when the data is loaded
function data_loaded() {
    draw();
}

// Script executed when the script is launched
loadParks();
