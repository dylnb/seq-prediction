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
  "instructions/instruct-4.html",
  "instructions/instruct-5.html",
  "instructions/instruct-6.html",
  "instructions/instruct-7.html",
  "instructions/instruct-ready.html",
  "teststage.html",
  "breather.html",
  "postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // demo instructions
  "instructions/instruct-1.html",
  "instructions/instruct-2.html",
  "instructions/instruct-3.html",
  "instructions/instruct-4.html",
  "instructions/instruct-5.html",
  "instructions/instruct-6.html",
  "instructions/instruct-7.html",
  "instructions/instruct-ready.html"
];


/***********************
 * SEQUENCE PREDICTION *
 ***********************/
var SeqPredict = function(stimuli, pred_window,  practice_run, exp_callback) {

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
      importedNode.x.baseVal.value = 43;
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
    bubble.select("hr").remove();
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
  var showOneSyl = function(bubble, color) {
    bubble.select(".white")
          .classed("white", false)
          .style("color", color || "#606388");
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
                  // console.log("guess: ");
                  // console.log.apply(console, guess);
                  drawer.selectAll("button")
                        .property("disabled", true);
                  // check the guess, finish the sequence, launch next trial
                  callback(guess);
                }
              });

  };

  var drawSequence = function(sequence, stim, stim_array) {
    // "cb" below is the callback to checkGuess, which is itself passed in as
    // callback to interrupt; checkGuess does what it says, and then this
    // callback "cb" finishes the sequence and launches the next trial
    var cb = function(scored) {
      var wind = conceal;
      var suffix = setInterval(function() {
        if (_.isEmpty(sequence)) {
          clearInterval(suffix);
          setTimeout(function() {
            _.each([rbubble, sbubble], hideBubble);
            clearDrawer(drawer);
            setTimeout(function() { doTrial(stim_array); }, 500);
          }, 1000);
        } else {
          sequence.shift();
          if (wind === 0) { showOneSyl(sbubble); }
          else {
            showOneSyl(sbubble, _.head(scored) ? "green" : "red");
            wind--;
            scored.shift();
          }
        }
      }, 250);
      return suffix;
    };
    var inter = 200;
    var prefix = setInterval(function() {
      if (stim.inter - inter === 0) {
        clearInterval(prefix);
        interrupt(_.range(syl_code.length),
                 function(guess) {
                   stim.guess = guess;
                   stim.target = sequence.slice(0, conceal);
                   psiTurk.recordTrialData(stim);
                   checkGuess(sequence, guess, cb);
                 });
      } else { sequence.shift(); inter++; showOneSyl(sbubble); }
    }, 250);
    return prefix;
  };

  var drawFreebie = function(sequence, stim, stim_array) {
    var fix = setInterval(function() {
      if (_.isEmpty(sequence)) {
        clearInterval(fix);
        stim.guess = [];
        stim.taget = [];
        psiTurk.recordTrialData(stim);
        setTimeout(function() {
          _.each([rbubble, sbubble], hideBubble);
          setTimeout(function() { doTrial(stim_array); }, 500);
        }, 1000);
      } else { sequence.shift(); showOneSyl(sbubble); }
    }, 250);
    return fix;
  };

  var checkGuess = function(sequence, guess, callback) {
    // callback here finishes the sequence, then starts next trial
    var target = sequence.slice(0, conceal);
    var scored = _.zip(target, guess)
                  .map(function(p) { return _.isEqual.apply(_, p); });
    // console.log("target: ");
    // console.log.apply(console, target);
    if (_.isEqual(target, guess)) {
      elephant.transition().duration(300).attr("transform", "translate(0,-50)")
              .transition().duration(300).attr("transform", "translate(0,0)")
              .transition().duration(300).attr("transform", "translate(0,-50)")
              .transition().duration(300).attr("transform", "translate(0,0)")
              .each("end", function() { callback(scored); });
    } else {
      var lefteye = elephant.select("#path3163");
      var righteye = elephant.select("#path3161");
      lefteye
        .transition()
        .duration(1800)
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
         .duration(1800)
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
         .each("end", function() { callback(scored); });
    }
  };

  var doTrial = function(stim_array) {
    // console.log("stim_array: ");
    // console.log.apply(console, stim_array);
    if (stim_array.length > 0) {
      var stim = stim_array.shift();
      var sequence = stim.sequence.slice();
      _.each(sequence, _.partial(drawSyl, sbubble));
      setTimeout(function() {
        if (stim.inter === 200) {
          showBubble(sbubble);
          setTimeout(function() {
            drawFreebie(sequence, stim, stim_array);
          }, 500);
        } else {
          // console.log("inter: ");
          // console.log(stim.inter);
          var bar = stim.inter - 199;
          sbubble.select("div")
                 .insert("hr", "p:nth-of-type(" + bar + ")")
                 .attr("class", "vline")
                 .style("background-color", "black");
          showBubble(sbubble);
          setTimeout(function() {
            drawSequence(sequence, stim, stim_array);
          }, 500);
        }
      }, 1000)
    } else {
      exp_callback();
    }
  };

  if (! practice_run) {
    // it's the real experiment; clear the window and prep the test stage
    // console.log("showing teststage");
    psiTurk.showPage("teststage.html");
  }

  var stage    = makeStage();
  var elephant = makeElephant(stage);
  var cow      = makeCow(stage);
  var sbubble  = makeBubble(stage, "stim");
  var rbubble  = makeBubble(stage, "response");
  var drawer   = makeDrawer();

  var syl_code;
  syl_code = ["daz", "mer", "lev", "jes", "tid", "rud", "nav", "sib", "zor"]
  var conceal  = pred_window;
  var mytrials = stimuli;

  setTimeout(function() {
    // console.log("conceal: " + conceal);
    // console.log.apply(console, mytrials);
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
    $('body').html(error_message);
    $("#resubmit").click(resubmit);
  };

  var resubmit = function() {
    $('body').html("<h1>Trying to resubmit...</h1>");
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
var stimfile = condition === "0" ? "static/data/fsa_grammar.csv"
                                 : "static/data/cfg_grammar.csv";
// var stimfile = "static/data/fsa_grammar.csv";
var demo_syl_code;
demo_syl_code = ["daz", "mer", "lev", "jes", "tid", "rud", "nav", "sib", "zor"]

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
        .defer(d3.csv, stimfile, function(d) { // first load the data
          // console.log("starting deferral");
          // // first number identifies interruption point
          // var inter = _.head(d.Sequence.split(" "));
          // // next numbers code for a particular sequence of syllables
          // var t = _.tail(d.Sequence.split(" "));
          // console.log("starting deferral");
          // var codes = _.map(t, function(code) { return (+code - 1); });
          // // add a stimulus (an interruption point and a syl sequence)
          // // to the trial list
          // stims.push({inter: +inter, sequence: codes});
          var codes = _.map(
            d.Sequence.split(" "),
            function(code) { return (+code - 1); }
          );
          stims.push({inter: 200, sequence: codes});
        })
        .await(function(error) { // then wait 3s, randomize data, run task
          setTimeout(function() {
            // console.log("starting awaital");
            var splitStims = _.values(_.groupBy(stims, function(trial) {
              var l = trial.sequence.length;
              if (l < 5) { return "L"; }
              else if (l === 5) { return "E"; }
              else { return "R"; }
            }));

            var warmups = splitStims[0];
            var fives   = splitStims[1];

            var pretrials = _.shuffle(
              warmups.slice(0, warmups.length / 2).concat(
                fives.slice(0, fives.length / 2)
              )
            );

            var midtrials = _.shuffle(
              warmups.slice(warmups.length / 2).concat(
                fives.slice(fives.length / 2, 3 * fives.length / 4),
                _.map(
                  fives.slice(3 * fives.length / 4),
                  function(s) { s.inter = 202; return s; }
                )
              )
            );

            var toughgroups = _.groupBy(
              splitStims[2],
              function(trial) { return trial.sequence.length; }
            );
            var inter_columns = []
            _.each(toughgroups, function(value, key) {
              var n = key;
              var n_yield = value.length;
              var int_points = _.range(200 + Math.floor(n/2), 200 + (n-2));
              var b = [];
              for (i = 0; i < n_yield; i++) {
                b.push(int_points[i % int_points.length]);
              }
              inter_columns.push(b);
            });
            var toughies = _.zip(
              _.flatten(inter_columns),
              _.sortBy(splitStims[2], function(trial) { return trial.sequence.length; })
            ).map(function(ht) { return {inter: ht[0], sequence: ht[1].sequence}; });

            var fintrials = _.shuffle(toughies);

            randstims = pretrials.concat(midtrials, fintrials);
            // randstims = fintrials.slice(0,4);
            var onestims = randstims.slice(0, randstims.length / 2);
            var twostims = randstims.slice(randstims.length / 2);
            // console.log("randstims");
            // console.log.apply(console, randstims);
            currentview = new SeqPredict(
              onestims, // trial data
              counterbalance === "0" ? 1 : 3, // prediction window
              false, // real experiment; not practice
              function() {
                psiTurk.saveData({
                  success: function() {
                    psiTurk.showPage("breather.html");
                    $("#keepgoing").click(function() {
                      currentview = new SeqPredict(
                        twostims,
                        counterbalance === "0" ? 1 : 3,
                        false,
                        function() {
                          psiTurk.saveData({
                            success: function() {
                              currentview = new Questionnaire();
                            }, // post-exp
                            error: function() {
                              var error_message = [ "<h1>Oops!</h1>",
                                "<p>Something went wrong submitting your HIT.",
                                "This might happen if you lose your internet connection.",
                                "Press the button to resubmit.</p>",
                                "<button id='keepgoing'>Continue</button>"
                                                  ].join(" ");
                              var prompt_resubmit = function() {
                                $('body').html(error_message);
                                $("#keepgoing").click(resubmit);
                              };
                              var resubmit = function() {
                                $('body').html("<h1>Attempting to continue...</h1>");
                                reprompt = setTimeout(prompt_resubmit, 10000);
                                psiTurk.saveData({
                                  success: function() {
                                    clearInterval(reprompt); 
                                    currentview = new Questionnaire();
                                  }, 
                                  error: prompt_resubmit
                                });
                              };
                            }
                          });
                        }
                      );
                    });
                  },
                  error: function() {
                    var error_message = [ "<h1>Oops!</h1>",
                      "<p>Something went wrong submitting your HIT.",
                      "This might happen if you lose your internet connection.",
                      "Press the button to resubmit.</p>",
                      "<button id='keepgoing'>Continue</button>"
                                        ].join(" ");
                    var prompt_resubmit = function() {
                      $('body').html(error_message);
                      $("#keepgoing").click(resubmit);
                    };
                    var resubmit = function() {
                      $('body').html("<h1>Attempting to continue...</h1>");
                      reprompt = setTimeout(prompt_resubmit, 10000);
                      psiTurk.saveData({
                        success: function() {
                          clearInterval(reprompt); 
                          currentview = new Questionnaire();
                        }, 
                        error: prompt_resubmit
                      });
                    };
                  }
                });
              }
            );
          }, 3000);
        });
    }
  );
});
