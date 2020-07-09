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
  const response = await fetch('/call-sheets', {
      method: 'POST',
      headers: {'Content-Type': 'application/json',},
      body: JSON.stringify({id: sheetID})});
  const out = await response.json();
  console.log(out);
}

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
