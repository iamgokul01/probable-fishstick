const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
app.use(express.json());
let db = null;
let dbPath = path.join(__dirname, "/cricketMatchDetails.db");

const initDBServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Server Started");
  });
};
initDBServer();

const convertObj = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};
//FEtch All PLayers
app.get("/players/", async (request, response) => {
  try {
    let fetchQuery = `select * from player_details;`;
    let res = await db.all(fetchQuery);
    response.send(res.map((each) => convertObj(each)));
  } catch (error) {
    console.log(error.message);
  }
});
// Fetch Particular Players
app.get("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let query = `select * from player_details where player_id = ${playerId};`;
  let res = await db.get(query);
  response.send(convertObj(res));
});
// Update Player Name
app.put("/players/:playerId/", async (request, response) => {
  try {
    let { playerId } = request.params;
    let { playerName } = request.body;
    console.log(playerName);
    let query = `
  update player_details set player_name = '${playerName}'
  where player_id = ${playerId};`;
    let res = await db.run(query);
    response.send("Player Details Updated");
  } catch (error) {
    console.log(error.message);
  }
});

// Fetched Particular Match
const convertMatchObj = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};
app.get("/matches/:matchId", async (request, response) => {
  let { matchId } = request.params;
  let query = `select * from match_details where match_id = ${matchId};`;
  let res = await db.get(query);
  response.send(convertMatchObj(res));
});

// Fetch All the match of particular player
app.get("/players/:playerId/matches", async (request, response) => {
  let { playerId } = request.params;

  let query = `
    select match_details.match_id as matchId,match,year from match_details join
     player_match_score on match_details.match_id = player_match_score.match_id 
     where player_id = ${playerId} group by match_details.match_id;
    `;
  let res = await db.all(query);
  response.send(res);
});

// Fetch All the player of particular match
app.get("/matches/:matchId/players", async (request, response) => {
  let { matchId } = request.params;
  console.log(matchId);
  let query = `
  select player_details.player_id as playerId,player_details.player_name as playerName
   from player_details natural join player_match_score 
  where player_match_score.match_id =${matchId};  
  `;
  let res = await db.all(query);
  response.send(res);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  try {
    let { playerId } = request.params;
    let query = `
 SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId}; 
  `;
    let res = await db.all(query);
    response.send(res);
  } catch (error) {
    console.log(error.message);
  }
});
module.exports = app;
