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

    const rows = result.rows.reverse();
    server.emit("message", rows);
  });
};

setInterval(getRows, 2000);

const runningScripts = {}; // Object to store the status of running scripts

const pythonInterpreterScripts = ["CAD_Sender_NEW", "ArcGIS_main"];
const condaInterpreterScripts= ["LSBUD0"];

const startPythonScript = (scriptName) => {

  let pythonInterpreter // select the corret interpreter ------
  if (pythonInterpreterScripts.includes(scriptName)) {
    console.log('first')
    pythonInterpreter = 'C:\\Users\\richi\\PycharmProjects\\docker_proj2\\venv\\Scripts\\python.exe';
  } else if (condaInterpreterScripts.includes(scriptName)) {
    console.log('second')
    pythonInterpreter = 'C:\\Users\\richi\\PycharmProjects\\docker_proj2\\venv\\Scripts\\python.exe';
  };
  
  const scriptPath = `C:\\Users\\richi\\PycharmProjects\\docker_proj2\\${scriptName}.py`;

  const pythonScript = spawn(pythonInterpreter, [scriptPath]);

  runningScripts[scriptName] = pythonScript; // Store the script reference by its name

  pythonScript.stdout.on('data', (data) => {
    console.log(`Script output: ${data}`);
  });

  pythonScript.stderr.on('data', (error) => {
    console.error(`Script error: ${error}`);
  });

  pythonScript.on('close', (code) => {
    console.log(`Script exited with code ${code}`);
    delete runningScripts[scriptName]; // Remove the script reference when it is stopped
  });
};

const stopPythonScript = (scriptName) => {
  const pythonScript = runningScripts[scriptName];

  if (pythonScript) {
    pythonScript.kill('SIGINT');
    delete runningScripts[scriptName];
    console.log(`Script '${scriptName}' stopped`);
  } else {
    console.log(`Script '${scriptName}' is not running`);
  }
};

app.post('/start-script', (req, res) => {
  const scriptName = req.body.script;

  if (!runningScripts[scriptName]) {
    startPythonScript(scriptName);
    console.log(`Script '${scriptName}' started`);
    res.send(`Script '${scriptName}' started`);
  } else {
    console.log(`Script '${scriptName}' is already running`);
    res.send(`Script '${scriptName}' is already running`);
  }
});

app.post('/stop-script', (req, res) => {
  const scriptName = req.body.script;

  if (runningScripts[scriptName]) {
    stopPythonScript(scriptName);
    console.log(`Script '${scriptName}' stopped`);
    res.send(`Script '${scriptName}' stopped`);
  } else {
    console.log(`Script '${scriptName}' is not running`);
    res.send(`Script '${scriptName}' is not running`);
  }
});

app.get('/script-status', (req, res) => {
  const scriptStatus = {};

  for (const scriptName in runningScripts) {
    scriptStatus[scriptName] = true; // Set the status to true (running) for each script in runningScripts
  }
  console.log(scriptStatus, 'hello')
  if (!scriptStatus) {
    scriptStatus[scriptName] = false; 
  }

  res.json(scriptStatus);
});

httpServer.listen(9000, () => {
  console.log("Server is listening on port 9000");
});