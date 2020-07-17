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
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

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
  const attributes = document.getElementById('available-attributes').getElementsByTagName('input');
  const requestedAttributes = [];
  for (const attribute of attributes) {
    if (attribute.checked) {
      requestedAttributes.push(attribute.value);
    }	
  }

  // Get the selected analysis type
  document.getElementById('analysis-container').innerHTML = '';
  const radios = document.getElementsByName('analysisRadios');
  let delimiter = '';
  for (i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      delimiter = radios[i].value;
      break;
    }
  }

  // Show general output
  const sheet = await getSpreadsheet(id);
  const text = await getTextFromSheet(sheet);
  handleInput(text, langElement.value, requestedAttributes, delimiter);

  // Create spreadsheet if requested
  const userDecisionElement = document.getElementById('sheets-output-yes-no');
  if (userDecisionElement != null && userDecisionElement.value === 'yes') {
    let title = 'Perspective Output';
    const titleElement = document.getElementById('sheets-title');
    if (titleElement != null && titleElement.value != '') {
      title = titleElement.value;
    }

    const newSheetId = await createSheet(title);
    const body = await createSheetOutput(id, langElement.value, requestedAttributes);
    await appendDataToSheet(newSheetId, body);
    const numRows = body.length;
    const numCols = body[0].length;
    await addFormatting(newSheetId, numRows, numCols);
  }
}

/**
 * Returns a user's spreadsheet with an id of id
 */
async function getSpreadsheet(id) {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: 'Sheet1!A1:YY',
  });
  return await response.result;
}

/**
 * Returns all text in a Google Sheet
 */
function getTextFromSheet(sheet) {
  if (sheet.values.length > 0) {
    let text = '';
    for (i = 0; i < sheet.values.length; i++) {
      let row = sheet.values[i];
      for (j = 0; j < row.length; j++) {
        text = text + row[j] + '\n';
      }
    }
    return text;
  }
  return 'No data found.';
}

/**
 * Create a Google Sheet with a title of title and return its id
 */
async function createSheet(title) {
  const response = await gapi.client.sheets.spreadsheets.create({
    properties: {
      title: title
    }
  });
  return await response.result.spreadsheetId;
}

/**
 * Return a JSON that contains row-by-row Perspective analysis for
 * every cell in a Google Sheet
 */
async function createSheetOutput(id, lang, requestedAttributes) {
  const sheet = await getSpreadsheet(id);

  if (sheet.values.length > 0) {
    // Create a key as the top row
    let body = [Array.from(requestedAttributes).sort()];
    body[0].unshift('Comment');

    let index = 0; // Track where we are as we add rows to body
    for (i = 0; i < sheet.values.length; i++) {
      let row = sheet.values[i];
      for (j = 0; j < row.length; j++) {
        const toxicityData = await callPerspective(row[j], lang, requestedAttributes);
        // Create a new row with the comment and Perspective scores
        if (toxicityData.attributeScores) {
          body.push([row[j]]);
          index++;
          for (const attribute of Object.entries(toxicityData.attributeScores).sort()) {
            body[index].push(attribute[1].summaryScore.value);
          }
        }
      }
    }
    return body;
  }
  return 'No data found.';
}

/**
 * Append body to the Sheet with an id of id
 */
async function appendDataToSheet(id, body) {
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range: 'Sheet1!A1:YY',
    valueInputOption: 'USER_ENTERED',
    resource: { values: body }
  });
}

/**
 * Color code number values within the row and column range
 * in the Sheet with an id of id
 */
async function addFormatting(id, numRows, numCols) {
  const myRange = {
    sheetId: 0,
    startRowIndex: 1,
    endRowIndex: numRows,
    startColumnIndex: 1,
    endColumnIndex: numCols,
  };
  var requests = [{
      addConditionalFormatRule: {
        rule: {
          ranges: [ myRange ],
          gradientRule: {
            minpoint: { color: { red: 0.345, green: 0.733, blue: 0.541, alpha: 1 }, type: 'NUMBER', value: '0' },
            midpoint: { color: { red: 1, green: 0.839, blue: 0.4, alpha: 1 }, type: 'PERCENTILE', value: '50' },
            maxpoint: { color: { red: 0.902, green: 0.486, blue: 0.451, alpha: 1}, type: 'NUMBER', value: '1' }
          }
        },
        index: 0
      }}];

  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: id,
    resource: { requests }
  });
}

/**
 * Display or hide the Sheets title input element
 */
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
