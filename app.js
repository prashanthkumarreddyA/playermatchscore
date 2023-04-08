const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerNamePascalCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//1 Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await db.all(getAllPlayersQuery);
  response.send(
    playersArray.map((playerobject) =>
      convertPlayerNamePascalCase(playerobject)
    )
  );
});

//2   Returns a state based on the state ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const state = await db.get(getPlayerQuery);
  //console.log(movie);
  response.send(convertPlayerNamePascalCase(state));
});

//3  Updates the details of a specific district based on the district ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name= '${playerName}'
    WHERE
      player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

const convertMatchNamePascalCase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//4   Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchQuery);
  //console.log(movie);
  response.send(convertMatchNamePascalCase(matchDetails));
});

//5   Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT
      match_details.match_id,match,year
    FROM
      player_match_score INNER JOIN match_details ON player_match_score.match_id=match_details.match_id
    WHERE
      player_match_score.player_id = ${playerId};`;
  const playerMatchDetails = await db.all(getPlayerMatchQuery);
  //console.log(movie);
  response.send(
    playerMatchDetails.map((playerDetails) =>
      convertMatchNamePascalCase(playerDetails)
    )
  );
});

//6   Returns a list of all the matches of a player
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `
    SELECT
      player_details.player_id AS playerId ,player_name AS playerName
    FROM
      player_match_score INNER JOIN player_details ON player_match_score.player_id=player_details.player_id
    WHERE
      player_match_score.match_id = ${matchId};`;
  const playerMatchDetails = await db.all(getPlayerMatchQuery);
  //console.log(movie)0;
  response.send(playerMatchDetails);
});

//7   Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT
      player_details.player_id as playerId,player_details.player_name AS playerName,SUM(player_match_score.score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes
    FROM
      player_details  INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id
    WHERE
      player_details.player_id = ${playerId}
    Group by 
    player_details.player_id;`;
  const playerMatchDetails = await db.all(getPlayerMatchQuery);
  console.log(playerId);
  response.send(playerMatchDetails);
});

module.exports = app;
