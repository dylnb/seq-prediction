/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initialize psiturk object
var psiTurk = PsiTurk();

var pages = ["instruct.html", "test.html"];

psiTurk.preloadPages(pages);

var instructionPages = ["instruct.html"];

// Stimuli...
var trials = [
  [
    {index: 1, text: "pa"},
    {index: 2, text: "bo"},
    {index: 3, text: "gu"},
    {index: 4, text: "pa"},
    {index: 5, text: "bo"},
    {index: 6, text: "gu"}
  ],
  [
    {index: 1, text: "go"},
    {index: 2, text: "bu"},
    {index: 3, text: "pa"},
    {index: 4, text: "pa"},
    {index: 5, text: "bo"},
    {index: 6, text: "gu"}
  ],
  [
    {index: 1, text: "ge"},
    {index: 2, text: "pu"},
    {index: 3, text: "pa"},
    {index: 4, text: "pa"},
    {index: 5, text: "bo"},
    {index: 6, text: "gu"}
  ]
];

// Task object to keep track of the current phase
var currentview;

/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

var TestPhase = function() {

  function makeStage() {
    var stage = d3.select(".container")
                  .append("div")
                  .attr("class", "stage")
                  .append("div")
                  .attr("class", "absoluteContainer");
    return stage;
  }

  function makeCow(stage) {
    var cow = stage.append("div")
                   .attr("class", "cow")
                   .append("svg")
                   .attr("width", 200)
                   .attr("height", 200)
                   .append("image")
                   .attr("xlink:href", "static/images/cow.svg")
                   .attr("width", 200)
                   .attr("height", 150)
                   .attr("y", 50);
    return cow;
  }

  function makeElephant(stage) {
    var elephant = stage.append("div")
                        .attr("class", "elephant")
                        .append("svg")
                        .attr("width", 200)
                        .attr("height", 200)
                        .append("image")
                        .attr("xlink:href", "static/images/elephant.svg")
                        .attr("width", 150)
                        .attr("height", 150)
                        .attr("x", 50)
                        .attr("y", 50);
    return elephant;
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
                  psiTurk.recordTrialData(guess);
                  callback(guess);
                }
              });

  }

  function clearBubble(bubble) {
    bubble.selectAll("div").remove();
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
                       if (sequence.length == 0) {
                         clearInterval(suffix);
                         doTrial(stage, sbubble, drawer, elephant, stim_array);
                       } else {
                         var syl = sequence.shift();
                         drawSyl(sbubble, syl);
                       }
                     }, 1000);
                     return suffix;
                   });
                 });
      }
      else {
        var syl = sequence.shift();
        drawSyl(sbubble, syl);
      }
    }, 1000);
    return prefix;
  }

  function drawSyl(bubble, syl) {
    bubble.append("div")
          .append("p")
          .text(syl.text);
  }

  function checkGuess(elephant, correct, guess, callback) {
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
    console.log("correct: " + correct);
    console.log("guess: " + guess);
    if (!equal(correct, guess)) {
      elephant.transition().duration(300).attr("y", 25)
              .transition().duration(300).attr("y", 50)
              .transition().duration(300).attr("y", 25)
              .transition().duration(300).attr("y", 50);
    }
    callback();
  }

  function doTrial(stage, sbubble, drawer, elephant, stim_array) {
    if (stim_array.length > 0) {
      var sequence = stim_array.shift();
      clearBubble(sbubble);
      clearDrawer(drawer);
      drawSyl(sbubble, {index: 0, text: "+"});
      setTimeout(function() {
        drawSequence(stage, sbubble, drawer, elephant, sequence,
                     conceal_number, stim_array, interrupt);
      }, 2000);
    } else {
      psiTurk.saveData({
        success: function() {
          d3.select(".container").append("center").text("That'll do. Thanks.");
          d3.select(".container")
            .append("center")
            .append("button")
            .attr("type", "button")
            .attr("class", "btn btn-primary btn-lg")
            .text("Teardown")
            .on("click", function() { psiTurk.teardownTask(); });
        },
        error: function() {
          d3.select(".container").append("center").text("Uh oh.");
        }
      });
    }
  }

	psiTurk.showPage('test.html');

  var syl_choices    = [
    {text: "ba"}, {text: "pa"}, {text: "gu"}, {text: "bo"}
  ];
  var conceal_number = 3;
  if (condition == 1) { conceal_number = 1; }
  var mystage        = makeStage();
  var myelephant     = makeElephant(mystage);
  var mycow          = makeCow(mystage);
  var mystimbubble   = makeStimBubble(mystage);
  var mydrawer       = makeDrawer();
  var mynotes        = makeNotificationWindow();

  setTimeout(function() {
    doTrial(mystage, mystimbubble, mydrawer, myelephant, trials);
  }, 2000);

}

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() {
        currentview = new TestPhase();
      } // what you want to do when you are done with instructions
    );
});




// var trials = [
//   {
//     reveal:  [
//                {index: 1, text: "pa"},
//                {index: 2, text: "bo"},
//                {index: 3, text: "gu"},
//              ],
//     conceal: [
//                {index: 4, text: "pa"},
//                {index: 5, text: "bo"},
//                {index: 6, text: "gu"}
//              ]
//   }
//   {
//     reveal:  [
//                {index: 1, text: "go"},
//                {index: 2, text: "bu"},
//                {index: 3, text: "pa"},
//              ],
//     conceal: [
//                {index: 4, text: "pa"},
//                {index: 5, text: "bo"},
//                {index: 6, text: "gu"}
//              ]
//   }
//   {
//     reveal:  [
//                {index: 1, text: "ge"},
//                {index: 2, text: "pu"},
//                {index: 3, text: "pa"},
//              ],
//     conceal: [
//                {index: 4, text: "pa"},
//                {index: 5, text: "bo"},
//                {index: 6, text: "gu"}
//              ]
//   }
// ];
