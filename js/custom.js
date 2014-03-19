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

function makeButtons(drawer, syls, callback) {
  drawer.selectAll("button")
        .data(syls)
        .enter()
        .insert("button")
        .attr("type", "button")
        .attr("class", "btn btn-default btn-lg")
        .text(function(d) { return d; })
        .on("click",
            function(d) {
              console.log("clicked " + d); callback();
            });

}

function clearStage(stage) {
  stage.selectAll(".stim").remove();
}

function clearDrawer(drawer) {
  drawer.selectAll("button").remove();
}

function drawSequence(stage, sequence, drawer, stim_array, callback) {
  var interval = setInterval(function() {
    if (sequence.length == 0) {
      clearInterval(interval);
      callback(drawer, syl_choices,
               function() { doTrial(stage, drawer, stim_array); })
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

var syl_choices = [
  "ba", "pa", "gu", "bo"
];
var reveal_number = 3;
var mystage  = makeStage();
var mydrawer = makeDrawer();

function doTrial(stage, drawer, stim_array) {
  if (stim_array.length > 0) {
    var sequence = stim_array.shift();
    clearStage(stage);
    clearDrawer(drawer);
    drawSequence(stage, sequence.slice(0, reveal_number),
                 drawer, stim_array, makeButtons);
  } else {
    d3.select(".container").append("center").text("That'll do. Thanks.");
  }
}

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

doTrial(mystage, mydrawer, trials); 


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
