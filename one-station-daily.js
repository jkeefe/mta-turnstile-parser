// This code uses the station lat/lon data from
// https://github.com/tmrudick/mta-turnstiles/tree/master/data

var fs = require('fs'),
csv = require('dsv')(',');

var results = {};

var stats = {
    am_readings: 0,
    pm_readings: 0,
    negative_readings: 0,
    suspicious_values: 0,
    unmatched_readings: 0
};

fs.readFile('data/turnstile_150919_hudsonyd.csv','utf-8',function(err,data){
//fs.readFile('data/turnstile-test.csv','utf-8',function(err,data){   

   data = csv.parse(data);
   

   

     
    start_date = "09/18/2015";
    end_date = "09/18/2015";
   
    data.forEach(function(reading){
     // find midnights at the start and end of week
     if (reading.TIME === "00:00:00" && reading.DATE === start_date) {

       var pair = data.filter(
           function(data) {
               return data.TIME == "20:00:00" && data['C/A'] == reading['C/A'] && data.UNIT == reading.UNIT && data.SCP == reading.SCP && data.DATE == end_date;
           });
       
           // check to see if we found one
           if (pair.length === 0) {
               stats.unmatched_readings += 1;
               console.log("Unpaired reading:", reading);
               console.log("SKIPPING!");
           } else {
           
               var entries_difference = pair[0].ENTRIES - reading.ENTRIES;
                   
               if (entries_difference < 0) {
                   console.log ("Negative Entries:", pair[0]['C/A'], pair[0].UNIT, pair[0].SCP,pair[0].STATION,entries_difference);
                   entries_difference = entries_difference * -1;
                   stats.negative_readings += 1;
               }
           
               if (entries_difference > 99999) {
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
           
               if (exits_difference > 99999) {
                   console.log ("Suspicious value! Ignoring Exits ", exits_difference);
                   exits_difference = 0;
                   stats.suspicious_values += 1;
               }
       
           
               console.log(start_date + "," + entries_difference + "," + exits_difference);
       
       
             }
           }  
    });
  
     console.log(stats);
  
});


