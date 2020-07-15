// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Client ID and API key from the Developer Console
const CLIENT_ID = '829584540184-uhjij62s65igq2r5n29sevp1ehbu0u93.apps.googleusercontent.com';
const DOCS_API_KEY = 'AIzaSyD2womLpvJAC11BQJiLRMCBbP4pwy4bJu8'; // TODO: Create Java servlet to return key
const SHEETS_API_KEY = 'AIzaSyDMRYIXlcVWOVh-TTvrpVl11KTIw14Mg3c'; // TODO: Create Java servlet to return key

// Array of API discovery doc URLs for APIs
const DOCS_DISCOVERY_DOCS = ["https://docs.googleapis.com/$discovery/rest?version=v1"];
const SHEETS_DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/spreadsheets";

let authorizeButton = document.getElementById('authorize_button');
let signoutButton = document.getElementById('signout_button');
let submitButton = document.getElementById('submit_button');
let currentChoice = 'docs';

/**
  *  On load, called to load the auth2 library and API client library.
  */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
  *  Initializes the API client library and sets up sign-in state
  *  listeners.
  */
function initClient() {
  let apiKey = '';
  discoveryDocs = [];
  if (currentChoice === 'docs') {
    apiKey = DOCS_API_KEY;
    discoveryDocs = DOCS_DISCOVERY_DOCS;
  } else if (currentChoice === 'sheets') {
    apiKey = SHEETS_API_KEY;
    discoveryDocs = SHEETS_DISCOVERY_DOCS;
  }

  gapi.client.init({
    apiKey: apiKey,
    clientId: CLIENT_ID,
    discoveryDocs: discoveryDocs,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function(error) {
    console.log(JSON.stringify(error, null, 2));
  });
}

/**
  *  Called when the signed in status changes
  *  to update the UI appropriately.
  */
async function updateSigninStatus(isSignedIn) {
  authorizeButton = document.getElementById('authorize_button');
  signoutButton = document.getElementById('signout_button');
  submitButton = document.getElementById('submit_button');
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    submitButton.style.display = 'block';
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    submitButton.style.display = 'none';
  }
}

/**
  *  Sign in the user upon button click.
  */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
  *  Sign out the user upon button click.
  */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

function updateChoice() {
  const choiceElement = document.getElementById('medium-of-input');
  if (choiceElement == null) {
    return;
  }
  currentChoice = choiceElement.value;
  handleClientLoad();
}

/** Collects the user's input and submits it for analysis */
async function gatherGSuiteInput() {
  // Get the submitted id and language
  const idElement = document.getElementById('google-id');
  if (!idElement) {
    return;
  }
  let id = idElement.value;
  const search = idElement.value.match(/\/d\/([\w-]+)/);
  if (search != null) {
    id = search[1]; // Shorten full URL to just the ID
  }

  const langElement = document.getElementById('languageForAnalysis');
  if (!langElement) {
    return;
  }

  // Get the selected attributes
  const attributes = document.getElementById("available-attributes").getElementsByTagName('input');
  const requestedAttributes = [];
  for (const attribute of attributes) {
    if (attribute.checked) {
      requestedAttributes.push(attribute.value);
    }	
  }

  // Get the selected analysis type
  document.getElementById('analysis-container').innerHTML = '';
  const radios = document.getElementsByName('analysisRadios');
  let delimiter = "";
  for (i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      delimiter = radios[i].value;
      break;
    }
  }

  let text = '';
  if (currentChoice === 'docs') {
    text = await getTextFromDoc(id);
  } else if (currentChoice === 'sheets') {
    text = await getTextFromSheet(id);
  }

  handleInput(text, langElement.value, requestedAttributes, delimiter);
}

/**
 * Returns all text in a Google Sheet with an id of spreadsheetId
 */
async function getTextFromSheet(spreadsheetId) {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A1:YY',
  });
  const range = await response.result;
  if (range.values.length > 0) {
    let text = '';
    for (i = 0; i < range.values.length; i++) {
      let row = range.values[i];
      for (j = 0; j < row.length; j++) {
        text = text + row[j] + '\n';
      }
    }
    return text;
  } else {
    return 'No data found.';
  }
}

/**
 * Returns all text in a Google Doc with an id of documentId
 */
async function getTextFromDoc(documentId) {
  const response = await gapi.client.docs.documents.get({
    documentId: documentId
  });
  const content = await response.result.body.content;
  return readStructrualElements(content);
}


/** 
  * Recurses through a list of Structural Elements to read a document's text where text may be in
  * nested elements.
  */
function readStructrualElements(elements) {
  let stringOutput = '';
  for (const element of elements) {
    if (element.paragraph != null) {
      for (const paragraphElement of element.paragraph.elements) {
        stringOutput = stringOutput + readParagraphElement(paragraphElement);
      }
    } else if (element.table != null) {
      for (const row of element.table.tableRows) {
        for (const cell of row.tableCells) {
          stringOutput = stringOutput + readStructrualElements(cell.content);
        }
      }
    } else if (element.tableOfContents != null) {
      stringOutput = stringOutput + readStructrualElements(element.tableOfContents.content);
    }
  }
  return stringOutput;
}

/** 
  * Reads a document's paragraph element and returns its text
  */
function readParagraphElement(paragraphElement) {
  const run = paragraphElement.textRun;
  if (run == null || run.content == null) {
    // The TextRun can be null if there is an inline object.
    return "";
  }
  return run.content;
}

async function createSheet(title, data) {
  const oldChoice = currentChoice;
  currentChoice = 'sheets';
  handleClientLoad();
  const response = await gapi.client.sheets.spreadsheets.create({
    properties: {
      title: title
    }
  });
  const id = await response.result.spreadsheetId;
  appendDataToSheet(id, data);
  currentChoice = oldChoice;
  handleClientLoad();
}

async function appendDataToSheet(spreadsheetId, data) {
  const body = {
    values: data
  };
  const response = await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A1:YY',
    valueInputOption: 'USER_ENTERED',
    resource: body
  });
  const result = await response.result;
}
