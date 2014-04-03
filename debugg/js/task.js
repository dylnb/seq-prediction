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

function interrupt(stage, drawer, syl_range, conceal_num, callback) {
  var clicks = 0;
  var guess = [];

  var rbubble = makeResponseBubble(stage);
  drawer.selectAll("button")
        .data(syl_range)
        .enter()
        .insert("button")
        .attr("type", "button")
        .attr("class", "btn btn-default btn-lg")
        .text(function(d) { return syl_code[d]; })
        .on("click",
            function(d) {
              guess.push(d);
              clearBubble(rbubble);
              drawSyl(rbubble, d);
              if (clicks < conceal_num - 1) {
                clicks++;
              } else {
                // rbubble.remove();
                console.log("guess: ");
                console.log.apply(console, guess);
                // psiTurk.recordTrialData(guess);
                // this callback is basically checkGuess
                callback(guess, rbubble);
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
  // this is the callback to checkGuess
  var cb = function() {
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
  }
  var prefix = setInterval(function() {
    clearBubble(sbubble);
    if (sequence.length == conceal_num) {
      clearInterval(prefix);
      // this callback is interrupt
      callback(stage, drawer, _.range(syl_code.length), conceal_num,
               function(guess, bubble) {
                 checkGuess(elephant, sequence, guess, bubble, cb);
               });
    }
    else {
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
  var s = syl_code[syl] || " ";
  bubble.append("div")
        .append("p")
        .text(s);
}

function checkGuess(elephant, correct, guess, bubble, callback) {
  // callback here finishes the sequence, then starts next trial
  console.log("correct: ");
  console.log.apply(console, correct);
  var equal = function (correct, guess) {
    if (correct.length !== guess.length) { return false; }
    else if (_.isEmpty(correct)) { return true; }
    else {
      var report = (correct[0] === guess[0]) &&
                   equal(correct.slice(1, correct.length),
                         guess.slice(1, guess.length));
      return report;
    }
  }
  if (equal(correct, guess)) {
    elephant.transition().duration(300).attr("transform", "translate(0,-50)")
            .transition().duration(300).attr("transform", "translate(0,0)")
            .transition().duration(300).attr("transform", "translate(0,-50)")
            .transition().duration(300).attr("transform", "translate(0,0)")
            .each("end", function() { bubble.remove(); callback(); });
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
           .each("end", function() { bubble.remove(); callback(); });
  }
}

function doTrial(stage, sbubble, drawer, elephant, stim_array) {
  if (stim_array.length > 0) {
    var stim = stim_array.shift();
    var display = stim.display;
    var sequence = stim.stimlist;
    clearBubble(sbubble);
    clearDrawer(drawer);
    drawSyl(sbubble, -1);
    setTimeout(function() {
      if (display == 1 || sequence.length < 5 ||
          sequence.length == 5 && Math.random() < 0.5) {
        drawExpSequence(stage, sbubble, drawer, elephant, sequence, stim_array);
      } else {
        drawSequence(stage, sbubble, drawer, elephant, sequence,
                     conceal_number, stim_array, interrupt);
      }
    }, 2000)
  } else {
    d3.select(".container").append("center").text("That'll do. Thanks.");
  }
}

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

// var stims = condition == 0 ? "data/fsa.csv" : "data/cfg.csv";
// var conceal_number = counter == 0 ? 1 : 3
var stims = "data/fsa.csv";
var conceal_number = 1;
queue()
  .defer(d3.csv, stims, function(d) {
    var codes = _.map(d.Sequence.split(" "),
                      function(code) { return (+code - 1); });
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
    ).slice(0,2);
    var midtrials = _.map(
      _.shuffle(
        warmups.slice(warmups.length / 2).concat(
          fives.slice(fives.length / 2)
        )
      ), function(trial) { return {display: 2, stimlist: trial}; }
    ).slice(0,5);
    var fintrials = _.map(toughies, function(trial) {
      return {display: 2, stimlist: trial};
    }).slice(0,5);
    mytrials = pretrials.concat(midtrials, fintrials);
    doTrial(mystage, mystimbubble, mydrawer, myelephant, mytrials);
  }, 2000));

