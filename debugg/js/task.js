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

//function makeElephant(stage) {
//  var elephant = stage.append("div")
//                      .attr("class", "elephant")
//                      .append("svg")
//                      .attr("width", 200)
//                      .attr("height", 200)
//                      .append("image")
//                      .attr("xlink:href", "images/elephant.svg")
//                      .attr("width", 150)
//                      .attr("height", 150)
//                      .attr("x", 50)
//                      .attr("y", 50);
//  return elephant;
//}

function makeElephant(stage) {
  var e = stage.append("div")
               .attr("class", "elephant")
               .append("svg")
               .attr("id", "elephant")
               .attr("width", 200)
               .attr("height", 200)
               .attr("viewBox", "0 0 360 344")
               .attr("preserveAspectRatio", "xMinYMin meet");
  
  d3.xml("images/elephant.svg", "image/svg+xml", function(xml) {
    var importedNode = document.importNode(xml.documentElement, true);
    importedNode.x.baseVal.value = 87;
    importedNode.y.baseVal.value = 95;
    e.node().appendChild(importedNode);
  });

  return e.select("svg");
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
        .text(function(d) { return d.text; })
        .on("click",
            function(d) {
              guess.push(d.text);
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
  bubble.append("div")
        .append("p")
        .text(syl.text);
}

function checkGuess(elephant, correct, guess, callback) {
  var equal = function (correct, guess) {
    var cor_strings = _.pluck(correct, "text");
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
    elephant.transition().duration(300).attr("y", 25)
            .transition().duration(300).attr("y", 50)
            .transition().duration(300).attr("y", 25)
            .transition().duration(300).attr("y", 50);
  } else {
    var lefteye = d3.select("#3163");
    var totalLength = lefteye.node().getTotalLength();
    lefteye.attr("stroke-dasharray", totalLength + " " + totalLength)
           .attr("stroke-dashoffset", totalLength)
           .transition()
           .duration(2000)
           .ease("linear")
           .attr("stroke-dashoffset", 0);
  callback();
  }
}

function doTrial(stage, sbubble, drawer, elephant, stim_array) {
  if (stim_array.length > 0) {
    var sequence = stim_array.shift();
    clearBubble(sbubble);
    clearDrawer(drawer);
    drawSyl(sbubble, {index: 0, text: " "});
    setTimeout(function() {
      if (sequence.length <= conceal_number) {
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

var syl_choices    = [
  {text: "ba"}, {text: "pa"}, {text: "gu"}, {text: "bo"}
];
var conceal_number = 3;
var mystage        = makeStage();
var myelephant     = makeElephant(mystage);
var mycow          = makeCow(mystage);
var mystimbubble   = makeStimBubble(mystage);
var mydrawer       = makeDrawer();
var mynotes        = makeNotificationWindow();

var syl_code = ["wao", "yai", "piu", "shin", "bam", "fei", "ti", "ra", "ki"];
var trials = [];

queue()
  .defer(d3.csv, "data/stims2.csv", function(d) {
    var codes = d.Sequence.split(" ");
    var syls = _.map(codes, function(code) { return {text: syl_code[+code - 1]}; });
    trials.push(syls);
  }, function(error, rows) {
    console.log("error");
  })
  .await(setTimeout(function() {
    myelephant.transition().duration(300).attr("y", 25)
              .transition().duration(300).attr("y", 50)
              .transition().duration(300).attr("y", 25)
              .transition().duration(300).attr("y", 50);
    doTrial(mystage, mystimbubble, mydrawer, myelephant, trials);
  }, 2000));

