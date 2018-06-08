// Import data from the .json file

function loadParks() {
  d3.json("../data/parc4.json", function(error, data) {
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
      data_loaded();
  })
}
