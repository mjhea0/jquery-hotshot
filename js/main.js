$(function () {


  // ---- variables ---- //

  var numberOfPieces = 4,
    // pieces by width and height
    aspectW = 2,
    aspectH = 2,
    // main container
    container = $("#puzzle"),
    // locate image within main container
    imgContainer = container.find("figure"),
    img = imgContainer.find("img"),
    path = img.attr("src"),
    // calulate size of each piece
    piece = $("<div/>"),
    pieceW = Math.floor(img.width() / aspectW),
    pieceH = Math.floor(img.height() / aspectH),
    // counter for each piece
    idCounter = 0,
    // locations of each piece
    positions = [],
    // location of empty piece
    empty = {
        top: 0,
        left: 0,
        bottom: pieceH,
        right: pieceW
    },
    // locations of previous pieces
    previous = {},
    // time tracking
    timer,
    currentTime = {},
    timerDisplay = container.find("#time").find("span");


    // ---- generate puzzle pieces ---- //

    // loops through twice for both height and width
    for (var x = 0, y = aspectH; x < y; x++) {
      for (var a = 0, b = aspectW; a < b; a++) {
        // alighn puzzle pieces
        var top = pieceH * x,
            left = pieceW * a;

        // copy the div  element, assigning each piece basic styles and an unique id
        piece.clone().attr("id", idCounter++).css({
            width: pieceW,
            height: pieceH,
            position: "absolute",
            top: top,
            left: left,
            backgroundImage: ["url(", path, ")"].join(""),
            backgroundPosition: ["-", pieceW * a, "px ", "-", pieceH * x, "px"].join("")
        // each piece is then appended to the imgContainer
        }).appendTo(imgContainer);

        // store positions
        positions.push({ top: top, left: left });
      }
    }

    // remove image
    img.remove();

    // remove first piece from board
    container.find("#0").remove();

    // remove first item in positions array
    positions.shift();

    // ---- event handler ---- //
    $("#start").on("click", function (e) {

      // shuffle the pieces randomly
      var pieces = imgContainer.children();

      // helper function
      function shuffle(array) {
        var i = array.length;
        if (i === 0) {
          return false;
        }
        while (--i) {
          var j = Math.floor(Math.random() * (i + 1)),
              tempi = array[i],
              tempj = array[j];

          array[i] = tempj;
          array[j] = tempi;
        }
      }

      // call the helper function, pass in the array
      shuffle(pieces);

      // set position of shuffled images
      $.each(pieces, function (i) {
        pieces.eq(i).css(positions[i]);
      });

      // replace existing pieces with shuffled pieces
      pieces.appendTo(imgContainer);

      // make sure empty slot is at position 0 when timer starts
      empty.top = 0;
      empty.left = 0;

      // remove any previous messages
      container.find("#ui").find("p").not("#time").remove();


      // ---- timer ---- // 

      // cancel/reset previous timer if it's running
      if (timer) {
        clearInterval(timer);
        timerDisplay.text("00:00:00");
      }

      // start the timer with setInterval, reset seconds, minutes, and hours to 0
      timer = setInterval(updatetime, 1000);
      currentTime.seconds = 0;
      currentTime.minutes = 0;
      currentTime.hours = 0;

      // update the timer display every second
      function updatetime() {

        // stop timer if 24 hours
        if (currentTime.hours === 23 && currentTime.minutes === 59 && currentTime.seconds === 59) {
          clearinterval(timer);
        } else if (currentTime.minutes === 59 && currentTime.seconds === 59) {
          // increment hours if applicable
          currentTime.hours++;
          currentTime.minutes = 0;
          currentTime.seconds = 0;
        } else if (currentTime.seconds === 59) {
          // increment minutes if applicable
          currentTime.minutes++;
          currentTime.seconds = 0;
        } else {
          // increment seconds
          currentTime.seconds++;
        }

        // build time string (see if we need to pad the beginning of the time with a 0 - e.g, 09 seconds)
        newHours = (currentTime.hours <= 9) ? "0" + currentTime.hours : currentTime.hours;
        newMins = (currentTime.minutes <= 9) ? "0" + currentTime.minutes : currentTime.minutes;
        newSecs = (currentTime.seconds <= 9) ? "0" + currentTime.seconds : currentTime.seconds;

        // update display via an array instead of string concatenation - COMPLICATED!
        timerDisplay.text([newHours, ":", newMins, ":", newSecs].join(""));
      }


      // ---- make pieces draggable ---- //

      pieces.draggable({
        // prevent pieces from being moved outside parent (<figure></figure>)
        containment: "parent",
        grid: [pieceW, pieceH],

        // start callback
        start: function (e, ui) {

          // grab current location
          var current = getPosition(ui.helper);

          // set Available axis depending on location relative to empty space (where pieces can be moved)
          if (current.left === empty.left) {
            ui.helper.draggable("option", "axis", "y");
          } else if (current.top === empty.top) {
            ui.helper.draggable("option", "axis", "x");
          } else {
            ui.helper.trigger("mouseup");
            return false;
          }

          // prevent drag if not adjacent to empty space (like on the edges)
          if (current.bottom < empty.top || current.top > empty.bottom || current.left > empty.right || current.right < empty.left) {
            ui.helper.trigger("mouseup");
            return false;
          }

          //remember current location
          previous.top = current.top;
          previous.left = current.left;

        },

        // drag callback
        drag: function (e, ui) {

          // grab current location
          var current = getPosition(ui.helper);

          // stop dragging if we are in the empty space
          if (current.top === empty.top && current.left === empty.left) {
            ui.helper.trigger("mouseup");
            return false;
          }

          // stop dragging if moving away from empty space
          if (current.top > empty.bottom || current.bottom < empty.top || current.left > empty.right || current.right < empty.left) {
            ui.helper.trigger("mouseup").css({
              top: previous.top,
              left: previous.left
            });
            return false;
          }
        },

        // stop callback
        stop: function (e, ui) {
            // grab current location
            var current = getPosition(ui.helper),
                correctPieces = 0;

            // move empty space if the is space now occupied with a piece
            if (current.top === empty.top && current.left === empty.left) {
              empty.top = previous.top;
              empty.left = previous.left;
              empty.bottom = previous.top + pieceH;
              empty.right = previous.left + pieceW;
            }

            // get positions of all pieces
            $.each(positions, function (i) {

              var currentPiece = $("#" + (i + 1)),
                currentPosition = getPosition(currentPiece);

              //is the current piece in the correct place?
              if (positions[i].top === currentPosition.top && positions[i].left === currentPosition.left) {
                correctPieces++;
              }
            });

            
            // ---- has the puzzle been solved? ---- //

            // end game
            if (correctPieces === positions.length) {

              // stop timer
              clearInterval(timer);

              // append message to the dom
              $("<p/>", {
                text: "Congratulations, you solved the puzzle!"
              }).appendTo("#ui");

              // convert time to seconds
              var totalSeconds = (currentTime.hours * 60 * 60) + (currentTime.minutes * 60) + currentTime.seconds;

              // check if there is a bestTime in localstorage (check if puzzleBestTime exists)
              if (localStorage.getItem("puzzleBestTime")) {
                var bestTime = localStorage.getItem("puzzleBestTime");

                if (totalSeconds < bestTime) {
                  // save new best time
                  localStorage.setItem("puzzleBestTime", totalSeconds);

                  $("<p/>", {
                    text: "you got a new best time!"
                  }).appendTo("#ui");
                }
              } else {
                // save current time
                localStorage.setItem("puzzleBestTime", totalSeconds);

                // display message
                $("<p/>", {
                  text: "You got a new best time!"
                }).appendTo("#ui");
              }
            }
          }
      });

      // helper functon to generate location of each piece
      function getPosition(el) {
        return {
          top: parseInt(el.css("top")),
          bottom: parseInt(el.css("top")) + pieceH,
          left: parseInt(el.css("left")),
          right: parseInt(el.css("left")) + pieceW
        }
      }
  });
});