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

  function makeButtons(drawer, syls, conceal_num, callback) {
    var clicks = 0;
    var guess = [];
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
                if (clicks < conceal_num - 1) {
                  clicks++;
                } else {
                  console.log.apply(console, guess);
                  psiTurk.recordTrialData(guess);
                  console.log.apply(console, guess);
                  callback(guess);
                }
              });

  }

  function clearStage(stage) {
    stage.selectAll(".stim").remove();
  }

  function clearDrawer(drawer) {
    drawer.selectAll("button").remove();
  }

  function clearNotes(notes) {
    notes.selectAll("p").remove();
  }

  function drawSequence(stage, drawer, notes, sequence,
                        conceal_num, stim_array, callback) {
    var interval = setInterval(function() {
      if (sequence.length == conceal_num) {
        clearInterval(interval);
        callback(drawer, syl_choices, conceal_num,
                 function(guess) {
                   checkGuess(notes, sequence, guess);
                   doTrial(stage, drawer, notes, stim_array);
                 });
      }
      else {
        var syl = sequence.shift();
        clearStage(stage);
        drawSyl(stage, syl);  
      }
    }, 1000);
    return interval;
  }

  function drawSyl(stage, syl) {
    stage.append("div")
         .attr("class", "stim")
         .append("p")
         .attr("class", "stim")
         .text(syl.text);
  }

  function checkGuess(notes, correct, guess) {
    var equal = function (correct, guess) {
      if (correct.length !== guess.length) { return false; }
      else if (correct == []) { return true; }
      else {
        var report = (correct[0] === guess[0]) &&
                     equal(correct.slice(1, correct.length),
                           guess.slice(1, guess.length));
        return report;
      }
    }
    var color = equal(correct, guess) ? "green" : "red";
    console.log(color);
    notes.selectAll("p")
         .data(correct.map(function (syl) { return syl.text; }))
         .enter()
         .append("p")
         .style("color", color)
         .text(function(d) { return d; });
  }

  function doTrial(stage, drawer, notes, stim_array) {
    if (stim_array.length > 0) {
      var sequence = stim_array.shift();
      clearStage(stage);
      clearDrawer(drawer);
      drawSequence(stage, drawer, notes, sequence,
                   conceal_number, stim_array, makeButtons);
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

  var syl_choices = ["ba", "pa", "gu", "bo"];
  var conceal_number = 3;
  var mystage  = makeStage();
  var mydrawer = makeDrawer();
  var mynotes = makeNotificationWindow();

  doTrial(mystage, mydrawer, mynotes, trials); 

}

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() {
        console.log("something");
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
