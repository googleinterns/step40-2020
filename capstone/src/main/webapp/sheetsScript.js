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

// API key from the Developer Console
const API_KEY = 'AIzaSyDMRYIXlcVWOVh-TTvrpVl11KTIw14Mg3c'; // TODO: Create Java servlet to return key

// Array of API discovery doc URLs for APIs
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

/** Collects the user's input and submits it for analysis */
async function gatherSheetsInput() {
  // Get the submitted id and language
  const idElement = document.getElementById('sheet-id');
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

  const text = await getTextFromSheet(id);
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
 * Create a Google Sheet with toxicityData
 */
async function createSheet(toxicityData) {
  const userDecisionElement = document.getElementById('sheets-output-yes-no');
  if (userDecisionElement == null || userDecisionElement.value === 'no') {
    return;
  }

  let title = 'Perspective Output';
  const titleElement = document.getElementById('sheets-title');
  if (titleElement != null) {
    title = titleElement.value;
  }

  const response = await gapi.client.sheets.spreadsheets.create({
    properties: {
      title: title
    }
  });
  const id = await response.result.spreadsheetId;
  await appendDataToSheet(id, toxicityData);
}

/**
 * Append toxicityData to the Sheet with id spreadsheetId
 */
async function appendDataToSheet(spreadsheetId, toxicityData) {
  const body = { values: [] };
  for (const attribute of Object.entries(toxicityData.attributeScores)) {
    body.values.push([attribute[0], attribute[1].summaryScore.value]);
  }

  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A1:YY',
    valueInputOption: 'USER_ENTERED',
    resource: body
  });
}

function updateTitleElement() {
  const userDecisionElement = document.getElementById('sheets-output-yes-no');
  if (userDecisionElement == null) {
    return;
  } 
  
  const sheetsInputElement = document.getElementById('sheets-title-input');
  if (sheetsInputElement == null) {
    return;
  }

  if (userDecisionElement.value === 'no') {
    sheetsInputElement.style.display = 'none';
  } else if (userDecisionElement.value === 'yes') {
    sheetsInputElement.style.display = 'block';
  }
}
