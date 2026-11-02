const fs = require("fs");
const fsPromises = require("fs").promises;

/**
 * Event Loop Analysis and Async Debugging
 * Learn Node.js event loop phases and fix broken async code
 */

/**
 * Analyze execution order of event loop phases
 * @returns {object} Analysis of execution order
 */
function analyzeEventLoop() {
  return {
    phases: [
      "timers: runs eligible setTimeout and setInterval callbacks",
      "pending callbacks: runs certain deferred system callbacks",
      "idle, prepare: internal Node.js work",
      "poll: receives and processes I/O events, such as completed file reads",
      "check: runs setImmediate callbacks",
      "close callbacks: handles close events, such as a closed socket",
    ],
    executionOrder: [
      "Synchronous code runs first, in the order it appears.",
      "process.nextTick callbacks run after the current synchronous work.",
      "Promise callbacks run as microtasks after nextTick callbacks.",
      "I/O callbacks run when their operations are ready.",
      "Timers and setImmediate callbacks run in their event loop phases; their relative order at the top level is not always guaranteed.",
    ],
    explanations: [
      "The event loop lets Node.js handle asynchronous work without blocking the whole program while it waits for I/O.",
      "Microtasks, including process.nextTick and Promise callbacks, are processed before Node.js continues to another event loop phase.",
      "Timers such as setTimeout are macrotask callbacks; a delay of zero means eligible soon, not immediately.",
      "The exact order of a timer and setImmediate scheduled at the top level can vary, so it should not be treated as a guaranteed order.",
    ],
  };
}

/**
 * Predict execution order for code snippets
 * @param {string} snippet - Code snippet identifier
 * @returns {array} Predicted execution order
 */
function predictExecutionOrder(snippet) {
  const predictions = {
    snippet1: [
      "Start and End run first because they are synchronous.",
      "Next Tick 1, then Next Tick 2 run after synchronous code.",
      "Promise 1, then Promise 2 run after the nextTick callbacks.",
      "Timer 1 and Timer 2 run in the timers phase.",
      "Immediate 1 and Immediate 2 run in the check phase.",
      "The relative order between the timer callbacks and setImmediate callbacks can vary at the top level.",
    ],
    snippet2: [
      "=== Start === and === End === run first because they are synchronous.",
      "NextTick runs after synchronous code, followed by Nested NextTick.",
      "Timer, Immediate, and the fs.readFile callback run later when their work is ready; their overall order can vary.",
      "NextTick in Timer runs immediately after the Timer callback.",
      "NextTick in Immediate runs immediately after the Immediate callback.",
      "NextTick in readFile runs immediately after the fs.readFile callback.",
      "Inside the fs.readFile callback, Immediate in readFile normally runs before Timer in readFile because setImmediate is scheduled from an I/O callback.",
    ],
  };

  return predictions[snippet] || [];
}

/**
 * Fix race condition in file processing
 * @returns {Promise} Promise that resolves when files are processed
 */
async function fixRaceCondition() {
  // TODO: Fix the race condition in file processing
  // Issues to fix:
  // 1. Race condition in file processing
  // 2. Incorrect error handling
  // 3. Missing await keywords
  // 4. Array index might be wrong due to closure

  const files = ["file1.txt", "file2.txt", "file3.txt"];

  try {
    return await Promise.all(
      files.map(async (file) => {
        const content = await fsPromises.readFile(file, "utf8");
        return content.toUpperCase();
      })
    );
  } catch (error) {
    throw new Error(`Failed to process files: ${error.message}`);
  }
}

/**
 * Convert callback hell to async/await
 * @param {number} userId - User ID to process
 * @returns {Promise} Promise that resolves with processed user data
 */
async function fixCallbackHell(userId) {
  try {
    const userData = await fsPromises.readFile(`user-${userId}.json`, "utf8");
    const user = JSON.parse(userData);

    const preferencesData = await fsPromises.readFile(
      `preferences-${user.id}.json`,
      "utf8"
    );
    const preferences = JSON.parse(preferencesData);

    const activityData = await fsPromises.readFile(
      `activity-${user.id}.json`,
      "utf8"
    );
    const activity = JSON.parse(activityData);

    const combinedData = {
      user,
      preferences,
      activity,
      processedAt: new Date(),
    };

    await fsPromises.writeFile(
      `processed-${userId}.json`,
      JSON.stringify(combinedData, null, 2),
      "utf8"
    );

    return combinedData;
  } catch (error) {
    throw new Error(`Failed to process user data: ${error.message}`);
  }
}

/**
 * Fix mixed promises and callbacks
 * @returns {Promise} Promise that resolves when processing is complete
 */
async function fixMixedAsync() {
  try {
    console.log("Starting data processing...");

    const data = await fsPromises.readFile("input.txt", "utf8");
    const processedData = data.toUpperCase();

    await fsPromises.writeFile("output.txt", processedData, "utf8");

    const result = await fsPromises.readFile("output.txt", "utf8");
    console.log("Data processing completed.");
    console.log(`Processing result: ${result}`);

    return result;
  } catch (error) {
    throw new Error(`Failed to process data: ${error.message}`);
  }
}

/**
 * Demonstrate all event loop phases
 * @returns {Promise} Promise that resolves when demonstration is complete
 */
async function demonstrateEventLoop() {
  console.log("Event loop phases (overview):");
  analyzeEventLoop().phases.forEach((phase) =>
    logWithPhase(phase, "phase overview")
  );

  logWithPhase("Synchronous code runs first", "synchronous");

  process.nextTick(() =>
    logWithPhase("process.nextTick callback", "microtask")
  );
  Promise.resolve().then(() =>
    logWithPhase("Promise callback", "microtask")
  );

  const timerDone = new Promise((resolve) => {
    setTimeout(() => {
      logWithPhase("setTimeout callback", "timers");
      resolve();
    }, 0);
  });

  const intervalDone = new Promise((resolve) => {
    const interval = setInterval(() => {
      clearInterval(interval);
      logWithPhase("setInterval callback (runs once)", "timers");
      resolve();
    }, 0);
  });

  const immediateDone = new Promise((resolve) => {
    setImmediate(() => {
      logWithPhase("setImmediate callback", "check");
      resolve();
    });
  });

  const ioScheduledTasks = [];
  const ioDone = new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(__filename);
    let dataLogged = false;

    fileStream.on("data", () => {
      if (!dataLogged) {
        dataLogged = true;
        logWithPhase("File data became available", "poll / I/O");

        ioScheduledTasks.push(
          new Promise((resolveImmediate) => {
            setImmediate(() => {
              logWithPhase("setImmediate scheduled during I/O", "check");
              resolveImmediate();
            });
          }),
          new Promise((resolveTimer) => {
            setTimeout(() => {
              logWithPhase("setTimeout scheduled during I/O", "timers");
              resolveTimer();
            }, 0);
          })
        );
      }
    });

    fileStream.once("error", reject);
    fileStream.once("close", async () => {
      try {
        await Promise.all(ioScheduledTasks);
        logWithPhase("File stream closed", "close callbacks");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  await Promise.all([timerDone, intervalDone, immediateDone, ioDone]);
  logWithPhase("Demonstration complete", "finished");
}

/**
 * Create test files for debugging exercises
 */
async function createTestFiles() {
  // TODO: Create test files for the exercises
  // 1. Create sample user data files
  // 2. Create input files for processing
  // 3. Handle file creation errors gracefully

  const testData = {
    "user-123.json": {
      id: 123,
      name: "John Doe",
      email: "john@example.com",
    },
    "preferences-123.json": {
      theme: "dark",
      language: "en",
      notifications: true,
    },
    "activity-123.json": {
      lastLogin: "2025-01-01",
      sessionsCount: 42,
      totalTime: 3600,
    },
    "input.txt": "Hello World! This is test data for processing.",
    "file1.txt": "Content of file 1",
    "file2.txt": "Content of file 2",
    "file3.txt": "Content of file 3",
  };

  try {
    await Promise.all(
      Object.entries(testData).map(([filename, content]) =>
        fsPromises.writeFile(
          filename,
          typeof content === "string" ? content : JSON.stringify(content, null, 2),
          "utf8"
        )
      )
    );
  } catch (error) {
    throw new Error(`Failed to create test files: ${error.message}`);
  }
}

/**
 * Helper function to log with timestamps
 * @param {string} message - Message to log
 * @param {string} phase - Event loop phase
 */
function logWithPhase(message, phase = "unknown") {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${phase}] ${message}`);
}

// Export functions and data
module.exports = {
  analyzeEventLoop,
  predictExecutionOrder,
  fixRaceCondition,
  fixCallbackHell,
  fixMixedAsync,
  demonstrateEventLoop,
  createTestFiles,
  logWithPhase,
};

// Example usage (for testing):
const isReadyToTest = false;

if (isReadyToTest) {
  async function runExamples() {
    console.log("🔄 Starting Event Loop Analysis Examples...\n");

    // Create test files
    await createTestFiles();

    // Demonstrate event loop
    console.log("=== Event Loop Demonstration ===");
    await demonstrateEventLoop();

    // Analyze execution order
    console.log("\n=== Execution Order Analysis ===");
    const analysis = analyzeEventLoop();
    console.log("Analysis:", analysis);

    // Fix broken code
    console.log("\n=== Fixing Broken Code ===");
    try {
      await fixRaceCondition();
      console.log("✅ Race condition fixed");

      await fixCallbackHell(123);
      console.log("✅ Callback hell converted");

      await fixMixedAsync();
      console.log("✅ Mixed async resolved");
    } catch (error) {
      console.error("❌ Error fixing code:", error.message);
    }
  }

  runExamples();
}
