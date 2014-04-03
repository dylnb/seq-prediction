// Stimuli...
// var trials = [
//   [
//     {index: 1, text: "pa"},
//     {index: 2, text: "bo"},
//     {index: 3, text: "gu"},
//     {index: 4, text: "pa"},
//     {index: 5, text: "bo"},
//     {index: 6, text: "gu"}
//   ],
//   [
//     {index: 1, text: "go"},
//     {index: 2, text: "bu"},
//     {index: 3, text: "pa"},
//     {index: 4, text: "pa"},
//     {index: 5, text: "bo"},
//     {index: 6, text: "gu"}
//   ],
//   [
//     {index: 1, text: "ge"},
//     {index: 2, text: "pu"},
//     {index: 3, text: "pa"},
//     {index: 4, text: "pa"},
//     {index: 5, text: "bo"},
//     {index: 6, text: "gu"}
//   ]
// ];


function makeStage() {
  var stage = d3.select(".container")
                .append("div")
                .attr("class", "stage");
  return stage;
}

function makeCow(stage) {
  var cow = stage.append("div")
                 .attr("class", "cow")
                 .append("svg")
                 .attr("width", 200)
                 .attr("height", 200)
                 .append("image")
                 .attr("xlink:href", "images/cow.svg")
                 .attr("width", 200)
                 .attr("height", 150)
                 .attr("y", 50);
  return cow;
}

function makeElephant(stage) {
  var e = stage.append("div")
               .attr("class", "elephant")
               .append("svg")
               .attr("width", 200)
               .attr("height", 200)
               .attr("viewBox", "0 0 360 344")
               .attr("preserveAspectRatio", "xMinYMin meet")
               .append("g")
               .attr("id", "elephant");
  
  d3.xml("images/elephant.svg", "image/svg+xml", function(xml) {
    var importedNode = document.importNode(xml.documentElement, true);
    importedNode.x.baseVal.value = 87;
    importedNode.y.baseVal.value = 95;
    e.node().appendChild(importedNode);
  });

  return e;
}
       

function makeStimBubble(stage) {
  var sbubble = stage.append("div")
                     .attr("class", "stim");
  return sbubble;
}

function makeResponseBubble(stage) {
  var respbubble = stage.append("div")
                        .attr("class", "response");
  return respbubble;
}

function makeDrawer() {
  var drawer = d3.select(".container")
                 .append("div")
                 .attr("class", "syl-drawer");
  return drawer;
}

function makeNotificationWindow() {
  var notes = d3.select(".container")
               .append("div")
               .attr("class", "note-window");
  return notes;
}

function interrupt(stage, drawer, syls, conceal_num, callback) {
  var clicks = 0;
  var guess = [];

  var rbubble = makeResponseBubble(stage);
  drawer.selectAll("button")
        .data(syls)
        .enter()
        .insert("button")
        .attr("type", "button")
        .attr("class", "btn btn-default btn-lg")
        .text(function(d) { return d; })
        .on("click",
            function(d) {
              guess.push(d);
              clearBubble(rbubble);
              drawSyl(rbubble, d);
              if (clicks < conceal_num - 1) {
                clicks++;
              } else {
                rbubble.remove();
                console.log.apply(console, guess);
                // psiTurk.recordTrialData(guess);
                callback(guess);
              }
            });

}

function clearBubble(bubble) {
  bubble.selectAll("div").remove();
}

function clearResp(rbubble) {
  rbubble.remove();
}

function clearDrawer(drawer) {
  drawer.selectAll("button").remove();
}

function clearNotes(notes) {
  notes.selectAll("p").remove();
}

function drawSequence(stage, sbubble, drawer, elephant, sequence,
                      conceal_num, stim_array, callback) {
  var prefix = setInterval(function() {
    clearBubble(sbubble);
    if (sequence.length == conceal_num) {
      clearInterval(prefix);
      callback(stage, drawer, syl_choices, conceal_num,
               function(guess) {
                 checkGuess(elephant, sequence, guess, function() {
                   var suffix = setInterval(function() {
                     clearBubble(sbubble);
                     if (_.isEmpty(sequence)) {
                       clearInterval(suffix);
                       doTrial(stage, sbubble, drawer, elephant, stim_array);
                     } else {
                       var syl = sequence.shift();
                       drawSyl(sbubble, syl);
                     }
                   }, 250);
                   return suffix;
                 });
               });
    }
    else {
      console.log("drawSeq: ");
      console.log(sequence);
      var syl = sequence.shift();
      drawSyl(sbubble, syl);
    }
  }, 250);
  return prefix;
}

function drawExpSequence(stage, sbubble, drawer, elephant, sequence, stim_array) {
  var fix = setInterval(function() {
    clearBubble(sbubble);
    if (_.isEmpty(sequence)) {
      clearInterval(fix);
      doTrial(stage, sbubble, drawer, elephant, stim_array);
    } else {
      var syl = sequence.shift();
      drawSyl(sbubble, syl);
    }
  }, 250);
  return fix;
}


function drawSyl(bubble, syl) {
  var s = syl;
  if (s !== " ") {
   s = syl_code[+syl - 1]
  }; });
  bubble.append("div")
        .append("p")
        .text(s);
}

function checkGuess(elephant, correct, guess, callback) {
  var equal = function (correct, guess) {
    // var cor_strings = _.pluck(correct, "text");
    var cor_strings = correct;
    if (cor_strings.length !== guess.length) { return false; }
    else if (_.isEmpty(correct)) { return true; }
    else {
      var report = (cor_strings[0] === guess[0]) &&
                   equal(correct.slice(1, correct.length),
                         guess.slice(1, guess.length));
      return report;
    }
  }
  console.log("correct: " + correct);
  console.log("guess: " + guess);
  if (!equal(correct, guess)) {
    elephant.transition().duration(300).attr("transform", "translate(0,-50)")
            .transition().duration(300).attr("transform", "translate(0,0)")
            .transition().duration(300).attr("transform", "translate(0,-50)")
            .transition().duration(300).attr("transform", "translate(0,0)")
            .each("end", callback);
  } else {
    var lefteye = myelephant.select("#path3163");
    var righteye = myelephant.select("#path3161");
    lefteye
           .transition()
           .duration(2000)
           .ease("linear")
           .attrTween("transform", function () {
             return function (t) {
               var radius = 6;
               var t_angle = (4 * Math.PI) * t;
               var t_x = radius * Math.cos(t_angle);
               var t_y = radius * Math.sin(t_angle);
               return "translate(" + (t_x - 6) + "," + (t_y - 2) + ")";
             };
           })
           .transition()
           .duration(0)
           .attr("transform", "translate(0,0)");

     righteye
           .transition()
           .duration(2000)
           .ease("linear")
           .attrTween("transform", function () {
             return function (t) {
               var radius = 6;
               var t_angle = (4 * Math.PI) * t;
               var t_x = radius * Math.cos(t_angle + Math.PI);
               var t_y = radius * Math.sin(t_angle + Math.PI);
               return "translate(" + (t_x + 6) + "," + (t_y - 2) + ")";
             };
           })
           .transition()
           .duration(0)
           .attr("transform", "translate(0,0)")
           .each("end", callback);
  }
}

function doTrial(stage, sbubble, drawer, elephant, stim_array) {
  if (stim_array.length > 0) {
    var stim = stim_array.shift();
    var display = stim.display;
    var sequence = stim.stimlist;
    clearBubble(sbubble);
    clearDrawer(drawer);
    drawSyl(sbubble, " ");
    setTimeout(function() {
      if (display == 1 || sequence.length < 5 ||
          sequence.length == 5 && Math.random() < 0.5) {
        drawExpSequence(stage, sbubble, drawer, elephant, sequence, stim_array);
      } else {
        drawSequence(stage, sbubble, drawer, elephant, sequence,
                     conceal_number, stim_array, interrupt);
      }
    }, 500);
  } else {
    d3.select(".container").append("center").text("That'll do. Thanks.");
  }
}

var conceal_number = 3;
var mystage        = makeStage();
var myelephant     = makeElephant(mystage);
var mycow          = makeCow(mystage);
var mystimbubble   = makeStimBubble(mystage);
var mydrawer       = makeDrawer();
var mynotes        = makeNotificationWindow();

var syl_code    = ["wao", "yai", "piu", "shin", "bam", "fei", "ti", "ra", "ki"];
var syl_choices = syl_code;
var alltrials   = [];
var mytrials    = [];

queue()
  .defer(d3.csv, "data/stims2.csv", function(d) {
    var codes = d.Sequence.split(" ");
    alltrials.push(codes);
  }, function(error, rows) {
    console.log("error");
  })
  .await(setTimeout(function() {
    var splitTrials = _.values(_.groupBy(alltrials, function(trial) {
      var l = trial.length;
      if (l < 5) { return "L"; }
      else if (l == 5) { return "E"; }
      else { return "R"; }
    }));
    var warmups   = _.shuffle(splitTrials[0]);
    var fives     = _.shuffle(splitTrials[1]);
    var toughies  = _.shuffle(splitTrials[2]);
    var pretrials = _.map(
      _.shuffle(
        warmups.slice(0, warmups.length / 2).concat(
          fives.slice(0, fives.length / 2)
        )
      ), function(trial) { return {display: 1, stimlist: trial}; }
    );
    var midtrials = _.map(
      _.shuffle(
        warmups.slice(warmups.length / 2).concat(
          fives.slice(fives.length / 2)
        )
      ), function(trial) { return {display: 2, stimlist: trial}; }
    );
    var fintrials = _.map(toughies, function(trial) {
      return {display: 2, stimlist: trial};
    });
    mytrials = pretrials.concat(midtrials, fintrials);
    doTrial(mystage, mystimbubble, mydrawer, myelephant, mytrials);
  }, 2000));

