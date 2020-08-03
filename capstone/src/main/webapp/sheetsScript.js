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
const API_KEY = 'SHEETS_API_KEY'; // TODO: Create Java servlet to return key

// Array of API discovery doc URLs for APIs
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const API_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/** Collects the user's input and submits it for analysis */
async function gatherSheetsInput() {
  // Get the submitted id and language
  const idElement = document.getElementById('sheet-id');
  if (!idElement) {
    return;
  }
  let id = idElement.value;

  // Search for a URL in the format ".../d/DOC_ID/..."
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
  document.getElementById('general-analysis-container').innerHTML = '';
  const radios = document.getElementsByName('analysisRadios');
  let tokenizer;
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked && radios[i].value != 'NONE') {
      tokenizer = TokenizerEnum[radios[i].value];
      break;
    }
  }

  // Get the name and range of sheets to be analyzed
  const response = await getSheetNamesAndRange(id);
  const sheetNames = await response.sheetNames;
  const range = await response.range;

  // Show general output
  let totalText = '';
  for (const name of sheetNames) {
    const sheet = await getSpreadsheet(id, name, range);
    const text = await getTextFromSheet(sheet);
    totalText += text + '\n';
  }

  await handleInput(totalText, langElement.value, requestedAttributes, tokenizer);
  await handleSheetsInput(id, sheetNames, range, langElement, requestedAttributes);
}

/**
 * Output the user-requested attributes to a Google Sheet
 */
async function handleSheetsInput(id, sheetNames, range, langElement, requestedAttributes) {
  // Create spreadsheet if requested
  const userDecisionElement = document.getElementById('sheets-output-yes-no');
  if (userDecisionElement != null && userDecisionElement.value === 'yes') {
    let title = 'Perspective Output';
    const titleElement = document.getElementById('sheets-title');
    if (titleElement != null && titleElement.value != '') {
      title = titleElement.value;
    }

    const newSheetId = await createSheet(title);

    // Make the new spreadsheet mirror sheet names of the input
    await preprocessSheet(newSheetId, sheetNames);

    // Add data and color coding to the new Sheet
    for (let i = 0; i < sheetNames.length; i++) {
      const body = await createSheetOutput(id, sheetNames[i], range, langElement.value, requestedAttributes);
      await appendDataToSheet(newSheetId, sheetNames[i], body);
      const numRows = body.length;
      const numCols = body[0].length;
      const sheetId = await getSheetId(newSheetId, sheetNames[i]);
      await addFormatting(newSheetId, sheetId, numRows, numCols);
    }
  }
}

/**
 * Returns all name(s) and range(s) in the Google Sheet,
 * unless the user has specified a specific sheet and range
 */
async function getSheetNamesAndRange(id) {
  // Check if user has entered a custom range
  const userRangeElement = document.getElementById('sheets-range-yes-no');
  if (userRangeElement != null && userRangeElement.value === 'yes') {
    const rangeElement = document.getElementById('sheets-range');
    if (rangeElement != null) {
      // Check if this is a valid Sheets range
      const rangeRegEx = rangeElement.value.match(/(.+)(![\w]*[\d]*(:[\w]*[\d]*)?)/);
      if (rangeRegEx != null) {
        return { 'sheetNames': [rangeRegEx[1]], 'range': rangeRegEx[2] };
      } else {
        alert('Please input a range in a valid format.');
      }
    }
  }

  // Otherwise, get all sheets
  let sheetNames = await getSheetNames(id);
  return { 'sheetNames': sheetNames, 'range': '!A1:YY' };
}

/**
 * Returns the name(s) of every sheet in the Google Sheet with an id of id
 */
async function getSheetNames(id) {
  const response = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: id,
  });
  const sheets = await response.result.sheets;
  const sheetNames = [];
  for (const sheet of sheets) {
    sheetNames.push(sheet.properties.title);
  }
  return sheetNames;
}

/**
 * Returns the id of a sheet in the Google Sheet
 * with corresponding spreadsheet id and name
 * and returns 0 if not found
 */
async function getSheetId(id, name) {
  const response = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: id,
  });
  const sheets = await response.result.sheets;
  for (const sheet of sheets) {
    if (sheet.properties.title === name) {
      return sheet.properties.sheetId;
    }
  }
  return 0;
}

/**
 * Returns a user's spreadsheet with the id and name specified
 */
async function getSpreadsheet(id, name, range) {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: name + range,
  });
  return await response.result;
}

/**
 * Returns all text in a Google Sheet
 */
function getTextFromSheet(sheet) {
  if (sheet.values.length > 0) {
    let text = '';
    for (let i = 0; i < sheet.values.length; i++) {
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
 * Make the new spreadsheet contain the same sheet names
 * as the one being analyzed
 */
async function preprocessSheet(id, sheetNames) {
  let requests = [];
  let deleteSheet = true;

  for (const name of sheetNames) {
    if (name != 'Sheet1') {
      requests.push({ addSheet: { properties: { title: name }}});
    } else {
      deleteSheet = false;
    }
  }

  if (deleteSheet) {
    requests.push({ deleteSheet: { sheetId: 0 }});
  }

  if (requests.length > 0) {
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      resource: { requests }
    });
  }
}

/**
 * Return a JSON that contains row-by-row Perspective analysis for
 * every cell in a Google Sheet
 */
async function createSheetOutput(id, name, range, lang, requestedAttributes) {
  const sheet = await getSpreadsheet(id, name, range);

  if (sheet.values.length > 0) {
    // Create a key as the top row
    let body = [Array.from(requestedAttributes).sort()];
    body[0].unshift('Comment');

    // Create Perspective calls
    const promises = [];
    for (i = 0; i < sheet.values.length; i++) {
      let row = sheet.values[i];
      for (j = 0; j < row.length; j++) {
        if (row[j] != '') {
          promises.push(callPerspective(row[j], lang, requestedAttributes));
          body.push([row[j]]);
        }
      }
    }

    // Evaluate Perspective calls
    const resolvedResponses = await Promise.all(promises);
    for (index = 0; index < promises.length; index++) {
      if (resolvedResponses[index].attributeScores) {
        // Create a new row with the comment and Perspective scores
        for (const attribute of Object.entries(resolvedResponses[index].attributeScores).sort()) {
          body[index + 1].push(attribute[1].summaryScore.value);
        }
      } else {
        body[index + 1].push('Unable to retrieve a score');
      }
    }

    return body;
  }
  return 'No data found.';
}

/**
 * Append body to the Sheet with an id of id
 */
async function appendDataToSheet(id, name, body) {
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range: name + '!A1:YY',
    valueInputOption: 'USER_ENTERED',
    resource: { values: body }
  });
}

/**
 * Color code number values within the row and column range
 * in the Sheet with corresponding spreadsheetId and sheetId
 */
async function addFormatting(spreadsheetId, sheetId, numRows, numCols) {
  const myRange = {
    sheetId: sheetId,
    startRowIndex: 0,
    endRowIndex: numRows,
    startColumnIndex: 0,
    endColumnIndex: numCols,
  };
  let requests = [{
      addConditionalFormatRule: {
        rule: {
          ranges: [ myRange ],
          gradientRule: {
            minpoint: { color: { red: 0.965, green: 0.949, blue: 0.988, alpha: 1 }, type: 'NUMBER', value: '0' },
            midpoint: { color: { red: 0.878, green: 0.8, blue: 0.984, alpha: 1 }, type: 'PERCENTILE', value: '50' },
            maxpoint: { color: { red: 0.506, green: 0.2, blue: 0.933, alpha: 1 }, type: 'NUMBER', value: '1' }
          }
        },
        index: 0
      }}];

  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
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

/**
 * Display or hide the Sheets range input element
 */
function updateRangeElement() {
  const userDecisionElement = document.getElementById('sheets-range-yes-no');
  if (userDecisionElement == null) {
    return;
  } 
  
  const sheetsRangeElement = document.getElementById('sheets-range-input');
  if (sheetsRangeElement == null) {
    return;
  }

  if (userDecisionElement.value === 'no') {
    sheetsRangeElement.style.display = 'none';
  } else if (userDecisionElement.value === 'yes') {
    sheetsRangeElement.style.display = 'block';
  }
}
