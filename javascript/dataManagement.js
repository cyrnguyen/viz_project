// Import data from the .json file

var parseDate = d3.timeParse("%Q");
var columns = ["name", "datetime", "Ba", "Ws", "P", "Rs", "Dst", "Gost", "Rbt", "Yt", "normal", "index"];

// The parks data (cache)
var parksData = new Map();
// The data of the current park
var dataset;

function parkLoaded(name) {
  dataset = parksData.get(name)
  // Notify that data is available
  data_loaded();
}

// Load a park data if data have not been loaded before
function loadPark(name) {
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
        // Import rows in the dataset array
        parksData.set(name, rows);
        // Notify that JSON has been loaded
        parkLoaded(name)
    });
  } else {
    parkLoaded(name);
  }
}

function getWindTurbineData(name, parkData) {
    return parkData.filter(function (d) {
        //&& d.normal == 0.0
        return d.name == name ;
    })
}

function getWindTurbineColumns() {
    return columns;
}
