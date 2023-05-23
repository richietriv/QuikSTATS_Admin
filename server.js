const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { Pool } = require("pg");
const cors = require("cors");
const app = express();
const { spawn } = require('child_process');


const httpServer = http.createServer(app);
const server = new socketio.Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "new_table",
  password: "richard",
  port: 5432,
});

const getRows = () => {
  pool.query("SELECT * FROM student ORDER BY id DESC LIMIT 100", (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return;
    }

    // Process the query result
    //console.log("Query result:", result.rows);
    const rows = result.rows;
    // Emit the result to the client socket
    server.emit("message", rows);
  });
};

setInterval(() => getRows(), 2000);

// server.on("connection", (socket) => {
//   const currentDate = new Date();
//   console.log(currentDate);
// });



// handle python scripts ---------------------------------------------------------------- 

let pythonScript; // Reference to the running Python script
let scriptName;
const pythonInterpreter = 'C:\\Users\\richi\\PycharmProjects\\docker_proj2\\venv\\Scripts\\python.exe'
// Function to start the Python script
const startPythonScript = () => {
  pythonScript = spawn(pythonInterpreter, [`C:\\Users\\richi\\PycharmProjects\\docker_proj2\\${scriptName}`]);

  pythonScript.stdout.on('data', (data) => {
    // Handle script output
    console.log(`Script output: ${data}`);
  });

  pythonScript.stderr.on('data', (error) => {
    // Handle script errors
    console.error(`Script error: ${error}`);
  });

  pythonScript.on('close', (code) => {
    // Handle script close event
    console.log(`Script exited with code ${code}`);
  });
};

// Function to stop the Python script
const stopPythonScript = () => {
  if (pythonScript) {
    pythonScript.kill('SIGINT'); // Terminate the script process gracefully
    pythonScript = null; // Reset the reference
    console.log('Script stopped');
  } else {
    console.log('No script running');
  }
};

// Express route to start the script
app.post('/start-script', (req, res) => {
  console.log(req.body.script)
  scriptName = `${req.body.script}.py`
  startPythonScript();
  res.send('Script started');
});

// Express route to stop the script
app.post('/stop-script', (req, res) => {
  stopPythonScript();
  res.send('Script stopped');
});

//Express route to get the script status
app.get('/script-status', (req, res) => {
  const scriptOn = !!pythonScript; // Check if the script is running

  res.json({ scriptOn });
});

// handle python scripts ---------------------------------------------------------------- 



httpServer.listen(9000, () => {
  console.log("Server is listening on port 9000");
});


