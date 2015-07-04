var fs = require('fs'),
    csv = require('dsv')(',');

var results = {};

var stats = {
    am_readings: 0,
    pm_readings: 0,
    negative_readings: 0,
    unmatched_readings: 0
};

fs.readFile('data/turnstile-test.csv','utf-8',function(err,data){
   
   data = csv.parse(data);
   
   data.forEach(function(reading){
       var paired_time;
       
       if (reading.TIME == "00:00:00") {
           paired_time = "12:00:00";
       } else 
       if (reading.TIME == "01:00:00") {
           paired_time = "13:00:00";
       } else
       if (reading.TIME == "02:00:00") {
           paired_time = "14:00:00";
       } else 
       if (reading.TIME == "03:00:00") {
           paired_time = "15:00:00";
       }
       
       // grab the entry for 12 hours later
       if (paired_time) {
           var pair = data.filter(
               function(data) {
                   return data.TIME == paired_time && data['C/A'] == reading['C/A'] && data.UNIT == reading.UNIT && data.SCP == reading.SCP && data.DATE == reading.DATE;
               });
            
            // check to see if we found one
            if (pair.length === 0) {
                stats.skipped_readings += 1;
                console.log("Unpaired reading:", reading);
                console.log("SKIPPING!");
            } else {
                
                var entries_difference = pair[0].ENTRIES - reading.ENTRIES;
            
                if (entries_difference < 0) {
                    stats.negative_readings += 1;
                    console.log ("Negative Entries:", data['C/A'], data.UNIT, data.SCP,data.STATION,entries_difference);
                    entries_difference = entries_difference * -1;   
                }
            
                var station_line = reading.STATION + "/" + reading.LINENAME;
                
                if (!results[station_line]) {
                    results[station_line] = {
                        lines: reading.LINENAME,
                        am_count: 0,
                        pm_count: 0
                    };
                }
                
                results[station_line].am_count += entries_difference;
            
                console.log(station_line, reading.ENTRIES, pair[0].ENTRIES, entries_difference);
                
                
            }
            
        }
       
   });
   
   console.log(results);
   
});