// Import data from the .json file

var parseDate = d3.timeParse("%Q");
var columns = ["name", "datetime", "Ba", "Ws", "P", "Rs", "Dst", "Gost", "Rbt", "Yt", "normal", "index"];

// The parks data (cache)
var parksData = new Map();
// The data of the current park
var dataset;

// temp variable to check which parks have been loaded
var parksToLoad;

// Init the list of scatter plots to display
var scatters = [];
scatters.push(["Ws", "P"]);
scatters.push(["Ws", "Rs"]);
scatters.push(["Ws", "Ba"]);
scatters.push(["Rs", "P"]);
scatters.push(["Yt", "Dst"]);
scatters.push(["Yt", "Rbt"]);


function parkLoaded(names, callback) {
  if (parksToLoad.size === 0) {
    // Create tye dataset of current data
    dataset = []
    for (var name of names) {
      dataset = dataset.concat(parksData.get(name));
    }
    // Notify that data is available
    callback();
  }
}

// Load a park data if data have not been loaded before
function loadParks(names, callback) {
  let myNames = [];
  if (typeof names === 'string') {
    myNames = [names];
  } else {
    myNames = names;
  }
  parksToLoad = new Set(myNames);
  for (let name of myNames) {
    if (!parksData.has(name)) {
      d3.json("../data/"+name+".json", function(error, data) {
          return {
            name: data["name"],
            datetime: parseDate(data.datetime),
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
          console.log(error);
          // Print the dataset length
          console.log("json : " + name + ".json (loaded " + rows.length + " rows)");
          if (rows.length > 0) {
            // Print content of the first row
            console.log("First row: ", rows[0])
            // Print content of the last row
            console.log("Last row:  ", rows[rows.length - 1])
          }
          // add rows to the park data
          parksData.set(name, rows);
          // Notify that JSON has been loaded
          parksToLoad.delete(name);
          parkLoaded(myNames, callback);
      });
    } else {
      parksToLoad.delete(name);
      parkLoaded(myNames, callback);
    }
  }
}

function getWindTurbineData(name, parkData, beginDate=null, endDate=null) {
    return parkData.filter(function (d) {
        // && d.normal == 0.0
        // Return only the data where the health index is defined (!= 2.0) or the abnormal data (that can be close to a data gap and where the health index is not defined)
        return d.name == name && (beginDate === null || d.datetime >= beginDate)
          && (endDate === null || d.datetime < endDate)
          && (d.index != 2.0 || d.normal == 0);
    })
}

function getAnormalData(data) {
    return data.filter(function (d) {
        return d.normal == 0.0;
    })
}

function getWindTurbineColumns() {
  return columns;
}

function getScattersToDisplay() {
  return scatters;
}

function getDtFromSelectedDays(dateTimes) {
  beginDate = new Date(2018, 4, dateTimes[0], 0, 0, 0);
  endDate = new Date(2018, 4, dateTimes[dateTimes.length - 1], 0, 0, 0);
  endDate.setDate(endDate.getDate() + 1)
  return [beginDate, endDate];
}
