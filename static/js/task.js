/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initialize psiturk object
var psiTurk = PsiTurk(uniqueId, adServerLoc);

// All pages loaded in course of experiment
var pages = [
	// "instructions/instruct-1.html",
	// "instructions/instruct-2.html",
	// "instructions/instruct-3.html",
  // "instructions/instruct-4.html",
  // "instructions/instruct-5.html",
	"instructions/instruct-ready.html",
  "teststage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // demo instructions
	// "instructions/instruct-1.html",
	// "instructions/instruct-2.html",
	// "instructions/instruct-3.html",
  // "instructions/instruct-4.html",
  // "instructions/instruct-5.html",
	"instructions/instruct-ready.html"
];


/***********************
 * SEQUENCE PREDICTION *
 ***********************/
var SeqPredict = function(stimuli, conceal_number, practice, exp_callback) {

  var makeStage = function() {
    var s = d3.select("#container-exp")
              .insert("div", "#instheader")
              .attr("id", "stage");
    return s;
  };

  var makeCow = function(stage) {
    var c = stage.append("div")
                 .attr("class", "cow")
                 .append("svg")
                 .attr("width", 200)
                 .attr("height", 200)
                 .append("image")
                 .attr("xlink:href", "static/images/cow.svg")
                 .attr("width", 200)
                 .attr("height", 150)
                 .attr("y", 50);
    return c;
  };

  var makeElephant = function(stage) {
    var e = stage.append("div")
                 .attr("class", "elephant")
                 .append("svg")
                 .attr("width", 200)
                 .attr("height", 200)
                 .attr("viewBox", "0 0 360 344")
                 .attr("preserveAspectRatio", "xMinYMin meet")
                 .append("g")
                 .attr("id", "elephant");
    d3.xml("static/images/elephant.svg", "image/svg+xml", function(xml) {
      var importedNode = document.importNode(xml.documentElement, true);
      importedNode.x.baseVal.value = 87;
      importedNode.y.baseVal.value = 95;
      e.node().appendChild(importedNode);
    });
    return e;
  };

  var makeBubble = function(stage, bubclass) {
    var b = stage.append("div")
                 .attr("class", bubclass + " hidden");
    b.append("div");
    return b;
  };

  var makeDrawer = function() {
    var d = d3.select("#container-exp")
              .insert("div", "#instheader")
              .attr("id", "syl-drawer");
    return d;
  };

  var showBubble = function(bubble) {
    bubble.classed("hidden", false);
  };
  
  var hideBubble = function(bubble) {
    bubble.classed("hidden", true);
    bubble.selectAll("p").remove();
  };

  var clearDrawer = function(drawer) {
    drawer.selectAll("button").remove();
  };

  // adds a (hidden) syllable to bubble
  var drawSyl = function(bubble, syl) {
    var s = syl_code[syl] || " ";
    // ".white" is a dummy class, just to identify which syls have not yet
    // been revealed
    bubble.select("div")
          .append("p")
          .attr("class", "white")
          .text(s);
  };

  // reveals the first still-hidden syllable of a bubble
  var showOneSyl = function(bubble) {
    bubble.select(".white")
          .classed("white", false)
          .style("color", "#606388");
  };

  var interrupt = function(syls, callback) {
    // the callback here is basically checkGuess
    var clicks = 0;
    var guess = [];
    showBubble(rbubble);
    drawer.selectAll("button")
          .data(syls)
          .enter()
          .insert("button")
          .attr("type", "button")
          .attr("class", "btn btn-default btn-lg")
          .text(function(d) { return syl_code[d]; })
          .on("click",
              function(d) {
                guess.push(d);
                drawSyl(rbubble, d);
                if (clicks < conceal - 1) {
                  clicks++;
                } else {
                  console.log("guess: ");
                  console.log.apply(console, guess);
                  // check the guess, finish the sequence, launch next trial
                  callback(guess);
                }
              });

  };

  var drawSequence = function(sequence, stim, stim_array) {
    // "cb" below is the callback to checkGuess, which is itself passed in as
    // callback to interrupt; checkGuess does what it says, and then this
    // callback "cb" finishes the sequence and launches the next trial
    var cb = function() {
      var suffix = setInterval(function() {
        if (_.isEmpty(sequence)) {
          clearInterval(suffix);
          _.map([rbubble, sbubble],
                function(b) { hideBubble(b); });
          clearDrawer(drawer);
          setTimeout(function() { doTrial(stim_array); }, 500);
        } else {
          var syl = sequence.shift();
          showOneSyl(sbubble);
        }
      }, 500);
      return suffix;
    }
    var inter = 200;
    var prefix = setInterval(function() {
      if (stim.inter - inter === 0) {
        clearInterval(prefix);
        interrupt(_.range(syl_code.length),
                 function(guess) {
                   stim.guess = guess;
                   psiTurk.recordTrialData(stim);
                   checkGuess(sequence, guess, cb);
                 });
      }
      else {
        var syl = sequence.shift();
        inter = inter + 1;
        showOneSyl(sbubble);
      }
    }, 500);
    return prefix;
  };

  var drawFreebie = function(sequence, stim, stim_array) {
    var fix = setInterval(function() {
      if (_.isEmpty(sequence)) {
        clearInterval(fix);
        stim.guess = [];
        psiTurk.recordTrialData(stim);
        _.map([rbubble, sbubble],
              function(b) { hideBubble(b); });
        setTimeout(function() {
          doTrial(stim_array);
        }, 500);
      } else {
        var syl = sequence.shift();
        showOneSyl(sbubble);
      }
    }, 500);
    return fix;
  };

  var checkGuess = function(sequence, guess, callback) {
    // callback here finishes the sequence, then starts next trial
    var correct = sequence.slice(0, conceal);
    console.log("correct: ");
    console.log.apply(console, correct);
    if (_.isEqual(correct, guess)) {
      elephant.transition().duration(300).attr("transform", "translate(0,-50)")
              .transition().duration(300).attr("transform", "translate(0,0)")
              .transition().duration(300).attr("transform", "translate(0,-50)")
              .transition().duration(300).attr("transform", "translate(0,0)")
              .each("end", callback);
    } else {
      var lefteye = elephant.select("#path3163");
      var righteye = elephant.select("#path3161");
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
  };

  var doTrial = function(stim_array) {
    console.log("stim_array: ");
    console.log.apply(console, stim_array);
    if (stim_array.length > 0) {
      var stim = stim_array.shift();
      var sequence = stim.sequence;
      _.map(sequence, function(syl) { drawSyl(sbubble, syl); });
      showBubble(sbubble);
      setTimeout(function() {
        if (stim.inter === 200) {
          drawFreebie(sequence, stim, stim_array);
        } else {
          console.log("inter:");
          console.log(stim.inter);
          drawSequence(sequence, stim, stim_array);
        }
      }, 2000)
    } else {
      exp_callback();
    }
  };

  if (! practice) { // 
    console.log("showing teststage");
    psiTurk.showPage("teststage.html");
  }

  var stage    = makeStage();
  var elephant = makeElephant(stage);
  var cow      = makeCow(stage);
  var sbubble  = makeBubble(stage, "stim");
  var rbubble  = makeBubble(stage, "response");
  var drawer   = makeDrawer();

  var syl_code    = ["wao", "yai", "piu", "shin", "bam", "fei", "ti", "ra", "ki"];
  var syl_choices = syl_code;
  var conceal     = conceal_number;
  var mytrials    = stimuli;

  setTimeout(function() {
    console.log("conceal: " + conceal);
    console.log.apply(console, mytrials);
    doTrial(mytrials);
  }, 1000);

};


/*****************
 * QUESTIONNAIRE *
 *****************/

var Questionnaire = function() {

  var error_message = [ "<h1>Oops!</h1>",
                        "<p>Something went wrong submitting your HIT.",
                        "This might happen if you lose your internet connection.",
                        "Press the button to resubmit.</p>",
                        "<button id='resubmit'>Resubmit</button>"
                      ].join(" ");

  var record_responses = function() {

    psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

    $('textarea').each( function(i, val) {
      psiTurk.recordUnstructuredData(this.id, this.value);
    });
    $('select').each( function(i, val) {
      psiTurk.recordUnstructuredData(this.id, this.value);		
    });

  };

  var prompt_resubmit = function() {
    replaceBody(error_message);
    $("#resubmit").click(resubmit);
  };

  var resubmit = function() {
    replaceBody("<h1>Trying to resubmit...</h1>");
    reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
      success: function() {
        clearInterval(reprompt); 
        psiTurk.completeHIT();
      }, 
      error: prompt_resubmit
    });
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
    record_responses();
    psiTurk.saveData({
      success: psiTurk.completeHIT, 
      error: prompt_resubmit
    });
	});

};



// Task object to keep track of the current phase
var currentview;
// Condition determines grammar type
// var stimfile = condition === 0 ? "static/data/fsa.csv" : "static/data/cfg.csv";
var stimfile = "static/data/fsa.csv";
// Counterbalance determines prediction window
var hide = counterbalance === 0 ? 1 : 3;

/************
 * RUN TASK *
 ************/
$(window).load(function(){
  psiTurk.doInstructions(
    instructionPages, // go through instructions
    function() { // begin experiment
      var stims = [];
      var randstims = [];
      queue()
        .defer(d3.csv, stimfile, function(d) {
          var inter = _.head(d.Sequence.split(" "));
          var t = _.tail(d.Sequence.split(" "));
          console.log("starting deferral");
          var codes = _.map(t, function(code) { return (+code - 1); });
          stims.push({inter: +inter, sequence: codes});
        }, function(error, rows) {
          console.log("error");
          console.log.apply(console, stims);
        })
        .await(setTimeout(function() {
          console.log("starting awaital");
          var splitStims = _.values(_.groupBy(stims, function(trial) {
            var l = trial.sequence.length;
            if (l < 5) { return "L"; }
            else if (l === 5) { return "E"; }
            else { return "R"; }
          }));
          var warmups   = _.shuffle(splitStims[0]);
          var fives     = _.shuffle(splitStims[1]);
          var toughies  = _.shuffle(splitStims[2]);
          var pretrials = _.shuffle(
            warmups.slice(0, warmups.length / 2).concat(
              fives.slice(0, fives.length / 2)
            )
          ).slice(0,2);
          var midtrials = _.shuffle(
            warmups.slice(warmups.length / 2).concat(
              fives.slice(fives.length / 2)
            )
          ).slice(0,5);
          var fintrials = toughies.slice(0,5);
          randstims = pretrials.concat(midtrials, fintrials);
          console.log("randstims");
          console.log.apply(console, randstims);
          currentview = new SeqPredict(
            randstims,
            hide,
            false,
            function() { currentview = new Questionnaire(); }
          );
        }, 1000));
  });
});
