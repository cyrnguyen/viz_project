// Declare canvas parameters
const margin = { top: 150, bottom: 80, left: 100, right: 0 };
const width = 3000;
const height = 2000;
const label_padding = 30;
const item_size = 34;
const cell_size = item_size - 4;

// Declare d3.time formats
const getDate = d3.timeFormat('%d%H');
const getYear = d3.timeFormat('%Y');
const getMonth = d3.timeFormat('%B');
const getDay = d3.timeFormat('%d');
const getHour = d3.timeFormat('%H');

// Declare color map
const color_map = [
  '#9E0142', // strong red
  '#FDAE61', // orange
  '#F6FAAA', // yellow
  '#8BE0AE', // light green
  '#4CA64C', // green
  '#007300', // strong green
];

// Define scaled color map
const quantizeScale = d3.scaleQuantize()
  .domain([0, 1]) // health index in interval [0, 1]
  .range(color_map);

// Define record features
let json = ['parcs']
let overview = 'month';
let history = ['month'];
let selected = {};
let data = {};

// Instantiate SVG element
var svg = d3.select("[role='heatmap']");
// Instantiate "heatmap calendar" element
var heatmap = svg.attrs({width : width, height : height})
  .append('g')
  .attrs({width: width - margin.left - margin.right, height: height - margin.top - margin.bottom})
  .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
// Instantiate "back button" element
var button = svg.append('g');
// Instantiate "names axis" element
var names_axis = svg.append('g');
// Instantiate "time axis" element
var time_axis = svg.append('g');
// Instantiate "timestamp" element
var timestamp = svg.append('g');
// Instantiate "position" element
var position = svg.append('g');

//Define draw "back button" function
function drawButton() {
  button.attr('class', 'button')
    .style('opacity', 0)
    .on('click', function () {
      // calendar : filtered on specified datetime value(s)
      if (Object.keys(selected)[0] == 'datetime') {
        if (!('parc' in selected)) {
          delete selected.datetime;
          history.pop();
          overview = history[history.length - 1];
          json = ['parcs'];
          parkLoaded(json);
        } else {
          delete selected.parc;
          json = ['parcs'];
          loadParks(json, data_loaded);
        }
      }
      // calendar : filtered on a specified parc
      else if (Object.keys(selected)[0] == 'parc') {
        if (!('datetime' in selected)) {
          delete selected.parc;
          json = ['parcs'];
          loadParks(json, data_loaded);
        } else {
          delete selected.datetime;
          history.pop();
          overview = history[history.length - 1];
          if (selected.parc.length > 1) {
            delete selected.parc;
            json = ['parcs'];
            loadParks(json, data_loaded);
          } else {
            parkLoaded(selected.parc);
          }
        }
      }
    });

  button.append('circle')
    .attr('cx', label_padding)
    .attr('cy', 1.8 * label_padding)
    .attr('r', item_size / 3);

  button.append('text')
    .attr('x', label_padding)
    .attr('y', 1.8 * label_padding + 3)
    .attr('font-size', '8px')
    .html('&#x2190;');

  button.transition()
    .style('opacity', 1)
    .style('display', function(d) {
      return (json[0] == 'parcs') && (overview == 'month') && (!Object.keys(selected).length) ? 'none' : 'flex';
    })

}

// Define nesting function
function indexGroupBy(time_unit) {

  if (overview == 'month')
    f = getDay;
  else if (overview == 'day')
    f = getDate;

  var nested_index = d3.nest()
    .key((d) => f(d.datetime))
    .key((d) => d.name)
    .rollup(function(values) {
      return d3.min(values, function(d) {return d.index; })
    })
    .map(data);

  var nested_index_to_array = [];

  Object.keys(nested_index).forEach(function(e) {
    var that = this;
    Object.keys(nested_index[e]).forEach(function(a) {;
      that[a] = {name: a.substr(1), datetime: +e.substr(1), index: nested_index[e][a]}
      nested_index_to_array.push(that[a])
    })
  }, {})

  return nested_index_to_array;

}

function draw() {

  // Add current overview to the history
  if (history[history.length - 1] !== overview) {
    history.push(overview);
  }

  if ('datetime' in selected) {
    data = dataset.filter((e) => selected.datetime.includes(+getDay(e.datetime)));
  } else {
    data = dataset;
  }

  var nested_index;
  if (overview == 'month')
    nested_index = indexGroupBy('day');
  else if (overview == 'day')
    nested_index = indexGroupBy('hour');

  var set_names = d3.map(nested_index, (d) => d.name).keys();

  var set_datetimes = d3.map(nested_index, (d) => d.datetime).keys()
    .sort(function (x, y) { return d3.ascending(+x, +y); })

  // Order datetime values in selected array, once selection done
  if (overview == 'day') {
    if (selected.datetime.length > 1)
      selected.datetime = selected.datetime.sort(function (x, y) { return d3.ascending(+x, +y); });
  }

  rect = heatmap.selectAll('rect')
    .data(nested_index)
    .enter()
    .append('rect')
    .attr('width', function() {
      if (overview == 'month') {
        return item_size;
      } else if (overview == 'day') {
        if (selected.datetime.length > 1)
          return 1.87 * item_size / selected.datetime.length;
        else
          return item_size;
      }
    })
    .attr('height', cell_size)
    .attr('x', function (d, i) {
      if (overview == 'month'){
        return item_size * (d.datetime - 1);
      } else {
        if (selected.datetime.length > 1) {
          return 45 * item_size * set_datetimes.indexOf(d.datetime.toString()) / set_datetimes.length;
        } else {
          return item_size * set_datetimes.indexOf(d.datetime.toString());
        }
      }
    })
    .attr('y', (d) => item_size * (set_names.indexOf(d.name)))
    .attr('fill', d3.color('white'))
    .on('mouseover', function(d, i) {
      d3.select("#tooltip")
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY + 'px')
        .select("#value")
        .text(function () {
          if (overview == 'month'){
            text_month = getMonth(data[0].datetime);
            text_day = d.datetime;
            text_index = d.index.toFixed(3)
            return d.name + ', on ' + text_month + ' ' + text_day + '\nindex : ' + text_index;
          } else if (overview == 'day') {
            text_month = getMonth(data[0].datetime);
            if (selected.datetime.length > 1) {
              text_days = i < set_names.length * 24 ? selected.datetime[0].toString() : selected.datetime[1].toString();
            } else {
              text_days = selected.datetime.toString();
            }
            text_hour = d.datetime.toString().slice(-2) + ':00';
            text_index = d.index.toFixed(3)
            return d.name + ', on ' + text_month + ' ' + text_days + ' at ' + text_hour + '\nindex : ' + text_index;
          }
        });
      d3.select("#tooltip")
        .classed("hidden", false);
    })
    .on('mouseout', function(d) {
      d3.select("#tooltip")
        .classed("hidden", true);
    });

  // Print colors
  rect.transition()
    .attr('fill', function (d) {
      idx = d.index
      // whitesmoke color for missing values (index = 2 if NA)
      if (idx > 1) { return '#F5F5F5'; }
      return quantizeScale(idx);
    });

  // Plot the "color-map description"
  d3.select('[role="calibration"] [role="example"]')
    .select('svg').selectAll('rect')
    .data(color_map)
    .enter()
    .append('rect')
    .attr('width', cell_size - 10)
    .attr('height', cell_size - 10)
    .attr('x', function (d, i) { return i * (cell_size - 9); })
    .attr('fill', (d) => d);

  // Print the "timestamp"
  var month_timestamp = getMonth(dataset[0].datetime) + ' ' + getYear(dataset[0].datetime);
  if ('datetime' in selected) {
    if (selected.datetime.length > 1)
      var day_timestamp = getMonth(dataset[0].datetime) + ' ' + getYear(dataset[0].datetime) + ' / days : ' + selected.datetime.join(', ');
    else
      var day_timestamp = getMonth(dataset[0].datetime) + ' ' + selected.datetime.toString() + ', ' + getYear(dataset[0].datetime);
  }
  timestamp.select('text').remove();
  timestamp.append('text')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
    .attr('y', 0 - (margin.top / 1.4))
    .attr('class', "legend timestamp")
    .text(overview == 'month' ? month_timestamp : day_timestamp);

  // Print the "position"
  position.select('text').remove();
  position.append('text')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
    .attr('y', 0 - (margin.top / 2))
    .attr('class', "legend position")
    .text(('parc' in selected)? 'in ' + selected.parc.sort().join(', ') : "overview");

  // Plot the datetime axis
  console.log('data length : ', data.length);
  time_axis.selectAll(".label-datetime").remove();
  time_axis.selectAll(".label-datetime")
    .data(data)
    .enter()
    .append('text')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
    .attr('class', "label label-datetime")
    .text(function (d, i) {
      if (overview == 'month')
        return set_datetimes[i];
      else if (overview == 'day') {
        if (selected.datetime.length < 2) {
          if (i < set_datetimes.length) {
            // if set_datetimes = 'ddhh' then hour = substr(2), else if set_datetimes = 'dhh' then hour = substr(1)
            var label_hours = set_datetimes[i].length == 4 ? set_datetimes[i].substr(2) : set_datetimes[i].substr(1);
            return label_hours + ':00'
          }
        } else {
          // if (i % (set_names.length * set_datetimes.length * 2) == 0) {
          if ((+getHour(d.datetime) == 0) && (i % (set_names.length * set_datetimes.length * 12) == 0)) {
            console.log(getDay(d.datetime));
            return getMonth(d.datetime) + ' ' + getDay(d.datetime);
          }
          else
            return '';
        }
      }
    })
    .style('font-size', (overview == 'month') ? '12px' : (selected.datetime.length == 1) ? '10px' : '12px')
    .attr('x', (d, i) => (overview == 'month') ? (i + 0.3) * item_size : (i + 0.2) * item_size / selected.datetime.length)
    .attr('y', -12)
    .on('mouseenter', function(d, i) {
      var pointed_datetime = set_datetimes[i];
      heatmap.selectAll('rect')
        .transition()
        .style('opacity', function(d) {
          if (overview == 'day') {
            if (selected.datetime.length > 1)
              return 1;
          }
          return d.datetime == pointed_datetime ? 1 : 0.1;
        });
    })
    .on('mouseout', function() {
      heatmap.selectAll('rect')
        .transition()
        .style('opacity', 1);
    })
    .on('click', function(d, i) {
      if (overview == 'month') {
        // multi selection
        if (d3.event.shiftKey) {
          if (!d3.select(this).classed("selected")){
            d3.select(this).classed("selected", true)
            d3.select(this).transition().attr('font-weight', 'bold').attr('fill', 'tomato');
            if (!('datetime' in selected)) {
              selected['datetime'] = [+set_datetimes[i]];
            } else if (!(selected.datetime.includes(set_datetimes[i]))) {
              selected['datetime'].push(+set_datetimes[i]);
            }
          } else {
            d3.select(this).classed("selected", false);
            d3.select(this).transition().attr('font-weight', 'none').attr('fill', 'black');
            var idx = selected.datetime.indexOf(set_datetimes[i]);
            // unselect datetime if double click on label
            selected.datetime.splice(idx, 1);
          }
        } else if ('datetime' in selected) {
          if (selected.datetime.length > 0) {
            overview = 'day';
            if ('parc' in selected) {
              json = selected.parc;
              loadParks(json, data_loaded);
            } else {
              loadParks(json, data_loaded);
            }
          }
        }
      }
    })

  // Plot the names axis
  names_axis.selectAll(".label-row").remove();
  names_axis.selectAll(".label-row")
    .data(data)
    .enter()
    .append('text')
    .text(function (d, i) {
      return set_names[i];
    })
    .style('font-size', '14px')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
    .attr('x', (d) => - 10 * d.name.length)
    .attr('y', (d, i) => (i + 0.5) * item_size)
    .attr('class', "label label-row")
    .on('mouseenter', function(d, i) {
      var pointed_name = set_names[i];
      heatmap.selectAll('rect')
        .transition()
        .style('opacity', function(d) {
          return d.name == pointed_name ? 1 : 0.1;
        });
    })
    .on('mouseout', function() {
      heatmap.selectAll('rect')
        .transition()
        .style('opacity', 1);
    })
    .on('click', function(d, i) {
      // multi selection
      if (d3.event.shiftKey) {
        if (!d3.select(this).classed("selected")){
          d3.select(this).classed("selected", true)
          d3.select(this).transition().attr('font-weight', 'bold').attr('fill', 'tomato');
          if (!('parc' in selected)) {
            selected['parc'] = [set_names[i]];
          } else if (!(selected.parc.includes(set_names[i]))) {
            selected['parc'].push(set_names[i]);
          }
        } else {
          d3.select(this).classed("selected", false);
          d3.select(this).transition().attr('font-weight', 'none').attr('fill', 'black');
          var idx = selected.parc.indexOf(set_names[i]);
          // unselect parc if double click on label
          selected.parc.splice(idx, 1);
        }
      } else {
        if (!set_names[i].startsWith("parc")) {
          focus_data_loaded(set_names[i]);
          toggleFocus();
        } else if ('parc' in selected && selected.parc.length > 0) {
          if ('datetime' in selected) { overview = 'day'; }
          json = selected['parc'];
          loadParks(selected.parc, data_loaded);
        }
      }
    })

  drawButton();

}

// The function run when the data is loaded
function data_loaded() {
    heatmap.selectAll('rect').remove();
    draw();
}

// Script executed when the script is launched
loadParks(json, data_loaded);
