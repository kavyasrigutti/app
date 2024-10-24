const express = require('express')
const path = require('path')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
app.use(express.json())
let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running...')
    })
  } catch (e) {
    console.log(`DB ERROR:${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

app.get('/players/', async (request, response) => {
  const getQuery = `SELECT * from player_details;`
  const getQueryResponse = await db.all(getQuery)
  response.send(
    getQueryResponse.map(each => ({
      playerId: each.player_id,
      playerName: each.player_name,
    })),
  )
})

app.get('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const getQuery = `SELECT * FROM player_details where player_id=${playerId};`
  const getQueryResponse = await db.get(getQuery)
  response.send({
    playerId: getQueryResponse.player_id,
    playerName: getQueryResponse.player_name,
  })
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const bodyDetails = request.body
  const {playerName} = bodyDetails
  const updateQuery = `UPDATE player_details SET player_name = '${playerName}' where player_id = ${playerId};`
  await db.run(updateQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`
  const getQueryResponse = await db.get(getQuery)
  response.send({
    matchId: getQueryResponse.match_id,
    match: getQueryResponse.match,
    year: getQueryResponse.year,
  })
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getQuery = `SELECT match_details.match_id AS matchId,match_details.match AS match, match_details.year AS year FROM player_match_score NATURAL JOIN match_details where player_id = ${playerId};`
  const getQueryResponse = await db.all(getQuery)
  response.send(getQueryResponse)
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getQuery = `SELECT 
      player_details.player_id AS playerId, 
      player_details.player_name AS playerName 
    FROM 
      player_match_score 
    INNER JOIN 
      player_details ON player_match_score.player_id = player_details.player_id 
    WHERE 
      match_id = ${matchId};`
  const getQueryResponse = await db.all(getQuery)
  response.send(getQueryResponse)
  console.log(getQuery)
})

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const getQueryResponse = await db.all(getPlayerScored)
  response.send(getQueryResponse)
})

module.exports = app
