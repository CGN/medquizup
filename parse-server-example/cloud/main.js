
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});


Parse.Cloud.afterSave("Answer", function(request) {
  //Parse.Cloud.useMasterKey();
  var DailyScore = Parse.Object.extend("DailyScore");
  var Question = Parse.Object.extend("Question");
  var UserScore = Parse.Object.extend("UserScore");

  var questionQuery = new Parse.Query(Question);

  questionQuery.get(request.object.get("question").id, {
    success: function(question) {

      var query = new Parse.Query(DailyScore);
      var date = request.object.get("createdAt");

      date.setHours(0,0,0,0)
      query.greaterThan("createdAt", date);

      date.setHours(23, 59, 0, 0);
      query.lessThan("createdAt", date);

      query.equalTo("user",request.object.get("user"));
      query.equalTo("topic",question.get("topic"));

      query.first({
          success: function(object) {
            if(object){
              object.increment("score", request.object.get("score"));

              object.save(null, { useMasterKey: true });
            }
            else{
              console.log("DailScore not exist");
              var dailyScore = new DailyScore();
              dailyScore.set("score", request.object.get("score"));
              dailyScore.set("topic", question.get("topic"));
              dailyScore.set("user", request.object.get("user"));
              dailyScore.set("isActive", true);
              // dailyScore.save();

              dailyScore.save(null, { useMasterKey: true });


            }
          },
          error: function(error) {
            console.log("Error: " + error + " " + error.message);
          },
          useMasterKey: true
      });



      var query1 = new Parse.Query(UserScore)
      query1.equalTo("topic",question.get("topic"));
      query1.equalTo("user", request.object.get("user"))

      query1.first({
          success: function(object) {

            if(object){
              object.increment("totalScore", request.object.get("score"));
              object.increment("weeklyScore", request.object.get("score"));

              var ansQuery = new Parse.Query(Answer);
              ansQuery.equalTo("user", request.object.get("user"));
              ansQuery.equalTo("question", question);
              ansQuery.count({
                success: function(number) {
                  if (number == 0){
                    if (request.object.get("score") > 0){
                      object.increment("answerCount", +1);

                      var userQuery = new Parse.Query("_User");
                      userQuery.get(request.object.get("user").id, {

                        success: function(user) {
                          user.increment("answerCount", +1);
                          user.save(null, { useMasterKey: true });
                        },
                        error: function(object, error) {

                        }
                      });
                    }
                  }
                },
                error: function(error) {

                },
              useMasterKey: true
              });



              console.log("object exist");

              object.save(null, {
                success: function(userScore) {
                  console.log("userScore saved");
                },
                error: function(userScore, error) {

                }
              , useMasterKey:true}
              );
            }
            else{
              console.log("object not exist");

              var userScore = new UserScore();
              userScore.set("totalScore", request.object.get("score"));
              userScore.set("weeklyScore", request.object.get("score"));
              userScore.set("user", request.object.get("user"));
              userScore.set("topic", question.get("topic"));
              if (request.object.get("score") > 0){
                userScore.set("answerCount", 1);
                var userQuery = new Parse.Query("_User");
                userQuery.get(request.object.get("user").id, {

                  success: function(user) {
                    user.increment("answerCount", +1);
                    user.save(null, { useMasterKey: true });
                  },
                  error: function(object, error) {

                  },
                  useMasterKey: true
                });
              }

              userScore.save(null, {
                success: function(userScore) {
                  console.log("userScore saved");
                },
                error: function(userScore, error) {

                }
              ,useMasterKey:true});


            }
          },
          error: function(error) {
            console.log("Error: " + error + " " + error.message);
          },
          useMasterKey: true
      });

    },
      error: function(question, error) {
        console.log("Error: " + error + " " + error.message);
      }
  });

  request.object.get("user").fetch({
      success: function(object) {
        object.increment("totalScore", request.object.get("score"));
        object.increment("weeklyScore", request.object.get("score"));
        object.save(null, { useMasterKey: true });
      },
      error: function(object, error) {
        console.log("Error: " + error + " " + error.message);
      }
  });
});
Parse.Cloud.afterSave("DailyScore", function(request) {

  if (!request.object.get("isActive")) {

    var UserScore = Parse.Object.extend("UserScore");
    query.equalTo("user",request.object.get("user"));
    query.equalTo("topic",request.object.get("topic"));
    query.first({
        success: function(object) {
          if(object){
            object.increment("weeklyScore", -1 * request.object.get("score"));
          }
          else{

          }
        },
        error: function(error) {

        },
        useMasterKey: true
    });
    request.object.get("user").fetch({
        success: function(object) {
          object.increment("weeklyScore",-1 * request.object.get("score"));
          object.save(null, { useMasterKey: true });
        },
        error: function(object, error) {

        },
          useMasterKey: true
    });
  }
});
Parse.Cloud.afterSave("Game", function(request) {
    var Round = Parse.Object.extend("Round");


    if(request.object.get("createdAt").getTime() == request.object.get("updatedAt").getTime()){
        var i;
        var questions;
        var currentQuestion = 0;
        var Question = Parse.Object.extend("Question");
        var query = new Parse.Query(Question);
        query.equalTo("topic", request.object.get("topic"));
        query.find({
          success: function(results) {
                alert("Successfully retrieved " + results.length + " scores.");
                // Do something with the returned Parse.Object values
                questions = shuffle(results);

               for(i = 0; i<3 ; i++){
            var round = new Round();
            round.set("roundNumber", i+1);
            round.set("isFinished", false);
            round.set("game", request.object);
            round.save(null, {
              success: function(round) {

                for(var j =0; j<6; j++){
                      var RoundQuestion = Parse.Object.extend("RoundQuestion");
                      var roundQuestion = new RoundQuestion();
                      roundQuestion.set("question", questions[currentQuestion]);
                      currentQuestion++;
                      roundQuestion.set("round", round);
                      roundQuestion.save(null, {
                      success: function(roundQuestion){

                      } , error: function(roundQuestion, eroor){

                      }, useMasterKey: true
                      });
                }

              },
              error: function(round, error) {

              },
              useMasterKey: true
            });

        }
          },
          error: function(error) {
            alert("Error: " + error.code + " " + error.message);
          },
          useMasterKey: true
        });



    }
});

Parse.Cloud.beforeSave("Game", function(request, response) {
        if(request.object.isNew()){
              request.object.set("player1Score", 0);
              request.object.set("player2Score", 0);
              request.object.set("currentRound", 1);
              request.object.set("player1Playable", true);
              request.object.set("player2Playable", true);
        }
        else{
            if(request.object.get("player1Playable") == false && request.object.get("player2Playable") == false && request.object.get("currentRound") < 3)
            {
                request.object.set("player1Playable", true);
                request.object.set("player2Playable", true);
                request.object.increment("currentRound");
            }
        }

      response.success();
});

function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex ;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

    return array;
}
Parse.Cloud.afterSave("GameInvitation", function(request) {
  var User = Parse.Object.extend("_User");

  if (request.object.get('createdAt').getTime() == request.object.get('updatedAt').getTime()){
    var invitee = request.object.get("invitee");
    var inviter = request.object.get("inviter");

    var query = new Parse.Query(User);
      query.get(inviter.id, {
        success: function(user) {
          var query = new Parse.Query(Parse.Installation);
          query.equalTo('user', invitee);
          var date = new Date();

          var pushText = user.get("nickname") + " сделал вам вызов. Перейдите во вкладку “Игры”.";

          Parse.Push.send({
            where: query,
            data: {
              aps: {
                alert: pushText,
                sound: 'push-notification.wav',
              },
              inviter:user.get("nickname")
            },
            push_time: date
            },
            {
              success: function() {
                  // Push was successful
                  console.log("Push was successful");
              },
              error: function(error) {
                  console.log("Error occured");
              },
              useMasterKey: true
            });
        },

        error: function(object, error) {
          // error is an instance of Parse.Error.
        },
        useMasterKey: true
    });


  }
  else if (!(request.object.get('accepted') === undefined)) {
    var inviter = request.object.get("inviter");
    var invitee = request.object.get("invitee");

    var query = new Parse.Query(User);
      query.get(invitee.id, {
        success: function(user) {
          var query = new Parse.Query(Parse.Installation);
          query.equalTo('user', inviter);
          var date = new Date();

          var pushText;

          if (request.object.get('accepted') == true){
            pushText = user.get("nickname") + " принял ваш вызов. Перейдите во вкладку “Игры”.";
          }
          else{
            pushText = user.get("nickname") + " отклонил ваш вызов. ";
          }

          Parse.Push.send({
            where: query,
            data: {
              aps: {
                alert: pushText,
                sound: 'push-notification.wav',
              },
              accepted:request.object.get("accepted"),
              invitee:user.get("nickname")
            },
            push_time: date
            },
            {
              success: function() {
                  // Push was successful
                  console.log("Push was successful");
              },
              error: function(error) {
                  console.log("Error occured");
              },
              useMasterKey: true
            });
        },

        error: function(object, error) {
          // error is an instance of Parse.Error.
        },
        useMasterKey: true
    });
  }
})
Parse.Cloud.job("resetWeeklyRating", function(request, status) {
  // Parse.Cloud.useMasterKey();
  var User = Parse.Object.extend("_User");
  var query = new Parse.Query(User);
  query.limit(1000);
  query.greaterThan("weeklyScore", 1);
  query.find({
    success: function(results) {

      var list = []
      for (var i = 0; i < results.length; i++){
        var object = results[i];
        object.set("weeklyScore", 0);
        if (object.get("answerCount") > 50){
          object.set("answerCount", 50);
        }
        list.push(object)
      }

      Parse.Object.saveAll(list, {
            success: function(userList) {
              status.success();
            },
            error: function(model, error) {
              status.error("Error: " + error + " " + error.message);
            }
      ,useMasterKey:true});

    },
    error: function(error) {
      status.error("Error: " + error + " " + error.message);
    },
    useMasterKey: true
  });
});
Parse.Cloud.job("refreshWeeklyScore", function(request, status) {

  // Parse.Cloud.useMasterKey();

  var DailyScore = Parse.Object.extend("DailyScore");
  var query = new Parse.Query(DailyScore);

  var today = new Date()
  today.setHours(0,0,0,0)

  var date1 = new Date()
  date1.setDate(today.getDate() - 7);

  var date2 = new Date()
  date2.setDate(today.getDate() - 6);


  query.greaterThan("createdAt", date1);
  query.lessThan("createdAt", date2);

  query.find({
      success: function(results) {

        var list = []

        for (var i = 0; i < results.length; i++){
          var object = results[i];
          object.set("isActive", false)
          list.push(object)
        }

        Parse.Object.saveAll(list, {
              success: function(list) {
                status.success('Successfully completed');
              },
              error: function(model, error) {
                status.error("Error: " + error + " " + error.message);
              }
        });
      },
      error: function(error) {
        status.error("Error: " + error + " " + error.message);
      },
      useMasterKey: true
  });
});
Parse.Cloud.afterSave("Question", function(request) {

    var Topic = Parse.Object.extend("Topic");
    var query = new Parse.Query(Topic);


    query.get(request.object.get("topic").id, {

      success: function(topic) {
        topic.increment("numberOfQuestions");
      },
      error: function(object, error) {

      },
      useMasterKey: true
    });
});

Parse.Cloud.beforeDelete("Question", function(request, response) {

    var Option = Parse.Object.extend("Option");
    var query = new Parse.Query(Option);
    query.equalTo("question", request.object);

    query.find({
      success: function(results) {

        Parse.Object.destroyAll(results).then(
          function(success) {
            response.success();
          },
          function(error) {
            response.success();
          });

      },
      error: function(error) {
        response.success();
      }
    ,
    useMasterKey: true}
    );
});
Parse.Cloud.beforeSave("_User", function(request, response) {
  var user = request.object;
  var totalScore = user.get("totalScore");

  var n1 = 1000;
  var level = 0;

  if (totalScore === undefined) {
    level = 0
  }
  else{

    var border = n1;
    while(totalScore > border){

      level = level + 1;
      border = 2.5 * border;

    }

  }

  request.object.set("level", level);

  if (request.object.isNew()){
    request.object.set("answerCount", 0);
  }

  response.success();
})
Parse.Cloud.beforeSave("UserScore", function(request, response) {

  if (request.object.isNew()){
    var UserScore = Parse.Object.extend("UserScore");
    var query = new Parse.Query(UserScore);
    query.equalTo("user", request.object.get("user"));
    query.equalTo("topic", request.object.get("topic"));

    query.first({
      success: function(object) {
            if (object) {
                response.error();
            } else {
                response.success();
            }
        },
        error: function(error) {
            response.error();
        },
        useMasterKey: true
    });
  }
  else{
    response.success();
  }
});