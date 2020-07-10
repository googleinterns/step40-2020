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

/**
 * Test the authentication for the Sheets service
 */
async function callSheets(sheetID) {
  const text = await getText('194EPwCpNnSLDDRQV19RJWVRa4Er3z3AKunQxZnt2nEI');
  // const text = await getText(sheetID);
  const response = await callPerspective(text, 'en');
}

// /**
//  * Test the authentication for the Sheets service
//  */
// async function callSheets(sheetID) {
//   const response = await fetch('/call-sheets', {
//       method: 'POST',
//       headers: {'Content-Type': 'application/json',},
//       body: JSON.stringify({id: sheetID})});
//   const out = await response.json();
//   console.log(out);
// }

/**
 * Call the perspective API
 */
async function callPerspective(text, lang) {
  const response = await fetch('/call_perspective', {
      method: 'POST',
      headers: {'Content-Type': 'application/json',},
      body: JSON.stringify({text: text, lang: lang})});
  const toxicityData = await response.json();
  displayPerspectiveOutput(toxicityData);
}

/**
 *  Display toxicity output on the webpage
 */
function displayPerspectiveOutput(toxicityData) {
  const outputElement = document.getElementById('perspective-output-container');
  if (!outputElement) {
    return;
  }
  outputElement.innerHTML = '';

  if (toxicityData.attributeScores) {
    for (let key in toxicityData.attributeScores) {
      if (toxicityData.attributeScores[key].summaryScore && 
          toxicityData.attributeScores[key].summaryScore.value) {
        attributeElement = createAnyElement('p', key + ": " + toxicityData.attributeScores[key].summaryScore.value);
        outputElement.appendChild(attributeElement);
      }
    }
  }
}

/**
 * Create a 'tag' element with 'text' as its inner HTML
 */
function createAnyElement(tag, text) {
  const textElement = document.createElement(tag);
  textElement.innerHTML = text;
  return textElement;
}

// Client ID and API key from the Developer Console
var CLIENT_ID = '829584540184-uhjij62s65igq2r5n29sevp1ehbu0u93.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDMRYIXlcVWOVh-TTvrpVl11KTIw14Mg3c';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

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

async function getText(spreadsheetId) {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A1:YY',
  });
  const range = await response.result;
  if (range.values.length > 0) {
    var text = '';
    for (i = 0; i < range.values.length; i++) {
      var row = range.values[i];
      for (j = 0; j < row.length; j++) {
        text = text + row[j] + '\n';
      }
    }
    return text;
  } else {
    return 'No data found.';
  }
}
