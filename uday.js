// token.js
import { AccessToken } from 'livekit-server-sdk';

export function createToken({ apiKey, secret, roomName, participantName }) {
  const at = new AccessToken(apiKey, secret, {
    identity: participantName,
  });
  at.addGrant({ room: roomName, roomJoin: true });
  return at.toJwt();
}
// ai-agent.js
import { Room, ParticipantEvent, DataPacket_Kind } from 'livekit-client';
import { createToken } from './token.js';

var LIVEKIT_URL = 'wss://your-livekit-server.com'; // Use ws://localhost:7880 for dev
var API_KEY = 'your_api_key';
var API_SECRET = 'your_api_secret';

var roomName = 'test-room';
var participantName = 'AI-Agent';

async function runAgent() {
  const token = createToken({ apiKey: API_KEY, secret: API_SECRET, roomName, participantName });

  const room = new Room();

  room.on(ParticipantEvent.TrackSubscribed, (track, pub, participant) => {
    console.log(`Track subscribed from ${participant.identity}`);
  });

  await room.connect(LIVEKIT_URL, token);
  console.log(`[AI Agent] Joined room: ${room.name}`);

  // Wait for a few seconds, then send a simulated response
  setTimeout(() => {
    room.localParticipant.publishData(
      Buffer.from('Hello from AI agent'),
      DataPacket_Kind.KIND_RELIABLE
    );
    console.log(`[AI Agent] Sent message`);
  }, 2000);
}

runAgent().catch(console.error);

// salon-profile.js
export const salonProfile = {
    name: 'Glow & Go Hair Studio',
    location: '123 Main Street, Los Angeles, CA',
    services: ['Haircuts', 'Coloring', 'Styling', 'Keratin Treatments'],
    hours: 'Mon–Sat: 9AM–7PM, Sun: Closed',
    contact: 'Call us at (555) 123-4567',
  };
// ai-agent.js
import { Room, DataPacket_Kind, ParticipantEvent, RoomEvent } from 'livekit-client';
import { createToken } from './token.js';
import { salonProfile } from './salon-profile.js';

const LIVEKIT_URL = 'wss://your-livekit-server.com'; // Or ws://localhost:7880
const API_KEY = 'your_api_key';
const API_SECRET = 'your_api_secret';

const roomName = 'test-room';
const participantName = 'AI-Agent';

function generateResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes('services')) {
    return `We offer: ${salonProfile.services.join(', ')}.`;
  } else if (msg.includes('location')) {
    return `We're located at ${salonProfile.location}.`;
  } else if (msg.includes('hours')) {
    return `Our hours are ${salonProfile.hours}.`;
  } else if (msg.includes('contact')) {
    return salonProfile.contact;
  } else {
    return `Hi! I'm the Glow & Go assistant. Ask me about our services, hours, or location.`;
  }
}

async function runAgent() {
  const token = createToken({ apiKey: API_KEY, secret: API_SECRET, roomName, participantName });
  const room = new Room();

  room.on(RoomEvent.DataReceived, (payload, participant) => {
    const message = Buffer.from(payload).toString();
    console.log(`[Prompt] From ${participant.identity}: ${message}`);

    const response = generateResponse(message);
    room.localParticipant.publishData(
      Buffer.from(response),
      DataPacket_Kind.KIND_RELIABLE
    );
    console.log(`[AI Response] Sent: ${response}`);
  });

  await room.connect(LIVEKIT_URL, token);
  console.log(`[AI Agent] Connected to room: ${room.name}`);
}

runAgent().catch(console.error);
room.localParticipant.publishData(
    Buffer.from('What services do you offer?'),
    DataPacket_Kind.KIND_RELIABLE
  );
 
  // ai-agent.js
import { Room, DataPacket_Kind, RoomEvent } from 'livekit-client';
import { createToken } from './token.js';

const LIVEKIT_URL = 'ws://localhost:7880'; // or your server URL
const API_KEY = 'your_api_key';
const API_SECRET = 'your_api_secret';

const roomName = 'test-room';
const participantName = 'AI-Agent';

const knowledge = {
  services: 'We offer haircuts, coloring, and styling.',
  hours: 'We are open Mon–Sat, 9AM–7PM.',
  location: 'We are located at 123 Main Street, Los Angeles.',
};

function getResponse(prompt) {
  const lc = prompt.toLowerCase();
  if (lc.includes('services')) return knowledge.services;
  if (lc.includes('hours')) return knowledge.hours;
  if (lc.includes('location')) return knowledge.location;
  return null; // unknown
}

async function runAgent() {
  const token = createToken({ apiKey: API_KEY, secret: API_SECRET, roomName, participantName });
  const room = new Room();

  room.on(RoomEvent.DataReceived, (payload, participant) => {
    const message = Buffer.from(payload).toString();
    console.log(`[Incoming Prompt from ${participant.identity}]: ${message}`);

    const response = getResponse(message);

    if (response) {
      room.localParticipant.publishData(Buffer.from(response), DataPacket_Kind.KIND_RELIABLE);
      console.log(`[AI Response]: ${response}`);
    } else {
      const helpSignal = JSON.stringify({ type: 'request_help', reason: 'unknown_prompt', prompt: message });
      room.localParticipant.publishData(Buffer.from(helpSignal), DataPacket_Kind.KIND_RELIABLE);
      console.log(`[AI Agent]: Triggered help event`);
    }
  });

  await room.connect(LIVEKIT_URL, token);
  console.log(`[AI Agent]: Connected to room "${roomName}"`);
}

runAgent().catch(console.error);

// Table: HelpRequests
{
  RequestId; "uuid-1234",
  CallerId; "caller-001",
  Status; "PENDING",
  CreatedAt; "2025-05-05T12:34:56Z",
  Message; "Caller needs help. Please advise."
}
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// Configure DynamoDB
var dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1", // or your preferred region
});

// Simulate incoming caller request
function handleCallerRequest(callerId) {
  console.log("Caller says: 'Let me check with my supervisor and get back to you.'");

  const requestId = uuidv4();
  const helpRequest = {
    RequestId: requestId,
    CallerId: callerId,
    Status: "PENDING",
    CreatedAt: new Date().toISOString(),
    Message: "Caller needs help. Please advise.",
  };

  // Store the pending request in DynamoDB
  const params = {
    TableName: "HelpRequests",
    Item: helpRequest,
  };

  dynamoDb.put(params, (err, data) => {
    if (err) {
      console.error("Error saving help request:", err);
    } else {
      console.log("Help request saved successfully.");
      simulateTextToSupervisor(helpRequest);
    }
  });
}

// Simulate texting the supervisor
function simulateTextToSupervisor(request) {
  // For real use, this could be a webhook or SMS API
  console.log(`[SMS to Supervisor] Help needed from Caller ${request.CallerId}. Request ID: ${request.RequestId}`);
}

// Example usage
handleCallerRequest("caller-001");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// Configure DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

/**
 * Handles a caller's help request.
 * @param {string} callerId - Unique identifier for the caller
 * @param {string} question - The question the caller needs help with
 */
function handleCallerRequest(callerId, question) {
  console.log("Caller: Let me check with my supervisor and get back to you.");

  const requestId = uuidv4();
  const helpRequest = {
    RequestId: requestId,
    CallerId: callerId,
    Status: "PENDING",
    CreatedAt: new Date().toISOString(),
    Question: question,
  };

  const params = {
    TableName: "HelpRequests",
    Item: helpRequest,
  };

  dynamoDb.put(params, (err) => {
    if (err) {
      console.error("❌ Failed to save help request:", err);
    } else {
      console.log("✅ Help request saved.");
      simulateTextToSupervisor(helpRequest);
    }
  });
}

/**
 * Simulates sending a message to a supervisor.
 * @param {Object} request - The help request object
 */
function simulateTextToSupervisor(request) {
  console.log(`[SMS to Supervisor] Hey, I need help answering: "${request.Question}" (Caller ID: ${request.CallerId}, Request ID: ${request.RequestId})`);
}

// Example usage:
handleCallerRequest("caller-001", "How do I reset the account password?");
// Simple JavaScript UI using HTML + Vanilla JS (no frameworks)
// This is a minimal UI you can run in a browser

var requests = [
  { id: 1, question: "What is the capital of France?", answer: "", resolved: false },
  { id: 2, question: "What is 5 + 7?", answer: "", resolved: false },
];

function renderUI() {
  const pendingList = document.getElementById("pending-requests");
  const historyList = document.getElementById("history");

  pendingList.innerHTML = "";
  historyList.innerHTML = "";

  requests.forEach((req) => {
    if (!req.resolved) {
      const div = document.createElement("div");
      div.innerHTML = `
        <p><strong>Q:</strong> ${req.question}</p>
        <input type="text" id="answer-${req.id}" placeholder="Type your answer" />
        <button onclick="submitAnswer(${req.id})">Submit</button>
      `;
      pendingList.appendChild(div);
    }

    const historyDiv = document.createElement("div");
    historyDiv.innerHTML = `
      <p><strong>Q:</strong> ${req.question}</p>
      <p><strong>A:</strong> ${req.answer || "[No answer yet]"}</p>
      <p>Status: ${req.resolved ? "✅ Resolved" : "⏳ Unresolved"}</p>
      <hr />
    `;
    historyList.appendChild(historyDiv);
  });
}

function submitAnswer(id) {
  const answerInput = document.getElementById(`answer-${id}`);
  const req = requests.find((r) => r.id === id);
  if (req && answerInput.value.trim()) {
    req.answer = answerInput.value.trim();
    req.resolved = true;
    renderUI();
  } else {
    alert("Please enter an answer.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
    <h1>Request Manager</h1>
    <h2>Pending Requests</h2>
    <div id="pending-requests"></div>

    <h2>History</h2>
    <div id="history"></div>
  `;
  renderUI();
});
const requests = [
  { id: 1, question: "What is the capital of France?", answer: "", resolved: false },
  { id: 2, question: "What is 5 + 7?", answer: "", resolved: false },
];

var knowledgeBase = {}; // simple key-value store

function renderUI() {
  const pendingList = document.getElementById("pending-requests");
  const historyList = document.getElementById("history");

  pendingList.innerHTML = "";
  historyList.innerHTML = "";

  requests.forEach((req) => {
    if (!req.resolved) {
      const div = document.createElement("div");
      div.innerHTML = `
        <p><strong>Q:</strong> ${req.question}</p>
        <input type="text" id="answer-${req.id}" placeholder="Type your answer" />
        <button onclick="submitAnswer(${req.id})">Submit</button>
      `;
      pendingList.appendChild(div);
    }

    const historyDiv = document.createElement("div");
    historyDiv.innerHTML = `
      <p><strong>Q:</strong> ${req.question}</p>
      <p><strong>A:</strong> ${req.answer || "[No answer yet]"}</p>
      <p>Status: ${req.resolved ? "✅ Resolved" : "⏳ Unresolved"}</p>
      <hr />
    `;
    historyList.appendChild(historyDiv);
  });
}

function submitAnswer(id) {
  const answerInput = document.getElementById(`answer-${id}`);
  const req = requests.find((r) => r.id === id);
  const answer = answerInput.value.trim();

  if (req && answer) {
    req.answer = answer;
    req.resolved = true;

    // Simulate AI auto-response via webhook/console log
    console.log(`[Webhook] Replying to caller: "${answer}"`);

    // Update internal knowledge base
    knowledgeBase[req.question] = answer;
    console.log("[KnowledgeBase Updated]:", knowledgeBase);

    renderUI();
  } else {
    alert("Please enter an answer.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
    <h1>Request Manager</h1>
    <h2>Pending Requests</h2>
    <div id="pending-requests"></div>

    <h2>History</h2>
    <div id="history"></div>
  `;
  renderUI();
});
const requests = [
  { id: 1, question: "What is the capital of France?", answer: "", resolved: false },
  { id: 2, question: "What is 5 + 7?", answer: "", resolved: false },
];

const knowledgeBase = {}; // simple key-value store

function renderUI() {
  const pendingList = document.getElementById("pending-requests");
  const historyList = document.getElementById("history");
  const learnedList = document.getElementById("learned-answers");

  pendingList.innerHTML = "";
  historyList.innerHTML = "";
  learnedList.innerHTML = "";

  requests.forEach((req) => {
    if (!req.resolved) {
      const div = document.createElement("div");
      div.innerHTML = `
        <p><strong>Q:</strong> ${req.question}</p>
        <input type="text" id="answer-${req.id}" placeholder="Type your answer" />
        <button onclick="submitAnswer(${req.id})">Submit</button>
      `;
      pendingList.appendChild(div);
    }

    const historyDiv = document.createElement("div");
    historyDiv.innerHTML = `
      <p><strong>Q:</strong> ${req.question}</p>
      <p><strong>A:</strong> ${req.answer || "[No answer yet]"}</p>
      <p>Status: ${req.resolved ? "✅ Resolved" : "⏳ Unresolved"}</p>
      <hr />
    `;
    historyList.appendChild(historyDiv);
  });

  for (const [question, answer] of Object.entries(knowledgeBase)) {
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>Q:</strong> ${question}</p>
      <p><strong>A:</strong> ${answer}</p>
      <hr />
    `;
    learnedList.appendChild(div);
  }
}

function submitAnswer(id) {
  const answerInput = document.getElementById(`answer-${id}`);
  const req = requests.find((r) => r.id === id);
  const answer = answerInput.value.trim();

  if (req && answer) {
    req.answer = answer;
    req.resolved = true;

    // Simulate AI auto-response via webhook/console log
    console.log(`[Webhook] Replying to caller: "${answer}"`);

    // Update internal knowledge base
    knowledgeBase[req.question] = answer;
    console.log("[KnowledgeBase Updated]:", knowledgeBase);

    renderUI();
  } else {
    alert("Please enter an answer.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
    <h1>Request Manager</h1>
    <h2>Pending Requests</h2>
    <div id="pending-requests"></div>

    <h2>History</h2>
    <div id="history"></div>

    <h2>Learned Answers</h2>
    <div id="learned-answers"></div>
  `;
  renderUI();
});
// Request lifecycle: Pending → Resolved / Unresolved (on timeout)
const requests = [
  { id: 1, customer: "Alice", question: "What is the capital of France?", answer: "", resolved: false, timeout: null },
  { id: 2, customer: "Bob", question: "What is 5 + 7?", answer: "", resolved: false, timeout: null },
];

const knowledgeBase = {}; // simple key-value store

function renderUI() {
  const pendingList = document.getElementById("pending-requests");
  const historyList = document.getElementById("history");
  const learnedList = document.getElementById("learned-answers");

  pendingList.innerHTML = "";
  historyList.innerHTML = "";
  learnedList.innerHTML = "";

  requests.forEach((req) => {
    if (!req.resolved && req.answer === "") {
      const div = document.createElement("div");
      div.innerHTML = `
        <p><strong>Customer:</strong> ${req.customer}</p>
        <p><strong>Q:</strong> ${req.question}</p>
        <input type="text" id="answer-${req.id}" placeholder="Type your answer" />
        <button onclick="submitAnswer(${req.id})">Submit</button>
        <button onclick="markUnresolved(${req.id})">Mark Unresolved</button>
      `;
      pendingList.appendChild(div);
    }

    const historyDiv = document.createElement("div");
    historyDiv.innerHTML = `
      <p><strong>Customer:</strong> ${req.customer}</p>
      <p><strong>Q:</strong> ${req.question}</p>
      <p><strong>A:</strong> ${req.answer || "[No answer yet]"}</p>
      <p>Status: ${req.resolved ? "✅ Resolved" : "❌ Unresolved"}</p>
      <hr />
    `;
    historyList.appendChild(historyDiv);
  });

  for (const [question, answer] of Object.entries(knowledgeBase)) {
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>Q:</strong> ${question}</p>
      <p><strong>A:</strong> ${answer}</p>
      <hr />
    `;
    learnedList.appendChild(div);
  }
}

function submitAnswer(id) {
  const answerInput = document.getElementById(`answer-${id}`);
  const req = requests.find((r) => r.id === id);
  const answer = answerInput.value.trim();

  if (req && answer) {
    req.answer = answer;
    req.resolved = true;

    // Simulate AI auto-response via webhook/console log
    console.log(`[Webhook] Replying to ${req.customer}: "${answer}"`);

    // Update internal knowledge base
    knowledgeBase[req.question] = answer;
    console.log("[KnowledgeBase Updated]:", knowledgeBase);

    // Simulate supervisor follow-up
    console.log(`[AI Follow-up] Supervisor answered request from ${req.customer}. Follow-up sent.`);

    renderUI();
  } else {
    alert("Please enter an answer.");
  }
}

function markUnresolved(id) {
  const req = requests.find((r) => r.id === id);
  if (req) {
    req.resolved = false;
    req.answer = "[Unresolved - Timeout]";
    console.log(`[Lifecycle] Request from ${req.customer} marked unresolved due to timeout.`);
    renderUI();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
    <h1>Request Manager</h1>
    <h2>Pending Requests</h2>
    <div id="pending-requests"></div>

    <h2>History</h2>
    <div id="history"></div>

    <h2>Learned Answers</h2>
    <div id="learned-answers"></div>
  `;
  renderUI();
});
// In-memory database (mocked for simplicity)
var helpRequests = [];
const knowledgeBase = new Map(); // key: normalized question, value: answer
var requestIdCounter = 1;

// Create a help request
function createHelpRequest(customer, question) {
  const request = {
    id: requestIdCounter++,
    customer,
    question,
    status: 'pending',
    createdAt: Date.now(),
    resolvedAt: null,
    answer: '',
    source: null,
  };

  helpRequests.push(request);
  console.log(`[HelpRequest] New request created from ${customer}: "${question}"`);

  // Set timeout for supervisor response
  setTimeout(() => handleTimeout(request.id), 60000); // 1 minute
  return request;
}

function normalizeQuestion(q) {
  return q.trim().toLowerCase();
}

// Submit an answer (from supervisor or AI)
function resolveHelpRequest(id, answer, source = 'supervisor') {
  const request = helpRequests.find(r => r.id === id);
  if (!request || request.status !== 'pending') return;

  request.answer = answer;
  request.status = 'resolved';
  request.resolvedAt = Date.now();
  request.source = source;

  const norm = normalizeQuestion(request.question);
  knowledgeBase.set(norm, answer);

  console.log(`[Resolved] ${source} answered for ${request.customer}: ${answer}`);
  textBackCustomer(request.customer, answer);
}

// Handle timeout for unanswered requests
function handleTimeout(id) {
  const request = helpRequests.find(r => r.id === id);
  if (!request || request.status !== 'pending') return;

  request.status = 'unresolved';
  request.resolvedAt = Date.now();

  console.log(`[Timeout] Request from ${request.customer} timed out.`);
  textBackCustomer(request.customer, "Sorry, we couldn't resolve your request in time.");
}

// Simulated text-back system
function textBackCustomer(customer, message) {
  console.log(`[TextBack] To ${customer}: ${message}`);
}

// Scale-friendly request fetch
function getRequests({ status, limit = 20, offset = 0 }) {
  return helpRequests.filter(r => r.status === status).slice(offset, offset + limit);
}

// Example of modularization
export var Agent = {
  resolve: resolveHelpRequest,
  learn: (question, answer) => knowledgeBase.set(normalizeQuestion(question), answer),
  fetchAnswer: (question) => knowledgeBase.get(normalizeQuestion(question)),
};

export var RequestManager = {
  create: createHelpRequest,
  get: getRequests,
};

export var Messaging = {
  textBackCustomer,
};
// Simple admin panel UI and reliable backend architecture
const helpRequests = [];
const knowledgeBase = new Map();
let requestIdCounter = 1;

function createHelpRequest(customer, question) {
  try {
    const request = {
      id: requestIdCounter++,
      customer,
      question,
      status: 'pending',
      createdAt: Date.now(),
      resolvedAt: null,
      answer: '',
      source: null,
    };

    helpRequests.push(request);
    console.log(`[HelpRequest] ${customer} asked: "${question}"`);

    setTimeout(() => handleTimeout(request.id), 60000);
    return request;
  } catch (e) {
    console.error("[Error] Failed to create help request:", e);
  }
}

function normalizeQuestion(q) {
  return q.trim().toLowerCase();
}

function resolveHelpRequest(id, answer, source = 'supervisor') {
  const request = helpRequests.find(r => r.id === id);
  if (!request || request.status !== 'pending') {
    console.warn(`[Resolve] Invalid request or already resolved: ${id}`);
    return;
  }

  request.answer = answer;
  request.status = 'resolved';
  request.resolvedAt = Date.now();
  request.source = source;

  const norm = normalizeQuestion(request.question);
  knowledgeBase.set(norm, answer);

  console.log(`[Resolved] ${source} answered ${request.customer}: ${answer}`);
  textBackCustomer(request.customer, answer);
}

function handleTimeout(id) {
  const request = helpRequests.find(r => r.id === id);
  if (!request || request.status !== 'pending') return;

  request.status = 'unresolved';
  request.resolvedAt = Date.now();

  console.log(`[Timeout] No answer for ${request.customer}. Marked unresolved.`);
  textBackCustomer(request.customer, "Sorry, we couldn't resolve your request in time.");
}

function textBackCustomer(customer, message) {
  console.log(`[TextBack] Message to ${customer}: ${message}`);
}

function getRequests({ status, limit = 20, offset = 0 } = {}) {
  try {
    return helpRequests
      .filter(r => (status ? r.status === status : true))
      .slice(offset, offset + limit);
  } catch (e) {
    console.error("[Error] Fetching requests failed:", e);
    return [];
  }
}

export const Agent = {
  resolve: resolveHelpRequest,
  learn: (question, answer) => {
    try {
      knowledgeBase.set(normalizeQuestion(question), answer);
    } catch (e) {
      console.error("[Agent] Failed to learn answer:", e);
    }
  },
  fetchAnswer: (question) => knowledgeBase.get(normalizeQuestion(question)),
};

export const RequestManager = {
  create: createHelpRequest,
  get: getRequests,
};

export const Messaging = {
  textBackCustomer,
};

// Simple UI rendering (internal admin panel style)
document.addEventListener("DOMContentLoaded", () => {
  document.body.innerHTML = `
    <h1>Help Request Admin Panel</h1>
    <div>
      <input id="cust" placeholder="Customer Name" />
      <input id="q" placeholder="Question" />
      <button onclick="submitHelp()">Submit Help Request</button>
    </div>
    <div id="reqs"></div>
  `;
  renderUI();
});

function submitHelp() {
  const c = document.getElementById("cust").value.trim();
  const q = document.getElementById("q").value.trim();
  if (!c || !q) return alert("Customer and question required.");
  RequestManager.create(c, q);
  renderUI();
}

function resolveUI(id) {
  const answer = prompt("Enter your answer:");
  if (answer) Agent.resolve(id, answer);
  renderUI();
}

function renderUI() {
  const list = RequestManager.get();
  const div = document.getElementById("reqs");
  div.innerHTML = '<h2>Requests</h2>' +
    list.map(r => `
      <div style="margin-bottom:1em;padding:0.5em;border:1px solid #ccc">
        <b>${r.customer}</b>: ${r.question}<br/>
        Status: ${r.status}<br/>
        ${r.status === 'pending' ? `<button onclick="resolveUI(${r.id})">Resolve</button>` : ''}
      </div>`).join("");
}
