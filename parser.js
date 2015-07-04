// This code uses the station lat/lon data from
// https://github.com/tmrudick/mta-turnstiles/tree/master/data

var fs = require('fs'),
    csv = require('dsv')(','),
    stations = require('./data/stations.json');

var results = {};

var stats = {
    am_readings: 0,
    pm_readings: 0,
    negative_readings: 0,
    suspicious_values: 0,
    unmatched_readings: 0
};

//fs.readFile('data/turnstile_150627.csv','utf-8',function(err,data){
fs.readFile('data/turnstile-test.csv','utf-8',function(err,data){   

   data = csv.parse(data);
   
   data.forEach(function(reading){
       var paired_time;
       var am_flag;
       
       if (reading.TIME == "01:00:00") {
           paired_time = "09:00:00";
           am_flag = true;
       } else 
       if (reading.TIME == "02:00:00") {
           paired_time = "10:00:00";
           am_flag = true;
       } else
       if (reading.TIME == "03:00:00") {
           paired_time = "11:00:00";
           am_flag = true;
       } else 
       if (reading.TIME == "04:00:00") {
           paired_time = "12:00:00";
           am_flag = true;
       }
       
       if (reading.TIME == "12:00:00") {
           paired_time = "20:00:00";
           am_flag = false;
       } else 
       if (reading.TIME == "13:00:00") {
           paired_time = "21:00:00";
           am_flag = false;
       } else
       if (reading.TIME == "14:00:00") {
           paired_time = "22:00:00";
           am_flag = false;
       } else 
       if (reading.TIME == "15:00:00") {
           paired_time = "23:00:00";
           am_flag = false;
       }
       
       // grab the entry for 12 hours later
       if (paired_time) {
           var pair = data.filter(
               function(data) {
                   return data.TIME == paired_time && data['C/A'] == reading['C/A'] && data.UNIT == reading.UNIT && data.SCP == reading.SCP && data.DATE == reading.DATE;
               });
            
            // check to see if we found one
            if (pair.length === 0) {
                stats.unmatched_readings += 1;
                console.log("Unpaired reading:", reading);
                console.log("SKIPPING!");
            } else {
                
                var entries_difference = pair[0].ENTRIES - reading.ENTRIES;
            
                if (entries_difference < 0) {
                    stats.negative_readings += 1;
                    console.log ("Negative Entries:", pair[0]['C/A'], pair[0].UNIT, pair[0].SCP,pair[0].STATION,entries_difference);
                    entries_difference = entries_difference * -1;   
                }
                
                if (entries_difference > 9999) {
                    console.log ("Suspicious value! Ignoring Entries ", entries_difference);
                    entries_difference = 0;
                    stats.suspicious_values += 1;
                }
                
                var exits_difference = pair[0]['EXITS                                                               '] - reading['EXITS                                                               '];
                
                if (exits_difference < 0) {
                    stats.negative_readings += 1;
                    console.log ("Negative Exits:", pair[0]['C/A'], pair[0].UNIT, pair[0].SCP,pair[0].STATION,exits_difference);
                    exits_difference = exits_difference * -1;   
                }
                
                if (exits_difference > 9999) {
                    console.log ("Suspicious value! Ignoring Exits ", exits_difference);
                    exits_difference = 0;
                    stats.suspicious_values += 1;
                }
            
                var station_line = reading.STATION + "/" + reading.LINENAME;
                
                if (!results[station_line]) {
                    results[station_line] = {
                        station: reading.STATION,
                        lines: reading.LINENAME,
                        latitude: stations[reading.UNIT].latitude,
                        longitude: stations[reading.UNIT].longitude,
                        am_entries: 0,
                        am_exits: 0,
                        pm_entries: 0,
                        pm_exits: 0
                    };
                }
                
                if (am_flag === true){
                    results[station_line].am_entries += entries_difference;
                    results[station_line].am_exits += exits_difference;
                    stats.am_readings += 1;
                } else {
                    results[station_line].pm_entries += entries_difference;
                    results[station_line].pm_exits += exits_difference;
                    stats.pm_readings += 1;
                }
                
                console.log(station_line, entries_difference, exits_difference);
                
                
            }
            
        }
       
   });
   
   // this does a per-station calculation on entries vs exits (both rush hours)
   // and lines all of the results objects as and array of rows for the csv
   var output = [];
   for (var station_id in results) {
       if (results[station_id].am_entries > results[station_id].am_exits) {
           results[station_id].am_flow = "in";
       } else 
       if (results[station_id].am_entries < results[station_id].am_exits){
           results[station_id].am_flow = "out";
       } else {
           results[station_id].am_flow = "";
       }
       
       if (results[station_id].pm_entries > results[station_id].pm_exits) {
           results[station_id].pm_flow = "in";
       } else 
       if (results[station_id].pm_entries < results[station_id].pm_exits){
           results[station_id].pm_flow = "out";
       } else {
           results[station_id].pm_flow = "";
       }
       
       output.push(results[station_id]);
   }
   
   fs.writeFile("data/station_counts.csv",csv.format(output));
   console.log(stats);
 
   
});