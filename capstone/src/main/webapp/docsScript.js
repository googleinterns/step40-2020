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

/** Collects the user's input and submits it for analysis */
async function gatherDocsInput() {
  // Get the submitted text and language
  const idElement = document.getElementById('doc-id');
  if (!idElement) {
    return;
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

  const text = await getTextFromDoc(idElement.value);
  handleInput(text, langElement.value, requestedAttributes, delimiter);
}

// Client ID and API key from the Developer Console
const CLIENT_ID = 'CLIENT_ID';
const API_KEY = 'API_KEY'; // TODO: Create Java servlet to return key

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://docs.googleapis.com/$discovery/rest?version=v1"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/documents.readonly";

let authorizeButton = document.getElementById('authorize_button');
let signoutButton = document.getElementById('signout_button');
let submitButton = document.getElementById('submit_button');

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
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
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
  *  Called when the signed in status changes, to update the UI
  *  appropriately. After a sign-in, the API is called.
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

function readParagraphElement(paragraphElement) {
  const run = paragraphElement.textRun;
  if (run == null || run.content == null) {
    // The TextRun can be null if there is an inline object.
    return "";
  }
  return run.content;
}
