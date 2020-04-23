import path from "path";
import express, { Express, json } from "express";
import WebSocket from "ws";

type Player = {
    score: number;
    stillPlaying: boolean;
}

type GameState = {
    players: {
        [key: string]: Player
    };
}

const app: Express = express();
app.use("/", express.static(path.join(__dirname, "../../client/dist")));
app.listen(8001, () => {
    console.log("BattleJong Express server ready.");
});

const wsServer = new WebSocket.Server({ port: 8080 }, function() {
    console.log("BattleJong WebSocket server ready");
});

wsServer.on("connection", (socket: WebSocket) => {
    let game: GameState = {players:{}};

    socket.on("message", (inMsg: string) => {
        const msgParts: string[] = inMsg.toString().split("_");
        const message: string = msgParts[0];
        const pid: string = msgParts[1];
        switch(message) {
            case "match":
                game.players[pid].score += parseInt(msgParts[2]);
                wsServer.clients.forEach(c => c.send(`update_${pid}_${game.players[pid].score}`));
            break;

            case "done": 
            game.players[pid].stillPlaying = false;
                let playersDone: number = 0;
                for(const player in game.players){
                    if(game.players.hasOwnProperty(player)){
                        if(!game.players[player].stillPlaying){
                            playersDone++;
                        }
                    }
                }

                if(playersDone === 2){
                    let winningPID: string;
                    const pids: string[] = Object.keys(game.players);
                    if(game.players[pids[0]].score > game.players[pids[1]].score) {
                        winningPID = pids[0];
                    }
                    else {
                        winningPID = pids[1];
                    }

                    wsServer.clients.forEach(c => c.send(`gameOver_${winningPID}`));
                }

            break;
        }
    });

    const pid: string = `pid${new Date().getTime()}`;
    game.players[pid] = {score: 0, stillPlaying: true};
    socket.send(`connected_${pid}`);

    if(Object.keys(game.players).length === 2) {
        const shuffledLayout: number[][][] = shuffle();
        wsServer.clients.forEach(c => c.send(`start_${JSON.stringify(shuffledLayout)}`));
    }
});

// ---------------------------------------- Game code. ----------------------------------------

// 0 = no tile, 1 = tile.
// Each layer is 15x9 (135 per layer, 675 total).  Tiles are 36x44.
// When board is shuffled, all 1's become 101-142 (matching the 42 tile type filenames).
// Tile 101 is wildcard.
const layout: number[][][] = [
    /* Layer 1. */
    [
      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
      [ 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
      [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
      [ 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 ],
      [ 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0 ],
      [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0 ],
    ],
    /* Layer 2. */
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    /* Layer 3. */
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    /* Layer 4. */
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    /* Layer 5. */
    [
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ]
  ]; /* End layout. */
  
  
  /**
   * Shuffles the tiles in the layout, randomizing tile placement.  Note that this uses the "American-style
   * totally random approach, which means that not every shuffle will be "winnable" (meaning that there may be no
   * path to completely clear the board).
   *
   * @return A shuffled layout.
   */
  function shuffle(): number[][][] {
  
    // Clone the layout.
    const cl: number[][][] = layout.slice(0);
  
    // We need to ensure no more than 4 wildcards are placed, so this will count them.
    let numWildcards: number = 0;
  
    // Iterate over the entire board, randomly choosing a tile for each position that isn't supposed to be blank.
    const numTileTypes: number = 42;
    for (let l: number = 0; l < cl.length; l++) {
      const layer: number[][] = cl[l];
      for (let r: number = 0; r < layer.length; r++) {
        const row: number[] = layer[r];
        for (let c: number = 0; c < row.length; c++) {
          const tileVal: number = row[c];
          // tileVal > 0 indicates there is supposed to be a tile at this position.
          if (tileVal === 1) {
            row[c] = (Math.floor(Math.random() * numTileTypes)) + 101;
            // If this is a wildcard and no more are allowed then bump to the next tile type, otherwise bump
            // wildcard count.  Doing this is a cheap way of having to randomly select a tile again, which at this
            // point could actually be a little tricky if we want to avoid duplicate code.
            if (row[c] === 101 && numWildcards === 3) {
              row[c] = 102;
            } else {
              numWildcards += numWildcards;
            }
          } /* End tileVal > 0 check. */
        } /* End column iteration. */
      } /* End row iteration. */
    } /* End layer iteration. */
  
    return cl;
  
  } /* End shuffle(). */