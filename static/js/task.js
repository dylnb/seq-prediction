/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initialize psiturk object
var psiTurk = PsiTurk(uniqueId, adServerLoc);

// All pages loaded in course of experiment
var pages = [
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // demo instructions
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html"
];


/**********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
**********************/

/**********************
* SEQUENCE PREDICTION *
**********************/
var TestPhase = function() {

  var makeStage = function() {
    var stage = d3.select("#container-exp")
                  .append("div")
                  .attr("id", "stage");
    return stage;
  }

  var makeCow = function(stage) {
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
  }

  var makeStimBubble = function(stage) {
    var sbubble = stage.append("div")
                       .attr("class", "stim");
    return sbubble;
  }

  var makeResponseBubble = function(stage) {
    var respbubble = stage.append("div")
                          .attr("class", "response");
    return respbubble;
  }

  var makeDrawer = function() {
    var drawer = d3.select("#container-exp")
                   .append("div")
                   .attr("id", "syl-drawer");
    return drawer;
  }

  var interrupt = function(stage, drawer, syls, conceal_num, callback) {
    var clicks = 0;
    var guess = [];

    var rbubble = makeResponseBubble(stage);
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
                clearBubble(rbubble);
                drawSyl(rbubble, d);
                if (clicks < conceal_num - 1) {
                  clicks++;
                } else {
                  // rbubble.remove();
                  console.log("guess: ");
                  console.log.apply(console, guess);
                  // this callback is basically checkGuess
                  callback(guess, rbubble);
                }
              });

  }

  var clearBubble = function(bubble) {
    bubble.selectAll("div").remove();
  }

  var clearDrawer = function(drawer) {
    drawer.selectAll("button").remove();
  }

  var drawSequence = function(stage, sbubble, drawer, elephant, sequence,
                              conceal_num, td, stim_array, callback) {
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
                   td.guess = guess;
                   psiTurk.recordTrialData(td);
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

  var drawFreebie = function(stage, sbubble, drawer, elephant,
                             sequence, td, stim_array) {
    var fix = setInterval(function() {
      clearBubble(sbubble);
      if (_.isEmpty(sequence)) {
        clearInterval(fix);
        td.guess = [];
        psiTurk.recordTrialData(td);
        doTrial(stage, sbubble, drawer, elephant, stim_array);
      } else {
        var syl = sequence.shift();
        drawSyl(sbubble, syl);
      }
    }, 250);
    return fix;
  }

  var drawSyl = function(bubble, syl) {
    var s = syl_code[syl] || " ";
    bubble.append("div")
          .append("p")
          .text(s);
  }

  var checkGuess = function(elephant, correct, guess, bubble, callback) {
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

  var doTrial = function(stage, sbubble, drawer, elephant, stim_array) {
    if (stim_array.length > 0) {
      var stim = stim_array.shift();
      var display = stim.display;
      var sequence = stim.stimlist;
      var td = {'display': display, 'sequence': sequence};
      clearBubble(sbubble);
      clearDrawer(drawer);
      drawSyl(sbubble, -1);
      setTimeout(function() {
        if (display == 1 || sequence.length < 5 ||
            sequence.length == 5 && Math.random() < 0.5) {
          drawFreebie(stage, sbubble, drawer, elephant,
                      sequence, td, stim_array);
        } else {
          drawSequence(stage, sbubble, drawer, elephant, sequence,
                       conceal_number, td, stim_array, interrupt);
        }
      }, 2000)
    } else {
      finish();
    }
  }

	var finish = function() {
	    currentview = new Questionnaire();
	};

	psiTurk.showPage('stage.html');

  var mystage        = makeStage();
  var myelephant     = makeElephant(mystage);
  var mycow          = makeCow(mystage);
  var mystimbubble   = makeStimBubble(mystage);
  var mydrawer       = makeDrawer();

  var syl_code    = ["wao", "yai", "piu", "shin", "bam", "fei", "ti", "ra", "ki"];
  var syl_choices = syl_code;
  var alltrials   = [];
  var mytrials    = [];

  var stims = condition == 0 ? "static/data/fsa.csv" : "static/data/cfg.csv";
  var conceal_number = counterbalance == 0 ? 1 : 3;

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
}


/**********************
* Questionnaire       *
**********************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
        clearInterval(reprompt); 
        psiTurk.computeBonus('compute_bonus', function(){finish()}); 
			}, 
			error: prompt_resubmit}
		);
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
    record_responses();
    psiTurk.saveData({
      success: function(){
        psiTurk.computeBonus('compute_bonus', function() { 
          psiTurk.completeHIT(); // when finished saving compute bonus, the quit
        }); 
      }, 
      error: prompt_resubmit
    });
	});

};



// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // go through instructions
    	function() { // begin experiment
        currentview = new TestPhase(); 
      }
    );
});
