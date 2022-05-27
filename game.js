function randomFromArray(array)
{
  return array[Math.floor(Math.random() * array.length)];
}

(function(){
  let playerId;
  let playerRef;
  let world;
  let worldContainer = {};
  let players = {};
  let playerElements = {};
  let playerNames = [];

  let countdownFinished = false;
  let playing = false;
  let waitType;

  let packetid = 0;

  let playerNum = 0;

  const gameContainer = document.querySelector(".game-container");

  let username = "";
  document.getElementById("name-button").onclick = function() {EnterName()};
  document.getElementById("button-host").onclick = function() {startGame()};

  function countdown(timeleft = 10)
  {
    var timer = setInterval(function(){
      if(timeleft <= 0){
        clearInterval(timer);
        document.querySelector(".countdown").innerText = "";
        countdownFinished = true;
      } else {
        var min;
        var sec;
        if(timeleft>10)
        {
          document.querySelector(".countdown").style.fontSize = "32px";
          min = Math.floor(timeleft/60);
          sec = timeleft-min*60;
          if(sec<10){
            document.querySelector(".countdown").innerText = min+":0"+sec;
          }else{
            document.querySelector(".countdown").innerText = min+":"+sec;
          }
        }
        else
        {
          document.querySelector(".countdown").style.fontSize = "42px";
          document.querySelector(".countdown").innerText = timeleft;
        }
      }
      timeleft -= 1;
    }, 1000);
  }

  function waitForCountdown()
  {
    console.log(countdownFinished);
    if(countdownFinished === false) {
      console.log("várok");
      window.setTimeout(waitForCountdown, 100); /* this checks the flag every 100 milliseconds*/
    } else {
      /* do something*/
      switch (waitType) {
        case "game":
          playing = true;
          worldContainer.playing = playing;
          world.set(worldContainer);
          game();
          break;
        case "endgame":
          playing = false;
          worldContainer.playing = playing;
          world.set(worldContainer);
          document.getElementById("button-host").style.display = "";
          document.querySelector(".countdown").style.fontSize = "32px";
          document.querySelector(".countdown").innerText = "Várakozás játékosokra...";
          if(players[playerId].host === true)
          {
            writeNames();
          }
          break;
      }
      countdownFinished = false;
      console.log("done? "+countdownFinished);
    }
  }

  function writeNames()
  {
    var _pntext = "";
    playerNames.forEach((item) => {
      if(item!=undefined){
        _pntext += item+", ";
        console.log(item);
      }
    });
    document.querySelector(".character-name").innerText = _pntext;
  }

  function startGame()
  {
    countdown(5);
    waitType="game";
    waitForCountdown();
  }

  function game()
  {
    if(players[playerId].host === true)
    {
      countdown(60);
      waitType="endgame";
      countdownFinished = false;
      waitForCountdown();
      document.querySelector(".countdown").innerText = "Játék is happening!";
      document.querySelector(".character-name").innerText = "Nézz a készülékedre!";
        document.getElementById("button-host").style.display = "none";
    }
    else {
      document.getElementById("clientui").style.display = "";
      document.querySelector(".character-name").style.display = "none";
      document.getElementById("nongameplay").style.display = "none";
    }
  }

  function SendToBuffer(_world){
    packetid += 1;
    var packet = firebase.database().ref(`buffer/${playerId}_${packetid}`);

    packet.set(_world);
  }

  function ReadBuffer(){

  }

  function addToWorld(data){
    var _CO = worldContainer.CO + data.CO;
    var _Temper = worldContainer.Temperature + data.Temperature;
    var _Happy = worldContainer.Happyness + data.Happyness;
    var _Wealth = worldContainer.Wealthyness + data.Wealthyness;
    var modified_data = {
        CO: _CO,
        Temperature: _Temper,
        Happyness: _Happy,
        Wealthyness: _Wealth
    }
    return modified_data;
  }

  function EnterName()
  {
    if(document.getElementById("nameinput").value === "")
    {
      return;
    }
    username = document.getElementById("nameinput").value;
    firebase.auth().signInAnonymously().catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
      console.log(errorCoded, errorMessage);
    })

    firebase.auth().onAuthStateChanged((user) => {
      console.log(user)
      if(user)
      {
        // wooo van felhasználó

        playerId = user.uid;
        playerRef = firebase.database().ref(`players/${playerId}`);
        world = firebase.database().ref(`world`);

        document.querySelector(".give-name").style.display="none";
        document.querySelector(".character-name").innerText = "Dőlj hátra! Hamarosan kezdődik a játék.";

        playerRef.set({
          id: playerId,
          host: false,
          uname: username,
          profile: "hetzmann-hont",
          money: 1
        })
        // N.America, S. America, Europe, Africa, Asia, Australia
        world.set({
          year: 2022,
          playing: false,
          showinfo: false,
          NAmerica: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          SAmerica: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          Europe: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          Asia: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          Africa: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          },
          Australia: {
            CO: 0,
            Temperature: 0,
            Happyness: 0,
            Wealthyness: 0
          }
        })

        playerRef.onDisconnect().remove();

        initGame();
      }
      else
      {
        // nincs több felhasználó
      }
    })

    console.log(username);
  }

  function initGame(){
    const allPlayersRef = firebase.database().ref(`players`);
    const worldRef = firebase.database().ref(`world`);

    worldRef.on("value", (snapshot) => {
      // világ változás
      worldContainer = snapshot.val() || {};

      // ha játékállapot változás történik kliens számára
      if(playing != worldContainer.playing && !players[playerId].host)
      {
        playing = worldContainer.playing;
        if(playing) {
          game();
        }
        else{
          document.getElementById("clientui").style.display = "none";
          document.getElementById("nongameplay").style.display = "";
          document.querySelector(".character-name").style.display = "";
        }
      }
    })

    allPlayersRef.on("value", (snapshot) => {
      // érték változás
      if(!playing)
      {
        players = snapshot.val() || {};
        playerNum = snapshot.numChildren();
        console.log("There are "+snapshot.numChildren()+" players");
        if(snapshot.numChildren()===1)
        {
          players[playerId].host = true;
          playerRef.set(players[playerId]);
          document.querySelector(".character-name").innerText = "";
          /*var lobby = new Audio('./audio/lobby.mp3');
          lobby.loop = true;
          lobby.play();*/
        }

        if(players[playerId].host === true)
        {
          document.getElementById("button-host").style.display = "";
          document.querySelector(".bg").style.display = "";

          document.querySelector(".countdown").innerText = "Várakozás játékosokra...";
        }
        else {
          document.getElementById("button-host").style.display = "none";
          document.querySelector(".bg").style.display = "none";
        }

        if(players[playerId].host === true)
        {
          const index = playerNames.indexOf(snapshot.val().uname);
          if (index > -1) {
            playerNames.splice(index, 1);
          }

          writeNames();

          const changedPlayer = snapshot.val();
          if(changedPlayer.host != true)
          {
            writeNames();
          }
        }
      }
    })

    allPlayersRef.on("child_added", (snapshot) => {
      // számomra új csomópontok
      if(!playing)
      {
        if(players[playerId].host===true)
        {
          var enter = new Audio('./audio/enter.mp3');
          enter.play();
          const addedPlayer = snapshot.val();
          if(addedPlayer.host != 1)
          {
            playerNames.push(addedPlayer.uname);

            writeNames();
          }
        }
      }
    })

    allPlayersRef.on("child_removed", (snapshot) => {
      // csomópont eltünt :c
      if(!playing)
      {
        if(players[playerId].host===true)
        {
          const index = playerNames.indexOf(snapshot.val().uname);
          if (index > -1) {
            playerNames.splice(index, 1);
          }

          writeNames();
        }
      }
    })

    const allPacketsRef = firebase.database().ref(`buffer`);

    // buffer feltöltődés
    allPacketsRef.on("child_added", (snapshot) => {
        if(host && playing)
        {
            var inPacket = snapshot.val();
            worldContainer.NAmerica = addToWorld(inPacket.NAmerica);
            worldContainer.SAmerica = addToWorld(inPacket.SAmerica);
            worldContainer.Europe = addToWorld(inPacket.Europe);
            worldContainer.Africa = addToWorld(inPacket.Africa);
            worldContainer.Asia = addToWorld(inPacket.Asia);
            worldContainer.Australia = addToWorld(inPacket.Australia);

            worldRef.set(worldContainer);
            inPacket.remove();
        }
    })
  }

})();
