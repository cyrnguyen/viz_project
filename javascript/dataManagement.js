// Import data from the .json file

var parseDate = d3.timeParse("%Q");
var columns = ["name", "datetime", "Ba", "Ws", "P", "Rs", "Dst", "Gost", "Rbt", "Yt", "normal", "index"];

// d3.queue(2)
//   .defer(d3.json, '../data/parcs.json')
//   .defer(d3.json, '../data/parc1.json')
//   .defer(d3.json, '../data/parc2.json')
//   .defer(d3.json, '../data/parc3.json')
//   .defer(d3.json, '../data/parc4.json')
//   .await(function (error, parcs, parc1, parc2, parc3, parc4) {
//     if (error) throw error;
//     for (dataset in [parcs, parc1, parc2, parc3, parc4]) {
//      dataset["datetime"] = parseDate(dataset.datetime); 
//     })
//     data_loaded();
//   });

function loadParks(file) {
  d3.json("../data/"+file, function(error, data) {
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
      // Print the dataset length
      console.log("json : " + file + " (loaded " + rows.length + " rows)");
      if (rows.length > 0) {
        // Print content of the first row
        console.log("First row: ", rows[0])
        // Print content of the last row
        console.log("Last row:  ", rows[rows.length - 1])
      }
      // Import rows in the dataset array
      dataset = rows;
      // Call the draw function
      data_loaded();
  })
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
